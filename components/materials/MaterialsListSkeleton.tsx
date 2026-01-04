'use client';

import { cn } from '@/lib/utils';

interface MaterialsListSkeletonProps {
  count?: number;
  className?: string;
}

/**
 * MaterialsListSkeleton Component
 *
 * Loading skeleton for MaterialsList.
 * Displays 12 skeleton cards in same grid layout as MaterialsList.
 *
 * Features:
 * - Matches MaterialCard layout
 * - Pulse animation
 * - Responsive grid (1 col mobile, 2 cols tablet, 3 cols desktop)
 *
 * @component
 */
export function MaterialsListSkeleton({
  count = 12,
  className = '',
}: MaterialsListSkeletonProps) {
  console.log('[MaterialsListSkeleton] Rendering', count, 'skeleton cards');

  return (
    <div className={cn('grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4', className)}>
      {Array.from({ length: count }).map((_, index) => (
        <div
          key={index}
          className="border-2 border-gray-200 rounded-lg p-4 shadow-construction bg-white"
        >
          {/* Image Placeholder */}
          <div className="h-32 mb-3 bg-gray-200 rounded-lg animate-pulse" />

          {/* Product Name Placeholder */}
          <div className="h-5 bg-gray-200 rounded mb-2 animate-pulse" />
          <div className="h-5 bg-gray-200 rounded w-3/4 mb-2 animate-pulse" />

          {/* SKU Placeholder */}
          <div className="h-3 bg-gray-200 rounded w-1/2 mb-3 animate-pulse" />

          {/* Stats Row Placeholder */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex flex-col gap-1">
              <div className="h-3 w-12 bg-gray-200 rounded animate-pulse" />
              <div className="h-4 w-8 bg-gray-200 rounded animate-pulse" />
            </div>
            <div className="flex flex-col gap-1">
              <div className="h-3 w-12 bg-gray-200 rounded animate-pulse" />
              <div className="h-4 w-8 bg-gray-200 rounded animate-pulse" />
            </div>
          </div>

          {/* Price & Stock Placeholder */}
          <div className="flex items-center justify-between mb-3">
            <div>
              <div className="h-5 w-16 bg-gray-200 rounded mb-1 animate-pulse" />
              <div className="h-3 w-12 bg-gray-200 rounded animate-pulse" />
            </div>
          </div>

          {/* Button Placeholder */}
          <div className="h-9 bg-gray-200 rounded-lg animate-pulse" />
        </div>
      ))}
    </div>
  );
}
