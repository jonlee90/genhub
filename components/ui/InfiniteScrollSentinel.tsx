"use client";

import React from "react";
import Loader2 from "lucide-react/icons/loader-2";

interface InfiniteScrollSentinelProps {
  sentinelRef: React.RefObject<HTMLDivElement | null>;
  isLoading: boolean;
  hasMore: boolean;
  itemCount?: number;
}

export function InfiniteScrollSentinel({
  sentinelRef,
  isLoading,
  hasMore,
  itemCount,
}: InfiniteScrollSentinelProps) {
  return (
    <>
      {/* Observed sentinel element — sits at the bottom of the list */}
      <div ref={sentinelRef} className="h-1" aria-hidden="true" />

      {isLoading ? (
        <div className="flex items-center justify-center gap-2 min-h-[44px] py-3">
          <Loader2 className="h-4 w-4 animate-spin text-gray-400 dark:text-gray-500" />
          <span className="text-sm text-gray-400 dark:text-gray-500">
            Loading...
          </span>
        </div>
      ) : !hasMore && (itemCount ?? 0) > 0 ? (
        <div className="flex items-center justify-center min-h-[44px] py-3">
          <span className="text-sm text-gray-400 dark:text-gray-500">
            You&apos;ve reached the end
          </span>
        </div>
      ) : null}
    </>
  );
}
