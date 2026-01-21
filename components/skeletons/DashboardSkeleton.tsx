/**
 * DashboardSkeleton Component
 *
 * Full dashboard layout loading state.
 * Matches the complete dashboard structure.
 *
 * Features:
 * - KPI cards section
 * - Stats grid
 * - Activity feed
 * - Charts placeholders
 * - Responsive layout
 * - Shimmer effect with animate-pulse
 * - Accessible with ARIA labels
 */

import { cn } from '@/lib/utils';

interface DashboardSkeletonProps {
  className?: string;
}

export function DashboardSkeleton({ className }: DashboardSkeletonProps) {
  return (
    <div
      role="status"
      aria-label="Loading dashboard"
      className={cn('space-y-6', className)}
    >
      {/* Header section */}
      <div className="animate-pulse">
        <div className="h-8 w-48 bg-gray-200 dark:bg-gray-700 rounded mb-2" />
        <div className="h-4 w-64 bg-gray-200 dark:bg-gray-700 rounded" />
      </div>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <KPICardSkeleton key={i} />
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column - 2/3 width */}
        <div className="lg:col-span-2 space-y-6">
          {/* Chart widget */}
          <ChartWidgetSkeleton />

          {/* Activity feed */}
          <ActivityFeedSkeleton />
        </div>

        {/* Right column - 1/3 width */}
        <div className="space-y-6">
          {/* Quick stats */}
          <QuickStatsSkeleton />

          {/* Recent items */}
          <RecentItemsSkeleton />
        </div>
      </div>
    </div>
  );
}

/**
 * KPICardSkeleton Component
 *
 * Skeleton for KPI metric cards
 */
function KPICardSkeleton() {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl p-5 border-2 border-gray-200 dark:border-gray-700 shadow-sm animate-pulse">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 space-y-2">
          <div className="h-3 w-20 bg-gray-200 dark:bg-gray-700 rounded" />
          <div className="h-7 w-24 bg-gray-200 dark:bg-gray-700 rounded" />
        </div>
        <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-xl" />
      </div>

      {/* Trend indicator */}
      <div className="flex items-center gap-1">
        <div className="w-4 h-4 bg-gray-200 dark:bg-gray-700 rounded" />
        <div className="h-3 w-16 bg-gray-200 dark:bg-gray-700 rounded" />
      </div>
    </div>
  );
}

/**
 * ChartWidgetSkeleton Component
 *
 * Skeleton for chart/graph widgets
 */
function ChartWidgetSkeleton() {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl p-6 border-2 border-gray-200 dark:border-gray-700 shadow-sm animate-pulse">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="space-y-2">
          <div className="h-5 w-32 bg-gray-200 dark:bg-gray-700 rounded" />
          <div className="h-3 w-48 bg-gray-200 dark:bg-gray-700 rounded" />
        </div>
        <div className="h-9 w-24 bg-gray-200 dark:bg-gray-700 rounded-lg" />
      </div>

      {/* Chart area */}
      <div className="space-y-3">
        {/* Y-axis labels and bars */}
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3">
            <div className="h-3 w-12 bg-gray-200 dark:bg-gray-700 rounded" />
            <div
              className="h-8 bg-gray-200 dark:bg-gray-700 rounded"
              style={{
                width: `${Math.random() * 60 + 20}%`,
              }}
            />
          </div>
        ))}
      </div>

      {/* X-axis */}
      <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100 dark:border-gray-800">
        {Array.from({ length: 7 }).map((_, i) => (
          <div key={i} className="h-3 w-8 bg-gray-200 dark:bg-gray-700 rounded" />
        ))}
      </div>
    </div>
  );
}

/**
 * ActivityFeedSkeleton Component
 *
 * Skeleton for activity/timeline feed
 */
function ActivityFeedSkeleton() {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl p-6 border-2 border-gray-200 dark:border-gray-700 shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between mb-5 animate-pulse">
        <div className="h-5 w-32 bg-gray-200 dark:bg-gray-700 rounded" />
        <div className="h-4 w-16 bg-gray-200 dark:bg-gray-700 rounded" />
      </div>

      {/* Activity items */}
      <div className="space-y-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-start gap-3 animate-pulse">
            <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-full shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-full bg-gray-200 dark:bg-gray-700 rounded" />
              <div className="h-3 w-3/4 bg-gray-200 dark:bg-gray-700 rounded" />
              <div className="h-3 w-20 bg-gray-200 dark:bg-gray-700 rounded" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * QuickStatsSkeleton Component
 *
 * Skeleton for quick stats widget
 */
function QuickStatsSkeleton() {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl p-5 border-2 border-gray-200 dark:border-gray-700 shadow-sm">
      {/* Header */}
      <div className="mb-4 animate-pulse">
        <div className="h-5 w-28 bg-gray-200 dark:bg-gray-700 rounded" />
      </div>

      {/* Stats list */}
      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-gray-800 last:border-0 animate-pulse">
            <div className="space-y-1.5">
              <div className="h-3 w-20 bg-gray-200 dark:bg-gray-700 rounded" />
              <div className="h-5 w-16 bg-gray-200 dark:bg-gray-700 rounded" />
            </div>
            <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-lg" />
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * RecentItemsSkeleton Component
 *
 * Skeleton for recent items list
 */
function RecentItemsSkeleton() {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl p-5 border-2 border-gray-200 dark:border-gray-700 shadow-sm">
      {/* Header */}
      <div className="mb-4 animate-pulse">
        <div className="h-5 w-32 bg-gray-200 dark:bg-gray-700 rounded" />
      </div>

      {/* Items list */}
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-800 animate-pulse">
            <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded shrink-0" />
            <div className="flex-1 space-y-1.5">
              <div className="h-4 w-full bg-gray-200 dark:bg-gray-700 rounded" />
              <div className="h-3 w-2/3 bg-gray-200 dark:bg-gray-700 rounded" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * DashboardWidgetSkeleton Component
 *
 * Generic widget skeleton for custom dashboard layouts
 */
export function DashboardWidgetSkeleton() {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl p-6 border-2 border-gray-200 dark:border-gray-700 shadow-sm animate-pulse">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-xl" />
        <div className="flex-1 space-y-2">
          <div className="h-5 w-32 bg-gray-200 dark:bg-gray-700 rounded" />
          <div className="h-3 w-48 bg-gray-200 dark:bg-gray-700 rounded" />
        </div>
      </div>

      {/* Content */}
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-4 w-full bg-gray-200 dark:bg-gray-700 rounded" />
        ))}
      </div>
    </div>
  );
}
