"use client";

import { cn } from "@/lib/utils";
import DollarSign from "lucide-react/icons/dollar-sign";
import ChevronRight from "lucide-react/icons/chevron-right";

interface BudgetSummary {
  totalBudget: number;
  totalSpent: number;
  subPayments: number;
  netRemaining: number;
  hasBudget: boolean;
  percentUsed: number;
}

interface BudgetSummaryCardProps {
  summary: BudgetSummary | null;
  onNavigateToFinancials?: () => void;
}

const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

function getProgressColor(pct: number) {
  if (pct > 100) return "bg-red-500";
  if (pct >= 75) return "bg-yellow-500";
  return "bg-green-500";
}

function getRemainingColor(pct: number) {
  if (pct > 100) return "text-red-600 dark:text-red-400";
  if (pct >= 75) return "text-yellow-600 dark:text-yellow-400";
  return "text-green-600 dark:text-green-400";
}

export function BudgetSummaryCard({
  summary,
  onNavigateToFinancials,
}: BudgetSummaryCardProps) {
  if (!summary || !summary.hasBudget) {
    return (
      <button
        onClick={onNavigateToFinancials}
        className={cn(
          "w-full text-left p-4 rounded-xl border-2 border-dashed border-gray-200 dark:border-gray-700",
          "hover:border-construction-blue hover:bg-construction-blue/5 dark:hover:border-blue-500",
          "transition-all active:scale-[0.97] min-h-[44px]",
        )}
      >
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gray-100 dark:bg-gray-800 rounded-lg">
              <DollarSign className="h-5 w-5 text-gray-400 dark:text-gray-500" />
            </div>
            <div>
              <p className="font-bold text-sm text-gray-900 dark:text-gray-100">
                No Budget Set
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Tap to set up a project budget
              </p>
            </div>
          </div>
          <ChevronRight className="h-4 w-4 text-gray-400 shrink-0" />
        </div>
      </button>
    );
  }

  const totalUsed = summary.totalSpent;
  const pct = summary.percentUsed;

  return (
    <button
      onClick={onNavigateToFinancials}
      className={cn(
        "w-full text-left p-4 rounded-xl border-2 border-gray-200 dark:border-gray-700",
        "bg-white dark:bg-gray-800 shadow-sm",
        "hover:border-construction-blue/40 hover:shadow-md",
        "transition-all active:scale-[0.97]",
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-construction-blue/10 dark:bg-blue-900/30 rounded-lg">
            <DollarSign className="h-4 w-4 text-construction-blue dark:text-blue-400" />
          </div>
          <span className="font-bold text-sm text-gray-900 dark:text-gray-100">
            Budget
          </span>
        </div>
        <ChevronRight className="h-4 w-4 text-gray-400 shrink-0" />
      </div>

      {/* Metrics grid */}
      <div className="grid grid-cols-3 gap-2 mb-3">
        <div>
          <div className="text-xs text-gray-500 dark:text-gray-400 font-medium">
            Budget
          </div>
          <div className="font-bold text-sm text-gray-800 dark:text-gray-200">
            {currencyFormatter.format(summary.totalBudget)}
          </div>
        </div>
        <div>
          <div className="text-xs text-gray-500 dark:text-gray-400 font-medium">
            Spent
          </div>
          <div className="font-bold text-sm text-gray-800 dark:text-gray-200">
            {currencyFormatter.format(totalUsed)}
          </div>
        </div>
        <div>
          <div className="text-xs text-gray-500 dark:text-gray-400 font-medium">
            Remaining
          </div>
          <div className={cn("font-bold text-sm", getRemainingColor(pct))}>
            {currencyFormatter.format(summary.netRemaining)}
          </div>
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
        <div
          className={cn(
            "h-full rounded-full transition-all",
            getProgressColor(pct),
          )}
          style={{ width: `${Math.min(pct, 100)}%` }}
        />
      </div>
      <div className="mt-1 text-xs text-gray-500 dark:text-gray-400 text-right">
        {Math.round(pct)}% used
      </div>
    </button>
  );
}
