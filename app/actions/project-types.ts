"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getAdminUserContext, getUserContext } from "@/lib/auth/user-context";
import type { ProjectTypeConfigsRow } from "@/types/db/tables/projects";

// ============================================
// Types
// ============================================

type ProjectTypeConfig = ProjectTypeConfigsRow;

export interface ProjectTypeWithCount extends ProjectTypeConfig {
  project_count?: number;
}

// ============================================
// Validation Schemas
// ============================================

const createProjectTypeSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  description: z.string().max(500).optional(),
  icon_name: z.string().default("Building2"),
  color: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, "Invalid hex color")
    .default("var(--construction-blue)"),
});

const updateProjectTypeSchema = z.object({
  name: z.string().min(1, "Name is required").max(100).optional(),
  description: z.string().max(500).optional(),
  icon_name: z.string().optional(),
  color: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, "Invalid hex color")
    .optional(),
  is_active: z.boolean().optional(),
  order_index: z.number().int().min(0).optional(),
});

// ============================================
// Server Actions
// ============================================

/**
 * Get all project types for the user's company with project counts
 *
 * Performance: Uses RPC function for single-query execution
 * Before: 2 queries + JS aggregation (~200ms)
 * After: 1 RPC call (~30ms)
 */
export async function getProjectTypes(): Promise<{
  success?: boolean;
  projectTypes?: ProjectTypeWithCount[];
  error?: string;
}> {
  if (process.env.NODE_ENV === "development") {
    console.log("[getProjectTypes] Fetching project types via RPC...");
  }

  const userContext = await getUserContext();
  if ("error" in userContext) {
    return { error: userContext.error };
  }

  const { companyId, supabase } = userContext;

  // Use optimized RPC function (single query replaces 2 queries + JS aggregation)
  const { data, error } = await (supabase.rpc as any)(
    "get_project_types_with_counts",
    { p_company_id: companyId }
  );

  if (error) {
    console.error("[getProjectTypes] RPC error:", error);
    return { error: "Failed to fetch project types" };
  }

  // RPC returns JSONB array, convert to typed ProjectTypeWithCount[]
  const typesWithCounts = (data || []) as ProjectTypeWithCount[];

  if (process.env.NODE_ENV === "development") {
    console.log(`[getProjectTypes] Success: ${typesWithCounts.length} types`);
  }
  return { success: true, projectTypes: typesWithCounts };
}

/**
 * Create a new project type
 */
export async function createProjectType(formData: FormData): Promise<{
  success?: boolean;
  projectType?: ProjectTypeConfig;
  error?: string;
  fieldErrors?: Record<string, string[]>;
}> {
  if (process.env.NODE_ENV === "development") {
    console.log("[createProjectType] Creating new project type...");
  }

  const userContext = await getAdminUserContext();
  if ("error" in userContext) {
    return { error: userContext.error };
  }

  const { companyId, supabase } = userContext;

  // Parse and validate
  const rawData = {
    name: formData.get("name"),
    description: formData.get("description") || undefined,
    icon_name: formData.get("icon_name") || "Building2",
    color: formData.get("color") || "var(--construction-blue)",
  };

  const validation = createProjectTypeSchema.safeParse(rawData);
  if (!validation.success) {
    console.error("[createProjectType] Validation failed:", validation.error);
    return {
      error: "Validation failed",
      fieldErrors: validation.error.flatten().fieldErrors,
    };
  }

  // Get max order_index
  const { data: maxOrder } = await supabase
    .from("project_type_configs")
    .select("order_index")
    .eq("company_id", companyId)
    .order("order_index", { ascending: false })
    .limit(1)
    .maybeSingle();

  const newOrderIndex = (maxOrder?.order_index ?? -1) + 1;

  // Insert
  const { data: projectType, error } = await supabase
    .from("project_type_configs")
    .insert({
      company_id: companyId,
      ...validation.data,
      order_index: newOrderIndex,
    })
    .select()
    .single();

  if (error) {
    console.error("[createProjectType] Error:", error);
    if (error.code === "23505") {
      return { error: "A project type with this name already exists" };
    }
    return { error: "Failed to create project type" };
  }

  if (process.env.NODE_ENV === "development") {
    console.log("[createProjectType] Project type created:", projectType.id);
  }
  revalidatePath("/app/settings");
  return { success: true, projectType };
}

/**
 * Update an existing project type
 */
export async function updateProjectType(
  id: string,
  formData: FormData,
): Promise<{
  success?: boolean;
  projectType?: ProjectTypeConfig;
  error?: string;
  fieldErrors?: Record<string, string[]>;
}> {
  if (process.env.NODE_ENV === "development") {
    console.log("[updateProjectType] Updating project type:", id);
  }

  const userContext = await getAdminUserContext();
  if ("error" in userContext) {
    return { error: userContext.error };
  }

  const { companyId, supabase } = userContext;

  const rawData = {
    name: formData.get("name") || undefined,
    description: formData.get("description") || undefined,
    icon_name: formData.get("icon_name") || undefined,
    color: formData.get("color") || undefined,
    is_active: formData.get("is_active") === "true",
  };

  const validation = updateProjectTypeSchema.safeParse(rawData);
  if (!validation.success) {
    console.error("[updateProjectType] Validation failed:", validation.error);
    return {
      error: "Validation failed",
      fieldErrors: validation.error.flatten().fieldErrors,
    };
  }

  // Verify ownership
  const { data: existing } = await supabase
    .from("project_type_configs")
    .select("company_id")
    .eq("id", id)
    .maybeSingle();

  if (!existing || existing.company_id !== companyId) {
    return { error: "Project type not found" };
  }

  // Update
  const { data: projectType, error } = await supabase
    .from("project_type_configs")
    .update(validation.data)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error("[updateProjectType] Error:", error);
    if (error.code === "23505") {
      return { error: "A project type with this name already exists" };
    }
    return { error: "Failed to update project type" };
  }

  if (process.env.NODE_ENV === "development") {
    console.log("[updateProjectType] Project type updated:", projectType.id);
  }
  revalidatePath("/app/settings");
  return { success: true, projectType };
}

/**
 * Delete a project type
 * Checks if the type is in use before deleting
 */
export async function deleteProjectType(id: string): Promise<{
  success?: boolean;
  error?: string;
}> {
  if (process.env.NODE_ENV === "development") {
    console.log("[deleteProjectType] Deleting project type:", id);
  }

  const userContext = await getAdminUserContext();
  if ("error" in userContext) {
    return { error: userContext.error };
  }

  const { companyId, supabase } = userContext;

  // Check if project type exists and belongs to company
  const { data: existing } = await supabase
    .from("project_type_configs")
    .select("company_id, name")
    .eq("id", id)
    .maybeSingle();

  if (!existing || existing.company_id !== companyId) {
    return { error: "Project type not found" };
  }

  // Check if any projects use this type (via the new project_type_config_id FK)
  const { data: projects, error: countError } = await supabase
    .from("projects")
    .select("id")
    .eq("company_id", companyId)
    .eq("project_type_config_id", id)
    .limit(1);

  if (countError) {
    console.error(
      "[deleteProjectType] Error checking project usage:",
      countError,
    );
    return { error: "Failed to check if project type is in use" };
  }

  if (projects && projects.length > 0) {
    return {
      error: `Cannot delete: This project type is assigned to existing projects. Please archive the type instead.`,
    };
  }

  // Delete (will cascade to phase_templates and task_templates)
  const { error } = await supabase
    .from("project_type_configs")
    .delete()
    .eq("id", id);

  if (error) {
    console.error("[deleteProjectType] Error:", error);
    return { error: "Failed to delete project type" };
  }

  if (process.env.NODE_ENV === "development") {
    console.log("[deleteProjectType] Project type deleted:", id);
  }
  revalidatePath("/app/settings");
  return { success: true };
}
