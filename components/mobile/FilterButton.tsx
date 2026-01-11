'use client';

/**
 * FilterButton Component
 *
 * Touch-friendly button that opens filter options.
 * Shows badge with active filter count.
 *
 * Features:
 * - 44px minimum touch target
 * - Filter icon with optional count badge
 * - Active state styling
 * - Haptic feedback
 */

import { useCallback } from 'react';
import { SlidersHorizontal } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FilterButtonProps {
  /** Click handler */
  onClick: () => void;
  /** Number of active filters */
  count?: number;
  /** Disabled state */
  disabled?: boolean;
  /** Additional className */
  className?: string;
  /** Accessible label */
  ariaLabel?: string;
}

export function FilterButton({
  onClick,
  count = 0,
  disabled = false,
  className,
  ariaLabel = 'Open filters',
}: FilterButtonProps) {
  // Handle click with haptic feedback
  const handleClick = useCallback(() => {
    if (disabled) return;

    // Trigger haptic feedback
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(10);
    }

    onClick();
  }, [disabled, onClick]);

  const hasActiveFilters = count > 0;

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={disabled}
      aria-label={ariaLabel}
      className={cn(
        // Base styles
        'relative inline-flex items-center justify-center',
        'min-w-[44px] h-12 px-3',
        'rounded-xl',
        'font-medium text-sm',
        'select-none touch-manipulation',

        // Color based on active state
        hasActiveFilters
          ? 'bg-[#001B51] text-white'
          : 'bg-gray-100 text-gray-700',

        // Touch feedback
        'active:scale-95',
        'transition-all duration-100',

        // Disabled
        'disabled:opacity-50 disabled:pointer-events-none',

        className
      )}
    >
      <SlidersHorizontal className="w-5 h-5" />

      {/* Count badge */}
      {hasActiveFilters && (
        <span
          className={cn(
            'absolute -top-1.5 -right-1.5',
            'inline-flex items-center justify-center',
            'min-w-[20px] h-5 px-1',
            'rounded-full',
            'text-xs font-bold',
            'bg-[#DC2626] text-white',
            'border-2 border-white'
          )}
        >
          {count > 9 ? '9+' : count}
        </span>
      )}
    </button>
  );
}
