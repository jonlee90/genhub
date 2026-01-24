'use client';

/**
 * OwnerStatsGrid Component
 *
 * Reusable stats grid using KPICard components.
 *
 * Features:
 * - Uses existing KPICard component
 * - Supports 2/3/4 column grid layouts
 * - Responsive: 2 cols mobile, 3/4 cols desktop
 * - Loading skeleton state matching final grid
 * - Gap spacing: 12px mobile (gap-3), 16px desktop (gap-4)
 */

import { Building2, Mail, Users, FolderKanban, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { KPICard } from '@/components/dashboard/KPICard';

// Icon map for server-to-client serialization
const ICON_MAP = {
  building2: Building2,
  mail: Mail,
  users: Users,
  folderKanban: FolderKanban,
  checkCircle: CheckCircle,
} as const;

type IconName = keyof typeof ICON_MAP;

interface OwnerStat {
  /** Stat title */
  title: string;

  /** Stat value */
  value: string | number;

  /** Icon name (e.g., "building2", "mail") */
  iconName: IconName;

  /** Visual variant */
  variant: 'default' | 'success' | 'warning' | 'danger';

  /** Optional link */
  href?: string;

  /** Optional subtitle */
  subtitle?: string;

  /** Optional trend indicator */
  trend?: {
    value: number;
    direction: 'up' | 'down' | 'neutral';
    label?: string;
  };
}

interface OwnerStatsGridProps {
  /** Stats array */
  stats: OwnerStat[];

  /** Number of columns */
  columns?: 2 | 3 | 4;

  /** Loading state */
  isLoading?: boolean;

  /** Additional className */
  className?: string;
}

function OwnerStatsGridSkeleton({ columns = 4 }: { columns?: number }) {
  return (
    <div
      className={cn(
        'grid gap-3 md:gap-4',
        columns === 2 && 'grid-cols-2',
        columns === 3 && 'grid-cols-2 md:grid-cols-3',
        columns === 4 && 'grid-cols-2 md:grid-cols-4'
      )}
    >
      {Array.from({ length: columns }).map((_, i) => (
        <div
          key={i}
          className="bg-white dark:bg-gray-900 border-2 border-gray-200 dark:border-gray-700 rounded-xl p-4 animate-pulse min-h-[120px]"
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-lg flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="h-3 w-20 bg-gray-200 dark:bg-gray-700 rounded mb-2" />
              <div className="h-7 w-16 bg-gray-200 dark:bg-gray-700 rounded" />
            </div>
          </div>
          <div className="h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded" />
        </div>
      ))}
    </div>
  );
}

export function OwnerStatsGrid({
  stats,
  columns = 4,
  isLoading = false,
  className,
}: OwnerStatsGridProps) {
  if (isLoading) {
    return <OwnerStatsGridSkeleton columns={columns} />;
  }

  return (
    <div
      className={cn(
        'grid gap-3 md:gap-4',
        columns === 2 && 'grid-cols-2',
        columns === 3 && 'grid-cols-2 md:grid-cols-3',
        columns === 4 && 'grid-cols-2 md:grid-cols-4',
        className
      )}
    >
      {stats.map((stat) => {
        const Icon = ICON_MAP[stat.iconName];
        return (
          <KPICard
            key={stat.title}
            title={stat.title}
            value={stat.value}
            icon={Icon}
            variant={stat.variant}
            href={stat.href}
            subtitle={stat.subtitle}
            trend={stat.trend}
          />
        );
      })}
    </div>
  );
}
