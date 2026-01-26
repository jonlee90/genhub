'use client';

import { useMemo } from 'react';
import type { SubcontractorsRow } from '@/types/db/tables/companies';
import type { TradeType } from '@/types/db/enums';
// Performance optimization: Direct imports instead of barrel file
import Users from 'lucide-react/icons/users';
import CheckCircle from 'lucide-react/icons/check-circle';
import Star from 'lucide-react/icons/star';
import AlertTriangle from 'lucide-react/icons/alert-triangle';
import HardHat from 'lucide-react/icons/hard-hat';
import TrendingUp from 'lucide-react/icons/trending-up';

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

/**
 * MetricCard - Individual metric display
 */
function MetricCard({
  icon: Icon,
  label,
  value,
  colorClass,
  compact = false,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number | string;
  colorClass: 'blue' | 'green' | 'yellow' | 'orange' | 'gray';
  compact?: boolean;
}) {
  const colors = {
    blue: 'bg-construction-blue/10 dark:bg-blue-900/30 text-construction-blue dark:text-blue-400 border-construction-blue/20',
    green: 'bg-construction-green/10 dark:bg-green-900/30 text-construction-green dark:text-green-400 border-construction-green/20',
    yellow: 'bg-construction-yellow/10 dark:bg-yellow-900/30 text-construction-yellow dark:text-yellow-400 border-construction-yellow/20',
    orange: 'bg-orange-500/10 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 border-orange-500/20',
    gray: 'bg-gray-500/10 dark:bg-gray-800/30 text-gray-600 dark:text-gray-400 border-gray-500/20',
  };

  return (
    <div className="bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-lg p-4 shadow-construction hover:shadow-construction-lg transition-shadow">
      <div className="flex items-center gap-3">
        <div className={`p-2 md:p-3 rounded-lg border-2 ${colors[colorClass]}`}>
          <Icon className={compact ? 'h-5 w-5' : 'h-5 w-5 md:h-6 md:w-6'} />
        </div>
        <div className="flex-1 min-w-0">
          <div className={`font-black text-gray-900 dark:text-gray-100 ${compact ? 'text-2xl' : 'text-2xl md:text-3xl'}`}>
            {value}
          </div>
          <div className="text-xs md:text-sm font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide truncate">
            {label}
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * TradeDistributionCard - Shows top trades
 */
function TradeDistributionCard({
  tradeDistribution,
  compact = false,
}: {
  tradeDistribution: Array<{ trade: TradeType; count: number }>;
  compact?: boolean;
}) {
  const maxCount = Math.max(...tradeDistribution.map((t) => t.count), 1);

  return (
    <div className="bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-lg p-4 md:p-6 shadow-construction">
      <div className="flex items-center gap-2 mb-4">
        <HardHat className="h-5 w-5 text-construction-blue dark:text-blue-400" />
        <h3 className="text-sm md:text-base font-black text-gray-900 dark:text-gray-100 uppercase">
          Trade Distribution
        </h3>
      </div>
      <div className="space-y-3">
        {tradeDistribution.length === 0 ? (
          <p className="text-sm text-gray-500 dark:text-gray-400">No trade data available</p>
        ) : (
          tradeDistribution.slice(0, compact ? 3 : 5).map(({ trade, count }) => {
            const percentage = (count / maxCount) * 100;
            return (
              <div key={trade}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs md:text-sm font-bold text-gray-700 dark:text-gray-300">
                    {TRADE_LABELS[trade]}
                  </span>
                  <span className="text-xs md:text-sm font-black text-construction-blue dark:text-blue-400">
                    {count}
                  </span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 md:h-2.5 overflow-hidden">
                  <div
                    className="bg-construction-blue dark:bg-blue-500 h-full rounded-full transition-all duration-300"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

/**
 * PerformanceDistributionCard - Shows rating breakdown
 */
function PerformanceDistributionCard({
  performanceDistribution,
  avgRating,
  compact = false,
}: {
  performanceDistribution: Array<{ rating: number; count: number }>;
  avgRating: number;
  compact?: boolean;
}) {
  const maxCount = Math.max(...performanceDistribution.map((p) => p.count), 1);

  return (
    <div className="bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-lg p-4 md:p-6 shadow-construction">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-construction-yellow dark:text-yellow-400" />
          <h3 className="text-sm md:text-base font-black text-gray-900 dark:text-gray-100 uppercase">
            Performance Ratings
          </h3>
        </div>
        <div className="flex items-center gap-1">
          <Star className="h-4 w-4 fill-construction-yellow text-construction-yellow" />
          <span className="text-sm md:text-base font-black text-gray-900 dark:text-gray-100">
            {avgRating.toFixed(1)}
          </span>
        </div>
      </div>
      <div className="space-y-2">
        {performanceDistribution.length === 0 ? (
          <p className="text-sm text-gray-500 dark:text-gray-400">No ratings available</p>
        ) : (
          performanceDistribution
            .sort((a, b) => b.rating - a.rating)
            .map(({ rating, count }) => {
              const percentage = (count / maxCount) * 100;
              return (
                <div key={rating} className="flex items-center gap-3">
                  <div className="flex items-center gap-1 w-16">
                    {[...Array(rating)].map((_, i) => (
                      <Star
                        key={i}
                        className="h-3 w-3 fill-construction-yellow text-construction-yellow"
                      />
                    ))}
                  </div>
                  <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-construction-yellow dark:bg-yellow-500 h-full rounded-full transition-all duration-300"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  <span className="text-xs md:text-sm font-bold text-gray-700 dark:text-gray-300 w-8 text-right">
                    {count}
                  </span>
                </div>
              );
            })
        )}
      </div>
    </div>
  );
}

export function SubcontractorPortfolio({
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
    const performanceDistribution = Array.from(ratingCounts.entries()).map(([rating, count]) => ({
      rating,
      count,
    }));

    // Total expiring
    const totalExpiring = stats.expiringLicenses + stats.expiringInsurance;

    return {
      avgRating,
      tradeDistribution,
      performanceDistribution,
      totalExpiring,
    };
  }, [subcontractors, stats]);

  return (
    <div className="space-y-4">
      {/* Metric cards grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        <MetricCard icon={Users} label="Total" value={stats.total} colorClass="blue" compact={compact} />
        <MetricCard
          icon={CheckCircle}
          label="Active"
          value={stats.active}
          colorClass="green"
          compact={compact}
        />
        <MetricCard
          icon={Star}
          label="Avg Rating"
          value={portfolioMetrics.avgRating > 0 ? portfolioMetrics.avgRating.toFixed(1) : 'N/A'}
          colorClass="yellow"
          compact={compact}
        />
        <MetricCard
          icon={AlertTriangle}
          label="Expiring"
          value={portfolioMetrics.totalExpiring}
          colorClass={portfolioMetrics.totalExpiring > 0 ? 'orange' : 'gray'}
          compact={compact}
        />
      </div>

      {/* Charts section - only show on desktop or when not compact */}
      {!compact && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <TradeDistributionCard tradeDistribution={portfolioMetrics.tradeDistribution} />
          <PerformanceDistributionCard
            performanceDistribution={portfolioMetrics.performanceDistribution}
            avgRating={portfolioMetrics.avgRating}
          />
        </div>
      )}
    </div>
  );
}
