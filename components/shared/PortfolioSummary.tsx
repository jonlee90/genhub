'use client';

import { memo } from 'react';
import {
  Building2,
  DollarSign,
  CheckCircle,
  AlertTriangle,
  AlertCircle,
  Clock,
  Target,
  TrendingUp,
} from 'lucide-react';
import { formatPercent, formatPercentWhole, formatBudget, cn } from '@/lib/utils';
import { StatCard } from '@/components/ui/stat-card';

/**
 * PortfolioSummaryStats - Type definition for portfolio-level statistics
 *
 * This interface defines the shape of aggregate metrics across all projects
 * in a portfolio, including project counts, budget aggregation, task rollups,
 * schedule health, and top performing projects.
 */
export interface PortfolioSummaryStats {
  // Project Counts
  totalProjects: number;
  activeProjects: number;
  completedProjects: number;

  // Budget Aggregation
  totalBudget: number;
  totalActualSpent: number;
  budgetVariance: number;
  budgetUtilization: number;

  // Task Rollup
  totalTasks: number;
  completedTasks: number;
  overdueTasks: number;

  // Schedule Health
  onTimeProjects: number;
  atRiskProjects: number;
  delayedProjects: number;

  // Top Projects
  topProjects: Array<{
    id: string;
    name: string;
    completionPercentage: number;
  }>;
}

interface PortfolioSummaryProps {
  stats: PortfolioSummaryStats;
  className?: string;
}

/**
 * PortfolioSummary Component - Mobile PWA Optimized
 *
 * A premium, mobile-first portfolio analytics card designed for construction
 * general contractors. Displays aggregate metrics across all projects including
 * budget utilization, task completion, and schedule health.
 *
 * Design Principles:
 * - Mobile-first with 44px+ touch targets
 * - High contrast for outdoor/bright sun visibility
 * - Clear visual hierarchy with scannable stats
 * - Native app feel with smooth transitions
 * - Construction-themed with GenHub design system
 *
 * Pattern: Follows MaterialSummary/ExpenseSummary card layout
 *
 * @component
 */
export function PortfolioSummary({
  stats,
  className = '',
}: PortfolioSummaryProps) {
  // Handle empty state when no projects exist
  if (stats.totalProjects === 0) {
    return (
      <div
        className={cn(
          'bg-white dark:bg-gray-900 rounded-xl overflow-hidden',
          'border-2 border-gray-200 dark:border-gray-700 shadow-sm',
          className
        )}
      >
        {/* Header */}
        <div className="px-4 py-3.5 border-b border-gray-100 dark:border-gray-800 bg-gradient-to-r from-gray-50/80 dark:from-gray-800/50 to-white dark:to-gray-900">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-construction-blue dark:bg-construction-blue flex items-center justify-center shadow-sm">
              <Building2 className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-construction-blue dark:text-construction-blue text-sm uppercase tracking-wide">
                Portfolio Summary
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">No projects yet</p>
            </div>
          </div>
        </div>

        {/* Empty State */}
        <div className="p-6 flex flex-col items-center justify-center min-h-[200px]">
          <div className="w-16 h-16 rounded-2xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-4">
            <Building2 className="w-8 h-8 text-gray-300 dark:text-gray-600" />
          </div>
          <p className="text-base font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
            No projects created yet
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400 text-center max-w-[240px]">
            Create your first project to start tracking portfolio performance
          </p>
        </div>
      </div>
    );
  }

  // Calculate budget status
  const isOverBudget = stats.budgetUtilization > 100;
  const isNearBudget = stats.budgetUtilization > 80 && stats.budgetUtilization <= 100;

  // Calculate task completion rate
  const completionRate =
    stats.totalTasks > 0
      ? (stats.completedTasks / stats.totalTasks) * 100
      : 0;

  // Determine overall portfolio health
  const hasDelayedProjects = stats.delayedProjects > 0;
  const hasAtRiskProjects = stats.atRiskProjects > 0;
  const portfolioHealth = isOverBudget || hasDelayedProjects
    ? 'behind'
    : (isNearBudget || hasAtRiskProjects)
      ? 'at-risk'
      : 'on-track';

  // Determine progress bar colors
  const getBudgetColor = () => {
    if (isOverBudget) return 'bg-[#DC2626]';
    if (isNearBudget) return 'bg-[#F59E0B]';
    return 'bg-construction-blue';
  };

  const getCompletionColor = () => {
    if (completionRate >= 100) return 'bg-[#059669]';
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
      <div className="px-4 py-3.5 border-b border-gray-100 dark:border-gray-800 bg-gradient-to-r from-gray-50/80 dark:from-gray-800/50 to-white dark:to-gray-900">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-construction-blue dark:bg-construction-blue flex items-center justify-center shadow-sm">
            <Building2 className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-construction-blue dark:text-construction-blue text-sm uppercase tracking-wide">
              Portfolio Summary
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              {stats.activeProjects} active project{stats.activeProjects !== 1 ? 's' : ''}
            </p>
          </div>
          {/* Quick Status Badge */}
          <div
            className={cn(
              'px-2.5 py-1 rounded-lg text-xs font-bold',
              portfolioHealth === 'behind'
                ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                : portfolioHealth === 'at-risk'
                  ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400'
                  : 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400'
            )}
          >
            {portfolioHealth === 'behind' ? 'Behind' : portfolioHealth === 'at-risk' ? 'At Risk' : 'On Track'}
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
                    ? 'text-construction-red dark:text-construction-red'
                    : isNearBudget
                      ? 'text-construction-yellow dark:text-construction-yellow'
                      : 'text-construction-blue dark:text-construction-blue'
                )}
              >
                {formatPercent(stats.budgetUtilization)}
              </span>
            </div>
            <div className="h-2.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
              <div
                className={cn(
                  'h-full rounded-full transition-all duration-500 ease-out',
                  getBudgetColor()
                )}
                style={{ width: `${Math.min(100, stats.budgetUtilization)}%` }}
              />
            </div>
          </div>

          {/* Task Completion Progress */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Target className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Tasks Completed
                </span>
              </div>
              <span className="text-sm font-bold text-construction-blue dark:text-construction-blue tabular-nums">
                {stats.completedTasks}/{stats.totalTasks}
              </span>
            </div>
            <div className="h-2.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
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
          {/* Total Budget */}
          <StatCard
            label="Total"
            value={`$${formatCompactNumber(stats.totalBudget)}`}
            subtext="Budget"
          />

          {/* Actual Expense */}
          <StatCard
            label="Actual"
            value={`$${formatCompactNumber(stats.totalActualSpent)}`}
            subtext="Expense"
            valueClassName="text-gray-900"
          />

          {/* Variance - Neutral bg with colored icon/dot indicator */}
          <StatCard
            label="Variance"
            value={`${stats.budgetVariance >= 0 ? '+' : '-'}$${formatCompactNumber(Math.abs(stats.budgetVariance))}`}
            subtext={stats.budgetVariance >= 0 ? 'Under' : 'Over'}
            variant={stats.budgetVariance >= 0 ? 'success' : 'danger'}
            showStatusDot
          />
        </div>

        {/* Status Indicators Grid */}
        <div className="grid grid-cols-2 gap-2.5 mb-4">
          {/* On Time Projects */}
          <StatCard
            icon={CheckCircle}
            label="On Time"
            value={stats.onTimeProjects}
            subtext={`${stats.totalProjects} total`}
            variant="success"
            showStatusDot
          />

          {/* At Risk Projects */}
          <StatCard
            icon={AlertTriangle}
            label="At Risk"
            value={stats.atRiskProjects}
            subtext={stats.atRiskProjects > 0 ? 'Needs attention' : 'All clear'}
            variant={stats.atRiskProjects > 0 ? 'warning' : 'success'}
            showStatusDot
          />

          {/* Overdue Tasks */}
          <StatCard
            icon={Clock}
            label="Overdue Tasks"
            value={stats.overdueTasks}
            subtext={stats.overdueTasks > 0 ? 'Past due' : 'On schedule'}
            variant={stats.overdueTasks > 0 ? 'danger' : 'success'}
            showStatusDot
          />

          {/* Delayed Projects */}
          <StatCard
            icon={AlertCircle}
            label="Delayed"
            value={stats.delayedProjects}
            subtext={stats.delayedProjects > 0 ? 'Behind schedule' : 'On track'}
            variant={stats.delayedProjects > 0 ? 'danger' : 'success'}
            showStatusDot
          />
        </div>

        {/* Budget Warning Banner */}
        {(isOverBudget || isNearBudget) && (
          <div
            className={cn(
              'flex items-center gap-3 p-3 rounded-xl mb-4',
              'transition-all duration-200',
              isOverBudget
                ? 'bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-900/40'
                : 'bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-900/40'
            )}
          >
            <div
              className={cn(
                'w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0',
                isOverBudget ? 'bg-red-100 dark:bg-red-900/50' : 'bg-amber-100 dark:bg-amber-900/50'
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
                  ? `Portfolio over budget by $${Math.abs(stats.budgetVariance).toLocaleString()}`
                  : 'Approaching budget limit'}
              </p>
              <p
                className={cn(
                  'text-xs mt-0.5',
                  isOverBudget ? 'text-red-600 dark:text-red-400' : 'text-amber-600 dark:text-amber-400'
                )}
              >
                {isOverBudget
                  ? 'Review project costs to get back on track'
                  : `${formatPercent(stats.budgetUtilization)} of total budget used`}
              </p>
            </div>
          </div>
        )}

        {/* Top Projects Section */}
        {stats.topProjects.length > 0 && (
          <div className="pt-4 border-t border-gray-100 dark:border-gray-800">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Top Projects
                </span>
              </div>
              <span className="text-[11px] text-gray-400 dark:text-gray-500">
                by completion
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              {stats.topProjects.map((project, index) => (
                <div
                  key={project.id}
                  className={cn(
                    'flex items-center gap-2.5 px-3 py-2.5',
                    'bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl',
                    'min-h-[44px]', // Touch-friendly
                    'active:scale-[0.98] active:bg-gray-100 dark:active:bg-gray-700',
                    'transition-all duration-150'
                  )}
                >
                  <div className="w-7 h-7 rounded-full bg-construction-blue dark:bg-blue-500 flex items-center justify-center">
                    <span className="text-xs text-white font-bold">
                      {index + 1}
                    </span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm font-semibold text-gray-900 dark:text-gray-100 leading-tight truncate max-w-[120px]">
                      {project.name}
                    </span>
                    <span className="text-[11px] text-gray-500 dark:text-gray-400">
                      {formatPercentWhole(project.completionPercentage)} complete
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
 * Format large numbers in compact form (uses formatBudget without $ sign)
 */
function formatCompactNumber(num: number): string {
  return formatBudget(num, false);
}
