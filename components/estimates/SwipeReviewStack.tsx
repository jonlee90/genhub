"use client";

import { useState, useMemo, useCallback } from "react";
import { SwipeReviewCard } from "@/components/estimates/SwipeReviewCard";
import CheckCircle from "lucide-react/icons/check-circle";
import XCircle from "lucide-react/icons/x-circle";
import Flag from "lucide-react/icons/flag";
import { cn } from "@/lib/utils";
import type { TakeoffItem } from "@/types/db/tables/estimates";

type SwipeReviewStackProps = {
  items: TakeoffItem[];
  onAccept: (itemId: string) => void;
  onReject: (itemId: string) => void;
  onFlag?: (itemId: string) => void;
  onComplete?: (stats: {
    accepted: number;
    rejected: number;
    flagged: number;
  }) => void;
};

export function SwipeReviewStack({
  items,
  onAccept,
  onReject,
  onFlag,
  onComplete,
}: SwipeReviewStackProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [stats, setStats] = useState({
    accepted: 0,
    rejected: 0,
    flagged: 0,
  });

  // Sort items by confidence (low to high) - rerender-defer-reads
  const sortedItems = useMemo(() => {
    return [...items].sort((a, b) => a.confidence - b.confidence);
  }, [items]);

  // Get visible cards (current + 2 behind)
  const visibleCards = useMemo(() => {
    return sortedItems.slice(currentIndex, currentIndex + 3);
  }, [sortedItems, currentIndex]);

  const handleSwipeComplete = useCallback(
    (itemId: string, direction: "accept" | "reject" | "flag") => {
      // Update stats (rerender-functional-setstate)
      setStats((prev) => ({
        ...prev,
        accepted: direction === "accept" ? prev.accepted + 1 : prev.accepted,
        rejected: direction === "reject" ? prev.rejected + 1 : prev.rejected,
        flagged: direction === "flag" ? prev.flagged + 1 : prev.flagged,
      }));

      // Call appropriate handler
      if (direction === "accept") {
        onAccept(itemId);
      } else if (direction === "reject") {
        onReject(itemId);
      } else if (direction === "flag" && onFlag) {
        onFlag(itemId);
      }

      // Move to next card
      setCurrentIndex((prev) => prev + 1);

      // Check if complete
      if (currentIndex + 1 >= sortedItems.length) {
        setTimeout(() => {
          onComplete?.({
            accepted: stats.accepted + (direction === "accept" ? 1 : 0),
            rejected: stats.rejected + (direction === "reject" ? 1 : 0),
            flagged: stats.flagged + (direction === "flag" ? 1 : 0),
          });
        }, 300);
      }
    },
    [
      currentIndex,
      sortedItems.length,
      stats,
      onAccept,
      onReject,
      onFlag,
      onComplete,
    ],
  );

  // Completion screen (rendering-conditional-render: ternary)
  if (currentIndex >= sortedItems.length) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(70dvh-120px)] p-8 text-center">
        <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-950/30 flex items-center justify-center mb-4">
          <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
        </div>

        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
          Review Complete!
        </h2>

        <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
          You've reviewed all {sortedItems.length} items
        </p>

        <div className="grid grid-cols-3 gap-4 w-full max-w-md">
          <div className="p-4 rounded-lg bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-900/40">
            <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400 mx-auto mb-2" />
            <p className="text-2xl font-bold text-green-700 dark:text-green-300">
              {stats.accepted}
            </p>
            <p className="text-xs text-green-600 dark:text-green-400">
              Accepted
            </p>
          </div>

          <div className="p-4 rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/40">
            <XCircle className="w-6 h-6 text-red-600 dark:text-red-400 mx-auto mb-2" />
            <p className="text-2xl font-bold text-red-700 dark:text-red-300">
              {stats.rejected}
            </p>
            <p className="text-xs text-red-600 dark:text-red-400">Rejected</p>
          </div>

          <div className="p-4 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/40">
            <Flag className="w-6 h-6 text-amber-600 dark:text-amber-400 mx-auto mb-2" />
            <p className="text-2xl font-bold text-amber-700 dark:text-amber-300">
              {stats.flagged}
            </p>
            <p className="text-xs text-amber-600 dark:text-amber-400">
              Flagged
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative h-[calc(70dvh-120px)] w-full max-w-[600px] mx-auto">
      {/* Progress indicator */}
      <div className="mb-4 flex items-center justify-between px-4">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          {currentIndex + 1} of {sortedItems.length}
        </p>

        <div className="flex gap-4 text-xs">
          <span className="flex items-center gap-1 text-green-600 dark:text-green-400">
            <CheckCircle className="w-4 h-4" />
            {stats.accepted}
          </span>
          <span className="flex items-center gap-1 text-red-600 dark:text-red-400">
            <XCircle className="w-4 h-4" />
            {stats.rejected}
          </span>
          <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400">
            <Flag className="w-4 h-4" />
            {stats.flagged}
          </span>
        </div>
      </div>

      {/* Card stack */}
      <div className="relative h-full">
        {visibleCards.map((item, stackIndex) => {
          const scale = 1 - stackIndex * 0.05; // 1.0, 0.95, 0.90
          const zIndex = visibleCards.length - stackIndex;

          return (
            <SwipeReviewCard
              key={item.id}
              item={item}
              isTop={stackIndex === 0}
              scale={scale}
              zIndex={zIndex}
              onSwipeComplete={handleSwipeComplete}
            />
          );
        })}
      </div>
    </div>
  );
}
