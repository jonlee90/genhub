'use client';

import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { DollarSign, TrendingUp, TrendingDown, Clock, CheckCircle, XCircle } from 'lucide-react';
import type { ExpenseStats } from '@/app/actions/projects';

interface ProjectExpenseSummaryProps {
  expenseStats: ExpenseStats;
  budget: number;
  className?: string;
}

/**
 * ProjectExpenseSummary Component
 *
 * Displays comprehensive expense summary for a project.
 *
 * Features:
 * - Total expense amount and count
 * - Approved vs pending breakdown
 * - Budget utilization progress bar
 * - Status indicators (approved, pending, rejected)
 * - Construction-themed design
 *
 * @component
 */
export function ProjectExpenseSummary({
  expenseStats,
  budget,
  className = '',
}: ProjectExpenseSummaryProps) {
  console.log('[ProjectExpenseSummary] Rendering with data:', {
    expenseStats,
    budget,
  });

  // Calculate budget utilization percentage
  const budgetUtilization = budget > 0 ? (expenseStats.approvedAmount / budget) * 100 : 0;
  const isOverBudget = budgetUtilization > 100;
  const isNearBudget = budgetUtilization > 80 && budgetUtilization <= 100;

  // Determine budget status color
  const getBudgetStatusColor = () => {
    if (isOverBudget) return 'text-red-600';
    if (isNearBudget) return 'text-yellow-600';
    return 'text-green-600';
  };

  const getProgressColor = () => {
    if (isOverBudget) return 'bg-red-500';
    if (isNearBudget) return 'bg-yellow-500';
    return 'bg-[#001B51]';
  };

  return (
    <Card className={`p-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#001B51]/10">
            <DollarSign className="h-5 w-5 text-[#001B51]" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              Expense Summary
            </h3>
            <p className="text-sm text-gray-500">
              {expenseStats.total} total expense{expenseStats.total !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
      </div>

      {/* Budget Utilization */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">
            Budget Utilization
          </span>
          <div className="flex items-center gap-2">
            {isOverBudget ? (
              <TrendingUp className="h-4 w-4 text-red-600" />
            ) : (
              <TrendingDown className="h-4 w-4 text-green-600" />
            )}
            <span className={`text-sm font-semibold ${getBudgetStatusColor()}`}>
              {budgetUtilization.toFixed(1)}%
            </span>
          </div>
        </div>

        <Progress
          value={Math.min(100, budgetUtilization)}
          className="h-2"
          indicatorClassName={getProgressColor()}
        />

        <div className="flex items-center justify-between mt-2 text-xs text-gray-500">
          <span>
            ${expenseStats.approvedAmount.toLocaleString()} approved
          </span>
          <span>
            Budget: ${budget.toLocaleString()}
          </span>
        </div>

        {/* Budget Warning */}
        {isOverBudget && (
          <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-800 font-medium">
              ⚠️ Over Budget by ${(expenseStats.approvedAmount - budget).toLocaleString()}
            </p>
          </div>
        )}
        {isNearBudget && !isOverBudget && (
          <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-sm text-yellow-800 font-medium">
              ⚠️ Approaching Budget Limit
            </p>
          </div>
        )}
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-3 gap-4">
        {/* Approved */}
        <div className="space-y-1">
          <div className="flex items-center gap-1.5">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <span className="text-xs font-medium text-gray-500">Approved</span>
          </div>
          <div className="text-lg font-semibold text-gray-900">
            {expenseStats.approved}
          </div>
          <div className="text-xs text-gray-500">
            ${expenseStats.approvedAmount.toLocaleString()}
          </div>
        </div>

        {/* Pending */}
        <div className="space-y-1">
          <div className="flex items-center gap-1.5">
            <Clock className="h-4 w-4 text-yellow-600" />
            <span className="text-xs font-medium text-gray-500">Pending</span>
          </div>
          <div className="text-lg font-semibold text-gray-900">
            {expenseStats.pending}
          </div>
          <div className="text-xs text-gray-500">
            ${expenseStats.pendingAmount.toLocaleString()}
          </div>
        </div>

        {/* Rejected */}
        <div className="space-y-1">
          <div className="flex items-center gap-1.5">
            <XCircle className="h-4 w-4 text-red-600" />
            <span className="text-xs font-medium text-gray-500">Rejected</span>
          </div>
          <div className="text-lg font-semibold text-gray-900">
            {expenseStats.rejected}
          </div>
          <div className="text-xs text-gray-500">
            ${expenseStats.rejectedAmount.toLocaleString()}
          </div>
        </div>
      </div>

      {/* Total Amount */}
      <div className="mt-6 pt-6 border-t border-gray-200">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-gray-700">
            Total Expenses
          </span>
          <span className="text-xl font-bold text-[#001B51]">
            ${expenseStats.totalAmount.toLocaleString()}
          </span>
        </div>
      </div>
    </Card>
  );
}
