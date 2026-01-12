'use client';

import { cn } from '@/lib/utils';

interface MaterialsListSkeletonProps {
  count?: number;
  className?: string;
}

/**
 * MaterialsListSkeleton Component - Mobile PWA Optimized
 *
 * Loading skeleton for MaterialsList.
 * Displays skeleton cards matching the redesigned MaterialCard layout.
 *
 * Features:
 * - Matches MaterialCard layout exactly
 * - Smooth pulse animation
 * - Responsive grid (1 col mobile, 2 cols tablet, 3 cols desktop)
 *
 * @component
 */
export function MaterialsListSkeleton({
  count = 12,
  className = '',
}: MaterialsListSkeletonProps) {
  return (
    <div className={cn('grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4', className)}>
      {Array.from({ length: count }).map((_, index) => (
        <div
          key={index}
          className="bg-white rounded-xl overflow-hidden border-2 border-gray-200 shadow-sm"
        >
          {/* Image Header Placeholder */}
          <div className="h-36 bg-gradient-to-br from-gray-100 to-gray-50 animate-pulse" />

          {/* Content */}
          <div className="p-4 space-y-3">
            {/* Product Name Placeholder */}
            <div className="space-y-2">
              <div className="h-5 bg-gray-200 rounded-lg animate-pulse" />
              <div className="h-5 bg-gray-200 rounded-lg w-3/4 animate-pulse" />
            </div>

            {/* SKU Placeholder */}
            <div className="h-3 bg-gray-100 rounded w-24 animate-pulse" />

            {/* Stats Row Placeholder */}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-2.5 rounded-lg bg-gray-50 border border-gray-100">
                <div className="h-2 bg-gray-200 rounded w-12 mb-1.5 animate-pulse" />
                <div className="h-5 bg-gray-200 rounded w-8 animate-pulse" />
              </div>
              <div className="p-2.5 rounded-lg bg-gray-50 border border-gray-100">
                <div className="h-2 bg-gray-200 rounded w-12 mb-1.5 animate-pulse" />
                <div className="h-5 bg-gray-200 rounded w-8 animate-pulse" />
              </div>
            </div>

            {/* Price Placeholder */}
            <div className="flex items-center justify-between py-2 border-t border-gray-100">
              <div>
                <div className="h-3 bg-gray-100 rounded w-14 mb-1 animate-pulse" />
                <div className="h-6 bg-gray-200 rounded w-20 animate-pulse" />
              </div>
            </div>

            {/* Button Placeholder */}
            <div className="h-12 bg-gray-100 rounded-xl animate-pulse" />
          </div>
        </div>
      ))}
    </div>
  );
}
