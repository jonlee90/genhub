"use client";

import { SkeletonCard } from "@/components/mobile/SkeletonCard";
import { cn } from "@/lib/utils";

interface TaskListSkeletonProps {
  /** Number of skeleton cards to show */
  count?: number;
  /** Additional className for the container */
  className?: string;
}

/**
 * TaskListSkeleton - Loading placeholder for task list
 *
 * Features:
 * - Renders multiple SkeletonCard components
 * - Matches TaskListMobile layout
 * - Smooth shimmer animation
 */
export function TaskListSkeleton({ count = 5, className }: TaskListSkeletonProps) {
  return (
    <div className={cn("space-y-3", className)}>
      {Array.from({ length: count }).map((_, index) => (
        <SkeletonCard key={index} variant="task" />
      ))}
    </div>
  );
}
