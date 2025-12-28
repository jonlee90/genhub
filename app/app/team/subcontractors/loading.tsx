import { Skeleton } from '@/components/ui/skeleton';

export default function SubcontractorsLoading() {
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
            <Skeleton className="h-12 w-80 bg-construction-blue/10" />
            <Skeleton className="h-4 w-96 bg-gray-200" />
          </div>
          <Skeleton className="h-14 w-52 bg-construction-blue/10" />
        </div>
      </div>

      {/* Stats Grid Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="relative bg-white border-2 border-gray-200 rounded-lg p-5 shadow-construction">
            <div className="flex items-center justify-between mb-3">
              <Skeleton className="h-9 w-9 rounded-lg bg-construction-blue/10" />
              <Skeleton className="h-3 w-16 bg-gray-200" />
            </div>
            <Skeleton className="h-10 w-16 mb-1 bg-construction-blue/10" />
            <Skeleton className="h-4 w-28 bg-gray-200" />
          </div>
        ))}
      </div>

      {/* Subcontractors List Skeleton */}
      <div className="bg-white rounded-lg border-2 border-gray-200 shadow-construction overflow-hidden">
        {/* Search & Filters */}
        <div className="p-4 border-b border-gray-200 flex items-center gap-4">
          <Skeleton className="h-10 w-64 bg-gray-100" />
          <Skeleton className="h-10 w-32 bg-gray-100" />
          <Skeleton className="h-10 w-32 bg-gray-100" />
        </div>

        {/* Subcontractor Cards */}
        <div className="p-4 space-y-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="p-4 border-2 border-gray-200 rounded-lg bg-white">
              <div className="flex items-center gap-4">
                {/* Company Logo */}
                <Skeleton className="h-16 w-16 rounded-lg bg-construction-blue/10" />

                {/* Company Info */}
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-6 w-48 bg-gray-200" />
                  <Skeleton className="h-4 w-64 bg-gray-100" />
                  <div className="flex items-center gap-3">
                    <Skeleton className="h-5 w-28 rounded-full bg-construction-green/20" />
                    <Skeleton className="h-5 w-24 rounded-full bg-gray-200" />
                  </div>
                </div>

                {/* Stats */}
                <div className="hidden md:flex items-center gap-6">
                  <div className="text-center">
                    <Skeleton className="h-6 w-12 mx-auto mb-1 bg-construction-blue/10" />
                    <Skeleton className="h-3 w-16 bg-gray-200" />
                  </div>
                  <div className="text-center">
                    <Skeleton className="h-6 w-12 mx-auto mb-1 bg-construction-blue/10" />
                    <Skeleton className="h-3 w-20 bg-gray-200" />
                  </div>
                </div>

                {/* Action Button */}
                <Skeleton className="h-10 w-10 rounded bg-gray-100" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Loading indicator */}
      <div className="flex items-center justify-center gap-2 text-construction-blue/60">
        <div className="w-2 h-2 rounded-full bg-construction-blue animate-pulse" />
        <span className="text-sm font-semibold uppercase tracking-wide">Loading Subcontractors...</span>
      </div>
    </div>
  );
}
