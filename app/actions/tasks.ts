"use server";

import { revalidatePath } from "next/cache";
import { after } from "next/server";
import { z } from "zod";
import { createClient } from "@/utils/supabase/server";
import { auth } from "@/lib/auth";
import { getUserContext } from "@/lib/auth-context";
import { invalidateDashboardCache } from "@/app/actions/dashboard";
import type {
  TasksRow,
  TasksInsert,
  TasksUpdate,
} from "@/types/db/tables/tasks";
import type {
  TaskStatus,
  TaskPriority,
  TaskType,
  ApprovalStatus,
  ActivityAction,
} from "@/types/db/enums";
import type {
  ActionResult,
  FormActionResult,
  MutationResult,
} from "@/types/server-actions";

type Task = TasksRow;
type TaskInsert = TasksInsert;
type TaskUpdate = TasksUpdate;

// Types for multi-assignee support
export interface AssigneeOption {
  id: string;
  type: "user" | "subcontractor";
  name: string;
  email?: string;
  avatar_url?: string | null;
  company_name?: string; // For subcontractors
}

export interface TaskAssignee {
  id: string;
  type: "user" | "subcontractor";
}

// Extended update input for auto-expense feature
export interface UpdateTaskInput {
  id: string;
  title?: string;
  description?: string | null;
  assignee_id?: string | null;
  start_date?: string | null;
  due_date?: string | null;
  priority?: "low" | "medium" | "high" | "critical";
  planned_cost?: number | null;
  actual_cost?: number | null;
  phase_id?: string | null;
  receipt_photo_url?: string | null;
  status?: "todo" | "in_progress" | "review" | "blocked" | "completed";
  // Auto-expense extension fields
  autoCreateExpense?: boolean;
  primaryAssigneeId?: string;
}

// Result type for update with expense creation
export interface UpdateTaskResult {
  success: boolean;
  task?: Task;
  error?: string;
  fieldErrors?: Record<string, string[]>;
  expenseId?: string; // Populated if expense was created
  expenseError?: string; // Error message if expense creation failed but task saved
}

// Form action state types
export interface CreateTaskFormState {
  success?: boolean;
  error?: string | null;
  task?: Task | null;
  fieldErrors?: Record<string, string[]> | null;
}

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

interface ActivityUserJoin {
  name: string;
}

// ============================================
// Validation Schemas
// ============================================

const createTaskSchema = z
  .object({
    title: z.string().min(1, "Task title is required").max(500),
    project_id: z.string().uuid("Invalid project ID"),
    phase_id: z.string().uuid("Invalid phase ID").optional().nullable(),
    description: z.string().optional().nullable(),
    assignee_id: z.string().uuid("Invalid assignee ID").optional().nullable(),
    start_date: z.string().optional().nullable(),
    due_date: z.string().optional().nullable(),
    priority: z.enum(["low", "medium", "high", "critical"]).optional(),
    planned_cost: z.number().min(0).optional().nullable(),
    task_type: z
      .enum(["work", "purchase", "approval", "admin"])
      .default("work"),
    receipt_photo_url: z
      .string()
      .url("Invalid receipt photo URL")
      .optional()
      .nullable(),
  })
  .refine(
    (data) => {
      // If both dates are provided, start_date must be <= due_date
      if (data.start_date && data.due_date) {
        return data.start_date <= data.due_date;
      }
      return true;
    },
    {
      message: "Start date must be before or equal to due date",
      path: ["start_date"],
    },
  );

const updateTaskSchema = z
  .object({
    id: z.string().uuid("Invalid task ID"),
    title: z.string().min(1, "Task title is required").max(500).optional(),
    description: z.string().optional().nullable(),
    assignee_id: z.string().uuid("Invalid assignee ID").optional().nullable(),
    start_date: z.string().optional().nullable(),
    due_date: z.string().optional().nullable(),
    priority: z.enum(["low", "medium", "high", "critical"]).optional(),
    planned_cost: z.number().min(0).optional().nullable(),
    actual_cost: z.number().min(0).optional().nullable(),
    phase_id: z.string().uuid("Invalid phase ID").optional().nullable(),
    receipt_photo_url: z
      .string()
      .url("Invalid receipt photo URL")
      .optional()
      .nullable(),
    status: z
      .enum(["todo", "in_progress", "review", "blocked", "completed"])
      .optional(),
  })
  .refine(
    (data) => {
      // If both dates are provided, start_date must be <= due_date
      if (data.start_date && data.due_date) {
        return data.start_date <= data.due_date;
      }
      return true;
    },
    {
      message: "Start date must be before or equal to due date",
      path: ["start_date"],
    },
  );

const updateTaskStatusSchema = z.object({
  id: z.string().uuid("Invalid task ID"),
  status: z.enum(["todo", "in_progress", "review", "blocked", "completed"]),
  blocked_reason: z.string().optional().nullable(),
});

const taskDependencySchema = z.object({
  task_id: z.string().uuid("Invalid task ID"),
  depends_on_task_id: z.string().uuid("Invalid dependency task ID"),
});

const addCommentSchema = z.object({
  task_id: z.string().uuid("Invalid task ID"),
  comment: z.string().min(1, "Comment is required").max(5000),
});

const updateApprovalStatusSchema = z.object({
  task_id: z.string().uuid("Invalid task ID"),
  approval_status: z.enum([
    "pending",
    "approved",
    "rejected",
    "revision_requested",
  ]),
  approval_notes: z.string().max(2000).optional().nullable(),
});

// ============================================
// Helper Functions
// ============================================
// NOTE: getUserContext moved to @/lib/auth-context for React.cache optimization

async function verifyProjectAccess(
  supabase: Awaited<ReturnType<typeof createClient>>,
  projectId: string,
  companyId: string,
) {
  const { data: project, error } = await supabase
    .from("projects")
    .select("id, company_id")
    .eq("id", projectId)
    .single();

  if (error || !project) {
    return { error: "Project not found" };
  }

  if (project.company_id !== companyId) {
    return { error: "Insufficient permissions to access this project" };
  }

  return { project };
}

async function verifyTaskAccess(
  supabase: Awaited<ReturnType<typeof createClient>>,
  taskId: string,
  companyId: string,
) {
  const { data: task, error } = await supabase
    .from("tasks")
    .select(
      `
      *,
      projects!inner (
        id,
        company_id
      )
    `,
    )
    .eq("id", taskId)
    .single();

  if (error || !task) {
    return { error: "Task not found" };
  }

  const project = task.projects as unknown as {
    id: string;
    company_id: string;
  };

  if (project.company_id !== companyId) {
    return { error: "Insufficient permissions to access this task" };
  }

  return { task, projectId: project.id };
}

async function logTaskActivity(
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
// Multi-Assignee Helper Functions
// ============================================

/**
 * Get all assignable users and subcontractors for a project
 * Returns combined list of ALL company team members + ALL company subcontractors
 */
export async function getProjectAssignees(
  projectId: string,
): Promise<ActionResult<AssigneeOption[]>> {
  const userContext = await getUserContext();
  if ("error" in userContext) {
    return { success: false, error: userContext.error as string };
  }

  const { companyId, supabase } = userContext;

  // Verify project access
  const projectCheck = await verifyProjectAccess(
    supabase,
    projectId,
    companyId,
  );
  if ("error" in projectCheck) {
    return { success: false, error: projectCheck.error as string };
  }

  // Transform into unified assignee options
  const assignees: AssigneeOption[] = [];

  // Fetch ALL company team members + subcontractors in parallel
  const [companyUsersResult, subsResult] = await Promise.all([
    supabase
      .from("company_users")
      .select(
        `
        user_id,
        public_user_profiles:user_profiles!company_users_user_profile_fkey (
          id,
          name,
          email,
          avatar_url
        )
      `,
      )
      .eq("company_id", companyId)
      .eq("status", "active"),
    supabase
      .from("subcontractors")
      .select("id, company_name, contact_name, email")
      .eq("company_id", companyId)
      .eq("is_active", true),
  ]);

  const { data: companyUsers, error: usersError } = companyUsersResult;
  const { data: subs, error: subsError } = subsResult;

  if (usersError) {
    after(() => {
      console.error(
        "[getProjectAssignees] Error fetching company users:",
        usersError,
      );
    });
    return { success: false, error: "Failed to fetch team members" };
  }

  companyUsers?.forEach((cu) => {
    const user = cu.public_user_profiles as unknown as {
      id: string;
      name: string;
      email: string;
      avatar_url: string | null;
    };
    if (user) {
      assignees.push({
        id: user.id,
        type: "user",
        name: user.name,
        email: user.email,
        avatar_url: user.avatar_url,
      });
    }
  });

  if (subsError) {
    after(() => {
      console.error(
        "[getProjectAssignees] Error fetching subcontractors:",
        subsError,
      );
    });
    // Don't fail - just continue without subcontractors
  }

  subs?.forEach((sub) => {
    assignees.push({
      id: sub.id,
      type: "subcontractor",
      name: sub.contact_name,
      email: sub.email || undefined,
      company_name: sub.company_name,
    });
  });

  // Remove duplicates (in case someone appears multiple times)
  const uniqueAssignees = assignees.filter(
    (assignee, index, self) =>
      index ===
      self.findIndex((a) => a.id === assignee.id && a.type === assignee.type),
  );

  return { success: true, data: uniqueAssignees };
}

/**
 * Manage task assignees - insert new assignees for a task
 */
async function insertTaskAssignees(
  supabase: Awaited<ReturnType<typeof createClient>>,
  taskId: string,
  assignees: TaskAssignee[],
  assignedBy: string,
): Promise<{ error?: string }> {
  if (!assignees || assignees.length === 0) {
    return {};
  }

  const assigneeInserts = assignees.map((assignee) => ({
    task_id: taskId,
    user_id: assignee.type === "user" ? assignee.id : null,
    subcontractor_id: assignee.type === "subcontractor" ? assignee.id : null,
    assigned_by: assignedBy,
  }));

  const { error } = await supabase
    .from("task_assignees")
    .insert(assigneeInserts);

  if (error) {
    after(() => {
      console.error("[insertTaskAssignees] Error:", error);
    });
    return { error: "Failed to assign users to task" };
  }

  return {};
}

/**
 * Update task assignees - replace all assignees for a task
 */
async function updateTaskAssignees(
  supabase: Awaited<ReturnType<typeof createClient>>,
  taskId: string,
  assignees: TaskAssignee[],
  assignedBy: string,
): Promise<{ error?: string }> {
  // Delete existing assignees
  const { error: deleteError } = await supabase
    .from("task_assignees")
    .delete()
    .eq("task_id", taskId);

  if (deleteError) {
    after(() => {
      console.error("[updateTaskAssignees] Delete error:", deleteError);
    });
    return { error: "Failed to update assignees" };
  }

  // Insert new assignees
  if (assignees && assignees.length > 0) {
    return insertTaskAssignees(supabase, taskId, assignees, assignedBy);
  }

  return {};
}

// ============================================
// Server Actions
// ============================================

/**
 * Create a new task
 */
export async function createTask(
  prevState: CreateTaskFormState | null,
  formData: FormData,
): Promise<FormActionResult<Task>> {
  // Get user context
  const userContext = await getUserContext();
  if ("error" in userContext) {
    return { success: false, error: userContext.error as string };
  }

  const { userId, companyId, supabase } = userContext;

  // Parse form data
  const phaseId = formData.get("phase_id") as string;
  const assigneeId = formData.get("assignee_id") as string;
  const assigneeIdsJson = formData.get("assignee_ids") as string;

  const taskType = formData.get("task_type") as string;

  // Parse multi-assignee data (new format)
  let assigneeIds: TaskAssignee[] = [];
  if (assigneeIdsJson) {
    try {
      assigneeIds = JSON.parse(assigneeIdsJson);
    } catch (e) {
      after(() => {
        console.warn("[createTask] Failed to parse assignee_ids JSON:", e);
      });
    }
  }

  const rawData = {
    title: formData.get("title"),
    project_id: formData.get("project_id"),
    phase_id: phaseId && phaseId !== "none" && phaseId !== "" ? phaseId : null,
    description: formData.get("description") || null,
    assignee_id:
      assigneeId &&
      assigneeId !== "unassigned" &&
      assigneeId !== "none" &&
      assigneeId !== ""
        ? assigneeId
        : null,
    start_date: formData.get("start_date") || null,
    due_date: formData.get("due_date") || null,
    priority: formData.get("priority") || "medium",
    planned_cost: formData.get("planned_cost")
      ? parseFloat(formData.get("planned_cost") as string)
      : null,
    task_type:
      taskType && ["work", "purchase", "approval", "admin"].includes(taskType)
        ? taskType
        : "work",
    receipt_photo_url: formData.get("receipt_photo_url") || null,
  };

  // Validate input
  const validation = createTaskSchema.safeParse(rawData);
  if (!validation.success) {
    return {
      success: false,
      error: "Validation failed",
      fieldErrors: validation.error.flatten().fieldErrors,
    };
  }

  const data = validation.data;

  // Verify project access
  const projectCheck = await verifyProjectAccess(
    supabase,
    data.project_id,
    companyId,
  );
  if ("error" in projectCheck) {
    return { success: false, error: projectCheck.error as string };
  }

  // Prepare task data with task_type support
  const taskData: TaskInsert = {
    project_id: data.project_id,
    phase_id: data.phase_id || null,
    title: data.title,
    description: data.description || null,
    assignee_id: data.assignee_id || null,
    start_date: data.start_date || null,
    due_date: data.due_date || null,
    priority: (data.priority || "medium") as TaskPriority,
    planned_cost: data.planned_cost || null,
    status: "todo",
    created_by: userId,
    task_type: data.task_type as TaskType,
    // Set approval_status to 'pending' for approval-type tasks
    approval_status: data.task_type === "approval" ? "pending" : null,
    receipt_photo_url: data.receipt_photo_url || null,
  };

  // Insert task
  const { data: task, error: insertError } = await supabase
    .from("tasks")
    .insert(taskData)
    .select()
    .single();

  if (insertError) {
    after(() => {
      console.error("Error creating task:", insertError);
    });
    return { success: false, error: "Failed to create task. Please try again." };
  }

  // CRITICAL OPTIMIZATION (HIGH-002): Parallelize post-creation operations
  // Estimated savings: 300ms sequential → 150ms parallel (50% reduction)
  const postCreationOps: Promise<unknown>[] = [
    // Log activity
    logTaskActivity(supabase, task.id, userId, "created"),
  ];

  // Insert multi-assignees
  if (assigneeIds && assigneeIds.length > 0) {
    postCreationOps.push(
      insertTaskAssignees(supabase, task.id, assigneeIds, userId).then(
        (assigneeResult) => {
          if (assigneeResult.error) {
            after(() => {
              console.warn(
                "[createTask] Failed to insert assignees:",
                assigneeResult.error,
              );
            });
          }
        },
      ),
    );

    // CRITICAL OPTIMIZATION (CRIT-003): Batch notification inserts
    // Estimated savings: N × 50ms → 50ms (200-500ms for 10 notifications)
    const assigneeNotifications = assigneeIds
      .filter((assignee) => assignee.type === "user" && assignee.id !== userId)
      .map((assignee) => ({
        user_id: assignee.id,
        type: "task_assigned" as const,
        title: "New Task Assigned",
        message: `You have been assigned to: ${data.title}`,
        link: `/app/tasks/${task.id}`,
      }));

    if (assigneeNotifications.length > 0) {
      postCreationOps.push(
        Promise.resolve(
          supabase.from("notifications").insert(assigneeNotifications),
        ).then(({ error: notificationError }) => {
          if (notificationError) {
            after(() => {
              console.error(
                "[createTask] Error sending assignee notifications:",
                notificationError,
              );
            });
          }
        }),
      );
    }
  }

  // Create notification for primary assignee if assigned
  if (data.assignee_id && data.assignee_id !== userId) {
    postCreationOps.push(
      Promise.resolve(
        supabase.from("notifications").insert({
          user_id: data.assignee_id,
          type: "task_assigned",
          title: "New Task Assigned",
          message: `You have been assigned to: ${data.title}`,
          link: `/app/tasks/${task.id}`,
        }),
      ).then(({ error }) => {
        if (error) {
          after(() => {
            console.error(
              "[createTask] Error creating primary assignee notification:",
              error,
            );
          });
        }
      }),
    );

    // Send AlimTalk notification to assignee (Task 0018) - parallel
    // HIGH-010 FIX: Parallelize Kakao + Project fetch
    postCreationOps.push(
      Promise.all([
        import("@/lib/services/kakao"),
        Promise.resolve(
          supabase
            .from("projects")
            .select("name")
            .eq("id", data.project_id)
            .single(),
        ),
      ])
        .then(([{ KakaoService }, { data: project }]) => {
          return KakaoService.sendAlimTalk(data.assignee_id!, {
            template: "task_assignment",
            params: {
              taskTitle: data.title,
              dueDate: data.due_date || "Not set",
              projectName: project?.name || "Unknown Project",
            },
          });
        })
        .catch((error) => {
          after(() => {
            console.error("[createTask] Error sending AlimTalk:", error);
          });
          // Don't fail task creation if AlimTalk fails
        }),
    );
  }

  // Execute all post-creation operations in parallel (allSettled to prevent one failure from blocking others)
  await Promise.allSettled(postCreationOps);

  // Revalidate paths
  revalidatePath("/app/tasks");
  revalidatePath(`/app/projects/${data.project_id}`);

  // Invalidate dashboard cache (task counts changed)
  await invalidateDashboardCache({ companyId });

  return { success: true, data: task };
}

/**
 * Update a task's fields
 */
export async function updateTask(
  formData: FormData,
): Promise<FormActionResult<Task>> {
  // Get user context
  const userContext = await getUserContext();
  if ("error" in userContext) {
    return { success: false, error: userContext.error as string };
  }

  const { userId, companyId, supabase } = userContext;

  // Parse form data
  const assigneeId = formData.get("assignee_id") as string;
  const phaseId = formData.get("phase_id") as string;
  const description = formData.get("description") as string;
  const startDate = formData.get("start_date") as string;
  const dueDate = formData.get("due_date") as string;

  // Parse multi-assignee data (new format)
  const assigneeIdsJson = formData.get("assignee_ids") as string;
  let assigneeIds: TaskAssignee[] | undefined;
  if (assigneeIdsJson) {
    try {
      assigneeIds = JSON.parse(assigneeIdsJson);
    } catch (e) {
      after(() => {
        console.warn("[updateTask] Failed to parse assignee_ids:", e);
      });
    }
  }

  const rawData = {
    id: formData.get("id"),
    title: formData.get("title") || undefined,
    description: description || null,
    assignee_id:
      assigneeId &&
      assigneeId !== "unassigned" &&
      assigneeId !== "none" &&
      assigneeId !== ""
        ? assigneeId
        : null,
    start_date: startDate || null,
    due_date: dueDate || null,
    priority: formData.get("priority") || undefined,
    planned_cost: formData.get("planned_cost")
      ? parseFloat(formData.get("planned_cost") as string)
      : undefined,
    actual_cost: formData.get("actual_cost")
      ? parseFloat(formData.get("actual_cost") as string)
      : undefined,
    phase_id: phaseId && phaseId !== "none" && phaseId !== "" ? phaseId : null,
    status: (formData.get("status") as string) || undefined,
  };

  // Validate input
  const validation = updateTaskSchema.safeParse(rawData);
  if (!validation.success) {
    return {
      success: false,
      error: "Validation failed",
      fieldErrors: validation.error.flatten().fieldErrors,
    };
  }

  const { id, ...updateData } = validation.data;

  // Verify task access
  const taskCheck = await verifyTaskAccess(supabase, id, companyId);
  if ("error" in taskCheck) {
    return { success: false, error: taskCheck.error as string };
  }

  const { task: existingTask, projectId } = taskCheck;

  // Track changes for activity log
  const changes: Array<{ field: string; oldValue: string; newValue: string }> =
    [];

  if (updateData.title && updateData.title !== existingTask.title) {
    changes.push({
      field: "title",
      oldValue: existingTask.title,
      newValue: updateData.title,
    });
  }
  if (
    updateData.assignee_id !== undefined &&
    updateData.assignee_id !== existingTask.assignee_id
  ) {
    changes.push({
      field: "assignee",
      oldValue: existingTask.assignee_id || "none",
      newValue: updateData.assignee_id || "none",
    });
  }
  if (updateData.priority && updateData.priority !== existingTask.priority) {
    changes.push({
      field: "priority",
      oldValue: existingTask.priority,
      newValue: updateData.priority,
    });
  }

  // Prepare update
  const taskUpdate: TaskUpdate = {};
  if (updateData.title !== undefined) taskUpdate.title = updateData.title;
  if (updateData.description !== undefined)
    taskUpdate.description = updateData.description;
  if (updateData.assignee_id !== undefined)
    taskUpdate.assignee_id = updateData.assignee_id;
  if (updateData.start_date !== undefined)
    taskUpdate.start_date = updateData.start_date;
  if (updateData.due_date !== undefined)
    taskUpdate.due_date = updateData.due_date;
  if (updateData.priority !== undefined)
    taskUpdate.priority = updateData.priority as TaskPriority;
  if (updateData.planned_cost !== undefined)
    taskUpdate.planned_cost = updateData.planned_cost;
  if (updateData.actual_cost !== undefined)
    taskUpdate.actual_cost = updateData.actual_cost;
  if (updateData.phase_id !== undefined)
    taskUpdate.phase_id = updateData.phase_id;
  if (updateData.status !== undefined)
    taskUpdate.status = updateData.status as TaskStatus;

  // Update task
  const { data: task, error: updateError } = await supabase
    .from("tasks")
    .update(taskUpdate)
    .eq("id", id)
    .select()
    .single();

  if (updateError) {
    after(() => {
      console.error("Error updating task:", updateError);
    });
    return { success: false, error: "Failed to update task. Please try again." };
  }

  // CRITICAL OPTIMIZATION (CRIT-005): Batch activity logging
  // Estimated savings: N × 50ms → 50ms (250ms for 5 changes)
  if (changes.length > 0) {
    const activityInserts = changes.map((change) => ({
      task_id: id,
      user_id: userId,
      action: "updated" as ActivityAction,
      old_value: `${change.field}: ${change.oldValue}`,
      new_value: `${change.field}: ${change.newValue}`,
    }));

    const { error: activityError } = await supabase
      .from("task_activity")
      .insert(activityInserts);

    if (activityError) {
      after(() => {
        console.error("[updateTask] Error logging activity:", activityError);
      });
    }
  }

  // Notify new assignee if changed
  if (
    updateData.assignee_id &&
    updateData.assignee_id !== existingTask.assignee_id &&
    updateData.assignee_id !== userId
  ) {
    await supabase.from("notifications").insert({
      user_id: updateData.assignee_id,
      type: "task_assigned",
      title: "Task Assigned",
      message: `You have been assigned to: ${task.title}`,
      link: `/app/tasks/${task.id}`,
    });
  }

  // Update multi-assignees if provided
  if (assigneeIds !== undefined) {
    const assigneeResult = await updateTaskAssignees(
      supabase,
      id,
      assigneeIds,
      userId,
    );
    if (assigneeResult.error) {
      after(() => {
        console.warn(
          "[updateTask] Failed to update assignees:",
          assigneeResult.error,
        );
      });
    }

    // CRITICAL OPTIMIZATION (CRIT-003): Batch notification inserts (location 2/4)
    // Estimated savings: N × 50ms → 50ms (200-500ms for 10 notifications)
    const assigneeNotifications = assigneeIds
      .filter((assignee) => assignee.type === "user" && assignee.id !== userId)
      .map((assignee) => ({
        user_id: assignee.id,
        type: "task_assigned" as const,
        title: "Task Assigned",
        message: `You have been assigned to: ${task.title}`,
        link: `/app/tasks/${id}`,
      }));

    if (assigneeNotifications.length > 0) {
      const { error: notificationError } = await supabase
        .from("notifications")
        .insert(assigneeNotifications);

      if (notificationError) {
        after(() => {
          console.error(
            "[updateTask] Error sending assignee notifications:",
            notificationError,
          );
        });
      }
    }
  }

  // Revalidate paths
  revalidatePath("/app/tasks");
  revalidatePath(`/app/tasks/${id}`);
  revalidatePath(`/app/projects/${projectId}`);

  // Invalidate dashboard cache (task data changed)
  await invalidateDashboardCache({ companyId });

  return { success: true, data: task };
}

/**
 * Update a task with optional auto-expense creation
 * Extended version that supports UpdateTaskInput interface with autoCreateExpense flag
 *
 * @param input - UpdateTaskInput with optional autoCreateExpense and primaryAssigneeId
 * @returns FormActionResult with optional expenseId if expense was created
 */
export async function updateTaskWithExpense(
  input: UpdateTaskInput,
): Promise<
  FormActionResult<Task & { expenseId?: string; expenseError?: string }>
> {
  // Get user context
  const userContext = await getUserContext();
  if ("error" in userContext) {
    return { success: false, error: userContext.error as string };
  }

  const { userId, companyId, supabase } = userContext;

  // Validate input
  const validation = updateTaskSchema.safeParse(input);
  if (!validation.success) {
    return {
      success: false,
      error: "Validation failed",
      fieldErrors: validation.error.flatten().fieldErrors,
    };
  }

  const { id, ...updateData } = validation.data;

  // Verify task access
  const taskCheck = await verifyTaskAccess(supabase, id, companyId);
  if ("error" in taskCheck) {
    return { success: false, error: taskCheck.error as string };
  }

  const { task: existingTask, projectId } = taskCheck;

  // Prepare update
  const taskUpdate: TaskUpdate = {};
  if (updateData.title !== undefined) taskUpdate.title = updateData.title;
  if (updateData.description !== undefined)
    taskUpdate.description = updateData.description;
  if (updateData.assignee_id !== undefined)
    taskUpdate.assignee_id = updateData.assignee_id;
  if (updateData.start_date !== undefined)
    taskUpdate.start_date = updateData.start_date;
  if (updateData.due_date !== undefined)
    taskUpdate.due_date = updateData.due_date;
  if (updateData.priority !== undefined)
    taskUpdate.priority = updateData.priority as TaskPriority;
  if (updateData.planned_cost !== undefined)
    taskUpdate.planned_cost = updateData.planned_cost;
  if (updateData.actual_cost !== undefined)
    taskUpdate.actual_cost = updateData.actual_cost;
  if (updateData.phase_id !== undefined)
    taskUpdate.phase_id = updateData.phase_id;
  if (updateData.status !== undefined)
    taskUpdate.status = updateData.status as TaskStatus;

  // Update task first (task always saves regardless of expense outcome)
  const { data: task, error: updateError } = await supabase
    .from("tasks")
    .update(taskUpdate)
    .eq("id", id)
    .select()
    .single();

  if (updateError) {
    after(() => {
      console.error("[updateTaskWithExpense] Error updating task:", updateError);
    });
    return {
      success: false,
      error: "Failed to update task. Please try again.",
    };
  }

  // Log activity for significant changes
  if (
    updateData.actual_cost !== undefined &&
    updateData.actual_cost !== existingTask.actual_cost
  ) {
    await logTaskActivity(
      supabase,
      id,
      userId,
      "updated",
      `actual_cost: ${existingTask.actual_cost ?? 0}`,
      `actual_cost: ${updateData.actual_cost}`,
    );
  }

  // Handle primary assignee update if provided
  if (input.primaryAssigneeId) {
    // Determine assignee type by checking which table the ID exists in
    const { data: userCheck } = await supabase
      .from("user_profiles")
      .select("id")
      .eq("id", input.primaryAssigneeId)
      .maybeSingle();

    const assigneeType: "user" | "subcontractor" = userCheck
      ? "user"
      : "subcontractor";

    const primaryResult = await setPrimaryAssignee(
      id,
      input.primaryAssigneeId,
      assigneeType,
    );
    if (primaryResult.error) {
      after(() => {
        console.warn(
          "[updateTaskWithExpense] Failed to set primary assignee:",
          primaryResult.error,
        );
      });
      // Continue - this is not a critical failure
    }
  }

  // Handle auto-expense creation if requested
  let expenseId: string | undefined;
  let expenseError: string | undefined;

  if (input.autoCreateExpense && task.actual_cost && task.actual_cost > 0) {
    try {
      // Import createExpenseFromTask dynamically to avoid circular imports
      const { createExpenseFromTask } = await import("@/app/actions/expenses");
      const expenseResult = await createExpenseFromTask(id);

      if (expenseResult.success && expenseResult.data) {
        expenseId = expenseResult.data.id;
        // Revalidate expense routes
        revalidatePath("/app/expenses");
      } else if (expenseResult.error) {
        // Task saved but expense creation failed - report error but don't fail
        expenseError = expenseResult.error;
        after(() => {
          console.warn(
            "[updateTaskWithExpense] Expense creation failed:",
            expenseResult.error,
          );
        });
      }
    } catch (error) {
      // Task saved but expense creation threw - report error but don't fail
      expenseError = "Failed to create expense from task";
      after(() => {
        console.error(
          "[updateTaskWithExpense] Expense creation exception:",
          error,
        );
      });
    }
  }

  // Revalidate paths
  revalidatePath("/app/tasks");
  revalidatePath(`/app/tasks/${id}`);
  revalidatePath(`/app/projects/${projectId}`);

  return { success: true, data: { ...task, expenseId, expenseError } };
}

/**
 * Set the primary assignee for a task
 * Only one assignee per task can be primary (used for vendor_name in auto-expense)
 *
 * @param taskId - Task UUID
 * @param assigneeId - User or Subcontractor UUID
 * @param assigneeType - 'user' or 'subcontractor'
 * @returns Success or error
 */
export async function setPrimaryAssignee(
  taskId: string,
  assigneeId: string,
  assigneeType: "user" | "subcontractor",
): Promise<{ success: boolean; error?: string }> {
  if (process.env.NODE_ENV === "development") {
    console.log("[setPrimaryAssignee] Setting primary assignee:", {
      taskId,
      assigneeId,
      assigneeType,
    });
  }

  // Validate inputs
  const inputSchema = z.object({
    taskId: z.string().uuid("Invalid task ID"),
    assigneeId: z.string().uuid("Invalid assignee ID"),
    assigneeType: z.enum(["user", "subcontractor"]),
  });

  const validation = inputSchema.safeParse({
    taskId,
    assigneeId,
    assigneeType,
  });
  if (!validation.success) {
    return { success: false, error: validation.error.issues[0].message };
  }

  // Get user context
  const userContext = await getUserContext();
  if ("error" in userContext) {
    return { success: false, error: userContext.error as string };
  }

  const { companyId, supabase } = userContext;

  // Verify task access
  const taskCheck = await verifyTaskAccess(supabase, taskId, companyId);
  if ("error" in taskCheck) {
    return { success: false, error: taskCheck.error as string };
  }

  const { projectId } = taskCheck;

  // Build the query based on assignee type
  const assigneeColumn =
    assigneeType === "user" ? "user_id" : "subcontractor_id";

  // First check if this assignee is already assigned to the task
  const { data: existingAssignee, error: checkError } = await supabase
    .from("task_assignees")
    .select("id, is_primary")
    .eq("task_id", taskId)
    .eq(assigneeColumn, assigneeId)
    .maybeSingle();

  if (checkError) {
    after(() => {
      console.error(
        "[setPrimaryAssignee] Error checking existing assignee:",
        checkError,
      );
    });
    return { success: false, error: "Failed to check assignee status" };
  }

  if (!existingAssignee) {
    // Assignee not found - they need to be added to the task first
    return { success: false, error: "Assignee is not assigned to this task" };
  }

  if (existingAssignee.is_primary) {
    // Already primary, no change needed
    return { success: true };
  }

  // Update to set this assignee as primary
  // The trigger will automatically clear other primaries
  const { error: updateError } = await supabase
    .from("task_assignees")
    .update({ is_primary: true })
    .eq("id", existingAssignee.id);

  if (updateError) {
    after(() => {
      console.error(
        "[setPrimaryAssignee] Error updating primary status:",
        updateError,
      );
    });
    return { success: false, error: "Failed to set primary assignee" };
  }

  // Revalidate paths
  revalidatePath("/app/tasks");
  revalidatePath(`/app/tasks/${taskId}`);
  revalidatePath(`/app/projects/${projectId}`);

  if (process.env.NODE_ENV === "development") {
    console.log("[setPrimaryAssignee] Primary assignee set successfully");
  }
  return { success: true };
}

/**
 * Update a task's status
 * Requires blocked_reason when status is 'blocked'
 */
export async function updateTaskStatus(
  taskId: string,
  status: TaskStatus,
  blockedReason?: string,
): Promise<ActionResult<Task>> {
  // Get user context
  const userContext = await getUserContext();
  if ("error" in userContext) {
    return { success: false, error: userContext.error as string };
  }

  const { userId, companyId, role, supabase } = userContext;

  // Validate input
  const validation = updateTaskStatusSchema.safeParse({
    id: taskId,
    status,
    blocked_reason: blockedReason,
  });
  if (!validation.success) {
    return { success: false, error: "Invalid input" };
  }

  // Require blocked reason when status is blocked
  if (status === "blocked" && !blockedReason) {
    return {
      success: false,
      error: "Blocked reason is required when status is blocked",
    };
  }

  // Verify task access
  const taskCheck = await verifyTaskAccess(supabase, taskId, companyId);
  if ("error" in taskCheck) {
    return { success: false, error: taskCheck.error as string };
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
    return {
      success: false,
      error: "Failed to update task status. Please try again.",
    };
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

    // CRITICAL OPTIMIZATION (CRIT-003): Batch notification inserts (location 3/4)
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

  return { success: true, data: task };
}

/**
 * Add a task dependency
 */
export async function addTaskDependency(
  taskId: string,
  dependsOnTaskId: string,
): Promise<MutationResult> {
  // Get user context
  const userContext = await getUserContext();
  if ("error" in userContext) {
    return { success: false, error: userContext.error as string };
  }

  const { userId, companyId, supabase } = userContext;

  // Validate input
  const validation = taskDependencySchema.safeParse({
    task_id: taskId,
    depends_on_task_id: dependsOnTaskId,
  });
  if (!validation.success) {
    return { success: false, error: "Invalid input" };
  }

  // Prevent self-dependencies
  if (taskId === dependsOnTaskId) {
    return { success: false, error: "A task cannot depend on itself" };
  }

  // Verify both tasks exist and are in same project
  const taskCheck = await verifyTaskAccess(supabase, taskId, companyId);
  if ("error" in taskCheck) {
    return { success: false, error: taskCheck.error as string };
  }

  const dependsCheck = await verifyTaskAccess(
    supabase,
    dependsOnTaskId,
    companyId,
  );
  if ("error" in dependsCheck) {
    return { success: false, error: "Dependency task not found" };
  }

  if (taskCheck.projectId !== dependsCheck.projectId) {
    return { success: false, error: "Tasks must be in the same project" };
  }

  // Check for circular dependencies
  const { data: existingDeps } = await supabase
    .from("task_dependencies")
    .select("*")
    .eq("task_id", dependsOnTaskId)
    .eq("depends_on_task_id", taskId);

  if (existingDeps && existingDeps.length > 0) {
    return { success: false, error: "This would create a circular dependency" };
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
      return { success: false, error: "This dependency already exists" };
    }
    after(() => {
      console.error("Error adding dependency:", insertError);
    });
    return { success: false, error: "Failed to add dependency. Please try again." };
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
): Promise<MutationResult> {
  // Get user context
  const userContext = await getUserContext();
  if ("error" in userContext) {
    return { success: false, error: userContext.error as string };
  }

  const { userId, companyId, supabase } = userContext;

  // Verify task access
  const taskCheck = await verifyTaskAccess(supabase, taskId, companyId);
  if ("error" in taskCheck) {
    return { success: false, error: taskCheck.error as string };
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
    return {
      success: false,
      error: "Failed to remove dependency. Please try again.",
    };
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
 * Add a comment to a task
 */
export async function addTaskComment(
  taskId: string,
  comment: string,
): Promise<ActionResult<{ id: string }>> {
  // Get user context
  const userContext = await getUserContext();
  if ("error" in userContext) {
    return { success: false, error: userContext.error as string };
  }

  const { userId, companyId, supabase } = userContext;

  // Validate input
  const validation = addCommentSchema.safeParse({ task_id: taskId, comment });
  if (!validation.success) {
    return { success: false, error: "Invalid input" };
  }

  // Verify task access
  const taskCheck = await verifyTaskAccess(supabase, taskId, companyId);
  if ("error" in taskCheck) {
    return { success: false, error: taskCheck.error as string };
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
    return { success: false, error: "Failed to add comment. Please try again." };
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

  // CRITICAL OPTIMIZATION (CRIT-003): Batch notification inserts (location 4/4)
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

  return { success: true, data: activity };
}

/**
 * Delete a task
 */
export async function deleteTask(taskId: string): Promise<MutationResult> {
  // Get user context
  const userContext = await getUserContext();
  if ("error" in userContext) {
    return { success: false, error: userContext.error as string };
  }

  const { companyId, role, supabase } = userContext;

  // Only Admin and PM can delete tasks
  if (role !== "admin" && role !== "project_manager") {
    return {
      success: false,
      error: "Insufficient permissions to delete tasks",
    };
  }

  // Verify task access
  const taskCheck = await verifyTaskAccess(supabase, taskId, companyId);
  if ("error" in taskCheck) {
    return { success: false, error: taskCheck.error as string };
  }

  const { projectId } = taskCheck;

  // Delete task (cascades to dependencies and activity)
  const { error: deleteError } = await supabase
    .from("tasks")
    .delete()
    .eq("id", taskId);

  if (deleteError) {
    after(() => {
      console.error("Error deleting task:", deleteError);
    });
    return { success: false, error: "Failed to delete task. Please try again." };
  }

  // Revalidate paths
  revalidatePath("/app/tasks");
  revalidatePath(`/app/projects/${projectId}`);

  // Invalidate dashboard cache (task deleted)
  await invalidateDashboardCache({ companyId });

  return { success: true };
}

/**
 * Update approval status for an approval-type task
 * Only applicable to tasks with task_type = 'approval'
 */
export async function updateApprovalStatus(
  taskId: string,
  approvalStatus: ApprovalStatus,
  approvalNotes?: string,
): Promise<ActionResult<Task>> {
  if (process.env.NODE_ENV === "development") {
    console.log(
      "[updateApprovalStatus] Starting approval update for task:",
      taskId,
    );
  }

  // Get user context
  const userContext = await getUserContext();
  if ("error" in userContext) {
    return { success: false, error: userContext.error as string };
  }

  const { userId, companyId, role, supabase } = userContext;

  // Validate input
  const validation = updateApprovalStatusSchema.safeParse({
    task_id: taskId,
    approval_status: approvalStatus,
    approval_notes: approvalNotes,
  });
  if (!validation.success) {
    after(() => {
      console.error(
        "[updateApprovalStatus] Validation failed:",
        validation.error,
      );
    });
    return {
      success: false,
      error: "Invalid input",
    };
  }

  // Verify task access
  const taskCheck = await verifyTaskAccess(supabase, taskId, companyId);
  if ("error" in taskCheck) {
    return { success: false, error: taskCheck.error as string };
  }

  const { task: existingTask, projectId } = taskCheck;

  // Verify task is an approval-type task
  if (existingTask.task_type !== "approval") {
    after(() => {
      console.error(
        "[updateApprovalStatus] Task is not an approval type:",
        existingTask.task_type,
      );
    });
    return {
      success: false,
      error: "Only approval-type tasks can have their approval status updated",
    };
  }

  // Only Admin and PM can approve/reject tasks
  if (role !== "admin" && role !== "project_manager") {
    return {
      success: false,
      error: "Insufficient permissions to update approval status",
    };
  }

  // Prepare update
  const taskUpdate: TaskUpdate = {
    approval_status: approvalStatus,
    approval_notes: approvalNotes || null,
    approved_by: userId,
    approved_at: new Date().toISOString(),
  };

  // If approved, also update task status to completed
  if (approvalStatus === "approved") {
    taskUpdate.status = "completed";
    taskUpdate.completed_at = new Date().toISOString();
  } else if (
    approvalStatus === "rejected" ||
    approvalStatus === "revision_requested"
  ) {
    // Keep task in review or blocked status for rejected/revision tasks
    taskUpdate.status = "blocked";
    taskUpdate.blocked_reason =
      approvalStatus === "rejected"
        ? `Rejected: ${approvalNotes || "No reason provided"}`
        : `Revision requested: ${approvalNotes || "No details provided"}`;
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
      console.error("[updateApprovalStatus] Error updating task:", updateError);
    });
    return {
      success: false,
      error: "Failed to update approval status. Please try again.",
    };
  }

  if (process.env.NODE_ENV === "development") {
    console.log("[updateApprovalStatus] Task updated successfully:", task.id);
  }

  // Log activity
  await logTaskActivity(
    supabase,
    taskId,
    userId,
    "status_changed",
    existingTask.approval_status || "pending",
    approvalStatus,
    approvalNotes,
  );

  // Notify task creator and assignee about approval decision
  const notifyUsers = new Set<string>();
  if (existingTask.created_by && existingTask.created_by !== userId) {
    notifyUsers.add(existingTask.created_by);
  }
  if (existingTask.assignee_id && existingTask.assignee_id !== userId) {
    notifyUsers.add(existingTask.assignee_id);
  }

  const statusMessages: Record<ApprovalStatus, string> = {
    pending: "is pending approval",
    approved: "has been approved",
    rejected: "has been rejected",
    revision_requested: "requires revision",
  };

  // CRITICAL OPTIMIZATION (CRIT-003): Batch notification inserts (final location)
  // Estimated savings: N × 50ms → 50ms (200-500ms for 10 notifications)
  if (notifyUsers.size > 0) {
    const approvalNotifications = Array.from(notifyUsers).map(
      (notifyUserId) => ({
        user_id: notifyUserId,
        type: "system" as const, // Using 'system' for approval workflow notifications
        title: `Approval ${approvalStatus === "approved" ? "Granted" : "Update"}`,
        message: `Task "${existingTask.title}" ${statusMessages[approvalStatus]}`,
        link: `/app/tasks/${taskId}`,
      }),
    );

    const { error: notificationError } = await supabase
      .from("notifications")
      .insert(approvalNotifications);

    if (notificationError) {
      after(() => {
        console.error(
          "[updateApprovalStatus] Error sending notifications:",
          notificationError,
        );
      });
    }
  }

  // Revalidate paths
  revalidatePath("/app/tasks");
  revalidatePath(`/app/tasks/${taskId}`);
  revalidatePath(`/app/projects/${projectId}`);

  return { success: true, data: task };
}

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
): Promise<ActionResult<any[]>> {
  // Get user context
  const userContext = await getUserContext();
  if ("error" in userContext) {
    return { success: false, error: userContext.error as string };
  }

  const { companyId, supabase } = userContext;

  // Verify project access
  const projectCheck = await verifyProjectAccess(
    supabase,
    projectId,
    companyId,
  );
  if ("error" in projectCheck) {
    return { success: false, error: projectCheck.error as string };
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
    after(() => {
      console.error("Error fetching tasks:", error);
    });
    return { success: false, error: "Failed to load tasks" };
  }

  return { success: true, data: tasks };
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
    after(() => {
      console.error("Error updating task due date:", updateError);
    });
    return { error: "Failed to update task date" };
  }

  // Log activity
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

  // Invalidate dashboard cache (task due date changed)
  await invalidateDashboardCache({ companyId });

  return { success: true, data: task };
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
    after(() => {
      console.error("Error updating task dates:", updateError);
    });
    return { error: "Failed to update task dates" };
  }

  // Log activity
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

  return { success: true, data: task };
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
    after(() => {
      console.error("Error fetching dependencies:", error);
    });
    return { error: "Failed to load dependencies", dependencies: [] };
  }

  return { success: true, dependencies: dependencies || [] };
}

// ============================================
// P4.2 - SPATIAL MARKER INTEGRATION
// ============================================

/**
 * Link a task to a spatial marker
 * @param taskId - Task UUID
 * @param markerId - Spatial marker UUID
 */
export async function linkTaskToMarker(taskId: string, markerId: string) {
  if (process.env.NODE_ENV === "development") {
    console.log(
      "[linkTaskToMarker] Linking task:",
      taskId,
      "to marker:",
      markerId,
    );
  }

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
    after(() => {
      console.error("[linkTaskToMarker] Error:", updateError);
    });
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

  if (process.env.NODE_ENV === "development") {
    console.log("[linkTaskToMarker] Task linked successfully");
  }
  return { success: true, task: updatedTask };
}

/**
 * Get all tasks linked to a spatial marker
 * @param markerId - Spatial marker UUID
 */
export async function getTasksByMarker(markerId: string) {
  if (process.env.NODE_ENV === "development") {
    console.log("[getTasksByMarker] Fetching tasks for marker:", markerId);
  }

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
    after(() => {
      console.error("[getTasksByMarker] Error:", error);
    });
    return { error: "Failed to fetch tasks" };
  }

  if (process.env.NODE_ENV === "development") {
    console.log("[getTasksByMarker] Found", tasks?.length || 0, "tasks");
  }
  return { success: true, tasks: tasks || [] };
}

/**
 * Activity logger for task status changes that creates marker activity content
 * This is called automatically when task status changes to 'completed'
 */
export async function logTaskCompletionToMarker(taskId: string) {
  if (process.env.NODE_ENV === "development") {
    console.log(
      "[logTaskCompletionToMarker] Logging task completion for:",
      taskId,
    );
  }

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
    after(() => {
      console.error(
        "[logTaskCompletionToMarker] Error creating activity:",
        contentError,
      );
    });
    return { error: "Failed to log activity to marker" };
  }

  // Revalidate spatial view
  revalidatePath(`/app/projects/${task.project_id}/spatial`);

  if (process.env.NODE_ENV === "development") {
    console.log("[logTaskCompletionToMarker] Activity logged successfully");
  }
  return { success: true };
}

// ============================================
// P4 - TASK DETAIL PANEL SERVER ACTIONS
// ============================================

/**
 * Get full task details with related data for Task Detail Panel (Phase 4)
 * Fetches task with assignee, phase, spatial marker, and related counts
 * @param taskId - Task UUID
 * @returns TaskDetails object or error
 */
export async function getTaskDetails(taskId: string): Promise<
  ActionResult<{
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
  }>
> {
  if (process.env.NODE_ENV === "development") {
    console.log("[getTaskDetails] Fetching details for task:", taskId);
  }

  // Get user context
  const userContext = await getUserContext();
  if ("error" in userContext) {
    return { success: false, error: userContext.error as string };
  }

  const { companyId, supabase } = userContext;

  // Verify task access
  const taskCheck = await verifyTaskAccess(supabase, taskId, companyId);
  if ("error" in taskCheck) {
    return { success: false, error: taskCheck.error as string };
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
    after(() => {
      console.error("[getTaskDetails] Error fetching task:", taskError);
    });
    return { success: false, error: "Task not found" };
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

  if (process.env.NODE_ENV === "development") {
    console.log("[getTaskDetails] Task details fetched successfully", {
      taskId,
      materialCount,
      expenseCount,
      attachmentCount,
    });
  }

  return { success: true, data: taskDetails };
}

/**
 * Get chronological activity log for a task (Phase 4)
 * Fetches activity from task_activity table with user details
 * @param taskId - Task UUID
 * @returns Array of activity logs or error
 */
export async function getTaskActivity(taskId: string): Promise<
  ActionResult<
    Array<{
      id: string;
      action: ActivityAction;
      user_name: string;
      timestamp: string;
      old_value?: string;
      new_value?: string;
      comment?: string;
    }>
  >
> {
  if (process.env.NODE_ENV === "development") {
    console.log("[getTaskActivity] Fetching activity for task:", taskId);
  }

  // Get user context
  const userContext = await getUserContext();
  if ("error" in userContext) {
    return { success: false, error: userContext.error as string };
  }

  const { companyId, supabase } = userContext;

  // Verify task access
  const taskCheck = await verifyTaskAccess(supabase, taskId, companyId);
  if ("error" in taskCheck) {
    return { success: false, error: taskCheck.error as string };
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
    after(() => {
      console.error("[getTaskActivity] Error fetching activity:", activityError);
    });
    return { success: false, error: "Failed to fetch activity log" };
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

  if (process.env.NODE_ENV === "development") {
    console.log("[getTaskActivity] Activity log fetched successfully", {
      taskId,
      activityCount: activityLog.length,
    });
  }

  return { success: true, data: activityLog };
}

/**
 * Get attachments for a task (Phase 4)
 * Fetches all non-deleted attachments linked to a task
 * @param taskId - Task UUID
 * @returns Array of attachments or error
 */
export async function getTaskAttachments(taskId: string): Promise<
  ActionResult<
    Array<{
      id: string;
      file_name: string;
      file_url: string;
      file_type?: string | null;
      file_size?: number | null;
      created_at: string;
    }>
  >
> {
  if (process.env.NODE_ENV === "development") {
    console.log("[getTaskAttachments] Fetching attachments for task:", taskId);
  }

  // Get user context
  const userContext = await getUserContext();
  if ("error" in userContext) {
    return { success: false, error: userContext.error as string };
  }

  const { companyId, supabase } = userContext;

  // Verify task access
  const taskCheck = await verifyTaskAccess(supabase, taskId, companyId);
  if ("error" in taskCheck) {
    return { success: false, error: taskCheck.error as string };
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
    after(() => {
      console.error(
        "[getTaskAttachments] Error fetching attachments:",
        attachmentsError,
      );
    });
    return { success: false, error: "Failed to fetch attachments" };
  }

  if (process.env.NODE_ENV === "development") {
    console.log("[getTaskAttachments] Attachments fetched successfully", {
      taskId,
      attachmentCount: attachments?.length || 0,
    });
  }

  return { success: true, data: attachments || [] };
}

// ============================================
// Task Analytics
// ============================================

/**
 * Get comprehensive task analytics for a project or all projects
 * Returns 10 key metrics: completion, schedule, budget, blocked, workload,
 * materials, priority, expenses, dependencies, velocity
 *
 * @param projectFilter - 'all' or project UUID to filter analytics
 * @param companyId - Company UUID for RLS filtering
 * @returns TaskAnalytics data or error
 */
export async function getTaskAnalytics(
  projectFilter: string = "all",
  companyId: string,
): Promise<ActionResult<import("@/types/analytics").TaskAnalytics>> {
  try {
    if (process.env.NODE_ENV === "development") {
      console.log("[getTaskAnalytics] Fetching analytics", {
        projectFilter,
        companyId,
      });
    }

    // Auth check: require authenticated user
    const session = await auth();
    if (!session?.user?.id) {
      after(() => {
        console.error("[getTaskAnalytics] Not authenticated");
      });
      return { success: false, error: "Not authenticated" };
    }

    // Input validation
    const validationSchema = z.object({
      projectFilter: z.union([
        z.literal("all"),
        z.string().uuid("Invalid project ID"),
      ]),
      companyId: z.string().uuid("Invalid company ID"),
    });

    const validationResult = validationSchema.safeParse({
      projectFilter,
      companyId,
    });
    if (!validationResult.success) {
      after(() => {
        console.error(
          "[getTaskAnalytics] Validation failed:",
          validationResult.error,
        );
      });
      return { success: false, error: "Invalid input parameters" };
    }

    // Create Supabase client
    const supabase = await createClient();

    // SECURITY: Verify user belongs to the requested company
    const { data: userCompany, error: companyError } = await supabase
      .from("company_users")
      .select("company_id")
      .eq("user_id", session.user.id)
      .eq("company_id", companyId)
      .eq("status", "active")
      .single();

    if (companyError || !userCompany) {
      after(() => {
        console.error(
          "[getTaskAnalytics] User does not belong to company:",
          companyId,
        );
      });
      return { success: false, error: "Unauthorized" };
    }

    // SECURITY: If projectFilter is not 'all', verify project belongs to the company
    if (projectFilter !== "all") {
      const { data: project, error: projectError } = await supabase
        .from("projects")
        .select("company_id")
        .eq("id", projectFilter)
        .single();

      if (projectError || !project || project.company_id !== companyId) {
        after(() => {
          console.error(
            "[getTaskAnalytics] Project does not belong to company:",
            { projectFilter, companyId },
          );
        });
        return { success: false, error: "Invalid project" };
      }
    }

    // Call optimized PostgreSQL function
    const { data, error } = await supabase.rpc("get_task_analytics", {
      project_filter: projectFilter,
      p_company_id: companyId,
    });

    if (error) {
      after(() => {
        console.error("[getTaskAnalytics] RPC error:", error);
      });
      return { success: false, error: "Failed to fetch analytics" };
    }

    // Handle empty result set
    if (!data || data.length === 0) {
      if (process.env.NODE_ENV === "development") {
        console.warn("[getTaskAnalytics] No data returned");
      }
      // Return empty analytics structure
      return {
        success: true,
        data: {
          completion: { total: 0, completed: 0, rate: 0 },
          schedule: { overdue: 0, atRisk: 0, onTime: 0 },
          budget: { planned: 0, actual: 0, variance: 0, utilization: 0 },
          blocked: { count: 0, rate: 0, topReasons: [] },
          workload: { unassigned: 0, topAssignees: [] },
          materials: { needed: 0, ordered: 0, delivered: 0 },
          priority: { high: 0, medium: 0, low: 0 },
          expenses: {
            pending: 0,
            pendingAmount: 0,
            approved: 0,
            approvedAmount: 0,
          },
          dependencies: { blockedByDeps: 0, ready: 0 },
          velocity: { tasksPerDay: 0, trend: 0 },
        },
      };
    }

    // Extract first row (function returns single row)
    const row = data[0];

    // Transform database result to TaskAnalytics interface
    const analytics: import("@/types/analytics").TaskAnalytics = {
      completion: {
        total: Number(row.total_tasks) || 0,
        completed: Number(row.completed) || 0,
        rate: Number(row.completion_rate) || 0,
      },
      schedule: {
        overdue: Number(row.overdue) || 0,
        atRisk: Number(row.at_risk) || 0,
        onTime: Number(row.on_time) || 0,
      },
      budget: {
        planned: Number(row.total_planned) || 0,
        actual: Number(row.total_actual) || 0,
        variance: Number(row.budget_variance) || 0,
        utilization: Number(row.budget_utilization) || 0,
      },
      blocked: {
        count: Number(row.blocked_count) || 0,
        rate: Number(row.blocked_rate) || 0,
        topReasons: (row.top_blocked_reasons as string[] | null) || [],
      },
      workload: {
        unassigned: Number(row.unassigned) || 0,
        topAssignees:
          (row.top_assignees_json as Array<{
            id: string;
            name: string;
            avatar_url: string | null;
            count: number;
          }> | null) || [],
      },
      materials: {
        needed: Number(row.materials_needed) || 0,
        ordered: Number(row.materials_ordered) || 0,
        delivered: Number(row.materials_delivered) || 0,
      },
      priority: {
        high: Number(row.priority_high) || 0,
        medium: Number(row.priority_medium) || 0,
        low: Number(row.priority_low) || 0,
      },
      expenses: {
        pending: Number(row.expenses_pending) || 0,
        pendingAmount: Number(row.pending_amount) || 0,
        approved: Number(row.expenses_approved) || 0,
        approvedAmount: Number(row.approved_amount) || 0,
      },
      dependencies: {
        blockedByDeps: Number(row.blocked_by_deps) || 0,
        ready: Number(row.ready_to_start) || 0,
      },
      velocity: {
        tasksPerDay: Number(row.tasks_per_day) || 0,
        trend: Number(row.velocity_trend) || 0,
      },
    };

    if (process.env.NODE_ENV === "development") {
      console.log("[getTaskAnalytics] Analytics fetched successfully", {
        totalTasks: analytics.completion.total,
        completionRate: analytics.completion.rate,
      });
    }

    return { success: true, data: analytics };
  } catch (error) {
    after(() => {
      console.error("[getTaskAnalytics] Unexpected error:", error);
    });
    return { success: false, error: "An unexpected error occurred" };
  }
}
