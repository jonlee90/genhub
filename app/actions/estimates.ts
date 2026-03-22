"use server";

import { getUserContext } from "@/lib/auth-context";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import {
  itemToCsiDivision,
  deduplicateItems,
  groupByCsiDivision,
} from "@/lib/extraction/csi-mapper";

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
    const updates: any = {};

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

/**
 * Persist the CostEditor's in-memory line items to the DB.
 * Replaces all existing line items for the estimate (delete + insert).
 * Called when the user navigates from Step 4 (Cost) to Step 5 (Summary).
 */
export async function saveEstimateLineItems(
  estimateId: string,
  items: Array<{
    takeoffItemId: string;
    description: string;
    quantity: number;
    unit: string;
    materialCost: number;
    laborCost: number;
    equipmentCost: number;
    subtotal: number;
  }>,
) {
  try {
    const context = await getUserContext();
    if ("error" in context) {
      return { success: false, error: context.error };
    }

    const validatedId = z.string().uuid().parse(estimateId);

    // Verify estimate belongs to this company
    const { data: estimate, error: fetchError } = await context.supabase
      .from("estimates")
      .select("id, project_id, overhead_pct, markup_pct")
      .eq("id", validatedId)
      .eq("company_id", context.companyId)
      .single();

    if (fetchError || !estimate) {
      return { success: false, error: "Estimate not found" };
    }

    // Look up trade for each takeoff item in one query
    const takeoffIds = [
      ...new Set(items.map((i) => i.takeoffItemId).filter(Boolean)),
    ];
    let tradeMap: Record<string, string> = {};

    if (takeoffIds.length > 0) {
      const { data: takeoffRows } = await context.supabase
        .from("takeoff_items")
        .select("id, trade")
        .in("id", takeoffIds)
        .eq("company_id", context.companyId);

      if (takeoffRows) {
        tradeMap = Object.fromEntries(
          takeoffRows.map((r: any) => [r.id, r.trade || "Other"]),
        );
      }
    }

    // Delete existing line items
    const { error: deleteError } = await context.supabase
      .from("estimate_line_items")
      .delete()
      .eq("estimate_id", validatedId)
      .eq("company_id", context.companyId);

    if (deleteError) throw deleteError;

    if (items.length > 0) {
      const lineItemsToInsert = items.map((item, index) => {
        const unitCost =
          item.quantity > 0
            ? Number(
                (
                  item.materialCost +
                  item.laborCost +
                  item.equipmentCost
                ).toFixed(2),
              )
            : 0;

        return {
          company_id: context.companyId,
          estimate_id: validatedId,
          takeoff_item_id: item.takeoffItemId || null,
          trade: tradeMap[item.takeoffItemId] || "Other",
          category: "general" as const,
          sub_type: item.description,
          description: item.description,
          quantity: item.quantity,
          unit: item.unit,
          material_cost: item.materialCost,
          labor_cost: item.laborCost,
          equipment_cost: item.equipmentCost,
          unit_cost: unitCost,
          subtotal: Number(item.subtotal.toFixed(2)),
          sort_order: index,
        };
      });

      const { error: insertError } = await context.supabase
        .from("estimate_line_items")
        .insert(lineItemsToInsert);

      if (insertError) throw insertError;
    }

    // Update estimate totals
    const subtotal = items.reduce((sum, i) => sum + i.subtotal, 0);
    const overheadAmount = subtotal * ((estimate.overhead_pct ?? 0) / 100);
    const markupAmount =
      (subtotal + overheadAmount) * ((estimate.markup_pct ?? 0) / 100);
    const grandTotal = subtotal + overheadAmount + markupAmount;

    await context.supabase
      .from("estimates")
      .update({
        subtotal: Number(subtotal.toFixed(2)),
        overhead_amount: Number(overheadAmount.toFixed(2)),
        markup_amount: Number(markupAmount.toFixed(2)),
        grand_total: Number(grandTotal.toFixed(2)),
      })
      .eq("id", validatedId)
      .eq("company_id", context.companyId);

    revalidatePath(`/app/projects/${estimate.project_id}`);

    return { success: true };
  } catch (error) {
    console.error("[saveEstimateLineItems] Error:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to save line items",
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

    const itemsWithCsi = (data ?? []).map((item) => ({
      ...item,
      csiDivision: itemToCsiDivision(
        item.category,
        item.sub_type,
        item.trade ?? undefined,
      ),
    }));

    return { success: true, data: itemsWithCsi };
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

export async function getDeduplicatedEstimateSummary(planUploadId: string) {
  try {
    const context = await getUserContext();
    if ("error" in context) {
      return { success: false, error: context.error };
    }

    const { data: allItems, error } = await context.supabase
      .from("takeoff_items")
      .select(
        "id, category, sub_type, trade, quantity, unit, confidence, needs_review",
      )
      .eq("plan_upload_id", planUploadId)
      .eq("company_id", context.companyId)
      .neq("review_status", "rejected");

    if (error) throw error;

    const items = allItems ?? [];

    const deduped = deduplicateItems(
      items.map((i) => ({
        id: i.id,
        category: i.category,
        sub_type: i.sub_type,
        trade: i.trade ?? undefined,
        quantity: i.quantity,
        unit: i.unit,
        confidence: i.confidence,
        needs_review: i.needs_review,
        source_sheet: undefined,
      })),
    );

    const grouped = groupByCsiDivision(deduped);
    const divisions = Array.from(grouped.entries()).map(
      ([code, { division, items: divItems }]) => ({
        code,
        name: division.name,
        items: divItems,
        itemCount: divItems.length,
        needsReviewCount: divItems.filter((i) => i.needsReview).length,
      }),
    );

    return {
      success: true,
      data: {
        totalItems: deduped.length,
        rawItemCount: items.length,
        duplicatesRemoved: items.length - deduped.length,
        divisions,
        allDeduped: deduped,
      },
    };
  } catch (error) {
    console.error("[getDeduplicatedEstimateSummary] Error:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to fetch deduplicated estimate summary",
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

// ============================================
// PLAN PAGE STATUS POLLING (AI Parsing)
// ============================================

export async function getPlanPageStatus(planUploadId: string) {
  try {
    const context = await getUserContext();
    if ("error" in context) {
      return { success: false as const, error: context.error };
    }

    // Verify plan upload belongs to company
    const { data: planUpload, error: uploadError } = await context.supabase
      .from("plan_uploads")
      .select("id, company_id")
      .eq("id", planUploadId)
      .eq("company_id", context.companyId)
      .single();

    if (uploadError || !planUpload) {
      return { success: false as const, error: "Plan upload not found" };
    }

    // Get all pages for this upload
    const { data: pages, error: pagesError } = await context.supabase
      .from("plan_pages")
      .select("id, page_number, parse_status, parsed_at")
      .eq("plan_upload_id", planUploadId)
      .eq("company_id", context.companyId)
      .order("page_number", { ascending: true });

    if (pagesError) throw pagesError;

    const pageStatuses = (pages || []).map((page) => ({
      id: page.id,
      pageNumber: page.page_number,
      parseStatus: page.parse_status,
      parsedAt: page.parsed_at,
    }));

    const allParsed =
      pages && pages.length > 0
        ? pages.every((p) => p.parse_status === "parsed")
        : false;

    const anyFailed =
      pages && pages.length > 0
        ? pages.some((p) => p.parse_status === "parse_failed")
        : false;

    return {
      success: true as const,
      data: {
        planUploadId,
        pages: pageStatuses,
        allParsed,
        anyFailed,
      },
    };
  } catch (error) {
    console.error("[getPlanPageStatus] Error:", error);
    return {
      success: false as const,
      error:
        error instanceof Error ? error.message : "Failed to get parse status",
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

// ============================================
// BULK OPERATIONS (P1.2)
// ============================================

const BulkTakeoffItemsSchema = z.object({
  itemIds: z.array(z.string().uuid()).min(1),
});

export async function bulkAcceptTakeoffItems(itemIds: string[]) {
  try {
    const context = await getUserContext();
    if ("error" in context) {
      return { success: false, error: context.error };
    }

    const validated = BulkTakeoffItemsSchema.parse({ itemIds });

    // Parallel update (async-parallel)
    const { error } = await context.supabase
      .from("takeoff_items")
      .update({
        review_status: "accepted",
        reviewed_by: context.userId,
        reviewed_at: new Date().toISOString(),
        needs_review: false,
      })
      .in("id", validated.itemIds)
      .eq("company_id", context.companyId);

    if (error) throw error;

    return { success: true, data: { count: validated.itemIds.length } };
  } catch (error) {
    console.error("[bulkAcceptTakeoffItems] Error:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to bulk accept takeoff items",
    };
  }
}

export async function bulkRejectTakeoffItems(itemIds: string[]) {
  try {
    const context = await getUserContext();
    if ("error" in context) {
      return { success: false, error: context.error };
    }

    const validated = BulkTakeoffItemsSchema.parse({ itemIds });

    // Parallel update (async-parallel)
    const { error } = await context.supabase
      .from("takeoff_items")
      .update({
        review_status: "rejected",
        reviewed_by: context.userId,
        reviewed_at: new Date().toISOString(),
        needs_review: false,
      })
      .in("id", validated.itemIds)
      .eq("company_id", context.companyId);

    if (error) throw error;

    return { success: true, data: { count: validated.itemIds.length } };
  } catch (error) {
    console.error("[bulkRejectTakeoffItems] Error:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to bulk reject takeoff items",
    };
  }
}

// ============================================
// MICRO-CONFIRMATIONS (L8 Validation Layer)
// ============================================

const RespondToMicroConfirmationSchema = z.object({
  confirmationId: z.string().uuid(),
  response: z.string().min(1),
});

/**
 * Respond to a micro-confirmation card and update extraction confidence.
 *
 * Task: EST-P1-007 Micro-Confirmation Cards (L8 validation layer)
 *
 * @param input - Confirmation ID and user response
 * @returns Updated confirmation with confidence boost
 */
export async function respondToMicroConfirmation(
  input: z.infer<typeof RespondToMicroConfirmationSchema>,
) {
  try {
    const context = await getUserContext();
    if ("error" in context) {
      return { success: false, error: context.error };
    }

    const validated = RespondToMicroConfirmationSchema.parse(input);

    // Get confirmation details
    const { data: confirmation, error: fetchError } = await context.supabase
      .from("micro_confirmations" as any)
      .select("*")
      .eq("id", validated.confirmationId)
      .eq("company_id", context.companyId)
      .single();

    if (fetchError) throw fetchError;
    if (!confirmation) throw new Error("Confirmation not found");

    // Calculate confidence boost
    const { calculateConfidenceBoost } =
      await import("@/lib/extraction/validation/micro-confirmation");
    const boost = calculateConfidenceBoost(
      (confirmation as any).confirmation_type,
      validated.response,
    );

    // Update confirmation with response
    const { data: updated, error: updateError } = await context.supabase
      .from("micro_confirmations" as any)
      .update({
        user_response: validated.response,
        responded_by: context.userId,
        responded_at: new Date().toISOString(),
        confidence_boost: boost,
      } as any)
      .eq("id", validated.confirmationId)
      .eq("company_id", context.companyId)
      .select()
      .single();

    if (updateError) throw updateError;

    // Update related takeoff items' confidence if takeoff_item_id exists
    const confirmationTyped = confirmation as any;
    if (confirmationTyped.takeoff_item_id) {
      const { data: takeoffItem } = await context.supabase
        .from("takeoff_items")
        .select("confidence")
        .eq("id", confirmationTyped.takeoff_item_id)
        .eq("company_id", context.companyId)
        .single();

      if (takeoffItem) {
        const currentConfidence = Number(takeoffItem.confidence);
        const newConfidence = Math.min(100, currentConfidence + boost);

        await context.supabase
          .from("takeoff_items")
          .update({ confidence: newConfidence })
          .eq("id", confirmationTyped.takeoff_item_id)
          .eq("company_id", context.companyId);
      }
    }

    // Update confidence for related elements from context_data
    const contextData = confirmationTyped.context_data as any;
    if (contextData?.relatedElementIds?.length > 0) {
      // Fetch all related takeoff items
      const { data: relatedItems } = await context.supabase
        .from("takeoff_items")
        .select("id, confidence")
        .in("id", contextData.relatedElementIds)
        .eq("company_id", context.companyId);

      if (relatedItems && relatedItems.length > 0) {
        // Update confidence for each item
        const updates = relatedItems.map((item) => {
          const currentConfidence = Number(item.confidence);
          const newConfidence = Math.min(100, currentConfidence + boost);
          return context.supabase
            .from("takeoff_items")
            .update({ confidence: newConfidence })
            .eq("id", item.id)
            .eq("company_id", context.companyId);
        });

        await Promise.all(updates);
      }
    }

    revalidatePath(`/app/estimates`);

    return {
      success: true,
      data: {
        confirmation: updated,
        confidenceBoost: boost,
      },
    };
  } catch (error) {
    console.error("[respondToMicroConfirmation] Error:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to respond to micro-confirmation",
    };
  }
}

/**
 * Get pending micro-confirmations for a plan upload.
 *
 * @param planUploadId - Plan upload ID
 * @returns Array of pending confirmations
 */
export async function getPendingMicroConfirmations(planUploadId: string) {
  try {
    const context = await getUserContext();
    if ("error" in context) {
      return { success: false, error: context.error };
    }

    const validated = z.string().uuid().parse(planUploadId);

    const { data, error } = await context.supabase
      .from("micro_confirmations" as any)
      .select("*")
      .eq("plan_upload_id", validated)
      .eq("company_id", context.companyId)
      .is("responded_at", null)
      .order("created_at", { ascending: true })
      .limit(5); // Max 5 cards

    if (error) throw error;

    return { success: true, data: data || [] };
  } catch (error) {
    console.error("[getPendingMicroConfirmations] Error:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to fetch pending confirmations",
    };
  }
}

// ============================================
// EXTRACTION JOB PROGRESS (P1.8, P1.11)
// ============================================

/**
 * Get extraction job progress for a plan upload.
 * Used for progress tracking and progressive result loading.
 *
 * @param planUploadId - Plan upload ID
 * @returns Extraction progress data
 */
export async function getExtractionProgress(planUploadId: string) {
  try {
    const context = await getUserContext();
    if ("error" in context) {
      return { success: false, error: context.error };
    }

    const validated = z.string().uuid().parse(planUploadId);

    const { data: jobs, error } = await context.supabase
      .from("extraction_jobs" as any)
      .select(
        "id, plan_upload_id, page_number, stage, status, error, claimed_at, completed_at",
      )
      .eq("plan_upload_id", validated)
      .eq("company_id", context.companyId)
      .order("page_number", { ascending: true })
      .order("created_at", { ascending: true });

    if (error) throw error;

    return { success: true, data: jobs || [] };
  } catch (error) {
    console.error("[getExtractionProgress] Error:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to fetch extraction progress",
    };
  }
}

/**
 * Retry failed extraction jobs for specific pages.
 *
 * @param planUploadId - Plan upload ID
 * @param pageIds - Array of page numbers to retry
 * @returns Count of retried jobs
 */
export async function retryFailedExtractionJobs(
  planUploadId: string,
  pageIds: number[],
) {
  try {
    const context = await getUserContext();
    if ("error" in context) {
      return { success: false, error: context.error };
    }

    const validated = z
      .object({
        planUploadId: z.string().uuid(),
        pageIds: z.array(z.number().int().positive()),
      })
      .parse({ planUploadId, pageIds });

    // Use admin client for job mutations
    const { createAdminClient } = await import("@/utils/supabase/server");
    const supabase = createAdminClient();

    const { data: retriedJobs, error } = await supabase
      .from("extraction_jobs" as any)
      .update({
        status: "pending" as any,
        error: null,
        attempt: 0,
        claimed_at: null,
        heartbeat_at: null,
      } as any)
      .eq("plan_upload_id", validated.planUploadId)
      .eq("company_id", context.companyId)
      .in("page_number", validated.pageIds)
      .eq("status", "failed" as any)
      .select("id");

    if (error) throw error;

    return {
      success: true,
      data: { retriedJobCount: retriedJobs?.length || 0 },
    };
  } catch (error) {
    console.error("[retryFailedExtractionJobs] Error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to retry jobs",
    };
  }
}

// ============================================
// PLAN MEASUREMENTS (EST-P3-001)
// ============================================

// Local type for plan_measurements rows (table added in migration 20260216000007)
type PlanMeasurement = {
  id: string;
  plan_upload_id: string;
  page_number: number;
  company_id: string;
  measurement_type: "area" | "linear" | "count";
  points: Array<{ x: number; y: number }>;
  scale_ratio: number | null;
  result_value: number | null;
  result_unit: string | null;
  takeoff_item_id: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
};

const SaveMeasurementSchema = z.object({
  planUploadId: z.string().uuid(),
  pageNumber: z.number().int().positive(),
  type: z.enum(["area", "linear", "count"]),
  points: z.array(z.object({ x: z.number(), y: z.number() })).min(1),
  scaleRatio: z.number().positive().optional(),
  resultValue: z.number(),
  resultUnit: z.string().min(1),
  takeoffItemId: z.string().uuid().optional(),
});

const UpdateMeasurementSchema = z.object({
  planUploadId: z.string().uuid().optional(),
  pageNumber: z.number().int().positive().optional(),
  type: z.enum(["area", "linear", "count"]).optional(),
  points: z
    .array(z.object({ x: z.number(), y: z.number() }))
    .min(1)
    .optional(),
  scaleRatio: z.number().positive().optional(),
  resultValue: z.number().optional(),
  resultUnit: z.string().min(1).optional(),
  takeoffItemId: z.string().uuid().optional(),
});

/**
 * Save a new measurement annotation on a plan page.
 * Task: EST-P3-001-B
 */
export async function saveMeasurement(
  data: z.infer<typeof SaveMeasurementSchema>,
): Promise<{ data: PlanMeasurement | null; error: string | null }> {
  try {
    const context = await getUserContext();
    if ("error" in context) {
      return { data: null, error: context.error ?? null };
    }

    const validated = SaveMeasurementSchema.parse(data);

    // Verify plan_upload belongs to this company (security-no-client-ids)
    const { data: upload, error: uploadError } = await context.supabase
      .from("plan_uploads")
      .select("id, company_id")
      .eq("id", validated.planUploadId)
      .eq("company_id", context.companyId)
      .single();

    if (uploadError || !upload) {
      return { data: null, error: "Plan upload not found" };
    }

    const { data: measurement, error } = await context.supabase
      .from("plan_measurements" as any)
      .insert({
        plan_upload_id: validated.planUploadId,
        page_number: validated.pageNumber,
        company_id: context.companyId,
        measurement_type: validated.type,
        points: validated.points,
        scale_ratio: validated.scaleRatio ?? null,
        result_value: validated.resultValue,
        result_unit: validated.resultUnit,
        takeoff_item_id: validated.takeoffItemId ?? null,
        created_by: context.userId,
      } as any)
      .select()
      .single();

    if (error) throw error;

    revalidatePath(`/app/estimates`);

    return { data: measurement as unknown as PlanMeasurement, error: null };
  } catch (error) {
    console.error("[saveMeasurement] Error:", error);
    return {
      data: null,
      error:
        error instanceof Error ? error.message : "Failed to save measurement",
    };
  }
}

/**
 * Update an existing measurement annotation.
 * Task: EST-P3-001-B
 */
export async function updateMeasurement(
  id: string,
  data: z.infer<typeof UpdateMeasurementSchema>,
): Promise<{ data: PlanMeasurement | null; error: string | null }> {
  try {
    const context = await getUserContext();
    if ("error" in context) {
      return { data: null, error: context.error ?? null };
    }

    const validatedId = z.string().uuid().parse(id);
    const validated = UpdateMeasurementSchema.parse(data);

    const updates: Record<string, unknown> = {};
    if (validated.pageNumber !== undefined)
      updates.page_number = validated.pageNumber;
    if (validated.type !== undefined) updates.measurement_type = validated.type;
    if (validated.points !== undefined) updates.points = validated.points;
    if (validated.scaleRatio !== undefined)
      updates.scale_ratio = validated.scaleRatio;
    if (validated.resultValue !== undefined)
      updates.result_value = validated.resultValue;
    if (validated.resultUnit !== undefined)
      updates.result_unit = validated.resultUnit;
    if ("takeoffItemId" in validated)
      updates.takeoff_item_id = validated.takeoffItemId ?? null;

    const { data: measurement, error } = await context.supabase
      .from("plan_measurements" as any)
      .update(updates as any)
      .eq("id", validatedId)
      .eq("company_id", context.companyId)
      .select()
      .single();

    if (error) throw error;

    return { data: measurement as unknown as PlanMeasurement, error: null };
  } catch (error) {
    console.error("[updateMeasurement] Error:", error);
    return {
      data: null,
      error:
        error instanceof Error ? error.message : "Failed to update measurement",
    };
  }
}

/**
 * Delete a measurement annotation.
 * Task: EST-P3-001-B
 */
export async function deleteMeasurement(
  id: string,
): Promise<{ error: string | null }> {
  try {
    const context = await getUserContext();
    if ("error" in context) {
      return { error: context.error ?? null };
    }

    const validatedId = z.string().uuid().parse(id);

    const { error } = await context.supabase
      .from("plan_measurements" as any)
      .delete()
      .eq("id", validatedId)
      .eq("company_id", context.companyId);

    if (error) throw error;

    revalidatePath(`/app/estimates`);

    return { error: null };
  } catch (error) {
    console.error("[deleteMeasurement] Error:", error);
    return {
      error:
        error instanceof Error ? error.message : "Failed to delete measurement",
    };
  }
}

/**
 * Get all measurements for a given plan upload page.
 * Task: EST-P3-001-B
 */
export async function getMeasurements(
  planUploadId: string,
  pageNumber: number,
): Promise<{ data: PlanMeasurement[]; error: string | null }> {
  try {
    const context = await getUserContext();
    if ("error" in context) {
      return { data: [], error: context.error ?? null };
    }

    const validated = z
      .object({
        planUploadId: z.string().uuid(),
        pageNumber: z.number().int().positive(),
      })
      .parse({ planUploadId, pageNumber });

    const { data, error } = await context.supabase
      .from("plan_measurements" as any)
      .select("*")
      .eq("plan_upload_id", validated.planUploadId)
      .eq("page_number", validated.pageNumber)
      .eq("company_id", context.companyId)
      .order("created_at", { ascending: true });

    if (error) throw error;

    return { data: (data as unknown as PlanMeasurement[]) ?? [], error: null };
  } catch (error) {
    console.error("[getMeasurements] Error:", error);
    return {
      data: [],
      error:
        error instanceof Error ? error.message : "Failed to fetch measurements",
    };
  }
}

// ============================================
// REAL-TIME COLLABORATION (EST-P3-002-B)
// ============================================

export type TradeLock = {
  id: string;
  estimate_id: string;
  trade: string;
  locked_by: string;
  locked_by_name: string | null;
  locked_at: string;
  expires_at: string;
  company_id: string;
};

type ActivityType =
  | "item_added"
  | "item_edited"
  | "item_deleted"
  | "cost_updated"
  | "assembly_applied"
  | "bulk_accepted"
  | "bulk_rejected";

type EstimateActivity = {
  id: string;
  estimate_id: string;
  company_id: string;
  user_id: string;
  action_type: ActivityType;
  details: Record<string, unknown>;
  created_at: string;
};

const ClaimTradeLockSchema = z.object({
  estimateId: z.string().uuid(),
  trade: z.string().min(1),
});

/**
 * Claim an exclusive edit lock on a trade section of an estimate.
 *
 * Idempotent: re-claiming the same trade as the same user returns success.
 * Conflict: if a different user holds a live (unexpired) lock, returns
 * success=false with the lockedBy identifier.
 *
 * Task: EST-P3-002-B
 */
export async function claimTradeLock(
  estimateId: string,
  trade: string,
): Promise<{ success: boolean; lockedBy?: string; error?: string }> {
  try {
    const context = await getUserContext();
    if ("error" in context) {
      return { success: false, error: context.error };
    }

    const validated = ClaimTradeLockSchema.parse({ estimateId, trade });

    // Check for an existing unexpired lock on this (estimate_id, trade)
    const { data: existing, error: fetchError } = await context.supabase
      .from("estimate_locks" as any)
      .select("id, locked_by, expires_at")
      .eq("estimate_id", validated.estimateId)
      .eq("trade", validated.trade)
      .eq("company_id", context.companyId)
      .gt("expires_at", new Date().toISOString())
      .maybeSingle();

    if (fetchError) throw fetchError;

    if (existing) {
      const lock = existing as unknown as {
        id: string;
        locked_by: string;
        expires_at: string;
      };
      // Idempotent: same user already holds the lock
      if (lock.locked_by === context.userId) {
        return { success: true };
      }
      // Another user holds the live lock — return conflict
      return { success: false, lockedBy: lock.locked_by };
    }

    // No live lock: upsert (handles stale lock rows via ON CONFLICT)
    const now = new Date().toISOString();
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000).toISOString();

    const { error: upsertError } = await context.supabase
      .from("estimate_locks" as any)
      .upsert(
        {
          estimate_id: validated.estimateId,
          trade: validated.trade,
          locked_by: context.userId,
          locked_at: now,
          expires_at: expiresAt,
          company_id: context.companyId,
        } as any,
        {
          onConflict: "estimate_id,trade",
          ignoreDuplicates: false,
        },
      );

    if (upsertError) throw upsertError;

    return { success: true };
  } catch (error) {
    console.error("[claimTradeLock] Error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to claim lock",
    };
  }
}

/**
 * Release a trade lock previously claimed by the current user.
 *
 * Only deletes rows where locked_by matches the current user — a user
 * cannot release another user's lock.
 *
 * Task: EST-P3-002-B
 */
export async function releaseTradeLock(
  estimateId: string,
  trade: string,
): Promise<{ error: string | null }> {
  try {
    const context = await getUserContext();
    if ("error" in context) {
      return { error: context.error ?? null };
    }

    const validated = ClaimTradeLockSchema.parse({ estimateId, trade });

    const { error } = await context.supabase
      .from("estimate_locks" as any)
      .delete()
      .eq("estimate_id", validated.estimateId)
      .eq("trade", validated.trade)
      .eq("locked_by", context.userId)
      .eq("company_id", context.companyId);

    if (error) throw error;

    return { error: null };
  } catch (error) {
    console.error("[releaseTradeLock] Error:", error);
    return {
      error: error instanceof Error ? error.message : "Failed to release lock",
    };
  }
}

/**
 * Get all active (unexpired) locks for an estimate.
 *
 * Task: EST-P3-002-B
 */
export async function getActiveLocks(
  estimateId: string,
): Promise<{ data: TradeLock[]; error: string | null }> {
  try {
    const context = await getUserContext();
    if ("error" in context) {
      return { data: [], error: context.error ?? null };
    }

    const validatedId = z.string().uuid().parse(estimateId);

    const { data, error } = await context.supabase
      .from("estimate_locks" as any)
      .select("*")
      .eq("estimate_id", validatedId)
      .eq("company_id", context.companyId)
      .gt("expires_at", new Date().toISOString())
      .order("locked_at", { ascending: true });

    if (error) throw error;

    const locks: TradeLock[] = (data ?? []).map((row: any) => ({
      id: row.id,
      estimate_id: row.estimate_id,
      trade: row.trade,
      locked_by: row.locked_by,
      locked_by_name: null, // cross-schema join not supported by PostgREST
      locked_at: row.locked_at,
      expires_at: row.expires_at,
      company_id: row.company_id,
    }));

    return { data: locks, error: null };
  } catch (error) {
    console.error("[getActiveLocks] Error:", error);
    return {
      data: [],
      error:
        error instanceof Error ? error.message : "Failed to fetch active locks",
    };
  }
}

/**
 * Log an activity event for an estimate.
 *
 * Fire-and-forget: errors are silently swallowed so callers are never
 * blocked by non-critical audit logging.
 *
 * Task: EST-P3-002-B
 */
export async function logEstimateActivity(
  estimateId: string,
  actionType: ActivityType,
  details?: Record<string, unknown>,
): Promise<void> {
  try {
    const context = await getUserContext();
    if ("error" in context) return;

    const validatedId = z.string().uuid().parse(estimateId);

    await context.supabase.from("estimate_activity" as any).insert({
      estimate_id: validatedId,
      company_id: context.companyId,
      user_id: context.userId,
      action_type: actionType,
      details: details ?? {},
    } as any);
  } catch (error) {
    // Silently swallow — activity logging is non-critical
    console.error("[logEstimateActivity] Error (non-critical):", error);
  }
}

/**
 * Get activity log entries for an estimate, newest first.
 *
 * Task: EST-P3-002-B
 */
export async function getEstimateActivity(
  estimateId: string,
  limit = 20,
): Promise<{ data: EstimateActivity[]; error: string | null }> {
  try {
    const context = await getUserContext();
    if ("error" in context) {
      return { data: [], error: context.error ?? null };
    }

    const validated = z
      .object({
        estimateId: z.string().uuid(),
        limit: z.number().int().positive().max(100).default(20),
      })
      .parse({ estimateId, limit });

    const { data, error } = await context.supabase
      .from("estimate_activity" as any)
      .select("*")
      .eq("estimate_id", validated.estimateId)
      .eq("company_id", context.companyId)
      .order("created_at", { ascending: false })
      .limit(validated.limit);

    if (error) throw error;

    return { data: (data as unknown as EstimateActivity[]) ?? [], error: null };
  } catch (error) {
    console.error("[getEstimateActivity] Error:", error);
    return {
      data: [],
      error:
        error instanceof Error
          ? error.message
          : "Failed to fetch estimate activity",
    };
  }
}

/**
 * Calibrate the scale ratio for a plan upload by updating all existing
 * measurements for that upload with the new scale_ratio.
 *
 * Note: plan_uploads does not have a scale_ratio column; scale is stored
 * per-measurement row. This action updates all existing measurements for
 * the upload so they share the calibrated scale.
 *
 * Task: EST-P3-001-B
 */
export async function calibratePlanScale(
  planUploadId: string,
  scaleRatio: number,
): Promise<{ error: string | null }> {
  try {
    const context = await getUserContext();
    if ("error" in context) {
      return { error: context.error ?? null };
    }

    const validated = z
      .object({
        planUploadId: z.string().uuid(),
        scaleRatio: z.number().positive(),
      })
      .parse({ planUploadId, scaleRatio });

    // Verify plan_upload belongs to this company (security-no-client-ids)
    const { data: upload, error: uploadError } = await context.supabase
      .from("plan_uploads")
      .select("id, company_id")
      .eq("id", validated.planUploadId)
      .eq("company_id", context.companyId)
      .single();

    if (uploadError || !upload) {
      return { error: "Plan upload not found" };
    }

    // Update scale_ratio on all existing measurements for this upload
    const { error } = await context.supabase
      .from("plan_measurements" as any)
      .update({ scale_ratio: validated.scaleRatio } as any)
      .eq("plan_upload_id", validated.planUploadId)
      .eq("company_id", context.companyId);

    if (error) throw error;

    revalidatePath(`/app/estimates`);

    return { error: null };
  } catch (error) {
    console.error("[calibratePlanScale] Error:", error);
    return {
      error:
        error instanceof Error
          ? error.message
          : "Failed to calibrate plan scale",
    };
  }
}

// ============================================
// OFFLINE SYNC
// ============================================

// Allowlisted fields that can be updated via offline sync
const SYNC_ALLOWED_FIELDS = new Set([
  "quantity",
  "unit_cost",
  "material_cost",
  "labor_cost",
  "equipment_cost",
  "description",
  "trade",
  "sub_type",
]);

export interface SyncConflict {
  itemId: string;
  field: string;
  localValue: unknown;
  localTimestamp: number;
  serverValue: unknown;
  serverTimestamp: number;
  resolution: "local_wins" | "server_wins";
}

export async function syncOfflineChanges(payload: {
  edits: Array<{
    itemId: string;
    estimateId: string;
    field: string;
    value: unknown;
    timestamp: number;
  }>;
  deletions: Array<{
    itemId: string;
    estimateId: string;
    timestamp: number;
  }>;
}): Promise<{
  applied: string[];
  conflicts: SyncConflict[];
  errors: string[];
}> {
  // security-getUserContext: always validate auth before any DB operation
  const context = await getUserContext();
  if ("error" in context) {
    return {
      applied: [],
      conflicts: [],
      errors: [context.error ?? "Not authenticated"],
    };
  }

  const applied: string[] = [];
  const conflicts: SyncConflict[] = [];
  const errors: string[] = [];

  // Process edits — per-item error isolation (no transactions per spec)
  for (const edit of payload.edits) {
    try {
      // security-zod-validation: reject non-allowlisted fields
      if (!SYNC_ALLOWED_FIELDS.has(edit.field)) {
        errors.push(
          `[edit:${edit.itemId}] Field "${edit.field}" is not allowed for sync`,
        );
        continue;
      }

      // Fetch current row — security-no-client-ids: verify company_id from session
      // Select all syncable fields statically to avoid dynamic select string TS errors
      const fetchResult = await context.supabase
        .from("estimate_line_items")
        .select(
          "id, company_id, created_at, quantity, unit_cost, material_cost, labor_cost, equipment_cost, description, trade, sub_type",
        )
        .eq("id", edit.itemId)
        .eq("estimate_id", edit.estimateId)
        .single();
      const rowData = fetchResult.data as Record<string, unknown> | null;
      const fetchError = fetchResult.error;

      if (fetchError || !rowData) {
        errors.push(`[edit:${edit.itemId}] Row not found`);
        continue;
      }

      // security-no-client-ids: validate company_id against session, never trust client
      if ((rowData.company_id as string) !== context.companyId) {
        errors.push(`[edit:${edit.itemId}] Access denied`);
        continue;
      }

      // Use created_at as the server timestamp (no updated_at column on this table)
      const serverTimestamp = Date.parse(rowData.created_at as string);

      if (edit.timestamp > serverTimestamp) {
        // Local change is newer — apply update
        const { error: updateError } = await context.supabase
          .from("estimate_line_items")
          .update({ [edit.field]: edit.value } as Record<string, unknown>)
          .eq("id", edit.itemId)
          .eq("company_id", context.companyId);

        if (updateError) {
          errors.push(
            `[edit:${edit.itemId}] Update failed: ${updateError.message}`,
          );
          continue;
        }

        applied.push(edit.itemId);
      } else {
        // Server value is same age or newer — report server_wins conflict
        conflicts.push({
          itemId: edit.itemId,
          field: edit.field,
          localValue: edit.value,
          localTimestamp: edit.timestamp,
          serverValue: rowData[edit.field],
          serverTimestamp,
          resolution: "server_wins",
        });
      }
    } catch (err) {
      errors.push(
        `[edit:${edit.itemId}] Unexpected error: ${err instanceof Error ? err.message : String(err)}`,
      );
    }
  }

  // Process deletions — hard DELETE (no deleted_at / is_deleted column on this table)
  for (const deletion of payload.deletions) {
    try {
      // Fetch current row — security-no-client-ids: verify company_id from session
      const delFetchResult = await context.supabase
        .from("estimate_line_items")
        .select("id, company_id, created_at")
        .eq("id", deletion.itemId)
        .eq("estimate_id", deletion.estimateId)
        .single();
      const delRowData = delFetchResult.data as Record<string, unknown> | null;
      const delFetchError = delFetchResult.error;

      if (delFetchError || !delRowData) {
        // Row already gone — treat as applied
        applied.push(deletion.itemId);
        continue;
      }

      // security-no-client-ids: validate company_id against session, never trust client
      if ((delRowData.company_id as string) !== context.companyId) {
        errors.push(`[delete:${deletion.itemId}] Access denied`);
        continue;
      }

      const serverTimestamp = Date.parse(delRowData.created_at as string);

      if (deletion.timestamp > serverTimestamp) {
        // Local deletion is newer — apply hard delete
        const { error: deleteError } = await context.supabase
          .from("estimate_line_items")
          .delete()
          .eq("id", deletion.itemId)
          .eq("company_id", context.companyId);

        if (deleteError) {
          errors.push(
            `[delete:${deletion.itemId}] Delete failed: ${deleteError.message}`,
          );
          continue;
        }

        applied.push(deletion.itemId);
      } else {
        // Server row is same age or newer — report server_wins conflict
        conflicts.push({
          itemId: deletion.itemId,
          field: "__delete__",
          localValue: null,
          localTimestamp: deletion.timestamp,
          serverValue: "__exists__",
          serverTimestamp,
          resolution: "server_wins",
        });
      }
    } catch (err) {
      errors.push(
        `[delete:${deletion.itemId}] Unexpected error: ${err instanceof Error ? err.message : String(err)}`,
      );
    }
  }

  return { applied, conflicts, errors };
}

/**
 * Stub: Upload a plan file for a project.
 * Full implementation pending migration to apply plan_uploads table changes.
 */
export async function uploadPlanFile(_input: {
  file: File;
  projectId: string;
}): Promise<{ success: boolean; data?: { id: string }; error?: string }> {
  return { success: false, error: "uploadPlanFile not yet implemented" };
}
