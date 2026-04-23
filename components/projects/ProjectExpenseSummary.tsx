"use client";

import { useMemo } from "react";
// Performance optimization: Direct imports instead of barrel file (saves 200-800ms per page)
import DollarSign from "lucide-react/icons/dollar-sign";
import AlertCircle from "lucide-react/icons/alert-circle";
import Tag from "lucide-react/icons/tag";
import type { ExpenseStats } from "@/app/actions/projects";
import { formatPercent } from "@/lib/utils";
import { cn } from "@/lib/utils";

interface ProjectExpenseSummaryProps {
  expenseStats: ExpenseStats;
  budget: number;
  className?: string;
}

const CATEGORY_LABELS: Record<string, string> = {
  materials: "Materials",
  labor: "Labor",
  subcontractor: "Subcontractor",
  equipment: "Equipment",
  permits: "Permits",
  transportation: "Transportation",
  meals: "Meals",
  lodging: "Lodging",
  other: "Other",
};

/**
 * ProjectExpenseSummary — budget vs. actual + top expense categories.
 * Approval workflow removed; card now surfaces real spend against budget
 * and the top three categories driving cost.
 */
export function ProjectExpenseSummary({
  expenseStats,
  budget,
  className = "",
}: ProjectExpenseSummaryProps) {
  const budgetUtilization = useMemo(
    () => (budget > 0 ? (expenseStats.totalAmount / budget) * 100 : 0),
    [budget, expenseStats.totalAmount],
  );

  const isOverBudget = budgetUtilization > 100;
  const isNearBudget = budgetUtilization > 80 && budgetUtilization <= 100;

  const budgetVariance = useMemo(
    () => budget - expenseStats.totalAmount,
    [budget, expenseStats.totalAmount],
  );

  const topCategories = useMemo(
    () => (expenseStats.categoryBreakdown ?? []).slice(0, 3),
    [expenseStats.categoryBreakdown],
  );

  const maxCategoryAmount = useMemo(
    () => topCategories.reduce((max, cat) => Math.max(max, cat.totalAmount), 0),
    [topCategories],
  );

  // Empty state
  if (expenseStats.total === 0) {
    return (
      <div
        className={cn(
          "bg-white dark:bg-gray-900 rounded-xl overflow-hidden",
          "border-2 border-gray-200 dark:border-gray-700 shadow-sm",
          className,
        )}
      >
        <div className="px-4 py-3.5 border-b border-gray-100 dark:border-gray-700 bg-gradient-to-r from-gray-50/80 to-white dark:from-gray-800/80 dark:to-gray-900">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-construction-blue flex items-center justify-center shadow-sm">
              <DollarSign className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-construction-blue text-sm uppercase tracking-wide">
                Expense Summary
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                No expenses yet
              </p>
            </div>
          </div>
        </div>

        <div className="p-6 flex flex-col items-center justify-center min-h-[200px]">
          <div className="w-16 h-16 rounded-2xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-4">
            <DollarSign className="w-8 h-8 text-gray-300 dark:text-gray-600" />
          </div>
          <p className="text-base font-semibold text-gray-700 dark:text-gray-100 mb-1.5">
            No expenses recorded yet
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400 text-center max-w-[240px]">
            Add your first expense to start tracking project costs and budget
          </p>
        </div>
      </div>
    );
  }

  const getBudgetColor = () => {
    if (isOverBudget) return "bg-[#DC2626]";
    if (isNearBudget) return "bg-[#F59E0B]";
    return "bg-construction-blue";
  };

  return (
    <div
      className={cn(
        "bg-white dark:bg-gray-900 rounded-xl overflow-hidden",
        "border-2 border-gray-200 dark:border-gray-700 shadow-sm",
        "transition-all duration-200",
        className,
      )}
    >
      {/* Header */}
      <div className="px-4 py-3.5 border-b border-gray-100 dark:border-gray-700 bg-gradient-to-r from-gray-50/80 to-white dark:from-gray-800/80 dark:to-gray-900">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-construction-blue flex items-center justify-center shadow-sm">
            <DollarSign className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-construction-blue text-sm uppercase tracking-wide">
              Expense Summary
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 tabular-nums">
              {expenseStats.total} expense{expenseStats.total !== 1 ? "s" : ""}{" "}
              · ${formatCompactNumber(expenseStats.totalAmount)}
            </p>
          </div>
          <div
            className={cn(
              "px-2.5 py-1 rounded-lg text-xs font-bold",
              isOverBudget
                ? "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300"
                : isNearBudget
                  ? "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300"
                  : "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
            )}
          >
            {isOverBudget
              ? "Over Budget"
              : isNearBudget
                ? "Near Limit"
                : "On Track"}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-4">
        {/* Budget Used Progress Bar */}
        <div className="mb-5">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-gray-500 dark:text-gray-400" />
              <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Budget Used
              </span>
            </div>
            <span
              className={cn(
                "text-sm font-bold tabular-nums",
                isOverBudget
                  ? "text-[#DC2626]"
                  : isNearBudget
                    ? "text-[#F59E0B]"
                    : "text-construction-blue",
              )}
            >
              {formatPercent(budgetUtilization)}
            </span>
          </div>
          <div className="h-2.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
            <div
              className={cn(
                "h-full rounded-full transition-all duration-500 ease-out",
                getBudgetColor(),
              )}
              style={{ width: `${Math.min(100, budgetUtilization)}%` }}
            />
          </div>
        </div>

        {/* 3-Tile Stats Grid */}
        <div className="grid grid-cols-3 gap-2.5 mb-4">
          {/* Budget */}
          <div className="flex flex-col p-3 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 min-h-[76px]">
            <span className="text-[10px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">
              Budget
            </span>
            <span className="text-base font-bold text-construction-blue dark:text-blue-400 leading-tight tabular-nums">
              ${formatCompactNumber(budget)}
            </span>
            <span className="text-[10px] text-gray-500 dark:text-gray-400 mt-0.5">
              Planned
            </span>
          </div>

          {/* Spent */}
          <div className="flex flex-col p-3 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 min-h-[76px]">
            <span className="text-[10px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">
              Spent
            </span>
            <span className="text-base font-bold text-gray-900 dark:text-gray-100 leading-tight tabular-nums">
              ${formatCompactNumber(expenseStats.totalAmount)}
            </span>
            <span className="text-[10px] text-gray-500 dark:text-gray-400 mt-0.5">
              Actual
            </span>
          </div>

          {/* Variance */}
          <div className="flex flex-col p-3 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 min-h-[76px]">
            <div className="flex items-center gap-1 mb-1">
              <span
                className={cn(
                  "w-2 h-2 rounded-full flex-shrink-0",
                  budgetVariance >= 0 ? "bg-[#059669]" : "bg-[#DC2626]",
                )}
              />
              <span className="text-[10px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Variance
              </span>
            </div>
            <span className="text-base font-bold text-construction-blue dark:text-blue-400 leading-tight tabular-nums">
              {budgetVariance >= 0 ? "+" : "-"}$
              {formatCompactNumber(Math.abs(budgetVariance))}
            </span>
            <span className="text-[10px] text-gray-500 dark:text-gray-400 mt-0.5">
              {budgetVariance >= 0 ? "Under" : "Over"}
            </span>
          </div>
        </div>

        {/* Top Categories */}
        {topCategories.length > 0 && (
          <div className="mb-4">
            <div className="flex items-center gap-2 mb-2.5">
              <Tag className="w-4 h-4 text-gray-500 dark:text-gray-400" />
              <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Top Categories
              </span>
            </div>
            <div className="space-y-2">
              {topCategories.map((cat) => {
                const pct =
                  maxCategoryAmount > 0
                    ? (cat.totalAmount / maxCategoryAmount) * 100
                    : 0;
                const label = CATEGORY_LABELS[cat.category] ?? cat.category;
                return (
                  <div key={cat.category}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-medium text-gray-700 dark:text-gray-200">
                        {label}
                        <span className="text-gray-400 dark:text-gray-500 ml-1.5 tabular-nums">
                          ({cat.count})
                        </span>
                      </span>
                      <span className="text-xs font-bold text-construction-blue dark:text-blue-400 tabular-nums">
                        ${formatCompactNumber(cat.totalAmount)}
                      </span>
                    </div>
                    <div className="h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full bg-construction-blue dark:bg-blue-400 transition-all duration-500 ease-out"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Budget Warning Banner */}
        {(isOverBudget || isNearBudget) && (
          <div
            className={cn(
              "flex items-center gap-3 p-3 rounded-xl",
              "transition-all duration-200",
              isOverBudget
                ? "bg-red-50 border border-red-200 dark:bg-red-900/20 dark:border-red-800"
                : "bg-amber-50 border border-amber-200 dark:bg-amber-900/20 dark:border-amber-800",
            )}
          >
            <div
              className={cn(
                "w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0",
                isOverBudget
                  ? "bg-red-100 dark:bg-red-900/40"
                  : "bg-amber-100 dark:bg-amber-900/40",
              )}
            >
              <AlertCircle
                className={cn(
                  "w-4 h-4",
                  isOverBudget
                    ? "text-red-600 dark:text-red-300"
                    : "text-amber-600 dark:text-amber-300",
                )}
              />
            </div>
            <div className="flex-1 min-w-0">
              <p
                className={cn(
                  "text-sm font-semibold",
                  isOverBudget
                    ? "text-red-800 dark:text-red-200"
                    : "text-amber-800 dark:text-amber-200",
                )}
              >
                {isOverBudget
                  ? `Over budget by $${Math.abs(budgetVariance).toLocaleString()}`
                  : "Approaching budget limit"}
              </p>
              <p
                className={cn(
                  "text-xs mt-0.5",
                  isOverBudget
                    ? "text-red-600 dark:text-red-300"
                    : "text-amber-600 dark:text-amber-300",
                )}
              >
                {isOverBudget
                  ? "Review expenses to get back on track"
                  : `${formatPercent(budgetUtilization)} of budget used`}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Format large numbers in compact form (1K, 1.2M, etc.)
 */
function formatCompactNumber(num: number): string {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1).replace(/\.0$/, "") + "M";
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1).replace(/\.0$/, "") + "K";
  }
  return num.toLocaleString();
}
