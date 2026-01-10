'use client';

import { DollarSign, CheckCircle, Clock, XCircle } from 'lucide-react';
import type { ExpenseStats } from '@/app/actions/projects';
import { InfoCard, InfoCardField } from './InfoCard';
import { formatPercent } from '@/lib/utils';

interface ProjectExpenseSummaryProps {
  expenseStats: ExpenseStats;
  budget: number;
  className?: string;
}

/**
 * ProjectExpenseSummary Component
 *
 * Displays comprehensive expense summary for a project using InfoCard.
 *
 * Features:
 * - Total expense amount and count
 * - Approved vs pending breakdown
 * - Budget utilization progress bar
 * - Status indicators (approved, pending, rejected)
 * - Construction-themed design with InfoCard
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

  // Determine progress bar color
  const getProgressColor = () => {
    if (isOverBudget) return 'bg-red-500';
    if (isNearBudget) return 'bg-yellow-500';
    return 'bg-[#001B51]';
  };

  // Build fields for InfoCard
  const fields: InfoCardField[] = [
    // Budget Utilization Progress Bar (full width)
    {
      label: 'Budget Utilization',
      value: formatPercent(budgetUtilization),
      isProgressBar: true,
      progressValue: Math.min(100, budgetUtilization),
      progressColor: getProgressColor(),
      className: 'col-span-full mb-2',
    },
    // Approved Expenses
    {
      label: 'Approved',
      value: (
        <div className="flex items-center gap-2">
          <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" />
          <div className="flex flex-col">
            <span className="text-lg font-bold text-gray-900 leading-tight">
              {expenseStats.approved}
            </span>
            <span className="text-xs text-gray-500">
              ${expenseStats.approvedAmount.toLocaleString()}
            </span>
          </div>
        </div>
      ),
    },
    // Pending Expenses
    {
      label: 'Pending',
      value: (
        <div className="flex items-center gap-2">
          <Clock className="h-5 w-5 text-yellow-600 flex-shrink-0" />
          <div className="flex flex-col">
            <span className="text-lg font-bold text-gray-900 leading-tight">
              {expenseStats.pending}
            </span>
            <span className="text-xs text-gray-500">
              ${expenseStats.pendingAmount.toLocaleString()}
            </span>
          </div>
        </div>
      ),
    },
    // Rejected Expenses
    {
      label: 'Rejected',
      value: (
        <div className="flex items-center gap-2">
          <XCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
          <div className="flex flex-col">
            <span className="text-lg font-bold text-gray-900 leading-tight">
              {expenseStats.rejected}
            </span>
            <span className="text-xs text-gray-500">
              ${expenseStats.rejectedAmount.toLocaleString()}
            </span>
          </div>
        </div>
      ),
    },
  ];

  // Footer content: Budget info + warnings + total
  const footerContent = (
    <div className="col-span-full mt-4 space-y-4">
      {/* Budget Info Below Progress Bar */}
      <div className="flex items-center justify-between text-xs text-gray-500">
        <span>
          ${expenseStats.approvedAmount.toLocaleString()} approved
        </span>
        <span>
          Budget: ${budget.toLocaleString()}
        </span>
      </div>

      {/* Budget Warnings */}
      {isOverBudget && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-800 font-medium">
            ⚠️ Over Budget by ${(expenseStats.approvedAmount - budget).toLocaleString()}
          </p>
        </div>
      )}
      {isNearBudget && !isOverBudget && (
        <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-sm text-yellow-800 font-medium">
            ⚠️ Approaching Budget Limit
          </p>
        </div>
      )}

      {/* Total Amount */}
      <div className="pt-4 border-t border-gray-200">
        <div className="flex items-center justify-between">
          <span className="text-sm font-bold text-gray-700 uppercase tracking-wider">
            Total Expenses
          </span>
          <span className="text-xl font-bold text-[#001B51]">
            ${expenseStats.totalAmount.toLocaleString()}
          </span>
        </div>
      </div>
    </div>
  );

  return (
    <InfoCard
      headerIcon={DollarSign}
      headerTitle="Expense Summary"
      headerDescription={`${expenseStats.total} total expense${expenseStats.total !== 1 ? 's' : ''}`}
      fields={fields}
      columns={2}
      footerContent={footerContent}
      className={className}
    />
  );
}
