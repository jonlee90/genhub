import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';

export default function ProjectDetailLoading() {
  return (
    <div className="flex-1 space-y-6 p-8 pt-6">
      {/* Breadcrumb */}
      <Skeleton className="h-4 w-48" />

      {/* Header section */}
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="space-y-2">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-96" />
        </div>
        <div className="flex gap-4">
          <div className="text-center">
            <Skeleton className="h-6 w-16 mx-auto mb-1" />
            <Skeleton className="h-3 w-20" />
          </div>
          <div className="text-center">
            <Skeleton className="h-6 w-16 mx-auto mb-1" />
            <Skeleton className="h-3 w-20" />
          </div>
          <div className="text-center">
            <Skeleton className="h-6 w-16 mx-auto mb-1" />
            <Skeleton className="h-3 w-20" />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-6 border-b">
        <Skeleton className="h-10 w-24" />
        <Skeleton className="h-10 w-24" />
        <Skeleton className="h-10 w-24" />
      </div>

      {/* Content */}
      <Card>
        <CardContent className="pt-8">
          {/* Metro Journey skeleton */}
          <div className="space-y-4">
            <Skeleton className="h-6 w-48 mb-6" />
            <div className="flex gap-4 overflow-x-auto pb-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex flex-col items-center min-w-[180px]">
                  <Skeleton className="h-20 w-20 rounded-full mb-3" />
                  <Skeleton className="h-4 w-32 mb-2" />
                  <Skeleton className="h-3 w-24" />
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
