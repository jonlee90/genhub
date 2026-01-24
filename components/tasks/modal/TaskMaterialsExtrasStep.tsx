/**
 * TaskMaterialsExtrasStep - Materials, receipts, and expense management
 *
 * Handles:
 * - Materials selection and management
 * - Receipt photo upload
 * - Auto-expense toggle and settings
 * - Expenses section (edit mode)
 */
"use client";

import React from "react";
import { Package } from "lucide-react";
import {
  TaskMaterialsManager,
  type TempMaterial,
} from "../TaskMaterialsManager";
import { TaskReceiptUpload } from "../TaskReceiptUpload";
import { AutoExpenseToggle } from "../AutoExpenseToggle";
import { TaskExpensesSection, type TaskExpense } from "../TaskExpensesSection";
import { isFieldVisible } from "@/lib/config/task-type-fields";
import type { TaskType } from "@/types/db/enums";
import type { AssigneeOption } from "../PrimaryAssigneeSelector";

interface Project {
  id: string;
  name: string;
}

interface TaskMaterialsExtrasStepProps {
  // Mode and task type
  mode: "create" | "edit";
  taskType: TaskType | null;

  // Task context
  taskId?: string;
  taskTitle: string;
  projectId: string;

  // Materials
  tempMaterials: TempMaterial[];
  onTempMaterialsChange: (materials: TempMaterial[]) => void;

  // Receipt
  receiptUrl: string | null;
  onReceiptChange: (file: File | null, preview: string | null) => void;

  // Auto-expense (edit mode with actual cost)
  showAutoExpense?: boolean;
  autoExpenseEnabled: boolean;
  onAutoExpenseToggle: (enabled: boolean) => void;
  actualCost?: number;
  primaryAssigneeName: string | null;
  expenseCategory: string;
  onExpenseCategoryChange: (category: string) => void;

  // Expenses section (edit mode)
  showExpenses?: boolean;
  expenses?: TaskExpense[];
  expensesLoading?: boolean;
  onExpenseAdded?: () => void;
  projects?: Project[];
  tasks?: Array<{ id: string; title: string; project_id: string }>;
  projectName?: string;

  // Disabled state
  disabled?: boolean;
}

/**
 * Materials, receipts, and expenses step
 * Combines materials management, receipt upload, auto-expense settings, and expenses display
 */
export function TaskMaterialsExtrasStep({
  mode,
  taskType,
  taskId,
  taskTitle,
  projectId,
  tempMaterials,
  onTempMaterialsChange,
  receiptUrl,
  onReceiptChange,
  showAutoExpense = false,
  autoExpenseEnabled,
  onAutoExpenseToggle,
  actualCost,
  primaryAssigneeName,
  expenseCategory,
  onExpenseCategoryChange,
  showExpenses = false,
  expenses = [],
  expensesLoading = false,
  onExpenseAdded,
  projects = [],
  tasks = [],
  projectName = "",
  disabled,
}: TaskMaterialsExtrasStepProps) {
  return (
    <div className="space-y-5">
      {/* Materials Section - Conditional rendering with emphasis */}
      {isFieldVisible(taskType, "materialsSection", mode) && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 pb-2 border-b border-gray-200 dark:border-gray-700">
            <Package className="h-4 w-4 text-construction-blue" />
            <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100">
              Materials
            </h3>
            <p className="text-xs ml-auto text-gray-500 dark:text-gray-400">
              {mode === "create"
                ? `${tempMaterials.length} material${tempMaterials.length !== 1 ? "s" : ""} selected`
                : "Search & manage task materials"}
            </p>
          </div>
          <TaskMaterialsManager
            taskId={taskId}
            projectId={projectId}
            mode={mode}
            tempMaterials={tempMaterials}
            onTempMaterialsChange={onTempMaterialsChange}
          />
        </div>
      )}

      {/* Receipt Photo Upload - For all task types */}
      <TaskReceiptUpload
        receiptUrl={receiptUrl}
        onReceiptChange={onReceiptChange}
        disabled={disabled}
        showLabel={true}
        compact={false}
      />

      {/* Auto-Expense Section - Edit mode with actual cost > 0 */}
      {showAutoExpense && actualCost && actualCost > 0 && (
        <AutoExpenseToggle
          enabled={autoExpenseEnabled}
          onToggle={onAutoExpenseToggle}
          actualCost={actualCost}
          taskTitle={taskTitle}
          vendorName={primaryAssigneeName}
          category={expenseCategory}
          onCategoryChange={onExpenseCategoryChange}
          disabled={disabled}
        />
      )}

      {/* Expenses Section - Edit mode only */}
      {showExpenses &&
        isFieldVisible(taskType, "expensesSection", mode) &&
        taskId && (
          <div className="space-y-2">
            {expensesLoading ? (
              <div className="flex items-center justify-center py-4">
                <div className="w-5 h-5 border-2 border-construction-blue border-t-transparent rounded-full animate-spin" />
              </div>
            ) : (
              <TaskExpensesSection
                taskId={taskId}
                taskTitle={taskTitle}
                projectId={projectId}
                projectName={projectName}
                expenses={expenses}
                projects={projects}
                tasks={tasks}
                onExpenseAdded={onExpenseAdded}
              />
            )}
          </div>
        )}
    </div>
  );
}
