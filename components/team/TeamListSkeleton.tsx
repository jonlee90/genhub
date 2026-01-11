'use client';

/**
 * TeamListSkeleton Component
 *
 * Skeleton loading state for team member list on mobile.
 * Matches the layout of TeamMemberCard for seamless loading experience.
 */

import { cn } from '@/lib/utils';

interface TeamListSkeletonProps {
  /** Number of skeleton items to show */
  count?: number;
  /** Additional className */
  className?: string;
}

function TeamMemberSkeleton() {
  return (
    <div className="w-full p-4 bg-white flex items-center gap-4 animate-pulse">
      {/* Avatar skeleton */}
      <div className="h-12 w-12 rounded-full bg-gray-200 flex-shrink-0" />

      {/* Content skeleton */}
      <div className="flex-1 min-w-0 space-y-2">
        {/* Name row */}
        <div className="flex items-center gap-2">
          <div className="h-5 bg-gray-200 rounded w-32" />
          <div className="h-2 w-2 rounded-full bg-gray-200" />
        </div>

        {/* Email */}
        <div className="h-4 bg-gray-100 rounded w-48" />

        {/* Role badge and count */}
        <div className="flex items-center gap-2">
          <div className="h-5 bg-gray-200 rounded-full w-24" />
          <div className="h-4 bg-gray-100 rounded w-16" />
        </div>
      </div>
    </div>
  );
}

export function TeamListSkeleton({ count = 5, className }: TeamListSkeletonProps) {
  return (
    <div className={cn('space-y-3', className)}>
      {Array.from({ length: count }).map((_, index) => (
        <div
          key={index}
          className="rounded-xl overflow-hidden shadow-sm border border-gray-100"
        >
          <TeamMemberSkeleton />
        </div>
      ))}
    </div>
  );
}
