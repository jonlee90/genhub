import { Skeleton } from '@/components/ui/skeleton';

export default function TasksLoading() {
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
          color: '#001B51'
        }} />
      </div>

      {/* Header Skeleton */}
      <div className="relative">
        {/* Construction border */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-construction-blue" />

        <div className="flex items-start justify-between pt-4">
          <div className="space-y-3">
            <Skeleton className="h-12 w-48 bg-construction-blue/10" />
          </div>
          <Skeleton className="h-14 w-40 bg-construction-blue/10" />
        </div>
      </div>

      {/* Stats Grid Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="relative bg-white border-2 border-gray-200 rounded-lg p-5 shadow-construction">
            <div className="flex items-center justify-between mb-3">
              <Skeleton className="h-9 w-9 rounded-lg bg-construction-blue/10" />
              <Skeleton className="h-3 w-14 bg-gray-200" />
            </div>
            <Skeleton className="h-10 w-12 mb-1 bg-construction-blue/10" />
            <Skeleton className="h-4 w-20 bg-gray-200" />
          </div>
        ))}
      </div>

      {/* Kanban Board Skeleton */}
      <div className="bg-white rounded-lg border-2 border-gray-200 shadow-construction overflow-hidden">
        {/* View Toggle & Filters */}
        <div className="p-4 border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Skeleton className="h-10 w-24 rounded-lg bg-gray-100" />
            <Skeleton className="h-10 w-24 rounded-lg bg-gray-100" />
          </div>
          <div className="flex items-center gap-4">
            <Skeleton className="h-10 w-48 bg-gray-100" />
            <Skeleton className="h-10 w-32 bg-gray-100" />
          </div>
        </div>

        {/* Kanban Columns */}
        <div className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {['Backlog', 'In Progress', 'Review', 'Completed'].map((column, colIdx) => (
              <div key={column} className="bg-gray-50 rounded-lg p-3 min-h-[400px]">
                {/* Column Header */}
                <div className="flex items-center justify-between mb-3 pb-2 border-b border-gray-200">
                  <Skeleton className="h-5 w-24 bg-gray-200" />
                  <Skeleton className="h-5 w-6 rounded-full bg-gray-200" />
                </div>

                {/* Task Cards */}
                <div className="space-y-3">
                  {[...Array(colIdx === 1 ? 3 : colIdx === 0 ? 4 : 2)].map((_, cardIdx) => (
                    <div key={cardIdx} className="p-3 bg-white rounded-lg border border-gray-200 shadow-sm">
                      <Skeleton className="h-4 w-full mb-2 bg-gray-200" />
                      <Skeleton className="h-3 w-3/4 mb-3 bg-gray-100" />
                      <div className="flex items-center justify-between">
                        <Skeleton className="h-5 w-16 rounded-full bg-construction-blue/10" />
                        <Skeleton className="h-6 w-6 rounded-full bg-gray-200" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Loading indicator */}
      <div className="flex items-center justify-center gap-2 text-construction-blue/60">
        <div className="w-2 h-2 rounded-full bg-construction-blue animate-pulse" />
        <span className="text-sm font-semibold uppercase tracking-wide">Loading Tasks...</span>
      </div>
    </div>
  );
}
