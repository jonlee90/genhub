/**
 * BottomSheetModalHeader Component
 * Mobile-optimized header with icon, title, badges, and close button
 * 44px minimum touch targets for field worker usability
 */

'use client';

import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { BottomSheetModalHeaderProps } from './types';

export function BottomSheetModalHeader({
  icon: Icon,
  title,
  badges,
  onClose,
  themePrimary,
  themeGradientFrom,
  themeGradientTo,
  iconColor,
  className,
}: BottomSheetModalHeaderProps) {
  // Don't render if no title or icon
  if (!title && !Icon) {
    return null;
  }

  // Use iconColor if provided, otherwise use theme gradient
  const iconBackground = iconColor
    ? iconColor
    : `linear-gradient(135deg, ${themeGradientFrom} 0%, ${themeGradientTo} 100%)`;

  return (
    <div
      className={cn(
        'flex items-center justify-between gap-3 px-5 pt-2 pb-3',
        className
      )}
    >
      {/* Left side: Icon + Title + Badges */}
      <div className="flex items-center gap-3 flex-1 min-w-0">
        {/* Icon container with gradient background */}
        {Icon && (
          <div
            className="flex-shrink-0 h-11 w-11 min-h-[44px] min-w-[44px] rounded-xl flex items-center justify-center shadow-md relative overflow-hidden"
            style={{
              background: iconBackground,
            }}
          >
            {/* Blueprint grid overlay for construction theme */}
            <div
              className="absolute inset-0 opacity-10"
              style={{
                backgroundImage: `
                  linear-gradient(0deg, transparent 24%, rgba(255, 255, 255, 0.3) 25%, rgba(255, 255, 255, 0.3) 26%, transparent 27%, transparent 74%, rgba(255, 255, 255, 0.3) 75%, rgba(255, 255, 255, 0.3) 76%, transparent 77%, transparent),
                  linear-gradient(90deg, transparent 24%, rgba(255, 255, 255, 0.3) 25%, rgba(255, 255, 255, 0.3) 26%, transparent 27%, transparent 74%, rgba(255, 255, 255, 0.3) 75%, rgba(255, 255, 255, 0.3) 76%, transparent 77%, transparent)
                `,
                backgroundSize: '8px 8px',
              }}
            />
            <Icon className="h-5 w-5 text-white relative z-10" strokeWidth={2.5} />
          </div>
        )}

        {/* Title */}
        {title && (
          <h2
            className="text-lg font-bold tracking-tight leading-tight truncate"
            style={{ color: themePrimary }}
          >
            {title}
          </h2>
        )}

        {/* Badges */}
        {badges && (
          <div className="flex items-center gap-1.5 shrink-0">
            {badges}
          </div>
        )}
      </div>

      {/* Right side: Close button - 44px touch target */}
      <button
        onClick={onClose}
        className={cn(
          'flex-shrink-0',
          'h-11 w-11 min-h-[44px] min-w-[44px]', // 44px touch target
          'rounded-full',
          'bg-gray-100 dark:bg-gray-700',
          'flex items-center justify-center',
          'transition-all duration-150',
          'active:scale-95 active:bg-gray-200 dark:active:bg-gray-600',
          'focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-400'
        )}
        aria-label="Close"
      >
        <X className="h-5 w-5 text-gray-600 dark:text-gray-300" />
      </button>
    </div>
  );
}
