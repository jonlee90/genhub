import { Skeleton } from '@/components/ui/skeleton';

export default function ProjectsLoading() {
  return (
    <div className="flex-1 space-y-6 p-8 pt-6 relative overflow-hidden">
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

      {/* Header Skeleton */}
      <div className="relative">
        {/* Construction border */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-construction-blue" />

        <div className="flex items-start justify-between pt-4">
          <div className="space-y-3">
            <Skeleton className="h-12 w-64 bg-construction-blue/10" />
          </div>
          <Skeleton className="h-14 w-48 bg-construction-blue/10" />
        </div>
      </div>

      {/* Stats Grid Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="relative bg-white dark:bg-gray-900 border-2 border-gray-200 dark:border-gray-700 rounded-lg p-5 shadow-construction">
            <div className="flex items-center justify-between mb-3">
              <Skeleton className="h-9 w-9 rounded-lg bg-construction-blue/10" />
              <Skeleton className="h-3 w-16 bg-gray-200 dark:bg-gray-700" />
            </div>
            <Skeleton className="h-10 w-16 mb-1 bg-construction-blue/10" />
            <Skeleton className="h-4 w-24 bg-gray-200 dark:bg-gray-700" />
          </div>
        ))}
      </div>

      {/* Project List Skeleton */}
      <div className="bg-white dark:bg-gray-900 rounded-lg border-2 border-gray-200 dark:border-gray-700 shadow-construction overflow-hidden">
        {/* Filters */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center gap-4">
          <Skeleton className="h-10 w-64 bg-gray-100 dark:bg-gray-800" />
          <Skeleton className="h-10 w-32 bg-gray-100 dark:bg-gray-800" />
          <Skeleton className="h-10 w-32 bg-gray-100 dark:bg-gray-800" />
        </div>

        {/* Project Cards */}
        <div className="p-4 space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="p-4 border-2 border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900">
              <div className="flex items-center gap-4">
                <Skeleton className="h-12 w-12 rounded-lg bg-construction-blue/10" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-5 w-48 bg-gray-200 dark:bg-gray-700" />
                  <Skeleton className="h-4 w-64 bg-gray-100 dark:bg-gray-800" />
                </div>
                <div className="flex items-center gap-4">
                  <Skeleton className="h-6 w-20 rounded-full bg-construction-green/20" />
                  <Skeleton className="h-2 w-24 rounded-full bg-gray-200 dark:bg-gray-700" />
                  <Skeleton className="h-8 w-8 rounded bg-gray-100 dark:bg-gray-800" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Loading indicator */}
      <div className="flex items-center justify-center gap-2 text-construction-blue/60">
        <div className="w-2 h-2 rounded-full bg-construction-blue animate-pulse" />
        <span className="text-sm font-semibold uppercase tracking-wide">Loading Projects...</span>
      </div>
    </div>
  );
}
