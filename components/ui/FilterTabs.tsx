"use client";

/**
 * FilterTabs Component - Reusable, Responsive Filter Tabs
 *
 * A flexible filter tabs component that adapts across breakpoints:
 * - Mobile (<768px): Horizontal scroll with snap, touch-optimized
 * - Tablet (768px-1024px): Scrollable if needed, otherwise full width
 * - Desktop (>1024px): Grid layout with all tabs visible
 *
 * Features:
 * - Smooth Framer Motion animations with spring physics
 * - Responsive design with different layouts per breakpoint
 * - 44px minimum tap targets on mobile/tablet
 * - Animated gradient background for active state
 * - Optional count badges
 * - Touch-friendly spacing and feedback
 * - High contrast for outdoor visibility
 * - Haptic feedback on mobile
 * - Auto-scroll to active tab
 * - Status-specific or generic gradients
 */

import { useCallback, useRef, useEffect } from "react";
import { m as motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { useHapticFeedback } from "@/lib/hooks/useHapticFeedback";

export interface FilterTab {
  /** Unique identifier */
  value: string;
  /** Display label */
  label: string;
  /** Optional icon component */
  icon?: React.ComponentType<{ className?: string }>;
  /** Optional count badge */
  count?: number;
  /** Optional gradient override (e.g., "from-blue-600 to-blue-700") */
  gradient?: string;
}

interface FilterTabsProps {
  /** Available filter tabs */
  tabs: FilterTab[];
  /** Currently selected value */
  value: string;
  /** Called when selection changes */
  onChange: (value: string) => void;
  /** Show count badges */
  showCounts?: boolean;
  /** Additional className */
  className?: string;
  /** Layout ID for Framer Motion (unique per instance) */
  layoutId?: string;
  /** Use status-specific gradients (task status colors) */
  useStatusGradients?: boolean;
}

export function FilterTabs({
  tabs,
  value,
  onChange,
  showCounts = true,
  className,
  layoutId = "filterTabBackground",
  useStatusGradients = false,
}: FilterTabsProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const activeRef = useRef<HTMLButtonElement>(null);
  const { trigger } = useHapticFeedback();

  // Scroll active tab into view on mount and value change
  useEffect(() => {
    if (activeRef.current && scrollRef.current) {
      const container = scrollRef.current;
      const activeEl = activeRef.current;

      // Calculate scroll position to center the active tab
      const containerWidth = container.offsetWidth;
      const activeLeft = activeEl.offsetLeft;
      const activeWidth = activeEl.offsetWidth;
      const scrollLeft = activeLeft - containerWidth / 2 + activeWidth / 2;

      container.scrollTo({
        left: Math.max(0, scrollLeft),
        behavior: "smooth",
      });
    }
  }, [value]);

  // Handle tab click with haptic feedback
  const handleClick = useCallback(
    (tabValue: string) => {
      if (tabValue === value) return;

      // Haptic feedback
      trigger("light");

      onChange(tabValue);
    },
    [value, onChange, trigger],
  );

  // Get gradient for animated background
  const getGradient = (tab: FilterTab) => {
    // Use custom gradient if provided
    if (tab.gradient) {
      return tab.gradient;
    }

    // Use status-specific gradients if enabled
    if (useStatusGradients) {
      const statusGradients: Record<string, string> = {
        all: "from-[#001B51] to-[#002868]", // Navy gradient
        todo: "from-gray-500 to-gray-600",
        in_progress: "from-blue-600 to-blue-700",
        review: "from-yellow-500 to-yellow-600",
        blocked: "from-red-600 to-red-700",
        completed: "from-green-600 to-green-700",
        // Project statuses
        planning: "from-amber-500 to-amber-600",
        active: "from-blue-600 to-blue-700",
        on_hold: "from-orange-500 to-orange-600",
      };

      return statusGradients[tab.value] || "from-[#001B51] to-[#002868]";
    }

    // Default GenHub navy gradient
    return "from-[#001B51] to-[#002868]";
  };

  return (
    <div
      ref={scrollRef}
      className={cn(
        // Container with Aceternity-inspired styling
        "relative flex items-center gap-2",
        "p-1.5 bg-gray-100 rounded-xl",
        "border-2 border-gray-200",
        // Mobile: Scrollable with hidden scrollbar
        "overflow-x-auto scrollbar-hide",
        "snap-x snap-mandatory",
        "scroll-smooth",
        // Tablet: Allow wrapping if needed
        "md:overflow-x-auto",
        // Desktop: Grid layout, no scroll
        "lg:grid lg:overflow-x-visible",
        className,
      )}
      style={{
        WebkitOverflowScrolling: "touch",
        gridTemplateColumns: `repeat(${tabs.length}, minmax(0, 1fr))`,
      }}
    >
      {tabs.map((tab) => {
        const isActive = tab.value === value;
        const Icon = tab.icon;

        return (
          <button
            key={tab.value}
            ref={isActive ? activeRef : undefined}
            type="button"
            onClick={() => handleClick(tab.value)}
            className={cn(
              // Base styles - position relative for motion background
              "relative z-10",
              "flex-shrink-0 snap-start",
              "inline-flex items-center justify-center gap-2",
              // Touch-friendly sizing
              // Mobile/Tablet: 44px min height
              "h-11 px-4",
              // Desktop: Can be slightly more compact if needed
              "lg:h-10 lg:px-3",
              "rounded-lg",
              // Typography
              "font-bold text-sm",
              // Transitions for non-background properties
              "transition-colors duration-200",
              // Touch feedback
              "active:scale-[0.97]",
              // Text color based on active state
              isActive ? "text-white" : "text-gray-600 hover:text-gray-900",
              // Desktop: Full width in grid
              "lg:w-full",
            )}
          >
            {/* Content layer */}
            {Icon && <Icon className="w-4 h-4 flex-shrink-0" />}
            <span className="whitespace-nowrap">{tab.label}</span>

            {/* Count badge */}
            {showCounts && tab.count !== undefined && tab.count >= 0 && (
              <span
                className={cn(
                  "inline-flex items-center justify-center",
                  "min-w-[22px] h-[22px] px-1.5",
                  "rounded-full text-xs font-black",
                  isActive
                    ? "bg-white/20 text-white"
                    : "bg-gray-200 text-gray-700",
                )}
              >
                {tab.count}
              </span>
            )}

            {/* Animated background with Framer Motion */}
            {isActive && (
              <motion.div
                layoutId={layoutId}
                className={cn(
                  "absolute inset-0 rounded-lg",
                  "bg-gradient-to-r shadow-md",
                  "from-[#001B51] to-[#002868]",
                )}
                transition={{
                  type: "spring",
                  stiffness: 380,
                  damping: 30,
                }}
                style={{ zIndex: -1 }}
              />
            )}
          </button>
        );
      })}
    </div>
  );
}
