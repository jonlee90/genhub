"use server";

import { revalidatePath } from "next/cache";
import { after } from "next/server";
import { z } from "zod";
import { getUserContext } from "@/lib/auth-context";
import { verifyTaskAccess } from "@/lib/tasks-utils";
import { logTaskActivity } from "./tasks-activity";

// ============================================
// Validation Schemas
// ============================================

const taskDependencySchema = z.object({
  task_id: z.string().uuid("Invalid task ID"),
  depends_on_task_id: z.string().uuid("Invalid dependency task ID"),
});

// ============================================
// Server Actions
// ============================================

/**
 * Add a task dependency
 */
export async function addTaskDependency(
  taskId: string,
  dependsOnTaskId: string,
) {
  // Get user context
  const userContext = await getUserContext();
  if ("error" in userContext) {
    return { error: userContext.error };
  }

  const { userId, companyId, supabase } = userContext;

  // Validate input
  const validation = taskDependencySchema.safeParse({
    task_id: taskId,
    depends_on_task_id: dependsOnTaskId,
  });
  if (!validation.success) {
    return { error: "Invalid input" };
  }

  // Prevent self-dependencies
  if (taskId === dependsOnTaskId) {
    return { error: "A task cannot depend on itself" };
  }

  // Verify both tasks exist and are in same project
  const taskCheck = await verifyTaskAccess(supabase, taskId, companyId);
  if ("error" in taskCheck) {
    return { error: taskCheck.error };
  }

  const dependsCheck = await verifyTaskAccess(
    supabase,
    dependsOnTaskId,
    companyId,
  );
  if ("error" in dependsCheck) {
    return { error: "Dependency task not found" };
  }

  if (taskCheck.projectId !== dependsCheck.projectId) {
    return { error: "Tasks must be in the same project" };
  }

  // Check for circular dependencies
  const { data: existingDeps } = await supabase
    .from("task_dependencies")
    .select("*")
    .eq("task_id", dependsOnTaskId)
    .eq("depends_on_task_id", taskId);

  if (existingDeps && existingDeps.length > 0) {
    return { error: "This would create a circular dependency" };
  }

  // Create dependency
  const { error: insertError } = await supabase
    .from("task_dependencies")
    .insert({
      task_id: taskId,
      depends_on_task_id: dependsOnTaskId,
      created_by: userId,
    });

  if (insertError) {
    if (insertError.code === "23505") {
      return { error: "This dependency already exists" };
    }
    after(() => {
      console.error("Error adding dependency:", insertError);
    });
    return { error: "Failed to add dependency. Please try again." };
  }

  // Log activity
  await logTaskActivity(
    supabase,
    taskId,
    userId,
    "updated",
    null,
    `Added dependency: ${dependsCheck.task.title}`,
  );

  // Auto-block task if dependency is not completed
  if (
    dependsCheck.task.status !== "completed" &&
    taskCheck.task.status === "todo"
  ) {
    await supabase
      .from("tasks")
      .update({
        status: "blocked",
        blocked_reason: `Waiting for: ${dependsCheck.task.title}`,
      })
      .eq("id", taskId);
  }

  // Revalidate paths
  revalidatePath("/app/tasks");
  revalidatePath(`/app/tasks/${taskId}`);
  revalidatePath(`/app/projects/${taskCheck.projectId}`);

  return { success: true };
}

/**
 * Remove a task dependency
 */
export async function removeTaskDependency(
  taskId: string,
  dependsOnTaskId: string,
) {
  // Get user context
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

  // Get dependency info for logging
  const { data: depTask } = await supabase
    .from("tasks")
    .select("title")
    .eq("id", dependsOnTaskId)
    .single();

  // Remove dependency
  const { error: deleteError } = await supabase
    .from("task_dependencies")
    .delete()
    .eq("task_id", taskId)
    .eq("depends_on_task_id", dependsOnTaskId);

  if (deleteError) {
    after(() => {
      console.error("Error removing dependency:", deleteError);
    });
    return { error: "Failed to remove dependency. Please try again." };
  }

  // Log activity
  await logTaskActivity(
    supabase,
    taskId,
    userId,
    "updated",
    `Dependency: ${depTask?.title || dependsOnTaskId}`,
    null,
  );

  // Revalidate paths
  revalidatePath("/app/tasks");
  revalidatePath(`/app/tasks/${taskId}`);
  revalidatePath(`/app/projects/${taskCheck.projectId}`);

  return { success: true };
}

/**
 * Fetch task dependencies for a set of tasks
 */
export async function getTaskDependencies(taskIds: string[]) {
  const userContext = await getUserContext();
  if ("error" in userContext) {
    return { error: userContext.error, dependencies: [] };
  }

  const { supabase } = userContext;

  const { data: dependencies, error } = await supabase
    .from("task_dependencies")
    .select("*")
    .or(
      `task_id.in.(${taskIds.join(",")}),depends_on_task_id.in.(${taskIds.join(",")})`,
    );

  if (error) {
    console.error("Error fetching dependencies:", error);
    return { error: "Failed to load dependencies", dependencies: [] };
  }

  return { success: true, dependencies: dependencies || [] };
}
