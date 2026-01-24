"use client";

import { useState, useEffect, useCallback } from "react";
import { Receipt } from "lucide-react";
import { Loader2 } from "lucide-react";
import { ExternalLink } from "lucide-react";
import { cn, formatDate } from "@/lib/utils";
import { getTaskExpenses } from "@/app/actions/expenses";
import { useActionWithError } from "@/hooks/useActionWithError";
import { ErrorBanner } from "@/components/shared/ErrorBanner";

type ExpenseStatus =
  | "submitted"
  | "under_review"
  | "approved"
  | "rejected"
  | "paid";
type ExpenseCategory =
  | "permits"
  | "materials"
  | "labor"
  | "equipment"
  | "subcontractor"
  | "utilities"
  | "professional"
  | "other";

interface Expense {
  id: string;
  description: string;
  amount: number;
  status: ExpenseStatus;
  expense_date: string;
  vendor_name: string | null;
  category: ExpenseCategory;
}

export interface ExpensesTabProps {
  taskId: string;
  /** Controls cost visibility */
  hasBudgetVisibility?: boolean;
}

/**
 * ExpensesTab - Display expenses linked to task
 * Shows list of expenses with date, category, amount, status, and receipt link
 * Calculates total expenses
 */
export function ExpensesTab({
  taskId,
  hasBudgetVisibility = true,
}: ExpensesTabProps) {
  // Component state
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const { error, setError, clearError } = useActionWithError();

  // Fetch expenses on mount
  useEffect(() => {
    const fetchExpenses = async () => {
      setLoading(true);
      setError(null);

      const result = await getTaskExpenses(taskId);

      if (result.error) {
        setError(result.error);
        setExpenses([]);
      } else if (result.data) {
        setExpenses(result.data as Expense[]);
      }

      setLoading(false);
    };

    fetchExpenses();
  }, [taskId, setError]);

  // Status badge color helper
  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      submitted: "bg-gray-400 text-white",
      reviewed: "bg-blue-500 text-white",
      approved: "bg-green-500 text-white",
      rejected: "bg-red-500 text-white",
    };
    return colors[status] || "bg-gray-400 text-white";
  };

  // Loading state
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12 gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-construction-blue" />
        <p className="text-sm text-gray-500">Loading expenses...</p>
      </div>
    );
  }

  // Error state
  if (error) {
    return <ErrorBanner error={error} onDismiss={clearError} />;
  }

  // Empty state
  if (expenses.length === 0) {
    return (
      <div className="text-center py-12">
        <Receipt className="h-16 w-16 mx-auto mb-3 text-gray-300 dark:text-gray-600" />
        <p className="text-gray-500 dark:text-gray-400 font-semibold">
          No expenses linked to this task
        </p>
        <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
          Expenses will appear here when added
        </p>
      </div>
    );
  }

  // Calculate total expenses
  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
  const approvedExpenses = expenses
    .filter((e) => e.status === "approved")
    .reduce((sum, e) => sum + e.amount, 0);

  return (
    <div className="space-y-4">
      {/* Expenses List */}
      <div className="space-y-3">
        {expenses.map((expense) => (
          <div
            key={expense.id}
            className="border-2 border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:border-gray-300 dark:hover:border-gray-600 transition-colors"
          >
            {/* Header with category and amount */}
            <div className="flex justify-between items-start mb-2">
              <div className="flex-1">
                <h4 className="font-bold text-sm text-gray-900 dark:text-gray-100">
                  {expense.category}
                </h4>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  {formatDate(expense.expense_date)}
                </p>
              </div>
              <div className="text-right">
                {hasBudgetVisibility ? (
                  <div className="text-xl font-black text-construction-blue">
                    ${expense.amount.toFixed(2)}
                  </div>
                ) : (
                  <div className="text-sm text-gray-400 dark:text-gray-500 italic">
                    Hidden
                  </div>
                )}
              </div>
            </div>

            {/* Notes */}
            {expense.description && (
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2 border-l-2 border-gray-300 dark:border-gray-600 pl-3">
                {expense.description}
              </p>
            )}

            {/* Status and Receipt */}
            <div className="flex items-center justify-between gap-2 mt-3">
              <span
                className={cn(
                  "px-2 py-1 rounded text-xs font-bold uppercase",
                  getStatusColor(expense.status),
                )}
              >
                {expense.status}
              </span>

              {expense.vendor_name && (
                <a
                  href="#"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-blue-600 hover:text-blue-700 font-semibold flex items-center gap-1 hover:underline"
                >
                  <Receipt className="h-3 w-3" />
                  Vendor: {expense.vendor_name}
                  <ExternalLink className="h-3 w-3" />
                </a>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Total Summary (conditionally hidden) */}
      {hasBudgetVisibility && (
        <div className="border-2 border-construction-blue dark:border-construction-blue/40 rounded-lg p-4 bg-construction-blue/5 dark:bg-construction-blue/10">
          <div className="flex justify-between items-center mb-2">
            <span className="font-bold uppercase text-sm text-construction-blue">
              Total Expenses:
            </span>
            <span className="text-2xl font-black text-construction-blue">
              ${totalExpenses.toFixed(2)}
            </span>
          </div>
          {approvedExpenses !== totalExpenses && (
            <div className="flex justify-between items-center text-sm pt-2 border-t border-construction-blue/20">
              <span className="text-gray-600 dark:text-gray-400">
                Approved:
              </span>
              <span className="font-bold text-green-600">
                ${approvedExpenses.toFixed(2)}
              </span>
            </div>
          )}
          <p className="text-xs text-gray-600 dark:text-gray-400 mt-2">
            {expenses.length} expense{expenses.length !== 1 ? "s" : ""} recorded
          </p>
        </div>
      )}
    </div>
  );
}
