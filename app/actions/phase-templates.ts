"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getUserContext as getBaseUserContext } from "@/lib/auth-context";
import type { PhaseTemplatesRow } from "@/types/db/tables/projects";
import type { TaskTemplatesRow } from "@/types/db/tables/tasks";

// ============================================
// Types
// ============================================

type PhaseTemplate = PhaseTemplatesRow;
type TaskTemplate = TaskTemplatesRow;

export interface PhaseTemplateWithTasks extends PhaseTemplate {
  task_templates?: TaskTemplate[];
}

// ============================================
// Validation Schemas
// ============================================

const createPhaseTemplateSchema = z.object({
  project_type_config_id: z.string().uuid("Invalid project type ID"),
  name: z.string().min(1, "Name is required").max(100),
  description: z.string().max(500).optional(),
});

const updatePhaseTemplateSchema = z.object({
  name: z.string().min(1, "Name is required").max(100).optional(),
  description: z.string().max(500).optional(),
  is_active: z.boolean().optional(),
});

// ============================================
// Helper Functions
// ============================================
// HIGH-2 FIX: Using shared cached getUserContext with role check wrapper

async function getUserContext() {
  const ctx = await getBaseUserContext();
  if ("error" in ctx) {
    return ctx;
  }

  // Only Admin can manage phase templates
  if (ctx.role !== "admin") {
    return {
      error: "Insufficient permissions. Only Admin can manage phase templates.",
    };
  }

  return ctx;
}

// ============================================
// Server Actions
// ============================================

/**
 * Get phase templates with nested task templates
 * Optionally filter by project type
 */
export async function getPhaseTemplates(projectTypeConfigId?: string): Promise<{
  success?: boolean;
  phaseTemplates?: PhaseTemplateWithTasks[];
  error?: string;
}> {
  if (process.env.NODE_ENV === "development") {
    console.log("[getPhaseTemplates] Fetching phase templates...");
  }

  const userContext = await getBaseUserContext();
  if ("error" in userContext) {
    return { error: userContext.error };
  }

  const { supabase, companyId } = userContext;

  // Build query with nested task templates
  let query = supabase
    .from("phase_templates")
    .select(
      `
      *,
      task_templates (*)
    `,
    )
    .eq("company_id", companyId)
    .eq("is_active", true)
    .order("order_index", { ascending: true });

  // Filter by project type if provided
  if (projectTypeConfigId) {
    query = query.eq("project_type_config_id", projectTypeConfigId);
  }

  const { data: phaseTemplates, error } = await query;

  if (error) {
    console.error("[getPhaseTemplates] Error:", error);
    return { error: "Failed to fetch phase templates" };
  }

  return { success: true, phaseTemplates: phaseTemplates || [] };
}

/**
 * Create a new phase template
 */
export async function createPhaseTemplate(formData: FormData): Promise<{
  success?: boolean;
  phaseTemplate?: PhaseTemplate;
  error?: string;
  fieldErrors?: Record<string, string[]>;
}> {
  if (process.env.NODE_ENV === "development") {
    console.log("[createPhaseTemplate] Creating new phase template...");
  }

  const userContext = await getUserContext();
  if ("error" in userContext) {
    return { error: userContext.error };
  }

  const { companyId, supabase } = userContext;

  // Parse and validate
  const rawData = {
    project_type_config_id: formData.get("project_type_config_id"),
    name: formData.get("name"),
    description: formData.get("description") || undefined,
  };

  const validation = createPhaseTemplateSchema.safeParse(rawData);
  if (!validation.success) {
    console.error("[createPhaseTemplate] Validation failed:", validation.error);
    return {
      error: "Validation failed",
      fieldErrors: validation.error.flatten().fieldErrors,
    };
  }

  // Get max order_index for this project type
  const { data: maxOrder } = await supabase
    .from("phase_templates")
    .select("order_index")
    .eq("company_id", companyId)
    .eq("project_type_config_id", validation.data.project_type_config_id)
    .order("order_index", { ascending: false })
    .limit(1)
    .maybeSingle();

  const newOrderIndex = (maxOrder?.order_index ?? -1) + 1;

  // Insert
  const { data: phaseTemplate, error } = await supabase
    .from("phase_templates")
    .insert({
      company_id: companyId,
      ...validation.data,
      order_index: newOrderIndex,
    })
    .select()
    .single();

  if (error) {
    console.error("[createPhaseTemplate] Error:", error);
    if (error.code === "23505") {
      return {
        error:
          "A phase template with this name already exists for this project type",
      };
    }
    return { error: "Failed to create phase template" };
  }

  if (process.env.NODE_ENV === "development") {
    console.log(
      "[createPhaseTemplate] Phase template created:",
      phaseTemplate.id,
    );
  }
  revalidatePath("/app/settings");
  return { success: true, phaseTemplate };
}

/**
 * Update an existing phase template
 */
export async function updatePhaseTemplate(
  id: string,
  formData: FormData,
): Promise<{
  success?: boolean;
  phaseTemplate?: PhaseTemplate;
  error?: string;
  fieldErrors?: Record<string, string[]>;
}> {
  if (process.env.NODE_ENV === "development") {
    console.log("[updatePhaseTemplate] Updating phase template:", id);
  }

  const userContext = await getUserContext();
  if ("error" in userContext) {
    return { error: userContext.error };
  }

  const { companyId, supabase } = userContext;

  // Verify ownership
  const { data: existing } = await supabase
    .from("phase_templates")
    .select("company_id")
    .eq("id", id)
    .maybeSingle();

  if (!existing || existing.company_id !== companyId) {
    return { error: "Phase template not found" };
  }

  const rawData = {
    name: formData.get("name") || undefined,
    description: formData.get("description") || undefined,
    is_active: formData.get("is_active") === "true",
  };

  const validation = updatePhaseTemplateSchema.safeParse(rawData);
  if (!validation.success) {
    console.error("[updatePhaseTemplate] Validation failed:", validation.error);
    return {
      error: "Validation failed",
      fieldErrors: validation.error.flatten().fieldErrors,
    };
  }

  // Update
  const { data: phaseTemplate, error } = await supabase
    .from("phase_templates")
    .update(validation.data)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error("[updatePhaseTemplate] Error:", error);
    if (error.code === "23505") {
      return {
        error:
          "A phase template with this name already exists for this project type",
      };
    }
    return { error: "Failed to update phase template" };
  }

  if (process.env.NODE_ENV === "development") {
    console.log(
      "[updatePhaseTemplate] Phase template updated:",
      phaseTemplate.id,
    );
  }
  revalidatePath("/app/settings");
  return { success: true, phaseTemplate };
}

/**
 * Delete a phase template
 * Cascades to task templates (ON DELETE CASCADE)
 */
export async function deletePhaseTemplate(id: string): Promise<{
  success?: boolean;
  error?: string;
}> {
  if (process.env.NODE_ENV === "development") {
    console.log("[deletePhaseTemplate] Deleting phase template:", id);
  }

  const userContext = await getUserContext();
  if ("error" in userContext) {
    return { error: userContext.error };
  }

  const { companyId, supabase } = userContext;

  // Check if phase template exists and belongs to company
  const { data: existing } = await supabase
    .from("phase_templates")
    .select("company_id")
    .eq("id", id)
    .maybeSingle();

  if (!existing || existing.company_id !== companyId) {
    return { error: "Phase template not found" };
  }

  // Delete (will cascade to task templates)
  const { error } = await supabase
    .from("phase_templates")
    .delete()
    .eq("id", id);

  if (error) {
    console.error("[deletePhaseTemplate] Error:", error);
    return { error: "Failed to delete phase template" };
  }

  if (process.env.NODE_ENV === "development") {
    console.log("[deletePhaseTemplate] Phase template deleted:", id);
  }
  revalidatePath("/app/settings");
  return { success: true };
}

/**
 * Reorder phase templates within a project type
 * Updates order_index for each phase based on array position
 */
export async function reorderPhaseTemplates(
  projectTypeConfigId: string,
  orderedIds: string[],
): Promise<{
  success?: boolean;
  error?: string;
}> {
  if (process.env.NODE_ENV === "development") {
    console.log(
      "[reorderPhaseTemplates] Reordering phases for project type:",
      projectTypeConfigId,
    );
  }

  const userContext = await getUserContext();
  if ("error" in userContext) {
    return { error: userContext.error };
  }

  const { companyId, supabase } = userContext;

  // Update order_index for each phase
  const updates = orderedIds.map(
    (id, index) =>
      supabase
        .from("phase_templates")
        .update({ order_index: index })
        .eq("id", id)
        .eq("company_id", companyId), // Ensure company ownership
  );

  const results = await Promise.all(updates);

  // Check if any updates failed
  const failed = results.find((r) => r.error);
  if (failed?.error) {
    console.error("[reorderPhaseTemplates] Error:", failed.error);
    return { error: "Failed to reorder phase templates" };
  }

  if (process.env.NODE_ENV === "development") {
    console.log("[reorderPhaseTemplates] Reordered", orderedIds.length, "phases");
  }
  revalidatePath("/app/settings");
  return { success: true };
}
