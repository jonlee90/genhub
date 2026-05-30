"use server";

import { cache } from "react";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getUserContext } from "@/lib/auth-context";
import { invalidateDashboardCache } from "@/app/actions/dashboard";
import { ensureSubcontractorOnProject } from "@/app/actions/projects";
import { createClient } from "@/utils/supabase/server";
import type { ExpensesRow, ExpensesInsert } from "@/types/db/tables/expenses";
import type { ExpenseCategory } from "@/types/db/enums";
import type { ExpenseWithRelations } from "@/types/db/expense";
import type { Database } from "@/types/db/helpers";

type Expense = ExpensesRow;
type ExpenseInsert = ExpensesInsert;

// ============================================
// HIGH-2 FIX: Using shared cached getUserContext from @/lib/auth-context
// ============================================
// Validation Schemas
// ============================================

const createExpenseSchema = z.object({
  description: z.string().min(1, "Description is required"),
  amount: z
    .number()
    .refine((n) => n !== 0, { message: "Amount cannot be zero" }),
  category: z.enum([
    "materials",
    "labor",
    "subcontractor",
    "equipment",
    "permits",
    "transportation",
    "meals",
    "lodging",
    "other",
  ]),
  expense_date: z.string(),
  project_id: z.string().uuid().optional().nullable(),
  task_id: z.string().uuid().optional().nullable(),
  vendor_name: z.string().optional().nullable(),
  vendor_address: z.string().optional().nullable(),
  receipt_url: z.string().url().optional().nullable(),
  payment_method: z.string().optional().nullable(),
  store_account: z.string().optional().nullable(),
  subcontractor_id: z.string().uuid().optional().nullable(),
});

const updateExpenseSchema = z.object({
  id: z.string().uuid("Invalid expense ID"),
  description: z.string().min(1).optional(),
  amount: z
    .number()
    .refine((n) => n !== 0, { message: "Amount cannot be zero" })
    .optional(),
  category: z
    .enum([
      "materials",
      "labor",
      "subcontractor",
      "equipment",
      "permits",
      "transportation",
      "meals",
      "lodging",
      "other",
    ])
    .optional(),
  expense_date: z.string().optional(),
  vendor_name: z.string().optional().nullable(),
  vendor_address: z.string().optional().nullable(),
  payment_method: z.string().optional().nullable(),
  store_account: z.string().optional().nullable(),
  subcontractor_id: z.string().uuid().optional().nullable(),
});

const addLineItemSchema = z.object({
  expense_id: z.string().uuid("Invalid expense ID"),
  description: z.string().min(1, "Description is required"),
  quantity: z.number().min(0.01).optional(),
  unit_price: z.number().min(0, "Unit price must be positive"),
  material_id: z.string().uuid().optional().nullable(),
  material_assignment_id: z.string().uuid().optional().nullable(),
  matched_by_ai: z.boolean().optional(),
  match_confidence_score: z.number().min(0).max(1).optional().nullable(),
  manually_matched: z.boolean().optional(),
});

// ============================================
// Expense CRUD Operations
// ============================================

export async function createExpense(data: z.infer<typeof createExpenseSchema>) {
  try {
    const userContext = await getUserContext();
    if ("error" in userContext) {
      return { success: false, error: "Unauthorized" };
    }

    const validated = createExpenseSchema.parse(data);

    // Create expense
    const { data: expense, error } = await userContext.supabase
      .from("expenses")
      .insert({
        ...validated,
        company_id: userContext.companyId,
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating expense:", error);
      return { success: false, error: "Failed to create expense" };
    }

    // Auto-assign subcontractor to project team when expense links them
    if (validated.subcontractor_id && validated.project_id) {
      await ensureSubcontractorOnProject(
        userContext.supabase,
        userContext.companyId,
        userContext.userId,
        validated.project_id,
        validated.subcontractor_id,
      );
    }

    // Flow B: if subcontractor_id provided, find/create contract and add payment
    if (validated.subcontractor_id && validated.project_id) {
      try {
        // Look up existing active contract for this subcontractor + project
        const { data: existingContract } = await userContext.supabase
          .from("subcontractor_contracts" as any)
          .select("id")
          .eq("subcontractor_id", validated.subcontractor_id)
          .eq("project_id", validated.project_id)
          .eq("company_id", userContext.companyId)
          .eq("status", "active")
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        let contractId: string;

        if (existingContract) {
          contractId = (existingContract as any).id;
        } else {
          // Create a new contract with contract_amount = expense amount
          const { data: newContract, error: contractError } =
            await userContext.supabase
              .from("subcontractor_contracts" as any)
              .insert({
                company_id: userContext.companyId,
                project_id: validated.project_id,
                subcontractor_id: validated.subcontractor_id,
                contract_amount: Math.abs(validated.amount),
                status: "active",
                phase: null,
                notes: null,
                created_by: userContext.userId,
              })
              .select("id")
              .single();

          if (contractError || !newContract) {
            console.error(
              "[createExpense] Failed to create contract for Flow B:",
              contractError,
            );
            // Best-effort — expense already saved
            return { success: true, data: expense };
          }

          contractId = (newContract as any).id;
        }

        // Insert payment with skipExpenseSync: true to prevent loop
        const { createPayment } =
          await import("@/app/actions/subcontractor-payments");
        const paymentResult = await createPayment({
          contractId,
          amount: Math.abs(validated.amount),
          paymentDate: validated.expense_date,
          paymentMethod: "expense",
          notes: validated.description,
          skipExpenseSync: true,
        });

        if (paymentResult.success && paymentResult.data) {
          // Link the expense back to the payment we just created
          await userContext.supabase
            .from("expenses")
            .update({ subcontractor_payment_id: paymentResult.data.id })
            .eq("id", expense.id);
        } else {
          console.error(
            "[createExpense] Failed to create payment for Flow B:",
            paymentResult.error,
          );
          // Best-effort — expense already saved
        }
      } catch (syncError) {
        console.error("[createExpense] Flow B sync error:", syncError);
        // Best-effort — expense already saved
      }
    }

    revalidatePath("/app/expenses");
    if (validated.project_id) {
      revalidatePath(`/app/projects/${validated.project_id}`);
    }
    await invalidateDashboardCache({ companyId: userContext.companyId });

    return { success: true, data: expense };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.issues[0].message };
    }
    console.error("Error creating expense:", error);
    return { success: false, error: "Failed to create expense" };
  }
}

export async function updateExpense(data: z.infer<typeof updateExpenseSchema>) {
  try {
    const userContext = await getUserContext();
    if ("error" in userContext) {
      return { success: false, error: "Unauthorized" };
    }

    const validated = updateExpenseSchema.parse(data);

    const { data: expense, error } = await userContext.supabase
      .from("expenses")
      .update(validated)
      .eq("id", validated.id)
      .select()
      .single();

    if (error) {
      console.error("Error updating expense:", error);
      return { success: false, error: "Failed to update expense" };
    }

    revalidatePath("/app/expenses");
    revalidatePath(`/app/expenses/${validated.id}`);
    if (expense.project_id) {
      revalidatePath(`/app/projects/${expense.project_id}`);
    }
    await invalidateDashboardCache({ companyId: userContext.companyId });

    return { success: true, data: expense };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.issues[0].message };
    }
    console.error("Error updating expense:", error);
    return { success: false, error: "Failed to update expense" };
  }
}

export async function deleteExpense(expenseId: string) {
  try {
    const userContext = await getUserContext();
    if ("error" in userContext) {
      return { success: false, error: "Unauthorized" };
    }

    // Get expense details before deleting (including linked payment)
    const { data: expense } = await userContext.supabase
      .from("expenses")
      .select("project_id, subcontractor_payment_id")
      .eq("id", expenseId)
      .single();

    const { error } = await userContext.supabase
      .from("expenses")
      .delete()
      .eq("id", expenseId);

    if (error) {
      console.error("Error deleting expense:", error);
      return { success: false, error: "Failed to delete expense" };
    }

    // If expense was linked to a payment, delete the payment (which also cleans up the contract if empty)
    if ((expense as any)?.subcontractor_payment_id) {
      const { deletePayment } =
        await import("@/app/actions/subcontractor-payments");
      await deletePayment((expense as any).subcontractor_payment_id);
    }

    revalidatePath("/app/expenses");
    if (expense?.project_id) {
      revalidatePath(`/app/projects/${expense.project_id}`);
    }
    await invalidateDashboardCache({ companyId: userContext.companyId });

    return { success: true };
  } catch (error) {
    console.error("Error deleting expense:", error);
    return { success: false, error: "Failed to delete expense" };
  }
}

export async function getExpensesByProject(projectId: string) {
  try {
    const userContext = await getUserContext();
    if ("error" in userContext) {
      return { success: false, error: "Unauthorized" };
    }

    const { data: expenses, error } = await userContext.supabase
      .from("expenses")
      .select(
        `
        *,
        project:projects(id, name),
        task:tasks(id, title),
        subcontractor:subcontractors(id, company_name),
        line_items:expense_line_items(*)
      `,
      )
      .eq("project_id", projectId)
      .order("expense_date", { ascending: false });

    if (error) {
      console.error("Error fetching expenses:", error);
      return { success: false, error: "Failed to fetch expenses" };
    }

    return { success: true, data: expenses };
  } catch (error) {
    console.error("Error fetching expenses:", error);
    return { success: false, error: "Failed to fetch expenses" };
  }
}

export async function getExpensesByCompany() {
  try {
    const userContext = await getUserContext();
    if ("error" in userContext) {
      return { success: false, error: "Unauthorized" };
    }

    const { data: expenses, error } = await userContext.supabase
      .from("expenses")
      .select(
        `
        *,
        project:projects(id, name),
        task:tasks(id, title),
        subcontractor:subcontractors(id, company_name)
      `,
      )
      .eq("company_id", userContext.companyId)
      .order("expense_date", { ascending: false });

    if (error) {
      console.error("Error fetching expenses:", error);
      return { success: false, error: "Failed to fetch expenses" };
    }

    return { success: true, data: expenses };
  } catch (error) {
    console.error("Error fetching expenses:", error);
    return { success: false, error: "Failed to fetch expenses" };
  }
}

export async function getExpenseById(expenseId: string) {
  try {
    const userContext = await getUserContext();
    if ("error" in userContext) {
      return { success: false, error: "Unauthorized" };
    }

    const { data: expense, error } = await userContext.supabase
      .from("expenses")
      .select(
        `
        *,
        project:projects(id, name),
        task:tasks(id, title),
        line_items:expense_line_items(
          *,
          material:materials(*),
          material_assignment:material_assignments(*)
        )
      `,
      )
      .eq("id", expenseId)
      .single();

    if (error) {
      console.error("Error fetching expense:", error);
      return { success: false, error: "Failed to fetch expense" };
    }

    return { success: true, data: expense };
  } catch (error) {
    console.error("Error fetching expense:", error);
    return { success: false, error: "Failed to fetch expense" };
  }
}

// ============================================
// Expense Line Items
// ============================================

export async function addExpenseLineItem(
  data: z.infer<typeof addLineItemSchema>,
) {
  try {
    const userContext = await getUserContext();
    if ("error" in userContext) {
      return { success: false, error: "Unauthorized" };
    }

    const validated = addLineItemSchema.parse(data);

    const { data: lineItem, error } = await userContext.supabase
      .from("expense_line_items")
      .insert(validated)
      .select(
        `
        *,
        material:materials(*),
        material_assignment:material_assignments(*)
      `,
      )
      .single();

    if (error) {
      console.error("Error adding line item:", error);
      return { success: false, error: "Failed to add line item" };
    }

    revalidatePath(`/app/expenses/${validated.expense_id}`);
    return { success: true, data: lineItem };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.issues[0].message };
    }
    console.error("Error adding line item:", error);
    return { success: false, error: "Failed to add line item" };
  }
}

export async function deleteExpenseLineItem(lineItemId: string) {
  try {
    const userContext = await getUserContext();
    if ("error" in userContext) {
      return { success: false, error: "Unauthorized" };
    }

    // Get expense_id before deleting
    const { data: lineItem } = await userContext.supabase
      .from("expense_line_items")
      .select("expense_id")
      .eq("id", lineItemId)
      .single();

    const { error } = await userContext.supabase
      .from("expense_line_items")
      .delete()
      .eq("id", lineItemId);

    if (error) {
      console.error("Error deleting line item:", error);
      return { success: false, error: "Failed to delete line item" };
    }

    if (lineItem) {
      revalidatePath(`/app/expenses/${lineItem.expense_id}`);
    }

    return { success: true };
  } catch (error) {
    console.error("Error deleting line item:", error);
    return { success: false, error: "Failed to delete line item" };
  }
}

// ============================================
// AI OCR Processing
// ============================================

export interface OCRResult {
  vendor_name?: string;
  vendor_address?: string;
  expense_date?: string;
  total_amount?: number;
  line_items: Array<{
    description: string;
    quantity?: number;
    unit_price: number;
    confidence_score?: number;
  }>;
  raw_text?: string;
  confidence_score?: number;
}

export async function processReceiptOCR(
  expenseId: string,
  _receiptImageUrl: string,
) {
  try {
    const userContext = await getUserContext();
    if ("error" in userContext) {
      return { success: false, error: "Unauthorized" };
    }

    // NOTE: This is a placeholder for the actual OCR implementation
    // In a real implementation, you would:
    // 1. Use Vercel AI SDK with vision model (gpt-4-vision, claude-3-opus, etc.)
    // 2. Send the receipt image to the AI model
    // 3. Extract vendor name, line items, totals, etc.
    // 4. Match line items to existing materials in the catalog
    // 5. Return structured data

    // For now, return a mock result
    const ocrResult: OCRResult = {
      vendor_name: "Home Depot",
      vendor_address: "123 Main St, Anytown, USA",
      expense_date: new Date().toISOString().split("T")[0],
      total_amount: 0,
      line_items: [],
      confidence_score: 0.85,
    };

    // Update expense with OCR data
    const { error: updateError } = await userContext.supabase
      .from("expenses")
      .update({
        receipt_ocr_data:
          ocrResult as unknown as Database["public"]["Tables"]["expenses"]["Update"]["receipt_ocr_data"],
        ocr_confidence_score: ocrResult.confidence_score,
        ocr_processed: true,
        vendor_name: ocrResult.vendor_name,
        vendor_address: ocrResult.vendor_address,
      })
      .eq("id", expenseId);

    if (updateError) {
      console.error("Error updating expense with OCR data:", updateError);
      return {
        success: false,
        error: "Failed to update expense with OCR data",
      };
    }

    // Create line items from OCR result
    if (ocrResult.line_items.length > 0) {
      const lineItemsToInsert = ocrResult.line_items.map((item) => ({
        expense_id: expenseId,
        description: item.description,
        quantity: item.quantity || 1,
        unit_price: item.unit_price,
        matched_by_ai: false,
        match_confidence_score: item.confidence_score,
      }));

      await userContext.supabase
        .from("expense_line_items")
        .insert(lineItemsToInsert);
    }

    revalidatePath(`/app/expenses/${expenseId}`);

    return { success: true, data: ocrResult };
  } catch (error) {
    console.error("Error processing receipt OCR:", error);
    return { success: false, error: "Failed to process receipt OCR" };
  }
}

/**
 * Match expense line items to materials using AI
 * This would use AI to find the best matching material from the catalog
 */
export async function matchLineItemToMaterial(
  lineItemId: string,
  materialId: string,
  materialAssignmentId?: string,
) {
  try {
    const userContext = await getUserContext();
    if ("error" in userContext) {
      return { success: false, error: "Unauthorized" };
    }

    const { data: lineItem, error } = await userContext.supabase
      .from("expense_line_items")
      .update({
        material_id: materialId,
        material_assignment_id: materialAssignmentId || null,
        manually_matched: true,
      })
      .eq("id", lineItemId)
      .select("*")
      .single();

    if (error) {
      console.error("Error matching line item:", error);
      return { success: false, error: "Failed to match line item" };
    }

    // Get the expense to find project_id for revalidation
    const { data: expense } = await userContext.supabase
      .from("expenses")
      .select("id, project_id")
      .eq("id", lineItem.expense_id)
      .single();

    revalidatePath(`/app/expenses/${lineItem.expense_id}`);
    if (expense?.project_id) {
      revalidatePath(`/app/projects/${expense.project_id}`);
    }

    return { success: true, data: lineItem };
  } catch (error) {
    console.error("Error matching line item:", error);
    return { success: false, error: "Failed to match line item" };
  }
}

// ============================================
// Task-Expense Integration
// ============================================

/**
 * Debug: Get all expenses for a specific task
 * Used in TaskExpensesSection to display task-linked expenses
 */
export async function getTaskExpenses(taskId: string) {
  try {
    if (!taskId) {
      return { success: false, error: "Task ID is required" };
    }

    const userContext = await getUserContext();
    if ("error" in userContext) {
      return { success: false, error: "Unauthorized" };
    }

    const { data: expenses, error } = await userContext.supabase
      .from("expenses")
      .select("id, description, amount, expense_date, vendor_name, category")
      .eq("task_id", taskId)
      .order("expense_date", { ascending: false });

    if (error) {
      console.error("[getTaskExpenses] Query error:", error);
      return { success: false, error: "Failed to fetch task expenses" };
    }

    return {
      success: true,
      data: expenses || [],
    };
  } catch (error) {
    console.error("[getTaskExpenses] Unexpected error:", error);
    return { success: false, error: "Failed to fetch task expenses" };
  }
}

/**
 * Get expense stats for multiple tasks in a single query (batch)
 * Eliminates N+1 query problem when displaying task cards with expense info
 *
 * @param taskIds - Array of task UUIDs to fetch expenses for
 * @returns Object keyed by task_id with expense stats (count, totalAmount)
 */
export async function getBatchTaskExpenses(taskIds: string[]) {
  try {
    // Handle empty array
    if (!taskIds || taskIds.length === 0) {
      return { success: true, data: {} };
    }

    const userContext = await getUserContext();
    if ("error" in userContext) {
      return { success: false, error: "Unauthorized" };
    }

    // Fetch all expenses for the given task IDs in one query
    const { data: expenses, error } = await userContext.supabase
      .from("expenses")
      .select("task_id, amount")
      .in("task_id", taskIds);

    if (error) {
      console.error("[getBatchTaskExpenses] Query error:", error);
      return { success: false, error: "Failed to fetch task expenses" };
    }

    // Aggregate expenses by task_id
    const expenseStats: Record<string, { count: number; totalAmount: number }> =
      {};

    for (const expense of expenses || []) {
      if (!expense.task_id) continue;

      if (!expenseStats[expense.task_id]) {
        expenseStats[expense.task_id] = { count: 0, totalAmount: 0 };
      }

      expenseStats[expense.task_id].count++;
      expenseStats[expense.task_id].totalAmount += expense.amount || 0;
    }

    return {
      success: true,
      data: expenseStats,
    };
  } catch (error) {
    console.error("[getBatchTaskExpenses] Unexpected error:", error);
    return { success: false, error: "Failed to fetch task expenses" };
  }
}

/**
 * Debug: Create expense from material purchase (auto-link)
 * When a material is delivered, prompt user to create expense
 */
export async function createExpenseFromMaterial(data: {
  material_assignment_id: string;
  task_id: string;
  project_id: string;
  amount: number;
  description: string;
  category: "materials";
}) {
  try {
    const userContext = await getUserContext();
    if ("error" in userContext) {
      return { success: false, error: "Unauthorized" };
    }

    // Check if material assignment already has linked expense
    const { data: existingLink } = await userContext.supabase
      .from("expense_line_items")
      .select("expense_id")
      .eq("material_assignment_id", data.material_assignment_id)
      .single();

    if (existingLink) {
      return { success: true, alreadyLinked: true };
    }

    // Create expense
    const { data: expense, error: expenseError } = await userContext.supabase
      .from("expenses")
      .insert({
        company_id: userContext.companyId,
        project_id: data.project_id,
        task_id: data.task_id,
        description: data.description,
        amount: data.amount,
        category: data.category,
        expense_date: new Date().toISOString().split("T")[0],
      })
      .select()
      .single();

    if (expenseError) {
      console.error(
        "[createExpenseFromMaterial] Expense creation error:",
        expenseError,
      );
      return { success: false, error: "Failed to create expense" };
    }

    // Create expense line item linking to material assignment
    const { error: lineItemError } = await userContext.supabase
      .from("expense_line_items")
      .insert({
        expense_id: expense.id,
        material_assignment_id: data.material_assignment_id,
        description: data.description,
        quantity: 1,
        unit_price: data.amount,
      });

    if (lineItemError) {
      console.error(
        "[createExpenseFromMaterial] Line item error:",
        lineItemError,
      );
      return { success: false, error: "Failed to link expense to material" };
    }

    // Revalidate paths
    revalidatePath("/app/expenses");
    revalidatePath(`/app/tasks/${data.task_id}`);
    revalidatePath(`/app/projects/${data.project_id}`);
    await invalidateDashboardCache({ companyId: userContext.companyId });

    return { success: true, expense };
  } catch (error) {
    console.error(
      "Debug: createExpenseFromMaterial - unexpected error:",
      error,
    );
    return { success: false, error: "Failed to create expense from material" };
  }
}

/**
 * Debug: Check if material assignment has linked expense
 * Used to show "Expense Linked" indicator and prevent duplicate expense creation
 */
export async function getMaterialExpenseLink(materialAssignmentId: string) {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("expense_line_items")
      .select("expense_id")
      .eq("material_assignment_id", materialAssignmentId)
      .single();

    if (error && error.code !== "PGRST116") {
      // PGRST116 is "not found" error, which is expected
      console.error("[getMaterialExpenseLink] Query error:", error);
      return { success: false, error: "Failed to check material expense link" };
    }

    return {
      success: true,
      expenseId: data?.expense_id || null,
    };
  } catch (error) {
    console.error("[getMaterialExpenseLink] Unexpected error:", error);
    return { success: false, error: "Failed to check material expense link" };
  }
}

// ============================================
// Expense Analytics
// ============================================

export interface ExpenseAnalytics {
  totalCount: number;
  totalAmount: number;
  byCategory: { category: string; amount: number; count: number }[];
}

/**
 * Get expense analytics for dashboard summary
 * Aggregates expense data by status and category
 *
 * @param filters Optional filters for projectId and date range
 * @returns Analytics data or error
 */
export async function getExpenseAnalytics(filters?: {
  projectId?: string;
  startDate?: string;
  endDate?: string;
}): Promise<{ data?: ExpenseAnalytics; error?: string }> {
  try {
    const userContext = await getUserContext();
    if ("error" in userContext) {
      return { error: userContext.error };
    }

    // Build query with company filter and optional filters
    let query = userContext.supabase
      .from("expenses")
      .select("id, amount, category")
      .eq("company_id", userContext.companyId);

    if (filters?.projectId) {
      query = query.eq("project_id", filters.projectId);
    }

    if (filters?.startDate) {
      query = query.gte("expense_date", filters.startDate);
    }

    if (filters?.endDate) {
      query = query.lte("expense_date", filters.endDate);
    }

    const { data: expenses, error } = await query;

    if (error) {
      console.error("Error fetching expenses for analytics:", error);
      return { error: "Failed to fetch expense analytics" };
    }

    // Initialize analytics
    const analytics: ExpenseAnalytics = {
      totalCount: 0,
      totalAmount: 0,
      byCategory: [],
    };

    // Category aggregation map
    const categoryMap: Record<string, { amount: number; count: number }> = {};

    // Process expenses
    for (const expense of expenses || []) {
      const amount = expense.amount || 0;

      // Total counts
      analytics.totalCount++;
      analytics.totalAmount += amount;

      // Category aggregation
      const category = expense.category || "other";
      if (!categoryMap[category]) {
        categoryMap[category] = { amount: 0, count: 0 };
      }
      categoryMap[category].amount += amount;
      categoryMap[category].count++;
    }

    // Convert category map to array sorted by amount descending
    analytics.byCategory = Object.entries(categoryMap)
      .map(([category, data]) => ({
        category,
        amount: data.amount,
        count: data.count,
      }))
      .sort((a, b) => b.amount - a.amount);

    return { data: analytics };
  } catch (error) {
    console.error("Error in getExpenseAnalytics:", error);
    return { error: "Failed to fetch expense analytics" };
  }
}

// ============================================
// Vendor Options for Combobox
// ============================================

/**
 * Vendor option interface for the VendorCombobox component
 */
export interface VendorOption {
  id: string;
  name: string;
  type: "member" | "subcontractor";
  displayName: string;
}

/**
 * Get vendor options for the VendorCombobox component
 * Returns combined list of company members and subcontractors
 * sorted alphabetically within groups (Members first, then Subcontractors)
 *
 * @param companyId - Company UUID to fetch vendors for
 * @returns Array of VendorOption or error
 */
export async function getVendorOptions(
  companyId: string,
): Promise<{ data?: VendorOption[]; error?: string }> {
  try {
    const userContext = await getUserContext();
    if ("error" in userContext) {
      return { error: userContext.error };
    }

    // Verify user belongs to this company
    if (userContext.companyId !== companyId) {
      return { error: "User not authorized for this company" };
    }

    // Fetch active company members with their profiles
    const { data: members, error: membersError } = await userContext.supabase
      .from("company_users")
      .select(
        `
        user_id,
        user_profiles:user_profiles!company_users_user_profile_fkey (
          id,
          name
        )
      `,
      )
      .eq("company_id", companyId)
      .eq("status", "active");

    if (membersError) {
      console.error("[getVendorOptions] Error fetching members:", membersError);
      return { error: "Failed to fetch company members" };
    }

    // Fetch active subcontractors
    const { data: subcontractors, error: subError } = await userContext.supabase
      .from("subcontractors")
      .select("id, company_name")
      .eq("company_id", companyId)
      .eq("is_active", true);

    if (subError) {
      console.error(
        "[getVendorOptions] Error fetching subcontractors:",
        subError,
      );
      return { error: "Failed to fetch subcontractors" };
    }

    // Build vendor options list
    const vendorOptions: VendorOption[] = [];

    // Add members (sorted alphabetically)
    const memberOptions: VendorOption[] = (members || [])
      .filter((m) => m.user_id && m.user_profiles)
      .map((m) => {
        const profile = m.user_profiles as unknown as {
          id: string;
          name: string;
        };
        return {
          id: profile.id,
          name: profile.name,
          type: "member" as const,
          displayName: `${profile.name} (Member)`,
        };
      })
      .sort((a, b) => a.name.localeCompare(b.name));

    // Add subcontractors (sorted alphabetically)
    const subOptions: VendorOption[] = (subcontractors || [])
      .map((s) => ({
        id: s.id,
        name: s.company_name,
        type: "subcontractor" as const,
        displayName: `${s.company_name} (Subcontractor)`,
      }))
      .sort((a, b) => a.name.localeCompare(b.name));

    // Combine: Members first, then Subcontractors
    vendorOptions.push(...memberOptions, ...subOptions);

    return { data: vendorOptions };
  } catch (error) {
    console.error("[getVendorOptions] Unexpected error:", error);
    return { error: "Failed to fetch vendor options" };
  }
}

// ============================================
// Initial Page Data Fetching
// ============================================

/**
 * Fetch all expenses data for the initial page load
 * Creates supabase client internally to avoid serialization issues with Cache Components
 * Uses React.cache for request-level deduplication
 *
 * @param companyId - Company UUID
 * @param role - User role for authorization
 * @returns Combined expenses, projects, and tasks data
 */
export const getInitialExpensesPageData = cache(
  async (companyId: string, role: string) => {
    try {
      const supabase = await createClient();

      // Expenses themselves are now loaded by getExpensesPage (paginated).
      // This loader only provides the projects + tasks needed for the filter
      // dropdowns and create/edit forms.
      const projectsResult = await supabase
        .from("projects")
        .select("id, name, status, end_date")
        .eq("company_id", companyId)
        .eq("status", "active")
        .order("name");

      // Fetch tasks for active projects (no waterfall now)
      const projectIds = projectsResult.data?.map((p) => p.id) || [];
      type TaskData = {
        id: string;
        title: string;
        project_id: string;
        task_type: string;
      };
      let tasksResult: { data: TaskData[] } = { data: [] };

      if (projectIds.length > 0) {
        const result = await supabase
          .from("tasks")
          .select("id, title, project_id, task_type")
          .in("project_id", projectIds)
          .order("created_at");
        tasksResult = { data: (result.data || []) as TaskData[] };
      }

      return {
        success: true,
        data: {
          expenses: [],
          projects: (projectsResult.data || []) as any[],
          tasks: tasksResult.data || [],
          role,
          companyId,
        },
      };
    } catch (error) {
      console.error("[getInitialExpensesPageData] Error:", error);
      return {
        success: false,
        error: "Failed to fetch expenses data",
        data: {
          expenses: [],
          projects: [],
          tasks: [],
          role,
          companyId,
        },
      };
    }
  },
);

// ============================================
// Auto-Expense Creation from Task
// ============================================

// Category mapping from task_type to expense_category
const TASK_TYPE_TO_EXPENSE_CATEGORY: Record<string, ExpenseCategory> = {
  work: "labor",
  purchase: "materials",
  approval: "permits",
  admin: "other",
};

// Input schema for createExpenseFromTask
const createExpenseFromTaskSchema = z.object({
  taskId: z.string().uuid("Invalid task ID"),
});

/**
 * Create an expense from a task's actual_cost
 * Used by the auto-expense toggle feature when saving a task with actual_cost > 0
 *
 * Field mappings:
 * - amount: task.actual_cost
 * - description: task.title (prefixed with "Task expense:")
 * - project_id: task.project_id
 * - task_id: task.id
 * - expense_date: current date
 * - category: derived from task.task_type
 * - vendor_name: primary assignee name (user.name or subcontractor.company_name)
 *
 * @param taskId - Task UUID to create expense from
 * @returns Created expense or error
 */
export async function createExpenseFromTask(
  taskId: string,
): Promise<{ success: boolean; data?: Expense; error?: string }> {
  console.log("[createExpenseFromTask] Creating expense from task:", taskId);

  try {
    // Validate input
    const validation = createExpenseFromTaskSchema.safeParse({ taskId });
    if (!validation.success) {
      return { success: false, error: validation.error.issues[0].message };
    }

    const userContext = await getUserContext();
    if ("error" in userContext) {
      return { success: false, error: "Unauthorized" };
    }

    // P-006 FIX: Parallelize task fetch, expense check, and assignee lookup
    const [taskResult, existingExpenseResult, primaryAssigneeResult] =
      await Promise.all([
        userContext.supabase
          .from("tasks")
          .select(
            `
        id,
        title,
        actual_cost,
        project_id,
        task_type,
        created_by,
        projects!inner (
          id,
          company_id
        )
      `,
          )
          .eq("id", taskId)
          .single(),
        userContext.supabase
          .from("expenses")
          .select("id")
          .eq("task_id", taskId)
          .maybeSingle(),
        userContext.supabase
          .from("task_assignees")
          .select(
            `
        user_id,
        subcontractor_id,
        user:user_profiles (
          id,
          name
        ),
        subcontractor:subcontractors (
          id,
          company_name,
          contact_name
        )
      `,
          )
          .eq("task_id", taskId)
          .eq("is_primary", true)
          .maybeSingle(),
      ]);

    const { data: task, error: taskError } = taskResult;
    if (taskError || !task) {
      console.error("[createExpenseFromTask] Task not found:", taskError);
      return { success: false, error: "Task not found" };
    }

    // Verify task belongs to user's company
    const project = task.projects as unknown as {
      id: string;
      company_id: string;
    };
    if (project.company_id !== userContext.companyId) {
      return {
        success: false,
        error: "Insufficient permissions to access this task",
      };
    }

    // Verify task has actual_cost > 0
    if (!task.actual_cost || task.actual_cost <= 0) {
      return { success: false, error: "Task has no actual cost to expense" };
    }

    // Check if expense already exists for this task
    const { data: existingExpense } = existingExpenseResult;
    if (existingExpense) {
      return {
        success: false,
        error: "An expense already exists for this task",
      };
    }

    // Fetch primary assignee for vendor_name
    let vendorName: string | null = null;
    const { data: primaryAssignee } = primaryAssigneeResult;

    if (primaryAssignee) {
      if (primaryAssignee.user_id && primaryAssignee.user) {
        // User assignee - use their name
        const user = primaryAssignee.user as unknown as {
          id: string;
          name: string;
        };
        vendorName = user.name;
      } else if (
        primaryAssignee.subcontractor_id &&
        primaryAssignee.subcontractor
      ) {
        // Subcontractor assignee - use company_name
        const sub = primaryAssignee.subcontractor as unknown as {
          id: string;
          company_name: string;
          contact_name: string;
        };
        vendorName = sub.company_name;
      }
    }

    // If no primary assignee, try to get creator name
    if (!vendorName && task.created_by) {
      const { data: creator } = await userContext.supabase
        .from("user_profiles")
        .select("name")
        .eq("id", task.created_by)
        .single();

      if (creator) {
        vendorName = creator.name;
      }
    }

    // Map task_type to expense category
    const category = TASK_TYPE_TO_EXPENSE_CATEGORY[task.task_type] || "other";

    // Create the expense
    const expenseData: ExpenseInsert = {
      company_id: userContext.companyId,
      project_id: task.project_id,
      task_id: task.id,
      description: `Task expense: ${task.title}`,
      amount: task.actual_cost,
      category: category,
      expense_date: new Date().toISOString().split("T")[0], // Today's date
      vendor_name: vendorName,
    };

    const { data: expense, error: insertError } = await userContext.supabase
      .from("expenses")
      .insert(expenseData)
      .select()
      .single();

    if (insertError) {
      console.error(
        "[createExpenseFromTask] Error creating expense:",
        insertError,
      );
      return { success: false, error: "Failed to create expense" };
    }

    console.log(
      "[createExpenseFromTask] Expense created successfully:",
      expense.id,
    );

    // Revalidate paths
    revalidatePath("/app/expenses");
    revalidatePath(`/app/tasks/${taskId}`);
    if (task.project_id) {
      revalidatePath(`/app/projects/${task.project_id}`);
    }
    await invalidateDashboardCache({ companyId: userContext.companyId });

    return { success: true, data: expense };
  } catch (error) {
    console.error("[createExpenseFromTask] Unexpected error:", error);
    return { success: false, error: "Failed to create expense from task" };
  }
}

// ============================================
// Payment Method Suggestions
// ============================================

/**
 * Get distinct payment methods used by this company for autocomplete
 * Used in CreateExpenseModal and AddPaymentModal combobox fields
 */
export async function getPaymentMethodSuggestions(): Promise<{
  data?: string[];
  error?: string;
}> {
  try {
    const userContext = await getUserContext();
    if ("error" in userContext) {
      return { error: "Unauthorized" };
    }

    const { data, error } = await userContext.supabase
      .from("expenses")
      .select("payment_method")
      .eq("company_id", userContext.companyId)
      .not("payment_method", "is", null)
      .order("payment_method");

    if (error) {
      console.error("[getPaymentMethodSuggestions] Query error:", error);
      return { error: "Failed to fetch payment method suggestions" };
    }

    // Deduplicate in JS since Supabase JS client doesn't expose SELECT DISTINCT cleanly
    const seen = new Set<string>();
    const suggestions: string[] = [];
    for (const row of (data as any[]) || []) {
      if (row.payment_method && !seen.has(row.payment_method)) {
        seen.add(row.payment_method);
        suggestions.push(row.payment_method);
      }
    }

    return { data: suggestions };
  } catch (error) {
    console.error("[getPaymentMethodSuggestions] Unexpected error:", error);
    return { error: "Failed to fetch payment method suggestions" };
  }
}

// ============================================
// Paginated + Filtered Expense Queries
// ============================================

/**
 * Filter parameters for expense queries.
 * Export here (single source of truth) so client components can import
 * without redefining locally — avoids TS2719 duplicate-type errors.
 */
export interface ExpenseQueryFilters {
  search?: string;
  projectId?: string; // 'all' | uuid
  category?: string; // 'all' | ExpenseCategory
  hasReceipt?: "all" | "with" | "without";
  dateRange?: "all" | "month" | "last30" | "year";
  sort?: "created_at" | "date" | "amount_high" | "amount_low" | "description";
}

/** Shared select string used by all paginated expense queries (mirrors getInitialExpensesPageData). */
const EXPENSE_SELECT = `
  *,
  project:projects!expenses_project_id_fkey (
    id,
    name
  ),
  task:tasks!expenses_task_id_fkey (
    id,
    title
  )
` as const;

/**
 * Sanitise a search term so it cannot break the PostgREST `.or()` syntax.
 * Strips the characters that PostgREST uses as delimiters / operators.
 */
function sanitiseSearch(raw: string): string {
  return raw.replace(/[%,()\s]/g, " ").trim();
}

/**
 * Apply `ExpenseQueryFilters` to a Supabase query that already has
 * `.from('expenses').eq('company_id', companyId)` set.
 *
 * Mutates-and-returns the query builder so callers can chain further.
 *
 * Rules applied:
 *   query-select-only  – never reads more columns than needed
 *   security-no-client-ids – company_id is always applied by the caller
 */
function applyExpenseFilters<T>(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  query: any,
  filters: ExpenseQueryFilters,
): T {
  // Category filter
  if (filters.category && filters.category !== "all") {
    query = query.eq("category", filters.category);
  }

  // Project filter
  if (filters.projectId && filters.projectId !== "all") {
    query = query.eq("project_id", filters.projectId);
  }

  // Receipt presence filter
  if (filters.hasReceipt === "with") {
    query = query.not("receipt_url", "is", null);
  } else if (filters.hasReceipt === "without") {
    query = query.is("receipt_url", null);
  }

  // Full-text-style search across description, vendor_name, category
  if (filters.search) {
    const term = sanitiseSearch(filters.search);
    if (term.length > 0) {
      query = query.or(
        `description.ilike.%${term}%,vendor_name.ilike.%${term}%,category.ilike.%${term}%`,
      );
    }
  }

  // Date range filter — Date construction happens inside function body (not module scope)
  if (filters.dateRange && filters.dateRange !== "all") {
    const now = new Date();
    let startDate: Date;

    if (filters.dateRange === "month") {
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    } else if (filters.dateRange === "last30") {
      startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    } else {
      // 'year'
      startDate = new Date(now.getFullYear(), 0, 1);
    }

    query = query.gte("expense_date", startDate.toISOString().split("T")[0]);
  }

  return query as T;
}

/**
 * Fetch a single page of expenses with optional filtering, sorting, and pagination.
 *
 * Uses the limit+1 trick (cursor precedent from chat-queries.ts) to determine
 * whether more pages exist without a separate COUNT query.
 *
 * Skills applied: query-avoid-n-plus-1 (single query with joins),
 *                 security-no-client-ids (companyId from server context),
 *                 query-index-usage (ordered by indexed columns)
 */
export async function getExpensesPage(
  companyId: string,
  filters: ExpenseQueryFilters,
  offset: number,
  limit = 30,
): Promise<{
  success: boolean;
  data: { expenses: ExpenseWithRelations[]; hasMore: boolean };
  error?: string;
}> {
  try {
    // Resolve company scope from the session — never trust the caller-supplied
    // companyId (these actions are invoked from the client).
    const userContext = await getUserContext();
    if ("error" in userContext || userContext.companyId !== companyId) {
      return {
        success: false,
        error: "Unauthorized",
        data: { expenses: [], hasMore: false },
      };
    }
    const supabase = userContext.supabase;

    // Build base query
    let query = supabase
      .from("expenses")
      .select(EXPENSE_SELECT)
      .eq("company_id", userContext.companyId);

    // Apply filters
    query = applyExpenseFilters(query, filters);

    // Apply sort
    switch (filters.sort) {
      case "date":
        query = query.order("expense_date", { ascending: false });
        break;
      case "amount_high":
        query = query.order("amount", { ascending: false });
        break;
      case "amount_low":
        query = query.order("amount", { ascending: true });
        break;
      case "description":
        query = query.order("description", { ascending: true });
        break;
      case "created_at":
      default:
        query = query.order("created_at", { ascending: false });
        break;
    }

    // Fetch limit+1 rows to determine hasMore (avoids COUNT query)
    query = query.range(offset, offset + limit);

    const { data, error } = await query;

    if (error) {
      console.error("[getExpensesPage] Supabase error:", error);
      return {
        success: false,
        error: error.message,
        data: { expenses: [], hasMore: false },
      };
    }

    const rows = (data ?? []) as ExpenseWithRelations[];
    const hasMore = rows.length > limit;
    const expenses = hasMore ? rows.slice(0, limit) : rows;

    return { success: true, data: { expenses, hasMore } };
  } catch (error) {
    console.error("[getExpensesPage] Unexpected error:", error);
    return {
      success: false,
      error: "Failed to fetch expenses",
      data: { expenses: [], hasMore: false },
    };
  }
}

/**
 * Return count and total amount for the current filter set.
 *
 * Fetches only the `amount` column (no joins, no range) and aggregates in JS.
 * Used to populate summary cards without a second paginated request.
 *
 * Skills applied: query-select-only (amount column only),
 *                 security-no-client-ids (companyId from server context)
 */
export async function getExpensesSummary(
  companyId: string,
  filters: ExpenseQueryFilters,
): Promise<{ count: number; totalAmount: number }> {
  try {
    const userContext = await getUserContext();
    if ("error" in userContext || userContext.companyId !== companyId) {
      return { count: 0, totalAmount: 0 };
    }
    const supabase = userContext.supabase;

    let query = supabase
      .from("expenses")
      .select("amount")
      .eq("company_id", userContext.companyId);

    query = applyExpenseFilters(query, filters);

    const { data, error } = await query;

    if (error) {
      console.error("[getExpensesSummary] Supabase error:", error);
      return { count: 0, totalAmount: 0 };
    }

    const rows = (data ?? []) as { amount: number }[];
    const count = rows.length;
    const totalAmount = rows.reduce((sum, r) => sum + (r.amount ?? 0), 0);

    return { count, totalAmount };
  } catch (error) {
    console.error("[getExpensesSummary] Unexpected error:", error);
    return { count: 0, totalAmount: 0 };
  }
}

/**
 * Return project-level and category-level aggregates for the full company
 * expense set (no filters applied — used for sidebar/chart summaries).
 *
 * Fetches only `project_id, category, amount` columns — no joins, no range.
 * Groups entirely in JS to avoid multiple round-trips.
 *
 * Skills applied: query-select-only (3 columns only),
 *                 query-avoid-n-plus-1 (single query, JS grouping),
 *                 security-no-client-ids (companyId from server context)
 */
export async function getExpenseAggregates(companyId: string): Promise<{
  projectCounts: Record<string, number>;
  projectAmounts: Record<string, number>;
  categoryCounts: Record<string, number>;
  totalCount: number;
  totalAmount: number;
}> {
  const fallback = {
    projectCounts: {},
    projectAmounts: {},
    categoryCounts: {},
    totalCount: 0,
    totalAmount: 0,
  };

  try {
    const userContext = await getUserContext();
    if ("error" in userContext || userContext.companyId !== companyId) {
      return fallback;
    }
    const supabase = userContext.supabase;

    const { data, error } = await supabase
      .from("expenses")
      .select("project_id, category, amount")
      .eq("company_id", userContext.companyId);

    if (error) {
      console.error("[getExpenseAggregates] Supabase error:", error);
      return fallback;
    }

    const rows = (data ?? []) as {
      project_id: string | null;
      category: string | null;
      amount: number;
    }[];

    const projectCounts: Record<string, number> = {};
    const projectAmounts: Record<string, number> = {};
    const categoryCounts: Record<string, number> = {};
    let totalCount = 0;
    let totalAmount = 0;

    for (const row of rows) {
      totalCount += 1;
      totalAmount += row.amount ?? 0;

      if (row.project_id) {
        projectCounts[row.project_id] =
          (projectCounts[row.project_id] ?? 0) + 1;
        projectAmounts[row.project_id] =
          (projectAmounts[row.project_id] ?? 0) + (row.amount ?? 0);
      }

      if (row.category) {
        categoryCounts[row.category] = (categoryCounts[row.category] ?? 0) + 1;
      }
    }

    return {
      projectCounts,
      projectAmounts,
      categoryCounts,
      totalCount,
      totalAmount,
    };
  } catch (error) {
    console.error("[getExpenseAggregates] Unexpected error:", error);
    return fallback;
  }
}
