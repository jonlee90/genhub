"use client";

import { memo, useRef, useEffect, useState } from "react";
import { ConfidenceBadge } from "@/components/estimates/ConfidenceBadge";
import { Badge } from "@/components/ui/badge";
import Hammer from "lucide-react/icons/hammer";
import { cn } from "@/lib/utils";
import type { TakeoffItem } from "@/types/db/tables/estimates";

type SwipeReviewCardProps = {
  item: TakeoffItem;
  isTop: boolean;
  scale: number; // 1.0 for top, 0.95 for second, 0.90 for third
  zIndex: number;
  onSwipeComplete?: (
    itemId: string,
    direction: "accept" | "reject" | "flag",
  ) => void;
};

// Memoized card component (rerender-memo)
export const SwipeReviewCard = memo(function SwipeReviewCard({
  item,
  isTop,
  scale,
  zIndex,
  onSwipeComplete,
}: SwipeReviewCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const startX = useRef(0);
  const startY = useRef(0);
  const currentX = useRef(0);
  const currentY = useRef(0);
  const isDragging = useRef(false);
  const startTime = useRef(0);
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Detect dark mode (rerender-defer-reads)
  useEffect(() => {
    const checkDarkMode = () => {
      setIsDarkMode(
        document.documentElement.classList.contains("dark") ||
          window.matchMedia("(prefers-color-scheme: dark)").matches,
      );
    };

    checkDarkMode();

    // Listen for theme changes
    const observer = new MutationObserver(checkDarkMode);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });

    return () => observer.disconnect();
  }, []);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (!isTop) return;

    const touch = e.touches[0];
    startX.current = touch.clientX;
    startY.current = touch.clientY;
    currentX.current = 0;
    currentY.current = 0;
    isDragging.current = true;
    startTime.current = Date.now();

    if (cardRef.current) {
      cardRef.current.style.transition = "none";
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging.current || !isTop) return;

    const touch = e.touches[0];
    currentX.current = touch.clientX - startX.current;
    currentY.current = touch.clientY - startY.current;

    if (cardRef.current) {
      const rotation = currentX.current / 20; // Subtle rotation
      cardRef.current.style.transform = `translate(${currentX.current}px, ${currentY.current}px) rotate(${rotation}deg)`;

      // Visual feedback with dark mode support
      const opacity = Math.min(Math.abs(currentX.current) / 200, 0.8);
      if (currentX.current > 80) {
        // Accept (green)
        cardRef.current.style.borderColor = "#16A34A";
        cardRef.current.style.backgroundColor = `rgba(22, 163, 74, ${opacity * 0.1})`;
      } else if (currentX.current < -80) {
        // Reject (red)
        cardRef.current.style.borderColor = "#DC2626";
        cardRef.current.style.backgroundColor = `rgba(220, 38, 38, ${opacity * 0.1})`;
      } else if (currentY.current < -60) {
        // Flag (amber)
        cardRef.current.style.borderColor = "#F59E0B";
        cardRef.current.style.backgroundColor = `rgba(245, 158, 11, ${opacity * 0.1})`;
      } else {
        cardRef.current.style.borderColor = isDarkMode ? "#374151" : "#E5E7EB";
        cardRef.current.style.backgroundColor = isDarkMode
          ? "#1F2937"
          : "white";
      }
    }
  };

  const handleTouchEnd = () => {
    if (!isDragging.current || !isTop) return;

    isDragging.current = false;
    const deltaTime = Date.now() - startTime.current;
    const velocityX = currentX.current / deltaTime; // px/ms

    let direction: "accept" | "reject" | "flag" | null = null;

    // Check velocity threshold (500px/s = 0.5px/ms)
    if (Math.abs(velocityX) > 0.5) {
      if (velocityX > 0.5) direction = "accept";
      else if (velocityX < -0.5) direction = "reject";
    } else {
      // Check distance threshold
      if (currentX.current > 80) direction = "accept";
      else if (currentX.current < -80) direction = "reject";
      else if (currentY.current < -60) direction = "flag";
    }

    if (direction && cardRef.current) {
      // Animate off-screen
      const exitX =
        direction === "accept" ? 400 : direction === "reject" ? -400 : 0;
      const exitY = direction === "flag" ? -400 : currentY.current;

      cardRef.current.style.transition = "transform 0.3s ease-out";
      cardRef.current.style.transform = `translate(${exitX}px, ${exitY}px) rotate(${exitX / 10}deg)`;

      // Haptic feedback (Android only)
      if (navigator.vibrate) {
        navigator.vibrate(10);
      }

      setTimeout(() => {
        onSwipeComplete?.(item.id, direction!);
      }, 300);
    } else {
      // Snap back with spring animation
      if (cardRef.current) {
        cardRef.current.style.transition =
          "transform 0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55)";
        cardRef.current.style.transform = "translate(0, 0) rotate(0deg)";
        cardRef.current.style.borderColor = isDarkMode ? "#374151" : "#E5E7EB";
        cardRef.current.style.backgroundColor = isDarkMode
          ? "#1F2937"
          : "white";
      }
    }
  };

  return (
    <div
      ref={cardRef}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      className={cn(
        "absolute left-0 right-0 mx-4",
        "p-6 rounded-lg border-2 bg-white dark:bg-gray-800",
        "shadow-lg touch-none select-none",
        "dark:border-gray-700",
      )}
      style={{
        transform: `scale(${scale})`,
        zIndex,
        height: "calc(70dvh - 120px)",
        width: "calc(100vw - 32px)",
        maxWidth: "600px",
        marginLeft: "auto",
        marginRight: "auto",
        transition: isTop ? "none" : "transform 0.3s ease-out",
      }}
    >
      <div className="h-full flex flex-col gap-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3 flex-1 min-w-0">
            <div className="w-10 h-10 rounded-lg bg-construction-blue/10 dark:bg-construction-blue/20 flex items-center justify-center flex-shrink-0">
              <Hammer className="w-5 h-5 text-construction-blue dark:text-construction-blue" />
            </div>

            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-2">
                {item.sub_type}
              </h3>
              <ConfidenceBadge confidence={item.confidence} />
            </div>
          </div>
        </div>

        {/* Details */}
        <div className="flex-1 space-y-4 overflow-y-auto pb-[env(safe-area-inset-bottom)]">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                Quantity
              </p>
              <p className="text-xl font-bold text-gray-900 dark:text-gray-100">
                {item.quantity} {item.unit}
              </p>
            </div>

            {item.trade ? (
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                  Trade
                </p>
                <Badge
                  variant="outline"
                  className="text-sm dark:border-gray-600 dark:text-gray-300"
                >
                  {item.trade}
                </Badge>
              </div>
            ) : null}
          </div>

          {item.notes ? (
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                Notes
              </p>
              <p className="text-sm text-gray-700 dark:text-gray-300">
                {item.notes}
              </p>
            </div>
          ) : null}

          {item.waste_factor > 0 ? (
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                Waste Factor
              </p>
              <p className="text-sm text-gray-700 dark:text-gray-300">
                {(item.waste_factor * 100).toFixed(0)}% (Adjusted:{" "}
                {item.adjusted_quantity} {item.unit})
              </p>
            </div>
          ) : null}
        </div>

        {/* Swipe hints */}
        <div className="flex items-center justify-between text-xs text-gray-400 dark:text-gray-500 pt-4 border-t border-gray-200 dark:border-gray-700">
          <span>← Reject</span>
          <span>↑ Flag</span>
          <span>Accept →</span>
        </div>
      </div>
    </div>
  );
});
