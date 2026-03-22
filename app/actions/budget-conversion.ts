"use server";

import { getUserContext } from "@/lib/auth-context";
import { revalidatePath } from "next/cache";

// ============================================
// BUDGET CONVERSION ACTIONS
// ============================================

/**
 * Convert approved estimate to project budget
 * P2.6: Estimate-to-Budget Conversion Backend (EST-P2-006)
 */
export async function convertToBudget(estimateId: string) {
  try {
    const context = await getUserContext();
    if ("error" in context) {
      return { success: false, error: context.error };
    }

    // Get estimate with line items
    const { data: estimate, error: estimateError } = await context.supabase
      .from("estimates")
      .select(
        `
        *,
        estimate_line_items (*)
      `,
      )
      .eq("id", estimateId)
      .eq("company_id", context.companyId)
      .single();

    if (estimateError || !estimate) {
      return { success: false, error: "Estimate not found" };
    }

    // Check if estimate is approved
    if (estimate.status !== "approved") {
      return {
        success: false,
        error: "Only approved estimates can be converted to budgets",
      };
    }

    // Calculate total from line items
    const lineItems = estimate.estimate_line_items as Array<{
      trade: string;
      category: string;
      description: string;
      quantity: number;
      unit: string;
      unit_cost: number;
    }>;

    const subtotal = lineItems.reduce(
      (sum, item) => sum + item.quantity * item.unit_cost,
      0,
    );

    // Calculate overhead and markup
    const overheadAmount = subtotal * (estimate.overhead_pct / 100);
    const markupAmount =
      (subtotal + overheadAmount) * (estimate.markup_pct / 100);
    const totalBeforeContingency = subtotal + overheadAmount + markupAmount;

    // Default contingency: 10% for all projects
    const contingencyPct = 10;
    const contingencyAmount = totalBeforeContingency * (contingencyPct / 100);
    const grandTotal = totalBeforeContingency + contingencyAmount;

    // Create budget in draft status
    const { data: budgetRaw, error: budgetError } = await context.supabase
      .from("budgets" as any)
      .insert({
        company_id: context.companyId,
        project_id: estimate.project_id,
        name: `Budget from ${estimate.name}`,
        total_amount: grandTotal,
        status: "draft",
        source_estimate_id: estimateId,
        created_by: context.userId,
      })
      .select()
      .single();

    if (budgetError) throw budgetError;
    const budget = budgetRaw as any;

    // Create budget categories from trades
    const tradeMap = new Map<
      string,
      {
        category: string;
        items: typeof lineItems;
        total: number;
      }
    >();

    for (const item of lineItems) {
      const trade = item.trade;
      if (!tradeMap.has(trade)) {
        tradeMap.set(trade, {
          category: trade,
          items: [],
          total: 0,
        });
      }

      const tradeData = tradeMap.get(trade)!;
      tradeData.items.push(item);
      tradeData.total += item.quantity * item.unit_cost;
    }

    // Create budget categories
    const budgetCategories = Array.from(tradeMap.entries()).map(
      ([trade, data]) => ({
        company_id: context.companyId,
        budget_id: budget.id,
        name: trade,
        allocated_amount: data.total,
        spent_amount: 0,
      }),
    );

    // Add contingency as a category
    budgetCategories.push({
      company_id: context.companyId,
      budget_id: budget.id,
      name: "Contingency",
      allocated_amount: contingencyAmount,
      spent_amount: 0,
    });

    const { error: categoriesError } = await context.supabase
      .from("budget_categories" as any)
      .insert(budgetCategories);

    if (categoriesError) throw categoriesError;

    revalidatePath(`/projects/${estimate.project_id}`);

    return { success: true, data: budget };
  } catch (error) {
    console.error("[convertToBudget] Error:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to convert estimate to budget",
    };
  }
}
