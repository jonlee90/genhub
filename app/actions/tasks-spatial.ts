"use server";

import { revalidatePath } from "next/cache";
import { getUserContext } from "@/lib/auth-context";
import { verifyProjectAccess, verifyTaskAccess } from "@/lib/tasks-utils";
import { logTaskActivity } from "./tasks-activity";
import { z } from "zod";

// ============================================
// Validation Schemas
// ============================================

const linkTaskToMarkerSchema = z.object({
  taskId: z.string().uuid(),
  markerId: z.string().uuid(),
});

const getTasksByMarkerSchema = z.object({
  markerId: z.string().uuid(),
});

const logTaskCompletionToMarkerSchema = z.object({
  taskId: z.string().uuid(),
});

// ============================================
// P4.2 - SPATIAL MARKER INTEGRATION
// ============================================

/**
 * Link a task to a spatial marker
 * @param taskId - Task UUID
 * @param markerId - Spatial marker UUID
 */
export async function linkTaskToMarker(input: unknown) {
  const validation = linkTaskToMarkerSchema.safeParse(input);
  if (!validation.success) {
    console.error("[linkTaskToMarker] Validation failed:", validation.error);
    return { error: "Invalid input: taskId and markerId must be valid UUIDs" };
  }

  const { taskId, markerId } = validation.data;

  console.log(
    "[linkTaskToMarker] Linking task:",
    taskId,
    "to marker:",
    markerId,
  );

  const userContext = await getUserContext();
  if ("error" in userContext) {
    return { error: userContext.error };
  }

  const { userId, companyId, supabase } = userContext;

  // Verify task access
  const taskCheck = await verifyTaskAccess(supabase, taskId, companyId);
  if ("error" in taskCheck) {
    return { error: taskCheck.error };
  }

  const { task, projectId } = taskCheck;

  // Verify marker exists and belongs to same project
  const { data: marker, error: markerError } = await supabase
    .from("spatial_markers")
    .select("id, project_id")
    .eq("id", markerId)
    .single();

  if (markerError || !marker) {
    return { error: "Spatial marker not found" };
  }

  if (marker.project_id !== task.project_id) {
    return { error: "Task and marker must belong to the same project" };
  }

  // Update task with spatial_marker_id
  const { data: updatedTask, error: updateError } = await supabase
    .from("tasks")
    .update({ spatial_marker_id: markerId })
    .eq("id", taskId)
    .select()
    .single();

  if (updateError) {
    console.error("[linkTaskToMarker] Error:", updateError);
    return { error: "Failed to link task to marker" };
  }

  // Log activity
  await logTaskActivity(
    supabase,
    taskId,
    userId,
    "updated",
    null,
    `Linked to spatial marker: ${markerId}`,
  );

  // Revalidate paths
  revalidatePath("/app/tasks");
  revalidatePath(`/app/tasks/${taskId}`);
  revalidatePath(`/app/projects/${projectId}`);
  revalidatePath(`/app/projects/${projectId}/spatial`);

  console.log("[linkTaskToMarker] Task linked successfully");
  return { success: true, task: updatedTask };
}

/**
 * Get all tasks linked to a spatial marker
 * @param markerId - Spatial marker UUID
 */
export async function getTasksByMarker(input: unknown) {
  const validation = getTasksByMarkerSchema.safeParse(input);
  if (!validation.success) {
    console.error("[getTasksByMarker] Validation failed:", validation.error);
    return { error: "Invalid marker ID" };
  }

  const { markerId } = validation.data;

  console.log("[getTasksByMarker] Fetching tasks for marker:", markerId);

  const userContext = await getUserContext();
  if ("error" in userContext) {
    return { error: userContext.error };
  }

  const { companyId, supabase } = userContext;

  // Verify marker access by checking project access
  const { data: marker, error: markerError } = await supabase
    .from("spatial_markers")
    .select("id, project_id")
    .eq("id", markerId)
    .single();

  if (markerError || !marker) {
    return { error: "Spatial marker not found" };
  }

  // Verify project access
  const projectCheck = await verifyProjectAccess(
    supabase,
    marker.project_id,
    companyId,
  );
  if ("error" in projectCheck) {
    return { error: projectCheck.error };
  }

  // Fetch tasks linked to this marker
  const { data: tasks, error } = await supabase
    .from("tasks")
    .select(
      `
      *,
      assignee:user_profiles (
        id,
        name,
        email,
        avatar_url
      ),
      phase:project_phases (
        id,
        name,
        status
      )
    `,
    )
    .eq("spatial_marker_id", markerId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[getTasksByMarker] Error:", error);
    return { error: "Failed to fetch tasks" };
  }

  console.log("[getTasksByMarker] Found", tasks?.length || 0, "tasks");
  return { success: true, tasks: tasks || [] };
}

/**
 * Activity logger for task status changes that creates marker activity content
 * This is called automatically when task status changes to 'completed'
 */
export async function logTaskCompletionToMarker(input: unknown) {
  const validation = logTaskCompletionToMarkerSchema.safeParse(input);
  if (!validation.success) {
    console.error(
      "[logTaskCompletionToMarker] Validation failed:",
      validation.error
    );
    return { error: "Invalid task ID" };
  }

  const { taskId } = validation.data;

  console.log(
    "[logTaskCompletionToMarker] Logging task completion for:",
    taskId,
  );

  const userContext = await getUserContext();
  if ("error" in userContext) {
    return { error: userContext.error };
  }

  const { userId, supabase } = userContext;

  // Get task with marker info
  const { data: task, error: taskError } = await supabase
    .from("tasks")
    .select("id, title, spatial_marker_id, project_id, completed_at")
    .eq("id", taskId)
    .single();

  if (taskError || !task) {
    return { error: "Task not found" };
  }

  // Only proceed if task has a linked marker
  if (!task.spatial_marker_id) {
    return { success: true, message: "Task has no linked spatial marker" };
  }

  // Create activity content on the marker
  const { error: contentError } = await supabase.from("marker_content").insert({
    marker_id: task.spatial_marker_id,
    type: "activity",
    activity_type: "task_completed",
    activity_data: {
      task_id: task.id,
      task_title: task.title,
      completed_by: userId,
      completed_at: task.completed_at || new Date().toISOString(),
    },
    created_by: userId,
  });

  if (contentError) {
    console.error(
      "[logTaskCompletionToMarker] Error creating activity:",
      contentError,
    );
    return { error: "Failed to log activity to marker" };
  }

  // Revalidate spatial view
  revalidatePath(`/app/projects/${task.project_id}/spatial`);

  console.log("[logTaskCompletionToMarker] Activity logged successfully");
  return { success: true };
}
