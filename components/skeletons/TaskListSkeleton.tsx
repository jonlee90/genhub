/**
 * TaskListSkeleton Component
 *
 * Loading placeholder for task lists (matches TaskCard layout).
 * Displays 3 skeleton cards by default.
 *
 * Features:
 * - Matches TaskCard dimensions exactly
 * - Shimmer effect with animate-pulse
 * - Border-left accent like real cards
 * - Mobile-optimized spacing
 * - Accessible with ARIA labels
 */

import { cn } from '@/lib/utils';

interface TaskListSkeletonProps {
  /** Number of skeleton cards to show (default: 3) */
  count?: number;
  /** Additional className */
  className?: string;
}

export function TaskListSkeleton({ count = 3, className }: TaskListSkeletonProps) {
  return (
    <div
      role="status"
      aria-label="Loading tasks"
      className={cn('space-y-3', className)}
    >
      {Array.from({ length: count }).map((_, i) => (
        <TaskCardSkeleton key={i} />
      ))}
    </div>
  );
}

/**
 * TaskCardSkeleton Component
 *
 * Single task card skeleton
 */
function TaskCardSkeleton() {
  return (
    <div
      className={cn(
        'bg-white rounded-xl p-4 border-l-4 border-gray-200',
        'shadow-sm animate-pulse'
      )}
    >
      {/* Type badge */}
      <div className="mb-2">
        <div className="h-6 w-16 bg-gray-200 rounded" />
      </div>

      {/* Title + Priority */}
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="flex-1 space-y-2">
          <div className="h-4 w-full bg-gray-200 rounded" />
          <div className="h-4 w-3/4 bg-gray-200 rounded" />
        </div>
        <div className="h-5 w-14 bg-gray-200 rounded shrink-0" />
      </div>

      {/* Project/Phase info */}
      <div className="flex items-center gap-1 mb-3">
        <div className="h-3 w-3 bg-gray-200 rounded" />
        <div className="h-3 w-32 bg-gray-200 rounded" />
      </div>

      {/* Footer: Status, Date, Assignee */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="h-5 w-20 bg-gray-200 rounded" />
          <div className="h-4 w-16 bg-gray-200 rounded" />
        </div>
        <div className="h-6 w-6 bg-gray-200 rounded-full" />
      </div>
    </div>
  );
}

/**
 * TaskBoardSkeleton Component
 *
 * Skeleton for Kanban board view
 */
interface TaskBoardSkeletonProps {
  columns?: number;
  cardsPerColumn?: number;
  className?: string;
}

export function TaskBoardSkeleton({
  columns = 3,
  cardsPerColumn = 2,
  className,
}: TaskBoardSkeletonProps) {
  return (
    <div
      role="status"
      aria-label="Loading task board"
      className={cn(
        'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4',
        className
      )}
    >
      {Array.from({ length: columns }).map((_, colIndex) => (
        <div key={colIndex} className="space-y-3">
          {/* Column header */}
          <div className="bg-white rounded-xl p-4 border-2 border-gray-200 animate-pulse">
            <div className="flex items-center justify-between">
              <div className="h-5 w-24 bg-gray-200 rounded" />
              <div className="h-5 w-8 bg-gray-200 rounded" />
            </div>
          </div>

          {/* Cards in column */}
          <div className="space-y-3">
            {Array.from({ length: cardsPerColumn }).map((_, cardIndex) => (
              <TaskCardSkeleton key={cardIndex} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
