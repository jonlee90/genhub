/**
 * Skeleton loading states for ProjectOverview deferred data
 * Used while background loading expense stats, task stats, and team costs
 */

export function ProjectTaskSummarySkeleton() {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl border-2 border-gray-200 dark:border-gray-700 shadow-construction-lg p-6 animate-pulse">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-xl" />
        <div className="flex-1">
          <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-32 mb-2" />
          <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-48" />
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="space-y-2">
            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-20" />
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-16" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function ProjectExpenseSummarySkeleton() {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl border-2 border-gray-200 dark:border-gray-700 shadow-construction-lg p-6 animate-pulse">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-xl" />
        <div className="flex-1">
          <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-32 mb-2" />
          <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-48" />
        </div>
      </div>

      {/* Progress Bar */}
      <div className="space-y-3 mb-6">
        <div className="flex items-center justify-between">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24" />
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-20" />
        </div>
        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded-full w-full" />
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="space-y-2">
            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-16" />
            <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-24" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function TeamCostSummaryCardSkeleton() {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl border-2 border-gray-200 dark:border-gray-700 shadow-construction-lg p-5 animate-pulse">
      {/* Header */}
      <div className="flex items-center gap-3 mb-5 pb-4 border-b-2 border-gray-100">
        <div className="w-9 h-9 bg-gray-200 dark:bg-gray-700 rounded-xl" />
        <div className="flex-1">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-28 mb-2" />
          <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-36" />
        </div>
      </div>

      {/* Team Member List */}
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="flex items-center gap-3 pb-4 border-b border-gray-100 last:border-0 last:pb-0"
          >
            <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-full flex-shrink-0" />
            <div className="flex-1 min-w-0 space-y-2">
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24" />
              <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-16" />
            </div>
            <div className="text-right space-y-2">
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-20" />
              <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-16" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
