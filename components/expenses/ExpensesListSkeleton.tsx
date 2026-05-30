// Debug: Loading skeleton for expenses list
import { Skeleton } from "@/components/ui/skeleton";

export function ExpensesListSkeleton() {
  return (
    <div className="space-y-4 md:space-y-6">
      {/* Filters skeleton */}
      <div className="relative">
        <div className="absolute -top-1 left-0 right-0 h-1 bg-gradient-to-r from-construction-blue/20 via-construction-accent/20 to-construction-blue/20" />
        <div className="bg-white border-2 border-gray-200 rounded-lg md:rounded-xl shadow-construction p-3 md:p-5">
          <div className="flex items-center gap-2 mb-3 md:mb-4">
            <Skeleton className="h-4 w-4 md:h-5 md:w-5" />
            <Skeleton className="h-5 w-20" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
            <Skeleton className="sm:col-span-2 h-10 md:h-11 rounded-lg" />
            <Skeleton className="h-10 md:h-11 rounded-lg" />
            <Skeleton className="h-10 md:h-11 rounded-lg" />
            <Skeleton className="sm:col-span-2 lg:col-span-1 h-10 md:h-11 rounded-lg" />
          </div>
        </div>
      </div>

      {/* Results count skeleton */}
      <div className="flex items-center gap-2 md:gap-3 px-3 md:px-4 py-2 md:py-3 bg-gradient-to-r from-construction-blue/5 to-transparent rounded-lg border-l-4 border-construction-blue/30">
        <Skeleton className="h-4 w-40" />
      </div>

      {/* List skeleton */}
      <div className="bg-white border-2 border-gray-200 rounded-xl overflow-hidden">
        {[...Array(8)].map((_, index) => (
          <div
            key={index}
            className="flex items-center justify-between px-4 py-3 border-b border-gray-100 last:border-b-0 min-h-[56px]"
          >
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <Skeleton className="h-4 w-4 rounded shrink-0" />
              <div className="flex flex-col gap-1.5 flex-1 min-w-0">
                <Skeleton className="h-4 w-40" />
                <Skeleton className="h-3 w-56" />
              </div>
            </div>
            <Skeleton className="h-4 w-20 shrink-0 ml-4" />
          </div>
        ))}
      </div>
    </div>
  );
}
