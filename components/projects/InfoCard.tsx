'use client';

import { ReactNode, useMemo } from 'react';
// Performance optimization: Direct imports instead of barrel file (saves 200-800ms per page)
import ChevronRight from 'lucide-react/icons/chevron-right';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * InfoCard field configuration
 * Supports various display types: progress bars, badges, links, and regular fields
 */
export interface InfoCardField {
  label: string;
  value: string | number | ReactNode;
  icon?: LucideIcon;
  href?: string;
  hrefType?: 'email' | 'tel' | 'link';
  show?: boolean; // Conditional rendering
  isProgressBar?: boolean;
  progressValue?: number;
  progressColor?: string;
  isBadge?: boolean;
  badgeColor?: string;
  className?: string;
}

/**
 * Stat item for compact mobile displays
 */
export interface StatItem {
  label: string;
  value: string | number;
  icon?: LucideIcon;
  iconColor?: string;
  valueColor?: string;
  subtext?: string;
  onClick?: () => void;
}

/**
 * InfoCard component props
 */
export interface InfoCardProps {
  headerIcon?: LucideIcon; // Optional when customHeader is provided
  headerTitle: string;
  headerDescription: string;
  fields: InfoCardField[];
  columns?: 1 | 2 | 3 | 4; // Column layout (default: 1)
  footerContent?: ReactNode;
  className?: string;
  customHeader?: ReactNode; // Optional custom header to override default
  isHeroCard?: boolean; // Larger header styling for title sections
  // Mobile-optimized stat grid (alternative to fields)
  statItems?: StatItem[];
  // Compact mode for mobile - reduces padding and spacing
  compact?: boolean;
}

/**
 * InfoCard - Mobile-First Information Display Component
 *
 * A premium, touch-optimized card for displaying structured information
 * with construction-themed styling. Designed for field workers using
 * the PWA on construction sites.
 *
 * Features:
 * - Mobile-first with 44px+ touch targets
 * - Supports 1-4 column layouts with responsive behavior
 * - Progress bars, badges, and custom content
 * - Touch feedback on interactive elements
 * - High contrast for outdoor visibility
 * - Interactive fields (email, phone, links) with native app feel
 * - Compact stat grid mode for mobile dashboards
 */
export function InfoCard({
  headerIcon: HeaderIcon,
  headerTitle,
  headerDescription,
  fields,
  columns = 1,
  footerContent,
  className,
  customHeader,
  isHeroCard = false,
  statItems,
  compact = false,
}: InfoCardProps) {
  // Performance optimization: Memoize filtered fields
  const visibleFields = useMemo(
    () => fields.filter((field) => field.show !== false),
    [fields]
  );

  // Responsive grid classes based on column count
  // Mobile-first: 2 columns on mobile (< md), expanding on desktop
  const gridClasses = {
    1: '',
    2: 'grid grid-cols-2 gap-3 md:gap-4',
    3: 'grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-4',
    4: 'grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4',
  };

  return (
    <div
      className={cn(
        // Base card styling - rounded-xl for mobile native feel
        'bg-white rounded-xl overflow-hidden',
        // Border with subtle navy accent
        'border-2 border-gray-200',
        // Shadow for depth - premium feel
        'shadow-sm',
        // Transition for any state changes
        'transition-all duration-200',
        className
      )}
    >
      {/* Header */}
      {customHeader ? (
        <div
          className={cn(
            'border-b border-gray-100 bg-gradient-to-r from-gray-50/80 to-white',
            isHeroCard ? 'p-4 md:p-5' : compact ? 'px-3.5 py-3' : 'px-4 py-3.5'
          )}
        >
          {customHeader}
        </div>
      ) : (
        <div
          className={cn(
            'border-b border-gray-100 bg-gradient-to-r from-gray-50/80 to-white',
            isHeroCard ? 'p-4 md:p-5' : compact ? 'px-3.5 py-3' : 'px-4 py-3.5'
          )}
        >
          <div className="flex items-center gap-3">
            {HeaderIcon && (
              <div
                className={cn(
                  // Icon container with navy background
                  'flex items-center justify-center rounded-xl bg-[#001B51]',
                  // Touch-friendly sizing
                  isHeroCard ? 'w-11 h-11' : compact ? 'w-9 h-9' : 'w-10 h-10',
                  // Subtle shadow for depth
                  'shadow-sm'
                )}
              >
                <HeaderIcon
                  className={cn(
                    'text-white',
                    isHeroCard ? 'w-5 h-5' : compact ? 'w-4 h-4' : 'w-5 h-5'
                  )}
                />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <h3
                className={cn(
                  'font-bold text-[#001B51] truncate',
                  isHeroCard
                    ? 'text-lg md:text-xl'
                    : compact
                      ? 'text-sm uppercase tracking-wide'
                      : 'text-sm uppercase tracking-wide'
                )}
              >
                {headerTitle}
              </h3>
              <p
                className={cn(
                  'text-gray-500 truncate',
                  isHeroCard ? 'text-sm mt-0.5' : 'text-xs mt-0.5'
                )}
              >
                {headerDescription}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Content */}
      <div
        className={cn(
          isHeroCard ? 'p-4 md:p-5' : compact ? 'p-3.5' : 'p-4',
          columns > 1 ? gridClasses[columns] : 'space-y-3'
        )}
      >
        {/* Mobile-optimized stat grid */}
        {statItems && statItems.length > 0 && (
          <div className="grid grid-cols-2 gap-2.5 mb-3">
            {statItems.map((stat, index) => (
              <StatCard key={index} {...stat} />
            ))}
          </div>
        )}

        {visibleFields.map((field, index) => (
          <div
            key={index}
            className={cn(columns === 1 ? '' : 'space-y-1', field.className)}
          >
            {/* Field Label - Clear uppercase for easy scanning */}
            <div
              className={cn(
                'font-semibold text-gray-400 uppercase tracking-wider',
                isHeroCard ? 'text-xs mb-1.5' : compact ? 'text-[10px] mb-0.5' : 'text-[10px] mb-1'
              )}
            >
              {field.label}
            </div>

            {/* Progress Bar */}
            {field.isProgressBar && typeof field.progressValue === 'number' && (
              <div className="flex items-center gap-3">
                <div
                  className={cn(
                    'flex-1 bg-gray-100 rounded-full overflow-hidden',
                    isHeroCard ? 'h-2.5' : 'h-2'
                  )}
                >
                  <div
                    className={cn(
                      'h-full rounded-full transition-all duration-500 ease-out',
                      field.progressColor || 'bg-[#001B51]'
                    )}
                    style={{ width: `${Math.min(100, field.progressValue)}%` }}
                  />
                </div>
                <span
                  className={cn(
                    'font-bold text-[#001B51] min-w-[3ch] text-right tabular-nums',
                    isHeroCard ? 'text-base' : 'text-sm'
                  )}
                >
                  {field.value}
                </span>
              </div>
            )}

            {/* Badge */}
            {field.isBadge && !field.isProgressBar && (
              <div
                className={cn(
                  'inline-flex items-center gap-2 px-3 py-1.5 rounded-lg',
                  'bg-gray-100 border border-gray-200',
                  // Minimum touch target on interactive badges
                  'min-h-[32px]',
                  field.badgeColor
                )}
              >
                {field.icon && (
                  <field.icon className="w-4 h-4 flex-shrink-0" />
                )}
                <span className="text-sm font-semibold text-gray-900">
                  {field.value}
                </span>
              </div>
            )}

            {/* Interactive Link (email/phone/link) - Touch Optimized */}
            {field.href && !field.isProgressBar && !field.isBadge && (
              <a
                href={
                  field.hrefType === 'email'
                    ? `mailto:${field.href}`
                    : field.hrefType === 'tel'
                      ? `tel:${field.href}`
                      : field.href
                }
                className={cn(
                  // Flex layout with icon
                  'flex items-center gap-2',
                  // Touch-friendly sizing - 44px minimum
                  'min-h-[44px] -my-1.5 py-1.5',
                  // Typography
                  'font-semibold text-[#001B51]',
                  isHeroCard ? 'text-base' : 'text-sm',
                  // Touch feedback states
                  'active:opacity-70 active:scale-[0.99]',
                  'transition-all duration-100',
                  // Group for icon animation
                  'group/link'
                )}
              >
                {field.icon && (
                  <span
                    className={cn(
                      'flex items-center justify-center',
                      'w-8 h-8 rounded-lg',
                      'bg-[#001B51]/5',
                      'group-active/link:bg-[#001B51]/10',
                      'transition-colors duration-100'
                    )}
                  >
                    <field.icon
                      className={cn(
                        'text-[#001B51]',
                        isHeroCard ? 'w-4 h-4' : 'w-4 h-4'
                      )}
                    />
                  </span>
                )}
                <span
                  className={cn(
                    'flex-1',
                    field.hrefType === 'email' ? 'break-all' : '',
                    'group-active/link:opacity-70'
                  )}
                >
                  {field.value}
                </span>
                <ChevronRight
                  className={cn(
                    'w-4 h-4 text-gray-400',
                    'group-active/link:translate-x-0.5',
                    'transition-transform duration-100'
                  )}
                />
              </a>
            )}

            {/* Regular Field */}
            {!field.href && !field.isProgressBar && !field.isBadge && (
              <div
                className={cn(
                  'font-semibold text-gray-900',
                  isHeroCard ? 'text-base' : compact ? 'text-sm' : 'text-sm',
                  field.icon && 'flex items-center gap-2'
                )}
              >
                {field.icon && (
                  <span
                    className={cn(
                      'flex items-center justify-center',
                      'w-7 h-7 rounded-md',
                      'bg-gray-100'
                    )}
                  >
                    <field.icon
                      className={cn(
                        'text-[#001B51]',
                        isHeroCard ? 'w-4 h-4' : 'w-3.5 h-3.5'
                      )}
                    />
                  </span>
                )}
                <span className="leading-tight">{field.value}</span>
              </div>
            )}
          </div>
        ))}

        {/* Footer Content */}
        {footerContent}
      </div>
    </div>
  );
}

/**
 * StatCard - Compact stat display for mobile dashboards
 * Touch-optimized with clear visual hierarchy
 */
function StatCard({
  label,
  value,
  icon: Icon,
  iconColor = 'text-[#001B51]',
  valueColor = 'text-gray-900',
  subtext,
  onClick,
}: StatItem) {
  const Component = onClick ? 'button' : 'div';

  return (
    <Component
      onClick={onClick}
      className={cn(
        'flex flex-col p-3 rounded-xl',
        'bg-gray-50/80 border border-gray-100',
        // Minimum touch target
        'min-h-[76px]',
        // Touch feedback for interactive items
        onClick && [
          'active:scale-[0.98] active:bg-gray-100',
          'transition-all duration-150',
          'cursor-pointer'
        ]
      )}
    >
      <div className="flex items-center gap-2 mb-1.5">
        {Icon && <Icon className={cn('w-4 h-4 flex-shrink-0', iconColor)} />}
        <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider truncate">
          {label}
        </span>
      </div>
      <span className={cn('text-lg font-bold leading-tight', valueColor)}>
        {value}
      </span>
      {subtext && (
        <span className="text-[11px] text-gray-500 mt-0.5">{subtext}</span>
      )}
    </Component>
  );
}
