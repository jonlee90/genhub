'use client';

import { memo, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { StatCard } from '@/components/ui/stat-card';
import type { SubcontractorsRow } from '@/types/db/tables/companies';
import type { TradeType } from '@/types/db/enums';
// Performance optimization: Direct imports instead of barrel file
import Users from 'lucide-react/icons/users';
import CheckCircle from 'lucide-react/icons/check-circle';
import Star from 'lucide-react/icons/star';
import AlertTriangle from 'lucide-react/icons/alert-triangle';
import HardHat from 'lucide-react/icons/hard-hat';

interface SubcontractorPortfolioProps {
  subcontractors: SubcontractorsRow[];
  stats: {
    total: number;
    active: number;
    expiringLicenses: number;
    expiringInsurance: number;
  };
  compact?: boolean;
}

// Trade labels for display
const TRADE_LABELS: Record<TradeType, string> = {
  electrical: 'Electrical',
  plumbing: 'Plumbing',
  hvac: 'HVAC',
  carpentry: 'Carpentry',
  masonry: 'Masonry',
  roofing: 'Roofing',
  flooring: 'Flooring',
  painting: 'Painting',
  drywall: 'Drywall',
  concrete: 'Concrete',
  landscaping: 'Landscaping',
  demolition: 'Demolition',
  steel_work: 'Steel Work',
  glass_glazing: 'Glass & Glazing',
  fire_protection: 'Fire Protection',
  insulation: 'Insulation',
  framing: 'Framing',
  general: 'General',
  other: 'Other',
};

export const SubcontractorPortfolio = memo(function SubcontractorPortfolio({
  subcontractors,
  stats,
  compact = false,
}: SubcontractorPortfolioProps) {
  // Calculate additional metrics
  const portfolioMetrics = useMemo(() => {
    const activeSubcontractors = subcontractors.filter((s) => s.is_active);

    // Calculate average rating
    const ratedSubcontractors = activeSubcontractors.filter((s) => s.performance_rating);
    const avgRating =
      ratedSubcontractors.length > 0
        ? ratedSubcontractors.reduce((sum, s) => sum + (s.performance_rating || 0), 0) /
          ratedSubcontractors.length
        : 0;

    // Trade distribution
    const tradeCounts = new Map<TradeType, number>();
    activeSubcontractors.forEach((s) => {
      if (s.trade_specialization) {
        tradeCounts.set(s.trade_specialization, (tradeCounts.get(s.trade_specialization) || 0) + 1);
      }
    });
    const tradeDistribution = Array.from(tradeCounts.entries())
      .map(([trade, count]) => ({ trade, count }))
      .sort((a, b) => b.count - a.count);

    // Performance distribution
    const ratingCounts = new Map<number, number>();
    ratedSubcontractors.forEach((s) => {
      if (s.performance_rating) {
        const rating = Math.floor(s.performance_rating);
        ratingCounts.set(rating, (ratingCounts.get(rating) || 0) + 1);
      }
    });
    const performanceDistribution = Array.from(ratingCounts.entries())
      .map(([rating, count]) => ({ rating, count }))
      .sort((a, b) => b.rating - a.rating);

    const totalExpiring = stats.expiringLicenses + stats.expiringInsurance;

    return {
      avgRating,
      tradeDistribution,
      performanceDistribution,
      totalExpiring,
      uniqueTrades: tradeCounts.size,
    };
  }, [subcontractors, stats]);

  // Determine health status based on expiring docs
  const healthStatus = portfolioMetrics.totalExpiring === 0
    ? 'healthy'
    : portfolioMetrics.totalExpiring <= 2
      ? 'at-risk'
      : 'needs-attention';

  return (
    <div
      className={cn(
        'bg-white dark:bg-gray-900 rounded-xl overflow-hidden',
        'border-2 border-gray-200 dark:border-gray-700 shadow-sm',
        'transition-all duration-200'
      )}
    >
      {/* Header */}
      <div className="px-4 py-3.5 border-b border-gray-100 dark:border-gray-800 bg-gradient-to-r from-gray-50/80 dark:from-gray-800/50 to-white dark:to-gray-900">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-construction-blue dark:bg-construction-blue flex items-center justify-center shadow-sm">
            <HardHat className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-construction-blue dark:text-construction-blue text-sm uppercase tracking-wide">
              Subcontractor Details
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              {stats.active} active subcontractor{stats.active !== 1 ? 's' : ''}
            </p>
          </div>
          {/* Status Badge */}
          <div
            className={cn(
              'px-2.5 py-1 rounded-lg text-xs font-bold',
              healthStatus === 'needs-attention'
                ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                : healthStatus === 'at-risk'
                  ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400'
                  : 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400'
            )}
          >
            {healthStatus === 'needs-attention' ? 'Docs Expiring' : healthStatus === 'at-risk' ? 'Review Soon' : 'Healthy'}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-4">
        {/* Primary Stats Grid */}
        <div className="grid grid-cols-3 gap-2.5 mb-4">
          <StatCard
            icon={Users}
            label="Total"
            value={stats.total}
            subtext="Subcontractors"
          />
          <StatCard
            icon={CheckCircle}
            label="Active"
            value={stats.active}
            subtext="On Roster"
            variant="success"
            showStatusDot
          />
          <StatCard
            icon={Star}
            label="Avg Rating"
            value={portfolioMetrics.avgRating > 0 ? portfolioMetrics.avgRating.toFixed(1) : 'N/A'}
            subtext="Performance"
            variant={portfolioMetrics.avgRating >= 4 ? 'success' : portfolioMetrics.avgRating >= 3 ? 'warning' : 'neutral'}
          />
        </div>

        {/* Secondary Stats Grid */}
        <div className="grid grid-cols-2 gap-2.5 mb-4">
          <StatCard
            icon={AlertTriangle}
            label="Expiring"
            value={portfolioMetrics.totalExpiring}
            subtext="Docs to Renew"
            variant={portfolioMetrics.totalExpiring > 0 ? 'danger' : 'success'}
            showStatusDot={portfolioMetrics.totalExpiring > 0}
          />
          <StatCard
            icon={HardHat}
            label="Trades"
            value={portfolioMetrics.uniqueTrades}
            subtext="Specializations"
          />
        </div>

        {/* Trade Distribution - hidden on mobile (compact) */}
        {!compact && portfolioMetrics.tradeDistribution.length > 0 && (
          <div className="pt-4 border-t border-gray-100 dark:border-gray-800">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Trade Distribution
              </span>
            </div>
            <div className="space-y-2.5">
              {portfolioMetrics.tradeDistribution.slice(0, 5).map(({ trade, count }) => {
                const maxCount = Math.max(...portfolioMetrics.tradeDistribution.map((t) => t.count), 1);
                const percentage = (count / maxCount) * 100;
                return (
                  <div key={trade} className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        {TRADE_LABELS[trade]}
                      </span>
                      <span className="text-sm font-bold text-construction-blue dark:text-construction-blue tabular-nums">
                        {count}
                      </span>
                    </div>
                    <div className="h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500 ease-out bg-construction-blue dark:bg-construction-blue"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Performance Ratings - hidden on mobile (compact) */}
        {!compact && portfolioMetrics.performanceDistribution.length > 0 && (
          <div className="pt-4 border-t border-gray-100 dark:border-gray-800 mt-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Performance Ratings
              </span>
              <div className="flex items-center gap-1">
                <Star className="h-3.5 w-3.5 fill-construction-yellow text-construction-yellow" />
                <span className="text-xs font-bold text-gray-700 dark:text-gray-300">
                  {portfolioMetrics.avgRating.toFixed(1)} avg
                </span>
              </div>
            </div>
            <div className="space-y-2">
              {portfolioMetrics.performanceDistribution.map(({ rating, count }) => {
                const maxCount = Math.max(...portfolioMetrics.performanceDistribution.map((p) => p.count), 1);
                const percentage = (count / maxCount) * 100;
                return (
                  <div key={rating} className="flex items-center gap-3">
                    <div className="flex items-center gap-0.5 w-16">
                      {[...Array(rating)].map((_, i) => (
                        <Star
                          key={i}
                          className="h-3 w-3 fill-construction-yellow text-construction-yellow"
                        />
                      ))}
                    </div>
                    <div className="flex-1 bg-gray-100 dark:bg-gray-800 rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-construction-yellow dark:bg-yellow-500 h-full rounded-full transition-all duration-300"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    <span className="text-xs font-bold text-gray-700 dark:text-gray-300 w-8 text-right tabular-nums">
                      {count}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
});
