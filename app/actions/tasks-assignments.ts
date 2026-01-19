"use server";

import { revalidatePath } from "next/cache";
import { after } from "next/server";
import { z } from "zod";
import { getUserContext } from "@/lib/auth-context";
import { verifyProjectAccess, verifyTaskAccess } from "@/lib/tasks-utils";
import type { createClient } from "@/utils/supabase/server";

// ============================================
// Types
// ============================================

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

// ============================================
// Validation Schemas
// ============================================

const setPrimaryAssigneeSchema = z.object({
  taskId: z.string().uuid("Invalid task ID"),
  assigneeId: z.string().uuid("Invalid assignee ID"),
  assigneeType: z.enum(["user", "subcontractor"]),
});

// ============================================
// Server Actions
// ============================================

/**
 * Get all assignable users and subcontractors for a project
 * Returns combined list of ALL company team members + ALL company subcontractors
 */
export async function getProjectAssignees(projectId: string): Promise<{
  data?: AssigneeOption[];
  error?: string;
}> {
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

  // Transform into unified assignee options
  const assignees: AssigneeOption[] = [];

  // Fetch ALL company team members + subcontractors in parallel
  const [companyUsersResult, subsResult] = await Promise.all([
    supabase
      .from("company_users")
      .select(
        `
        user_id,
        user_profiles!inner (
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
    return { error: "Failed to fetch team members" };
  }

  companyUsers?.forEach((cu) => {
    const user = cu.user_profiles as unknown as {
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

  return { data: uniqueAssignees };
}

/**
 * Manage task assignees - insert new assignees for a task
 */
export async function insertTaskAssignees(
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
export async function updateTaskAssignees(
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

/**
 * Remove a single assignee from a task
 */
export async function removeTaskAssignee(
  taskId: string,
  assigneeId: string,
  assigneeType: "user" | "subcontractor",
): Promise<{ success: boolean; error?: string }> {
  const userContext = await getUserContext();
  if ("error" in userContext) {
    return { success: false, error: userContext.error };
  }

  const { companyId, supabase } = userContext;

  // Verify task access
  const taskCheck = await verifyTaskAccess(supabase, taskId, companyId);
  if ("error" in taskCheck) {
    return { success: false, error: taskCheck.error };
  }

  const { projectId } = taskCheck;

  // Build the query based on assignee type
  const assigneeColumn =
    assigneeType === "user" ? "user_id" : "subcontractor_id";

  // Remove the assignee
  const { error: deleteError } = await supabase
    .from("task_assignees")
    .delete()
    .eq("task_id", taskId)
    .eq(assigneeColumn, assigneeId);

  if (deleteError) {
    after(() => {
      console.error("[removeTaskAssignee] Error:", deleteError);
    });
    return { success: false, error: "Failed to remove assignee" };
  }

  // Revalidate paths
  revalidatePath("/app/tasks");
  revalidatePath(`/app/tasks/${taskId}`);
  revalidatePath(`/app/projects/${projectId}`);

  return { success: true };
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
  after(() => {
    console.log("[setPrimaryAssignee] Setting primary assignee:", {
      taskId,
      assigneeId,
      assigneeType,
    });
  });

  // Validate inputs
  const validation = setPrimaryAssigneeSchema.safeParse({
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
    return { success: false, error: userContext.error };
  }

  const { companyId, supabase } = userContext;

  // Verify task access
  const taskCheck = await verifyTaskAccess(supabase, taskId, companyId);
  if ("error" in taskCheck) {
    return { success: false, error: taskCheck.error };
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

  after(() => {
    console.log("[setPrimaryAssignee] Primary assignee set successfully");
  });
  return { success: true };
}
