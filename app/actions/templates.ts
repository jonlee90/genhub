"use server";

import { getUserContext } from "@/lib/auth-context";
import { z } from "zod";
import { revalidatePath } from "next/cache";

// ============================================
// VALIDATION SCHEMAS
// ============================================

const TemplateLineItemSchema = z.object({
  trade: z.string(),
  description: z.string(),
  unit: z.string(),
  unitCost: z.number(),
});

const CreateTemplateSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  category: z.enum([
    "residential",
    "commercial_ti",
    "warehouse",
    "retail",
    "office",
  ]),
  isCompanyTemplate: z.boolean().default(true),
  lineItems: z.array(TemplateLineItemSchema),
});

const UpdateTemplateSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  category: z
    .enum(["residential", "commercial_ti", "warehouse", "retail", "office"])
    .optional(),
  lineItems: z.array(TemplateLineItemSchema).optional(),
});

const GetTemplatesSchema = z.object({
  search: z.string().optional(),
  category: z.string().optional(),
  isCompanyTemplate: z.boolean().optional(),
});

const ApplyTemplateSchema = z.object({
  estimateId: z.string().uuid(),
  templateId: z.string().uuid(),
});

const CreateTemplateVersionSchema = z.object({
  templateId: z.string().uuid(),
  changelog: z.string(),
});

// ============================================
// TEMPLATE CRUD
// ============================================

/**
 * Create a new pricing template
 * P2.7: Template Management Backend (EST-P2-007)
 */
export async function createTemplate(
  input: z.infer<typeof CreateTemplateSchema>,
) {
  try {
    const context = await getUserContext();
    if ("error" in context) {
      return { success: false, error: context.error };
    }

    const validated = CreateTemplateSchema.parse(input);

    const { data, error } = await context.supabase
      .from("pricing_templates")
      .insert({
        company_id: context.companyId,
        name: validated.name,
        description: validated.description,
        category: validated.category,
        is_company_template: validated.isCompanyTemplate,
        version: 1,
        template_data: { lineItems: validated.lineItems },
        changelog: [`Created template v1`],
        created_by: context.userId,
      })
      .select()
      .single();

    if (error) throw error;

    revalidatePath("/estimates");

    return { success: true, data };
  } catch (error) {
    console.error("[createTemplate] Error:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to create template",
    };
  }
}

/**
 * Get pricing templates with optional filters
 * P2.7: Template Management Backend (EST-P2-007)
 */
export async function getTemplates(input: z.infer<typeof GetTemplatesSchema>) {
  try {
    const context = await getUserContext();
    if ("error" in context) {
      return { success: false, error: context.error };
    }

    const validated = GetTemplatesSchema.parse(input);

    let query = context.supabase
      .from("pricing_templates")
      .select("*")
      .eq("company_id", context.companyId)
      .order("created_at", { ascending: false });

    if (validated.category) {
      query = query.eq("category", validated.category);
    }

    if (validated.isCompanyTemplate !== undefined) {
      query = query.eq("is_company_template", validated.isCompanyTemplate);
    }

    if (validated.search) {
      query = query.or(
        `name.ilike.%${validated.search}%,description.ilike.%${validated.search}%`,
      );
    }

    const { data, error } = await query;

    if (error) throw error;

    // Get last used date for each template
    const templatesWithUsage = await Promise.all(
      (data || []).map(async (template) => {
        const { data: lastUsage } = await context.supabase
          .from("template_usage" as any)
          .select("created_at")
          .eq("template_id", template.id)
          .order("created_at", { ascending: false })
          .limit(1)
          .single();

        return {
          ...template,
          last_used_at: (lastUsage as any)?.created_at || null,
        };
      }),
    );

    return { success: true, data: templatesWithUsage };
  } catch (error) {
    console.error("[getTemplates] Error:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to fetch templates",
    };
  }
}

/**
 * Update a pricing template
 * P2.7: Template Management Backend (EST-P2-007)
 */
export async function updateTemplate(
  input: z.infer<typeof UpdateTemplateSchema>,
) {
  try {
    const context = await getUserContext();
    if ("error" in context) {
      return { success: false, error: context.error };
    }

    const validated = UpdateTemplateSchema.parse(input);

    const updateData: Record<string, unknown> = {};
    if (validated.name) updateData.name = validated.name;
    if (validated.description !== undefined)
      updateData.description = validated.description;
    if (validated.category) updateData.category = validated.category;
    if (validated.lineItems) {
      updateData.template_data = { lineItems: validated.lineItems };
    }

    if (Object.keys(updateData).length === 0) {
      return { success: false, error: "No fields to update" };
    }

    const { error } = await context.supabase
      .from("pricing_templates")
      .update(updateData)
      .eq("id", validated.id)
      .eq("company_id", context.companyId);

    if (error) throw error;

    revalidatePath("/estimates");

    return { success: true };
  } catch (error) {
    console.error("[updateTemplate] Error:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to update template",
    };
  }
}

/**
 * Delete a pricing template
 * P2.7: Template Management Backend (EST-P2-007)
 */
export async function deleteTemplate(id: string) {
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

    revalidatePath("/estimates");

    return { success: true };
  } catch (error) {
    console.error("[deleteTemplate] Error:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to delete template",
    };
  }
}

/**
 * Duplicate a pricing template
 * P2.7: Template Management Backend (EST-P2-007)
 */
export async function duplicateTemplate(id: string, newName: string) {
  try {
    const context = await getUserContext();
    if ("error" in context) {
      return { success: false, error: context.error };
    }

    // Get original template
    const { data: original, error: fetchError } = await context.supabase
      .from("pricing_templates")
      .select("*")
      .eq("id", id)
      .eq("company_id", context.companyId)
      .single();

    if (fetchError || !original) {
      return { success: false, error: "Template not found" };
    }
    const originalAny = original as any;

    // Create duplicate
    const { data, error } = await context.supabase
      .from("pricing_templates")
      .insert({
        company_id: context.companyId,
        name: newName,
        description: originalAny.description,
        category: originalAny.category,
        is_company_template: originalAny.is_company_template,
        version: 1,
        template_data: originalAny.template_data,
        changelog: [`Duplicated from ${originalAny.name}`],
        created_by: context.userId,
      })
      .select()
      .single();

    if (error) throw error;

    revalidatePath("/estimates");

    return { success: true, data };
  } catch (error) {
    console.error("[duplicateTemplate] Error:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to duplicate template",
    };
  }
}

/**
 * Apply template to estimate
 * P2.7: Template Management Backend (EST-P2-007)
 */
export async function applyTemplate(
  input: z.infer<typeof ApplyTemplateSchema>,
) {
  try {
    const context = await getUserContext();
    if ("error" in context) {
      return { success: false, error: context.error };
    }

    const validated = ApplyTemplateSchema.parse(input);

    // Get template
    const { data: template, error: templateError } = await context.supabase
      .from("pricing_templates")
      .select("*")
      .eq("id", validated.templateId)
      .eq("company_id", context.companyId)
      .single();

    if (templateError || !template) {
      return { success: false, error: "Template not found" };
    }

    // Get estimate line items
    const { data: estimate, error: estimateError } = await context.supabase
      .from("estimates")
      .select(
        `
        id,
        project_id,
        estimate_line_items (
          id,
          trade,
          description
        )
      `,
      )
      .eq("id", validated.estimateId)
      .eq("company_id", context.companyId)
      .single();

    if (estimateError || !estimate) {
      return { success: false, error: "Estimate not found" };
    }

    // Apply pricing from template to matching line items
    const templateData = (template as any).template_data as {
      lineItems: Array<{
        trade: string;
        description: string;
        unitCost: number;
      }>;
    };
    const lineItems = estimate.estimate_line_items as Array<{
      id: string;
      trade: string;
      description: string;
    }>;

    const updates = lineItems
      .map((item) => {
        const match = templateData.lineItems.find(
          (t) =>
            t.trade.toLowerCase() === item.trade.toLowerCase() &&
            t.description
              .toLowerCase()
              .includes(item.description.toLowerCase()),
        );

        if (match) {
          return {
            id: item.id,
            unit_cost: match.unitCost,
          };
        }
        return null;
      })
      .filter(Boolean);

    // Update line items in parallel
    await Promise.all(
      updates.map((update) =>
        update
          ? context.supabase
              .from("estimate_line_items")
              .update({ unit_cost: update.unit_cost })
              .eq("id", update.id)
          : Promise.resolve(),
      ),
    );

    // Log template usage
    await context.supabase.from("template_usage" as any).insert({
      template_id: validated.templateId,
      user_id: context.userId,
      estimate_id: validated.estimateId,
    });

    const projectId = (estimate as unknown as { project_id: string })
      .project_id;
    revalidatePath(`/projects/${projectId}`);

    return { success: true, data: { itemsUpdated: updates.length } };
  } catch (error) {
    console.error("[applyTemplate] Error:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to apply template",
    };
  }
}

/**
 * Create new template version
 * P2.7: Template Management Backend (EST-P2-007)
 */
export async function createTemplateVersion(
  input: z.infer<typeof CreateTemplateVersionSchema>,
) {
  try {
    const context = await getUserContext();
    if ("error" in context) {
      return { success: false, error: context.error };
    }

    const validated = CreateTemplateVersionSchema.parse(input);

    // Get current template
    const { data: template, error: fetchError } = await context.supabase
      .from("pricing_templates")
      .select("*")
      .eq("id", validated.templateId)
      .eq("company_id", context.companyId)
      .single();

    if (fetchError || !template) {
      return { success: false, error: "Template not found" };
    }

    const templateAny = template as any;
    const newVersion = (templateAny.version || 1) + 1;
    const changelog = (templateAny.changelog as string[]) || [];
    const newChangelog = [
      ...changelog,
      `v${newVersion}: ${validated.changelog}`,
    ];

    const { error: updateError } = await context.supabase
      .from("pricing_templates")
      .update({
        version: newVersion,
        changelog: newChangelog,
      } as any)
      .eq("id", validated.templateId);

    if (updateError) throw updateError;

    revalidatePath("/estimates");

    return { success: true, data: { version: newVersion } };
  } catch (error) {
    console.error("[createTemplateVersion] Error:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to create template version",
    };
  }
}

/**
 * Get template version history
 * P2.7: Template Management Backend (EST-P2-007)
 */
export async function getTemplateVersionHistory(templateId: string) {
  try {
    const context = await getUserContext();
    if ("error" in context) {
      return { success: false, error: context.error };
    }

    const { data, error } = await context.supabase
      .from("pricing_templates")
      .select("version, changelog, updated_at")
      .eq("id", templateId)
      .eq("company_id", context.companyId)
      .single();

    if (error || !data) {
      return { success: false, error: "Template not found" };
    }

    return { success: true, data };
  } catch (error) {
    console.error("[getTemplateVersionHistory] Error:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to fetch version history",
    };
  }
}
