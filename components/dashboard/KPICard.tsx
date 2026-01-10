'use client';

import { type LucideIcon, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { motion } from 'framer-motion';
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
    border: 'border-gray-200 hover:border-[#001B51]/30',
    iconBg: 'bg-[#001B51]/10',
    iconBorder: 'border-[#001B51]/20',
    iconColor: 'text-[#001B51]',
    valueColor: 'text-[#001B51]',
    trendUp: 'text-[#059669]',
    trendDown: 'text-[#DC2626]',
    trendNeutral: 'text-gray-500',
  },
  success: {
    border: 'border-[#059669]/30 hover:border-[#059669]/50 bg-[#059669]/5',
    iconBg: 'bg-[#059669]/10',
    iconBorder: 'border-[#059669]/20',
    iconColor: 'text-[#059669]',
    valueColor: 'text-[#059669]',
    trendUp: 'text-[#059669]',
    trendDown: 'text-[#DC2626]',
    trendNeutral: 'text-gray-500',
  },
  warning: {
    border: 'border-[#F59E0B]/30 hover:border-[#F59E0B]/50 bg-[#F59E0B]/5',
    iconBg: 'bg-[#F59E0B]/10',
    iconBorder: 'border-[#F59E0B]/20',
    iconColor: 'text-[#F59E0B]',
    valueColor: 'text-[#F59E0B]',
    trendUp: 'text-[#059669]',
    trendDown: 'text-[#DC2626]',
    trendNeutral: 'text-gray-500',
  },
  danger: {
    border: 'border-[#DC2626]/30 hover:border-[#DC2626]/50 bg-[#DC2626]/5',
    iconBg: 'bg-[#DC2626]/10',
    iconBorder: 'border-[#DC2626]/20',
    iconColor: 'text-[#DC2626]',
    valueColor: 'text-[#DC2626]',
    trendUp: 'text-[#059669]',
    trendDown: 'text-[#DC2626]',
    trendNeutral: 'text-gray-500',
  },
} as const;

function KPICardSkeleton() {
  return (
    <div className="bg-white border-2 border-gray-200 rounded-lg p-3 md:p-4 animate-pulse">
      <div className="flex items-start justify-between mb-2 md:mb-3">
        <div className="flex items-center gap-2 md:gap-3">
          <div className="p-1.5 md:p-2 bg-gray-200 rounded-lg w-8 h-8 md:w-10 md:h-10" />
          <div className="h-3 md:h-4 w-16 md:w-20 bg-gray-200 rounded" />
        </div>
        <div className="h-4 md:h-5 w-12 md:w-14 bg-gray-200 rounded" />
      </div>
      <div className="h-8 md:h-10 w-20 md:w-24 bg-gray-200 rounded mb-1 md:mb-2" />
      <div className="h-3 md:h-4 w-24 md:w-32 bg-gray-200 rounded" />
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
    <div className={cn('flex items-center gap-1 text-xs md:text-sm font-medium', trendColor)}>
      <TrendIcon className="w-3 h-3 md:w-4 md:h-4" />
      <span>
        {trend.direction !== 'neutral' && (trend.direction === 'up' ? '+' : '-')}
        {Math.abs(trend.value)}%
      </span>
      {trend.label && (
        <span className="text-gray-500 text-[10px] md:text-xs ml-0.5">{trend.label}</span>
      )}
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
  console.log('[KPICard] Rendering:', { title, value, variant, isLoading });

  if (isLoading) {
    return <KPICardSkeleton />;
  }

  const styles = variantStyles[variant];

  const cardContent = (
    <motion.div
      className={cn(
        'relative bg-white border-2 rounded-lg p-3 md:p-4 transition-colors h-full',
        styles.border,
        href && 'cursor-pointer'
      )}
      whileHover={{
        scale: 1.02,
        boxShadow: '0 4px 12px rgba(0, 27, 81, 0.1)',
      }}
      whileTap={href ? { scale: 0.98 } : undefined}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
    >
      {/* Header: Icon + Title + Trend */}
      <div className="flex items-start justify-between mb-2 md:mb-3">
        <div className="flex items-center gap-2 md:gap-3">
          <div
            className={cn(
              'p-1.5 md:p-2 rounded-lg border-2',
              styles.iconBg,
              styles.iconBorder
            )}
          >
            <Icon className={cn('w-4 h-4 md:w-5 md:h-5', styles.iconColor)} />
          </div>
          <span className="text-xs md:text-sm font-medium text-gray-600 uppercase tracking-wide">
            {title}
          </span>
        </div>
        {trend && <TrendIndicator trend={trend} variant={variant} />}
      </div>

      {/* Value */}
      <div className={cn('text-2xl md:text-3xl font-black leading-none mb-1', styles.valueColor)}>
        {value}
      </div>

      {/* Subtitle */}
      {subtitle && (
        <div className="text-xs md:text-sm text-gray-500">{subtitle}</div>
      )}
    </motion.div>
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
