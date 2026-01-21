"use client";

/**
 * MobileStatusTabs Component
 *
 * @deprecated This component has been replaced by the more flexible FilterTabs component
 * in components/ui/FilterTabs.tsx. The new component supports:
 * - Full responsive design (mobile, tablet, desktop)
 * - Generic filtering (not just task statuses)
 * - Reusable across projects, tasks, and other entities
 *
 * Please use FilterTabs instead:
 * import { FilterTabs } from '@/components/ui/FilterTabs';
 *
 * Migration example:
 * <MobileStatusTabs tabs={tabs} value={value} onChange={onChange} />
 * becomes:
 * <FilterTabs tabs={tabs} value={value} onChange={onChange} useStatusGradients={true} />
 *
 * This file is kept for reference but should not be used in new code.
 *
 * ---
 *
 * Horizontally scrollable status filter tabs optimized for mobile.
 * Designed for the tasks page to filter by all 5 task statuses.
 *
 * Features:
 * - Smooth Framer Motion animations with spring physics
 * - X-scrollable with hidden scrollbar
 * - Snap scrolling for better UX
 * - 44px minimum tap targets
 * - Animated gradient background for active state
 * - Status count badges
 * - Touch-friendly spacing
 * - High contrast for outdoor visibility
 */

import { useCallback, useRef, useEffect } from "react";
import { m as motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { useHapticFeedback } from "@/lib/hooks/useHapticFeedback";
import { TASK_STATUS_CONFIG as _TASK_STATUS_CONFIG } from "@/lib/config/task-colors";
import { Circle, Play, Eye, Ban, CheckCircle } from "lucide-react";

// Status icons for visual indication
const STATUS_ICONS: Record<
  string,
  React.ComponentType<{ className?: string }>
> = {
  all: Circle,
  todo: Circle,
  in_progress: Play,
  review: Eye,
  blocked: Ban,
  completed: CheckCircle,
};

interface StatusTab {
  value: string;
  label: string;
  count?: number;
}

interface MobileStatusTabsProps {
  /** Available status tabs */
  tabs: StatusTab[];
  /** Currently selected value */
  value: string;
  /** Called when selection changes */
  onChange: (value: string) => void;
  /** Show count badges */
  showCounts?: boolean;
  /** Additional className */
  className?: string;
}

export function MobileStatusTabs({
  tabs,
  value,
  onChange,
  showCounts = true,
  className,
}: MobileStatusTabsProps) {
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

  // Get status-specific gradient for animated background
  const getStatusGradient = (status: string) => {
    if (status === "all") {
      return "from-[var(--construction-blue)] to-[#002868]"; // Navy gradient
    }

    const gradients: Record<string, string> = {
      todo: "from-gray-500 to-gray-600",
      in_progress: "from-blue-600 to-blue-700",
      review: "from-yellow-500 to-yellow-600",
      blocked: "from-red-600 to-red-700",
      completed: "from-green-600 to-green-700",
    };

    return gradients[status] || "from-[var(--construction-blue)] to-[#002868]";
  };

  return (
    <div
      ref={scrollRef}
      className={cn(
        // Container with Aceternity-inspired styling
        "relative flex items-center gap-2",
        "p-1.5 bg-gray-100 dark:bg-gray-800 rounded-xl",
        "border-2 border-gray-200 dark:border-gray-700",
        // Scrollable with hidden scrollbar
        "overflow-x-auto scrollbar-hide",
        // Snap scrolling
        "snap-x snap-mandatory",
        // Smooth scroll behavior
        "scroll-smooth",
        className,
      )}
      style={{
        WebkitOverflowScrolling: "touch",
      }}
    >
      {tabs.map((tab) => {
        const isActive = tab.value === value;
        const Icon = STATUS_ICONS[tab.value] || Circle;

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
              "inline-flex items-center gap-2",
              // Touch-friendly sizing (44px min height)
              "h-11 px-4",
              "rounded-lg",
              // Typography
              "font-bold text-sm",
              // Transitions for non-background properties
              "transition-colors duration-200",
              // Touch feedback
              "active:scale-[0.97]",
              // Text color based on active state
              isActive ? "text-white" : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200",
            )}
          >
            {/* Content layer */}
            <Icon className="w-4 h-4 flex-shrink-0" />
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
                    : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300",
                )}
              >
                {tab.count}
              </span>
            )}

            {/* Animated background with Framer Motion */}
            {isActive && (
              <motion.div
                layoutId="mobileStatusTabBackground"
                className={cn(
                  "absolute inset-0 rounded-lg",
                  "bg-gradient-to-r shadow-md",
                  getStatusGradient('all'),
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
