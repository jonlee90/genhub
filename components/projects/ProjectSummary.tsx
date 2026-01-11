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

interface ProjectSummaryProps {
  portfolioStats: PortfolioSummaryStats;
  className?: string;
}

/**
 * ProjectSummary Component - Portfolio-Level Analytics
 *
 * A premium, mobile-first portfolio analytics card designed for construction
 * general contractors. Mirrors the design of ProjectTaskSummary but displays
 * aggregate metrics across all projects.
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
export function ProjectSummary({
  portfolioStats,
  className = '',
}: ProjectSummaryProps) {
  // Handle empty state when no projects exist
  if (portfolioStats.totalProjects === 0) {
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
              <Building2 className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-[#001B51] text-sm uppercase tracking-wide">
                Portfolio Summary
              </h3>
              <p className="text-xs text-gray-500 mt-0.5">No projects yet</p>
            </div>
          </div>
        </div>

        {/* Empty State */}
        <div className="p-6 flex flex-col items-center justify-center min-h-[200px]">
          <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mb-4">
            <Building2 className="w-8 h-8 text-gray-300" />
          </div>
          <p className="text-base font-semibold text-gray-700 mb-1.5">
            No projects created yet
          </p>
          <p className="text-sm text-gray-500 text-center max-w-[240px]">
            Create your first project to start tracking portfolio performance
          </p>
        </div>
      </div>
    );
  }

  // Calculate budget status
  const isOverBudget = portfolioStats.budgetUtilization > 100;
  const isNearBudget = portfolioStats.budgetUtilization > 80 && portfolioStats.budgetUtilization <= 100;

  // Calculate task completion rate
  const completionRate =
    portfolioStats.totalTasks > 0
      ? (portfolioStats.completedTasks / portfolioStats.totalTasks) * 100
      : 0;

  // Determine overall portfolio health
  const hasDelayedProjects = portfolioStats.delayedProjects > 0;
  const hasAtRiskProjects = portfolioStats.atRiskProjects > 0;
  const portfolioHealth = isOverBudget || hasDelayedProjects
    ? 'behind'
    : (isNearBudget || hasAtRiskProjects)
      ? 'at-risk'
      : 'on-track';

  // Determine progress bar colors
  const getBudgetColor = () => {
    if (isOverBudget) return 'bg-[#DC2626]';
    if (isNearBudget) return 'bg-[#F59E0B]';
    return 'bg-[#001B51]';
  };

  const getCompletionColor = () => {
    if (completionRate >= 100) return 'bg-[#059669]';
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
            <Building2 className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-[#001B51] text-sm uppercase tracking-wide">
              Portfolio Summary
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">
              {portfolioStats.activeProjects} active project{portfolioStats.activeProjects !== 1 ? 's' : ''}
            </p>
          </div>
          {/* Quick Status Badge */}
          <div
            className={cn(
              'px-2.5 py-1 rounded-lg text-xs font-bold',
              portfolioHealth === 'behind'
                ? 'bg-red-100 text-red-700'
                : portfolioHealth === 'at-risk'
                  ? 'bg-amber-100 text-amber-700'
                  : 'bg-emerald-100 text-emerald-700'
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
                {formatPercent(portfolioStats.budgetUtilization)}
              </span>
            </div>
            <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
              <div
                className={cn(
                  'h-full rounded-full transition-all duration-500 ease-out',
                  getBudgetColor()
                )}
                style={{ width: `${Math.min(100, portfolioStats.budgetUtilization)}%` }}
              />
            </div>
          </div>

          {/* Task Completion Progress */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Target className="w-4 h-4 text-gray-500" />
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Tasks Completed
                </span>
              </div>
              <span className="text-sm font-bold text-[#001B51] tabular-nums">
                {portfolioStats.completedTasks}/{portfolioStats.totalTasks}
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
          {/* Total Budget */}
          <div className="flex flex-col p-3 rounded-xl bg-gray-50 border border-gray-200 min-h-[76px]">
            <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1">
              Total
            </span>
            <span className="text-base font-bold text-[#001B51] leading-tight">
              ${formatCompactNumber(portfolioStats.totalBudget)}
            </span>
            <span className="text-[10px] text-gray-500 mt-0.5">Budget</span>
          </div>

          {/* Actual Spent */}
          <div className="flex flex-col p-3 rounded-xl bg-gray-50 border border-gray-200 min-h-[76px]">
            <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1">
              Actual
            </span>
            <span className="text-base font-bold text-gray-900 leading-tight">
              ${formatCompactNumber(portfolioStats.totalActualSpent)}
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
                  portfolioStats.budgetVariance >= 0 ? 'bg-[#059669]' : 'bg-[#DC2626]'
                )}
              />
              <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">
                Variance
              </span>
            </div>
            <span className="text-base font-bold text-[#001B51] leading-tight">
              {portfolioStats.budgetVariance >= 0 ? '+' : '-'}$
              {formatCompactNumber(Math.abs(portfolioStats.budgetVariance))}
            </span>
            <span className="text-[10px] text-gray-500 mt-0.5">
              {portfolioStats.budgetVariance >= 0 ? 'Under' : 'Over'}
            </span>
          </div>
        </div>

        {/* Status Indicators Grid */}
        <div className="grid grid-cols-2 gap-2.5 mb-4">
          {/* On Time Projects */}
          <StatusCard
            icon={CheckCircle}
            label="On Time"
            value={portfolioStats.onTimeProjects}
            subtext={`${portfolioStats.totalProjects} total`}
            variant="success"
          />

          {/* At Risk Projects */}
          <StatusCard
            icon={AlertTriangle}
            label="At Risk"
            value={portfolioStats.atRiskProjects}
            subtext={portfolioStats.atRiskProjects > 0 ? 'Needs attention' : 'All clear'}
            variant={portfolioStats.atRiskProjects > 0 ? 'warning' : 'success'}
          />

          {/* Overdue Tasks */}
          <StatusCard
            icon={Clock}
            label="Overdue Tasks"
            value={portfolioStats.overdueTasks}
            subtext={portfolioStats.overdueTasks > 0 ? 'Past due' : 'On schedule'}
            variant={portfolioStats.overdueTasks > 0 ? 'danger' : 'success'}
          />

          {/* Delayed Projects */}
          <StatusCard
            icon={AlertCircle}
            label="Delayed"
            value={portfolioStats.delayedProjects}
            subtext={portfolioStats.delayedProjects > 0 ? 'Behind schedule' : 'On track'}
            variant={portfolioStats.delayedProjects > 0 ? 'danger' : 'success'}
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
                  ? `Portfolio over budget by $${Math.abs(portfolioStats.budgetVariance).toLocaleString()}`
                  : 'Approaching budget limit'}
              </p>
              <p
                className={cn(
                  'text-xs mt-0.5',
                  isOverBudget ? 'text-red-600' : 'text-amber-600'
                )}
              >
                {isOverBudget
                  ? 'Review project costs to get back on track'
                  : `${formatPercent(portfolioStats.budgetUtilization)} of total budget used`}
              </p>
            </div>
          </div>
        )}

        {/* Top Projects Section */}
        {portfolioStats.topProjects.length > 0 && (
          <div className="pt-4 border-t border-gray-100">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-gray-500" />
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Top Projects
                </span>
              </div>
              <span className="text-[11px] text-gray-400">
                by completion
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              {portfolioStats.topProjects.map((project, index) => (
                <div
                  key={project.id}
                  className={cn(
                    'flex items-center gap-2.5 px-3 py-2.5',
                    'bg-gray-50 border border-gray-100 rounded-xl',
                    'min-h-[44px]', // Touch-friendly
                    'active:scale-[0.98] active:bg-gray-100',
                    'transition-all duration-150'
                  )}
                >
                  <div className="w-7 h-7 rounded-full bg-[#001B51] flex items-center justify-center">
                    <span className="text-xs text-white font-bold">
                      {index + 1}
                    </span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm font-semibold text-gray-900 leading-tight truncate max-w-[120px]">
                      {project.name}
                    </span>
                    <span className="text-[11px] text-gray-500">
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
 * StatusCard - Compact status indicator with visual feedback
 * Memoized to prevent unnecessary re-renders
 */
interface StatusCardProps {
  icon: typeof CheckCircle;
  label: string;
  value: number;
  subtext: string;
  variant: 'success' | 'danger' | 'warning' | 'neutral';
}

// Dot color lookup (static)
const DOT_COLORS = {
  success: 'bg-[#059669]',
  danger: 'bg-[#DC2626]',
  warning: 'bg-[#F59E0B]',
  neutral: 'bg-gray-400',
} as const;

const StatusCard = memo(function StatusCard({
  icon: Icon,
  label,
  value,
  subtext,
  variant,
}: StatusCardProps) {
  // Determine effective dot color based on variant and value
  const getDotColor = () => {
    if (variant === 'danger' && value === 0) return DOT_COLORS.success;
    if (variant === 'warning' && value === 0) return DOT_COLORS.success;
    if (variant === 'success' && value === 0) return DOT_COLORS.neutral;
    return DOT_COLORS[variant];
  };

  return (
    <div className="flex flex-col p-3 rounded-xl min-h-[76px] bg-gray-50 border border-gray-200">
      <div className="flex items-center gap-1.5 mb-1">
        <span className={cn('w-2 h-2 rounded-full flex-shrink-0', getDotColor())} />
        <Icon className="w-3.5 h-3.5 text-gray-500" />
        <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">
          {label}
        </span>
      </div>
      <span className="text-xl font-bold leading-tight text-[#001B51]">{value}</span>
      <span className="text-[10px] mt-0.5 text-gray-500">{subtext}</span>
    </div>
  );
});

/**
 * Format large numbers in compact form (uses formatBudget without $ sign)
 */
function formatCompactNumber(num: number): string {
  return formatBudget(num, false);
}
