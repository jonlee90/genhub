"use server";

import { getUserContext } from "@/lib/auth-context";
import { z } from "zod";
import { revalidatePath } from "next/cache";

// ============================================
// VALIDATION SCHEMAS
// ============================================

const CreateEstimateSchema = z.object({
  projectId: z.string().uuid(),
  planUploadId: z.string().uuid().optional(),
  name: z.string().min(1),
  description: z.string().optional(),
  overheadPct: z.number().min(0).max(100).default(10),
  markupPct: z.number().min(0).max(100).default(15),
  lineItems: z.array(
    z.object({
      takeoffItemId: z.string().uuid().optional(),
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
      description: z.string().optional(),
      quantity: z.number(),
      unit: z.string(),
      materialCost: z.number().default(0),
      laborCost: z.number().default(0),
      equipmentCost: z.number().default(0),
      unitCost: z.number(),
    }),
  ),
});

const UpdateEstimateSchema = z.object({
  estimateId: z.string().uuid(),
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  overheadPct: z.number().min(0).max(100).optional(),
  markupPct: z.number().min(0).max(100).optional(),
});

// ============================================
// ESTIMATES CRUD
// ============================================

export async function getEstimates(projectId: string) {
  try {
    const context = await getUserContext();
    if ("error" in context) {
      return { success: false, error: context.error };
    }

    const { data, error } = await context.supabase
      .from("estimates")
      .select("*")
      .eq("project_id", projectId)
      .eq("company_id", context.companyId)
      .order("created_at", { ascending: false });

    if (error) throw error;

    return { success: true, data };
  } catch (error) {
    console.error("[getEstimates] Error:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to fetch estimates",
    };
  }
}

export async function getEstimate(estimateId: string) {
  try {
    const context = await getUserContext();
    if ("error" in context) {
      return { success: false, error: context.error };
    }

    const { data: estimate, error: estimateError } = await context.supabase
      .from("estimates")
      .select("*")
      .eq("id", estimateId)
      .eq("company_id", context.companyId)
      .single();

    if (estimateError) throw estimateError;

    const { data: lineItems, error: lineItemsError } = await context.supabase
      .from("estimate_line_items")
      .select("*")
      .eq("estimate_id", estimateId)
      .eq("company_id", context.companyId)
      .order("sort_order", { ascending: true });

    if (lineItemsError) throw lineItemsError;

    return {
      success: true,
      data: {
        ...estimate,
        lineItems,
      },
    };
  } catch (error) {
    console.error("[getEstimate] Error:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to fetch estimate",
    };
  }
}

export async function createEstimate(
  input: z.infer<typeof CreateEstimateSchema>,
) {
  try {
    const context = await getUserContext();
    if ("error" in context) {
      return { success: false, error: context.error };
    }

    const validated = CreateEstimateSchema.parse(input);

    // Calculate totals
    const subtotal = validated.lineItems.reduce((sum, item) => {
      const itemSubtotal = item.quantity * item.unitCost;
      return sum + itemSubtotal;
    }, 0);

    const overheadAmount = subtotal * (validated.overheadPct / 100);
    const markupAmount =
      (subtotal + overheadAmount) * (validated.markupPct / 100);
    const grandTotal = subtotal + overheadAmount + markupAmount;

    // Insert estimate
    const { data: estimate, error: estimateError } = await context.supabase
      .from("estimates")
      .insert({
        company_id: context.companyId,
        project_id: validated.projectId,
        plan_upload_id: validated.planUploadId || null,
        name: validated.name,
        description: validated.description || null,
        status: "draft",
        subtotal: Number(subtotal.toFixed(2)),
        overhead_pct: validated.overheadPct,
        overhead_amount: Number(overheadAmount.toFixed(2)),
        markup_pct: validated.markupPct,
        markup_amount: Number(markupAmount.toFixed(2)),
        grand_total: Number(grandTotal.toFixed(2)),
        created_by: context.userId,
      })
      .select()
      .single();

    if (estimateError) throw estimateError;

    // Insert line items
    const lineItemsToInsert = validated.lineItems.map((item, index) => ({
      company_id: context.companyId,
      estimate_id: estimate.id,
      takeoff_item_id: item.takeoffItemId || null,
      trade: item.trade,
      category: item.category,
      sub_type: item.subType,
      description: item.description || null,
      quantity: item.quantity,
      unit: item.unit,
      material_cost: item.materialCost,
      labor_cost: item.laborCost,
      equipment_cost: item.equipmentCost,
      unit_cost: item.unitCost,
      subtotal: Number((item.quantity * item.unitCost).toFixed(2)),
      sort_order: index,
    }));

    const { error: lineItemsError } = await context.supabase
      .from("estimate_line_items")
      .insert(lineItemsToInsert);

    if (lineItemsError) throw lineItemsError;

    revalidatePath(`/app/projects/${validated.projectId}`);
    revalidatePath(`/app/estimates/${estimate.id}`);

    return { success: true, data: estimate };
  } catch (error) {
    console.error("[createEstimate] Error:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to create estimate",
    };
  }
}

export async function updateEstimate(
  input: z.infer<typeof UpdateEstimateSchema>,
) {
  try {
    const context = await getUserContext();
    if ("error" in context) {
      return { success: false, error: context.error };
    }

    const validated = UpdateEstimateSchema.parse(input);

    // Get current estimate
    const { data: currentEstimate, error: fetchError } = await context.supabase
      .from("estimates")
      .select("*, estimate_line_items(*)")
      .eq("id", validated.estimateId)
      .eq("company_id", context.companyId)
      .single();

    if (fetchError) throw fetchError;

    // Recalculate if percentages changed
    let updates: any = {};

    if (validated.name !== undefined) updates.name = validated.name;
    if (validated.description !== undefined)
      updates.description = validated.description;

    if (
      validated.overheadPct !== undefined ||
      validated.markupPct !== undefined
    ) {
      const overheadPct = validated.overheadPct ?? currentEstimate.overhead_pct;
      const markupPct = validated.markupPct ?? currentEstimate.markup_pct;
      const subtotal = Number(currentEstimate.subtotal);

      const overheadAmount = subtotal * (overheadPct / 100);
      const markupAmount = (subtotal + overheadAmount) * (markupPct / 100);
      const grandTotal = subtotal + overheadAmount + markupAmount;

      updates.overhead_pct = overheadPct;
      updates.overhead_amount = Number(overheadAmount.toFixed(2));
      updates.markup_pct = markupPct;
      updates.markup_amount = Number(markupAmount.toFixed(2));
      updates.grand_total = Number(grandTotal.toFixed(2));
    }

    const { data, error } = await context.supabase
      .from("estimates")
      .update(updates)
      .eq("id", validated.estimateId)
      .eq("company_id", context.companyId)
      .select()
      .single();

    if (error) throw error;

    revalidatePath(`/app/estimates/${validated.estimateId}`);

    return { success: true, data };
  } catch (error) {
    console.error("[updateEstimate] Error:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to update estimate",
    };
  }
}

export async function approveEstimate(estimateId: string) {
  try {
    const context = await getUserContext();
    if ("error" in context) {
      return { success: false, error: context.error };
    }

    // Check role (admin only)
    if (context.role !== "admin") {
      return {
        success: false,
        error: "Insufficient permissions to approve estimates",
      };
    }

    const { data, error } = await context.supabase
      .from("estimates")
      .update({
        status: "approved",
        approved_by: context.userId,
        approved_at: new Date().toISOString(),
      })
      .eq("id", estimateId)
      .eq("company_id", context.companyId)
      .select()
      .single();

    if (error) throw error;

    revalidatePath(`/app/estimates/${estimateId}`);

    return { success: true, data };
  } catch (error) {
    console.error("[approveEstimate] Error:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to approve estimate",
    };
  }
}

// ============================================
// PLAN UPLOADS AND PAGES (Tasks 1.9)
// ============================================

export async function getPlanUploads(projectId: string) {
  try {
    const context = await getUserContext();
    if ("error" in context) {
      return { success: false, error: context.error };
    }

    const { data, error } = await context.supabase
      .from("plan_uploads")
      .select("*")
      .eq("project_id", projectId)
      .eq("company_id", context.companyId)
      .order("created_at", { ascending: false });

    if (error) throw error;

    return { success: true, data };
  } catch (error) {
    console.error("[getPlanUploads] Error:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to fetch plan uploads",
    };
  }
}

export async function getPlanPages(planUploadId: string) {
  try {
    const context = await getUserContext();
    if ("error" in context) {
      return { success: false, error: context.error };
    }

    const { data: pages, error: pagesError } = await context.supabase
      .from("plan_pages")
      .select("*")
      .eq("plan_upload_id", planUploadId)
      .eq("company_id", context.companyId)
      .order("page_number", { ascending: true });

    if (pagesError) throw pagesError;

    // Generate signed URLs for each page
    const pagesWithUrls = await Promise.all(
      pages.map(async (page) => {
        const { data: signedUrl } = await context.supabase.storage
          .from("plan-pages")
          .createSignedUrl(page.image_path, 3600); // 1hr expiry

        return {
          ...page,
          signedUrl: signedUrl?.signedUrl || null,
        };
      }),
    );

    return { success: true, data: pagesWithUrls };
  } catch (error) {
    console.error("[getPlanPages] Error:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to fetch plan pages",
    };
  }
}

export async function getParseResults(pageId: string) {
  try {
    const context = await getUserContext();
    if ("error" in context) {
      return { success: false, error: context.error };
    }

    const { data, error } = await context.supabase
      .from("plan_parse_results")
      .select("*")
      .eq("plan_page_id", pageId)
      .eq("company_id", context.companyId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) throw error;

    return { success: true, data };
  } catch (error) {
    console.error("[getParseResults] Error:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to fetch parse results",
    };
  }
}

// ============================================
// TAKEOFF ITEMS CRUD (Tasks 1.10)
// ============================================

const UpdateTakeoffItemSchema = z.object({
  itemId: z.string().uuid(),
  quantity: z.number().optional(),
  unit: z.string().optional(),
  wasteFactor: z.number().min(0).max(1).optional(),
  subType: z.string().optional(),
  notes: z.string().optional(),
});

const ReviewTakeoffItemSchema = z.object({
  itemId: z.string().uuid(),
  reviewStatus: z.enum(["accepted", "rejected", "edited"]),
  notes: z.string().optional(),
});

const ManualTakeoffItemSchema = z.object({
  planUploadId: z.string().uuid(),
  planPageId: z.string().uuid(),
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
  quantity: z.number(),
  unit: z.string(),
  trade: z.string(),
  notes: z.string().optional(),
});

export async function getTakeoffItems(
  planUploadId: string,
  filters?: { trade?: string; reviewStatus?: string; needsReview?: boolean },
) {
  try {
    const context = await getUserContext();
    if ("error" in context) {
      return { success: false, error: context.error };
    }

    let query = context.supabase
      .from("takeoff_items")
      .select("*")
      .eq("plan_upload_id", planUploadId)
      .eq("company_id", context.companyId)
      .order("created_at", { ascending: true });

    if (filters?.trade) {
      query = query.eq("trade", filters.trade);
    }

    if (filters?.reviewStatus) {
      query = query.eq("review_status", filters.reviewStatus as any);
    }

    if (filters?.needsReview !== undefined) {
      query = query.eq("needs_review", filters.needsReview);
    }

    const { data, error } = await query;

    if (error) throw error;

    return { success: true, data };
  } catch (error) {
    console.error("[getTakeoffItems] Error:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to fetch takeoff items",
    };
  }
}

export async function updateTakeoffItem(
  input: z.infer<typeof UpdateTakeoffItemSchema>,
) {
  try {
    const context = await getUserContext();
    if ("error" in context) {
      return { success: false, error: context.error };
    }

    const validated = UpdateTakeoffItemSchema.parse(input);

    // Get current item
    const { data: currentItem, error: fetchError } = await context.supabase
      .from("takeoff_items")
      .select("*")
      .eq("id", validated.itemId)
      .eq("company_id", context.companyId)
      .single();

    if (fetchError) throw fetchError;

    const updates: any = {};
    const editHistory: any[] = JSON.parse(
      (typeof currentItem.edit_history === "string"
        ? currentItem.edit_history
        : JSON.stringify(currentItem.edit_history)) || "[]",
    );

    if (
      validated.quantity !== undefined &&
      validated.quantity !== currentItem.quantity
    ) {
      editHistory.push({
        timestamp: new Date().toISOString(),
        user_id: context.userId,
        field: "quantity",
        old_value: currentItem.quantity,
        new_value: validated.quantity,
      });
      updates.quantity = validated.quantity;
    }

    if (validated.unit !== undefined && validated.unit !== currentItem.unit) {
      editHistory.push({
        timestamp: new Date().toISOString(),
        user_id: context.userId,
        field: "unit",
        old_value: currentItem.unit,
        new_value: validated.unit,
      });
      updates.unit = validated.unit;
    }

    if (
      validated.wasteFactor !== undefined &&
      validated.wasteFactor !== currentItem.waste_factor
    ) {
      editHistory.push({
        timestamp: new Date().toISOString(),
        user_id: context.userId,
        field: "waste_factor",
        old_value: currentItem.waste_factor,
        new_value: validated.wasteFactor,
      });
      updates.waste_factor = validated.wasteFactor;
    }

    if (
      validated.subType !== undefined &&
      validated.subType !== currentItem.sub_type
    ) {
      editHistory.push({
        timestamp: new Date().toISOString(),
        user_id: context.userId,
        field: "sub_type",
        old_value: currentItem.sub_type,
        new_value: validated.subType,
      });
      updates.sub_type = validated.subType;
    }

    if (validated.notes !== undefined) {
      updates.notes = validated.notes;
    }

    // Recalculate adjusted_quantity
    const quantity = updates.quantity ?? currentItem.quantity;
    const wasteFactor = updates.waste_factor ?? currentItem.waste_factor;
    updates.adjusted_quantity = quantity * (1 + wasteFactor);

    updates.edit_history = editHistory;

    const { data, error } = await context.supabase
      .from("takeoff_items")
      .update(updates)
      .eq("id", validated.itemId)
      .eq("company_id", context.companyId)
      .select()
      .single();

    if (error) throw error;

    return { success: true, data };
  } catch (error) {
    console.error("[updateTakeoffItem] Error:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to update takeoff item",
    };
  }
}

export async function reviewTakeoffItem(
  input: z.infer<typeof ReviewTakeoffItemSchema>,
) {
  try {
    const context = await getUserContext();
    if ("error" in context) {
      return { success: false, error: context.error };
    }

    const validated = ReviewTakeoffItemSchema.parse(input);

    // Get current item
    const { data: currentItem, error: fetchError } = await context.supabase
      .from("takeoff_items")
      .select("*")
      .eq("id", validated.itemId)
      .eq("company_id", context.companyId)
      .single();

    if (fetchError) throw fetchError;

    const editHistory: any[] = JSON.parse(
      (typeof currentItem.edit_history === "string"
        ? currentItem.edit_history
        : JSON.stringify(currentItem.edit_history)) || "[]",
    );
    editHistory.push({
      timestamp: new Date().toISOString(),
      user_id: context.userId,
      field: "review_status",
      old_value: currentItem.review_status,
      new_value: validated.reviewStatus,
    });

    const { data, error } = await context.supabase
      .from("takeoff_items")
      .update({
        review_status: validated.reviewStatus,
        reviewed_by: context.userId,
        reviewed_at: new Date().toISOString(),
        needs_review: false,
        notes: validated.notes || currentItem.notes,
        edit_history: editHistory,
      })
      .eq("id", validated.itemId)
      .eq("company_id", context.companyId)
      .select()
      .single();

    if (error) throw error;

    return { success: true, data };
  } catch (error) {
    console.error("[reviewTakeoffItem] Error:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to review takeoff item",
    };
  }
}

export async function addManualTakeoffItem(
  input: z.infer<typeof ManualTakeoffItemSchema>,
) {
  try {
    const context = await getUserContext();
    if ("error" in context) {
      return { success: false, error: context.error };
    }

    const validated = ManualTakeoffItemSchema.parse(input);

    const wasteFactor = 0;
    const adjustedQuantity = validated.quantity * (1 + wasteFactor);

    const { data, error } = await context.supabase
      .from("takeoff_items")
      .insert({
        company_id: context.companyId,
        plan_upload_id: validated.planUploadId,
        plan_page_id: validated.planPageId,
        category: validated.category,
        trade: validated.trade,
        sub_type: validated.subType,
        quantity: validated.quantity,
        unit: validated.unit,
        waste_factor: wasteFactor,
        adjusted_quantity: adjustedQuantity,
        extraction_method: "manual",
        confidence: 1.0,
        needs_review: false,
        review_status: "accepted",
        reviewed_by: context.userId,
        reviewed_at: new Date().toISOString(),
        notes: validated.notes || null,
        edit_history: [],
      })
      .select()
      .single();

    if (error) throw error;

    return { success: true, data };
  } catch (error) {
    console.error("[addManualTakeoffItem] Error:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to add manual takeoff item",
    };
  }
}

export async function deleteTakeoffItem(itemId: string) {
  try {
    const context = await getUserContext();
    if ("error" in context) {
      return { success: false, error: context.error };
    }

    const { error } = await context.supabase
      .from("takeoff_items")
      .delete()
      .eq("id", itemId)
      .eq("company_id", context.companyId);

    if (error) throw error;

    return { success: true, data: null };
  } catch (error) {
    console.error("[deleteTakeoffItem] Error:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to delete takeoff item",
    };
  }
}
