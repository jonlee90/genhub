'use client';

import { memo } from 'react';
import {
  Users,
  Shield,
  HardHat,
  UserCog,
  UserPlus,
  UserCheck,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { StatCard } from '@/components/ui/stat-card';

/**
 * TeamSummaryStats - Type definition for team-level statistics
 */
export interface TeamSummaryStats {
  // Member Counts
  totalMembers: number;
  activeMembers: number;
  invitedMembers: number;

  // Role Breakdown
  admins: number;
  projectManagers: number;
  foremen: number;
  fieldWorkers: number;

  // Role Distribution (for display)
  roleDistribution: Array<{
    role: string;
    count: number;
    percentage: number;
  }>;

  // Recent Joins (optional)
  recentJoins?: Array<{
    id: string;
    name: string;
    role: string;
    joinedAt: string;
  }>;
}

interface TeamSummaryProps {
  stats: TeamSummaryStats;
  className?: string;
}

/**
 * TeamSummary Component - Mobile PWA Optimized
 *
 * A premium, mobile-first team analytics card designed for construction
 * general contractors. Displays aggregate metrics for team members including
 * role distribution, active status, and recent additions.
 *
 * Design Principles:
 * - Mobile-first with 44px+ touch targets
 * - High contrast for outdoor/bright sun visibility
 * - Clear visual hierarchy with scannable stats
 * - Construction-themed with GenHub design system
 *
 * Pattern: Follows PortfolioSummary card layout
 */
export const TeamSummary = memo(function TeamSummary({
  stats,
  className = '',
}: TeamSummaryProps) {
  // Handle empty state when no team members exist
  if (stats.totalMembers === 0) {
    return (
      <div
        className={cn(
          'bg-white dark:bg-gray-900 rounded-xl overflow-hidden',
          'border-2 border-gray-200 dark:border-gray-700 shadow-sm',
          className
        )}
      >
        {/* Header */}
        <div className="px-4 py-3.5 border-b border-gray-100 dark:border-gray-800 bg-gradient-to-r from-gray-50/80 dark:from-gray-800/50 to-white dark:to-gray-900">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-construction-blue dark:bg-construction-blue flex items-center justify-center shadow-sm">
              <Users className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-construction-blue dark:text-construction-blue text-sm uppercase tracking-wide">
                Team Summary
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">No team members yet</p>
            </div>
          </div>
        </div>

        {/* Empty State */}
        <div className="p-6 flex flex-col items-center justify-center min-h-[200px]">
          <div className="w-16 h-16 rounded-2xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-4">
            <Users className="w-8 h-8 text-gray-300 dark:text-gray-600" />
          </div>
          <p className="text-base font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
            No team members yet
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400 text-center max-w-[240px]">
            Invite team members to start building your crew
          </p>
        </div>
      </div>
    );
  }

  // Calculate team health status
  const activationRate = stats.totalMembers > 0
    ? (stats.activeMembers / stats.totalMembers) * 100
    : 0;

  const teamHealth = activationRate >= 80
    ? 'healthy'
    : activationRate >= 50
      ? 'at-risk'
      : 'needs-attention';

  return (
    <div
      className={cn(
        'bg-white dark:bg-gray-900 rounded-xl overflow-hidden',
        'border-2 border-gray-200 dark:border-gray-700 shadow-sm',
        'transition-all duration-200',
        className
      )}
    >
      {/* Header */}
      <div className="px-4 py-3.5 border-b border-gray-100 dark:border-gray-800 bg-gradient-to-r from-gray-50/80 dark:from-gray-800/50 to-white dark:to-gray-900">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-construction-blue dark:bg-construction-blue flex items-center justify-center shadow-sm">
            <Users className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-construction-blue dark:text-construction-blue text-sm uppercase tracking-wide">
              Team Summary
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              {stats.activeMembers} active member{stats.activeMembers !== 1 ? 's' : ''}
            </p>
          </div>
          {/* Quick Status Badge */}
          <div
            className={cn(
              'px-2.5 py-1 rounded-lg text-xs font-bold',
              teamHealth === 'needs-attention'
                ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                : teamHealth === 'at-risk'
                  ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400'
                  : 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400'
            )}
          >
            {teamHealth === 'needs-attention' ? 'Needs Attention' : teamHealth === 'at-risk' ? 'At Risk' : 'Healthy'}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-4">
        {/* Member Status Grid */}
        <div className="grid grid-cols-3 gap-2.5 mb-4">
          {/* Total Members */}
          <StatCard
            label="Total"
            value={stats.totalMembers}
            subtext="Members"
          />

          {/* Active Members */}
          <StatCard
            icon={UserCheck}
            label="Active"
            value={stats.activeMembers}
            subtext="On Duty"
            variant="success"
            showStatusDot
          />

          {/* Invited Members */}
          <StatCard
            icon={UserPlus}
            label="Invited"
            value={stats.invitedMembers}
            subtext="Pending"
            variant={stats.invitedMembers > 0 ? 'warning' : 'neutral'}
            showStatusDot={stats.invitedMembers > 0}
          />
        </div>

        {/* Role Distribution Grid */}
        <div className="grid grid-cols-2 gap-2.5 mb-4">
          {/* Admins */}
          <StatCard
            icon={Shield}
            label="Admins"
            value={stats.admins}
            subtext="GC Admins"
            variant="neutral"
          />

          {/* Project Managers */}
          <StatCard
            icon={UserCog}
            label="Managers"
            value={stats.projectManagers}
            subtext="Project Mgrs"
            variant="neutral"
          />

          {/* Foremen */}
          <StatCard
            icon={HardHat}
            label="Foremen"
            value={stats.foremen}
            subtext="Site Leads"
            variant="neutral"
          />

          {/* Field Workers */}
          <StatCard
            icon={Users}
            label="Crew"
            value={stats.fieldWorkers}
            subtext="Field Crew"
            variant="neutral"
          />
        </div>

        {/* Role Distribution Breakdown */}
        {stats.roleDistribution.length > 0 && (
          <div className="pt-4 border-t border-gray-100 dark:border-gray-800">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Role Distribution
              </span>
            </div>
            <div className="space-y-2.5">
              {stats.roleDistribution.map((item) => (
                <div key={item.role} className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      {item.role}
                    </span>
                    <span className="text-sm font-bold text-construction-blue dark:text-construction-blue tabular-nums">
                      {item.count} ({item.percentage}%)
                    </span>
                  </div>
                  <div className="h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500 ease-out bg-construction-blue dark:bg-construction-blue"
                      style={{ width: `${item.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recent Joins Section */}
        {stats.recentJoins && stats.recentJoins.length > 0 && (
          <div className="pt-4 border-t border-gray-100 dark:border-gray-800 mt-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Recent Additions
              </span>
              <span className="text-[11px] text-gray-400 dark:text-gray-500">
                last 7 days
              </span>
            </div>
            <div className="space-y-2">
              {stats.recentJoins.map((member) => (
                <div
                  key={member.id}
                  className="flex items-center justify-between px-3 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl min-h-[44px]"
                >
                  <div className="flex flex-col">
                    <span className="text-sm font-semibold text-gray-900 dark:text-gray-100 leading-tight">
                      {member.name}
                    </span>
                    <span className="text-[11px] text-gray-500 dark:text-gray-400">
                      {member.role}
                    </span>
                  </div>
                  <div className="text-[11px] text-gray-400 dark:text-gray-500">
                    {new Date(member.joinedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
});
