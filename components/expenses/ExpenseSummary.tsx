"use client";

import { useMemo } from "react";
import {
  Receipt,
  Clock,
  CheckCircle,
  XCircle,
  DollarSign,
  AlertCircle,
  Tag,
  Target,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

interface ExpenseSummaryProps {
  analytics: {
    totalCount: number;
    totalAmount: number;
    pendingCount: number;
    pendingAmount: number;
    approvedCount: number;
    approvedAmount: number;
    rejectedCount: number;
    rejectedAmount: number;
    byCategory: { category: string; amount: number; count: number }[];
  } | null;
  isLoading?: boolean;
}

/**
 * ExpenseSummary Component - Mobile PWA Optimized
 *
 * A premium, mobile-first expense analytics card designed for construction
 * field workers. Follows the ProjectTaskSummary pattern with:
 * - Header with icon and status badge
 * - Progress bars for approval rate
 * - Stats grid with key metrics
 * - Status indicators with color-coded dots
 * - Alert banners for pending items
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
  // Get top 3 categories
  const topCategories = useMemo(
    () => analytics?.byCategory.slice(0, 3) || [],
    [analytics],
  );

  // Loading state
  if (isLoading) {
    return (
      <div className="bg-white rounded-xl overflow-hidden border-2 border-gray-200 shadow-sm">
        <div className="px-4 py-3.5 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <Skeleton className="w-10 h-10 rounded-xl" />
            <div className="flex-1">
              <Skeleton className="h-4 w-32 mb-1" />
              <Skeleton className="h-3 w-24" />
            </div>
            <Skeleton className="h-6 w-20 rounded-lg" />
          </div>
        </div>
        <div className="p-4 space-y-4">
          <Skeleton className="h-10 w-full rounded-lg" />
          <div className="grid grid-cols-3 gap-2.5">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-20 rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (!analytics) {
    return (
      <div className="bg-white rounded-xl overflow-hidden border-2 border-gray-200 shadow-sm p-6 text-center">
        <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center mx-auto mb-3">
          <Receipt className="w-6 h-6 text-gray-400" />
        </div>
        <p className="text-sm font-medium text-gray-600">
          Unable to load expense summary
        </p>
      </div>
    );
  }

  // Calculate metrics
  const approvalRate =
    analytics.totalCount > 0
      ? (analytics.approvedCount / analytics.totalCount) * 100
      : 0;
  const pendingRate =
    analytics.totalCount > 0
      ? (analytics.pendingCount / analytics.totalCount) * 100
      : 0;
  const hasPendingExpenses = analytics.pendingCount > 0;
  const hasRejectedExpenses = analytics.rejectedCount > 0;

  const statusBadge = useMemo(() => {
    if (hasPendingExpenses) {
      return {
        label: "Pending Review",
        className: "bg-amber-100 text-amber-700",
      };
    }
    if (hasRejectedExpenses) {
      return { label: "Has Rejections", className: "bg-red-100 text-red-700" };
    }
    return { label: "All Clear", className: "bg-emerald-100 text-emerald-700" };
  }, [hasPendingExpenses, hasRejectedExpenses]);

  return (
    <div
      className={cn(
        "bg-white rounded-xl overflow-hidden",
        "border-2 border-gray-200 shadow-sm",
        "transition-all duration-200",
      )}
    >
      {/* Header */}
      <div className="px-4 py-3.5 border-b border-gray-100 bg-gradient-to-r from-gray-50/80 to-white">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#001B51] flex items-center justify-center shadow-sm">
            <Receipt className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-[#001B51] text-sm uppercase tracking-wide">
              Expense Summary
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">
              {analytics.totalCount} expense
              {analytics.totalCount !== 1 ? "s" : ""} recorded
            </p>
          </div>
          {/* Quick Status Badge */}
          <div
            className={cn(
              "px-2.5 py-1 rounded-lg text-xs font-bold",
              statusBadge.className,
            )}
          >
            {statusBadge.label}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-4">
        {/* Progress Bars Section */}
        <div className="space-y-4 mb-5">
          {/* Approval Rate */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Target className="w-4 h-4 text-gray-500" />
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Approval Rate
                </span>
              </div>
              <span className="text-sm font-bold text-[#001B51] tabular-nums">
                {approvalRate.toFixed(0)}%
              </span>
            </div>
            <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500 ease-out bg-[#059669]"
                style={{ width: `${approvalRate}%` }}
              />
            </div>
          </div>

          {/* Total Spend */}
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-100">
            <div className="flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-[#001B51]" />
              <span className="text-sm font-semibold text-gray-700">
                Total Spend
              </span>
            </div>
            <span className="text-xl font-black text-[#001B51]">
              {formatCurrency(analytics.totalAmount)}
            </span>
          </div>
        </div>

        {/* Stats Grid - 3 columns */}
        <div className="grid grid-cols-3 gap-2.5 mb-4">
          {/* Approved */}
          <StatCard
            icon={CheckCircle}
            label="Approved"
            value={analytics.approvedCount}
            subtext={formatCurrency(analytics.approvedAmount)}
            variant="success"
          />

          {/* Pending */}
          <StatCard
            icon={Clock}
            label="Pending"
            value={analytics.pendingCount}
            subtext={formatCurrency(analytics.pendingAmount)}
            variant={hasPendingExpenses ? "warning" : "neutral"}
          />

          {/* Rejected */}
          <StatCard
            icon={XCircle}
            label="Rejected"
            value={analytics.rejectedCount}
            subtext={formatCurrency(analytics.rejectedAmount)}
            variant={hasRejectedExpenses ? "danger" : "success"}
          />
        </div>

        {/* Top Categories */}
        {topCategories.length > 0 && (
          <div className="pt-4 border-t border-gray-100">
            <div className="flex items-center gap-2 mb-3">
              <Tag className="w-4 h-4 text-gray-500" />
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
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
                    className="flex items-center gap-3 p-2.5 bg-gray-50 rounded-lg border border-gray-100"
                  >
                    <span className="w-6 h-6 rounded-lg bg-[#001B51] flex items-center justify-center text-xs font-bold text-white">
                      {index + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900 truncate">
                        {formatCategory(cat.category)}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-[#001B51] rounded-full"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                        <span className="text-xs text-gray-500 tabular-nums">
                          {percentage.toFixed(0)}%
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-[#001B51]">
                        {formatCurrency(cat.amount)}
                      </p>
                      <p className="text-xs text-gray-500">{cat.count} items</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Pending Alert Banner */}
        {hasPendingExpenses && (
          <div
            className={cn(
              "flex items-center gap-3 p-3 rounded-xl mt-4",
              "transition-all duration-200",
              "bg-amber-50 border border-amber-200",
            )}
          >
            <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 bg-amber-100">
              <AlertCircle className="w-4 h-4 text-amber-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-amber-800">
                {analytics.pendingCount} expense
                {analytics.pendingCount !== 1 ? "s" : ""} awaiting review
              </p>
              <p className="text-xs mt-0.5 text-amber-600">
                {formatCurrency(analytics.pendingAmount)} pending approval
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * StatCard - Compact status indicator with color-coded dot
 */
interface StatCardProps {
  icon: typeof Receipt;
  label: string;
  value: number;
  subtext: string;
  variant: "success" | "danger" | "warning" | "neutral";
}

function StatCard({
  icon: Icon,
  label,
  value,
  subtext,
  variant,
}: StatCardProps) {
  const dotColors = {
    success: "bg-[#059669]",
    danger: "bg-[#DC2626]",
    warning: "bg-[#F59E0B]",
    neutral: "bg-gray-400",
  };

  const getDotColor = () => {
    if (variant === "danger" && value === 0) return dotColors.success;
    if (variant === "success" && value === 0) return dotColors.neutral;
    if (variant === "warning" && value === 0) return dotColors.success;
    return dotColors[variant];
  };

  return (
    <div className="flex flex-col p-3 rounded-xl min-h-[76px] bg-gray-50 border border-gray-200">
      <div className="flex items-center gap-1.5 mb-1">
        <span
          className={cn("w-2 h-2 rounded-full flex-shrink-0", getDotColor())}
        />
        <Icon className="w-3.5 h-3.5 text-gray-500" />
        <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider truncate">
          {label}
        </span>
      </div>
      <span className="text-xl font-bold leading-tight text-[#001B51]">
        {value}
      </span>
      <span className="text-[10px] mt-0.5 text-gray-500">{subtext}</span>
    </div>
  );
}
