'use client';

import { Badge } from '@/components/ui/badge';
import { Building2, Calendar, DollarSign } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Database } from '@/types/database.types';

type ProjectStatus = Database['public']['Enums']['project_status'];
type Project = Database['public']['Tables']['projects']['Row'];

interface MobileProjectCardProps {
  project: Project;
  onClick?: () => void;
  className?: string;
}

// Status configuration for left border and badge colors
const STATUS_CONFIG: Record<
  ProjectStatus,
  { label: string; borderColor: string; badgeColor: string }
> = {
  active: {
    label: 'Active',
    borderColor: 'border-l-[#059669]',
    badgeColor: 'bg-green-600 text-white',
  },
  in_progress: {
    label: 'In Progress',
    borderColor: 'border-l-[#059669]',
    badgeColor: 'bg-green-600 text-white',
  },
  on_hold: {
    label: 'On Hold',
    borderColor: 'border-l-[#F59E0B]',
    badgeColor: 'bg-yellow-500 text-white',
  },
  completed: {
    label: 'Completed',
    borderColor: 'border-l-[#001B51]',
    badgeColor: 'bg-blue-600 text-white',
  },
  archived: {
    label: 'Archived',
    borderColor: 'border-l-gray-400',
    badgeColor: 'bg-gray-500 text-white',
  },
  planning: {
    label: 'Planning',
    borderColor: 'border-l-[#3B82F6]',
    badgeColor: 'bg-blue-500 text-white',
  },
};

/**
 * MobileProjectCard - Touch-optimized project card for construction site use
 *
 * Design considerations:
 * - 44px minimum tap targets for gloved hands
 * - High contrast for outdoor/bright sun visibility
 * - Status-based left border for quick visual identification
 * - Progress bar for at-a-glance completion status
 * - NO swipe actions (per user confirmation)
 */
export function MobileProjectCard({ project, onClick, className }: MobileProjectCardProps) {
  const statusConfig = STATUS_CONFIG[project.status];

  // Calculate days remaining from end_date
  const daysRemaining = (() => {
    if (!project.end_date) return null;
    const [year, month, day] = project.end_date.split('T')[0].split('-').map(Number);
    const endDate = new Date(year, month - 1, day);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const diffTime = endDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  })();

  // Format budget for display
  const formatBudget = (amount: number | null) => {
    if (amount === null) return 'No budget';
    if (amount >= 1000000) {
      return `$${(amount / 1000000).toFixed(1)}M`;
    }
    if (amount >= 1000) {
      return `$${(amount / 1000).toFixed(0)}K`;
    }
    return `$${amount.toLocaleString()}`;
  };

  // Progress percentage (0-100)
  const progress = project.completion_percentage ?? 0;

  // Determine if project is overdue
  const isOverdue = daysRemaining !== null && daysRemaining < 0 && project.status !== 'completed';

  return (
    <button
      onClick={onClick}
      className={cn(
        // Base card styling
        'w-full text-left',
        'bg-white rounded-xl',
        'border-2 border-gray-200',
        'shadow-sm',
        // Touch-optimized padding
        'p-4',
        // Active state for touch feedback
        'active:bg-gray-50 active:scale-[0.98]',
        'transition-all duration-150',
        // Status-based left border
        'border-l-4',
        statusConfig.borderColor,
        className
      )}
    >
      {/* Header: Name & Status Badge */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <h3 className="text-base font-bold text-gray-900 line-clamp-2 leading-snug flex-1">
          {project.name}
        </h3>
        <Badge
          className={cn(
            'text-xs font-bold px-3 py-1.5 rounded-full shrink-0',
            'min-h-[28px] flex items-center border-0',
            statusConfig.badgeColor
          )}
        >
          {statusConfig.label}
        </Badge>
      </div>

      {/* Client Name */}
      <div className="flex items-center gap-2 mb-3 text-gray-600">
        <Building2 className="w-4 h-4 flex-shrink-0" />
        <span className="text-sm font-medium truncate">{project.client_name}</span>
      </div>

      {/* Progress Bar */}
      <div className="mb-3">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs font-semibold text-gray-500">Progress</span>
          <span className="text-xs font-bold text-[#001B51]">{Math.round(progress)}%</span>
        </div>
        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-[#001B51] rounded-full transition-all duration-300"
            style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
          />
        </div>
      </div>

      {/* Footer: Budget & Days Remaining */}
      <div className="flex items-center justify-between gap-3 min-h-[44px]">
        {/* Budget */}
        <div
          className={cn(
            'flex items-center gap-2 px-3 py-2 rounded-lg',
            'min-h-[44px]',
            project.budget ? 'bg-gray-100 text-gray-700' : 'bg-gray-50 text-gray-400'
          )}
        >
          <DollarSign className="w-4 h-4 flex-shrink-0" />
          <span className="text-sm font-semibold">{formatBudget(project.budget)}</span>
        </div>

        {/* Days Remaining */}
        <div
          className={cn(
            'flex items-center gap-2 px-3 py-2 rounded-lg',
            'min-h-[44px]',
            isOverdue
              ? 'bg-red-50 text-[#DC2626]'
              : daysRemaining !== null
                ? 'bg-[#001B51]/5 text-[#001B51]'
                : 'bg-gray-50 text-gray-400'
          )}
        >
          {daysRemaining !== null ? (
            <>
              <Calendar className="w-4 h-4 flex-shrink-0" />
              <span className="text-sm font-semibold">
                {isOverdue
                  ? `${Math.abs(daysRemaining)}d overdue`
                  : daysRemaining === 0
                    ? 'Due today'
                    : `${daysRemaining}d left`}
              </span>
            </>
          ) : (
            <>
              <Calendar className="w-4 h-4 flex-shrink-0" />
              <span className="text-sm">No end date</span>
            </>
          )}
        </div>
      </div>
    </button>
  );
}

/**
 * MobileProjectCardSkeleton - Loading placeholder
 */
export function MobileProjectCardSkeleton() {
  return (
    <div className="w-full bg-white rounded-xl border-2 border-gray-200 border-l-4 border-l-gray-300 p-4 animate-pulse">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="h-5 bg-gray-200 rounded w-3/4" />
        <div className="h-7 w-16 bg-gray-200 rounded-full" />
      </div>

      {/* Client */}
      <div className="flex items-center gap-2 mb-3">
        <div className="h-4 w-4 bg-gray-200 rounded" />
        <div className="h-4 bg-gray-200 rounded w-1/2" />
      </div>

      {/* Progress */}
      <div className="mb-3">
        <div className="flex items-center justify-between mb-1">
          <div className="h-3 w-16 bg-gray-200 rounded" />
          <div className="h-3 w-8 bg-gray-200 rounded" />
        </div>
        <div className="h-2 bg-gray-200 rounded-full" />
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between gap-3">
        <div className="h-11 w-24 bg-gray-100 rounded-lg" />
        <div className="h-11 w-28 bg-gray-100 rounded-lg" />
      </div>
    </div>
  );
}
