import { MaterialsListSkeleton } from '@/components/materials/MaterialsListSkeleton';

/**
 * Loading state for Materials page
 * Shows skeleton UI while server data is being fetched
 */
export default function MaterialsLoading() {
  console.log('[MaterialsLoading] Rendering loading state');

  return (
    <div className="flex-1 space-y-4 md:space-y-6 p-4 md:p-8 pt-4 md:pt-6 relative overflow-hidden">
      {/* Blueprint Grid Background */}
      <div className="fixed inset-0 pointer-events-none opacity-[0.03]">
        <div className="absolute inset-0" style={{
          backgroundImage: `
            linear-gradient(to right, currentColor 1px, transparent 1px),
            linear-gradient(to bottom, currentColor 1px, transparent 1px)
          `,
          backgroundSize: '40px 40px',
          color: 'var(--construction-blue)'
        }} />
      </div>

      {/* Header skeleton */}
      <div className="relative">
        <div className="absolute top-0 left-0 right-0 h-1 bg-construction-blue" />
        <div className="pt-2 md:pt-4 space-y-2">
          <div className="h-10 md:h-14 w-64 bg-gray-200 dark:bg-gray-700 animate-pulse rounded" />
          <div className="h-5 md:h-6 w-96 bg-gray-200 dark:bg-gray-700 animate-pulse rounded" />
        </div>
      </div>

      {/* Summary skeleton (5 cards on desktop, 2x3 on mobile) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-32 bg-gray-200 dark:bg-gray-700 animate-pulse rounded-lg border-2 border-gray-300 dark:border-gray-600" />
        ))}
      </div>

      {/* Carousel skeleton */}
      <div className="space-y-3">
        <div className="h-6 w-48 bg-gray-200 dark:bg-gray-700 animate-pulse rounded" />
        <div className="flex gap-4 overflow-x-auto">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="w-64 h-48 bg-gray-200 dark:bg-gray-700 animate-pulse rounded-lg flex-shrink-0 border-2 border-gray-300 dark:border-gray-600"
            />
          ))}
        </div>
      </div>

      {/* Materials list skeleton */}
      <MaterialsListSkeleton />
    </div>
  );
}
