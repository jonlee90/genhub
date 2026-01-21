"use client";

import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  Clock,
  ChevronRight,
} from "lucide-react";
import Link from "next/link";
import { cn, formatPercent, formatBudget } from "@/lib/utils";
import {
  WidgetCard,
  WidgetHeader,
  WidgetSkeleton,
} from "@/components/ui/WidgetCard";
import type { BudgetSummaryData } from "@/types/dashboard";

export interface BudgetSummaryWidgetProps {
  budget: BudgetSummaryData;
  isLoading?: boolean;
}

/**
 * Get utilization color based on percentage
 */
function getUtilizationColor(percent: number): {
  bar: string;
  text: string;
  bg: string;
} {
  if (percent <= 80) {
    return {
      bar: "bg-[#059669] dark:bg-green-500",
      text: "text-[#059669] dark:text-green-400",
      bg: "bg-[#059669]/10 dark:bg-green-500/20",
    };
  }
  if (percent <= 100) {
    return {
      bar: "bg-[#F59E0B] dark:bg-yellow-500",
      text: "text-[#F59E0B] dark:text-yellow-400",
      bg: "bg-[#F59E0B]/10 dark:bg-yellow-500/20",
    };
  }
  return {
    bar: "bg-[#DC2626] dark:bg-red-500",
    text: "text-[#DC2626] dark:text-red-400",
    bg: "bg-[#DC2626]/10 dark:bg-red-500/20",
  };
}

function BudgetSummaryWidgetSkeleton() {
  return (
    <WidgetSkeleton>
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-lg" />
        <div className="h-5 w-32 bg-gray-200 dark:bg-gray-700 rounded" />
      </div>
      <div className="mb-4">
        <div className="flex justify-between mb-2">
          <div className="h-4 w-20 bg-gray-200 dark:bg-gray-700 rounded" />
          <div className="h-4 w-12 bg-gray-200 dark:bg-gray-700 rounded" />
        </div>
        <div className="h-3 w-full bg-gray-200 dark:bg-gray-700 rounded-full" />
      </div>
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="space-y-2">
          <div className="h-3 w-16 bg-gray-200 dark:bg-gray-700 rounded" />
          <div className="h-6 w-20 bg-gray-200 dark:bg-gray-700 rounded" />
        </div>
        <div className="space-y-2">
          <div className="h-3 w-16 bg-gray-200 dark:bg-gray-700 rounded" />
          <div className="h-6 w-20 bg-gray-200 dark:bg-gray-700 rounded" />
        </div>
      </div>
      <div className="h-12 w-full bg-gray-100 dark:bg-gray-800 rounded-lg" />
    </WidgetSkeleton>
  );
}

export function BudgetSummaryWidget({
  budget,
  isLoading = false,
}: BudgetSummaryWidgetProps) {
  if (isLoading) {
    return <BudgetSummaryWidgetSkeleton />;
  }

  const utilizationColors = getUtilizationColor(budget.utilizationPercent);
  const isUnderBudget = budget.variance >= 0;
  const cappedUtilization = Math.min(budget.utilizationPercent, 100);

  return (
    <WidgetCard>
      <WidgetHeader
        icon={DollarSign}
        title="Budget"
        className="mb-4"
        iconWrapperClassName="bg-construction-blue dark:bg-blue-600"
        iconClassName="text-white"
      />

      {/* Utilization Progress Bar */}
      <div className="mb-4">
        <div className="flex justify-between items-center mb-2">
          <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
            Utilization
          </span>
          <span className={cn("text-sm font-bold", utilizationColors.text)}>
            {formatPercent(budget.utilizationPercent)}
          </span>
        </div>
        <div className="h-3 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
          <div
            className={cn(
              "h-full rounded-full transition-all duration-500",
              utilizationColors.bar,
            )}
            style={{ width: `${cappedUtilization}%` }}
          />
        </div>
        {budget.utilizationPercent > 100 && (
          <p className="text-xs text-[#DC2626] dark:text-red-400 mt-1 font-semibold">
            Over budget by {formatPercent(budget.utilizationPercent - 100)}
          </p>
        )}
      </div>

      {/* Planned vs Actual */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <p className="text-xs text-gray-500 dark:text-gray-400 font-medium mb-1">Planned</p>
          <p className="text-lg font-bold text-gray-900 dark:text-gray-100">
            {formatBudget(budget.totalPlanned, true)}
          </p>
        </div>
        <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <p className="text-xs text-gray-500 dark:text-gray-400 font-medium mb-1">Actual</p>
          <p className="text-lg font-bold text-gray-900 dark:text-gray-100">
            {formatBudget(budget.totalActual, true)}
          </p>
        </div>
      </div>

      {/* Variance */}
      <div
        className={cn(
          "flex items-center gap-2 mb-4 p-3 rounded-lg",
          isUnderBudget ? "bg-[#059669]/10 dark:bg-green-500/20" : "bg-[#DC2626]/10 dark:bg-red-500/20",
        )}
      >
        {isUnderBudget ? (
          <TrendingDown className="w-4 h-4 text-[#059669] dark:text-green-400" />
        ) : (
          <TrendingUp className="w-4 h-4 text-[#DC2626] dark:text-red-400" />
        )}
        <span
          className={cn(
            "text-sm font-semibold",
            isUnderBudget ? "text-[#059669] dark:text-green-400" : "text-[#DC2626] dark:text-red-400",
          )}
        >
          {isUnderBudget ? "Under budget: " : "Over budget: "}
          {formatBudget(Math.abs(budget.variance), true)}
        </span>
      </div>

      {/* Pending Expenses CTA */}
      {budget.pendingExpenses.count > 0 ? (
        <Link href="/app/expenses?status=pending">
          <div
            className={cn(
              "flex items-center justify-between p-3 rounded-lg",
              "bg-[#F59E0B]/10 dark:bg-yellow-500/20 border border-[#F59E0B]/30 dark:border-yellow-500/30",
              "transition-all duration-150",
              "active:scale-[0.98] active:bg-[#F59E0B]/20 dark:active:bg-yellow-500/30",
            )}
          >
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-[#F59E0B] dark:text-yellow-400" />
              <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                {budget.pendingExpenses.count} pending
              </span>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-sm font-bold text-[#F59E0B] dark:text-yellow-400">
                {formatBudget(budget.pendingExpenses.amount, true)}
              </span>
              <ChevronRight className="w-4 h-4 text-[#F59E0B] dark:text-yellow-400" />
            </div>
          </div>
        </Link>
      ) : (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-[#059669]/10 dark:bg-green-500/20 border border-[#059669]/30 dark:border-green-500/30">
          <Clock className="w-4 h-4 text-[#059669] dark:text-green-400" />
          <span className="text-sm font-semibold text-[#059669] dark:text-green-400">
            No pending expenses
          </span>
        </div>
      )}
    </WidgetCard>
  );
}
