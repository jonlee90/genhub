"use client";

import { useState } from "react";
import { m as motion } from "framer-motion";
import Receipt from "lucide-react/icons/receipt";
import Plus from "lucide-react/icons/plus";
import Clock from "lucide-react/icons/clock";
import CheckCircle2 from "lucide-react/icons/check-circle-2";
import XCircle from "lucide-react/icons/x-circle";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { CreateExpenseModal } from "@/components/expenses/CreateExpenseModal";

// Task expense interface
export interface TaskExpense {
  id: string;
  description: string;
  amount: number;
  status: "submitted" | "under_review" | "approved" | "rejected" | "paid";
  expense_date: string;
  vendor_name: string | null;
  category: string;
}

// Props for TaskExpensesSection
interface TaskExpensesSectionProps {
  taskId: string;
  taskTitle: string;
  projectId: string;
  projectName: string;
  expenses: TaskExpense[];
  onExpenseAdded?: () => void;
  projects: Array<{ id: string; name: string }>;
  tasks: Array<{
    id: string;
    title: string;
    project_id: string;
    task_type?: string | null;
  }>;
}

// Status configuration for expense badges
const STATUS_CONFIG = {
  submitted: {
    icon: Clock,
    color: "text-gray-600 dark:text-gray-400",
    bg: "bg-gray-100 dark:bg-gray-800",
    label: "Submitted",
  },
  under_review: {
    icon: Clock,
    color: "text-construction-blue",
    bg: "bg-construction-blue/10",
    label: "Under Review",
  },
  approved: {
    icon: CheckCircle2,
    color: "text-construction-green",
    bg: "bg-construction-green/10",
    label: "Approved",
  },
  rejected: {
    icon: XCircle,
    color: "text-construction-red",
    bg: "bg-construction-red/10",
    label: "Rejected",
  },
  paid: {
    icon: CheckCircle2,
    color: "text-construction-green",
    bg: "bg-construction-green/10",
    label: "Paid",
  },
};

// Format currency helper
const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);
};

// TaskExpensesSection component
export function TaskExpensesSection({
  taskId,
  taskTitle,
  projectId,
  projectName,
  expenses,
  onExpenseAdded,
  projects,
  tasks,
}: TaskExpensesSectionProps) {
  // State for create expense modal
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Calculate expense totals
  const totalAmount = expenses.reduce((sum, e) => sum + e.amount, 0);
  const approvedAmount = expenses
    .filter((e) => e.status === "approved" || e.status === "paid")
    .reduce((sum, e) => sum + e.amount, 0);

  // Handle expense created callback
  const handleExpenseCreated = async () => {
    setShowCreateModal(false);
    // Refresh expense list in TaskModal
    if (onExpenseAdded) {
      await onExpenseAdded();
    }
  };

  return (
    <div className="space-y-3">
      {/* Header with totals and add button */}
      <div className="flex items-center justify-between pb-2 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-2">
          <Receipt className="h-4 w-4 text-construction-blue" />
          <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100">
            Expenses <span className="text-gray-400 dark:text-gray-500 font-normal">(Optional)</span>
            {expenses.length > 0 && (
              <Badge variant="secondary" className="ml-2 text-xs">
                {expenses.length}
              </Badge>
            )}
          </h3>
        </div>

        <Button
          type="button"
          size="sm"
          onClick={() => {
            setShowCreateModal(true);
          }}
          className="bg-construction-blue hover:bg-construction-blue/90 text-white font-bold"
        >
          <Plus className="h-4 w-4 mr-1" />
          Add Expense
        </Button>
      </div>

      {/* Summary row with totals */}
      {expenses.length > 0 && (
        <div className="flex items-center gap-4 p-2 bg-gray-50 dark:bg-gray-900 rounded-lg text-sm">
          <div>
            <span className="text-gray-500 dark:text-gray-400">Total:</span>{" "}
            <span className="font-bold text-gray-900 dark:text-gray-100">
              {formatCurrency(totalAmount)}
            </span>
          </div>
          <div>
            <span className="text-gray-500 dark:text-gray-400">Approved:</span>{" "}
            <span className="font-bold text-construction-green">
              {formatCurrency(approvedAmount)}
            </span>
          </div>
        </div>
      )}

      {/* Expense list */}
      {expenses.length > 0 ? (
        <div className="space-y-2 max-h-48 overflow-y-auto">
          {expenses.map((expense, index) => {
            const status = STATUS_CONFIG[expense.status];
            const StatusIcon = status.icon;

            return (
              <motion.div
                key={expense.id}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="flex items-center justify-between p-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg hover:border-construction-blue/30 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                    {expense.description}
                  </p>
                  <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                    <span>{expense.vendor_name || "No vendor"}</span>
                    <span>-</span>
                    <span>
                      {new Date(expense.expense_date).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3 ml-3">
                  <span className="text-sm font-bold text-gray-900 dark:text-gray-100">
                    {formatCurrency(expense.amount)}
                  </span>
                  <div className={cn("p-1 rounded", status.bg)}>
                    <StatusIcon className={cn("h-4 w-4", status.color)} />
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      ) : (
        // Empty state
        <div className="text-center py-6 bg-gray-50 dark:bg-gray-900 rounded-lg border-2 border-dashed border-gray-200 dark:border-gray-700">
          <Receipt className="h-8 w-8 text-gray-400 dark:text-gray-500 mx-auto mb-2" />
          <p className="text-sm text-gray-500 dark:text-gray-400">
            No expenses yet
          </p>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
            Add expenses to track actual costs
          </p>
        </div>
      )}

      {/* Create Expense Modal with task context */}
      {showCreateModal && (
        <CreateExpenseModal
          projects={projects}
          tasks={tasks}
          onClose={handleExpenseCreated}
          taskContext={{
            taskId,
            taskTitle,
            projectId,
            projectName,
          }}
        />
      )}
    </div>
  );
}
