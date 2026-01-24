"use client";

import { Switch } from "@/components/ui/switch";
import { Receipt } from "lucide-react";
import { DollarSign } from "lucide-react";
import { Tag } from "lucide-react";
import { Building2 } from "lucide-react";
import { Calendar } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDate, formatBudgetFull } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useState } from "react";

/**
 * Props for AutoExpenseToggle component
 */
export interface AutoExpenseToggleProps {
  /** Whether auto-expense creation is enabled */
  enabled: boolean;
  /** Callback when toggle state changes */
  onToggle: (enabled: boolean) => void;
  /** The actual cost amount that will become the expense */
  actualCost: number;
  /** Task title that will become the expense description */
  taskTitle: string;
  /** Vendor name for the expense (typically primary assignee) */
  vendorName: string | null;
  /** Expense category derived from task type */
  category: string;
  /** Callback when category changes */
  onCategoryChange: (category: string) => void;
  /** Whether the toggle is disabled */
  disabled?: boolean;
}

/**
 * AutoExpenseToggle - Toggle switch with expense preview
 *
 * Displays a mobile-friendly toggle for auto-expense creation from task costs.
 * When enabled, shows a preview card of the expense that will be created.
 *
 * Features:
 * - 44px minimum touch target height
 * - Real-time preview updates as source fields change
 * - Success styling when enabled
 * - Mobile PWA compliant
 */
export function AutoExpenseToggle({
  enabled,
  onToggle,
  actualCost,
  taskTitle,
  vendorName,
  category,
  onCategoryChange,
  disabled = false,
}: AutoExpenseToggleProps) {
  // Format the expense date (today)
  const expenseDate = formatDate(new Date());
  const [selectedCategory, setSelectedCategory] = useState(category);

  return (
    <div className="space-y-3">
      {/* Toggle Row - 44px minimum height for touch target */}
      <div
        className={cn(
          "w-full flex items-center justify-between gap-3",
          "min-h-[44px] px-4 py-3",
          "rounded-xl border-2 transition-all duration-200",
          enabled
            ? "bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800"
            : "bg-gray-50 dark:bg-gray-950 border-gray-200 dark:border-gray-700",
          disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer",
        )}
      >
        <div
          className="flex items-center gap-3 flex-1"
          onClick={() => !disabled && onToggle(!enabled)}
        >
          <div
            className={cn(
              "flex items-center justify-center w-9 h-9 rounded-lg",
              enabled
                ? "bg-green-100 dark:bg-green-900/50"
                : "bg-gray-100 dark:bg-gray-800",
            )}
          >
            <Receipt
              className={cn(
                "w-5 h-5",
                enabled ? "text-green-600" : "text-gray-500 dark:text-gray-400",
              )}
            />
          </div>
          <div className="text-left">
            <div className="font-semibold text-gray-900 dark:text-gray-100 text-sm">
              Create expense from cost
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">
              Auto-create an expense record when saving
            </div>
          </div>
        </div>
        <Switch
          checked={enabled}
          onCheckedChange={onToggle}
          disabled={disabled}
        />
      </div>

      {/* Expense Preview Card - Only shown when enabled */}
      {enabled && (
        <div
          className={cn(
            "rounded-xl border-2 border-green-200 dark:border-green-800 bg-green-50/50 dark:bg-green-950/30",
            "border-l-4 border-l-green-500",
            "p-4 space-y-3",
            "animate-in slide-in-from-top-2 duration-200",
          )}
        >
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs font-semibold text-green-700 dark:text-green-400 uppercase tracking-wider">
              Expense Preview
            </span>
          </div>

          {/* Preview Fields */}
          <div className="space-y-2.5">
            {/* Amount */}
            <PreviewField
              icon={DollarSign}
              label="Amount"
              value={formatBudgetFull(actualCost)}
              valueClassName="text-green-700 dark:text-green-400 font-bold"
            />

            {/* Description */}
            <PreviewField
              icon={Receipt}
              label="Description"
              value={taskTitle || "Untitled task"}
            />

            {/* Category - Editable Dropdown */}
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-7 h-7 rounded-md bg-white/80 dark:bg-gray-900/80">
                <Tag className="w-4 h-4 text-green-600" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
                  Category
                </div>
                <Select
                  value={selectedCategory}
                  onValueChange={(value) => {
                    setSelectedCategory(value);
                    onCategoryChange(value);
                  }}
                  disabled={disabled}
                >
                  <SelectTrigger className="h-8 w-full border-0 bg-transparent p-0 text-sm font-medium text-gray-900 dark:text-gray-100 hover:bg-white/50 dark:hover:bg-gray-800/50 focus:ring-1 focus:ring-green-300">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="materials">Materials</SelectItem>
                    <SelectItem value="labor">Labor</SelectItem>
                    <SelectItem value="equipment">Equipment</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Vendor */}
            <PreviewField
              icon={Building2}
              label="Vendor"
              value={vendorName || "Not specified"}
              valueClassName={
                !vendorName
                  ? "text-gray-400 dark:text-gray-500 italic"
                  : undefined
              }
            />

            {/* Date */}
            <PreviewField icon={Calendar} label="Date" value={expenseDate} />
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Preview Field - Compact field display for expense preview
 */
interface PreviewFieldProps {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  valueClassName?: string;
}

function PreviewField({
  icon: Icon,
  label,
  value,
  valueClassName,
}: PreviewFieldProps) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center justify-center w-7 h-7 rounded-md bg-white/80 dark:bg-gray-900/80">
        <Icon className="w-4 h-4 text-green-600" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
          {label}
        </div>
        <div
          className={cn(
            "text-sm font-medium text-gray-900 dark:text-gray-100 truncate",
            valueClassName,
          )}
        >
          {value}
        </div>
      </div>
    </div>
  );
}

/**
 * Format category for display
 * Capitalizes first letter and replaces underscores with spaces
 */
function formatCategory(category: string): string {
  if (!category) return "Other";
  return category
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}
