'use client';

import { ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { InfoCard, InfoCardField } from '@/components/projects/InfoCard';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import {
  DollarSign,
  Clock,
  AlertOctagon,
  CheckSquare,
  Users,
  Package,
  Flag,
  Receipt,
  GitBranch,
  TrendingUp,
  Target,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  UserX,
  Calendar,
  Minus,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { TaskAnalytics } from '@/types/analytics';

/**
 * Filter state interface for click-to-filter functionality
 */
interface FilterState {
  status?: string;
  assignee?: string;
  priority?: string;
  materialStatus?: string;
}

/**
 * Props for TaskAnalyticsSection component
 */
interface TaskAnalyticsSectionProps {
  /** Analytics data to display */
  analytics: TaskAnalytics;
  /** Callback for filter changes (click-to-filter functionality) */
  onFilterChange: (filter: FilterState) => void;
  /** Loading state */
  isLoading?: boolean;
  /** Error state */
  error?: string | null;
}

/**
 * Format currency values with USD formatting
 */
const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

/**
 * TaskAnalyticsSection Component
 *
 * Displays 10 analytics cards using InfoCard component:
 * 1. Budget Performance (Hero card, 2 column span)
 * 2. Schedule Adherence (Interactive)
 * 3. Blocked Tasks (Interactive)
 * 4. Completion Performance (Display)
 * 5. Workload Distribution (Interactive)
 * 6. Materials Status (Interactive)
 * 7. Priority Distribution (Interactive)
 * 8. Expenses (Interactive, navigates to /app/expenses)
 * 9. Dependencies (Display, modal out of scope for MVP)
 * 10. Velocity (Display)
 */
export function TaskAnalyticsSection({
  analytics,
  onFilterChange,
  isLoading = false,
  error = null,
}: TaskAnalyticsSectionProps) {
  const router = useRouter();

  // Loading state: 10 skeleton cards
  if (isLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3 md:gap-4 mb-6">
        {Array.from({ length: 10 }).map((_, i) => (
          <Skeleton
            key={i}
            className={cn(
              'h-48',
              i === 0 && 'col-span-2' // Budget Performance spans 2 columns
            )}
          />
        ))}
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="mb-6 p-4 bg-red-50 border-2 border-red-200 rounded-lg">
        <div className="flex items-center gap-2 text-red-800">
          <AlertTriangle className="h-5 w-5" />
          <span className="font-bold">Failed to load analytics: {error}</span>
        </div>
      </div>
    );
  }

  // ========================================
  // 1. BUDGET PERFORMANCE (Hero Card)
  // ========================================
  const budgetFields: InfoCardField[] = [
    {
      label: 'Planned',
      value: formatCurrency(analytics.budget.planned),
      icon: Target,
    },
    {
      label: 'Actual',
      value: formatCurrency(analytics.budget.actual),
      icon: DollarSign,
    },
    {
      label: analytics.budget.variance >= 0 ? 'Under Budget' : 'Over Budget',
      value: formatCurrency(Math.abs(analytics.budget.variance)),
      icon: analytics.budget.variance >= 0 ? TrendingDown : TrendingUp,
      isBadge: true,
      badgeColor: analytics.budget.variance >= 0
        ? 'bg-green-600 text-white'
        : 'bg-red-600 text-white',
    },
  ];

  const budgetFooter = analytics.budget.utilization > 90 ? (
    <div className="flex items-center gap-2 text-xs text-orange-500 mt-4 pt-4 border-t-2 border-gray-100">
      <AlertTriangle className="h-4 w-4" />
      <span>Budget utilization at {analytics.budget.utilization}%</span>
    </div>
  ) : undefined;

  // ========================================
  // 2. SCHEDULE ADHERENCE (Interactive)
  // ========================================
  const scheduleFields: InfoCardField[] = [
    {
      label: 'Overdue',
      value: (
        <button
          onClick={() => {
            onFilterChange({ status: 'overdue' });
          }}
          className="flex items-center gap-2 hover:underline w-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#001B51]"
          aria-label={`Filter to ${analytics.schedule.overdue} overdue tasks`}
        >
          <span className="text-red-600">●</span>
          <span>{analytics.schedule.overdue} Tasks</span>
        </button>
      ),
      isBadge: true,
      badgeColor: analytics.schedule.overdue > 0
        ? 'bg-red-600 text-white'
        : 'bg-gray-100 text-gray-700',
    },
    {
      label: 'At Risk',
      value: (
        <button
          onClick={() => {
            onFilterChange({ status: 'at-risk' });
          }}
          className="flex items-center gap-2 hover:underline w-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#001B51]"
          aria-label={`Filter to ${analytics.schedule.atRisk} at-risk tasks`}
        >
          <span className="text-yellow-500">●</span>
          <span>{analytics.schedule.atRisk} Tasks</span>
        </button>
      ),
      isBadge: true,
      badgeColor: analytics.schedule.atRisk > 0
        ? 'bg-yellow-500 text-white'
        : 'bg-gray-100 text-gray-700',
    },
    {
      label: 'On Time',
      value: `${analytics.schedule.onTime} Tasks`,
      icon: CheckCircle,
      isBadge: true,
      badgeColor: 'bg-green-600 text-white',
    },
  ];

  // ========================================
  // 3. BLOCKED TASKS (Interactive)
  // ========================================
  const blockedFields: InfoCardField[] = [
    {
      label: 'Blocked Tasks',
      value: (
        <button
          onClick={() => {
            onFilterChange({ status: 'blocked' });
          }}
          className="flex items-center gap-2 hover:underline w-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#001B51]"
          aria-label={`Filter to ${analytics.blocked.count} blocked tasks (${analytics.blocked.rate.toFixed(0)}% of total)`}
        >
          <AlertOctagon className="h-4 w-4 text-red-600 flex-shrink-0" />
          <span>{analytics.blocked.count} Tasks ({analytics.blocked.rate.toFixed(0)}%)</span>
        </button>
      ),
      isBadge: true,
      badgeColor: analytics.blocked.count > 0
        ? 'bg-red-600 text-white'
        : 'bg-gray-100 text-gray-700',
    },
    ...(analytics.blocked.topReasons.length > 0 ? [
      {
        label: 'Top Blockers',
        value: (
          <ul className="text-xs space-y-1 text-gray-600">
            {analytics.blocked.topReasons.slice(0, 3).map((reason, i) => (
              <li key={i} className="flex items-start gap-1">
                <span className="text-red-600 flex-shrink-0">•</span>
                <span>{reason}</span>
              </li>
            ))}
          </ul>
        ) as ReactNode,
      },
    ] : []),
  ];

  // ========================================
  // 4. COMPLETION PERFORMANCE (Display)
  // ========================================
  const completionFields: InfoCardField[] = [
    {
      label: 'Tasks Completed',
      value: `${analytics.completion.completed} / ${analytics.completion.total}`,
      icon: CheckSquare,
    },
    {
      label: 'Completion Rate',
      value: `${analytics.completion.rate.toFixed(0)}%`,
      isProgressBar: true,
      progressValue: analytics.completion.rate,
      progressColor:
        analytics.completion.rate >= 80 ? 'bg-green-600' :
        analytics.completion.rate >= 50 ? 'bg-yellow-500' :
        'bg-red-600',
    },
  ];

  // ========================================
  // 5. WORKLOAD DISTRIBUTION (Interactive)
  // ========================================
  const workloadFields: InfoCardField[] = [
    {
      label: 'Unassigned',
      value: (
        <button
          onClick={() => {
            onFilterChange({ assignee: 'unassigned' });
          }}
          className="flex items-center gap-2 hover:underline w-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#001B51]"
          aria-label={`Filter to ${analytics.workload.unassigned} unassigned tasks`}
        >
          <UserX className="h-4 w-4 flex-shrink-0" />
          <span>{analytics.workload.unassigned} Tasks</span>
        </button>
      ),
      isBadge: true,
      badgeColor: analytics.workload.unassigned > 0
        ? 'bg-orange-500 text-white'
        : 'bg-gray-100 text-gray-700',
    },
    ...(analytics.workload.topAssignees.length > 0 ? [
      {
        label: 'Top Assignees',
        value: (
          <div className="flex gap-2 flex-wrap">
            {analytics.workload.topAssignees.slice(0, 3).map((assignee) => (
              <button
                key={assignee.id}
                onClick={() => {
                  onFilterChange({ assignee: assignee.id });
                }}
                className="flex flex-col items-center gap-1 hover:opacity-75 transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#001B51]"
                title={`${assignee.name} (${assignee.count} tasks)`}
                aria-label={`Filter to ${assignee.count} tasks assigned to ${assignee.name}`}
              >
                <Avatar className="h-8 w-8">
                  <AvatarImage src={assignee.avatar_url || undefined} alt={assignee.name} />
                  <AvatarFallback className="bg-[#001B51] text-white text-xs">
                    {assignee.name.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <span className="text-xs text-gray-600 font-bold">{assignee.count}</span>
              </button>
            ))}
          </div>
        ) as ReactNode,
      },
    ] : []),
  ];

  // ========================================
  // 6. MATERIALS STATUS (Interactive)
  // ========================================
  const materialsFields: InfoCardField[] = [
    {
      label: 'Needed',
      value: (
        <button
          onClick={() => {
            onFilterChange({ materialStatus: 'needed' });
          }}
          className="hover:underline w-full text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#001B51]"
          aria-label={`Filter to ${analytics.materials.needed} tasks with materials needed`}
        >
          {analytics.materials.needed}
        </button>
      ),
      isBadge: true,
      badgeColor: analytics.materials.needed > 0
        ? 'bg-orange-500 text-white'
        : 'bg-gray-100 text-gray-700',
    },
    {
      label: 'Ordered',
      value: analytics.materials.ordered,
      isBadge: true,
      badgeColor: 'bg-blue-600 text-white',
    },
    {
      label: 'Delivered',
      value: analytics.materials.delivered,
      isBadge: true,
      badgeColor: 'bg-green-600 text-white',
    },
  ];

  // ========================================
  // 7. PRIORITY DISTRIBUTION (Interactive)
  // ========================================
  const priorityFields: InfoCardField[] = [
    {
      label: 'High',
      value: (
        <button
          onClick={() => {
            onFilterChange({ priority: 'high' });
          }}
          className="hover:underline w-full text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#001B51]"
          aria-label={`Filter to ${analytics.priority.high} high priority tasks`}
        >
          {analytics.priority.high}
        </button>
      ),
      isBadge: true,
      badgeColor: 'bg-red-600 text-white',
    },
    {
      label: 'Medium',
      value: (
        <button
          onClick={() => {
            onFilterChange({ priority: 'medium' });
          }}
          className="hover:underline w-full text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#001B51]"
          aria-label={`Filter to ${analytics.priority.medium} medium priority tasks`}
        >
          {analytics.priority.medium}
        </button>
      ),
      isBadge: true,
      badgeColor: 'bg-yellow-500 text-white',
    },
    {
      label: 'Low',
      value: (
        <button
          onClick={() => {
            onFilterChange({ priority: 'low' });
          }}
          className="hover:underline w-full text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#001B51]"
          aria-label={`Filter to ${analytics.priority.low} low priority tasks`}
        >
          {analytics.priority.low}
        </button>
      ),
      isBadge: true,
      badgeColor: 'bg-gray-500 text-white',
    },
  ];

  // ========================================
  // 8. EXPENSES (Interactive - Navigation)
  // ========================================
  const expensesFields: InfoCardField[] = [
    {
      label: 'Pending Review',
      value: (
        <button
          onClick={() => {
            router.push('/app/expenses?status=pending');
          }}
          className="hover:underline w-full text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#001B51]"
          aria-label={`View ${analytics.expenses.pending} pending expenses totaling ${formatCurrency(analytics.expenses.pendingAmount)}`}
        >
          {analytics.expenses.pending} ({formatCurrency(analytics.expenses.pendingAmount)})
        </button>
      ),
      isBadge: true,
      badgeColor: analytics.expenses.pending > 0
        ? 'bg-orange-500 text-white'
        : 'bg-gray-100 text-gray-700',
    },
    {
      label: 'Approved',
      value: `${analytics.expenses.approved} (${formatCurrency(analytics.expenses.approvedAmount)})`,
      isBadge: true,
      badgeColor: 'bg-green-600 text-white',
    },
  ];

  const expensesFooter = analytics.expenses.pendingAmount > 5000 ? (
    <div className="flex items-center gap-2 text-xs text-orange-500 mt-4 pt-4 border-t-2 border-gray-100">
      <AlertTriangle className="h-4 w-4" />
      <span>High pending amount: {formatCurrency(analytics.expenses.pendingAmount)}</span>
    </div>
  ) : undefined;

  // ========================================
  // 9. DEPENDENCIES (Interactive - Console Log for MVP)
  // ========================================
  const dependenciesFields: InfoCardField[] = [
    {
      label: 'Blocked by Dependencies',
      value: (
        <button
          onClick={() => {
            // Dependency modal functionality out of scope for MVP
          }}
          className="hover:underline w-full text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#001B51]"
          aria-label={`View ${analytics.dependencies.blockedByDeps} tasks blocked by dependencies`}
        >
          {analytics.dependencies.blockedByDeps} Tasks
        </button>
      ),
      isBadge: true,
      badgeColor: analytics.dependencies.blockedByDeps > 0
        ? 'bg-orange-500 text-white'
        : 'bg-gray-100 text-gray-700',
    },
    {
      label: 'Ready to Start',
      value: `${analytics.dependencies.ready} Tasks`,
      icon: CheckCircle,
      isBadge: true,
      badgeColor: 'bg-green-600 text-white',
    },
  ];

  // ========================================
  // 10. VELOCITY (Display)
  // ========================================
  const velocityFields: InfoCardField[] = [
    {
      label: 'Tasks/Day (7d avg)',
      value: analytics.velocity.tasksPerDay.toFixed(1),
      icon: Calendar,
    },
    {
      label: 'Trend vs Previous Week',
      value: (
        <div className="flex items-center gap-1">
          {analytics.velocity.trend > 0 ? (
            <TrendingUp className="h-4 w-4 text-green-600 flex-shrink-0" />
          ) : analytics.velocity.trend < 0 ? (
            <TrendingDown className="h-4 w-4 text-red-600 flex-shrink-0" />
          ) : (
            <Minus className="h-4 w-4 text-gray-500 flex-shrink-0" />
          )}
          <span>{Math.abs(analytics.velocity.trend).toFixed(0)}%</span>
        </div>
      ),
      isBadge: true,
      badgeColor:
        analytics.velocity.trend > 0 ? 'bg-green-600 text-white' :
        analytics.velocity.trend < 0 ? 'bg-red-600 text-white' :
        'bg-gray-100 text-gray-700',
    },
  ];

  return (
    <div className="mb-6">
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3 md:gap-4">
        {/* 1. Budget Performance (Hero - spans 2 columns) */}
        <div className="col-span-2">
          <InfoCard
            headerIcon={DollarSign}
            headerTitle="Budget Performance"
            headerDescription="Planned vs Actual Costs"
            isHeroCard={true}
            columns={3}
            fields={budgetFields}
            footerContent={budgetFooter}
            aria-label={`Budget Performance: ${formatCurrency(analytics.budget.planned)} planned, ${formatCurrency(analytics.budget.actual)} actual, ${analytics.budget.variance >= 0 ? 'under' : 'over'} budget by ${formatCurrency(Math.abs(analytics.budget.variance))}`}
          />
        </div>

        {/* 2. Schedule Adherence */}
        <InfoCard
          headerIcon={Clock}
          headerTitle="Schedule"
          headerDescription="On-time performance"
          columns={1}
          fields={scheduleFields}
          aria-label={`Schedule Adherence: ${analytics.schedule.overdue} overdue, ${analytics.schedule.atRisk} at risk, ${analytics.schedule.onTime} on time`}
        />

        {/* 3. Blocked Tasks */}
        <InfoCard
          headerIcon={AlertOctagon}
          headerTitle="Blocked"
          headerDescription="Tasks requiring attention"
          columns={1}
          fields={blockedFields}
          aria-label={`Blocked Tasks: ${analytics.blocked.count} tasks blocked (${analytics.blocked.rate.toFixed(0)}% of total)`}
        />

        {/* 4. Completion Performance */}
        <InfoCard
          headerIcon={CheckSquare}
          headerTitle="Completion"
          headerDescription="Overall progress"
          columns={1}
          fields={completionFields}
          aria-label={`Completion Performance: ${analytics.completion.completed} of ${analytics.completion.total} tasks completed (${analytics.completion.rate.toFixed(0)}%)`}
        />

        {/* 5. Workload Distribution */}
        <InfoCard
          headerIcon={Users}
          headerTitle="Workload"
          headerDescription="Team assignment"
          columns={1}
          fields={workloadFields}
          aria-label={`Workload Distribution: ${analytics.workload.unassigned} unassigned tasks, ${analytics.workload.topAssignees.length} assignees`}
        />

        {/* 6. Materials Status */}
        <InfoCard
          headerIcon={Package}
          headerTitle="Materials"
          headerDescription="Procurement status"
          columns={1}
          fields={materialsFields}
          aria-label={`Materials Status: ${analytics.materials.needed} needed, ${analytics.materials.ordered} ordered, ${analytics.materials.delivered} delivered`}
        />

        {/* 7. Priority Distribution */}
        <InfoCard
          headerIcon={Flag}
          headerTitle="Priority"
          headerDescription="Task urgency"
          columns={1}
          fields={priorityFields}
          aria-label={`Priority Distribution: ${analytics.priority.high} high, ${analytics.priority.medium} medium, ${analytics.priority.low} low priority tasks`}
        />

        {/* 8. Expenses */}
        <InfoCard
          headerIcon={Receipt}
          headerTitle="Expenses"
          headerDescription="Approval status"
          columns={1}
          fields={expensesFields}
          footerContent={expensesFooter}
          aria-label={`Expenses: ${analytics.expenses.pending} pending (${formatCurrency(analytics.expenses.pendingAmount)}), ${analytics.expenses.approved} approved (${formatCurrency(analytics.expenses.approvedAmount)})`}
        />

        {/* 9. Dependencies */}
        <InfoCard
          headerIcon={GitBranch}
          headerTitle="Dependencies"
          headerDescription="Task sequencing"
          columns={1}
          fields={dependenciesFields}
          aria-label={`Dependencies: ${analytics.dependencies.blockedByDeps} blocked by dependencies, ${analytics.dependencies.ready} ready to start`}
        />

        {/* 10. Velocity */}
        <InfoCard
          headerIcon={TrendingUp}
          headerTitle="Velocity"
          headerDescription="Task completion rate"
          columns={1}
          fields={velocityFields}
          aria-label={`Velocity: ${analytics.velocity.tasksPerDay.toFixed(1)} tasks per day (7-day average), ${analytics.velocity.trend > 0 ? 'up' : analytics.velocity.trend < 0 ? 'down' : 'flat'} ${Math.abs(analytics.velocity.trend).toFixed(0)}% vs previous week`}
        />
      </div>
    </div>
  );
}
