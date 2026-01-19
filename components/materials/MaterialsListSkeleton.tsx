"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

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
  className = "",
}: MaterialsListSkeletonProps) {
  return (
    <div
      className={cn(
        "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4",
        className,
      )}
    >
      {Array.from({ length: count }).map((_, index) => (
        <div
          key={index}
          className="bg-white rounded-xl overflow-hidden border-2 border-gray-200 shadow-sm"
        >
          {/* Image Header Placeholder */}
          <Skeleton className="h-36 bg-gradient-to-br from-gray-100 to-gray-50" />

          {/* Content */}
          <div className="p-4 space-y-3">
            {/* Product Name Placeholder */}
            <div className="space-y-2">
              <Skeleton className="h-5 rounded-lg" />
              <Skeleton className="h-5 w-3/4 rounded-lg" />
            </div>

            {/* SKU Placeholder */}
            <Skeleton className="h-3 w-24" />

            {/* Stats Row Placeholder */}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-2.5 rounded-lg bg-gray-50 border border-gray-100">
                <Skeleton className="h-2 w-12 mb-1.5" />
                <Skeleton className="h-5 w-8" />
              </div>
              <div className="p-2.5 rounded-lg bg-gray-50 border border-gray-100">
                <Skeleton className="h-2 w-12 mb-1.5" />
                <Skeleton className="h-5 w-8" />
              </div>
            </div>

            {/* Price Placeholder */}
            <div className="flex items-center justify-between py-2 border-t border-gray-100">
              <div>
                <Skeleton className="h-3 w-14 mb-1" />
                <Skeleton className="h-6 w-20" />
              </div>
            </div>

            {/* Button Placeholder */}
            <Skeleton className="h-12 rounded-xl" />
          </div>
        </div>
      ))}
    </div>
  );
}
