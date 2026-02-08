"use server";

import { getUserContext } from "@/lib/auth-context";
import { z } from "zod";

const CreatePricingTemplateSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  isDefault: z.boolean().default(false),
  items: z.array(
    z.object({
      trade: z.string(),
      category: z.enum([
        "structural",
        "architectural",
        "mechanical",
        "electrical",
        "plumbing",
        "painting",
        "site",
        "general",
      ]),
      subType: z.string(),
      materialCost: z.number().default(0),
      laborCost: z.number().default(0),
      equipmentCost: z.number().default(0),
      unitCost: z.number(),
      unit: z.string(),
    }),
  ),
});

export async function getPricingTemplates() {
  try {
    const context = await getUserContext();
    if ("error" in context) {
      return { success: false, error: context.error };
    }

    const { data, error } = await context.supabase
      .from("pricing_templates")
      .select("*")
      .eq("company_id", context.companyId)
      .order("created_at", { ascending: false });

    if (error) throw error;

    return { success: true, data };
  } catch (error) {
    console.error("[getPricingTemplates] Error:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to fetch templates",
    };
  }
}

export async function getPricingTemplate(id: string) {
  try {
    const context = await getUserContext();
    if ("error" in context) {
      return { success: false, error: context.error };
    }

    const { data: template, error: templateError } = await context.supabase
      .from("pricing_templates")
      .select("*")
      .eq("id", id)
      .eq("company_id", context.companyId)
      .single();

    if (templateError) throw templateError;

    const { data: items, error: itemsError } = await context.supabase
      .from("pricing_template_items")
      .select("*")
      .eq("template_id", id)
      .eq("company_id", context.companyId);

    if (itemsError) throw itemsError;

    return {
      success: true,
      data: {
        ...template,
        items,
      },
    };
  } catch (error) {
    console.error("[getPricingTemplate] Error:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to fetch template",
    };
  }
}

export async function createPricingTemplate(
  input: z.infer<typeof CreatePricingTemplateSchema>,
) {
  try {
    const context = await getUserContext();
    if ("error" in context) {
      return { success: false, error: context.error };
    }

    const validated = CreatePricingTemplateSchema.parse(input);

    // If isDefault, unset other defaults
    if (validated.isDefault) {
      await context.supabase
        .from("pricing_templates")
        .update({ is_default: false })
        .eq("company_id", context.companyId)
        .eq("is_default", true);
    }

    const { data: template, error: templateError } = await context.supabase
      .from("pricing_templates")
      .insert({
        company_id: context.companyId,
        name: validated.name,
        description: validated.description || null,
        is_default: validated.isDefault,
        created_by: context.userId,
      })
      .select()
      .single();

    if (templateError) throw templateError;

    const itemsToInsert = validated.items.map((item) => ({
      company_id: context.companyId,
      template_id: template.id,
      trade: item.trade,
      category: item.category,
      sub_type: item.subType,
      material_cost: item.materialCost,
      labor_cost: item.laborCost,
      equipment_cost: item.equipmentCost,
      unit_cost: item.unitCost,
      unit: item.unit,
    }));

    const { error: itemsError } = await context.supabase
      .from("pricing_template_items")
      .insert(itemsToInsert);

    if (itemsError) throw itemsError;

    return { success: true, data: template };
  } catch (error) {
    console.error("[createPricingTemplate] Error:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to create template",
    };
  }
}

export async function deletePricingTemplate(id: string) {
  try {
    const context = await getUserContext();
    if ("error" in context) {
      return { success: false, error: context.error };
    }

    const { error } = await context.supabase
      .from("pricing_templates")
      .delete()
      .eq("id", id)
      .eq("company_id", context.companyId);

    if (error) throw error;

    return { success: true, data: null };
  } catch (error) {
    console.error("[deletePricingTemplate] Error:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to delete template",
    };
  }
}

export async function applyPricingTemplate(
  templateId: string,
  estimateId: string,
) {
  try {
    const context = await getUserContext();
    if ("error" in context) {
      return { success: false, error: context.error };
    }

    // Get template items
    const { data: templateItems, error: templateError } = await context.supabase
      .from("pricing_template_items")
      .select("*")
      .eq("template_id", templateId)
      .eq("company_id", context.companyId);

    if (templateError) throw templateError;

    // Get estimate line items
    const { data: lineItems, error: lineItemsError } = await context.supabase
      .from("estimate_line_items")
      .select("*")
      .eq("estimate_id", estimateId)
      .eq("company_id", context.companyId);

    if (lineItemsError) throw lineItemsError;

    let matched = 0;

    // Match and update
    for (const lineItem of lineItems) {
      // Find matching template item by trade + category
      const match = templateItems.find(
        (ti) =>
          ti.trade === lineItem.trade && ti.category === lineItem.category,
      );

      if (match) {
        const { error: updateError } = await context.supabase
          .from("estimate_line_items")
          .update({
            unit_cost: match.unit_cost,
            material_cost: match.material_cost,
            labor_cost: match.labor_cost,
            equipment_cost: match.equipment_cost,
            subtotal: Number((lineItem.quantity * match.unit_cost).toFixed(2)),
          })
          .eq("id", lineItem.id);

        if (!updateError) matched++;
      }
    }

    // Recalculate estimate totals
    const { data: updatedLineItems } = await context.supabase
      .from("estimate_line_items")
      .select("subtotal")
      .eq("estimate_id", estimateId)
      .eq("company_id", context.companyId);

    const subtotal =
      updatedLineItems?.reduce((sum, item) => sum + Number(item.subtotal), 0) ||
      0;

    const { data: estimate } = await context.supabase
      .from("estimates")
      .select("overhead_pct, markup_pct")
      .eq("id", estimateId)
      .eq("company_id", context.companyId)
      .single();

    if (estimate) {
      const overheadAmount = subtotal * (estimate.overhead_pct / 100);
      const markupAmount =
        (subtotal + overheadAmount) * (estimate.markup_pct / 100);
      const grandTotal = subtotal + overheadAmount + markupAmount;

      await context.supabase
        .from("estimates")
        .update({
          subtotal: Number(subtotal.toFixed(2)),
          overhead_amount: Number(overheadAmount.toFixed(2)),
          markup_amount: Number(markupAmount.toFixed(2)),
          grand_total: Number(grandTotal.toFixed(2)),
        })
        .eq("id", estimateId);
    }

    return { success: true, data: { matched, total: lineItems.length } };
  } catch (error) {
    console.error("[applyPricingTemplate] Error:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to apply template",
    };
  }
}
