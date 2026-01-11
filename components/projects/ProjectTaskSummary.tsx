'use client';

import Image from 'next/image';
import {
  CheckSquare,
  DollarSign,
  CheckCircle,
  AlertTriangle,
  AlertCircle,
  Users,
  Package,
  Clock,
  Target,
} from 'lucide-react';
import type { TaskStats } from '@/app/actions/projects';
import { formatPercent, formatPercentWhole } from '@/lib/utils';
import { cn } from '@/lib/utils';

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
  // Handle empty state when no tasks exist
  if (taskStats.total === 0) {
    return (
      <div
        className={cn(
          'bg-white rounded-xl overflow-hidden',
          'border-2 border-gray-200 shadow-sm',
          className
        )}
      >
        {/* Header */}
        <div className="px-4 py-3.5 border-b border-gray-100 bg-gradient-to-r from-gray-50/80 to-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#001B51] flex items-center justify-center shadow-sm">
              <CheckSquare className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-[#001B51] text-sm uppercase tracking-wide">
                Task Summary
              </h3>
              <p className="text-xs text-gray-500 mt-0.5">No tasks yet</p>
            </div>
          </div>
        </div>

        {/* Empty State */}
        <div className="p-6 flex flex-col items-center justify-center min-h-[200px]">
          <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mb-4">
            <CheckSquare className="w-8 h-8 text-gray-300" />
          </div>
          <p className="text-base font-semibold text-gray-700 mb-1.5">
            No tasks created yet
          </p>
          <p className="text-sm text-gray-500 text-center max-w-[240px]">
            Create your first task to start tracking progress and budget
          </p>
        </div>
      </div>
    );
  }

  // Use project budget if available, otherwise fall back to task planned costs
  const budgetTotal = projectBudget ?? taskStats.totalPlannedCost;

  // Calculate budget utilization percentage
  const budgetUtilization =
    budgetTotal > 0
      ? (taskStats.totalActualCost / budgetTotal) * 100
      : 0;
  const isOverBudget = budgetUtilization > 100;
  const isNearBudget = budgetUtilization > 80 && budgetUtilization <= 100;

  // Calculate variance against project budget
  const budgetVariance = budgetTotal - taskStats.totalActualCost;
  const completionRate =
    taskStats.total > 0 ? (taskStats.completed / taskStats.total) * 100 : 0;
  const activeTasksCount = taskStats.total - taskStats.completed;

  // Determine progress bar colors
  const getBudgetColor = () => {
    if (isOverBudget) return 'bg-[#DC2626]';
    if (isNearBudget) return 'bg-[#F59E0B]';
    return 'bg-[#001B51]';
  };

  const getCompletionColor = () => {
    if (completionRate >= 100) return 'bg-[#DC2626]';
    if (completionRate >= 50) return 'bg-[#F59E0B]';
    return 'bg-[#001B51]';
  };

  return (
    <div
      className={cn(
        'bg-white rounded-xl overflow-hidden',
        'border-2 border-gray-200 shadow-sm',
        'transition-all duration-200',
        className
      )}
    >
      {/* Header */}
      <div className="px-4 py-3.5 border-b border-gray-100 bg-gradient-to-r from-gray-50/80 to-white">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#001B51] flex items-center justify-center shadow-sm">
            <CheckSquare className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-[#001B51] text-sm uppercase tracking-wide">
              Task Summary
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">
              {activeTasksCount} active task{activeTasksCount !== 1 ? 's' : ''}
            </p>
          </div>
          {/* Quick Status Badge */}
          <div
            className={cn(
              'px-2.5 py-1 rounded-lg text-xs font-bold',
              isOverBudget
                ? 'bg-red-100 text-red-700'
                : isNearBudget
                  ? 'bg-amber-100 text-amber-700'
                  : 'bg-emerald-100 text-emerald-700'
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
                <DollarSign className="w-4 h-4 text-gray-500" />
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
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
                      : 'text-[#001B51]'
                )}
              >
                {formatPercent(budgetUtilization)}
              </span>
            </div>
            <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
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
                <Target className="w-4 h-4 text-gray-500" />
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Completed
                </span>
              </div>
              <span className="text-sm font-bold text-[#001B51] tabular-nums">
                {taskStats.completed}/{taskStats.total}
              </span>
            </div>
            <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
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
          <div className="flex flex-col p-3 rounded-xl bg-gray-50 border border-gray-200 min-h-[76px]">
            <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1">
              Planned
            </span>
            <span className="text-base font-bold text-[#001B51] leading-tight">
              ${formatCompactNumber(budgetTotal)}
            </span>
            <span className="text-[10px] text-gray-500 mt-0.5">Budget</span>
          </div>

          {/* Actual Cost */}
          <div className="flex flex-col p-3 rounded-xl bg-gray-50 border border-gray-200 min-h-[76px]">
            <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1">
              Actual
            </span>
            <span className="text-base font-bold text-gray-900 leading-tight">
              ${formatCompactNumber(taskStats.totalActualCost)}
            </span>
            <span className="text-[10px] text-gray-500 mt-0.5">Spent</span>
          </div>

          {/* Variance - Neutral bg with colored icon/dot indicator */}
          <div className="flex flex-col p-3 rounded-xl bg-gray-50 border border-gray-200 min-h-[76px]">
            <div className="flex items-center gap-1 mb-1">
              {/* Small colored dot indicator - appropriate use of status color */}
              <span
                className={cn(
                  'w-2 h-2 rounded-full flex-shrink-0',
                  budgetVariance >= 0 ? 'bg-[#059669]' : 'bg-[#DC2626]'
                )}
              />
              <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">
                Variance
              </span>
            </div>
            <span className="text-base font-bold text-[#001B51] leading-tight">
              {budgetVariance >= 0 ? '+' : '-'}$
              {formatCompactNumber(Math.abs(budgetVariance))}
            </span>
            <span className="text-[10px] text-gray-500 mt-0.5">
              {budgetVariance >= 0 ? 'Under' : 'Over'}
            </span>
          </div>
        </div>

        {/* Status Indicators Grid */}
        <div className="grid grid-cols-2 gap-2.5 mb-4">
          {/* Completed Tasks */}
          <StatusCard
            icon={CheckCircle}
            label="Completed"
            value={taskStats.completed}
            subtext={formatPercentWhole(completionRate)}
            variant="success"
          />

          {/* Blocked Tasks */}
          <StatusCard
            icon={AlertTriangle}
            label="Blocked"
            value={taskStats.blocked}
            subtext={taskStats.blocked > 0 ? 'Needs attention' : 'All clear'}
            variant={taskStats.blocked > 0 ? 'danger' : 'success'}
          />

          {/* Overdue Tasks */}
          <StatusCard
            icon={Clock}
            label="Overdue"
            value={taskStats.overdue}
            subtext={taskStats.overdue > 0 ? 'Past due' : 'On schedule'}
            variant={taskStats.overdue > 0 ? 'danger' : 'success'}
          />

          {/* Materials */}
          <StatusCard
            icon={Package}
            label="Materials"
            value={taskStats.tasksWithMaterials}
            subtext={`$${formatCompactNumber(taskStats.totalMaterialCost)}`}
            variant="neutral"
          />
        </div>

        {/* Budget Warning Banner */}
        {(isOverBudget || isNearBudget) && (
          <div
            className={cn(
              'flex items-center gap-3 p-3 rounded-xl mb-4',
              'transition-all duration-200',
              isOverBudget
                ? 'bg-red-50 border border-red-200'
                : 'bg-amber-50 border border-amber-200'
            )}
          >
            <div
              className={cn(
                'w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0',
                isOverBudget ? 'bg-red-100' : 'bg-amber-100'
              )}
            >
              <AlertCircle
                className={cn(
                  'w-4 h-4',
                  isOverBudget ? 'text-red-600' : 'text-amber-600'
                )}
              />
            </div>
            <div className="flex-1 min-w-0">
              <p
                className={cn(
                  'text-sm font-semibold',
                  isOverBudget ? 'text-red-800' : 'text-amber-800'
                )}
              >
                {isOverBudget
                  ? `Over budget by $${Math.abs(budgetVariance).toLocaleString()}`
                  : 'Approaching budget limit'}
              </p>
              <p
                className={cn(
                  'text-xs mt-0.5',
                  isOverBudget ? 'text-red-600' : 'text-amber-600'
                )}
              >
                {isOverBudget
                  ? 'Review task costs to get back on track'
                  : `${formatPercent(budgetUtilization)} of budget used`}
              </p>
            </div>
          </div>
        )}

        {/* Top Contributors Section */}
        {taskStats.topAssignees.length > 0 && (
          <div className="pt-4 border-t border-gray-100">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-gray-500" />
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Top Contributors
                </span>
              </div>
              {taskStats.unassignedCount > 0 && (
                <span className="text-[11px] text-gray-400">
                  +{taskStats.unassignedCount} unassigned
                </span>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              {taskStats.topAssignees.map((assignee) => (
                <div
                  key={assignee.id}
                  className={cn(
                    'flex items-center gap-2.5 px-3 py-2.5',
                    'bg-gray-50 border border-gray-100 rounded-xl',
                    'min-h-[44px]', // Touch-friendly
                    'active:scale-[0.98] active:bg-gray-100',
                    'transition-all duration-150'
                  )}
                >
                  {assignee.avatar_url ? (
                    <Image
                      src={assignee.avatar_url}
                      alt={assignee.name}
                      width={28}
                      height={28}
                      className="w-7 h-7 rounded-full"
                    />
                  ) : (
                    <div className="w-7 h-7 rounded-full bg-[#001B51] flex items-center justify-center">
                      <span className="text-xs text-white font-bold">
                        {assignee.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  )}
                  <div className="flex flex-col">
                    <span className="text-sm font-semibold text-gray-900 leading-tight">
                      {assignee.name.split(' ')[0]}
                    </span>
                    <span className="text-[11px] text-gray-500">
                      {assignee.taskCount} task{assignee.taskCount !== 1 ? 's' : ''}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * StatusCard - Compact status indicator with visual feedback
 */
interface StatusCardProps {
  icon: typeof CheckCircle;
  label: string;
  value: number;
  subtext: string;
  variant: 'success' | 'danger' | 'warning' | 'neutral';
}

function StatusCard({ icon: Icon, label, value, subtext, variant }: StatusCardProps) {
  // Small dot color based on status - only element with color
  const dotColors = {
    success: 'bg-[#059669]',
    danger: 'bg-[#DC2626]',
    warning: 'bg-[#F59E0B]',
    neutral: 'bg-gray-400',
  };

  // Determine effective dot color based on variant and value
  const getDotColor = () => {
    if (variant === 'danger' && value === 0) return dotColors.success; // No blocked = good
    if (variant === 'success' && value === 0) return dotColors.neutral; // No completed = muted
    return dotColors[variant];
  };

  return (
    <div className="flex flex-col p-3 rounded-xl min-h-[76px] bg-gray-50 border border-gray-200">
      <div className="flex items-center gap-1.5 mb-1">
        {/* Small colored dot indicator - appropriate use of status color */}
        <span className={cn('w-2 h-2 rounded-full flex-shrink-0', getDotColor())} />
        <Icon className="w-3.5 h-3.5 text-gray-500" />
        <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">
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
