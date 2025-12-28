import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

function ProjectCardSkeleton() {
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 flex-1">
            <Skeleton className="h-10 w-10 rounded-lg" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-5 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          </div>
          <Skeleton className="h-6 w-20" />
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-24" />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-4 w-8" />
          </div>
          <Skeleton className="h-2 w-full" />
        </div>

        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-16" />
          <Skeleton className="h-4 w-20" />
        </div>

        <div className="flex items-center justify-between pt-2 border-t">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-24" />
        </div>
      </CardContent>
    </Card>
  );
}

export function ProjectListSkeleton() {
  return (
    <div className="space-y-6">
      {/* Filters Skeleton */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center">
        <Skeleton className="h-10 flex-1" />
        <Skeleton className="h-10 w-full md:w-[160px]" />
        <Skeleton className="h-10 w-full md:w-[180px]" />
        <Skeleton className="h-10 w-full md:w-[160px]" />
      </div>

      {/* Results count skeleton */}
      <Skeleton className="h-4 w-48" />

      {/* Project Grid Skeleton */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <ProjectCardSkeleton />
        <ProjectCardSkeleton />
        <ProjectCardSkeleton />
        <ProjectCardSkeleton />
        <ProjectCardSkeleton />
        <ProjectCardSkeleton />
      </div>
    </div>
  );
}
