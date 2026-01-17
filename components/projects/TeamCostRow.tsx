'use client';

import { useMemo } from 'react';
// Performance optimization: Direct imports instead of barrel file (saves 200-800ms per page)
import Building2 from 'lucide-react/icons/building-2';
import ChevronRight from 'lucide-react/icons/chevron-right';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { formatBudget } from '@/lib/utils';

/**
 * Team cost summary data for a single member
 */
export interface TeamCostSummary {
  id: string;
  name: string;
  type: 'member' | 'subcontractor';
  avatarUrl: string | null;
  role?: string;
  taskCosts: number;
  expenseCosts: number;
  totalCosts: number;
  taskCount: number;
  expenseCount: number;
}

/**
 * Props for TeamCostRow component
 */
export interface TeamCostRowProps {
  /** Team member cost summary data */
  summary: TeamCostSummary;
  /** Optional click handler for row interaction */
  onClick?: () => void;
}

/**
 * TeamCostRow - Display single team member cost summary
 *
 * A mobile-friendly row component for displaying cost attribution
 * per team member in the project cost summary.
 *
 * Features:
 * - 48px minimum row height
 * - 3-column cost layout (Tasks, Expenses, Total)
 * - Avatar with type-based fallback styling
 * - Role badge display
 * - Touch feedback with active states
 * - Mobile PWA compliant
 */
export function TeamCostRow({ summary, onClick }: TeamCostRowProps) {
  const {
    name,
    type,
    avatarUrl,
    role,
    taskCosts,
    expenseCosts,
    totalCosts,
  } = summary;

  // Performance optimization: Memoize computed values
  const isInteractive = useMemo(() => Boolean(onClick), [onClick]);
  const Component = useMemo(() => isInteractive ? 'button' : 'div', [isInteractive]);

  return (
    <Component
      type={isInteractive ? 'button' : undefined}
      onClick={onClick}
      className={cn(
        'w-full flex flex-col gap-2',
        'min-h-[48px] px-4 py-3',
        'bg-white border-b border-gray-100 last:border-b-0',
        'transition-all duration-150',
        isInteractive && [
          'cursor-pointer',
          'active:bg-gray-50',
          'hover:bg-gray-50/50',
        ]
      )}
    >
      {/* Top Row: Avatar, Name, Role, Chevron */}
      <div className="flex items-center gap-3">
        {/* Avatar / Icon */}
        {type === 'subcontractor' ? (
          <div
            className={cn(
              'flex items-center justify-center',
              'w-9 h-9 rounded-full',
              'bg-orange-100'
            )}
          >
            <Building2 className="w-5 h-5 text-orange-600" />
          </div>
        ) : (
          <Avatar className="h-9 w-9 flex-shrink-0">
            <AvatarImage src={avatarUrl || undefined} />
            <AvatarFallback className="text-xs font-semibold text-white bg-[#001B51]">
              {getInitials(name)}
            </AvatarFallback>
          </Avatar>
        )}

        {/* Name & Role */}
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-sm text-gray-900 truncate">
            {name}
          </div>
        </div>

        {/* Role Badge */}
        {role && (
          <Badge
            variant="secondary"
            className={cn(
              'text-[10px] font-semibold uppercase tracking-wider',
              'px-2 py-0.5',
              type === 'subcontractor'
                ? 'bg-orange-100 text-orange-700 border-orange-200'
                : 'bg-gray-100 text-gray-600 border-gray-200'
            )}
          >
            {formatRole(role)}
          </Badge>
        )}

        {/* Chevron for interactive rows */}
        {isInteractive && (
          <ChevronRight className="w-4 h-4 text-gray-400 flex-shrink-0" />
        )}
      </div>

      {/* Bottom Row: Cost Columns */}
      <div className="flex items-center justify-between pl-12">
        {/* Tasks Cost */}
        <CostColumn
          label="Tasks"
          value={taskCosts}
          className="text-left"
        />

        {/* Expenses Cost */}
        <CostColumn
          label="Expenses"
          value={expenseCosts}
          className="text-center"
        />

        {/* Total Cost */}
        <CostColumn
          label="Total"
          value={totalCosts}
          isTotal
          className="text-right"
        />
      </div>
    </Component>
  );
}

/**
 * CostColumn - Compact cost display column
 */
interface CostColumnProps {
  label: string;
  value: number;
  isTotal?: boolean;
  className?: string;
}

function CostColumn({ label, value, isTotal = false, className }: CostColumnProps) {
  return (
    <div className={cn('flex-1', className)}>
      <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
        {label}
      </div>
      <div
        className={cn(
          'text-sm tabular-nums',
          isTotal
            ? 'font-bold text-[#001B51]'
            : 'font-medium text-gray-700'
        )}
      >
        {formatBudget(value)}
      </div>
    </div>
  );
}

/**
 * Get initials from a name string
 */
function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

/**
 * Format role for display
 * Handles common abbreviations and formatting
 */
function formatRole(role: string): string {
  const roleMap: Record<string, string> = {
    admin: 'Admin',
    pm: 'PM',
    project_manager: 'PM',
    member: 'Member',
    subcontractor: 'Sub',
    owner: 'Owner',
    superintendent: 'Super',
    foreman: 'Foreman',
  };

  return roleMap[role.toLowerCase()] || role.slice(0, 6);
}
