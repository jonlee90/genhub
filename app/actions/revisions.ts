"use server";

import { getUserContext } from "@/lib/auth-context";
import { z } from "zod";
import { revalidatePath } from "next/cache";

// ============================================
// VALIDATION SCHEMAS
// ============================================

const CreateRevisionSchema = z.object({
  estimateId: z.string().uuid(),
  newPlanUploadId: z.string().uuid(),
  notes: z.string().optional(),
});

const ApplyRevisionChangeSchema = z.object({
  revisionId: z.string().uuid(),
  changeId: z.string(),
  action: z.enum(["accept", "reject"]),
});

const BulkApplyRevisionChangesSchema = z.object({
  revisionId: z.string().uuid(),
  changeIds: z.array(z.string()),
  action: z.enum(["accept", "reject"]),
});

// ============================================
// TYPES
// ============================================

type ChangeType = "added" | "removed" | "modified";

interface DiffChange {
  id: string;
  type: ChangeType;
  item: {
    trade: string;
    description: string;
    quantity: number;
    unit: string;
    unitCost?: number;
  };
  oldQuantity?: number;
  newQuantity?: number;
  costDelta: number;
}

// ============================================
// REVISION ACTIONS
// ============================================

/**
 * Create new revision linked to previous estimate
 * P2.4: Revision Comparison Backend (EST-P2-004)
 */
export async function createRevision(
  input: z.infer<typeof CreateRevisionSchema>,
) {
  try {
    const context = await getUserContext();
    if ("error" in context) {
      return { success: false, error: context.error };
    }

    const validated = CreateRevisionSchema.parse(input);

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

    // Get old and new takeoff items
    const [oldItemsResult, newItemsResult] = await Promise.all([
      context.supabase
        .from("takeoff_items")
        .select("*")
        .eq("estimate_id", validated.estimateId),
      context.supabase
        .from("takeoff_items")
        .select("*")
        .eq("plan_upload_id", validated.newPlanUploadId),
    ]);

    const oldItems = oldItemsResult.data || [];
    const newItems = newItemsResult.data || [];

    // Compute diff
    const diffResults = computeDiff(oldItems as any, newItems as any);

    // Create revision record
    const { data: revision, error: revisionError } = await context.supabase
      .from("estimate_revisions" as any)
      .insert({
        company_id: context.companyId,
        estimate_id: validated.estimateId,
        previous_estimate_id: validated.estimateId,
        new_plan_upload_id: validated.newPlanUploadId,
        notes: validated.notes,
        diff_results: diffResults,
        changes_applied: [],
        created_by: context.userId,
      })
      .select()
      .single();

    if (revisionError) throw revisionError;

    revalidatePath(`/projects/${estimate.project_id}`);

    return { success: true, data: revision };
  } catch (error) {
    console.error("[createRevision] Error:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to create revision",
    };
  }
}

/**
 * Get diff between estimate versions
 * P2.4: Revision Comparison Backend (EST-P2-004)
 */
export async function getRevisionDiff(revisionId: string) {
  try {
    const context = await getUserContext();
    if ("error" in context) {
      return { success: false, error: context.error };
    }

    const { data, error } = await context.supabase
      .from("estimate_revisions" as any)
      .select("*")
      .eq("id", revisionId)
      .eq("company_id", context.companyId)
      .single();

    if (error || !data) {
      return { success: false, error: "Revision not found" };
    }

    return { success: true, data };
  } catch (error) {
    console.error("[getRevisionDiff] Error:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to fetch revision diff",
    };
  }
}

/**
 * Accept/reject individual change
 * P2.4: Revision Comparison Backend (EST-P2-004)
 */
export async function applyRevisionChange(
  input: z.infer<typeof ApplyRevisionChangeSchema>,
) {
  try {
    const context = await getUserContext();
    if ("error" in context) {
      return { success: false, error: context.error };
    }

    const validated = ApplyRevisionChangeSchema.parse(input);

    // Get revision
    const { data: revision, error: revisionError } = await context.supabase
      .from("estimate_revisions" as any)
      .select("*, estimates!inner(project_id)")
      .eq("id", validated.revisionId)
      .eq("company_id", context.companyId)
      .single();

    if (revisionError || !revision) {
      return { success: false, error: "Revision not found" };
    }

    // Update changes_applied array
    const revisionAny = revision as any;
    const changesApplied = (revisionAny.changes_applied as string[]) || [];
    const newChangesApplied =
      validated.action === "accept"
        ? [...changesApplied, validated.changeId]
        : changesApplied.filter((id) => id !== validated.changeId);

    const { error: updateError } = await context.supabase
      .from("estimate_revisions" as any)
      .update({ changes_applied: newChangesApplied })
      .eq("id", validated.revisionId);

    if (updateError) throw updateError;

    const projectId = (revisionAny.estimates as { project_id: string })
      .project_id;
    revalidatePath(`/projects/${projectId}`);

    return { success: true };
  } catch (error) {
    console.error("[applyRevisionChange] Error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to apply change",
    };
  }
}

/**
 * Bulk accept/reject changes
 * P2.4: Revision Comparison Backend (EST-P2-004)
 */
export async function bulkApplyRevisionChanges(
  input: z.infer<typeof BulkApplyRevisionChangesSchema>,
) {
  try {
    const context = await getUserContext();
    if ("error" in context) {
      return { success: false, error: context.error };
    }

    const validated = BulkApplyRevisionChangesSchema.parse(input);

    // Get revision
    const { data: revision, error: revisionError } = await context.supabase
      .from("estimate_revisions" as any)
      .select("*, estimates!inner(project_id)")
      .eq("id", validated.revisionId)
      .eq("company_id", context.companyId)
      .single();

    if (revisionError || !revision) {
      return { success: false, error: "Revision not found" };
    }
    const revisionAny2 = revision as any;

    // Update changes_applied array
    const changesApplied = (revisionAny2.changes_applied as string[]) || [];
    const newChangesApplied =
      validated.action === "accept"
        ? [...new Set([...changesApplied, ...validated.changeIds])]
        : changesApplied.filter((id) => !validated.changeIds.includes(id));

    const { error: updateError } = await context.supabase
      .from("estimate_revisions" as any)
      .update({ changes_applied: newChangesApplied })
      .eq("id", validated.revisionId);

    if (updateError) throw updateError;

    const projectId = (revisionAny2.estimates as { project_id: string })
      .project_id;
    revalidatePath(`/projects/${projectId}`);

    return {
      success: true,
      data: { appliedCount: validated.changeIds.length },
    };
  } catch (error) {
    console.error("[bulkApplyRevisionChanges] Error:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to bulk apply changes",
    };
  }
}

// ============================================
// HELPER FUNCTIONS
// ============================================

function computeDiff(
  oldItems: Array<{
    trade: string;
    description: string;
    quantity: number;
    unit: string;
  }>,
  newItems: Array<{
    trade: string;
    description: string;
    quantity: number;
    unit: string;
  }>,
): {
  changes: DiffChange[];
  summary: {
    added: number;
    removed: number;
    modified: number;
    totalCostDelta: number;
  };
} {
  const changes: DiffChange[] = [];

  // Create lookup maps for matching
  const oldItemsMap = new Map(
    oldItems.map((item) => [`${item.trade}|${item.description}`, item]),
  );
  const newItemsMap = new Map(
    newItems.map((item) => [`${item.trade}|${item.description}`, item]),
  );

  // Find added items
  for (const [key, newItem] of newItemsMap) {
    if (!oldItemsMap.has(key)) {
      changes.push({
        id: `added-${changes.length}`,
        type: "added",
        item: {
          trade: newItem.trade,
          description: newItem.description,
          quantity: newItem.quantity,
          unit: newItem.unit,
        },
        costDelta: 0,
      });
    }
  }

  // Find removed and modified items
  for (const [key, oldItem] of oldItemsMap) {
    const newItem = newItemsMap.get(key);

    if (!newItem) {
      changes.push({
        id: `removed-${changes.length}`,
        type: "removed",
        item: {
          trade: oldItem.trade,
          description: oldItem.description,
          quantity: oldItem.quantity,
          unit: oldItem.unit,
        },
        costDelta: 0,
      });
    } else if (newItem.quantity !== oldItem.quantity) {
      changes.push({
        id: `modified-${changes.length}`,
        type: "modified",
        item: {
          trade: oldItem.trade,
          description: oldItem.description,
          quantity: newItem.quantity,
          unit: oldItem.unit,
        },
        oldQuantity: oldItem.quantity,
        newQuantity: newItem.quantity,
        costDelta: 0,
      });
    }
  }

  const summary = {
    added: changes.filter((c) => c.type === "added").length,
    removed: changes.filter((c) => c.type === "removed").length,
    modified: changes.filter((c) => c.type === "modified").length,
    totalCostDelta: 0,
  };

  return { changes, summary };
}
