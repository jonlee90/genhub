'use client';

import { type LucideIcon, TrendingUp, TrendingDown, Minus, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

export interface KPICardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  trend?: {
    value: number;
    direction: 'up' | 'down' | 'neutral';
    label?: string;
  };
  variant: 'default' | 'success' | 'warning' | 'danger';
  href?: string;
  isLoading?: boolean;
}

const variantStyles = {
  default: {
    border: 'border-gray-200',
    activeBorder: 'active:border-[#001B51]/40',
    iconBg: 'bg-[#001B51]/10',
    iconColor: 'text-[#001B51]',
    valueColor: 'text-[#001B51]',
    trendUp: 'text-[#059669]',
    trendDown: 'text-[#DC2626]',
    trendNeutral: 'text-gray-500',
  },
  success: {
    border: 'border-[#059669]/30 bg-[#059669]/5',
    activeBorder: 'active:border-[#059669]/60',
    iconBg: 'bg-[#059669]/15',
    iconColor: 'text-[#059669]',
    valueColor: 'text-[#059669]',
    trendUp: 'text-[#059669]',
    trendDown: 'text-[#DC2626]',
    trendNeutral: 'text-gray-500',
  },
  warning: {
    border: 'border-[#F59E0B]/30 bg-[#F59E0B]/5',
    activeBorder: 'active:border-[#F59E0B]/60',
    iconBg: 'bg-[#F59E0B]/15',
    iconColor: 'text-[#F59E0B]',
    valueColor: 'text-[#F59E0B]',
    trendUp: 'text-[#059669]',
    trendDown: 'text-[#DC2626]',
    trendNeutral: 'text-gray-500',
  },
  danger: {
    border: 'border-[#DC2626]/30 bg-[#DC2626]/5',
    activeBorder: 'active:border-[#DC2626]/60',
    iconBg: 'bg-[#DC2626]/15',
    iconColor: 'text-[#DC2626]',
    valueColor: 'text-[#DC2626]',
    trendUp: 'text-[#059669]',
    trendDown: 'text-[#DC2626]',
    trendNeutral: 'text-gray-500',
  },
} as const;

function KPICardSkeleton() {
  return (
    <div className="bg-white border-2 border-gray-200 rounded-xl p-4 animate-pulse min-h-[120px]">
      <div className="flex items-center gap-3 mb-3">
        <div className="w-10 h-10 bg-gray-200 rounded-lg flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <div className="h-3 w-20 bg-gray-200 rounded mb-2" />
          <div className="h-7 w-16 bg-gray-200 rounded" />
        </div>
      </div>
      <div className="h-4 w-24 bg-gray-200 rounded" />
    </div>
  );
}

function TrendIndicator({
  trend,
  variant,
}: {
  trend: NonNullable<KPICardProps['trend']>;
  variant: KPICardProps['variant'];
}) {
  const styles = variantStyles[variant];
  const TrendIcon =
    trend.direction === 'up'
      ? TrendingUp
      : trend.direction === 'down'
        ? TrendingDown
        : Minus;

  const trendColor =
    trend.direction === 'up'
      ? styles.trendUp
      : trend.direction === 'down'
        ? styles.trendDown
        : styles.trendNeutral;

  return (
    <div className={cn('flex items-center gap-1 text-xs font-semibold', trendColor)}>
      <TrendIcon className="w-3.5 h-3.5" />
      <span>
        {trend.direction !== 'neutral' && (trend.direction === 'up' ? '+' : '-')}
        {Math.abs(trend.value)}%
      </span>
    </div>
  );
}

export function KPICard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  variant,
  href,
  isLoading = false,
}: KPICardProps) {
  if (isLoading) {
    return <KPICardSkeleton />;
  }

  const styles = variantStyles[variant];

  const cardContent = (
    <div
      className={cn(
        'relative bg-white border-2 rounded-xl p-4 h-full min-h-[120px]',
        'transition-all duration-150',
        styles.border,
        href && [
          'cursor-pointer',
          styles.activeBorder,
          'active:scale-[0.98] active:bg-gray-50/50',
        ]
      )}
    >
      {/* Icon + Title Row */}
      <div className="flex items-start gap-3 mb-2">
        <div
          className={cn(
            'flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center',
            styles.iconBg
          )}
        >
          <Icon className={cn('w-5 h-5', styles.iconColor)} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide truncate">
            {title}
          </p>
          {/* Value */}
          <p className={cn('text-2xl md:text-3xl font-black leading-tight', styles.valueColor)}>
            {value}
          </p>
        </div>
        {/* Trend indicator - top right on mobile */}
        {trend && (
          <div className="flex-shrink-0">
            <TrendIndicator trend={trend} variant={variant} />
          </div>
        )}
      </div>

      {/* Subtitle + Link indicator */}
      <div className="flex items-center justify-between">
        {subtitle && (
          <p className="text-sm text-gray-500 truncate">{subtitle}</p>
        )}
        {href && (
          <ChevronRight className="w-4 h-4 text-gray-400 flex-shrink-0 ml-2" />
        )}
      </div>
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="block h-full">
        {cardContent}
      </Link>
    );
  }

  return cardContent;
}
