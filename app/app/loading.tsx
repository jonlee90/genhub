/**
 * Dashboard Loading State
 *
 * Skeleton layout matching dashboard structure with animating pulse placeholders.
 * Used by Suspense boundary and Next.js loading convention.
 */
export default function DashboardLoading() {
  return (
    <div className="min-h-screen p-4 md:p-8">
      {/* Subtle Blueprint Grid Background */}
      <div
        className="fixed inset-0 pointer-events-none opacity-[0.03] z-0"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M 40 0 L 0 0 0 40' fill='none' stroke='%23001B51' stroke-width='1'/%3E%3C/svg%3E")`,
        }}
      />

      <div className="relative z-10 space-y-6 md:space-y-8">
        {/* Header skeleton */}
        <div className="animate-pulse">
          {/* Industrial accent bar */}
          <div className="h-1 w-16 md:w-24 bg-gray-200 rounded-full mb-4 md:mb-6" />
          {/* Title */}
          <div className="h-10 md:h-14 w-64 md:w-96 bg-gray-200 rounded mb-2 md:mb-3" />
          {/* Subtitle */}
          <div className="h-4 md:h-5 w-48 md:w-80 bg-gray-200 rounded" />
        </div>

        {/* KPI cards skeleton - 6 cards in responsive grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 md:gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="bg-white rounded-lg border-2 border-gray-100 p-3 md:p-4 animate-pulse"
              style={{ animationDelay: `${i * 100}ms` }}
            >
              {/* Icon placeholder */}
              <div className="w-8 h-8 md:w-10 md:h-10 bg-gray-200 rounded-lg mb-3" />
              {/* Value placeholder */}
              <div className="h-6 md:h-8 w-12 md:w-16 bg-gray-200 rounded mb-2" />
              {/* Label placeholder */}
              <div className="h-3 md:h-4 w-full bg-gray-100 rounded" />
            </div>
          ))}
        </div>

        {/* Widgets skeleton - 2x3 grid on desktop */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          {/* Project Status Widget skeleton */}
          <div
            className="bg-white rounded-lg border-2 border-gray-100 p-4 md:p-6 animate-pulse"
            style={{ animationDelay: '200ms' }}
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-5 h-5 bg-gray-200 rounded" />
              <div className="h-5 w-32 bg-gray-200 rounded" />
            </div>
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex justify-between items-center">
                  <div className="h-4 w-20 bg-gray-100 rounded" />
                  <div className="h-4 w-8 bg-gray-100 rounded" />
                </div>
              ))}
            </div>
          </div>

          {/* Task Progress Widget skeleton */}
          <div
            className="bg-white rounded-lg border-2 border-gray-100 p-4 md:p-6 animate-pulse"
            style={{ animationDelay: '300ms' }}
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-5 h-5 bg-gray-200 rounded" />
              <div className="h-5 w-28 bg-gray-200 rounded" />
            </div>
            {/* Progress bar placeholder */}
            <div className="h-3 w-full bg-gray-100 rounded-full mb-4" />
            <div className="grid grid-cols-2 gap-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-12 bg-gray-50 rounded" />
              ))}
            </div>
          </div>

          {/* Budget Summary Widget skeleton */}
          <div
            className="bg-white rounded-lg border-2 border-gray-100 p-4 md:p-6 animate-pulse"
            style={{ animationDelay: '400ms' }}
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-5 h-5 bg-gray-200 rounded" />
              <div className="h-5 w-32 bg-gray-200 rounded" />
            </div>
            <div className="space-y-3">
              <div className="h-8 w-full bg-gray-100 rounded" />
              <div className="h-4 w-3/4 bg-gray-50 rounded" />
              <div className="h-4 w-2/3 bg-gray-50 rounded" />
            </div>
          </div>

          {/* Schedule Health Widget skeleton */}
          <div
            className="bg-white rounded-lg border-2 border-gray-100 p-4 md:p-6 animate-pulse"
            style={{ animationDelay: '500ms' }}
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-5 h-5 bg-gray-200 rounded" />
              <div className="h-5 w-32 bg-gray-200 rounded" />
            </div>
            {/* Donut chart placeholder */}
            <div className="flex items-center justify-center mb-4">
              <div className="w-24 h-24 md:w-32 md:h-32 bg-gray-100 rounded-full" />
            </div>
            <div className="flex justify-center gap-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-4 w-16 bg-gray-50 rounded" />
              ))}
            </div>
          </div>

          {/* Team Activity Widget skeleton */}
          <div
            className="bg-white rounded-lg border-2 border-gray-100 p-4 md:p-6 animate-pulse"
            style={{ animationDelay: '600ms' }}
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-5 h-5 bg-gray-200 rounded" />
              <div className="h-5 w-28 bg-gray-200 rounded" />
            </div>
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-gray-100 rounded-full" />
                  <div className="flex-1">
                    <div className="h-4 w-24 bg-gray-100 rounded mb-1" />
                    <div className="h-3 w-16 bg-gray-50 rounded" />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Materials Status Widget skeleton */}
          <div
            className="bg-white rounded-lg border-2 border-gray-100 p-4 md:p-6 animate-pulse"
            style={{ animationDelay: '700ms' }}
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-5 h-5 bg-gray-200 rounded" />
              <div className="h-5 w-32 bg-gray-200 rounded" />
            </div>
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex justify-between items-center">
                  <div className="h-4 w-20 bg-gray-100 rounded" />
                  <div className="h-6 w-12 bg-gray-100 rounded-full" />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Quick Actions skeleton */}
        <div
          className="bg-white rounded-lg border-2 border-gray-100 p-4 md:p-8 animate-pulse"
          style={{ animationDelay: '800ms' }}
        >
          <div className="flex items-center gap-3 mb-4 md:mb-6">
            <div className="w-2 h-2 bg-gray-200 rounded-full" />
            <div className="h-6 w-32 bg-gray-200 rounded" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="flex items-center gap-3 md:gap-4 p-3 md:p-5 rounded-lg border-2 border-gray-100"
              >
                <div className="w-10 h-10 md:w-12 md:h-12 bg-gray-100 rounded-lg" />
                <div className="flex-1">
                  <div className="h-4 w-24 bg-gray-100 rounded mb-2" />
                  <div className="h-3 w-32 bg-gray-50 rounded" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
