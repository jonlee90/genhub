'use client';

/**
 * DesktopTabs Component - Desktop & Tablet Optimized Tabs
 *
 * A polished tabs component specifically designed for desktop and tablet interfaces.
 * Unlike FilterTabs (mobile-first with scrolling), this component is optimized for
 * larger screens with mouse/keyboard interactions.
 *
 * Features:
 * - Smooth Framer Motion animations with spring physics
 * - Full-width grid layout (no scrolling needed)
 * - Enhanced hover states for mouse interactions
 * - Keyboard navigation support (arrow keys, Enter, Space)
 * - Animated gradient backgrounds with Aceternity aesthetics
 * - Optional count badges
 * - Status-specific gradients
 * - High contrast and professional styling
 * - Responsive down to tablet (768px)
 *
 * Design Philosophy:
 * - All tabs visible at once (no horizontal scroll)
 * - Hover states indicate interactivity
 * - Smooth, native-feeling animations
 * - Clean, professional aesthetic
 *
 * Use Cases:
 * - Status filters on desktop/tablet
 * - Category navigation
 * - View mode switching
 * - Any tab-based filtering on large screens
 */

import { useCallback, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

export interface DesktopTab {
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
  /** Optional description for aria-label */
  description?: string;
}

interface DesktopTabsProps {
  /** Available tabs */
  tabs: DesktopTab[];
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
  /** Use status-specific gradients (task/project status colors) */
  useStatusGradients?: boolean;
  /** Compact mode (smaller padding, useful for dense UIs) */
  compact?: boolean;
}

export function DesktopTabs({
  tabs,
  value,
  onChange,
  showCounts = true,
  className,
  layoutId = 'desktopTabBackground',
  useStatusGradients = false,
  compact = false,
}: DesktopTabsProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const activeRef = useRef<HTMLButtonElement>(null);

  // Focus active tab on mount for keyboard navigation
  useEffect(() => {
    if (activeRef.current) {
      // Set tabindex for keyboard navigation
      activeRef.current.setAttribute('tabindex', '0');
    }
  }, [value]);

  // Handle tab click
  const handleClick = useCallback(
    (tabValue: string) => {
      if (tabValue === value) return;
      onChange(tabValue);
    },
    [value, onChange]
  );

  // Keyboard navigation
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent, currentIndex: number) => {
      let nextIndex: number | null = null;

      switch (e.key) {
        case 'ArrowLeft':
          e.preventDefault();
          nextIndex = currentIndex > 0 ? currentIndex - 1 : tabs.length - 1;
          break;
        case 'ArrowRight':
          e.preventDefault();
          nextIndex = currentIndex < tabs.length - 1 ? currentIndex + 1 : 0;
          break;
        case 'Home':
          e.preventDefault();
          nextIndex = 0;
          break;
        case 'End':
          e.preventDefault();
          nextIndex = tabs.length - 1;
          break;
        case 'Enter':
        case ' ':
          e.preventDefault();
          onChange(tabs[currentIndex].value);
          break;
      }

      // Focus next tab
      if (nextIndex !== null && containerRef.current) {
        const buttons = containerRef.current.querySelectorAll('button');
        const nextButton = buttons[nextIndex] as HTMLButtonElement;
        if (nextButton) {
          nextButton.focus();
        }
      }
    },
    [tabs, onChange]
  );

  // Get gradient for animated background
  const getGradient = (tab: DesktopTab) => {
    // Use custom gradient if provided
    if (tab.gradient) {
      return tab.gradient;
    }

    // Use status-specific gradients if enabled
    if (useStatusGradients) {
      const statusGradients: Record<string, string> = {
        all: 'from-[#001B51] to-[#002868]', // Navy gradient
        // Task statuses
        todo: 'from-gray-500 to-gray-600',
        in_progress: 'from-blue-600 to-blue-700',
        review: 'from-yellow-500 to-yellow-600',
        blocked: 'from-red-600 to-red-700',
        completed: 'from-green-600 to-green-700',
        // Project statuses
        planning: 'from-amber-500 to-amber-600',
        active: 'from-blue-600 to-blue-700',
        on_hold: 'from-orange-500 to-orange-600',
      };

      return statusGradients[tab.value] || 'from-[#001B51] to-[#002868]';
    }

    // Default GenHub navy gradient
    return 'from-[#001B51] to-[#002868]';
  };

  return (
    <div
      ref={containerRef}
      role="tablist"
      aria-label="Filter tabs"
      className={cn(
        // Container with Aceternity-inspired styling
        'relative grid gap-2',
        'p-1.5 bg-gray-100 rounded-xl',
        'border-2 border-gray-200',
        // Shadow for depth
        'shadow-sm',
        className
      )}
      style={{
        gridTemplateColumns: `repeat(${tabs.length}, minmax(0, 1fr))`,
      }}
    >
      {tabs.map((tab, index) => {
        const isActive = tab.value === value;
        const Icon = tab.icon;

        return (
          <button
            key={tab.value}
            ref={isActive ? activeRef : undefined}
            type="button"
            role="tab"
            aria-selected={isActive}
            aria-label={tab.description || tab.label}
            tabIndex={isActive ? 0 : -1}
            onClick={() => handleClick(tab.value)}
            onKeyDown={(e) => handleKeyDown(e, index)}
            className={cn(
              // Base styles - position relative for motion background
              'relative z-10',
              'inline-flex items-center justify-center gap-2',
              'w-full',
              // Height based on compact mode
              compact ? 'h-10 px-3' : 'h-12 px-4',
              'rounded-lg',
              // Typography
              'font-bold text-sm',
              // Transitions for non-background properties
              'transition-all duration-200',
              // Focus styles for keyboard navigation
              'focus:outline-none focus:ring-2 focus:ring-[#001B51] focus:ring-offset-2 focus:ring-offset-gray-100',
              // Hover and active states
              isActive
                ? 'text-white'
                : cn(
                    'text-gray-600',
                    'hover:text-gray-900 hover:bg-gray-200/50',
                    'active:scale-[0.98]'
                  ),
              // Cursor
              'cursor-pointer'
            )}
          >
            {/* Content layer */}
            {Icon && (
              <Icon
                className={cn(
                  'flex-shrink-0',
                  compact ? 'w-4 h-4' : 'w-5 h-5'
                )}
              />
            )}
            <span className="whitespace-nowrap truncate">{tab.label}</span>

            {/* Count badge */}
            {showCounts && tab.count !== undefined && tab.count >= 0 && (
              <span
                className={cn(
                  'inline-flex items-center justify-center',
                  'min-w-[22px] h-[22px] px-1.5',
                  'rounded-full text-xs font-black',
                  'transition-colors duration-200',
                  isActive
                    ? 'bg-white/20 text-white'
                    : 'bg-gray-200 text-gray-700 group-hover:bg-gray-300'
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
                  'absolute inset-0 rounded-lg',
                  'bg-gradient-to-r shadow-md',
                  getGradient(tab)
                )}
                transition={{
                  type: 'spring',
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
