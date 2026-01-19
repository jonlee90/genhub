"use server";

import { revalidatePath } from "next/cache";
import { after } from "next/server";
import { z } from "zod";
import { getUserContext } from "@/lib/auth-context";
import { verifyTaskAccess } from "@/lib/tasks-utils";
import type { ActivityAction } from "@/types/db/enums";
import type { createClient } from "@/utils/supabase/server";

// ============================================
// Types
// ============================================

interface ActivityUserJoin {
  name: string;
}

// ============================================
// Validation Schemas
// ============================================

const addCommentSchema = z.object({
  task_id: z.string().uuid("Invalid task ID"),
  comment: z.string().min(1, "Comment is required").max(5000),
});

// ============================================
// Helper Functions
// ============================================

/**
 * Log activity for a task
 * @param supabase - Supabase client
 * @param taskId - Task UUID
 * @param userId - User UUID performing the action
 * @param action - Type of activity action
 * @param oldValue - Previous value (for updates)
 * @param newValue - New value (for updates)
 * @param comment - Optional comment
 */
export async function logTaskActivity(
  supabase: Awaited<ReturnType<typeof createClient>>,
  taskId: string,
  userId: string,
  action: ActivityAction,
  oldValue?: string | null,
  newValue?: string | null,
  comment?: string | null,
) {
  await supabase.from("task_activity").insert({
    task_id: taskId,
    user_id: userId,
    action,
    old_value: oldValue || null,
    new_value: newValue || null,
    comment: comment || null,
  });
}

// ============================================
// Server Actions
// ============================================

/**
 * Get chronological activity log for a task (Phase 4)
 * Fetches activity from task_activity table with user details
 * @param taskId - Task UUID
 * @returns Array of activity logs or error
 */
export async function getTaskActivity(taskId: string): Promise<{
  data?: Array<{
    id: string;
    action: ActivityAction;
    user_name: string;
    timestamp: string;
    old_value?: string;
    new_value?: string;
    comment?: string;
  }>;
  error?: string;
}> {
  console.log("[getTaskActivity] Fetching activity for task:", taskId);

  // Get user context
  const userContext = await getUserContext();
  if ("error" in userContext) {
    return { error: userContext.error };
  }

  const { companyId, supabase } = userContext;

  // Verify task access
  const taskCheck = await verifyTaskAccess(supabase, taskId, companyId);
  if ("error" in taskCheck) {
    return { error: taskCheck.error };
  }

  // Fetch activity log with user details
  const { data: activities, error: activityError } = await supabase
    .from("task_activity")
    .select(
      `
      id,
      old_value,
      new_value,
      comment,
      created_at,
      user:user_profiles!task_activity_user_id_fkey (
        name
      )
    `,
    )
    .eq("task_id", taskId)
    .order("created_at", { ascending: false });

  if (activityError) {
    console.error("[getTaskActivity] Error fetching activity:", activityError);
    return { error: "Failed to fetch activity log" };
  }

  // Transform data - infer action from old_value/new_value/comment changes
  const activityLog = (activities || []).map((activity) => ({
    id: activity.id,
    action: (activity.comment
      ? "comment"
      : activity.old_value
        ? "updated"
        : "created") as ActivityAction,
    user_name:
      (activity.user as unknown as ActivityUserJoin | null)?.name ||
      "Unknown User",
    timestamp: activity.created_at,
    old_value: activity.old_value || undefined,
    new_value: activity.new_value || undefined,
    comment: activity.comment || undefined,
  }));

  console.log("[getTaskActivity] Activity log fetched successfully", {
    taskId,
    activityCount: activityLog.length,
  });

  return { data: activityLog };
}

/**
 * Add a comment to a task
 */
export async function addTaskComment(taskId: string, comment: string) {
  // Get user context
  const userContext = await getUserContext();
  if ("error" in userContext) {
    return { error: userContext.error };
  }

  const { userId, companyId, supabase } = userContext;

  // Validate input
  const validation = addCommentSchema.safeParse({ task_id: taskId, comment });
  if (!validation.success) {
    return { error: "Invalid input" };
  }

  // Verify task access
  const taskCheck = await verifyTaskAccess(supabase, taskId, companyId);
  if ("error" in taskCheck) {
    return { error: taskCheck.error };
  }

  // Log comment
  const { data: activity, error: insertError } = await supabase
    .from("task_activity")
    .insert({
      task_id: taskId,
      user_id: userId,
      action: "commented",
      comment,
    })
    .select()
    .single();

  if (insertError) {
    after(() => {
      console.error("Error adding comment:", insertError);
    });
    return { error: "Failed to add comment. Please try again." };
  }

  // Notify task participants (creator and assignee)
  const { task } = taskCheck;
  const notifyUsers = new Set<string>();

  if (task.created_by && task.created_by !== userId) {
    notifyUsers.add(task.created_by);
  }
  if (task.assignee_id && task.assignee_id !== userId) {
    notifyUsers.add(task.assignee_id);
  }

  // CRITICAL OPTIMIZATION (CRIT-003): Batch notification inserts
  // Estimated savings: N × 50ms → 50ms (200-500ms for 10 notifications)
  if (notifyUsers.size > 0) {
    const userNotifications = Array.from(notifyUsers).map((notifyUserId) => ({
      user_id: notifyUserId,
      type: "mention" as const,
      title: "New Comment",
      message: `New comment on task: ${task.title}`,
      link: `/app/tasks/${taskId}`,
    }));

    const { error: notificationError } = await supabase
      .from("notifications")
      .insert(userNotifications);

    if (notificationError) {
      after(() => {
        console.error(
          "[addTaskComment] Error sending notifications:",
          notificationError,
        );
      });
    }
  }

  // Revalidate paths
  revalidatePath("/app/tasks");
  revalidatePath(`/app/tasks/${taskId}`);

  return { success: true, activity };
}
