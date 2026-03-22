"use server";

import { getUserContext } from "@/lib/auth-context";

// ============================================
// Types
// ============================================

export interface FinancialSummary {
  totalBudget: number;
  totalSpent: number;
  subPayments: number;
  netRemaining: number;
  hasBudget: boolean;
  percentUsed: number;
}

// ============================================
// Project Financial Summary
// ============================================

/**
 * Aggregate financial summary for a project
 * Runs three queries in parallel: budget total, approved expenses, sub payments
 */
export async function getProjectFinancialSummary(
  projectId: string,
): Promise<{ success: boolean; data?: FinancialSummary; error?: string }> {
  try {
    const userContext = await getUserContext();
    if ("error" in userContext) {
      return { success: false, error: "Unauthorized" };
    }

    const [budgetResult, expensesResult, subPaymentsResult] = await Promise.all(
      [
        // Most recent budget for the project
        userContext.supabase
          .from("budgets" as any)
          .select("total_amount")
          .eq("project_id", projectId)
          .eq("company_id", userContext.companyId)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle(),

        // Approved/paid expenses for the project
        userContext.supabase
          .from("expenses")
          .select("amount")
          .eq("project_id", projectId)
          .eq("company_id", userContext.companyId)
          .in("status", ["approved", "paid"]),

        // Sub payments for all contracts on this project
        userContext.supabase
          .from("subcontractor_payments" as any)
          .select("amount, subcontractor_contracts!inner(project_id)")
          .eq("company_id", userContext.companyId)
          .eq("subcontractor_contracts.project_id", projectId),
      ],
    );

    const totalBudget = (budgetResult.data as any)?.total_amount ?? 0;
    const hasBudget = !!budgetResult.data;

    const totalSpent = (expensesResult.data || []).reduce(
      (sum, e) => sum + (e.amount || 0),
      0,
    );

    const subPayments = ((subPaymentsResult.data as any[]) || []).reduce(
      (sum: number, p: any) => sum + (p.amount || 0),
      0,
    );

    const totalUsed = totalSpent + subPayments;
    const netRemaining = totalBudget - totalUsed;
    const percentUsed = totalBudget > 0 ? (totalUsed / totalBudget) * 100 : 0;

    return {
      success: true,
      data: {
        totalBudget,
        totalSpent,
        subPayments,
        netRemaining,
        hasBudget,
        percentUsed,
      },
    };
  } catch (error) {
    console.error("[getProjectFinancialSummary] Unexpected error:", error);
    return { success: false, error: "Failed to fetch financial summary" };
  }
}
