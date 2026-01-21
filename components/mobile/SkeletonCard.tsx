'use client';

import { cn } from '@/lib/utils';

type SkeletonVariant = 'task' | 'project' | 'expense' | 'material' | 'team';

interface SkeletonCardProps {
  /** The type of card to render skeleton for */
  variant?: SkeletonVariant;
  /** Additional className */
  className?: string;
}

/**
 * SkeletonCard - Loading placeholder cards that match real card dimensions
 *
 * Features:
 * - Matches exact dimensions of real cards (TaskCard, etc.)
 * - Uses animate-pulse for smooth shimmer effect
 * - 5 variants: task, project, expense, material, team
 */
export function SkeletonCard({ variant = 'task', className }: SkeletonCardProps) {
  // Shimmer bar component
  const Shimmer = ({ className: shimmerClass }: { className?: string }) => (
    <div className={cn('bg-gray-200 dark:bg-gray-700 rounded animate-pulse', shimmerClass)} />
  );

  // Task skeleton - matches TaskCard dimensions
  if (variant === 'task') {
    return (
      <div
        className={cn(
          'bg-white dark:bg-gray-800 rounded-xl p-4 border-l-4 border-gray-200 dark:border-gray-700',
          className
        )}
      >
        {/* Type badge */}
        <div className="mb-2">
          <Shimmer className="h-6 w-16" />
        </div>

        {/* Title + Priority */}
        <div className="flex items-start justify-between gap-3 mb-2">
          <div className="flex-1 space-y-2">
            <Shimmer className="h-4 w-full" />
            <Shimmer className="h-4 w-3/4" />
          </div>
          <Shimmer className="h-5 w-14 shrink-0" />
        </div>

        {/* Project/Phase info */}
        <div className="flex items-center gap-1 mb-3">
          <Shimmer className="h-3 w-3" />
          <Shimmer className="h-3 w-32" />
        </div>

        {/* Footer: Status, Date, Assignee */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shimmer className="h-5 w-20" />
            <Shimmer className="h-4 w-16" />
          </div>
          <Shimmer className="h-6 w-6 rounded-full" />
        </div>
      </div>
    );
  }

  // Project skeleton
  if (variant === 'project') {
    return (
      <div
        className={cn(
          'bg-white dark:bg-gray-800 rounded-xl p-4 border-2 border-gray-200 dark:border-gray-700',
          className
        )}
      >
        {/* Image placeholder */}
        <Shimmer className="h-32 w-full rounded-lg mb-3" />

        {/* Title */}
        <Shimmer className="h-5 w-3/4 mb-2" />

        {/* Address */}
        <Shimmer className="h-4 w-full mb-3" />

        {/* Progress bar */}
        <div className="flex items-center gap-2">
          <div className="flex-1 h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
            <Shimmer className="h-full w-1/2" />
          </div>
          <Shimmer className="h-4 w-8" />
        </div>
      </div>
    );
  }

  // Expense skeleton
  if (variant === 'expense') {
    return (
      <div
        className={cn(
          'bg-white dark:bg-gray-800 rounded-xl p-4 border-2 border-gray-200 dark:border-gray-700',
          className
        )}
      >
        {/* Amount + Status */}
        <div className="flex items-center justify-between mb-3">
          <Shimmer className="h-6 w-24" />
          <Shimmer className="h-5 w-16" />
        </div>

        {/* Vendor */}
        <Shimmer className="h-4 w-40 mb-2" />

        {/* Date + Category */}
        <div className="flex items-center gap-3">
          <Shimmer className="h-4 w-20" />
          <Shimmer className="h-4 w-24" />
        </div>
      </div>
    );
  }

  // Material skeleton
  if (variant === 'material') {
    return (
      <div
        className={cn(
          'bg-white dark:bg-gray-800 rounded-xl p-4 border-2 border-gray-200 dark:border-gray-700',
          className
        )}
      >
        {/* Name */}
        <Shimmer className="h-5 w-3/4 mb-2" />

        {/* Category badge */}
        <Shimmer className="h-5 w-20 mb-3" />

        {/* Quantity + Unit Price */}
        <div className="flex items-center justify-between">
          <Shimmer className="h-4 w-16" />
          <Shimmer className="h-4 w-20" />
        </div>
      </div>
    );
  }

  // Team member skeleton
  if (variant === 'team') {
    return (
      <div
        className={cn(
          'bg-white dark:bg-gray-800 rounded-xl p-4 border-2 border-gray-200 dark:border-gray-700',
          className
        )}
      >
        <div className="flex items-center gap-3">
          {/* Avatar */}
          <Shimmer className="h-12 w-12 rounded-full shrink-0" />

          <div className="flex-1 min-w-0">
            {/* Name */}
            <Shimmer className="h-5 w-32 mb-2" />

            {/* Role */}
            <Shimmer className="h-4 w-24" />
          </div>

          {/* Status badge */}
          <Shimmer className="h-5 w-16 shrink-0" />
        </div>
      </div>
    );
  }

  // Default fallback (same as task)
  return (
    <div
      className={cn(
        'bg-white dark:bg-gray-800 rounded-xl p-4 border-2 border-gray-200 dark:border-gray-700',
        className
      )}
    >
      <Shimmer className="h-5 w-3/4 mb-3" />
      <Shimmer className="h-4 w-full mb-2" />
      <Shimmer className="h-4 w-2/3" />
    </div>
  );
}
