'use client';

import { DollarSign, TrendingUp, TrendingDown, Clock, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { cn, formatPercent } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
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
 * 0-80%: green (#059669)
 * 80-100%: yellow (#F59E0B)
 * >100%: red (#DC2626)
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
    <div className="bg-white border-2 border-gray-200 rounded-lg p-4 md:p-5 animate-pulse">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <Skeleton className="w-10 h-10 rounded-lg" />
        <Skeleton className="h-5 w-32" />
      </div>

      {/* Progress bar */}
      <div className="mb-4">
        <div className="flex justify-between mb-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-12" />
        </div>
        <Skeleton className="h-3 w-full rounded-full" />
      </div>

      {/* Planned vs Actual */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="space-y-1">
          <Skeleton className="h-3 w-16" />
          <Skeleton className="h-6 w-20" />
        </div>
        <div className="space-y-1">
          <Skeleton className="h-3 w-16" />
          <Skeleton className="h-6 w-20" />
        </div>
      </div>

      {/* Variance */}
      <div className="mb-4">
        <Skeleton className="h-4 w-32" />
      </div>

      {/* Pending expenses */}
      <Skeleton className="h-10 w-full rounded-lg" />
    </div>
  );
}

export function BudgetSummaryWidget({
  budget,
  isLoading = false,
}: BudgetSummaryWidgetProps) {
  console.log('[BudgetSummaryWidget] Rendering:', {
    utilization: budget?.utilizationPercent,
    isLoading
  });

  if (isLoading) {
    return <BudgetSummaryWidgetSkeleton />;
  }

  const utilizationColors = getUtilizationColor(budget.utilizationPercent);
  const isUnderBudget = budget.variance >= 0;
  const cappedUtilization = Math.min(budget.utilizationPercent, 100);

  return (
    <motion.div
      className="bg-white border-2 border-gray-200 rounded-lg p-4 md:p-5 shadow-construction h-full"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 bg-[#001B51] rounded-lg">
          <DollarSign className="w-5 h-5 text-white" />
        </div>
        <h3 className="text-sm font-semibold text-gray-600 uppercase tracking-wider">
          Budget Summary
        </h3>
      </div>

      {/* Utilization Progress Bar */}
      <div className="mb-4">
        <div className="flex justify-between items-center mb-2">
          <span className="text-xs font-medium text-gray-500">Utilization</span>
          <span className={cn('text-sm font-bold', utilizationColors.text)}>
            {formatPercent(budget.utilizationPercent)}
          </span>
        </div>
        <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
          <motion.div
            className={cn('h-full rounded-full', utilizationColors.bar)}
            initial={{ width: 0 }}
            animate={{ width: `${cappedUtilization}%` }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
          />
        </div>
        {budget.utilizationPercent > 100 && (
          <p className="text-xs text-[#DC2626] mt-1 font-medium">
            Over budget by {formatPercent(budget.utilizationPercent - 100)}
          </p>
        )}
      </div>

      {/* Planned vs Actual */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <p className="text-xs text-gray-500 mb-1">Planned</p>
          <p className="text-lg md:text-xl font-bold text-gray-900">
            {formatCurrency(budget.totalPlanned, true)}
          </p>
        </div>
        <div>
          <p className="text-xs text-gray-500 mb-1">Actual</p>
          <p className="text-lg md:text-xl font-bold text-gray-900">
            {formatCurrency(budget.totalActual, true)}
          </p>
        </div>
      </div>

      {/* Variance */}
      <div className="flex items-center gap-2 mb-4 py-2 px-3 rounded-lg bg-gray-50">
        {isUnderBudget ? (
          <TrendingDown className="w-4 h-4 text-[#059669]" />
        ) : (
          <TrendingUp className="w-4 h-4 text-[#DC2626]" />
        )}
        <span className={cn(
          'text-sm font-medium',
          isUnderBudget ? 'text-[#059669]' : 'text-[#DC2626]'
        )}>
          {isUnderBudget ? 'Under budget: ' : 'Over budget: '}
          {formatCurrency(Math.abs(budget.variance), true)}
        </span>
      </div>

      {/* Pending Expenses CTA */}
      {budget.pendingExpenses.count > 0 && (
        <Link href="/app/expenses?status=pending">
          <motion.div
            className="flex items-center justify-between p-3 rounded-lg bg-[#F59E0B]/10 border border-[#F59E0B]/30 hover:bg-[#F59E0B]/20 transition-colors cursor-pointer"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-[#F59E0B]" />
              <span className="text-sm font-medium text-gray-700">
                {budget.pendingExpenses.count} pending expense{budget.pendingExpenses.count !== 1 ? 's' : ''}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-sm font-bold text-[#F59E0B]">
                {formatCurrency(budget.pendingExpenses.amount, true)}
              </span>
              <ChevronRight className="w-4 h-4 text-[#F59E0B]" />
            </div>
          </motion.div>
        </Link>
      )}

      {budget.pendingExpenses.count === 0 && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-[#059669]/10 border border-[#059669]/30">
          <Clock className="w-4 h-4 text-[#059669]" />
          <span className="text-sm font-medium text-[#059669]">
            No pending expenses
          </span>
        </div>
      )}
    </motion.div>
  );
}
