/**
 * Expense Types - Shared type definitions for expense components
 *
 * These types extend the database types with joined relations
 * commonly used in UI components.
 */

import type { ExpensesRow } from "./tables/expenses";
import type { ExpenseCategory as DbExpenseCategory } from "./enums";

// Base types from database
export type ExpenseCategory = DbExpenseCategory;
export type ExpenseRow = ExpensesRow;

/**
 * Expense with related project, task, and submitter data
 * Used in ExpensesList, ExpenseCard, ExpenseDetailModal
 */
export interface ExpenseWithRelations {
  id: string;
  description: string;
  amount: number;
  category: string;
  expense_date: string;
  vendor_name: string | null;
  receipt_url: string | null;
  payment_method?: string | null;
  store_account?: string | null;
  subcontractor_id?: string | null;
  created_at: string;
  project: {
    id: string;
    name: string;
  } | null;
  task?: {
    id: string;
    title: string;
  } | null;
  subcontractor?: {
    id: string;
    company_name: string;
  } | null;
  submitter?: {
    id: string;
    name: string;
    email: string;
  } | null;
}

/**
 * Project selection option for expense forms
 */
export interface ExpenseProject {
  id: string;
  name: string;
  status?: "active" | "on_hold" | "completed";
  end_date?: string | null;
}

/**
 * Task selection option for expense forms
 */
export interface ExpenseTask {
  id: string;
  title: string;
  project_id: string;
  task_type?: string | null;
}

/**
 * Task context for pre-filling expense form when opened from a task
 */
export interface ExpenseTaskContext {
  taskId: string;
  taskTitle: string;
  projectId: string;
  projectName?: string;
}

/**
 * Props for ExpensesList component
 */
export interface ExpensesListProps {
  initialExpenses: ExpenseWithRelations[];
  projects: ExpenseProject[];
  tasks: ExpenseTask[];
  searchParams: { [key: string]: string | string[] | undefined };
  companyId?: string;
  userRole?: string | null;
  currentUserId?: string;
}

/**
 * Props for ExpenseCard component
 */
export interface ExpenseCardProps {
  expense: ExpenseWithRelations;
}

/**
 * Props for CreateExpenseModal component
 */
export interface CreateExpenseModalProps {
  projects: ExpenseProject[];
  tasks: ExpenseTask[];
  onClose: () => void;
  onSuccess?: () => void;
  taskContext?: ExpenseTaskContext;
  companyId?: string;
  defaultProjectId?: string;
  expense?: ExpenseWithRelations;
  currentUserId?: string;
}

/**
 * Props for ExpenseDetailModal component
 */
export interface ExpenseDetailModalProps {
  expense: ExpenseWithRelations;
  onClose: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  userRole?: string | null;
  currentUserId?: string;
}
