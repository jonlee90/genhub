"use server";

import { getUserContext } from "@/lib/auth-context";
import { z } from "zod";
import { revalidatePath } from "next/cache";

// ============================================
// VALIDATION SCHEMAS
// ============================================

const AssemblyItemSchema = z.object({
  trade: z.string(),
  description: z.string(),
  unit: z.string(),
  quantityMultiplier: z.number().default(1),
  materialId: z.string().uuid().optional(),
});

const CreateAssemblySchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  category: z.enum([
    "walls",
    "flooring",
    "ceilings",
    "roofing",
    "sitework",
    "misc",
  ]),
  isCompanyTemplate: z.boolean().default(true),
  items: z.array(AssemblyItemSchema),
});

const UpdateAssemblySchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  category: z
    .enum(["walls", "flooring", "ceilings", "roofing", "sitework", "misc"])
    .optional(),
  items: z.array(AssemblyItemSchema).optional(),
});

const GetAssembliesSchema = z.object({
  search: z.string().optional(),
  category: z.string().optional(),
});

const ApplyAssemblySchema = z.object({
  estimateId: z.string().uuid(),
  assemblyId: z.string().uuid(),
  parentItemId: z.string().uuid().optional(),
  quantityMultiplier: z.number().default(1),
});

// ============================================
// ASSEMBLIES CRUD
// ============================================

/**
 * Create a new assembly
 * P2.2: Assemblies System Backend (EST-P2-002)
 */
export async function createAssembly(
  input: z.infer<typeof CreateAssemblySchema>,
) {
  try {
    const context = await getUserContext();
    if ("error" in context) {
      return { success: false, error: context.error };
    }

    const validated = CreateAssemblySchema.parse(input);

    // Create assembly
    const { data: assembly, error: assemblyError } = await context.supabase
      .from("estimate_assemblies" as any)
      .insert({
        company_id: context.companyId,
        name: validated.name,
        description: validated.description,
        category: validated.category,
        is_company_template: validated.isCompanyTemplate,
        version: 1,
        created_by: context.userId,
      })
      .select()
      .single();

    if (assemblyError) throw assemblyError;
    const assemblyData = assembly as any;

    // Create assembly items
    if (validated.items.length > 0) {
      const items = validated.items.map((item, index) => ({
        assembly_id: assemblyData.id,
        trade: item.trade,
        description: item.description,
        unit: item.unit,
        quantity_multiplier: item.quantityMultiplier,
        material_id: item.materialId || null,
        sort_order: index,
      }));

      const { error: itemsError } = await context.supabase
        .from("assembly_items" as any)
        .insert(items);

      if (itemsError) throw itemsError;
    }

    revalidatePath("/estimates");

    return { success: true, data: assembly };
  } catch (error) {
    console.error("[createAssembly] Error:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to create assembly",
    };
  }
}

/**
 * Get assemblies with optional search and category filter
 * P2.2: Assemblies System Backend (EST-P2-002)
 */
export async function getAssemblies(
  input: z.infer<typeof GetAssembliesSchema>,
) {
  try {
    const context = await getUserContext();
    if ("error" in context) {
      return { success: false, error: context.error };
    }

    const validated = GetAssembliesSchema.parse(input);

    let query = context.supabase
      .from("estimate_assemblies" as any)
      .select(
        `
        *,
        assembly_items (
          id,
          trade,
          description,
          unit,
          quantity_multiplier,
          material_id,
          sort_order
        )
      `,
      )
      .eq("company_id", context.companyId)
      .order("created_at", { ascending: false });

    if (validated.category) {
      query = query.eq("category", validated.category);
    }

    if (validated.search) {
      query = query.or(
        `name.ilike.%${validated.search}%,description.ilike.%${validated.search}%`,
      );
    }

    const { data, error } = await query;

    if (error) throw error;

    return { success: true, data };
  } catch (error) {
    console.error("[getAssemblies] Error:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to fetch assemblies",
    };
  }
}

/**
 * Update an existing assembly
 * P2.2: Assemblies System Backend (EST-P2-002)
 */
export async function updateAssembly(
  input: z.infer<typeof UpdateAssemblySchema>,
) {
  try {
    const context = await getUserContext();
    if ("error" in context) {
      return { success: false, error: context.error };
    }

    const validated = UpdateAssemblySchema.parse(input);

    // Update assembly basic info
    const updateData: Record<string, unknown> = {};
    if (validated.name) updateData.name = validated.name;
    if (validated.description !== undefined)
      updateData.description = validated.description;
    if (validated.category) updateData.category = validated.category;

    if (Object.keys(updateData).length > 0) {
      const { error: updateError } = await context.supabase
        .from("estimate_assemblies" as any)
        .update(updateData)
        .eq("id", validated.id)
        .eq("company_id", context.companyId);

      if (updateError) throw updateError;
    }

    // Update items if provided
    if (validated.items) {
      // Delete existing items
      const { error: deleteError } = await context.supabase
        .from("assembly_items" as any)
        .delete()
        .eq("assembly_id", validated.id);

      if (deleteError) throw deleteError;

      // Insert new items
      const items = validated.items.map((item, index) => ({
        assembly_id: validated.id,
        trade: item.trade,
        description: item.description,
        unit: item.unit,
        quantity_multiplier: item.quantityMultiplier,
        material_id: item.materialId || null,
        sort_order: index,
      }));

      const { error: insertError } = await context.supabase
        .from("assembly_items" as any)
        .insert(items);

      if (insertError) throw insertError;
    }

    revalidatePath("/estimates");

    return { success: true, data: { id: validated.id } };
  } catch (error) {
    console.error("[updateAssembly] Error:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to update assembly",
    };
  }
}

/**
 * Delete an assembly
 * P2.2: Assemblies System Backend (EST-P2-002)
 */
export async function deleteAssembly(id: string) {
  try {
    const context = await getUserContext();
    if ("error" in context) {
      return { success: false, error: context.error };
    }

    // Cascade delete will handle assembly_items
    const { error } = await context.supabase
      .from("estimate_assemblies" as any)
      .delete()
      .eq("id", id)
      .eq("company_id", context.companyId);

    if (error) throw error;

    revalidatePath("/estimates");

    return { success: true };
  } catch (error) {
    console.error("[deleteAssembly] Error:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to delete assembly",
    };
  }
}

/**
 * Apply assembly to estimate (creates line items)
 * P2.2: Assemblies System Backend (EST-P2-002)
 */
export async function applyAssembly(
  input: z.infer<typeof ApplyAssemblySchema>,
) {
  try {
    const context = await getUserContext();
    if ("error" in context) {
      return { success: false, error: context.error };
    }

    const validated = ApplyAssemblySchema.parse(input);

    // Get assembly with items
    const { data: assembly, error: assemblyError } = await context.supabase
      .from("estimate_assemblies" as any)
      .select(
        `
        *,
        assembly_items (
          id,
          trade,
          description,
          unit,
          quantity_multiplier,
          material_id,
          sort_order
        )
      `,
      )
      .eq("id", validated.assemblyId)
      .eq("company_id", context.companyId)
      .single();

    if (assemblyError || !assembly) {
      return { success: false, error: "Assembly not found" };
    }

    // Validate estimate belongs to company
    const { data: estimate, error: estimateError } = await context.supabase
      .from("estimates")
      .select("id, project_id")
      .eq("id", validated.estimateId)
      .eq("company_id", context.companyId)
      .single();

    if (estimateError || !estimate) {
      return { success: false, error: "Estimate not found" };
    }

    // Create line items from assembly
    const assemblyAny = assembly as any;
    const lineItems = assemblyAny.assembly_items.map((item: any) => ({
      estimate_id: validated.estimateId,
      trade: item.trade,
      category: "architectural" as const,
      sub_type: item.description,
      description: `${assemblyAny.name} - ${item.description}`,
      quantity: item.quantity_multiplier * validated.quantityMultiplier,
      unit: item.unit,
      unit_cost: 0,
      material_cost: 0,
      labor_cost: 0,
      equipment_cost: 0,
      material_id: item.material_id,
    }));

    const { error: insertError } = await context.supabase
      .from("estimate_line_items")
      .insert(lineItems);

    if (insertError) throw insertError;

    revalidatePath(`/projects/${estimate.project_id}`);

    return { success: true, data: { itemsCreated: lineItems.length } };
  } catch (error) {
    console.error("[applyAssembly] Error:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to apply assembly",
    };
  }
}
