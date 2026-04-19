"use client";

import { useState, useEffect } from "react";
import Receipt from "lucide-react/icons/receipt";
import Loader2 from "lucide-react/icons/loader-2";
import ExternalLink from "lucide-react/icons/external-link";
import { formatDate } from "@/lib/utils";
import { getTaskExpenses } from "@/app/actions/expenses";
import { useActionWithError } from "@/hooks/useActionWithError";
import { ErrorBanner } from "@/components/shared/ErrorBanner";

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
 * Shows list of expenses with date, category, amount, and receipt link
 * Calculates total expenses
 */
export function ExpensesTab({
  taskId,
  hasBudgetVisibility = true,
}: ExpensesTabProps) {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const { error, setError, clearError } = useActionWithError();

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

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12 gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-construction-blue" />
        <p className="text-sm text-gray-500">Loading expenses...</p>
      </div>
    );
  }

  if (error) {
    return <ErrorBanner error={error} onDismiss={clearError} />;
  }

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

  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);

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
            {expense.description ? (
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2 border-l-2 border-gray-300 dark:border-gray-600 pl-3">
                {expense.description}
              </p>
            ) : null}

            {/* Vendor */}
            {expense.vendor_name ? (
              <div className="flex items-center justify-end gap-2 mt-3">
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
              </div>
            ) : null}
          </div>
        ))}
      </div>

      {/* Total Summary (conditionally hidden) */}
      {hasBudgetVisibility ? (
        <div className="border-2 border-construction-blue dark:border-construction-blue/40 rounded-lg p-4 bg-construction-blue/5 dark:bg-construction-blue/10">
          <div className="flex justify-between items-center">
            <span className="font-bold uppercase text-sm text-construction-blue">
              Total Expenses:
            </span>
            <span className="text-2xl font-black text-construction-blue">
              ${totalExpenses.toFixed(2)}
            </span>
          </div>
          <p className="text-xs text-gray-600 dark:text-gray-400 mt-2">
            {expenses.length} expense{expenses.length !== 1 ? "s" : ""} recorded
          </p>
        </div>
      ) : null}
    </div>
  );
}
