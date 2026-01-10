'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { createClient } from '@/utils/supabase/server';
import { auth } from '@/lib/auth';
import type { Database } from '@/types/database.types';

type Expense = Database['public']['Tables']['expenses']['Row'];
type ExpenseInsert = Database['public']['Tables']['expenses']['Insert'];
type ExpenseUpdate = Database['public']['Tables']['expenses']['Update'];
type ExpenseLineItem = Database['public']['Tables']['expense_line_items']['Row'];
type ExpenseLineItemInsert = Database['public']['Tables']['expense_line_items']['Insert'];
type ExpenseStatus = Database['public']['Enums']['expense_status'];
type ExpenseCategory = Database['public']['Enums']['expense_category'];

// ============================================
// Validation Schemas
// ============================================

const createExpenseSchema = z.object({
  description: z.string().min(1, 'Description is required'),
  amount: z.number().min(0.01, 'Amount must be positive'),
  category: z.enum(['materials', 'labor', 'equipment', 'permits', 'transportation', 'meals', 'lodging', 'other']),
  expense_date: z.string(),
  project_id: z.string().uuid().optional().nullable(),
  task_id: z.string().uuid().optional().nullable(),
  vendor_name: z.string().optional().nullable(),
  vendor_address: z.string().optional().nullable(),
  receipt_url: z.string().url().optional().nullable(),
});

const updateExpenseSchema = z.object({
  id: z.string().uuid('Invalid expense ID'),
  description: z.string().min(1).optional(),
  amount: z.number().min(0.01).optional(),
  category: z.enum(['materials', 'labor', 'equipment', 'permits', 'transportation', 'meals', 'lodging', 'other']).optional(),
  expense_date: z.string().optional(),
  vendor_name: z.string().optional().nullable(),
  vendor_address: z.string().optional().nullable(),
});

const reviewExpenseSchema = z.object({
  id: z.string().uuid('Invalid expense ID'),
  status: z.enum(['approved', 'rejected', 'under_review']),
  approval_notes: z.string().optional().nullable(),
});

const addLineItemSchema = z.object({
  expense_id: z.string().uuid('Invalid expense ID'),
  description: z.string().min(1, 'Description is required'),
  quantity: z.number().min(0.01).optional(),
  unit_price: z.number().min(0, 'Unit price must be positive'),
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
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: 'Unauthorized' };
    }

    const validated = createExpenseSchema.parse(data);
    const supabase = await createClient();

    // Get user's company
    const { data: companyUser, error: companyError } = await supabase
      .from('company_users')
      .select('company_id')
      .eq('user_id', session.user.id)
      .eq('status', 'active')
      .single();

    if (companyError || !companyUser) {
      return { success: false, error: 'User not associated with a company' };
    }

    // Create expense
    const { data: expense, error } = await supabase
      .from('expenses')
      .insert({
        ...validated,
        company_id: companyUser.company_id,
        submitted_by: session.user.id,
        status: 'submitted',
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating expense:', error);
      return { success: false, error: 'Failed to create expense' };
    }

    // Notify project managers about new expense
    if (validated.project_id) {
      const { data: projectManagers } = await supabase
        .from('project_team')
        .select('user_id')
        .eq('project_id', validated.project_id)
        .eq('role', 'project_manager');

      if (projectManagers && projectManagers.length > 0) {
        const notifications = projectManagers
          .filter(pm => pm.user_id !== null)
          .map((pm) => ({
            user_id: pm.user_id as string,
            type: 'expense_submitted' as const,
            title: 'New Expense Submitted',
            message: `${session.user.name || 'A user'} submitted an expense for review: ${validated.description}`,
            link: `/app/expenses/${expense.id}`,
          }));

        if (notifications.length > 0) {
          await supabase.from('notifications').insert(notifications);
        }
      }
    }

    revalidatePath('/app/expenses');
    if (validated.project_id) {
      revalidatePath(`/app/projects/${validated.project_id}`);
    }

    return { success: true, data: expense };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.issues[0].message };
    }
    console.error('Error creating expense:', error);
    return { success: false, error: 'Failed to create expense' };
  }
}

export async function updateExpense(data: z.infer<typeof updateExpenseSchema>) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: 'Unauthorized' };
    }

    const validated = updateExpenseSchema.parse(data);
    const supabase = await createClient();

    const { data: expense, error } = await supabase
      .from('expenses')
      .update(validated)
      .eq('id', validated.id)
      .select()
      .single();

    if (error) {
      console.error('Error updating expense:', error);
      return { success: false, error: 'Failed to update expense' };
    }

    revalidatePath('/app/expenses');
    revalidatePath(`/app/expenses/${validated.id}`);
    if (expense.project_id) {
      revalidatePath(`/app/projects/${expense.project_id}`);
    }

    return { success: true, data: expense };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.issues[0].message };
    }
    console.error('Error updating expense:', error);
    return { success: false, error: 'Failed to update expense' };
  }
}

export async function reviewExpense(data: z.infer<typeof reviewExpenseSchema>) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: 'Unauthorized' };
    }

    const validated = reviewExpenseSchema.parse(data);
    const supabase = await createClient();

    // Get current expense
    const { data: currentExpense } = await supabase
      .from('expenses')
      .select('submitted_by, project_id, description')
      .eq('id', validated.id)
      .single();

    // Update expense with review
    const { data: expense, error } = await supabase
      .from('expenses')
      .update({
        status: validated.status,
        approval_notes: validated.approval_notes,
        reviewed_by: session.user.id,
        reviewed_at: new Date().toISOString(),
      })
      .eq('id', validated.id)
      .select()
      .single();

    if (error) {
      console.error('Error reviewing expense:', error);
      return { success: false, error: 'Failed to review expense' };
    }

    // Notify submitter
    if (currentExpense) {
      await supabase.from('notifications').insert({
        user_id: currentExpense.submitted_by,
        type: validated.status === 'approved' ? 'expense_approved' : 'expense_rejected',
        title: `Expense ${validated.status === 'approved' ? 'Approved' : 'Rejected'}`,
        message: `Your expense "${currentExpense.description}" has been ${validated.status}`,
        link: `/app/expenses/${validated.id}`,
      });

      // Send AlimTalk notification to submitter (Task 0018)
      try {
        const { KakaoService } = await import('@/lib/services/kakao');
        await KakaoService.sendAlimTalk(currentExpense.submitted_by, {
          template: 'expense_status',
          params: {
            status: validated.status === 'approved' ? 'Approved' : 'Rejected',
            amount: `$${expense.amount.toFixed(2)}`,
            comment: validated.approval_notes || 'No comment provided',
          },
        });
      } catch (error) {
        console.error('[reviewExpense] Error sending AlimTalk:', error);
        // Don't fail expense review if AlimTalk fails
      }
    }

    revalidatePath('/app/expenses');
    revalidatePath(`/app/expenses/${validated.id}`);
    if (expense.project_id) {
      revalidatePath(`/app/projects/${expense.project_id}`);
    }

    return { success: true, data: expense };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.issues[0].message };
    }
    console.error('Error reviewing expense:', error);
    return { success: false, error: 'Failed to review expense' };
  }
}

export async function deleteExpense(expenseId: string) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: 'Unauthorized' };
    }

    const supabase = await createClient();

    // Get expense details before deleting
    const { data: expense } = await supabase
      .from('expenses')
      .select('project_id')
      .eq('id', expenseId)
      .single();

    const { error } = await supabase
      .from('expenses')
      .delete()
      .eq('id', expenseId);

    if (error) {
      console.error('Error deleting expense:', error);
      return { success: false, error: 'Failed to delete expense' };
    }

    revalidatePath('/app/expenses');
    if (expense?.project_id) {
      revalidatePath(`/app/projects/${expense.project_id}`);
    }

    return { success: true };
  } catch (error) {
    console.error('Error deleting expense:', error);
    return { success: false, error: 'Failed to delete expense' };
  }
}

export async function getExpensesByProject(projectId: string) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: 'Unauthorized' };
    }

    const supabase = await createClient();

    const { data: expenses, error } = await supabase
      .from('expenses')
      .select(`
        *,
        submitted_by_user:submitted_by(id, name, email),
        reviewed_by_user:reviewed_by(id, name, email),
        task:tasks(id, title),
        line_items:expense_line_items(*)
      `)
      .eq('project_id', projectId)
      .order('expense_date', { ascending: false });

    if (error) {
      console.error('Error fetching expenses:', error);
      return { success: false, error: 'Failed to fetch expenses' };
    }

    return { success: true, data: expenses };
  } catch (error) {
    console.error('Error fetching expenses:', error);
    return { success: false, error: 'Failed to fetch expenses' };
  }
}

export async function getExpensesByCompany() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: 'Unauthorized' };
    }

    const supabase = await createClient();

    // Get user's company_id for proper data isolation
    const { data: companyUser, error: companyError } = await supabase
      .from('company_users')
      .select('company_id')
      .eq('user_id', session.user.id)
      .eq('status', 'active')
      .maybeSingle();

    if (companyError || !companyUser) {
      return { success: true, data: [] };
    }

    const { data: expenses, error } = await supabase
      .from('expenses')
      .select(`
        *,
        submitted_by_user:submitted_by(id, name, email),
        reviewed_by_user:reviewed_by(id, name, email),
        project:projects(id, name),
        task:tasks(id, title)
      `)
      .eq('company_id', companyUser.company_id)
      .order('expense_date', { ascending: false });

    if (error) {
      console.error('Error fetching expenses:', error);
      return { success: false, error: 'Failed to fetch expenses' };
    }

    return { success: true, data: expenses };
  } catch (error) {
    console.error('Error fetching expenses:', error);
    return { success: false, error: 'Failed to fetch expenses' };
  }
}

export async function getExpenseById(expenseId: string) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: 'Unauthorized' };
    }

    const supabase = await createClient();

    const { data: expense, error } = await supabase
      .from('expenses')
      .select(`
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
      `)
      .eq('id', expenseId)
      .single();

    if (error) {
      console.error('Error fetching expense:', error);
      return { success: false, error: 'Failed to fetch expense' };
    }

    return { success: true, data: expense };
  } catch (error) {
    console.error('Error fetching expense:', error);
    return { success: false, error: 'Failed to fetch expense' };
  }
}

// ============================================
// Expense Line Items
// ============================================

export async function addExpenseLineItem(data: z.infer<typeof addLineItemSchema>) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: 'Unauthorized' };
    }

    const validated = addLineItemSchema.parse(data);
    const supabase = await createClient();

    const { data: lineItem, error } = await supabase
      .from('expense_line_items')
      .insert(validated)
      .select(`
        *,
        material:materials(*),
        material_assignment:material_assignments(*)
      `)
      .single();

    if (error) {
      console.error('Error adding line item:', error);
      return { success: false, error: 'Failed to add line item' };
    }

    revalidatePath(`/app/expenses/${validated.expense_id}`);
    return { success: true, data: lineItem };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.issues[0].message };
    }
    console.error('Error adding line item:', error);
    return { success: false, error: 'Failed to add line item' };
  }
}

export async function deleteExpenseLineItem(lineItemId: string) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: 'Unauthorized' };
    }

    const supabase = await createClient();

    // Get expense_id before deleting
    const { data: lineItem } = await supabase
      .from('expense_line_items')
      .select('expense_id')
      .eq('id', lineItemId)
      .single();

    const { error } = await supabase
      .from('expense_line_items')
      .delete()
      .eq('id', lineItemId);

    if (error) {
      console.error('Error deleting line item:', error);
      return { success: false, error: 'Failed to delete line item' };
    }

    if (lineItem) {
      revalidatePath(`/app/expenses/${lineItem.expense_id}`);
    }

    return { success: true };
  } catch (error) {
    console.error('Error deleting line item:', error);
    return { success: false, error: 'Failed to delete line item' };
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

export async function processReceiptOCR(expenseId: string, receiptImageUrl: string) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: 'Unauthorized' };
    }

    const supabase = await createClient();

    // NOTE: This is a placeholder for the actual OCR implementation
    // In a real implementation, you would:
    // 1. Use Vercel AI SDK with vision model (gpt-4-vision, claude-3-opus, etc.)
    // 2. Send the receipt image to the AI model
    // 3. Extract vendor name, line items, totals, etc.
    // 4. Match line items to existing materials in the catalog
    // 5. Return structured data

    // For now, return a mock result
    const ocrResult: OCRResult = {
      vendor_name: 'Home Depot',
      vendor_address: '123 Main St, Anytown, USA',
      expense_date: new Date().toISOString().split('T')[0],
      total_amount: 0,
      line_items: [],
      confidence_score: 0.85,
    };

    // Update expense with OCR data
    const { error: updateError } = await supabase
      .from('expenses')
      .update({
        receipt_ocr_data: ocrResult as unknown as Database['public']['Tables']['expenses']['Update']['receipt_ocr_data'],
        ocr_confidence_score: ocrResult.confidence_score,
        ocr_processed: true,
        vendor_name: ocrResult.vendor_name,
        vendor_address: ocrResult.vendor_address,
      })
      .eq('id', expenseId);

    if (updateError) {
      console.error('Error updating expense with OCR data:', updateError);
      return { success: false, error: 'Failed to update expense with OCR data' };
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

      await supabase.from('expense_line_items').insert(lineItemsToInsert);
    }

    revalidatePath(`/app/expenses/${expenseId}`);

    return { success: true, data: ocrResult };
  } catch (error) {
    console.error('Error processing receipt OCR:', error);
    return { success: false, error: 'Failed to process receipt OCR' };
  }
}

/**
 * Match expense line items to materials using AI
 * This would use AI to find the best matching material from the catalog
 */
export async function matchLineItemToMaterial(
  lineItemId: string,
  materialId: string,
  materialAssignmentId?: string
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: 'Unauthorized' };
    }

    const supabase = await createClient();

    const { data: lineItem, error } = await supabase
      .from('expense_line_items')
      .update({
        material_id: materialId,
        material_assignment_id: materialAssignmentId || null,
        manually_matched: true,
      })
      .eq('id', lineItemId)
      .select('*')
      .single();

    if (error) {
      console.error('Error matching line item:', error);
      return { success: false, error: 'Failed to match line item' };
    }

    // Get the expense to find project_id for revalidation
    const { data: expense } = await supabase
      .from('expenses')
      .select('id, project_id')
      .eq('id', lineItem.expense_id)
      .single();

    revalidatePath(`/app/expenses/${lineItem.expense_id}`);
    if (expense?.project_id) {
      revalidatePath(`/app/projects/${expense.project_id}`);
    }

    return { success: true, data: lineItem };
  } catch (error) {
    console.error('Error matching line item:', error);
    return { success: false, error: 'Failed to match line item' };
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
    // Debug: Validate taskId
    if (!taskId) {
      console.error('Debug: getTaskExpenses - taskId is required');
      return { success: false, error: 'Task ID is required' };
    }

    // Debug: Check authentication
    const session = await auth();
    if (!session?.user?.id) {
      console.error('Debug: getTaskExpenses - unauthorized');
      return { success: false, error: 'Unauthorized' };
    }

    console.log('Debug: getTaskExpenses - fetching expenses for task:', taskId);

    const supabase = await createClient();

    // Debug: Query expenses for this task
    const { data: expenses, error } = await supabase
      .from('expenses')
      .select('id, description, amount, status, expense_date, vendor_name, category')
      .eq('task_id', taskId)
      .order('expense_date', { ascending: false });

    if (error) {
      console.error('Debug: getTaskExpenses - query error:', error);
      return { success: false, error: 'Failed to fetch task expenses' };
    }

    console.log('Debug: getTaskExpenses - found expenses:', expenses?.length || 0);

    return {
      success: true,
      data: expenses || [],
    };
  } catch (error) {
    console.error('Debug: getTaskExpenses - unexpected error:', error);
    return { success: false, error: 'Failed to fetch task expenses' };
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
  category: 'materials';
}) {
  try {
    // Debug: Check authentication
    const session = await auth();
    if (!session?.user?.id) {
      console.error('Debug: createExpenseFromMaterial - unauthorized');
      return { success: false, error: 'Unauthorized' };
    }

    console.log('Debug: createExpenseFromMaterial - creating expense from material', data);

    const supabase = await createClient();

    // Debug: Get user's company
    const { data: companyUser, error: companyError } = await supabase
      .from('company_users')
      .select('company_id')
      .eq('user_id', session.user.id)
      .eq('status', 'active')
      .single();

    if (companyError || !companyUser) {
      console.error('Debug: createExpenseFromMaterial - company error:', companyError);
      return { success: false, error: 'User not associated with a company' };
    }

    // Debug: Check if material assignment already has linked expense
    const { data: existingLink } = await supabase
      .from('expense_line_items')
      .select('expense_id')
      .eq('material_assignment_id', data.material_assignment_id)
      .single();

    if (existingLink) {
      console.log('Debug: createExpenseFromMaterial - material already has linked expense');
      return { success: true, alreadyLinked: true };
    }

    // Debug: Create expense
    const { data: expense, error: expenseError } = await supabase
      .from('expenses')
      .insert({
        company_id: companyUser.company_id,
        project_id: data.project_id,
        task_id: data.task_id,
        description: data.description,
        amount: data.amount,
        category: data.category,
        expense_date: new Date().toISOString().split('T')[0],
        submitted_by: session.user.id,
        status: 'submitted',
      })
      .select()
      .single();

    if (expenseError) {
      console.error('Debug: createExpenseFromMaterial - expense creation error:', expenseError);
      return { success: false, error: 'Failed to create expense' };
    }

    // Debug: Create expense line item linking to material assignment
    const { error: lineItemError } = await supabase
      .from('expense_line_items')
      .insert({
        expense_id: expense.id,
        material_assignment_id: data.material_assignment_id,
        description: data.description,
        quantity: 1,
        unit_price: data.amount,
      });

    if (lineItemError) {
      console.error('Debug: createExpenseFromMaterial - line item error:', lineItemError);
      return { success: false, error: 'Failed to link expense to material' };
    }

    console.log('Debug: createExpenseFromMaterial - expense created successfully:', expense.id);

    // Debug: Revalidate paths
    revalidatePath('/app/expenses');
    revalidatePath(`/app/tasks/${data.task_id}`);
    revalidatePath(`/app/projects/${data.project_id}`);

    return { success: true, expense };
  } catch (error) {
    console.error('Debug: createExpenseFromMaterial - unexpected error:', error);
    return { success: false, error: 'Failed to create expense from material' };
  }
}

/**
 * Debug: Check if material assignment has linked expense
 * Used to show "Expense Linked" indicator and prevent duplicate expense creation
 */
export async function getMaterialExpenseLink(materialAssignmentId: string) {
  try {
    console.log('Debug: getMaterialExpenseLink - checking for material:', materialAssignmentId);

    const supabase = await createClient();

    const { data, error } = await supabase
      .from('expense_line_items')
      .select('expense_id')
      .eq('material_assignment_id', materialAssignmentId)
      .single();

    if (error && error.code !== 'PGRST116') {
      // PGRST116 is "not found" error, which is expected
      console.error('Debug: getMaterialExpenseLink - query error:', error);
      return { success: false, error: 'Failed to check material expense link' };
    }

    console.log('Debug: getMaterialExpenseLink - linked expense:', data?.expense_id || null);

    return {
      success: true,
      expenseId: data?.expense_id || null,
    };
  } catch (error) {
    console.error('Debug: getMaterialExpenseLink - unexpected error:', error);
    return { success: false, error: 'Failed to check material expense link' };
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
    const session = await auth();
    if (!session?.user?.id) {
      return { error: 'Unauthorized' };
    }

    const supabase = await createClient();

    // Get user's company_id for proper data isolation
    const { data: companyUser, error: companyError } = await supabase
      .from('company_users')
      .select('company_id')
      .eq('user_id', session.user.id)
      .eq('status', 'active')
      .maybeSingle();

    if (companyError || !companyUser) {
      return { data: {
        totalCount: 0,
        totalAmount: 0,
        pendingCount: 0,
        pendingAmount: 0,
        approvedCount: 0,
        approvedAmount: 0,
        rejectedCount: 0,
        rejectedAmount: 0,
        byCategory: [],
      }};
    }

    // Build query with company filter and optional filters
    let query = supabase
      .from('expenses')
      .select('id, amount, status, category')
      .eq('company_id', companyUser.company_id);

    if (filters?.projectId) {
      query = query.eq('project_id', filters.projectId);
    }

    if (filters?.startDate) {
      query = query.gte('expense_date', filters.startDate);
    }

    if (filters?.endDate) {
      query = query.lte('expense_date', filters.endDate);
    }

    const { data: expenses, error } = await query;

    if (error) {
      console.error('Error fetching expenses for analytics:', error);
      return { error: 'Failed to fetch expense analytics' };
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
      if (expense.status === 'submitted' || expense.status === 'under_review') {
        analytics.pendingCount++;
        analytics.pendingAmount += amount;
      } else if (expense.status === 'approved' || expense.status === 'paid') {
        analytics.approvedCount++;
        analytics.approvedAmount += amount;
      } else if (expense.status === 'rejected') {
        analytics.rejectedCount++;
        analytics.rejectedAmount += amount;
      }

      // Category aggregation
      const category = expense.category || 'other';
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
    console.error('Error in getExpenseAnalytics:', error);
    return { error: 'Failed to fetch expense analytics' };
  }
}
