"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getUserContext } from "@/lib/auth-context";

// ============================================
// Validation Schemas
// ============================================

const createBudgetSchema = z.object({
  projectId: z.string().uuid("Invalid project ID"),
  name: z.string().min(1, "Budget name is required"),
  totalAmount: z.number().positive("Total amount must be positive"),
  categories: z
    .array(
      z.object({
        name: z.string().min(1, "Category name is required"),
        allocatedAmount: z
          .number()
          .min(0, "Allocated amount must be non-negative"),
      }),
    )
    .min(1, "At least one category is required"),
});

const updateBudgetCategorySchema = z.object({
  categoryId: z.string().uuid("Invalid category ID"),
  name: z.string().min(1).optional(),
  allocatedAmount: z.number().min(0).optional(),
});

const addBudgetCategorySchema = z.object({
  budgetId: z.string().uuid("Invalid budget ID"),
  name: z.string().min(1, "Category name is required"),
  allocatedAmount: z.number().min(0, "Allocated amount must be non-negative"),
});

// ============================================
// Budget CRUD
// ============================================

/**
 * Create a manual budget with categories
 * Only admin/PM roles should call this (role check enforced here)
 */
export async function createBudget(
  input: z.infer<typeof createBudgetSchema>,
): Promise<{ success: boolean; data?: { id: string }; error?: string }> {
  try {
    const userContext = await getUserContext();
    if ("error" in userContext) {
      return { success: false, error: "Unauthorized" };
    }

    const validated = createBudgetSchema.parse(input);

    // Insert budget
    const { data: budgetRaw, error: budgetError } = await userContext.supabase
      .from("budgets" as any)
      .insert({
        company_id: userContext.companyId,
        project_id: validated.projectId,
        name: validated.name,
        total_amount: validated.totalAmount,
        status: "draft",
        created_by: userContext.userId,
      })
      .select("id")
      .single();
    const budget = budgetRaw as any;

    if (budgetError) {
      console.error("[createBudget] Insert error:", budgetError);
      return { success: false, error: "Failed to create budget" };
    }

    // Insert categories
    const categoryRows = validated.categories.map((cat, idx) => ({
      company_id: userContext.companyId,
      budget_id: budget.id,
      name: cat.name,
      allocated_amount: cat.allocatedAmount,
      spent_amount: 0,
      sort_order: idx,
    }));

    const { error: categoriesError } = await userContext.supabase
      .from("budget_categories" as any)
      .insert(categoryRows);

    if (categoriesError) {
      console.error("[createBudget] Categories insert error:", categoriesError);
      return { success: false, error: "Failed to create budget categories" };
    }

    revalidatePath(`/app/projects/${validated.projectId}`);

    return { success: true, data: { id: budget.id } };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.issues[0].message };
    }
    console.error("[createBudget] Unexpected error:", error);
    return { success: false, error: "Failed to create budget" };
  }
}

/**
 * Get budget + categories for a project, with spent_amount aggregated from expenses
 */
export async function getBudgetByProject(projectId: string) {
  try {
    const userContext = await getUserContext();
    if ("error" in userContext) {
      return { success: false, error: "Unauthorized", data: null };
    }

    // Fetch most recent budget for the project
    const { data: budgetRaw, error: budgetError } = await userContext.supabase
      .from("budgets" as any)
      .select(
        `
        *,
        budget_categories (*)
      `,
      )
      .eq("project_id", projectId)
      .eq("company_id", userContext.companyId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    const budget = budgetRaw as any;

    if (budgetError) {
      console.error("[getBudgetByProject] Query error:", budgetError);
      return { success: false, error: "Failed to fetch budget", data: null };
    }

    if (!budget) {
      return { success: true, data: null };
    }

    // Fetch approved expenses for this project to aggregate by category name
    const { data: expenses } = await userContext.supabase
      .from("expenses")
      .select("category, amount, status")
      .eq("project_id", projectId)
      .eq("company_id", userContext.companyId)
      .in("status", ["approved", "paid"]);

    // Aggregate spent by category name (case-insensitive match)
    const spentByCategory: Record<string, number> = {};
    for (const expense of expenses || []) {
      const cat = (expense.category || "other").toLowerCase();
      spentByCategory[cat] =
        (spentByCategory[cat] || 0) + (expense.amount || 0);
    }

    // Annotate categories with live spent amounts
    const categories = (
      budget.budget_categories as Array<{
        id: string;
        name: string;
        allocated_amount: number;
        spent_amount: number;
        sort_order: number;
        created_at: string;
        updated_at: string;
      }>
    )
      .sort((a, b) => a.sort_order - b.sort_order)
      .map((cat) => ({
        ...cat,
        spent_amount:
          spentByCategory[cat.name.toLowerCase()] ?? cat.spent_amount,
      }));

    return {
      success: true,
      data: {
        ...budget,
        budget_categories: categories,
      },
    };
  } catch (error) {
    console.error("[getBudgetByProject] Unexpected error:", error);
    return { success: false, error: "Failed to fetch budget", data: null };
  }
}

/**
 * Lightweight budget summary for the BudgetSummaryCard and FinancialSummaryBar
 */
export async function getBudgetSummary(projectId: string): Promise<{
  success: boolean;
  data?: {
    totalBudget: number;
    totalSpent: number;
    subPayments: number;
    remaining: number;
    percentUsed: number;
    hasBudget: boolean;
  };
  error?: string;
}> {
  try {
    const userContext = await getUserContext();
    if ("error" in userContext) {
      return { success: false, error: "Unauthorized" };
    }

    // Run all three queries in parallel
    const [budgetResult, expensesResult, subPaymentsResult] = await Promise.all(
      [
        userContext.supabase
          .from("budgets" as any)
          .select("total_amount")
          .eq("project_id", projectId)
          .eq("company_id", userContext.companyId)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle(),

        userContext.supabase
          .from("expenses")
          .select("amount")
          .eq("project_id", projectId)
          .eq("company_id", userContext.companyId)
          .in("status", ["approved", "paid"]),

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
    const remaining = totalBudget - totalUsed;
    const percentUsed = totalBudget > 0 ? (totalUsed / totalBudget) * 100 : 0;

    return {
      success: true,
      data: {
        totalBudget,
        totalSpent,
        subPayments,
        remaining,
        percentUsed,
        hasBudget,
      },
    };
  } catch (error) {
    console.error("[getBudgetSummary] Unexpected error:", error);
    return { success: false, error: "Failed to fetch budget summary" };
  }
}

/**
 * Update a budget category's name or allocated amount
 */
export async function updateBudgetCategory(
  input: z.infer<typeof updateBudgetCategorySchema>,
): Promise<{ success: boolean; error?: string }> {
  try {
    const userContext = await getUserContext();
    if ("error" in userContext) {
      return { success: false, error: "Unauthorized" };
    }

    const validated = updateBudgetCategorySchema.parse(input);

    const updates: Record<string, unknown> = {};
    if (validated.name !== undefined) updates.name = validated.name;
    if (validated.allocatedAmount !== undefined)
      updates.allocated_amount = validated.allocatedAmount;

    if (Object.keys(updates).length === 0) {
      return { success: true };
    }

    // Fetch category to find project for revalidation
    const { data: category } = await userContext.supabase
      .from("budget_categories" as any)
      .select("budget_id, budgets!inner(project_id, company_id)")
      .eq("id", validated.categoryId)
      .single();

    if (!category) {
      return { success: false, error: "Category not found" };
    }

    const { error } = await userContext.supabase
      .from("budget_categories" as any)
      .update(updates)
      .eq("id", validated.categoryId);

    if (error) {
      console.error("[updateBudgetCategory] Update error:", error);
      return { success: false, error: "Failed to update category" };
    }

    const budget = (category as any).budgets as {
      project_id: string;
      company_id: string;
    };
    revalidatePath(`/app/projects/${budget.project_id}`);

    return { success: true };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.issues[0].message };
    }
    console.error("[updateBudgetCategory] Unexpected error:", error);
    return { success: false, error: "Failed to update category" };
  }
}

/**
 * Add a new category to an existing budget
 */
export async function addBudgetCategory(
  input: z.infer<typeof addBudgetCategorySchema>,
): Promise<{ success: boolean; data?: { id: string }; error?: string }> {
  try {
    const userContext = await getUserContext();
    if ("error" in userContext) {
      return { success: false, error: "Unauthorized" };
    }

    const validated = addBudgetCategorySchema.parse(input);

    // Verify budget belongs to user's company and get project_id
    const { data: budget, error: budgetError } = await userContext.supabase
      .from("budgets" as any)
      .select("id, project_id, company_id")
      .eq("id", validated.budgetId)
      .eq("company_id", userContext.companyId)
      .single();

    if (budgetError || !budget) {
      return { success: false, error: "Budget not found" };
    }

    // Get current max sort_order
    const { data: existing } = await userContext.supabase
      .from("budget_categories" as any)
      .select("sort_order")
      .eq("budget_id", validated.budgetId)
      .order("sort_order", { ascending: false })
      .limit(1)
      .maybeSingle();

    const nextSortOrder = ((existing as any)?.sort_order ?? -1) + 1;

    const { data: newCategory, error } = await userContext.supabase
      .from("budget_categories" as any)
      .insert({
        company_id: userContext.companyId,
        budget_id: validated.budgetId,
        name: validated.name,
        allocated_amount: validated.allocatedAmount,
        spent_amount: 0,
        sort_order: nextSortOrder,
      })
      .select("id")
      .single();

    if (error) {
      console.error("[addBudgetCategory] Insert error:", error);
      return { success: false, error: "Failed to add category" };
    }

    revalidatePath(`/app/projects/${(budget as any).project_id}`);

    return { success: true, data: { id: (newCategory as any).id } };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.issues[0].message };
    }
    console.error("[addBudgetCategory] Unexpected error:", error);
    return { success: false, error: "Failed to add category" };
  }
}

/**
 * Delete a budget category
 */
export async function deleteBudgetCategory(
  categoryId: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    const userContext = await getUserContext();
    if ("error" in userContext) {
      return { success: false, error: "Unauthorized" };
    }

    // Fetch category to get project_id for revalidation
    const { data: category } = await userContext.supabase
      .from("budget_categories" as any)
      .select("budget_id, budgets!inner(project_id, company_id)")
      .eq("id", categoryId)
      .single();

    if (!category) {
      return { success: false, error: "Category not found" };
    }

    const budget = (category as any).budgets as {
      project_id: string;
      company_id: string;
    };

    // Verify company ownership
    if (budget.company_id !== userContext.companyId) {
      return { success: false, error: "Unauthorized" };
    }

    const { error } = await userContext.supabase
      .from("budget_categories" as any)
      .delete()
      .eq("id", categoryId);

    if (error) {
      console.error("[deleteBudgetCategory] Delete error:", error);
      return { success: false, error: "Failed to delete category" };
    }

    revalidatePath(`/app/projects/${budget.project_id}`);

    return { success: true };
  } catch (error) {
    console.error("[deleteBudgetCategory] Unexpected error:", error);
    return { success: false, error: "Failed to delete category" };
  }
}
