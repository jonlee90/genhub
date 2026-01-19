"use client";

/**
 * SegmentedControl Component
 *
 * iOS-style segmented control for filter tabs.
 *
 * Features:
 * - Horizontal segments with selection indicator
 * - Active segment: white bg, shadow, navy text
 * - Inactive: gray text, transparent bg
 * - Smooth transition between states
 * - Touch-friendly (44px min height)
 * - Accessible with proper aria attributes
 */

import { useCallback, useId } from "react";
import { cn } from "@/lib/utils";
import { useHapticFeedback } from "@/lib/hooks/useHapticFeedback";

interface Segment {
  /** Unique value for the segment */
  value: string;
  /** Display label */
  label: string;
  /** Optional count badge */
  count?: number;
  /** Disabled state */
  disabled?: boolean;
}

interface SegmentedControlProps {
  /** Available segments */
  segments: Segment[];
  /** Currently selected value */
  value: string;
  /** Called when selection changes */
  onChange: (value: string) => void;
  /** Size variant */
  size?: "sm" | "md";
  /** Full width (equal segment widths) */
  fullWidth?: boolean;
  /** Additional className */
  className?: string;
}

export function SegmentedControl({
  segments,
  value,
  onChange,
  size = "md",
  fullWidth = false,
  className,
}: SegmentedControlProps) {
  const groupId = useId();
  const { trigger } = useHapticFeedback();

  // Handle segment click with haptic
  const handleClick = useCallback(
    (segmentValue: string, disabled?: boolean) => {
      if (disabled || segmentValue === value) return;

      // Haptic feedback
      trigger("light");

      onChange(segmentValue);
    },
    [value, onChange, trigger],
  );

  // Size styles
  const sizeStyles = {
    sm: {
      container: "p-0.5 gap-0.5",
      segment: "h-9 px-3 text-sm",
    },
    md: {
      container: "p-1 gap-1",
      segment: "h-11 px-4 text-sm",
    },
  };

  const styles = sizeStyles[size];

  return (
    <div
      role="tablist"
      aria-label="Filter options"
      className={cn(
        // Container styles
        "inline-flex items-center",
        "bg-gray-100 rounded-xl",
        styles.container,
        fullWidth && "w-full",
        className,
      )}
    >
      {segments.map((segment) => {
        const isActive = segment.value === value;
        const segmentId = `${groupId}-${segment.value}`;

        return (
          <button
            key={segment.value}
            id={segmentId}
            type="button"
            role="tab"
            aria-selected={isActive}
            aria-disabled={segment.disabled}
            disabled={segment.disabled}
            onClick={() => handleClick(segment.value, segment.disabled)}
            className={cn(
              // Base styles
              "inline-flex items-center justify-center gap-1.5",
              "rounded-lg font-medium",
              "select-none touch-manipulation",
              "transition-all duration-200 ease-out",
              styles.segment,

              // Width
              fullWidth && "flex-1",

              // Active/inactive states
              isActive
                ? cn("bg-white text-[#001B51]", "shadow-sm")
                : cn(
                    "bg-transparent text-gray-600",
                    "hover:text-gray-900",
                    "active:bg-gray-200/50",
                  ),

              // Disabled
              segment.disabled && "opacity-50 pointer-events-none",
            )}
          >
            <span>{segment.label}</span>

            {/* Count badge */}
            {segment.count !== undefined && segment.count > 0 && (
              <span
                className={cn(
                  "inline-flex items-center justify-center",
                  "min-w-[20px] h-5 px-1.5",
                  "rounded-full text-xs font-semibold",
                  isActive
                    ? "bg-[#001B51] text-white"
                    : "bg-gray-200 text-gray-600",
                )}
              >
                {segment.count > 99 ? "99+" : segment.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
