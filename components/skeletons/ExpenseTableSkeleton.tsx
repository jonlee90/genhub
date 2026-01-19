/**
 * ExpenseTableSkeleton Component
 *
 * Loading placeholder for expense table/list views.
 * Displays 5 rows by default.
 *
 * Features:
 * - Desktop: Table layout
 * - Mobile: Card layout
 * - Shimmer effect with animate-pulse
 * - Responsive design
 * - Accessible with ARIA labels
 */

import { cn } from '@/lib/utils';

interface ExpenseTableSkeletonProps {
  /** Number of rows to show (default: 5) */
  rows?: number;
  /** Additional className */
  className?: string;
}

export function ExpenseTableSkeleton({
  rows = 5,
  className,
}: ExpenseTableSkeletonProps) {
  return (
    <div role="status" aria-label="Loading expenses" className={className}>
      {/* Desktop: Table view */}
      <div className="hidden md:block">
        <div className="bg-white rounded-xl border-2 border-gray-200 shadow-sm overflow-hidden">
          {/* Table header */}
          <div className="bg-gray-50 border-b-2 border-gray-200 px-4 py-3">
            <div className="grid grid-cols-6 gap-4">
              <div className="h-4 bg-gray-200 rounded animate-pulse" />
              <div className="h-4 bg-gray-200 rounded animate-pulse" />
              <div className="h-4 bg-gray-200 rounded animate-pulse" />
              <div className="h-4 bg-gray-200 rounded animate-pulse" />
              <div className="h-4 bg-gray-200 rounded animate-pulse" />
              <div className="h-4 bg-gray-200 rounded animate-pulse" />
            </div>
          </div>

          {/* Table rows */}
          <div className="divide-y divide-gray-100">
            {Array.from({ length: rows }).map((_, i) => (
              <ExpenseTableRowSkeleton key={i} />
            ))}
          </div>
        </div>
      </div>

      {/* Mobile: Card view */}
      <div className="md:hidden space-y-3">
        {Array.from({ length: rows }).map((_, i) => (
          <ExpenseCardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}

/**
 * ExpenseTableRowSkeleton Component
 *
 * Single table row skeleton (desktop)
 */
function ExpenseTableRowSkeleton() {
  return (
    <div className="px-4 py-4 animate-pulse">
      <div className="grid grid-cols-6 gap-4 items-center">
        {/* Date */}
        <div className="h-4 w-20 bg-gray-200 rounded" />

        {/* Vendor */}
        <div className="space-y-1">
          <div className="h-4 w-full bg-gray-200 rounded" />
          <div className="h-3 w-3/4 bg-gray-200 rounded" />
        </div>

        {/* Category */}
        <div className="h-5 w-16 bg-gray-200 rounded" />

        {/* Amount */}
        <div className="h-5 w-20 bg-gray-200 rounded font-semibold" />

        {/* Status */}
        <div className="h-5 w-20 bg-gray-200 rounded" />

        {/* Actions */}
        <div className="flex items-center gap-2 justify-end">
          <div className="h-8 w-8 bg-gray-200 rounded" />
          <div className="h-8 w-8 bg-gray-200 rounded" />
        </div>
      </div>
    </div>
  );
}

/**
 * ExpenseCardSkeleton Component
 *
 * Single card skeleton (mobile)
 */
function ExpenseCardSkeleton() {
  return (
    <div
      className={cn(
        'bg-white rounded-xl p-4 border-2 border-gray-200 shadow-sm',
        'animate-pulse'
      )}
    >
      {/* Amount + Status */}
      <div className="flex items-center justify-between mb-3">
        <div className="h-6 w-24 bg-gray-200 rounded" />
        <div className="h-5 w-16 bg-gray-200 rounded" />
      </div>

      {/* Vendor */}
      <div className="space-y-1.5 mb-3">
        <div className="h-4 w-40 bg-gray-200 rounded" />
        <div className="h-3 w-32 bg-gray-200 rounded" />
      </div>

      {/* Date + Category */}
      <div className="flex items-center justify-between mb-3">
        <div className="h-4 w-20 bg-gray-200 rounded" />
        <div className="h-4 w-24 bg-gray-200 rounded" />
      </div>

      {/* Divider */}
      <div className="h-px bg-gray-100 my-3" />

      {/* Actions */}
      <div className="flex items-center justify-end gap-2">
        <div className="h-9 w-20 bg-gray-200 rounded-lg" />
        <div className="h-9 w-20 bg-gray-200 rounded-lg" />
      </div>
    </div>
  );
}

/**
 * ExpenseStatsSkeleton Component
 *
 * Skeleton for expense summary stats
 */
export function ExpenseStatsSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      {Array.from({ length: 3 }).map((_, i) => (
        <div
          key={i}
          className="bg-white rounded-xl p-4 border-2 border-gray-200 shadow-sm animate-pulse"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gray-200 rounded-xl" />
            <div className="flex-1 space-y-2">
              <div className="h-3 w-20 bg-gray-200 rounded" />
              <div className="h-5 w-24 bg-gray-200 rounded" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
