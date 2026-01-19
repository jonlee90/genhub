"use server";

import { revalidatePath } from "next/cache";
import { after } from "next/server";
import { z } from "zod";
import { getUserContext } from "@/lib/auth-context";
import { verifyTaskAccess } from "@/lib/tasks-utils";
import { logTaskActivity } from "./tasks-activity";
import { logTaskCompletionToMarker } from "./tasks-spatial";
import type { TaskStatus } from "@/types/db/enums";
import type { TasksUpdate } from "@/types/db/tables/tasks";

// ============================================
// Types
// ============================================

type TaskUpdate = TasksUpdate;

// ============================================
// Validation Schemas
// ============================================

const updateTaskStatusSchema = z.object({
  id: z.string().uuid("Invalid task ID"),
  status: z.enum(["todo", "in_progress", "review", "blocked", "completed"]),
  blocked_reason: z.string().optional().nullable(),
});

// ============================================
// Server Actions
// ============================================

/**
 * Update a task's status
 * Requires blocked_reason when status is 'blocked'
 */
export async function updateTaskStatus(
  taskId: string,
  status: TaskStatus,
  blockedReason?: string,
) {
  // Get user context
  const userContext = await getUserContext();
  if ("error" in userContext) {
    return { error: userContext.error };
  }

  const { userId, companyId, role, supabase } = userContext;

  // Validate input
  const validation = updateTaskStatusSchema.safeParse({
    id: taskId,
    status,
    blocked_reason: blockedReason,
  });
  if (!validation.success) {
    return { error: "Invalid input" };
  }

  // Require blocked reason when status is blocked
  if (status === "blocked" && !blockedReason) {
    return { error: "Blocked reason is required when status is blocked" };
  }

  // Verify task access
  const taskCheck = await verifyTaskAccess(supabase, taskId, companyId);
  if ("error" in taskCheck) {
    return { error: taskCheck.error };
  }

  const { task: existingTask, projectId } = taskCheck;

  // Prepare update
  const taskUpdate: TaskUpdate = {
    status,
    blocked_reason: status === "blocked" ? blockedReason : null,
  };

  // Set completed_at when completing (trigger will also handle this)
  if (status === "completed" && existingTask.status !== "completed") {
    taskUpdate.completed_at = new Date().toISOString();
  }

  // Update task
  const { data: task, error: updateError } = await supabase
    .from("tasks")
    .update(taskUpdate)
    .eq("id", taskId)
    .select()
    .single();

  if (updateError) {
    after(() => {
      console.error("Error updating task status:", updateError);
    });
    return { error: "Failed to update task status. Please try again." };
  }

  // Log activity
  await logTaskActivity(
    supabase,
    taskId,
    userId,
    "status_changed",
    existingTask.status,
    status,
    status === "blocked" ? blockedReason : null,
  );

  // P4.2: Log task completion to linked spatial marker
  if (status === "completed" && existingTask.status !== "completed") {
    await logTaskCompletionToMarker(taskId);
  }

  // Notify PM when task is blocked
  if (status === "blocked" && (role === "foreman" || role === "field_worker")) {
    // Find project managers for this project
    const { data: managers } = await supabase
      .from("project_team")
      .select("user_id")
      .eq("project_id", projectId)
      .eq("role", "project_manager");

    // CRITICAL OPTIMIZATION (CRIT-003): Batch notification inserts
    // Estimated savings: N × 50ms → 50ms (200-500ms for 10 notifications)
    if (managers && managers.length > 0) {
      const managerNotifications = managers
        .filter((manager) => manager.user_id)
        .map((manager) => ({
          user_id: manager.user_id!,
          type: "task_blocked" as const,
          title: "Task Blocked",
          message: `Task "${task.title}" is blocked: ${blockedReason}`,
          link: `/app/tasks/${taskId}`,
        }));

      if (managerNotifications.length > 0) {
        const { error: notificationError } = await supabase
          .from("notifications")
          .insert(managerNotifications);

        if (notificationError) {
          after(() => {
            console.error(
              "[updateTaskStatus] Error sending manager notifications:",
              notificationError,
            );
          });
        }
      }
    }
  }

  // Revalidate paths
  revalidatePath("/app/tasks");
  revalidatePath(`/app/tasks/${taskId}`);
  revalidatePath(`/app/projects/${projectId}`);

  return { success: true, task };
}
