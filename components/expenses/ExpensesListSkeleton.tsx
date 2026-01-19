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

      {/* Grid skeleton */}
      <div className="grid gap-4 md:gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
        {[...Array(6)].map((_, index) => (
          <div key={index} className="relative h-full">
            <div className="absolute inset-0 bg-gradient-to-br from-construction-blue/5 to-transparent rounded-xl" />
            <div className="relative h-full bg-white border-2 border-gray-200 rounded-xl shadow-construction overflow-hidden flex flex-col">
              {/* Header */}
              <Skeleton className="relative h-32 md:h-40 border-b-2 bg-gradient-to-br from-gray-100 to-gray-50 border-gray-200" />

              {/* Content */}
              <div className="flex-1 p-4 md:p-5 space-y-3">
                {/* Amount */}
                <div className="flex items-baseline gap-2">
                  <Skeleton className="h-5 w-5 md:h-6 md:w-6 shrink-0" />
                  <Skeleton className="h-8 w-32" />
                </div>

                {/* Description */}
                <div className="space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                </div>

                {/* Category */}
                <div className="flex gap-2">
                  <Skeleton className="h-6 w-20" />
                  <Skeleton className="h-6 w-24" />
                </div>

                {/* Spacer */}
                <div className="flex-1" />

                {/* Footer */}
                <div className="space-y-2 pt-3 border-t-2 border-gray-100">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-2/3" />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
