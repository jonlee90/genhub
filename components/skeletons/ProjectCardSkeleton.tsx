/**
 * ProjectCardSkeleton Component
 *
 * Loading placeholder that matches ProjectCard exact layout.
 * Used during data fetching and navigation transitions.
 *
 * Features:
 * - Matches ProjectCard dimensions exactly
 * - Shimmer effect with animate-pulse
 * - Responsive sizing (mobile/desktop)
 * - Dark/light mode support
 * - Accessible with ARIA labels
 */

import { cn } from '@/lib/utils';

interface ProjectCardSkeletonProps {
  className?: string;
}

export function ProjectCardSkeleton({ className }: ProjectCardSkeletonProps) {
  return (
    <div
      role="status"
      aria-label="Loading project"
      className={cn(
        'rounded-xl overflow-hidden bg-white border border-gray-200 shadow-sm animate-pulse',
        className
      )}
    >
      {/* Header skeleton - matches construction blue header */}
      <div className="bg-gray-200 px-3 md:px-4 py-2.5 md:py-3">
        <div className="flex items-start justify-between gap-2 md:gap-3">
          <div className="flex-1 space-y-1.5">
            {/* Project type label */}
            <div className="h-2 w-16 bg-gray-300 rounded" />
            {/* Project name */}
            <div className="h-4 md:h-5 w-32 bg-gray-300 rounded" />
          </div>
          {/* Icon placeholder */}
          <div className="w-8 h-8 md:w-10 md:h-10 bg-gray-300 rounded-lg shrink-0" />
        </div>
      </div>

      {/* Hero image skeleton */}
      <div className="h-28 md:h-36 bg-gradient-to-br from-gray-100 to-gray-50" />

      {/* Content section */}
      <div className="p-3 md:p-4 space-y-2.5 md:space-y-3">
        {/* Client & Budget row */}
        <div className="flex items-start justify-between gap-3 md:gap-4">
          <div className="flex-1 space-y-1.5">
            <div className="h-2 w-10 bg-gray-200 rounded" />
            <div className="h-4 w-24 bg-gray-200 rounded" />
          </div>
          <div className="text-right space-y-1.5">
            <div className="h-2 w-10 bg-gray-200 rounded" />
            <div className="h-4 w-16 bg-gray-200 rounded" />
          </div>
        </div>

        {/* Divider */}
        <div className="h-px bg-gray-100" />

        {/* Stats grid - 2x2 */}
        <div className="grid grid-cols-2 gap-x-3 md:gap-x-4 gap-y-2 md:gap-y-2.5">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="space-y-1.5">
              <div className="h-2 w-12 bg-gray-200 rounded" />
              <div className="h-3 w-16 bg-gray-200 rounded" />
            </div>
          ))}
        </div>

        {/* Divider */}
        <div className="h-px bg-gray-100" />

        {/* Footer - Address & Date */}
        <div className="flex items-center justify-between">
          <div className="h-3 w-32 bg-gray-200 rounded" />
          <div className="h-3 w-12 bg-gray-200 rounded" />
        </div>
      </div>
    </div>
  );
}

/**
 * ProjectCardSkeletonList Component
 *
 * Renders multiple skeleton cards for list views
 */
interface ProjectCardSkeletonListProps {
  count?: number;
  className?: string;
}

export function ProjectCardSkeletonList({
  count = 3,
  className,
}: ProjectCardSkeletonListProps) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <ProjectCardSkeleton key={i} className={className} />
      ))}
    </>
  );
}
