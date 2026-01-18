"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/utils/supabase/server";
import { auth } from "@/lib/auth";
import type { TaskTemplatesRow } from "@/types/db/tables/tasks";

// ============================================
// Types
// ============================================

type TaskTemplate = TaskTemplatesRow;

// ============================================
// Validation Schemas
// ============================================

const createTaskTemplateSchema = z.object({
  phase_template_id: z.string().uuid("Invalid phase template ID"),
  title: z.string().min(1, "Title is required").max(500),
  description: z.string().max(2000).optional(),
  default_task_type: z
    .enum(["work", "purchase", "approval", "admin"])
    .default("work"),
  default_priority: z.enum(["low", "medium", "high"]).default("medium"),
  days_offset: z.coerce.number().int().min(0).max(365).optional().nullable(),
});

const updateTaskTemplateSchema = z.object({
  title: z.string().min(1, "Title is required").max(500).optional(),
  description: z.string().max(2000).optional(),
  default_task_type: z
    .enum(["work", "purchase", "approval", "admin"])
    .optional(),
  default_priority: z.enum(["low", "medium", "high"]).optional(),
  is_active: z.boolean().optional(),
  days_offset: z.coerce.number().int().min(0).max(365).optional().nullable(),
});

// ============================================
// Helper Functions
// ============================================

async function getUserContext() {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "Not authenticated" };
  }

  const supabase = await createClient();
  const { data: companyUser, error: companyError } = await supabase
    .from("company_users")
    .select("company_id, role, status")
    .eq("user_id", session.user.id)
    .eq("status", "active")
    .maybeSingle();

  if (companyError || !companyUser) {
    console.error(
      "[getUserContext] Error fetching company user:",
      companyError,
    );
    return { error: "No active company found for user" };
  }

  // Only Admin can manage task templates
  if (companyUser.role !== "admin") {
    return {
      error: "Insufficient permissions. Only Admin can manage task templates.",
    };
  }

  return {
    userId: session.user.id,
    companyId: companyUser.company_id,
    role: companyUser.role,
    supabase,
  };
}

// ============================================
// Server Actions
// ============================================

/**
 * Get task templates, optionally filtered by phase template
 */
export async function getTaskTemplates(phaseTemplateId?: string): Promise<{
  success?: boolean;
  taskTemplates?: TaskTemplate[];
  error?: string;
}> {
  console.log("[getTaskTemplates] Fetching task templates...");

  const session = await auth();
  if (!session?.user?.id) {
    return { error: "Not authenticated" };
  }

  const supabase = await createClient();

  const { data: companyUser } = await supabase
    .from("company_users")
    .select("company_id")
    .eq("user_id", session.user.id)
    .eq("status", "active")
    .maybeSingle();

  if (!companyUser) {
    return { error: "No active company found" };
  }

  // Build query
  let query = supabase
    .from("task_templates")
    .select("*")
    .eq("company_id", companyUser.company_id)
    .eq("is_active", true)
    .order("order_index", { ascending: true });

  // Filter by phase template if provided
  if (phaseTemplateId) {
    query = query.eq("phase_template_id", phaseTemplateId);
  }

  const { data: taskTemplates, error } = await query;

  if (error) {
    console.error("[getTaskTemplates] Error:", error);
    return { error: "Failed to fetch task templates" };
  }

  return { success: true, taskTemplates: taskTemplates || [] };
}

/**
 * Create a new task template
 */
export async function createTaskTemplate(formData: FormData): Promise<{
  success?: boolean;
  taskTemplate?: TaskTemplate;
  error?: string;
  fieldErrors?: Record<string, string[]>;
}> {
  console.log("[createTaskTemplate] Creating new task template...");

  const userContext = await getUserContext();
  if ("error" in userContext) {
    return { error: userContext.error };
  }

  const { companyId, supabase } = userContext;

  // Parse and validate
  const rawData = {
    phase_template_id: formData.get("phase_template_id"),
    title: formData.get("title"),
    description: formData.get("description") || undefined,
    default_task_type: formData.get("default_task_type") || "work",
    default_priority: formData.get("default_priority") || "medium",
    days_offset: formData.get("days_offset") || undefined, // ✅ Extract days_offset for due date calculation
  };

  const validation = createTaskTemplateSchema.safeParse(rawData);
  if (!validation.success) {
    console.error("[createTaskTemplate] Validation failed:", validation.error);
    return {
      error: "Validation failed",
      fieldErrors: validation.error.flatten().fieldErrors,
    };
  }

  // Get max order_index for this phase template
  const { data: maxOrder } = await supabase
    .from("task_templates")
    .select("order_index")
    .eq("company_id", companyId)
    .eq("phase_template_id", validation.data.phase_template_id)
    .order("order_index", { ascending: false })
    .limit(1)
    .maybeSingle();

  const newOrderIndex = (maxOrder?.order_index ?? -1) + 1;

  // Insert
  const { data: taskTemplate, error } = await supabase
    .from("task_templates")
    .insert({
      company_id: companyId,
      ...validation.data,
      order_index: newOrderIndex,
    })
    .select()
    .single();

  if (error) {
    console.error("[createTaskTemplate] Error:", error);
    return { error: "Failed to create task template" };
  }

  console.log("[createTaskTemplate] Task template created:", taskTemplate.id);
  revalidatePath("/app/settings");
  return { success: true, taskTemplate };
}

/**
 * Update an existing task template
 */
export async function updateTaskTemplate(
  id: string,
  formData: FormData,
): Promise<{
  success?: boolean;
  taskTemplate?: TaskTemplate;
  error?: string;
  fieldErrors?: Record<string, string[]>;
}> {
  console.log("[updateTaskTemplate] Updating task template:", id);

  const userContext = await getUserContext();
  if ("error" in userContext) {
    return { error: userContext.error };
  }

  const { companyId, supabase } = userContext;

  // Verify ownership
  const { data: existing } = await supabase
    .from("task_templates")
    .select("company_id")
    .eq("id", id)
    .maybeSingle();

  if (!existing || existing.company_id !== companyId) {
    return { error: "Task template not found" };
  }

  const rawData = {
    title: formData.get("title") || undefined,
    description: formData.get("description") || undefined,
    default_task_type: formData.get("default_task_type") || undefined,
    default_priority: formData.get("default_priority") || undefined,
    is_active: formData.get("is_active") === "true",
    days_offset: formData.get("days_offset") || undefined, // ✅ Extract days_offset for due date calculation
  };

  const validation = updateTaskTemplateSchema.safeParse(rawData);
  if (!validation.success) {
    console.error("[updateTaskTemplate] Validation failed:", validation.error);
    return {
      error: "Validation failed",
      fieldErrors: validation.error.flatten().fieldErrors,
    };
  }

  // Update
  const { data: taskTemplate, error } = await supabase
    .from("task_templates")
    .update(validation.data)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error("[updateTaskTemplate] Error:", error);
    return { error: "Failed to update task template" };
  }

  console.log("[updateTaskTemplate] Task template updated:", taskTemplate.id);
  revalidatePath("/app/settings");
  return { success: true, taskTemplate };
}

/**
 * Delete a task template
 */
export async function deleteTaskTemplate(id: string): Promise<{
  success?: boolean;
  error?: string;
}> {
  console.log("[deleteTaskTemplate] Deleting task template:", id);

  const userContext = await getUserContext();
  if ("error" in userContext) {
    return { error: userContext.error };
  }

  const { companyId, supabase } = userContext;

  // Check if task template exists and belongs to company
  const { data: existing } = await supabase
    .from("task_templates")
    .select("company_id")
    .eq("id", id)
    .maybeSingle();

  if (!existing || existing.company_id !== companyId) {
    return { error: "Task template not found" };
  }

  // Delete
  const { error } = await supabase.from("task_templates").delete().eq("id", id);

  if (error) {
    console.error("[deleteTaskTemplate] Error:", error);
    return { error: "Failed to delete task template" };
  }

  console.log("[deleteTaskTemplate] Task template deleted:", id);
  revalidatePath("/app/settings");
  return { success: true };
}

/**
 * Reorder task templates within a phase
 * Updates order_index for each task based on array position
 */
export async function reorderTaskTemplates(
  phaseTemplateId: string,
  orderedIds: string[],
): Promise<{
  success?: boolean;
  error?: string;
}> {
  console.log(
    "[reorderTaskTemplates] Reordering tasks for phase:",
    phaseTemplateId,
  );

  const userContext = await getUserContext();
  if ("error" in userContext) {
    return { error: userContext.error };
  }

  const { companyId, supabase } = userContext;

  // Update order_index for each task
  const updates = orderedIds.map(
    (id, index) =>
      supabase
        .from("task_templates")
        .update({ order_index: index })
        .eq("id", id)
        .eq("company_id", companyId), // Ensure company ownership
  );

  const results = await Promise.all(updates);

  // Check if any updates failed
  const failed = results.find((r) => r.error);
  if (failed?.error) {
    console.error("[reorderTaskTemplates] Error:", failed.error);
    return { error: "Failed to reorder task templates" };
  }

  console.log("[reorderTaskTemplates] Reordered", orderedIds.length, "tasks");
  revalidatePath("/app/settings");
  return { success: true };
}
