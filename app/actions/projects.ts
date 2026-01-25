"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { cache } from "react";
import { z } from "zod";
import { createClient } from "@/utils/supabase/server";
import { getUserContext } from "@/lib/auth/user-context";
import type {
  ProjectsRow,
  ProjectsInsert,
  ProjectsUpdate,
} from "@/types/db/tables/projects";
import type { UserRole } from "@/types/db/enums";

type Project = ProjectsRow;
type ProjectInsert = ProjectsInsert;
type ProjectUpdate = ProjectsUpdate;

// ============================================
// Project Stats Types (for enhanced ProjectCard)
// ============================================

export interface TaskCounts {
  total: number;
  completed: number;
  in_progress: number;
  blocked: number;
  overdue: number;
  todo: number;
}

export interface ScheduleStatus {
  daysRemaining: number;
  status: "on-time" | "at-risk" | "delayed";
  daysBehind: number;
}

export interface MaterialsStatus {
  needed: number;
  ordered: number;
  delivered: number;
}

export interface ExpenseStats {
  total: number;
  approved: number;
  pending: number;
  rejected: number;
  totalAmount: number;
  approvedAmount: number;
  pendingAmount: number;
  rejectedAmount: number;
}

export interface TaskStats {
  // Core Counts
  total: number;
  completed: number;
  inProgress: number;
  blocked: number;
  overdue: number;

  // Budget (Primary Focus)
  totalPlannedCost: number;
  totalActualCost: number;
  budgetVariance: number; // planned - actual (positive = under budget)
  budgetUtilization: number; // actual / planned * 100

  // Workload Distribution
  unassignedCount: number;
  topAssignees: Array<{
    id: string;
    name: string;
    avatar_url: string | null;
    taskCount: number;
  }>;

  // Material Impact
  tasksWithMaterials: number;
  totalMaterialCost: number;
}

export interface ProjectStats {
  actualSpent: number;
  plannedCost: number;
  budgetVariance: number;
  isUnderBudget: boolean;
  taskCounts: TaskCounts;
  schedule: ScheduleStatus;
  materials: MaterialsStatus;
  teamSize: number;
  expenses: ExpenseStats;
}

export interface ProjectWithStats extends Project {
  stats: ProjectStats;
  project_phases?: Array<{
    id: string;
    name: string;
    order_index: number;
    status: string;
    completion_percentage: number | null;
  }>;
  project_team?: Array<{
    id: string;
    user_id: string | null;
    role: string;
  }>;
}

// ============================================
// Validation Schemas
// ============================================

const createProjectSchema = z.object({
  name: z.string().min(1, "Project name is required").max(200),
  client_name: z.string().min(1, "Client name is required").max(200),
  client_email: z.string().email("Invalid email").optional().or(z.literal("")),
  client_phone: z.string().optional(),
  address: z.string().min(1, "Address is required"),
  city: z.string().optional(),
  state: z.string().optional(),
  zip_code: z.string().optional(),
  // Accept either UUID (from database config) or legacy string enum
  // Validation happens at runtime against database configs
  project_type: z.string().min(1, "Project type is required"),
  description: z.string().optional(),
  start_date: z.string().min(1, "Start date is required"), // ISO date string
  end_date: z.string().optional().or(z.literal("")),
  budget: z
    .number()
    .positive("Budget must be positive")
    .optional()
    .or(z.literal(0)),
});

const updateProjectSchema = z.object({
  id: z.string().uuid("Invalid project ID"),
  name: z.string().min(1, "Project name is required").max(200).optional(),
  client_name: z.string().min(1, "Client name is required").max(200).optional(),
  client_email: z.string().email("Invalid email").optional().or(z.literal("")),
  client_phone: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zip_code: z.string().optional(),
  // Accept either UUID (from database config) or legacy string enum
  project_type: z.string().optional(),
  description: z.string().optional(),
  start_date: z.string().optional(),
  end_date: z.string().optional().or(z.literal("")),
  budget: z
    .number()
    .positive("Budget must be positive")
    .optional()
    .or(z.literal(0)),
});

const updateProjectStatusSchema = z.object({
  id: z.string().uuid("Invalid project ID"),
  status: z.enum(["active", "on_hold", "completed", "archived"]),
});

// ============================================
// Server Actions
// ============================================

export async function createProject(formData: FormData) {
  // Get user's company and role
  const userContext = await getUserContext();
  if ("error" in userContext) {
    console.error("User context error:", userContext.error);
    return { error: userContext.error };
  }

  const { userId, companyId, role, supabase } = userContext;
  if (process.env.NODE_ENV === "development") {
    console.log("[createProject] Creating project with context:", { userId, companyId, role });
  }

  // Check permissions - only Admin and Project Manager can create projects
  if (role !== "admin" && role !== "project_manager") {
    return { error: "Insufficient permissions to create projects" };
  }

  // Parse and validate form data
  const rawData = {
    name: formData.get("name"),
    client_name: formData.get("client_name"),
    client_email: formData.get("client_email") || "",
    client_phone: formData.get("client_phone") || "",
    address: formData.get("address"),
    city: formData.get("city") || "",
    state: formData.get("state") || "",
    zip_code: formData.get("zip_code") || "",
    project_type: formData.get("project_type"),
    description: formData.get("description") || "",
    start_date: formData.get("start_date"),
    end_date: formData.get("end_date") || "",
    budget: formData.get("budget")
      ? parseFloat(formData.get("budget") as string)
      : 0,
  };

  const validation = createProjectSchema.safeParse(rawData);

  if (!validation.success) {
    const errors = validation.error.flatten().fieldErrors;
    return { error: "Validation failed", fieldErrors: errors };
  }

  const data = validation.data;

  // Step 1: Look up project_type_config
  // The project_type value can be either:
  // - A UUID from database config (new approach)
  // - A legacy string like "residential" (backward compatibility)
  let projectTypeConfig: { id: string; name: string } | null = null;
  let projectTypeValue = data.project_type;

  // Check if it's a UUID (36 chars with hyphens)
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(data.project_type);

  if (isUuid) {
    // New approach: Look up config by ID
    const { data: config } = await supabase
      .from("project_type_configs")
      .select("id, name")
      .eq("id", data.project_type)
      .eq("company_id", companyId)
      .eq("is_active", true)
      .maybeSingle();

    if (config) {
      projectTypeConfig = config;
      // Convert config name to slug for project_type (now text, not enum)
      projectTypeValue = config.name.toLowerCase().replace(/\s+/g, '_');
    }
  } else {
    // Legacy approach: Look up config by name mapping
    const mapProjectTypeToConfigName = (projectType: string): string => {
      const mapping: Record<string, string> = {
        residential: "Residential",
        restaurant: "Restaurant",
        cafe: "Cafe",
        commercial_office: "Commercial Office",
        industrial: "Industrial",
      };
      return mapping[projectType] || projectType;
    };

    const projectTypeConfigName = mapProjectTypeToConfigName(data.project_type);
    const { data: config } = await supabase
      .from("project_type_configs")
      .select("id, name")
      .eq("company_id", companyId)
      .eq("name", projectTypeConfigName)
      .eq("is_active", true)
      .maybeSingle();

    if (config) {
      projectTypeConfig = config;
    }
  }

  if (process.env.NODE_ENV === "development") {
    console.log(
      `[createProject] Project type: ${data.project_type} (isUuid: ${isUuid}), Config found: ${projectTypeConfig?.id || 'none'}`,
    );
  }

  // Prepare project data for insertion
  const projectData: ProjectInsert = {
    company_id: companyId,
    name: data.name,
    client_name: data.client_name,
    client_email: data.client_email || null,
    client_phone: data.client_phone || null,
    address: data.address,
    city: data.city || null,
    state: data.state || null,
    zip_code: data.zip_code || null,
    project_type: projectTypeValue, // Text field - supports custom type names
    project_type_config_id: projectTypeConfig?.id || null, // Set this for trigger
    description: data.description || null,
    start_date: data.start_date,
    end_date: data.end_date || null,
    budget: data.budget || null,
    status: "active",
    created_by: userId,
  };

  if (process.env.NODE_ENV === "development") {
    console.log(
      `[createProject] Inserting project with project_type_config_id: ${projectData.project_type_config_id}`,
    );
  }

  // Insert project - trigger will auto-create phases/tasks if project_type_config_id is set
  const { data: project, error: insertError } = await supabase
    .from("projects")
    .insert(projectData)
    .select()
    .single();

  if (insertError) {
    console.error("Error creating project:", insertError);
    console.error("Error details:", {
      code: insertError.code,
      message: insertError.message,
      details: insertError.details,
      hint: insertError.hint,
    });
    return {
      error: `Failed to create project: ${insertError.message}`,
      details: process.env.NODE_ENV === "development" ? insertError : undefined,
    };
  }

  // ============================================================================
  // Phase and task creation is now handled by database trigger:
  // - Trigger: create_phases_and_tasks_on_project_insert
  // - Function: create_phases_and_tasks_from_templates()
  // - Migration: 045_auto_create_phases_tasks_from_templates.sql
  //
  // The trigger automatically creates phases and tasks from templates when:
  // 1. project_type_config_id is set (uses database templates)
  // 2. project_type_config_id is null (creates 5 universal phases as fallback)
  // ============================================================================
  if (process.env.NODE_ENV === "development") {
    console.log(
      `[createProject] ✅ Project created - trigger will handle phase/task creation`,
    );
  }

  // ============================================================================
  // NEW: Assign default 3D model and create pre-configured markers
  // ============================================================================
  try {
    if (process.env.NODE_ENV === "development") {
      console.log("[createProject] Attempting to assign default 3D model");
    }

    // Import default model functions
    const { assignDefaultModel, createMarkersFromDefaultConfigs } =
      await import("./default-models");

    // Step 1: Assign default model to project
    const defaultModel = await assignDefaultModel({
      projectId: project.id,
      projectType: projectTypeValue,
    });

    if (defaultModel) {
      if (process.env.NODE_ENV === "development") {
        console.log(
          "[createProject] ✅ Assigned default model:",
          defaultModel.id,
        );
      }

      // Step 2: Fetch all created tasks for marker auto-linking
      const { data: createdTasks, error: tasksError } = await supabase
        .from("tasks")
        .select("id, title, phase_id")
        .eq("project_id", project.id);

      if (tasksError) {
        console.error(
          "[createProject] Error fetching tasks for marker creation:",
          tasksError,
        );
      } else if (createdTasks && createdTasks.length > 0) {
        if (process.env.NODE_ENV === "development") {
          console.log(
            "[createProject] Fetched tasks for marker linking:",
            createdTasks.length,
          );
        }

        // Step 3: Create markers from default configs with auto-linking
        // Type: createdTasks has { id, title, phase_id } which matches Task in default-models.ts
        const createdMarkers = await createMarkersFromDefaultConfigs({
          projectId: project.id,
          modelId: defaultModel.id,
          tasks: createdTasks,
        });

        if (createdMarkers && createdMarkers.length > 0) {
          const matchStats = {
            total: createdMarkers.length,
            matched: createdMarkers.filter((m) => m.task_id).length,
            unmatched: createdMarkers.filter((m) => !m.task_id).length,
          };

          if (process.env.NODE_ENV === "development") {
            console.log(
              `[createProject] ✅ Created markers from default configs: ${matchStats.total} (${matchStats.matched} auto-linked to tasks, ${matchStats.unmatched} unlinked)`,
            );

            if (matchStats.unmatched > 0) {
              console.warn(
                `[createProject] ⚠️ Marker auto-linking incomplete. Matched: ${matchStats.matched}/${matchStats.total}. ` +
                  `Review task template titles in default marker configs.`,
              );
            }
          }
        } else {
          if (process.env.NODE_ENV === "development") {
            console.log(
              "[createProject] No markers created from default configs",
            );
          }
        }
      } else {
        if (process.env.NODE_ENV === "development") {
          console.log("[createProject] No tasks found for marker linking");
        }
      }
    } else {
      if (process.env.NODE_ENV === "development") {
        console.log(
          "[createProject] No default model available for project type:",
          projectTypeValue,
        );
      }
    }
  } catch (defaultModelError) {
    console.error(
      "[createProject] Error in default model assignment:",
      defaultModelError,
    );
    // Don't fail project creation if default model fails
  }

  // Refresh materialized view to update dashboard KPIs immediately
  try {
    await supabase.rpc("refresh_dashboard_kpis");
    if (process.env.NODE_ENV === "development") {
      console.log("[createProject] ✅ Refreshed dashboard KPIs materialized view");
    }
  } catch (refreshError) {
    console.error("[createProject] Failed to refresh dashboard KPIs:", refreshError);
    // Don't fail project creation if refresh fails - view will refresh on schedule
  }

  // Revalidate projects list and related caches
  revalidatePath("/app/projects");
  revalidatePath("/app");
  revalidateTag("projects", "max");
  revalidateTag("dashboard", "max");

  return { success: true, project };
}

export async function updateProject(formData: FormData) {
  // Get user's company and role
  const userContext = await getUserContext();
  if ("error" in userContext) {
    return { error: userContext.error };
  }

  const { companyId, role, supabase } = userContext;

  // Check permissions
  if (role !== "admin" && role !== "project_manager") {
    return { error: "Insufficient permissions to update projects" };
  }

  // Parse and validate form data
  const rawData = {
    id: formData.get("id"),
    name: formData.get("name"),
    client_name: formData.get("client_name"),
    client_email: formData.get("client_email") || "",
    client_phone: formData.get("client_phone") || "",
    address: formData.get("address"),
    city: formData.get("city") || "",
    state: formData.get("state") || "",
    zip_code: formData.get("zip_code") || "",
    project_type: formData.get("project_type"),
    description: formData.get("description") || "",
    start_date: formData.get("start_date"),
    end_date: formData.get("end_date") || "",
    budget: formData.get("budget")
      ? parseFloat(formData.get("budget") as string)
      : 0,
  };

  const validation = updateProjectSchema.safeParse(rawData);

  if (!validation.success) {
    const errors = validation.error.flatten().fieldErrors;
    return { error: "Validation failed", fieldErrors: errors };
  }

  const { id, ...updateData } = validation.data;

  // Verify project belongs to user's company
  const { data: existingProject, error: fetchError } = await supabase
    .from("projects")
    .select("company_id")
    .eq("id", id)
    .single();

  if (fetchError || !existingProject) {
    return { error: "Project not found" };
  }

  if (existingProject.company_id !== companyId) {
    return { error: "Insufficient permissions to update this project" };
  }

  // Prepare update data
  // Cast project_type to any since it can now be a UUID or legacy enum string
  const projectUpdate: ProjectUpdate = {
    ...updateData,
    project_type: updateData.project_type as any,
    client_email: updateData.client_email || null,
    client_phone: updateData.client_phone || null,
    city: updateData.city || null,
    state: updateData.state || null,
    zip_code: updateData.zip_code || null,
    description: updateData.description || null,
    end_date: updateData.end_date || null,
    budget: updateData.budget || null,
  };

  // Update project
  const { data: project, error: updateError } = await supabase
    .from("projects")
    .update(projectUpdate)
    .eq("id", id)
    .select()
    .single();

  if (updateError) {
    console.error("Error updating project:", updateError);
    return { error: "Failed to update project. Please try again." };
  }

  // Revalidate paths and related caches
  revalidatePath("/app/projects");
  revalidatePath(`/app/projects/${id}`);
  revalidateTag("projects", "max");
  revalidateTag(`project-${id}`, "max");

  return { success: true, project };
}

export async function updateProjectStatus(
  projectId: string,
  status: "active" | "on_hold" | "completed" | "archived",
) {
  // Get user's company and role
  const userContext = await getUserContext();
  if ("error" in userContext) {
    return { error: userContext.error };
  }

  const { companyId, role, supabase } = userContext;

  // Check permissions
  if (role !== "admin" && role !== "project_manager") {
    return { error: "Insufficient permissions to update project status" };
  }

  // Validate input
  const validation = updateProjectStatusSchema.safeParse({
    id: projectId,
    status,
  });

  if (!validation.success) {
    return { error: "Invalid input" };
  }

  // Verify project belongs to user's company
  const { data: existingProject, error: fetchError } = await supabase
    .from("projects")
    .select("company_id")
    .eq("id", projectId)
    .single();

  if (fetchError || !existingProject) {
    return { error: "Project not found" };
  }

  if (existingProject.company_id !== companyId) {
    return { error: "Insufficient permissions to update this project" };
  }

  // Update project status
  const { data: project, error: updateError } = await supabase
    .from("projects")
    .update({ status })
    .eq("id", projectId)
    .select()
    .single();

  if (updateError) {
    console.error("Error updating project status:", updateError);
    return { error: "Failed to update project status. Please try again." };
  }

  // Refresh materialized view to update dashboard KPIs immediately
  try {
    await supabase.rpc("refresh_dashboard_kpis");
    if (process.env.NODE_ENV === "development") {
      console.log("[updateProjectStatus] ✅ Refreshed dashboard KPIs materialized view");
    }
  } catch (refreshError) {
    console.error("[updateProjectStatus] Failed to refresh dashboard KPIs:", refreshError);
    // Don't fail project update if refresh fails - view will refresh on schedule
  }

  // Revalidate paths and related caches
  revalidatePath("/app/projects");
  revalidatePath(`/app/projects/${projectId}`);
  revalidateTag("projects", "max");
  revalidateTag(`project-${projectId}`, "max");
  revalidateTag("dashboard", "max");

  return { success: true, project };
}

export async function addProjectTeamMember(
  projectId: string,
  userId: string,
  userRole: string,
) {
  if (process.env.NODE_ENV === "development") {
    console.log(
      "[addProjectTeamMember] Starting - Project:",
      projectId,
      "User:",
      userId,
      "Role:",
      userRole,
    );
  }

  // Get user's company and role
  const userContext = await getUserContext();
  if ("error" in userContext) {
    console.error(
      "[addProjectTeamMember] User context error:",
      userContext.error,
    );
    return { error: userContext.error };
  }

  const { companyId, role, supabase } = userContext;
  if (process.env.NODE_ENV === "development") {
    console.log("[addProjectTeamMember] User context:", { companyId, role });
  }

  // Check permissions
  if (role !== "admin" && role !== "project_manager") {
    if (process.env.NODE_ENV === "development") {
      console.error(
        "[addProjectTeamMember] Insufficient permissions - User role:",
        role,
      );
    }
    return { error: "Insufficient permissions to add team members" };
  }

  // Verify project belongs to user's company
  const { data: existingProject, error: fetchError } = await supabase
    .from("projects")
    .select("company_id")
    .eq("id", projectId)
    .single();

  if (fetchError || !existingProject) {
    console.error("[addProjectTeamMember] Project not found:", fetchError);
    return { error: "Project not found" };
  }

  if (existingProject.company_id !== companyId) {
    if (process.env.NODE_ENV === "development") {
      console.error("[addProjectTeamMember] Project company mismatch");
    }
    return { error: "Insufficient permissions to manage this project team" };
  }

  if (process.env.NODE_ENV === "development") {
    console.log("[addProjectTeamMember] Project verified");
  }

  // Check if user is already on the team
  const { data: existingMember, error: checkError } = await supabase
    .from("project_team")
    .select("id")
    .eq("project_id", projectId)
    .eq("user_id", userId)
    .maybeSingle();

  if (checkError) {
    console.error(
      "[addProjectTeamMember] Error checking existing member:",
      checkError,
    );
  }

  if (existingMember) {
    if (process.env.NODE_ENV === "development") {
      console.error("[addProjectTeamMember] User already on team");
    }
    return { error: "This user is already a member of the project team" };
  }

  if (process.env.NODE_ENV === "development") {
    console.log(
      "[addProjectTeamMember] User not already on team, proceeding with insert",
    );
  }

  // Validate role is one of the allowed roles
  const validRoles = [
    "admin",
    "project_manager",
    "foreman",
    "field_worker",
    "subcontractor",
    "client",
  ];
  if (!validRoles.includes(userRole)) {
    if (process.env.NODE_ENV === "development") {
      console.error("[addProjectTeamMember] Invalid role:", userRole);
    }
    return { error: "Invalid role selected" };
  }

  // Add team member
  const { data: teamMember, error: insertError } = await supabase
    .from("project_team")
    .insert({
      project_id: projectId,
      user_id: userId,
      role: userRole as UserRole,
      assigned_by: userContext.userId,
    })
    .select()
    .single();

  if (insertError) {
    console.error(
      "[addProjectTeamMember] Error adding team member:",
      insertError,
    );
    console.error("[addProjectTeamMember] Error details:", {
      code: insertError.code,
      message: insertError.message,
      details: insertError.details,
      hint: insertError.hint,
    });
    return { error: "Failed to add team member. Please try again." };
  }

  if (process.env.NODE_ENV === "development") {
    console.log(
      "[addProjectTeamMember] Team member added successfully:",
      teamMember,
    );
  }

  // Revalidate paths and related caches
  revalidatePath(`/app/projects/${projectId}`);
  revalidateTag(`project-${projectId}`, "max");

  return { success: true, teamMember };
}

/**
 * Add a subcontractor to a project team
 * Only Admins and Project Managers can add subcontractors
 */
export async function addSubcontractorToProject(
  projectId: string,
  subcontractorId: string,
) {
  if (process.env.NODE_ENV === "development") {
    console.log(
      "[addSubcontractorToProject] Starting - Project:",
      projectId,
      "Subcontractor:",
      subcontractorId,
    );
  }

  // Get user's company and role
  const userContext = await getUserContext();
  if ("error" in userContext) {
    console.error(
      "[addSubcontractorToProject] User context error:",
      userContext.error,
    );
    return { error: userContext.error };
  }

  const { companyId, role, supabase } = userContext;
  if (process.env.NODE_ENV === "development") {
    console.log("[addSubcontractorToProject] User context:", { companyId, role });
  }

  // Check permissions
  if (role !== "admin" && role !== "project_manager") {
    if (process.env.NODE_ENV === "development") {
      console.error(
        "[addSubcontractorToProject] Insufficient permissions - User role:",
        role,
      );
    }
    return { error: "Insufficient permissions to add subcontractors" };
  }

  // Verify project belongs to user's company
  const { data: existingProject, error: fetchError } = await supabase
    .from("projects")
    .select("company_id")
    .eq("id", projectId)
    .single();

  if (fetchError || !existingProject) {
    console.error("[addSubcontractorToProject] Project not found:", fetchError);
    return { error: "Project not found" };
  }

  if (existingProject.company_id !== companyId) {
    if (process.env.NODE_ENV === "development") {
      console.error("[addSubcontractorToProject] Project company mismatch");
    }
    return { error: "Insufficient permissions to manage this project team" };
  }

  // Verify subcontractor belongs to user's company and is active
  const { data: subcontractor, error: subError } = await supabase
    .from("subcontractors")
    .select("id, company_id, company_name, is_active")
    .eq("id", subcontractorId)
    .single();

  if (subError || !subcontractor) {
    console.error(
      "[addSubcontractorToProject] Subcontractor not found:",
      subError,
    );
    return { error: "Subcontractor not found" };
  }

  if (subcontractor.company_id !== companyId) {
    if (process.env.NODE_ENV === "development") {
      console.error("[addSubcontractorToProject] Subcontractor company mismatch");
    }
    return { error: "Subcontractor not in your company" };
  }

  if (!subcontractor.is_active) {
    if (process.env.NODE_ENV === "development") {
      console.error("[addSubcontractorToProject] Subcontractor is inactive");
    }
    return { error: "Cannot add inactive subcontractor to project" };
  }

  // Check if subcontractor is already on the team
  const { data: existingMember, error: checkError } = await supabase
    .from("project_team")
    .select("id")
    .eq("project_id", projectId)
    .eq("subcontractor_id", subcontractorId)
    .maybeSingle();

  if (checkError) {
    console.error(
      "[addSubcontractorToProject] Error checking existing member:",
      checkError,
    );
  }

  if (existingMember) {
    if (process.env.NODE_ENV === "development") {
      console.error("[addSubcontractorToProject] Subcontractor already on team");
    }
    return { error: "This subcontractor is already assigned to the project" };
  }

  if (process.env.NODE_ENV === "development") {
    console.log(
      "[addSubcontractorToProject] Subcontractor not already on team, proceeding with insert",
    );
  }

  // Add subcontractor to team with 'subcontractor' role
  const { data: teamMember, error: insertError } = await supabase
    .from("project_team")
    .insert({
      project_id: projectId,
      subcontractor_id: subcontractorId,
      role: "subcontractor" as UserRole,
      assigned_by: userContext.userId,
    })
    .select()
    .single();

  if (insertError) {
    console.error(
      "[addSubcontractorToProject] Error adding subcontractor:",
      insertError,
    );
    console.error("[addSubcontractorToProject] Error details:", {
      code: insertError.code,
      message: insertError.message,
      details: insertError.details,
    });
    return { error: "Failed to add subcontractor. Please try again." };
  }

  if (process.env.NODE_ENV === "development") {
    console.log(
      "[addSubcontractorToProject] Subcontractor added successfully:",
      teamMember,
    );
  }

  // Revalidate paths and related caches
  revalidatePath(`/app/projects/${projectId}`);
  revalidateTag(`project-${projectId}`, "max");

  return { success: true, teamMember };
}

/**
 * Remove a subcontractor from a project team
 * Only Admins and Project Managers can remove subcontractors
 */
export async function removeSubcontractorFromProject(
  projectId: string,
  subcontractorId: string,
) {
  // Get user's company and role
  const userContext = await getUserContext();
  if ("error" in userContext) {
    return { error: userContext.error };
  }

  const { companyId, role, supabase } = userContext;

  // Check permissions
  if (role !== "admin" && role !== "project_manager") {
    return { error: "Insufficient permissions to remove subcontractors" };
  }

  // Verify project belongs to user's company
  const { data: existingProject, error: fetchError } = await supabase
    .from("projects")
    .select("company_id")
    .eq("id", projectId)
    .single();

  if (fetchError || !existingProject) {
    return { error: "Project not found" };
  }

  if (existingProject.company_id !== companyId) {
    return { error: "Insufficient permissions to manage this project team" };
  }

  // Remove subcontractor from team
  const { error: deleteError } = await supabase
    .from("project_team")
    .delete()
    .eq("project_id", projectId)
    .eq("subcontractor_id", subcontractorId);

  if (deleteError) {
    console.error("Error removing subcontractor:", deleteError);
    return { error: "Failed to remove subcontractor. Please try again." };
  }

  // Revalidate paths and related caches
  revalidatePath(`/app/projects/${projectId}`);
  revalidateTag(`project-${projectId}`, "max");

  return { success: true };
}

export async function removeProjectTeamMember(
  projectId: string,
  userId: string,
) {
  // Get user's company and role
  const userContext = await getUserContext();
  if ("error" in userContext) {
    return { error: userContext.error };
  }

  const { companyId, role, supabase } = userContext;

  // Check permissions
  if (role !== "admin" && role !== "project_manager") {
    return { error: "Insufficient permissions to remove team members" };
  }

  // Verify project belongs to user's company
  const { data: existingProject, error: fetchError } = await supabase
    .from("projects")
    .select("company_id")
    .eq("id", projectId)
    .single();

  if (fetchError || !existingProject) {
    return { error: "Project not found" };
  }

  if (existingProject.company_id !== companyId) {
    return { error: "Insufficient permissions to manage this project team" };
  }

  // Remove team member
  const { error: deleteError } = await supabase
    .from("project_team")
    .delete()
    .eq("project_id", projectId)
    .eq("user_id", userId);

  if (deleteError) {
    console.error("Error removing team member:", deleteError);
    return { error: "Failed to remove team member. Please try again." };
  }

  // Revalidate paths and related caches
  revalidatePath(`/app/projects/${projectId}`);
  revalidateTag(`project-${projectId}`, "max");

  return { success: true };
}

// ============================================
// Enhanced Project Fetch with Stats
// ============================================

/**
 * Calculate schedule status based on end date and completion percentage
 * @param endDate - Project end date
 * @param completionPercentage - Current completion percentage
 * @param startDate - Project start date
 */
function calculateScheduleStatus(
  endDate: string | null,
  completionPercentage: number,
  startDate: string | null,
): ScheduleStatus {
  // Default values if no end date
  if (!endDate) {
    return {
      daysRemaining: 0,
      status: "on-time",
      daysBehind: 0,
    };
  }

  const now = new Date();
  const end = new Date(endDate);
  const daysRemaining = Math.ceil(
    (end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
  );

  // Calculate expected progress based on timeline
  let expectedProgress = 100;
  if (startDate) {
    const start = new Date(startDate);
    const totalDays = Math.ceil(
      (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24),
    );
    const elapsedDays = Math.ceil(
      (now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24),
    );
    expectedProgress = Math.min(
      100,
      Math.max(0, (elapsedDays / totalDays) * 100),
    );
  }

  // Calculate days behind based on progress difference
  const progressDifference = expectedProgress - completionPercentage;
  const daysBehind = Math.max(
    0,
    Math.round((progressDifference / 100) * daysRemaining),
  );

  // Determine status
  let status: "on-time" | "at-risk" | "delayed" = "on-time";
  if (daysRemaining < 0) {
    status = "delayed"; // Past due date
  } else if (daysBehind > 5) {
    status = "delayed";
  } else if (daysBehind >= 1) {
    status = "at-risk";
  }

  if (process.env.NODE_ENV === "development") {
    console.log("[getProjectsWithStats] Schedule calculation:", {
      endDate,
      daysRemaining,
      expectedProgress: expectedProgress.toFixed(1),
      actualProgress: completionPercentage,
      daysBehind,
      status,
    });
  }

  return {
    daysRemaining: Math.max(0, daysRemaining),
    status,
    daysBehind,
  };
}

/**
 * Get all projects for the user's company with enhanced stats for ProjectCard
 * OPTIMIZED: Uses database function get_projects_with_stats() for server-side aggregation
 * Performance: 4 queries + JS loops → 1 RPC call (~1200ms → ~150ms)
 *
 * Includes: task counts, budget variance, schedule status, materials status
 *
 * @param options - Pagination options
 * @param options.limit - Maximum number of projects to return (default: 20)
 * @param options.offset - Number of projects to skip (default: 0)
 */
export async function getProjectsWithStats(
  companyId: string,
  options?: {
    limit?: number;
    offset?: number;
  },
): Promise<{
  projects?: ProjectWithStats[];
  totalCount?: number;
  error?: string;
}> {
  const limit = options?.limit ?? 20;
  const offset = options?.offset ?? 0;

  if (process.env.NODE_ENV === "development") {
    console.log(
      `[getProjectsWithStats] Starting optimized project fetch (limit: ${limit}, offset: ${offset})...`,
    );
  }

  // Note: unstable_cache was removed because createClient() internally calls auth(),
  // which accesses headers() - a dynamic data source that can't be cached.
  // The RPC function itself is already optimized (~150ms), and Next.js provides
  // automatic request memoization, so explicit caching is unnecessary.
  return await fetchProjectsWithStats(companyId, limit, offset);
}

// Internal helper function for fetching projects
async function fetchProjectsWithStats(
  companyId: string,
  limit: number,
  offset: number,
): Promise<{
  projects?: ProjectWithStats[];
  totalCount?: number;
  error?: string;
}> {
  if (process.env.NODE_ENV === "development") {
    console.log("[fetchProjectsWithStats] Fetching for company:", companyId);
  }

  // Create Supabase client inside cached function
  const supabase = await createClient();

  try {
    // Call optimized database function - returns JSONB array with pre-aggregated stats
    const { data: result, error: rpcError } = await supabase.rpc(
      "get_projects_with_stats",
      {
        p_company_id: companyId,
        p_limit: limit,
        p_offset: offset,
      },
    );

    if (rpcError) {
      console.error("[getProjectsWithStats] RPC error:", rpcError);
      return { error: "Failed to fetch projects" };
    }

    // Get total count for pagination (separate lightweight query)
    const { count, error: countError } = await supabase
      .from("projects")
      .select("id", { count: "exact", head: true })
      .eq("company_id", companyId);

    if (countError) {
      console.error("[getProjectsWithStats] Count error:", countError);
      // Continue without count - pagination will be disabled
    }

    if (process.env.NODE_ENV === "development") {
      console.log(`[getProjectsWithStats] Total project count: ${count || 0}`);
    }

    // Result is JSONB - need to parse it as array
    // Type: RPC returns JSON with project data + nested stats object
    type RpcProjectResult = Project & {
      stats?: {
        // Task stats
        total_tasks?: number;
        completed_tasks?: number;
        in_progress_tasks?: number;
        blocked_tasks?: number;
        todo_tasks?: number;
        overdue_tasks?: number;
        actual_spent?: number;
        planned_cost?: number;
        // Expense stats
        expenses_total?: number;
        expenses_approved?: number;
        expenses_pending?: number;
        expenses_rejected?: number;
        expenses_total_amount?: number | string;
        expenses_approved_amount?: number | string;
        expenses_pending_amount?: number | string;
        // Material stats
        materials_needed?: number;
        materials_ordered?: number;
        materials_delivered?: number;
        // Team stats
        team_size?: number;
        // Schedule stats (pre-calculated in SQL - optimization)
        schedule_days_remaining?: number;
        schedule_days_behind?: number;
        schedule_status?: "on-time" | "at-risk" | "delayed";
      };
    };

    const projects = (result || []) as RpcProjectResult[];

    if (!projects || projects.length === 0) {
      if (process.env.NODE_ENV === "development") {
        console.log("[getProjectsWithStats] No projects found");
      }
      return { projects: [], totalCount: count || 0 };
    }

    if (process.env.NODE_ENV === "development") {
      console.log(
        `[getProjectsWithStats] Found ${projects.length} projects with pre-aggregated stats`,
      );
    }

    // Transform database result to ProjectWithStats format
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const projectsWithStats: ProjectWithStats[] = projects.map((project) => {
      // Extract stats from database result - stats are nested in project.stats
      const dbStats = project.stats || {};

      const taskCounts: TaskCounts = {
        total: dbStats.total_tasks || 0,
        completed: dbStats.completed_tasks || 0,
        in_progress: dbStats.in_progress_tasks || 0,
        blocked: dbStats.blocked_tasks || 0,
        todo: dbStats.todo_tasks || 0,
        overdue: dbStats.overdue_tasks || 0,
      };

      const actualSpent = Number(dbStats.actual_spent) || 0;
      const plannedCost = Number(dbStats.planned_cost) || 0;
      const budget = Number(project.budget) || 0;

      // Expense stats from DB
      const expenseStats: ExpenseStats = {
        total: dbStats.expenses_total || 0,
        approved: dbStats.expenses_approved || 0,
        pending: dbStats.expenses_pending || 0,
        rejected: dbStats.expenses_rejected || 0,
        totalAmount: Number(dbStats.expenses_total_amount) || 0,
        approvedAmount: Number(dbStats.expenses_approved_amount) || 0,
        pendingAmount: Number(dbStats.expenses_pending_amount) || 0,
        rejectedAmount: 0, // Not tracked separately in DB function
      };

      // Calculate total actual spent (tasks + expenses)
      const totalActualSpent = actualSpent + expenseStats.approvedAmount;

      // OPTIMIZATION: Use pre-calculated schedule status from SQL
      // This eliminates the O(n) JavaScript loop that ran on every page load
      // Before: 19 projects = 19 calculateScheduleStatus() calls + 38 console.logs
      // After: 0 JavaScript calculations (all done in single SQL query)
      const schedule: ScheduleStatus = {
        daysRemaining: dbStats.schedule_days_remaining || 0,
        daysBehind: dbStats.schedule_days_behind || 0,
        status: dbStats.schedule_status || "on-time",
      };

      // Materials status from DB
      const materialsStatus: MaterialsStatus = {
        needed: dbStats.materials_needed || 0,
        ordered: dbStats.materials_ordered || 0,
        delivered: dbStats.materials_delivered || 0,
      };

      const stats: ProjectStats = {
        actualSpent: totalActualSpent,
        plannedCost,
        budgetVariance: budget - totalActualSpent,
        isUnderBudget: budget - totalActualSpent >= 0,
        taskCounts,
        schedule,
        materials: materialsStatus,
        teamSize: dbStats.team_size || 0,
        expenses: expenseStats,
      };

      // Return project with stats (flatten the stats object from DB response)
      return {
        id: project.id,
        company_id: project.company_id,
        name: project.name,
        description: project.description,
        status: project.status,
        project_type: project.project_type,
        start_date: project.start_date,
        end_date: project.end_date,
        budget: project.budget,
        actual_cost: project.actual_cost,
        completion_percentage: project.completion_percentage,
        health_score: project.health_score,
        client_name: project.client_name,
        client_email: project.client_email,
        client_phone: project.client_phone,
        address: project.address,
        city: project.city,
        state: project.state,
        zip_code: project.zip_code,
        latitude: project.latitude,
        longitude: project.longitude,
        image_url: project.image_url,
        project_type_config_id: project.project_type_config_id,
        created_by: project.created_by,
        created_at: project.created_at,
        updated_at: project.updated_at,
        stats,
      } as ProjectWithStats;
    });

    if (process.env.NODE_ENV === "development") {
      console.log(
        `[getProjectsWithStats] Successfully processed ${projectsWithStats.length} projects with stats`,
      );
    }
    return { projects: projectsWithStats, totalCount: count || 0 };
  } catch (error) {
    console.error("[getProjectsWithStats] Unexpected error:", error);
    return { error: "An unexpected error occurred" };
  }
}

/**
 * Get a single project with enhanced stats
 */
export async function getProjectWithStats(projectId: string): Promise<{
  project?: ProjectWithStats;
  error?: string;
}> {
  // Get user context (not cached - auth must be per-request)
  const userContext = await getUserContext();
  if ("error" in userContext) {
    return { error: userContext.error };
  }

  const { companyId } = userContext;

  // Note: unstable_cache was removed because createClient() internally calls auth(),
  // which accesses headers() - a dynamic data source that can't be cached.
  // Next.js provides automatic request memoization for the same request.
  return await fetchProjectWithStats(projectId, companyId);
}

// Internal helper function for fetching project detail
// Performance: Uses RPC function for single-query execution
// Before: 4 sequential queries + JS aggregation (~500ms)
// After: 1 RPC call (~50ms)
async function fetchProjectWithStats(
  projectId: string,
  companyId: string,
): Promise<{
  project?: ProjectWithStats;
  error?: string;
}> {
  const supabase = await createClient();

  try {
    // Use optimized RPC function (single query replaces 4 queries + JS aggregation)
    const { data, error } = await (supabase.rpc as any)(
      "get_project_with_full_stats",
      { p_project_id: projectId, p_company_id: companyId }
    );

    if (error) {
      console.error("[fetchProjectWithStats] RPC error:", error);
      return { error: "Failed to fetch project" };
    }

    if (!data || !data.project) {
      return { error: "Project not found" };
    }

    // Extract data from RPC response
    const {
      project,
      taskCounts,
      materialsStatus,
      expenseStats,
      teamSize,
      actualSpent,
      plannedCost,
      materialCosts
    } = data;

    const budget = Number(project.budget) || 0;
    const totalActualSpent =
      Number(actualSpent) + Number(materialCosts) + Number(expenseStats.approvedAmount);

    // Calculate schedule status (kept in JS as it's pure calculation)
    const schedule = calculateScheduleStatus(
      project.end_date,
      project.completion_percentage || 0,
      project.start_date,
    );

    const stats: ProjectStats = {
      actualSpent: totalActualSpent,
      plannedCost: Number(plannedCost),
      budgetVariance: budget - totalActualSpent,
      isUnderBudget: budget - totalActualSpent >= 0,
      taskCounts: taskCounts as TaskCounts,
      schedule,
      materials: materialsStatus as MaterialsStatus,
      teamSize,
      expenses: expenseStats as ExpenseStats,
    };

    if (process.env.NODE_ENV === "development") {
      console.log(
        `[getProjectWithStats] Success via RPC for project ${projectId}`,
      );
    }

    return {
      project: {
        ...project,
        stats,
      } as ProjectWithStats,
    };
  } catch (error) {
    console.error("[getProjectWithStats] Unexpected error:", error);
    return { error: "An unexpected error occurred" };
  }
}

// ============================================
// Team Cost Summary
// ============================================

/**
 * Team cost summary interface for project team cost breakdown
 */
export interface TeamCostSummary {
  id: string;
  name: string;
  type: "member" | "subcontractor";
  avatarUrl: string | null;
  role: string;
  taskCosts: number;
  expenseCosts: number;
  totalCosts: number;
  taskCount: number;
  expenseCount: number;
}

/**
 * Get team cost summary for a project
 * Aggregates task costs by primary assignee and expense costs by vendor_name match
 * Returns all project team members and subcontractors with their cost totals
 *
 * Performance: Optimized with separate queries to avoid complex CTEs
 * Target: <500ms for 50 members / 1000 records
 *
 * @param projectId - Project UUID to fetch team costs for
 * @returns Array of TeamCostSummary sorted by totalCosts descending
 */
export async function getProjectTeamCostSummary(
  projectId: string,
): Promise<{ data?: TeamCostSummary[]; error?: string }> {
  // Get user context (not cached - auth must be per-request)
  const userContext = await getUserContext();
  if ("error" in userContext) {
    return { error: userContext.error };
  }

  const { companyId } = userContext;

  // Note: unstable_cache was removed because createClient() internally calls auth(),
  // which accesses headers() - a dynamic data source that can't be cached.
  // Next.js provides automatic request memoization for the same request.
  return await fetchProjectTeamCostSummary(projectId, companyId);
}

// Internal helper function for fetching team cost summary
// Optimized to use RPC function instead of 5+ queries + JavaScript aggregation
async function fetchProjectTeamCostSummary(
  projectId: string,
  companyId: string,
): Promise<{ data?: TeamCostSummary[]; error?: string }> {
  const supabase = await createClient();

  try {
    // Verify project belongs to user's company
    const { data: project, error: projectError } = await supabase
      .from("projects")
      .select("id, company_id")
      .eq("id", projectId)
      .eq("company_id", companyId)
      .single();

    if (projectError || !project) {
      return { error: "Project not found or access denied" };
    }

    // Call optimized RPC function (single query replaces 5+ queries + aggregation)
    const { data, error } = await (supabase.rpc as any)(
      "get_project_team_cost_summary",
      { p_project_id: projectId }
    );

    if (error) {
      console.error("[fetchProjectTeamCostSummary] RPC error:", error);
      return { error: "Failed to fetch team cost summary" };
    }

    // RPC returns JSONB array, convert to typed TeamCostSummary[]
    const summaries = (data || []) as TeamCostSummary[];
    return { data: summaries };
  } catch (error) {
    console.error("[fetchProjectTeamCostSummary] Unexpected error:", error);
    return { error: "Failed to fetch team cost summary" };
  }
}

// ============================================
// Modal Data Actions (Lazy Loading)
// ============================================

/**
 * Lightweight type for project selection in modals
 * Only includes fields needed for task creation/editing dropdowns
 */
export interface ProjectForModal {
  id: string;
  name: string;
  project_phases?: Array<{
    id: string;
    name: string;
    order_index: number;
  }>;
}

/**
 * Lightweight type for team member selection in modals
 */
export interface TeamMemberForModal {
  id: string;
  name: string;
  email: string;
  avatar_url: string | null;
}

/**
 * Get minimal project list for modal dropdowns
 *
 * Use this for lazy-loading project data when a modal opens,
 * instead of loading all projects on initial page render.
 *
 * Data size: ~500 bytes per project (vs ~2-3KB with full relations)
 *
 * @returns Promise with array of minimal project data
 */
export async function getProjectsForModal(): Promise<{
  data?: ProjectForModal[];
  error?: string;
}> {
  const context = await getUserContext();
  if ("error" in context) {
    return { error: context.error };
  }

  const supabase = await createClient();

  const { data, error } = await supabase
    .from("projects")
    .select("id, name, project_phases(id, name, order_index)")
    .eq("company_id", context.companyId)
    .order("name");

  if (error) {
    console.error("[getProjectsForModal] Error:", error);
    return { error: "Failed to fetch projects" };
  }

  return { data: data || [] };
}

/**
 * Get minimal team member list for modal dropdowns
 *
 * Use this for lazy-loading team data when a modal opens,
 * instead of loading all team members on initial page render.
 *
 * Data size: ~100 bytes per member (vs ~500 bytes with full profile)
 *
 * @returns Promise with array of minimal team member data
 */
export async function getTeamMembersForModal(): Promise<{
  data?: TeamMemberForModal[];
  error?: string;
}> {
  const context = await getUserContext();
  if ("error" in context) {
    return { error: context.error };
  }

  const supabase = await createClient();

  const { data, error } = await supabase
    .from("company_users")
    .select(`
      user_id,
      user_profiles:user_profiles!company_users_user_profile_fkey (
        id,
        name,
        email,
        avatar_url
      )
    `)
    .eq("company_id", context.companyId)
    .eq("status", "active");

  if (error) {
    console.error("[getTeamMembersForModal] Error:", error);
    return { error: "Failed to fetch team members" };
  }

  // Transform to flat structure
  const teamMembers = (data || [])
    .map((cu) => cu.user_profiles)
    .filter((p): p is Required<typeof p> => {
      if (!p) {
        console.warn('[getTeamMembersForModal] Null user_profile in company_users result. This may indicate a data integrity issue.');
        return false;
      }
      return true;
    });

  return { data: teamMembers };
}

/**
 * Get both projects and team members for modal in a single call
 *
 * Optimized for modal initialization - fetches both datasets in parallel
 *
 * @returns Promise with both projects and team members
 */
export const getModalData = cache(async (): Promise<{
  data?: {
    projects: ProjectForModal[];
    teamMembers: TeamMemberForModal[];
  };
  error?: string;
}> => {
  const [projectsResult, teamResult] = await Promise.all([
    getProjectsForModal(),
    getTeamMembersForModal(),
  ]);

  if (projectsResult.error) {
    return { error: projectsResult.error };
  }
  if (teamResult.error) {
    return { error: teamResult.error };
  }

  return {
    data: {
      projects: projectsResult.data || [],
      teamMembers: teamResult.data || [],
    },
  };
});
