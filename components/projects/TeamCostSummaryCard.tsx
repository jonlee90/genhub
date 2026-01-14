'use client';

import { Users, RefreshCw, AlertCircle } from 'lucide-react';
import { InfoCard } from './InfoCard';
import { TeamCostRow, type TeamCostSummary } from './TeamCostRow';
import { Button } from '@/components/ui/button';
import { cn, formatCurrency } from '@/lib/utils';

/**
 * Props for TeamCostSummaryCard component
 */
export interface TeamCostSummaryCardProps {
  /** Team cost summaries to display */
  summaries: TeamCostSummary[];
  /** Loading state */
  loading?: boolean;
  /** Error message */
  error?: string | null;
  /** Callback to retry fetching data */
  onRetry?: () => void;
  /** Optional className for styling */
  className?: string;
}

/**
 * TeamCostSummaryCard - Card displaying all team member costs
 *
 * Features:
 * - Uses InfoCard pattern from ProjectOverview
 * - Header with Users icon
 * - Maps TeamCostRow for each summary
 * - Totals row at bottom
 * - Loading: skeleton placeholders
 * - Error: message with retry button
 * - Empty: "No team members assigned"
 */
export function TeamCostSummaryCard({
  summaries,
  loading = false,
  error = null,
  onRetry,
  className,
}: TeamCostSummaryCardProps) {
  // Calculate totals
  const totals = summaries.reduce(
    (acc, summary) => ({
      taskCount: acc.taskCount + summary.taskCount,
      taskCosts: acc.taskCosts + summary.taskCosts,
      expenseCosts: acc.expenseCosts + summary.expenseCosts,
    }),
    { taskCount: 0, taskCosts: 0, expenseCosts: 0 }
  );

  // Loading state
  if (loading) {
    return (
      <div className={cn('bg-white border-2 border-gray-200 rounded-xl shadow-sm', className)}>
        {/* Header Skeleton */}
        <div className="px-4 py-3.5 border-b border-gray-100 bg-gradient-to-r from-gray-50/80 to-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gray-200 animate-pulse" />
            <div className="flex-1">
              <div className="h-4 w-24 bg-gray-200 rounded animate-pulse" />
              <div className="h-3 w-32 bg-gray-100 rounded animate-pulse mt-1" />
            </div>
          </div>
        </div>

        {/* Content Skeleton */}
        <div className="p-4 space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-3 py-2">
              <div className="w-10 h-10 rounded-full bg-gray-200 animate-pulse" />
              <div className="flex-1">
                <div className="h-4 w-32 bg-gray-200 rounded animate-pulse" />
                <div className="h-3 w-48 bg-gray-100 rounded animate-pulse mt-1" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className={cn('bg-white border-2 border-gray-200 rounded-xl shadow-sm', className)}>
        {/* Header */}
        <div className="px-4 py-3.5 border-b border-gray-100 bg-gradient-to-r from-gray-50/80 to-white">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-[#001B51]">
              <Users className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#001B51] uppercase tracking-wide">
                Team Costs
              </h3>
              <p className="text-xs text-gray-500">Cost breakdown by team member</p>
            </div>
          </div>
        </div>

        {/* Error Content */}
        <div className="p-6 text-center">
          <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-red-50 flex items-center justify-center">
            <AlertCircle className="w-6 h-6 text-red-500" />
          </div>
          <p className="text-sm text-gray-600 mb-4">{error}</p>
          {onRetry && (
            <Button
              variant="outline"
              size="sm"
              onClick={onRetry}
              className="min-h-[44px] px-4 active:scale-[0.98]"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Retry
            </Button>
          )}
        </div>
      </div>
    );
  }

  // Empty state
  if (summaries.length === 0) {
    return (
      <div className={cn('bg-white border-2 border-gray-200 rounded-xl shadow-sm', className)}>
        {/* Header */}
        <div className="px-4 py-3.5 border-b border-gray-100 bg-gradient-to-r from-gray-50/80 to-white">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-[#001B51]">
              <Users className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#001B51] uppercase tracking-wide">
                Team Costs
              </h3>
              <p className="text-xs text-gray-500">Cost breakdown by team member</p>
            </div>
          </div>
        </div>

        {/* Empty Content */}
        <div className="py-8 px-4 text-center">
          <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-gray-100 flex items-center justify-center">
            <Users className="w-6 h-6 text-gray-400" />
          </div>
          <p className="text-sm font-medium text-gray-700">No team members assigned</p>
          <p className="text-xs text-gray-500 mt-1">Assign team members to see cost breakdown</p>
        </div>
      </div>
    );
  }

  // Normal state with data
  return (
    <div className={cn('bg-white border-2 border-gray-200 rounded-xl shadow-sm overflow-hidden', className)}>
      {/* Header */}
      <div className="px-4 py-3.5 border-b border-gray-100 bg-gradient-to-r from-gray-50/80 to-white">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-[#001B51] shadow-sm">
            <Users className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-bold text-[#001B51] uppercase tracking-wide">
              Team Costs
            </h3>
            <p className="text-xs text-gray-500 truncate">
              {summaries.length} member{summaries.length !== 1 ? 's' : ''} with costs
            </p>
          </div>
        </div>
      </div>

      {/* Team Member Rows */}
      <div className="divide-y divide-gray-100">
        {summaries.map((summary) => (
          <TeamCostRow key={summary.id} summary={summary} />
        ))}
      </div>

      {/* Totals Row */}
      {summaries.length > 0 && (
        <div className="px-4 py-3 bg-gray-50 border-t-2 border-gray-200">
          <div className="flex items-center justify-between">
            <span className="text-sm font-bold text-gray-700">Total</span>
            <div className="text-right">
              <span className="text-sm font-bold text-[#001B51]">
                {formatCurrency(totals.taskCosts + totals.expenseCosts)}
              </span>
              <p className="text-xs text-gray-500">
                {totals.taskCount} task{totals.taskCount !== 1 ? 's' : ''} |{' '}
                {formatCurrency(totals.taskCosts)} tasks |{' '}
                {formatCurrency(totals.expenseCosts)} expenses
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
