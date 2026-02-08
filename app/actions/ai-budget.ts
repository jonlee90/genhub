"use server";

import { getUserContext } from "@/lib/auth-context";
import { z } from "zod";

const UpdateAiBudgetSchema = z.object({
  monthlyBudget: z.number().min(0),
});

export async function getAiUsage() {
  try {
    const context = await getUserContext();
    if ("error" in context) {
      return { success: false, error: context.error };
    }

    const startOfMonth = new Date(
      new Date().getFullYear(),
      new Date().getMonth(),
      1,
    ).toISOString();

    const { data: usageData, error } = await context.supabase
      .from("ai_usage_log")
      .select("cost, page_id")
      .eq("company_id", context.companyId)
      .gte("created_at", startOfMonth);

    if (error) throw error;

    const totalSpend = usageData.reduce(
      (sum, log) => sum + Number(log.cost),
      0,
    );
    const pagesParsed = new Set(
      usageData.filter((log) => log.page_id).map((log) => log.page_id),
    ).size;
    const avgCostPerPage = pagesParsed > 0 ? totalSpend / pagesParsed : 0;

    return {
      success: true,
      data: {
        totalSpend: Number(totalSpend.toFixed(4)),
        pagesParsed,
        avgCostPerPage: Number(avgCostPerPage.toFixed(4)),
      },
    };
  } catch (error) {
    console.error("[getAiUsage] Error:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to fetch AI usage",
    };
  }
}

export async function getAiBudget() {
  try {
    const context = await getUserContext();
    if ("error" in context) {
      return { success: false, error: context.error };
    }

    const { data: company, error: companyError } = await context.supabase
      .from("companies")
      .select("ai_monthly_budget")
      .eq("id", context.companyId)
      .single();

    if (companyError) throw companyError;

    // Get current spend
    const startOfMonth = new Date(
      new Date().getFullYear(),
      new Date().getMonth(),
      1,
    ).toISOString();

    const { data: usageData, error: usageError } = await context.supabase
      .from("ai_usage_log")
      .select("cost")
      .eq("company_id", context.companyId)
      .gte("created_at", startOfMonth);

    if (usageError) throw usageError;

    const currentSpend = usageData.reduce(
      (sum, log) => sum + Number(log.cost),
      0,
    );
    const percentUsed = (currentSpend / company.ai_monthly_budget) * 100;

    return {
      success: true,
      data: {
        monthlyBudget: Number(company.ai_monthly_budget),
        currentSpend: Number(currentSpend.toFixed(4)),
        percentUsed: Number(percentUsed.toFixed(2)),
      },
    };
  } catch (error) {
    console.error("[getAiBudget] Error:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to fetch AI budget",
    };
  }
}

export async function updateAiBudget(
  input: z.infer<typeof UpdateAiBudgetSchema>,
) {
  try {
    const context = await getUserContext();
    if ("error" in context) {
      return { success: false, error: context.error };
    }

    // Role check (admin only)
    if (context.role !== "admin") {
      return {
        success: false,
        error: "Insufficient permissions to update AI budget",
      };
    }

    const validated = UpdateAiBudgetSchema.parse(input);

    const { data, error } = await context.supabase
      .from("companies")
      .update({ ai_monthly_budget: validated.monthlyBudget })
      .eq("id", context.companyId)
      .select()
      .single();

    if (error) throw error;

    return { success: true, data };
  } catch (error) {
    console.error("[updateAiBudget] Error:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to update AI budget",
    };
  }
}
