'use client';

import { DollarSign, TrendingUp, TrendingDown, Clock, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { cn, formatPercent } from '@/lib/utils';
import type { BudgetSummaryData } from '@/types/dashboard';

export interface BudgetSummaryWidgetProps {
  budget: BudgetSummaryData;
  isLoading?: boolean;
}

/**
 * Format currency with K/M suffixes for large numbers
 */
function formatCurrency(amount: number, compact = false): string {
  if (compact && Math.abs(amount) >= 1000000) {
    return `$${(amount / 1000000).toFixed(1)}M`;
  }
  if (compact && Math.abs(amount) >= 1000) {
    return `$${(amount / 1000).toFixed(1)}K`;
  }
  return `$${amount.toLocaleString('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })}`;
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
      bar: 'bg-[#059669]',
      text: 'text-[#059669]',
      bg: 'bg-[#059669]/10',
    };
  }
  if (percent <= 100) {
    return {
      bar: 'bg-[#F59E0B]',
      text: 'text-[#F59E0B]',
      bg: 'bg-[#F59E0B]/10',
    };
  }
  return {
    bar: 'bg-[#DC2626]',
    text: 'text-[#DC2626]',
    bg: 'bg-[#DC2626]/10',
  };
}

function BudgetSummaryWidgetSkeleton() {
  return (
    <div className="bg-white border-2 border-gray-200 rounded-xl p-4 animate-pulse h-full">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 bg-gray-200 rounded-lg" />
        <div className="h-5 w-32 bg-gray-200 rounded" />
      </div>
      <div className="mb-4">
        <div className="flex justify-between mb-2">
          <div className="h-4 w-20 bg-gray-200 rounded" />
          <div className="h-4 w-12 bg-gray-200 rounded" />
        </div>
        <div className="h-3 w-full bg-gray-200 rounded-full" />
      </div>
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="space-y-2">
          <div className="h-3 w-16 bg-gray-200 rounded" />
          <div className="h-6 w-20 bg-gray-200 rounded" />
        </div>
        <div className="space-y-2">
          <div className="h-3 w-16 bg-gray-200 rounded" />
          <div className="h-6 w-20 bg-gray-200 rounded" />
        </div>
      </div>
      <div className="h-12 w-full bg-gray-100 rounded-lg" />
    </div>
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
    <div className="bg-white border-2 border-gray-200 rounded-xl p-4 h-full">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 bg-[#001B51] rounded-lg">
          <DollarSign className="w-5 h-5 text-white" />
        </div>
        <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide">
          Budget
        </h3>
      </div>

      {/* Utilization Progress Bar */}
      <div className="mb-4">
        <div className="flex justify-between items-center mb-2">
          <span className="text-xs font-semibold text-gray-500 uppercase">Utilization</span>
          <span className={cn('text-sm font-bold', utilizationColors.text)}>
            {formatPercent(budget.utilizationPercent)}
          </span>
        </div>
        <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
          <div
            className={cn('h-full rounded-full transition-all duration-500', utilizationColors.bar)}
            style={{ width: `${cappedUtilization}%` }}
          />
        </div>
        {budget.utilizationPercent > 100 && (
          <p className="text-xs text-[#DC2626] mt-1 font-semibold">
            Over budget by {formatPercent(budget.utilizationPercent - 100)}
          </p>
        )}
      </div>

      {/* Planned vs Actual */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="p-3 bg-gray-50 rounded-lg">
          <p className="text-xs text-gray-500 font-medium mb-1">Planned</p>
          <p className="text-lg font-bold text-gray-900">
            {formatCurrency(budget.totalPlanned, true)}
          </p>
        </div>
        <div className="p-3 bg-gray-50 rounded-lg">
          <p className="text-xs text-gray-500 font-medium mb-1">Actual</p>
          <p className="text-lg font-bold text-gray-900">
            {formatCurrency(budget.totalActual, true)}
          </p>
        </div>
      </div>

      {/* Variance */}
      <div className={cn(
        'flex items-center gap-2 mb-4 p-3 rounded-lg',
        isUnderBudget ? 'bg-[#059669]/10' : 'bg-[#DC2626]/10'
      )}>
        {isUnderBudget ? (
          <TrendingDown className="w-4 h-4 text-[#059669]" />
        ) : (
          <TrendingUp className="w-4 h-4 text-[#DC2626]" />
        )}
        <span className={cn(
          'text-sm font-semibold',
          isUnderBudget ? 'text-[#059669]' : 'text-[#DC2626]'
        )}>
          {isUnderBudget ? 'Under budget: ' : 'Over budget: '}
          {formatCurrency(Math.abs(budget.variance), true)}
        </span>
      </div>

      {/* Pending Expenses CTA */}
      {budget.pendingExpenses.count > 0 ? (
        <Link href="/app/expenses?status=pending">
          <div
            className={cn(
              'flex items-center justify-between p-3 rounded-lg',
              'bg-[#F59E0B]/10 border border-[#F59E0B]/30',
              'transition-all duration-150',
              'active:scale-[0.98] active:bg-[#F59E0B]/20'
            )}
          >
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-[#F59E0B]" />
              <span className="text-sm font-semibold text-gray-700">
                {budget.pendingExpenses.count} pending
              </span>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-sm font-bold text-[#F59E0B]">
                {formatCurrency(budget.pendingExpenses.amount, true)}
              </span>
              <ChevronRight className="w-4 h-4 text-[#F59E0B]" />
            </div>
          </div>
        </Link>
      ) : (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-[#059669]/10 border border-[#059669]/30">
          <Clock className="w-4 h-4 text-[#059669]" />
          <span className="text-sm font-semibold text-[#059669]">
            No pending expenses
          </span>
        </div>
      )}
    </div>
  );
}
