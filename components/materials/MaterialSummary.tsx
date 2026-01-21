'use client';

import {
  Package,
  DollarSign,
  TrendingUp,
  Clock,
  Eye,
  AlertCircle,
  Boxes,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { StatCard } from '@/components/ui/stat-card';
import type { MaterialSummaryStats } from '@/app/actions/materials';

interface MaterialSummaryProps {
  stats: MaterialSummaryStats;
  trackedCount: number;
  className?: string;
}

/**
 * MaterialSummary Component - Mobile PWA Optimized
 *
 * A premium, mobile-first material analytics card designed for construction
 * field workers. Features touch-optimized interactions, high contrast
 * for outdoor visibility, and a clean visual hierarchy.
 *
 * Design Principles:
 * - Mobile-first with 44px+ touch targets
 * - High contrast for outdoor/bright sun visibility
 * - Clear visual hierarchy with scannable stats
 * - Native app feel with smooth transitions
 * - Construction-themed with GenHub design system
 *
 * Pattern: Follows ProjectTaskSummary card layout
 *
 * @component
 */
export function MaterialSummary({
  stats,
  trackedCount,
  className = '',
}: MaterialSummaryProps) {
  // Calculate utilization percentage
  const trackingUtilization = (trackedCount / 10) * 100;
  const isNearLimit = trackingUtilization > 70;
  const hasPriceIncreases = stats.price_increases_last_7_days > 0;

  return (
    <div
      className={cn(
        'bg-white dark:bg-gray-800 rounded-xl overflow-hidden',
        'border-2 border-gray-200 dark:border-gray-700 shadow-sm',
        'transition-all duration-200',
        className
      )}
    >
      {/* Header */}
      <div className="px-4 py-3.5 border-b border-gray-100 dark:border-gray-700 bg-gradient-to-r from-gray-50/80 to-white dark:from-gray-900/80 dark:to-gray-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-construction-blue dark:bg-blue-600 flex items-center justify-center shadow-sm">
            <Package className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-construction-blue dark:text-gray-100 text-sm uppercase tracking-wide">
              Material Summary
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              {stats.total_materials_linked} materials linked
            </p>
          </div>
          {/* Quick Status Badge */}
          <div
            className={cn(
              'px-2.5 py-1 rounded-lg text-xs font-bold',
              hasPriceIncreases
                ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400'
                : 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400'
            )}
          >
            {hasPriceIncreases ? 'Price Alert' : 'Stable'}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-4">
        {/* Progress Bars Section */}
        <div className="space-y-4 mb-5">
          {/* Tracking Utilization */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Eye className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Tracking Slots
                </span>
              </div>
              <span
                className={cn(
                  'text-sm font-bold tabular-nums',
                  isNearLimit ? 'text-[#F59E0B] dark:text-amber-400' : 'text-construction-blue dark:text-gray-100'
                )}
              >
                {trackedCount}/10
              </span>
            </div>
            <div className="h-2.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
              <div
                className={cn(
                  'h-full rounded-full transition-all duration-500 ease-out',
                  isNearLimit ? 'bg-[#F59E0B] dark:bg-amber-500' : 'bg-construction-blue dark:bg-blue-600'
                )}
                style={{ width: `${trackingUtilization}%` }}
              />
            </div>
          </div>
        </div>

        {/* Stats Grid - 3 columns on mobile, responsive */}
        <div className="grid grid-cols-3 gap-2.5 mb-4">
          {/* Total Materials */}
          <StatCard
            icon={Boxes}
            label="Total"
            value={stats.total_materials_linked}
            subtext="Linked"
          />

          {/* Estimated Cost */}
          <StatCard
            icon={DollarSign}
            label="Est. Cost"
            value={`$${formatCompactNumber(stats.total_estimated_cost)}`}
            subtext="Total"
          />

          {/* Lead Time */}
          <StatCard
            icon={Clock}
            label="Lead Time"
            value={stats.average_lead_time_days}
            subtext="Avg Days"
          />
        </div>

        {/* Status Indicators Grid - 2 columns */}
        <div className="grid grid-cols-2 gap-2.5 mb-4">
          {/* Price Increases */}
          <StatCard
            icon={TrendingUp}
            label="Price Increases"
            value={stats.price_increases_last_7_days}
            subtext="Last 7 days"
            variant={hasPriceIncreases ? 'danger' : 'success'}
            showStatusDot
          />

          {/* Tracked Materials */}
          <StatCard
            icon={Eye}
            label="Tracked"
            value={trackedCount}
            subtext="Watchlist"
            variant={trackedCount > 0 ? 'success' : 'neutral'}
            showStatusDot
          />
        </div>

        {/* Price Alert Banner */}
        {hasPriceIncreases && (
          <div
            className={cn(
              'flex items-center gap-3 p-3 rounded-xl',
              'transition-all duration-200',
              'bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800'
            )}
          >
            <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 bg-amber-100 dark:bg-amber-900/40">
              <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-amber-800 dark:text-amber-300">
                {stats.price_increases_last_7_days} price increase{stats.price_increases_last_7_days !== 1 ? 's' : ''} detected
              </p>
              <p className="text-xs mt-0.5 text-amber-600 dark:text-amber-400">
                Review tracked materials for updates
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Format large numbers in compact form (1K, 1.2M, etc.)
 */
function formatCompactNumber(num: number): string {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
  }
  return num.toLocaleString();
}
