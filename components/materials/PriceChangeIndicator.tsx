'use client';

import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface PriceChangeIndicatorProps {
  percent: number | null | undefined;
  className?: string;
}

/**
 * PriceChangeIndicator Component
 *
 * Displays price change with color-coded icons:
 * - Red TrendingUp for price increases
 * - Green TrendingDown for price decreases
 * - Gray Minus for no change or null
 *
 * @component
 */
export function PriceChangeIndicator({ percent, className = '' }: PriceChangeIndicatorProps) {
  console.log('[PriceChangeIndicator] Rendering with percent:', percent);

  // Handle no change or null/undefined
  if (percent === null || percent === undefined || percent === 0) {
    return (
      <div className={`flex items-center gap-1 text-gray-500 ${className}`}>
        <Minus className="w-4 h-4" />
        <span className="text-sm">No change</span>
      </div>
    );
  }

  const isPositive = percent > 0;
  const color = isPositive ? 'text-red-600' : 'text-green-600';
  const Icon = isPositive ? TrendingUp : TrendingDown;

  return (
    <div className={`flex items-center gap-1 ${color} ${className}`}>
      <Icon className="w-4 h-4" />
      <span className="text-sm font-semibold">
        {isPositive ? '+' : ''}{percent.toFixed(1)}%
      </span>
    </div>
  );
}
