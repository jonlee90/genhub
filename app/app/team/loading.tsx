import { Skeleton } from '@/components/ui/skeleton';

export default function TeamLoading() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Skeleton */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Skeleton className="h-8 w-64 mb-2" />
          <Skeleton className="h-4 w-96" />
        </div>
      </div>

      {/* Table Skeleton */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex justify-between items-center mb-6">
            <Skeleton className="h-10 w-48" />
            <Skeleton className="h-10 w-40" />
          </div>

          {/* Table Header */}
          <div className="flex gap-4 mb-4 pb-3 border-b">
            <Skeleton className="h-4 w-48" />
            <Skeleton className="h-4 w-48" />
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-24" />
          </div>

          {/* Table Rows */}
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex gap-4 py-4 border-b border-gray-100">
              <Skeleton className="h-10 w-10 rounded-full" />
              <Skeleton className="h-10 w-48" />
              <Skeleton className="h-10 w-48" />
              <Skeleton className="h-6 w-32" />
              <Skeleton className="h-6 w-24" />
              <Skeleton className="h-8 w-8 ml-auto" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
