'use client';

/**
 * MobileStatusTabs Component
 *
 * Horizontally scrollable status filter tabs optimized for mobile.
 * Designed for the tasks page to filter by all 5 task statuses.
 *
 * Features:
 * - X-scrollable with hidden scrollbar
 * - Snap scrolling for better UX
 * - 44px minimum tap targets
 * - Active state with navy background
 * - Status count badges
 * - Touch-friendly spacing
 * - High contrast for outdoor visibility
 */

import { useCallback, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { TASK_STATUS_CONFIG } from '@/lib/config/task-colors';
import { Circle, Play, Eye, Ban, CheckCircle } from 'lucide-react';

// Status icons for visual indication
const STATUS_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
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

  // Scroll active tab into view on mount and value change
  useEffect(() => {
    if (activeRef.current && scrollRef.current) {
      const container = scrollRef.current;
      const activeEl = activeRef.current;

      // Calculate scroll position to center the active tab
      const containerWidth = container.offsetWidth;
      const activeLeft = activeEl.offsetLeft;
      const activeWidth = activeEl.offsetWidth;
      const scrollLeft = activeLeft - (containerWidth / 2) + (activeWidth / 2);

      container.scrollTo({
        left: Math.max(0, scrollLeft),
        behavior: 'smooth',
      });
    }
  }, [value]);

  // Handle tab click with haptic feedback
  const handleClick = useCallback(
    (tabValue: string) => {
      if (tabValue === value) return;

      // Haptic feedback
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate(10);
      }

      onChange(tabValue);
    },
    [value, onChange]
  );

  // Get status-specific styling
  const getStatusStyle = (status: string, isActive: boolean) => {
    if (status === 'all') {
      return isActive
        ? 'bg-[#001B51] text-white'
        : 'bg-gray-100 text-gray-600';
    }

    const config = TASK_STATUS_CONFIG[status as keyof typeof TASK_STATUS_CONFIG];
    if (!config) {
      return isActive
        ? 'bg-[#001B51] text-white'
        : 'bg-gray-100 text-gray-600';
    }

    if (isActive) {
      // Use the solid color from config for active state
      return config.solidColor;
    }

    return 'bg-gray-100 text-gray-600';
  };

  return (
    <div
      ref={scrollRef}
      className={cn(
        // Scrollable container
        'flex gap-2 overflow-x-auto',
        // Hide scrollbar but keep functionality
        'scrollbar-hide',
        // Snap scrolling
        'snap-x snap-mandatory',
        // Padding for edge items
        '-mx-4 px-4',
        // Smooth scroll behavior
        'scroll-smooth',
        className
      )}
      style={{
        WebkitOverflowScrolling: 'touch',
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
              // Base styles
              'flex-shrink-0 snap-start',
              'inline-flex items-center gap-2',
              // Touch-friendly sizing (44px min height)
              'h-11 px-4',
              'rounded-xl',
              // Typography
              'font-semibold text-sm',
              // Transitions
              'transition-all duration-200',
              // Touch feedback
              'active:scale-[0.97]',
              // Status-specific styling
              getStatusStyle(tab.value, isActive),
              // Shadow for active
              isActive && 'shadow-md'
            )}
          >
            <Icon className="w-4 h-4 flex-shrink-0" />
            <span className="whitespace-nowrap">{tab.label}</span>

            {/* Count badge */}
            {showCounts && tab.count !== undefined && tab.count >= 0 && (
              <span
                className={cn(
                  'inline-flex items-center justify-center',
                  'min-w-[22px] h-[22px] px-1.5',
                  'rounded-full text-xs font-bold',
                  isActive
                    ? 'bg-white/20 text-white'
                    : 'bg-gray-200 text-gray-700'
                )}
              >
                {tab.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
