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
 * Aggregate financial summary for a project.
 * Expenses are the single source of truth — subcontractor payments
 * are auto-created as expenses and counted here.
 */
export async function getProjectFinancialSummary(
  projectId: string,
): Promise<{ success: boolean; data?: FinancialSummary; error?: string }> {
  try {
    const userContext = await getUserContext();
    if ("error" in userContext) {
      return { success: false, error: "Unauthorized" };
    }

    const [budgetResult, projectResult, expensesResult, contractsResult] =
      await Promise.all([
        // Most recent budget record for the project
        userContext.supabase
          .from("budgets" as any)
          .select("total_amount")
          .eq("project_id", projectId)
          .eq("company_id", userContext.companyId)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle(),

        // Project's own budget field as fallback
        userContext.supabase
          .from("projects")
          .select("budget")
          .eq("id", projectId)
          .eq("company_id", userContext.companyId)
          .single(),

        // Approved/paid expenses for the project
        userContext.supabase
          .from("expenses")
          .select("amount")
          .eq("project_id", projectId)
          .eq("company_id", userContext.companyId)
          .in("status", ["approved", "paid"]),

        // Contract IDs for this project, then sum their payments below
        userContext.supabase
          .from("subcontractor_contracts" as any)
          .select("id")
          .eq("project_id", projectId)
          .eq("company_id", userContext.companyId),
      ]);

    const budgetRecordAmount = (budgetResult.data as any)?.total_amount ?? null;
    const projectBudget = (projectResult.data as any)?.budget ?? null;
    // Prefer explicit budget record; fall back to project.budget
    const totalBudget = budgetRecordAmount ?? projectBudget ?? 0;
    const hasBudget = budgetRecordAmount !== null || projectBudget !== null;

    const totalSpent = (expensesResult.data || []).reduce(
      (sum, e) => sum + (e.amount || 0),
      0,
    );

    const contractIds = ((contractsResult.data as any[]) || []).map(
      (c: any) => c.id,
    );

    let subPayments = 0;
    if (contractIds.length > 0) {
      const { data: paymentsData } = await userContext.supabase
        .from("subcontractor_payments" as any)
        .select("amount")
        .in("contract_id", contractIds);
      subPayments = ((paymentsData as any[]) || []).reduce(
        (sum: number, p: any) => sum + (p.amount || 0),
        0,
      );
    }

    const netRemaining = hasBudget ? totalBudget - totalSpent : 0;
    const percentUsed = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;

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
