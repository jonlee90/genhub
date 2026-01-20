"use server";

import { cache } from "react";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/utils/supabase/server";
import { auth } from "@/lib/auth";
import type { ExpensesRow, ExpensesInsert } from "@/types/db/tables/expenses";
import type { ExpenseCategory } from "@/types/db/enums";
import type { Database } from "@/types/db/helpers";

type Expense = ExpensesRow;
type ExpenseInsert = ExpensesInsert;

// ============================================
// Cached User Context
// ============================================

/**
 * Get user context with caching to avoid repeated auth + DB lookups
 * Uses React.cache() to deduplicate auth calls within a single request
 */
export const getUserContext = cache(async () => {
  const session = await auth();
  if (!session?.user?.id) return null;

  const supabase = await createClient();
  const { data: companyUser } = await supabase
    .from("company_users")
    .select("company_id, role")
    .eq("user_id", session.user.id)
    .eq("status", "active")
    .single();

  if (!companyUser) return null;

  return {
    userId: session.user.id,
    userName: session.user.name,
    companyId: companyUser.company_id,
    role: companyUser.role,
    supabase,
  };
});

// ============================================
// Validation Schemas
// ============================================

const createExpenseSchema = z.object({
  description: z.string().min(1, "Description is required"),
  amount: z.number().min(0.01, "Amount must be positive"),
  category: z.enum([
    "materials",
    "labor",
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
});

const updateExpenseSchema = z.object({
  id: z.string().uuid("Invalid expense ID"),
  description: z.string().min(1).optional(),
  amount: z.number().min(0.01).optional(),
  category: z
    .enum([
      "materials",
      "labor",
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
});

const reviewExpenseSchema = z.object({
  id: z.string().uuid("Invalid expense ID"),
  status: z.enum(["approved", "rejected", "under_review"]),
  approval_notes: z.string().optional().nullable(),
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
    if (!userContext) {
      return { success: false, error: "Unauthorized" };
    }

    const validated = createExpenseSchema.parse(data);

    // Create expense
    const { data: expense, error } = await userContext.supabase
      .from("expenses")
      .insert({
        ...validated,
        company_id: userContext.companyId,
        submitted_by: userContext.userId,
        status: "submitted",
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating expense:", error);
      return { success: false, error: "Failed to create expense" };
    }

    // Notify project managers about new expense
    if (validated.project_id) {
      const { data: projectManagers } = await userContext.supabase
        .from("project_team")
        .select("user_id")
        .eq("project_id", validated.project_id)
        .eq("role", "project_manager");

      if (projectManagers && projectManagers.length > 0) {
        const notifications = projectManagers
          .filter((pm) => pm.user_id !== null)
          .map((pm) => ({
            user_id: pm.user_id as string,
            type: "expense_submitted" as const,
            title: "New Expense Submitted",
            message: `${userContext.userName || "A user"} submitted an expense for review: ${validated.description}`,
            link: `/app/expenses/${expense.id}`,
          }));

        if (notifications.length > 0) {
          await userContext.supabase.from("notifications").insert(notifications);
        }
      }
    }

    revalidatePath("/app/expenses");
    if (validated.project_id) {
      revalidatePath(`/app/projects/${validated.project_id}`);
    }

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
    if (!userContext) {
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

    return { success: true, data: expense };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.issues[0].message };
    }
    console.error("Error updating expense:", error);
    return { success: false, error: "Failed to update expense" };
  }
}

export async function reviewExpense(data: z.infer<typeof reviewExpenseSchema>) {
  try {
    const userContext = await getUserContext();
    if (!userContext) {
      return { success: false, error: "Unauthorized" };
    }

    const validated = reviewExpenseSchema.parse(data);

    // Get current expense
    const { data: currentExpense } = await userContext.supabase
      .from("expenses")
      .select("submitted_by, project_id, description")
      .eq("id", validated.id)
      .single();

    // Update expense with review
    const { data: expense, error } = await userContext.supabase
      .from("expenses")
      .update({
        status: validated.status,
        approval_notes: validated.approval_notes,
        reviewed_by: userContext.userId,
        reviewed_at: new Date().toISOString(),
      })
      .eq("id", validated.id)
      .select()
      .single();

    if (error) {
      console.error("Error reviewing expense:", error);
      return { success: false, error: "Failed to review expense" };
    }

    // Notify submitter
    if (currentExpense) {
      await userContext.supabase.from("notifications").insert({
        user_id: currentExpense.submitted_by,
        type:
          validated.status === "approved"
            ? "expense_approved"
            : "expense_rejected",
        title: `Expense ${validated.status === "approved" ? "Approved" : "Rejected"}`,
        message: `Your expense "${currentExpense.description}" has been ${validated.status}`,
        link: `/app/expenses/${validated.id}`,
      });

      // Send AlimTalk notification to submitter (Task 0018)
      try {
        const { KakaoService } = await import("@/lib/services/kakao");
        await KakaoService.sendAlimTalk(currentExpense.submitted_by, {
          template: "expense_status",
          params: {
            status: validated.status === "approved" ? "Approved" : "Rejected",
            amount: `$${expense.amount.toFixed(2)}`,
            comment: validated.approval_notes || "No comment provided",
          },
        });
      } catch (error) {
        console.error("[reviewExpense] Error sending AlimTalk:", error);
        // Don't fail expense review if AlimTalk fails
      }
    }

    revalidatePath("/app/expenses");
    revalidatePath(`/app/expenses/${validated.id}`);
    if (expense.project_id) {
      revalidatePath(`/app/projects/${expense.project_id}`);
    }

    return { success: true, data: expense };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.issues[0].message };
    }
    console.error("Error reviewing expense:", error);
    return { success: false, error: "Failed to review expense" };
  }
}

export async function deleteExpense(expenseId: string) {
  try {
    const userContext = await getUserContext();
    if (!userContext) {
      return { success: false, error: "Unauthorized" };
    }

    // Get expense details before deleting
    const { data: expense } = await userContext.supabase
      .from("expenses")
      .select("project_id")
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

    revalidatePath("/app/expenses");
    if (expense?.project_id) {
      revalidatePath(`/app/projects/${expense.project_id}`);
    }

    return { success: true };
  } catch (error) {
    console.error("Error deleting expense:", error);
    return { success: false, error: "Failed to delete expense" };
  }
}

export async function getExpensesByProject(projectId: string) {
  try {
    const userContext = await getUserContext();
    if (!userContext) {
      return { success: false, error: "Unauthorized" };
    }

    const { data: expenses, error } = await userContext.supabase
      .from("expenses")
      .select(
        `
        *,
        submitted_by_user:submitted_by(id, name, email),
        reviewed_by_user:reviewed_by(id, name, email),
        task:tasks(id, title),
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
    if (!userContext) {
      return { success: false, error: "Unauthorized" };
    }

    const { data: expenses, error } = await userContext.supabase
      .from("expenses")
      .select(
        `
        *,
        submitted_by_user:submitted_by(id, name, email),
        reviewed_by_user:reviewed_by(id, name, email),
        project:projects(id, name),
        task:tasks(id, title)
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
    if (!userContext) {
      return { success: false, error: "Unauthorized" };
    }

    const { data: expense, error } = await userContext.supabase
      .from("expenses")
      .select(
        `
        *,
        submitted_by_user:submitted_by(id, name, email),
        reviewed_by_user:reviewed_by(id, name, email),
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
    if (!userContext) {
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
    if (!userContext) {
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
    if (!userContext) {
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

      await userContext.supabase.from("expense_line_items").insert(lineItemsToInsert);
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
    if (!userContext) {
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
    if (!userContext) {
      return { success: false, error: "Unauthorized" };
    }

    const { data: expenses, error } = await userContext.supabase
      .from("expenses")
      .select(
        "id, description, amount, status, expense_date, vendor_name, category",
      )
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
    if (!userContext) {
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
    if (!userContext) {
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
        submitted_by: userContext.userId,
        status: "submitted",
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
  pendingCount: number;
  pendingAmount: number;
  approvedCount: number;
  approvedAmount: number;
  rejectedCount: number;
  rejectedAmount: number;
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
    if (!userContext) {
      return { error: "Unauthorized" };
    }

    // Build query with company filter and optional filters
    let query = userContext.supabase
      .from("expenses")
      .select("id, amount, status, category")
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
      pendingCount: 0,
      pendingAmount: 0,
      approvedCount: 0,
      approvedAmount: 0,
      rejectedCount: 0,
      rejectedAmount: 0,
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

      // Status aggregation
      // "pending" = submitted + under_review (awaiting decision)
      if (expense.status === "submitted" || expense.status === "under_review") {
        analytics.pendingCount++;
        analytics.pendingAmount += amount;
      } else if (expense.status === "approved" || expense.status === "paid") {
        analytics.approvedCount++;
        analytics.approvedAmount += amount;
      } else if (expense.status === "rejected") {
        analytics.rejectedCount++;
        analytics.rejectedAmount += amount;
      }

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
    if (!userContext) {
      return { error: "Unauthorized" };
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
        user_profiles!inner (
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
export const getInitialExpensesPageData = cache(async (
  companyId: string,
  role: string,
) => {
  try {
    const supabase = await createClient();

    // Fetch projects, expenses, and tasks in parallel
    const projectsPromise = supabase
      .from("projects")
      .select("id, name, status, end_date")
      .eq("company_id", companyId)
      .eq("status", "active")
      .order("name");

    const expensesPromise = supabase
      .from("expenses")
      .select(
        `
        *,
        project:projects!expenses_project_id_fkey (
          id,
          name
        ),
        task:tasks!expenses_task_id_fkey (
          id,
          title
        )
      `,
      )
      .eq("company_id", companyId)
      .order("created_at", { ascending: false });

    type TaskData = { id: string; title: string; project_id: string; task_type: string };
    const tasksPromise = (async (): Promise<{ data: TaskData[] }> => {
      const projectsResult = await projectsPromise;
      const projectIds = projectsResult.data?.map((p) => p.id) || [];
      if (!projectIds.length) {
        return { data: [] };
      }
      const result = await supabase
        .from("tasks")
        .select("id, title, project_id, task_type")
        .in("project_id", projectIds)
        .order("created_at");
      return { data: (result.data || []) as TaskData[] };
    })();

    const [projectsResult, expensesResult, tasksResult] = await Promise.all([
      projectsPromise,
      expensesPromise,
      tasksPromise,
    ]);

    return {
      success: true,
      data: {
        expenses: expensesResult.data || [],
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
});

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
    if (!userContext) {
      return { success: false, error: "Unauthorized" };
    }

    // Fetch task with project info
    const { data: task, error: taskError } = await userContext.supabase
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
      .single();

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
    const { data: existingExpense } = await userContext.supabase
      .from("expenses")
      .select("id")
      .eq("task_id", taskId)
      .maybeSingle();

    if (existingExpense) {
      return {
        success: false,
        error: "An expense already exists for this task",
      };
    }

    // Fetch primary assignee for vendor_name
    let vendorName: string | null = null;

    const { data: primaryAssignee } = await userContext.supabase
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
      .maybeSingle();

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
      submitted_by: userContext.userId,
      status: "submitted",
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

    return { success: true, data: expense };
  } catch (error) {
    console.error("[createExpenseFromTask] Unexpected error:", error);
    return { success: false, error: "Failed to create expense from task" };
  }
}
