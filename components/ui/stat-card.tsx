'use client';

import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * BaseStatCard Component
 *
 * Flexible, reusable statistics card supporting:
 * - Team dashboards (with gradient backgrounds)
 * - Summary cards (minimal design)
 * - Interactive cards (with onClick)
 * - Status indicators (with color-coded dots)
 * - Custom styling via className/valueClassName
 */

interface StatCardProps {
  // Core content
  label: string;
  value: string | number;
  subtext?: string;

  // Optional icon
  icon?: LucideIcon;
  iconColor?: string;

  // Styling variants
  variant?: 'neutral' | 'success' | 'danger' | 'warning';
  colorClass?: 'blue' | 'green' | 'accent' | 'yellow' | 'red';

  // Customization
  valueColor?: string;
  valueClassName?: string;
  className?: string;
  iconClassName?: string;

  // Optional features
  sublabel?: string;
  showStatusDot?: boolean;
  onClick?: () => void;
}

/**
 * Color definitions for theme variants
 */
const VARIANT_COLORS = {
  success: {
    dot: 'bg-[#059669] dark:bg-emerald-500',
    text: 'text-emerald-600 dark:text-emerald-400',
  },
  danger: {
    dot: 'bg-[#DC2626] dark:bg-red-500',
    text: 'text-red-600 dark:text-red-400',
  },
  warning: {
    dot: 'bg-[#F59E0B] dark:bg-amber-500',
    text: 'text-amber-600 dark:text-amber-400',
  },
  neutral: {
    dot: 'bg-gray-400 dark:bg-gray-600',
    text: 'text-gray-600 dark:text-gray-400',
  },
} as const;

/**
 * Construction-themed colors for colorClass variants
 * Includes dark mode support for all color definitions
 */
const CONSTRUCTION_COLOR_CLASSES = {
  blue: {
    gradient: 'from-construction-blue/5 to-construction-blue/10 dark:from-construction-blue/10 dark:to-construction-blue/5',
    iconBg: 'bg-construction-blue/10 dark:bg-construction-blue/20',
    iconBorder: 'border-construction-blue/20 dark:border-construction-blue/40',
    iconColor: 'text-construction-blue dark:text-blue-400',
    badgeColor: 'text-construction-blue/60 dark:text-blue-300/70',
    textColor: 'text-construction-blue dark:text-blue-400',
  },
  green: {
    gradient: 'from-construction-green/5 to-construction-green/10 dark:from-construction-green/10 dark:to-construction-green/5',
    iconBg: 'bg-construction-green/10 dark:bg-construction-green/20',
    iconBorder: 'border-construction-green/20 dark:border-construction-green/40',
    iconColor: 'text-construction-green dark:text-emerald-400',
    badgeColor: 'text-construction-green/60 dark:text-emerald-300/70',
    textColor: 'text-construction-green dark:text-emerald-400',
  },
  accent: {
    gradient: 'from-construction-accent/5 to-construction-accent/10 dark:from-construction-accent/10 dark:to-construction-accent/5',
    iconBg: 'bg-construction-accent/10 dark:bg-construction-accent/20',
    iconBorder: 'border-construction-accent/20 dark:border-construction-accent/40',
    iconColor: 'text-construction-accent dark:text-pink-400',
    badgeColor: 'text-construction-accent/60 dark:text-pink-300/70',
    textColor: 'text-construction-accent dark:text-pink-400',
  },
  yellow: {
    gradient: 'from-construction-yellow/5 to-construction-yellow/10 dark:from-construction-yellow/10 dark:to-construction-yellow/5',
    iconBg: 'bg-construction-yellow/10 dark:bg-construction-yellow/20',
    iconBorder: 'border-construction-yellow/20 dark:border-construction-yellow/40',
    iconColor: 'text-construction-yellow dark:text-yellow-400',
    badgeColor: 'text-construction-yellow/60 dark:text-yellow-300/70',
    textColor: 'text-construction-yellow dark:text-yellow-400',
  },
  red: {
    gradient: 'from-construction-red/5 to-construction-red/10 dark:from-construction-red/10 dark:to-construction-red/5',
    iconBg: 'bg-construction-red/10 dark:bg-construction-red/20',
    iconBorder: 'border-construction-red/20 dark:border-construction-red/40',
    iconColor: 'text-construction-red dark:text-red-400',
    badgeColor: 'text-construction-red/60 dark:text-red-300/70',
    textColor: 'text-construction-red dark:text-red-400',
  },
} as const;

export function StatCard({
  label,
  value,
  subtext,
  icon: Icon,
  iconColor = 'text-gray-500 dark:text-gray-400',
  variant,
  colorClass,
  valueColor = 'text-construction-blue dark:text-gray-100',
  valueClassName,
  className,
  iconClassName = 'w-3.5 h-3.5',
  sublabel,
  showStatusDot = false,
  onClick,
}: StatCardProps) {
  // Determine if this is a construction-themed card (colorClass) or simple card
  const isConstructionStyle = !!colorClass;
  const colors = colorClass ? CONSTRUCTION_COLOR_CLASSES[colorClass] : null;
  const variantColors = variant ? VARIANT_COLORS[variant] : null;

  // Get the status dot color
  const getDotColor = () => {
    if (!variantColors) return VARIANT_COLORS.neutral.dot;
    if (variant === 'danger' && value === 0) return VARIANT_COLORS.success.dot;
    if (variant === 'success' && value === 0) return VARIANT_COLORS.neutral.dot;
    if (variant === 'warning' && value === 0) return VARIANT_COLORS.success.dot;
    return variantColors.dot;
  };

  const Component = onClick ? 'button' : 'div';

  // Construction-themed card (team dashboard style)
  if (isConstructionStyle && colors) {
    return (
      <div className="relative group h-full">
        <div
          className={`absolute inset-0 bg-gradient-to-br ${colors.gradient} rounded-lg transform group-hover:scale-105 transition-transform`}
        />
        <div className="relative bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-lg p-3 md:p-5 shadow-construction hover:shadow-construction-lg transition-all h-full flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2 md:mb-3">
            {Icon && (
              <div className={`p-1.5 md:p-2 ${colors.iconBg} rounded-lg border-2 ${colors.iconBorder}`}>
                <Icon className={`h-4 w-4 md:h-5 md:w-5 ${colors.iconColor}`} />
              </div>
            )}
            <div className={`text-[10px] md:text-xs font-mono uppercase tracking-wider ${colors.badgeColor}`}>
              {label}
            </div>
          </div>
          <div>
            <div className={`text-2xl md:text-4xl font-black ${colors.textColor} leading-none mb-1`}>
              {value}
            </div>
            {sublabel && (
              <div className="text-xs md:text-sm font-bold text-gray-600 dark:text-gray-400">
                {sublabel}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Simple card (minimal style with optional status dot and onClick)
  return (
    <Component
      onClick={onClick}
      className={cn(
        'flex flex-col p-3 rounded-xl',
        'bg-gray-50/80 dark:bg-gray-800/80 border border-gray-100 dark:border-gray-700',
        'min-h-[76px]',
        // Touch feedback for interactive items
        onClick && [
          'active:scale-[0.98] active:bg-gray-100 dark:active:bg-gray-700',
          'transition-all duration-150',
          'cursor-pointer',
        ],
        className
      )}
    >
      {/* Header with icon and label */}
      <div className="flex items-center gap-1.5 mb-1">
        {Icon && (
          <div className="relative">
            <Icon className={cn(iconColor, iconClassName)} />
            {/* Status dot indicator */}
            {showStatusDot && (
              <div
                className={cn('absolute -top-1 -right-1 w-2 h-2 rounded-full', getDotColor())}
              />
            )}
          </div>
        )}
        <span className="text-[10px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider truncate">
          {label}
        </span>
      </div>

      {/* Value */}
      <span className={cn('text-base font-bold leading-tight', valueColor, valueClassName)}>
        {value}
      </span>

      {/* Subtext */}
      {subtext && <span className="text-[10px] text-gray-500 dark:text-gray-400 mt-0.5">{subtext}</span>}
    </Component>
  );
}
