/**
 * MaterialCardSkeleton Component
 *
 * Loading placeholder for material cards (matches MaterialCard layout).
 *
 * Features:
 * - Matches MaterialCard dimensions exactly
 * - Image header placeholder
 * - Stats and price sections
 * - Track button placeholder
 * - Shimmer effect with animate-pulse
 * - Accessible with ARIA labels
 */

import { cn } from '@/lib/utils';

interface MaterialCardSkeletonProps {
  className?: string;
}

export function MaterialCardSkeleton({ className }: MaterialCardSkeletonProps) {
  return (
    <div
      role="status"
      aria-label="Loading material"
      className={cn(
        'bg-white rounded-xl overflow-hidden border-2 border-gray-200 shadow-sm animate-pulse',
        className
      )}
    >
      {/* Image header skeleton */}
      <div className="relative h-36 bg-gradient-to-br from-gray-100 to-gray-50 flex items-center justify-center">
        {/* Icon placeholder */}
        <div className="w-14 h-14 bg-gray-200 rounded" />
      </div>

      {/* Content section */}
      <div className="p-4 space-y-3">
        {/* Product name */}
        <div className="space-y-2">
          <div className="h-5 w-3/4 bg-gray-200 rounded" />
          <div className="h-4 w-1/2 bg-gray-200 rounded" />
        </div>

        {/* Category badge */}
        <div className="h-5 w-20 bg-gray-200 rounded" />

        {/* Stats row */}
        <div className="flex items-center justify-between pt-2 border-t border-gray-100">
          <div className="space-y-1.5">
            <div className="h-3 w-16 bg-gray-200 rounded" />
            <div className="h-4 w-12 bg-gray-200 rounded" />
          </div>
          <div className="space-y-1.5 text-right">
            <div className="h-3 w-12 bg-gray-200 rounded" />
            <div className="h-4 w-16 bg-gray-200 rounded" />
          </div>
        </div>

        {/* Stock status */}
        <div className="h-5 w-24 bg-gray-200 rounded" />

        {/* Track button */}
        <div className="h-12 w-full bg-gray-200 rounded-xl" />
      </div>
    </div>
  );
}

/**
 * MaterialCardSkeletonList Component
 *
 * Renders multiple skeleton cards for list/grid views
 */
interface MaterialCardSkeletonListProps {
  count?: number;
  className?: string;
}

export function MaterialCardSkeletonList({
  count = 6,
  className,
}: MaterialCardSkeletonListProps) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <MaterialCardSkeleton key={i} className={className} />
      ))}
    </>
  );
}
