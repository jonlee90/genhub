"use client";

import { useMemo } from "react";
import {
  Receipt,
  DollarSign,
  Tag,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

interface ExpenseSummaryProps {
  analytics: {
    totalCount: number;
    totalAmount: number;
    byCategory: { category: string; amount: number; count: number }[];
  } | null;
  isLoading?: boolean;
}

/**
 * ExpenseSummary Component - Mobile PWA Optimized
 *
 * A premium, mobile-first expense analytics card designed for construction
 * field workers. Follows the ProjectTaskSummary pattern with:
 * - Header with icon and total spend
 * - Top categories breakdown
 *
 * Design Principles:
 * - Mobile-first with 44px+ touch targets
 * - High contrast for outdoor/bright sun visibility
 * - Clear visual hierarchy with scannable stats
 * - Native app feel with smooth transitions
 * - Construction-themed with GenHub design system
 *
 * @component
 */
const currencyFormatter = new Intl.NumberFormat("en-US", {
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

const formatCurrency = (amount: number): string => {
  if (amount >= 1000000) {
    return `$${(amount / 1000000).toFixed(1)}M`;
  }
  if (amount >= 1000) {
    return `$${(amount / 1000).toFixed(1)}K`;
  }
  return `$${currencyFormatter.format(amount)}`;
};

const formatCategory = (category: string): string => {
  return (
    category.charAt(0).toUpperCase() + category.slice(1).replace(/_/g, " ")
  );
};

export function ExpenseSummary({
  analytics,
  isLoading = false,
}: ExpenseSummaryProps) {
  // ALL HOOKS MUST BE CALLED BEFORE ANY EARLY RETURNS
  const topCategories = useMemo(
    () => analytics?.byCategory.slice(0, 3) || [],
    [analytics],
  );

  // NOW EARLY RETURNS CAN HAPPEN
  if (isLoading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl overflow-hidden border-2 border-gray-200 dark:border-gray-700 shadow-sm">
        <div className="px-4 py-3.5 border-b border-gray-100 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <Skeleton className="w-10 h-10 rounded-xl" />
            <div className="flex-1">
              <Skeleton className="h-4 w-32 mb-1" />
              <Skeleton className="h-3 w-24" />
            </div>
          </div>
        </div>
        <div className="p-4 space-y-4">
          <Skeleton className="h-14 w-full rounded-lg" />
          <Skeleton className="h-24 w-full rounded-lg" />
        </div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl overflow-hidden border-2 border-gray-200 dark:border-gray-700 shadow-sm p-6 text-center">
        <div className="w-12 h-12 rounded-xl bg-gray-100 dark:bg-gray-700 flex items-center justify-center mx-auto mb-3">
          <Receipt className="w-6 h-6 text-gray-400 dark:text-gray-500" />
        </div>
        <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
          Unable to load expense summary
        </p>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "bg-white dark:bg-gray-800 rounded-xl overflow-hidden",
        "border-2 border-gray-200 dark:border-gray-700 shadow-sm",
        "transition-all duration-200",
      )}
    >
      {/* Header */}
      <div className="px-4 py-3.5 border-b border-gray-100 dark:border-gray-700 bg-gradient-to-r from-gray-50/80 to-white dark:from-gray-900/80 dark:to-gray-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-construction-blue dark:bg-blue-600 flex items-center justify-center shadow-sm">
            <Receipt className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-construction-blue dark:text-gray-100 text-sm uppercase tracking-wide">
              Expense Summary
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              {analytics.totalCount} expense
              {analytics.totalCount !== 1 ? "s" : ""} recorded
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-4">
        {/* Total Spend */}
        <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-700 mb-5">
          <div className="flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-construction-blue dark:text-blue-400" />
            <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
              Total Spend
            </span>
          </div>
          <span className="text-xl font-black text-construction-blue dark:text-gray-100">
            {formatCurrency(analytics.totalAmount)}
          </span>
        </div>

        {/* Top Categories */}
        {topCategories.length > 0 ? (
          <div className="pt-4 border-t border-gray-100 dark:border-gray-700">
            <div className="flex items-center gap-2 mb-3">
              <Tag className="w-4 h-4 text-gray-500 dark:text-gray-400" />
              <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Top Categories
              </span>
            </div>
            <div className="space-y-2">
              {topCategories.map((cat, index) => {
                const percentage =
                  analytics.totalAmount > 0
                    ? (cat.amount / analytics.totalAmount) * 100
                    : 0;
                return (
                  <div
                    key={cat.category}
                    className="flex items-center gap-3 p-2.5 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-100 dark:border-gray-700"
                  >
                    <span className="w-6 h-6 rounded-lg bg-construction-blue dark:bg-blue-600 flex items-center justify-center text-xs font-bold text-white">
                      {index + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">
                        {formatCategory(cat.category)}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <div className="flex-1 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-construction-blue dark:bg-blue-600 rounded-full"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                        <span className="text-xs text-gray-500 dark:text-gray-400 tabular-nums">
                          {percentage.toFixed(0)}%
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-construction-blue dark:text-gray-100">
                        {formatCurrency(cat.amount)}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{cat.count} items</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
