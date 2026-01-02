/**
 * BaseModalHeader Component
 * Construction-themed modal header with icon, title, subtitle, badges, and close button
 */

'use client';

import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { BaseModalHeaderProps } from './types';

export function BaseModalHeader({
  icon: Icon,
  title,
  subtitle,
  badges,
  onClose,
  theme,
  className,
}: BaseModalHeaderProps) {
  console.log('[BaseModalHeader] Rendering header:', {
    title,
    hasIcon: !!Icon,
    hasSubtitle: !!subtitle,
    hasBadges: !!badges,
    theme: theme.primary,
  });

  return (
    <div
      className={cn(
        'flex items-start justify-between gap-4 px-6 pt-6 pb-4',
        className
      )}
    >
      {/* Left side: Icon + Text */}
      <div className="flex items-start gap-4 flex-1 min-w-0">
        {/* Icon container with gradient background */}
        {Icon && (
          <div
            className="flex-shrink-0 h-12 w-12 rounded-xl flex items-center justify-center shadow-lg relative overflow-hidden"
            style={{
              background: `linear-gradient(135deg, ${theme.iconGradientFrom} 0%, ${theme.iconGradientTo} 100%)`,
            }}
          >
            {/* Blueprint grid overlay */}
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
            <Icon className="h-6 w-6 text-white relative z-10" strokeWidth={2.5} />
          </div>
        )}

        {/* Title, badges, and subtitle - multi-row layout */}
        <div className="flex flex-col gap-2 min-w-0 flex-1">
          {/* Row 1: Title and badges */}
          <div className="flex items-center gap-3 min-w-0 flex-wrap">
            {/* Title */}
            <h2
              className="text-xl font-bold tracking-tight leading-tight shrink-0"
              style={{ color: theme.primary }}
            >
              {title}
            </h2>

            {/* Badges slot */}
            {badges && (
              <div className="flex items-center gap-2 shrink-0">
                {badges}
              </div>
            )}
          </div>

          {/* Row 2: Subtitle */}
          {subtitle && (
            <p className="text-sm text-gray-600 leading-snug">
              {subtitle}
            </p>
          )}
        </div>
      </div>

      {/* Right side: Close button */}
      <button
        onClick={onClose}
        className={cn(
          'flex-shrink-0 h-10 w-10 rounded-full',
          'bg-gray-100 hover:bg-gray-200',
          'flex items-center justify-center',
          'transition-all duration-200',
          'hover:scale-105 active:scale-95',
          'focus:outline-none focus:ring-2 focus:ring-offset-2',
          'group relative overflow-hidden'
        )}
        style={{
          // @ts-ignore - CSS custom property
          '--tw-ring-color': theme.ring,
        }}
        aria-label="Close modal"
      >
        {/* Hover background effect */}
        <div
          className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
          style={{
            background: `radial-gradient(circle at center, ${theme.primaryLight}10 0%, transparent 70%)`,
          }}
        />

        <X className="h-5 w-5 text-gray-500 group-hover:text-gray-700 transition-colors relative z-10" />
      </button>
    </div>
  );
}
