"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getUserContext } from "@/lib/auth-context";
import { verifyProjectAccess, verifyTaskAccess } from "@/lib/tasks-utils";
import type { TaskPriority, TaskStatus } from "@/types/db/enums";

// ============================================
// Types
// ============================================

// Types for Supabase joined data (PostgREST returns objects for FK joins)
interface TaskAssigneeJoin {
  id: string;
  name: string;
  avatar_url: string | null;
}

interface TaskPhaseJoin {
  id: string;
  name: string;
}

// ============================================
// Validation Schemas
// ============================================

const updateTaskDatesSchema = z.object({
  taskId: z.string().uuid("Invalid task ID"),
  startDate: z.string(),
  dueDate: z.string(),
});

// ============================================
// Server Actions - Data Fetching
// ============================================

/**
 * Get tasks for a project (with filters)
 */
export async function getProjectTasks(
  projectId: string,
  filters?: {
    phase_id?: string;
    status?: TaskStatus;
    assignee_id?: string;
    priority?: TaskPriority;
  },
) {
  // Get user context
  const userContext = await getUserContext();
  if ("error" in userContext) {
    return { error: userContext.error };
  }

  const { companyId, supabase } = userContext;

  // Verify project access
  const projectCheck = await verifyProjectAccess(
    supabase,
    projectId,
    companyId,
  );
  if ("error" in projectCheck) {
    return { error: projectCheck.error };
  }

  // Build query - explicit field selection for performance (API-TASK-002)
  let query = supabase
    .from("tasks")
    .select(
      `
      id,
      title,
      description,
      status,
      priority,
      task_type,
      due_date,
      start_date,
      phase_id,
      assignee_id,
      project_id,
      spatial_marker_id,
      blocked_reason,
      completed_at,
      created_at,
      updated_at,
      assignee:user_profiles (
        id,
        name,
        email,
        avatar_url
      ),
      assignees:task_assignees (
        id,
        user_id,
        subcontractor_id,
        user:user_profiles (
          id,
          name,
          email,
          avatar_url
        ),
        subcontractor:subcontractors (
          id,
          company_name,
          contact_name,
          email
        )
      ),
      phase:project_phases (
        id,
        name,
        status
      )
    `,
    )
    .eq("project_id", projectId)
    .order("created_at", { ascending: false });

  // Apply filters
  if (filters?.phase_id) {
    query = query.eq("phase_id", filters.phase_id);
  }
  if (filters?.status) {
    query = query.eq("status", filters.status);
  }
  if (filters?.assignee_id) {
    query = query.eq("assignee_id", filters.assignee_id);
  }
  if (filters?.priority) {
    query = query.eq("priority", filters.priority);
  }

  // Add pagination - initial load 50 tasks (API-TASK-003)
  // TODO: Add pagination parameters to function signature for cursor-based pagination
  query = query.range(0, 49);

  const { data: tasks, error } = await query;

  if (error) {
    console.error("Error fetching tasks:", error);
    return { error: "Failed to load tasks" };
  }

  return { success: true, tasks };
}

/**
 * Update a task's due date (for Gantt chart drag-and-drop)
 * @deprecated Use updateTaskDates instead to update both start_date and due_date
 */
export async function updateTaskDueDate(taskId: string, newDueDate: string) {
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

  const { task: existingTask, projectId } = taskCheck;

  // Update task
  const { data: task, error: updateError } = await supabase
    .from("tasks")
    .update({ due_date: newDueDate })
    .eq("id", taskId)
    .select()
    .single();

  if (updateError) {
    console.error("Error updating task due date:", updateError);
    return { error: "Failed to update task date" };
  }

  // Log activity (import dynamically to avoid circular deps)
  const { logTaskActivity } = await import("./tasks-activity");
  await logTaskActivity(
    supabase,
    taskId,
    userId,
    "updated",
    `due_date: ${existingTask.due_date || "none"}`,
    `due_date: ${newDueDate}`,
  );

  // Revalidate paths
  revalidatePath("/app/tasks");
  revalidatePath(`/app/projects/${projectId}`);

  return { success: true, task };
}

/**
 * Update a task's start and due dates (for Gantt chart drag-and-drop)
 */
export async function updateTaskDates(
  taskId: string,
  newStartDate: string,
  newDueDate: string,
) {
  const userContext = await getUserContext();
  if ("error" in userContext) {
    return { error: userContext.error };
  }

  const { userId, companyId, supabase } = userContext;

  // Validate input
  const validation = updateTaskDatesSchema.safeParse({
    taskId,
    startDate: newStartDate,
    dueDate: newDueDate,
  });
  if (!validation.success) {
    return {
      error: "Invalid input",
      fieldErrors: validation.error.flatten().fieldErrors,
    };
  }

  // Verify task access
  const taskCheck = await verifyTaskAccess(supabase, taskId, companyId);
  if ("error" in taskCheck) {
    return { error: taskCheck.error };
  }

  const { task: existingTask, projectId } = taskCheck;

  // Update task with both dates
  const { data: task, error: updateError } = await supabase
    .from("tasks")
    .update({
      start_date: newStartDate,
      due_date: newDueDate,
    })
    .eq("id", taskId)
    .select()
    .single();

  if (updateError) {
    console.error("Error updating task dates:", updateError);
    return { error: "Failed to update task dates" };
  }

  // Log activity (import dynamically to avoid circular deps)
  const { logTaskActivity } = await import("./tasks-activity");
  await logTaskActivity(
    supabase,
    taskId,
    userId,
    "updated",
    `start_date: ${existingTask.start_date || "none"}, due_date: ${existingTask.due_date || "none"}`,
    `start_date: ${newStartDate}, due_date: ${newDueDate}`,
  );

  // Revalidate paths
  revalidatePath("/app/tasks");
  revalidatePath(`/app/projects/${projectId}`);

  return { success: true, task };
}

/**
 * Get full task details with related data for Task Detail Panel (Phase 4)
 * Fetches task with assignee, phase, spatial marker, and related counts
 * @param taskId - Task UUID
 * @returns TaskDetails object or error
 */
export async function getTaskDetails(taskId: string): Promise<{
  data?: {
    id: string;
    title: string;
    description?: string;
    status: TaskStatus;
    priority: TaskPriority;
    due_date?: string;
    start_date?: string;
    assignee?: {
      id: string;
      name: string;
      avatar_url?: string;
    };
    phase?: {
      id: string;
      name: string;
    };
    spatial_marker?: {
      id: string;
      position_x: number;
      position_y: number;
      position_z: number;
      element_id?: string;
    };
    material_count?: number;
    expense_count?: number;
    attachment_count?: number;
    planned_cost?: number;
    actual_cost?: number;
    created_at: string;
    updated_at: string;
  };
  error?: string;
}> {
  console.log("[getTaskDetails] Fetching details for task:", taskId);

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

  // API-TASK-006 FIX: Consolidate into parallel queries to eliminate waterfall
  // Fetch task with all related data + all counts in parallel
  const [
    { data: task, error: taskError },
    { data: spatialMarker },
    { count: materialCount },
    { count: expenseCount },
    { count: attachmentCount },
  ] = await Promise.all([
    // Fetch task with assignee and phase joined
    supabase
      .from("tasks")
      .select(
        `
        id,
        title,
        description,
        status,
        priority,
        due_date,
        start_date,
        planned_cost,
        actual_cost,
        created_at,
        updated_at,
        assignee:user_profiles!tasks_assignee_id_fkey (
          id,
          name,
          avatar_url
        ),
        phase:project_phases!tasks_phase_id_fkey (
          id,
          name
        )
      `,
      )
      .eq("id", taskId)
      .single(),

    // Fetch spatial marker (relationship: spatial_markers.task_id → tasks.id)
    supabase
      .from("spatial_markers")
      .select("id, position_x, position_y, position_z, element_id")
      .eq("task_id", taskId)
      .maybeSingle(), // Use maybeSingle since not all tasks have markers

    // Get material count
    supabase
      .from("material_assignments")
      .select("id", { count: "exact", head: true })
      .eq("task_id", taskId),

    // Get expense count
    supabase
      .from("expenses")
      .select("id", { count: "exact", head: true })
      .eq("task_id", taskId),

    // Get attachment count
    supabase
      .from("attachments")
      .select("id", { count: "exact", head: true })
      .eq("task_id", taskId)
      .is("deleted_at", null),
  ]);

  if (taskError || !task) {
    console.error("[getTaskDetails] Error fetching task:", taskError);
    return { error: "Task not found" };
  }

  // Transform data
  const taskDetails = {
    id: task.id,
    title: task.title,
    description: task.description || undefined,
    status: task.status,
    priority: task.priority,
    due_date: task.due_date || undefined,
    start_date: task.start_date || undefined,
    assignee: task.assignee
      ? {
          id: (task.assignee as unknown as TaskAssigneeJoin).id,
          name: (task.assignee as unknown as TaskAssigneeJoin).name,
          avatar_url:
            (task.assignee as unknown as TaskAssigneeJoin).avatar_url ||
            undefined,
        }
      : undefined,
    phase: task.phase
      ? {
          id: (task.phase as unknown as TaskPhaseJoin).id,
          name: (task.phase as unknown as TaskPhaseJoin).name,
        }
      : undefined,
    spatial_marker: spatialMarker
      ? {
          id: spatialMarker.id,
          position_x: spatialMarker.position_x,
          position_y: spatialMarker.position_y,
          position_z: spatialMarker.position_z,
          element_id: spatialMarker.element_id || undefined,
        }
      : undefined,
    material_count: materialCount || 0,
    expense_count: expenseCount || 0,
    attachment_count: attachmentCount || 0,
    planned_cost: task.planned_cost || undefined,
    actual_cost: task.actual_cost || undefined,
    created_at: task.created_at,
    updated_at: task.updated_at,
  };

  console.log("[getTaskDetails] Task details fetched successfully", {
    taskId,
    materialCount,
    expenseCount,
    attachmentCount,
  });

  return { data: taskDetails };
}

/**
 * Get attachments for a task (Phase 4)
 * Fetches all non-deleted attachments linked to a task
 * @param taskId - Task UUID
 * @returns Array of attachments or error
 */
export async function getTaskAttachments(taskId: string): Promise<{
  data?: Array<{
    id: string;
    file_name: string;
    file_url: string;
    file_type?: string | null;
    file_size?: number | null;
    created_at: string;
  }>;
  error?: string;
}> {
  console.log("[getTaskAttachments] Fetching attachments for task:", taskId);

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

  // Fetch attachments for this task
  const { data: attachments, error: attachmentsError } = await supabase
    .from("attachments")
    .select(
      `
      id,
      file_name,
      file_url,
      file_type,
      file_size,
      created_at
    `,
    )
    .eq("entity_id", taskId)
    .order("created_at", { ascending: false });

  if (attachmentsError) {
    console.error(
      "[getTaskAttachments] Error fetching attachments:",
      attachmentsError,
    );
    return { error: "Failed to fetch attachments" };
  }

  console.log("[getTaskAttachments] Attachments fetched successfully", {
    taskId,
    attachmentCount: attachments?.length || 0,
  });

  return { data: attachments || [] };
}
