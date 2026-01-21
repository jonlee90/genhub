'use client';

import { useMemo } from 'react';
// Performance optimization: Direct imports instead of barrel file (saves 200-800ms per page)
import ClipboardList from 'lucide-react/icons/clipboard-list';
import DollarSign from 'lucide-react/icons/dollar-sign';
import CheckCircle from 'lucide-react/icons/check-circle';
import AlertTriangle from 'lucide-react/icons/alert-triangle';
import AlertCircle from 'lucide-react/icons/alert-circle';
import Package from 'lucide-react/icons/package';
import Clock from 'lucide-react/icons/clock';
import Target from 'lucide-react/icons/target';
import type { TaskStats } from '@/app/actions/projects';
import { formatPercent, formatPercentWhole } from '@/lib/utils';
import { cn } from '@/lib/utils';
import { StatCard } from '@/components/ui/stat-card';

interface ProjectTaskSummaryProps {
  taskStats: TaskStats;
  projectBudget?: number;
  className?: string;
}

/**
 * ProjectTaskSummary Component - Mobile PWA Optimized
 *
 * A premium, mobile-first task analytics card designed for construction
 * field workers. Features touch-optimized interactions, high contrast
 * for outdoor visibility, and a clean visual hierarchy.
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
export function ProjectTaskSummary({
  taskStats,
  projectBudget,
  className = '',
}: ProjectTaskSummaryProps) {
  // Performance optimization: Memoize computed values to prevent recalculation on every render
  // NOTE: Must call hooks before any early returns (React rules)
  const budgetTotal = useMemo(
    () => projectBudget ?? taskStats.totalPlannedCost,
    [projectBudget, taskStats.totalPlannedCost]
  );

  const budgetUtilization = useMemo(
    () =>
      budgetTotal > 0
        ? (taskStats.totalActualCost / budgetTotal) * 100
        : 0,
    [budgetTotal, taskStats.totalActualCost]
  );

  const isOverBudget = budgetUtilization > 100;
  const isNearBudget = budgetUtilization > 80 && budgetUtilization <= 100;

  const budgetVariance = useMemo(
    () => budgetTotal - taskStats.totalActualCost,
    [budgetTotal, taskStats.totalActualCost]
  );

  const completionRate = useMemo(
    () => (taskStats.total > 0 ? (taskStats.completed / taskStats.total) * 100 : 0),
    [taskStats.total, taskStats.completed]
  );

  const activeTasksCount = useMemo(
    () => taskStats.total - taskStats.completed,
    [taskStats.total, taskStats.completed]
  );

  // Handle empty state when no tasks exist
  if (taskStats.total === 0) {
    return (
      <div
        className={cn(
          'bg-white dark:bg-gray-900 rounded-xl overflow-hidden',
          'border-2 border-gray-200 dark:border-gray-700 shadow-sm',
          className
        )}
      >
        {/* Header */}
        <div className="px-4 py-3.5 border-b border-gray-100 dark:border-gray-700 bg-gradient-to-r from-gray-50/80 dark:from-gray-800/80 to-white dark:to-gray-900">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-construction-blue flex items-center justify-center shadow-sm">
              <ClipboardList className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-construction-blue text-sm uppercase tracking-wide">
                Task Summary
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">No tasks yet</p>
            </div>
          </div>
        </div>

        {/* Empty State */}
        <div className="p-6 flex flex-col items-center justify-center min-h-[200px]">
          <div className="w-16 h-16 rounded-2xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-4">
            <ClipboardList className="w-8 h-8 text-gray-300 dark:text-gray-600" />
          </div>
          <p className="text-base font-semibold text-gray-700 dark:text-gray-100 mb-1.5">
            No tasks created yet
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400 text-center max-w-[240px]">
            Create your first task to start tracking progress and budget
          </p>
        </div>
      </div>
    );
  }

  // Determine progress bar colors
  const getBudgetColor = () => {
    if (isOverBudget) return 'bg-[#DC2626]';
    if (isNearBudget) return 'bg-[#F59E0B]';
    return 'bg-construction-blue';
  };

  const getCompletionColor = () => {
    if (completionRate >= 100) return 'bg-[#DC2626]';
    if (completionRate >= 50) return 'bg-[#F59E0B]';
    return 'bg-construction-blue';
  };

  return (
    <div
      className={cn(
        'bg-white dark:bg-gray-900 rounded-xl overflow-hidden',
        'border-2 border-gray-200 dark:border-gray-700 shadow-sm',
        'transition-all duration-200',
        className
      )}
    >
      {/* Header */}
      <div className="px-4 py-3.5 border-b border-gray-100 dark:border-gray-700 bg-gradient-to-r from-gray-50/80 dark:from-gray-800/80 to-white dark:to-gray-900">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-construction-blue flex items-center justify-center shadow-sm">
            <ClipboardList className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-construction-blue text-sm uppercase tracking-wide">
              Task Summary
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              {activeTasksCount} active task{activeTasksCount !== 1 ? 's' : ''}
            </p>
          </div>
          {/* Quick Status Badge */}
          <div
            className={cn(
              'px-2.5 py-1 rounded-lg text-xs font-bold',
              isOverBudget
                ? 'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300'
                : isNearBudget
                  ? 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300'
                  : 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300'
            )}
          >
            {isOverBudget ? 'Over Budget' : isNearBudget ? 'Near Limit' : 'On Track'}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-4">
        {/* Progress Bars Section */}
        <div className="space-y-4 mb-5">
          {/* Budget Progress */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Budget Used
                </span>
              </div>
              <span
                className={cn(
                  'text-sm font-bold tabular-nums',
                  isOverBudget
                    ? 'text-[#DC2626]'
                    : isNearBudget
                      ? 'text-[#F59E0B]'
                      : 'text-construction-blue'
                )}
              >
                {formatPercent(budgetUtilization)}
              </span>
            </div>
            <div className="h-2.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
              <div
                className={cn(
                  'h-full rounded-full transition-all duration-500 ease-out',
                  getBudgetColor()
                )}
                style={{ width: `${Math.min(100, budgetUtilization)}%` }}
              />
            </div>
          </div>

          {/* Completion Progress */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Target className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Completed
                </span>
              </div>
              <span className="text-sm font-bold text-construction-blue tabular-nums">
                {taskStats.completed}/{taskStats.total}
              </span>
            </div>
            <div className="h-2.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
              <div
                className={cn(
                  'h-full rounded-full transition-all duration-500 ease-out',
                  getCompletionColor()
                )}
                style={{ width: `${completionRate}%` }}
              />
            </div>
          </div>
        </div>

        {/* Budget Stats Grid - Neutral backgrounds with small color accents */}
        <div className="grid grid-cols-3 gap-2.5 mb-4">
          {/* Planned Cost */}
          <StatCard
            label="Planned"
            value={`$${formatCompactNumber(budgetTotal)}`}
            subtext="Budget"
          />

          {/* Actual Cost */}
          <StatCard
            label="Actual"
            value={`$${formatCompactNumber(taskStats.totalActualCost)}`}
            subtext="Spent"
            valueColor="text-gray-900 dark:text-gray-100"
          />

          {/* Variance - with status dot */}
          <StatCard
            label="Variance"
            value={`${budgetVariance >= 0 ? '+' : '-'}$${formatCompactNumber(Math.abs(budgetVariance))}`}
            subtext={budgetVariance >= 0 ? 'Under' : 'Over'}
            variant={budgetVariance >= 0 ? 'success' : 'danger'}
            showStatusDot
          />
        </div>

        {/* Status Indicators Grid */}
        <div className="grid grid-cols-2 gap-2.5 mb-4">
          {/* Completed Tasks */}
          <StatCard
            icon={CheckCircle}
            label="Completed"
            value={taskStats.completed}
            subtext={formatPercentWhole(completionRate)}
            variant="success"
            showStatusDot
          />

          {/* Blocked Tasks */}
          <StatCard
            icon={AlertTriangle}
            label="Blocked"
            value={taskStats.blocked}
            subtext={taskStats.blocked > 0 ? 'Needs attention' : 'All clear'}
            variant={taskStats.blocked > 0 ? 'danger' : 'success'}
            showStatusDot
          />

          {/* Overdue Tasks */}
          <StatCard
            icon={Clock}
            label="Overdue"
            value={taskStats.overdue}
            subtext={taskStats.overdue > 0 ? 'Past due' : 'On schedule'}
            variant={taskStats.overdue > 0 ? 'danger' : 'success'}
            showStatusDot
          />

          {/* Materials */}
          <StatCard
            icon={Package}
            label="Materials"
            value={taskStats.tasksWithMaterials}
            subtext={`$${formatCompactNumber(taskStats.totalMaterialCost)}`}
            variant="neutral"
            showStatusDot
          />
        </div>

        {/* Budget Warning Banner */}
        {(isOverBudget || isNearBudget) && (
          <div
            className={cn(
              'flex items-center gap-3 p-3 rounded-xl',
              'transition-all duration-200',
              isOverBudget
                ? 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900/40'
                : 'bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-900/40'
            )}
          >
            <div
              className={cn(
                'w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0',
                isOverBudget ? 'bg-red-100 dark:bg-red-900/40' : 'bg-amber-100 dark:bg-amber-900/40'
              )}
            >
              <AlertCircle
                className={cn(
                  'w-4 h-4',
                  isOverBudget ? 'text-red-600 dark:text-red-400' : 'text-amber-600 dark:text-amber-400'
                )}
              />
            </div>
            <div className="flex-1 min-w-0">
              <p
                className={cn(
                  'text-sm font-semibold',
                  isOverBudget ? 'text-red-800 dark:text-red-300' : 'text-amber-800 dark:text-amber-300'
                )}
              >
                {isOverBudget
                  ? `Over budget by $${Math.abs(budgetVariance).toLocaleString()}`
                  : 'Approaching budget limit'}
              </p>
              <p
                className={cn(
                  'text-xs mt-0.5',
                  isOverBudget ? 'text-red-600 dark:text-red-400' : 'text-amber-600 dark:text-amber-400'
                )}
              >
                {isOverBudget
                  ? 'Review task costs to get back on track'
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
    return (num / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
  }
  return num.toLocaleString();
}
