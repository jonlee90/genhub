import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';

export default function TaskDetailLoading() {
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

      {/* Breadcrumb & Back Button */}
      <div className="flex items-center gap-4">
        <Skeleton className="h-10 w-10 rounded-lg bg-gray-200" />
        <Skeleton className="h-4 w-64 bg-gray-200" />
      </div>

      {/* Header section */}
      <div className="relative">
        <div className="absolute top-0 left-0 right-0 h-1 bg-construction-blue" />

        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between pt-4">
          <div className="space-y-3">
            <Skeleton className="h-12 w-96 bg-construction-blue/10" />
            <Skeleton className="h-4 w-72 bg-gray-200" />
            <div className="flex items-center gap-3">
              <Skeleton className="h-6 w-24 rounded-full bg-construction-blue/20" />
              <Skeleton className="h-6 w-32 rounded-full bg-gray-200" />
              <Skeleton className="h-6 w-28 rounded-full bg-gray-200" />
            </div>
          </div>
          <Skeleton className="h-12 w-32 rounded-lg bg-construction-blue/10" />
        </div>
      </div>

      {/* Task Details Card */}
      <Card className="border-2 border-gray-200 shadow-construction">
        <CardContent className="p-6 space-y-6">
          {/* Description Section */}
          <div className="space-y-3">
            <Skeleton className="h-5 w-32 bg-construction-blue/10" />
            <Skeleton className="h-4 w-full bg-gray-100" />
            <Skeleton className="h-4 w-full bg-gray-100" />
            <Skeleton className="h-4 w-3/4 bg-gray-100" />
          </div>

          {/* Metadata Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="space-y-2 p-4 bg-gray-50 rounded-lg border border-gray-200">
                <Skeleton className="h-3 w-24 bg-gray-300" />
                <Skeleton className="h-5 w-32 bg-gray-200" />
              </div>
            ))}
          </div>

          {/* Attachments Section */}
          <div className="space-y-3">
            <Skeleton className="h-5 w-32 bg-construction-blue/10" />
            <div className="flex gap-3">
              <Skeleton className="h-24 w-24 rounded-lg bg-gray-200" />
              <Skeleton className="h-24 w-24 rounded-lg bg-gray-200" />
              <Skeleton className="h-24 w-24 rounded-lg bg-gray-200" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Loading indicator */}
      <div className="flex items-center justify-center gap-2 text-construction-blue/60">
        <div className="w-2 h-2 rounded-full bg-construction-blue animate-pulse" />
        <span className="text-sm font-semibold uppercase tracking-wide">Loading Task Details...</span>
      </div>
    </div>
  );
}
