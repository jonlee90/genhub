/**
 * Expense Types - Shared type definitions for expense components
 *
 * These types extend the database types with joined relations
 * commonly used in UI components.
 */

import type { ExpensesRow } from './tables/expenses';
import type {
  ExpenseStatus as DbExpenseStatus,
  ExpenseCategory as DbExpenseCategory,
} from './enums';

// Base types from database
export type ExpenseStatus = DbExpenseStatus;
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
  status: ExpenseStatus;
  created_at: string;
  project: {
    id: string;
    name: string;
  } | null;
  task?: {
    id: string;
    title: string;
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
  taskContext?: ExpenseTaskContext;
  companyId?: string;
}

/**
 * Props for ExpenseDetailModal component
 */
export interface ExpenseDetailModalProps {
  expense: ExpenseWithRelations;
  onClose: () => void;
}

/**
 * Status configuration for expense badges
 */
export const EXPENSE_STATUS_CONFIG: Record<
  ExpenseStatus,
  { label: string; color: string }
> = {
  submitted: {
    label: 'Submitted',
    color: 'bg-gray-100 text-gray-700 border-gray-300',
  },
  under_review: {
    label: 'Under Review',
    color: 'bg-construction-blue/10 text-construction-blue border-construction-blue',
  },
  approved: {
    label: 'Approved',
    color: 'bg-construction-green/10 text-construction-green border-construction-green/30',
  },
  rejected: {
    label: 'Rejected',
    color: 'bg-construction-red/10 text-construction-red border-construction-red/30',
  },
  paid: {
    label: 'Paid',
    color: 'bg-construction-green/10 text-construction-green border-construction-green/30',
  },
};
