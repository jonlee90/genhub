import { Skeleton } from "@/components/ui/skeleton";

export function EstimatesSkeleton() {
  return (
    <div className="space-y-4">
      {/* Header skeleton */}
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-48 dark:bg-gray-700" />
        <Skeleton className="h-10 w-32 dark:bg-gray-700" />
      </div>

      {/* Card skeletons */}
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 space-y-3"
        >
          <div className="flex items-start justify-between">
            <div className="space-y-2 flex-1">
              <Skeleton className="h-5 w-3/4 dark:bg-gray-700" />
              <Skeleton className="h-4 w-1/2 dark:bg-gray-700" />
            </div>
            <Skeleton className="h-6 w-20 dark:bg-gray-700" />
          </div>

          <div className="flex gap-4">
            <Skeleton className="h-4 w-24 dark:bg-gray-700" />
            <Skeleton className="h-4 w-24 dark:bg-gray-700" />
            <Skeleton className="h-4 w-24 dark:bg-gray-700" />
          </div>
        </div>
      ))}
    </div>
  );
}
