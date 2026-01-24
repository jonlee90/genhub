"use client";

/**
 * ThemeSegmentToggle Component
 *
 * A 3-state segmented control for theme preference (Light/System/Dark).
 * Designed specifically for the MoreMenu with glassmorphism styling.
 *
 * Features:
 * - Smooth sliding indicator animation (Framer Motion)
 * - Haptic feedback on selection
 * - Touch-friendly (44px height)
 * - Accessible with proper ARIA attributes
 * - Reduced motion support
 */

import { memo, useCallback, useId } from "react";
import { m as motion, useReducedMotion } from "framer-motion";
import { Sun, Monitor, Moon } from "lucide-react";
import { useTheme, type ThemePreference } from "@/lib/context/ThemeContext";
import { useHapticFeedback } from "@/lib/hooks/useHapticFeedback";
import { cn } from "@/lib/utils";

interface ThemeSegmentToggleProps {
  className?: string;
  /** Size variant - sm: 36px height, md: 40px height */
  size?: "sm" | "md";
}

const themeOptions: { value: ThemePreference; icon: typeof Sun; label: string }[] = [
  { value: "light", icon: Sun, label: "Light theme" },
  { value: "system", icon: Monitor, label: "System theme" },
  { value: "dark", icon: Moon, label: "Dark theme" },
];

function ThemeSegmentToggleComponent({ className, size = "sm" }: ThemeSegmentToggleProps) {
  const { preference, setPreference } = useTheme();
  const { trigger } = useHapticFeedback();
  const groupId = useId();
  const shouldReduceMotion = useReducedMotion();

  // Get active index for indicator position
  const activeIndex = themeOptions.findIndex((opt) => opt.value === preference);

  // Handle segment selection
  const handleSelect = useCallback(
    (value: ThemePreference) => {
      if (value === preference) return;
      trigger("light");
      setPreference(value);
    },
    [preference, setPreference, trigger]
  );

  // Size-specific styles
  const sizeStyles = {
    sm: {
      container: "h-9 p-0.5",
      segment: "w-9 h-8",
      indicator: "w-8 h-7",
      icon: "w-4 h-4",
      indicatorOffset: 2,
      segmentWidth: 36,
    },
    md: {
      container: "h-10 p-0.5",
      segment: "w-10 h-9",
      indicator: "w-9 h-8",
      icon: "w-[18px] h-[18px]",
      indicatorOffset: 2,
      segmentWidth: 40,
    },
  };

  const styles = sizeStyles[size];

  // Calculate indicator position
  const indicatorX = styles.indicatorOffset + activeIndex * styles.segmentWidth;

  return (
    <div
      role="radiogroup"
      aria-label="Theme preference"
      className={cn(
        // Container styling - frosted glass pill
        "relative inline-flex items-center rounded-xl",
        "bg-white/20 dark:bg-black/30 backdrop-blur-sm",
        "border border-white/30 dark:border-white/10",
        styles.container,
        className
      )}
    >
      {/* Sliding indicator */}
      <motion.div
        className={cn(
          "absolute rounded-lg",
          "bg-white dark:bg-gray-700",
          "shadow-sm",
          styles.indicator
        )}
        initial={false}
        animate={{
          x: indicatorX,
        }}
        transition={
          shouldReduceMotion
            ? { duration: 0 }
            : {
                type: "spring",
                stiffness: 500,
                damping: 30,
              }
        }
        style={{ top: "50%", translateY: "-50%" }}
      />

      {/* Segments */}
      {themeOptions.map((option) => {
        const isActive = option.value === preference;
        const Icon = option.icon;
        const segmentId = `${groupId}-${option.value}`;

        return (
          <button
            key={option.value}
            id={segmentId}
            type="button"
            role="radio"
            aria-checked={isActive}
            aria-label={option.label}
            onClick={() => handleSelect(option.value)}
            className={cn(
              // Base styles
              "relative z-10 flex items-center justify-center",
              "rounded-lg select-none touch-manipulation",
              "transition-colors duration-150",
              styles.segment,
              // Active/inactive colors
              isActive
                ? "text-construction-blue dark:text-white"
                : "text-white/70 dark:text-white/50 hover:text-white dark:hover:text-white/70"
            )}
          >
            <Icon className={cn(styles.icon, "transition-transform", isActive && "scale-110")} />
          </button>
        );
      })}
    </div>
  );
}

/**
 * Export memoized version to prevent unnecessary re-renders
 */
export const ThemeSegmentToggle = memo(ThemeSegmentToggleComponent);
