'use client';

import Image from 'next/image';
import {
  CheckSquare,
  DollarSign,
  Receipt,
  TrendingUp,
  TrendingDown,
  CheckCircle,
  AlertTriangle,
  AlertCircle,
  Users,
  Package,
} from 'lucide-react';
import type { TaskStats } from '@/app/actions/projects';
import { InfoCard, InfoCardField } from './InfoCard';
import { formatPercent, formatPercentWhole } from '@/lib/utils';

interface ProjectTaskSummaryProps {
  taskStats: TaskStats;
  className?: string;
}

/**
 * ProjectTaskSummary Component
 *
 * Displays comprehensive task analytics for a project using InfoCard.
 * Budget-focused with workload distribution and material impact.
 *
 * Features:
 * - Task budget utilization progress bar
 * - Planned vs actual cost breakdown with variance
 * - Task completion and status counts
 * - Top 3 assignees + unassigned count
 * - Material cost impact
 * - Construction-themed design with InfoCard
 *
 * @component
 */
export function ProjectTaskSummary({
  taskStats,
  className = '',
}: ProjectTaskSummaryProps) {
  console.log('[ProjectTaskSummary] Rendering with data:', taskStats);

  // Handle empty state when no tasks exist
  if (taskStats.total === 0) {
    return (
      <InfoCard
        headerIcon={CheckSquare}
        headerTitle="Task Summary"
        headerDescription="No tasks yet"
        fields={[
          {
            label: 'Getting Started',
            value: (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <CheckSquare className="h-12 w-12 text-gray-300 mb-4" />
                <p className="text-gray-600 font-medium mb-2">No tasks have been created yet</p>
                <p className="text-sm text-gray-500">
                  Create your first task to start tracking progress and budget
                </p>
              </div>
            ),
            className: 'col-span-full',
          },
        ]}
        columns={1}
        className={className}
      />
    );
  }

  // Calculate budget utilization percentage
  const budgetUtilization = taskStats.totalPlannedCost > 0
    ? (taskStats.totalActualCost / taskStats.totalPlannedCost) * 100
    : 0;
  const isOverBudget = budgetUtilization > 100;
  const isNearBudget = budgetUtilization > 80 && budgetUtilization <= 100;

  // Determine progress bar color
  const getProgressColor = () => {
    if (isOverBudget) return 'bg-red-500';
    if (isNearBudget) return 'bg-yellow-500';
    return 'bg-[#001B51]';
  };

  // Build fields for InfoCard
  const fields: InfoCardField[] = [
    // Budget Utilization Progress Bar (full width)
    {
      label: 'Task Budget Utilization',
      value: formatPercent(budgetUtilization),
      isProgressBar: true,
      progressValue: Math.min(100, budgetUtilization),
      progressColor: getProgressColor(),
      className: 'col-span-full mb-2',
    },
    // Planned Cost
    {
      label: 'Planned Cost',
      value: (
        <div className="flex items-center gap-2">
          <DollarSign className="h-5 w-5 text-blue-600 flex-shrink-0" />
          <div className="flex flex-col">
            <span className="text-lg font-bold text-gray-900 leading-tight">
              ${taskStats.totalPlannedCost.toLocaleString()}
            </span>
            <span className="text-xs text-gray-500">
              Budget
            </span>
          </div>
        </div>
      ),
    },
    // Actual Cost
    {
      label: 'Actual Cost',
      value: (
        <div className="flex items-center gap-2">
          <Receipt className="h-5 w-5 text-gray-600 flex-shrink-0" />
          <div className="flex flex-col">
            <span className="text-lg font-bold text-gray-900 leading-tight">
              ${taskStats.totalActualCost.toLocaleString()}
            </span>
            <span className="text-xs text-gray-500">
              Spent
            </span>
          </div>
        </div>
      ),
    },
    // Variance
    {
      label: 'Variance',
      value: (
        <div className="flex items-center gap-2">
          {taskStats.budgetVariance >= 0 ? (
            <TrendingUp className="h-5 w-5 text-green-600 flex-shrink-0" />
          ) : (
            <TrendingDown className="h-5 w-5 text-red-600 flex-shrink-0" />
          )}
          <div className="flex flex-col">
            <span className={`text-lg font-bold leading-tight ${
              taskStats.budgetVariance >= 0 ? 'text-green-600' : 'text-red-600'
            }`}>
              {taskStats.budgetVariance >= 0 ? '+' : ''}${Math.abs(taskStats.budgetVariance).toLocaleString()}
            </span>
            <span className="text-xs text-gray-500">
              {taskStats.budgetVariance >= 0 ? 'Under Budget' : 'Over Budget'}
            </span>
          </div>
        </div>
      ),
    },
    // Completed Tasks
    {
      label: 'Completed',
      value: (
        <div className="flex items-center gap-2">
          <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" />
          <div className="flex flex-col">
            <span className="text-lg font-bold text-gray-900 leading-tight">
              {taskStats.completed} of {taskStats.total}
            </span>
            <span className="text-xs text-gray-500">
              {formatPercentWhole(taskStats.total > 0 ? (taskStats.completed / taskStats.total) * 100 : 0)}
            </span>
          </div>
        </div>
      ),
    },
    // Blocked Tasks
    {
      label: 'Blocked',
      value: (
        <div className="flex items-center gap-2">
          {taskStats.blocked > 0 ? (
            <>
              <AlertTriangle className="h-5 w-5 text-red-600 flex-shrink-0" />
              <div className="flex flex-col">
                <span className="text-lg font-bold text-red-600 leading-tight">
                  {taskStats.blocked} tasks
                </span>
                <span className="text-xs text-gray-500">
                  ⚠️ Needs attention
                </span>
              </div>
            </>
          ) : (
            <>
              <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" />
              <div className="flex flex-col">
                <span className="text-lg font-bold text-green-600 leading-tight">
                  None Blocked
                </span>
                <span className="text-xs text-gray-500">
                  ✓ All clear
                </span>
              </div>
            </>
          )}
        </div>
      ),
    },
    // Overdue Tasks
    {
      label: 'Overdue',
      value: (
        <div className="flex items-center gap-2">
          {taskStats.overdue > 0 ? (
            <>
              <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
              <div className="flex flex-col">
                <span className="text-lg font-bold text-red-600 leading-tight">
                  {taskStats.overdue} tasks
                </span>
                <span className="text-xs text-gray-500">
                  ⚠️ Past due
                </span>
              </div>
            </>
          ) : (
            <>
              <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" />
              <div className="flex flex-col">
                <span className="text-lg font-bold text-green-600 leading-tight">
                  On Track
                </span>
                <span className="text-xs text-gray-500">
                  ✓ No delays
                </span>
              </div>
            </>
          )}
        </div>
      ),
    },
    // Team Workload
    {
      label: 'Team Workload',
      value: (
        <div className="flex items-center gap-2">
          <Users className="h-5 w-5 text-blue-600 flex-shrink-0" />
          <div className="flex flex-col">
            <span className="text-lg font-bold text-gray-900 leading-tight">
              {taskStats.topAssignees.length} assigned
            </span>
            <span className="text-xs text-gray-500">
              +{taskStats.unassignedCount} unassigned
            </span>
          </div>
        </div>
      ),
    },
    // Materials
    {
      label: 'Materials',
      value: (
        <div className="flex items-center gap-2">
          <Package className="h-5 w-5 text-gray-600 flex-shrink-0" />
          <div className="flex flex-col">
            <span className="text-lg font-bold text-gray-900 leading-tight">
              {taskStats.tasksWithMaterials} tasks
            </span>
            <span className="text-xs text-gray-500">
              ${taskStats.totalMaterialCost.toLocaleString()}
            </span>
          </div>
        </div>
      ),
    },
  ];

  // Footer content: Budget status + top assignees
  const footerContent = (
    <div className="col-span-full mt-4 space-y-4">

      {/* Budget Warnings */}
      {isOverBudget && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-800 font-medium">
            ⚠️ Tasks Over Budget by ${Math.abs(taskStats.budgetVariance).toLocaleString()}
          </p>
        </div>
      )}
      {isNearBudget && !isOverBudget && (
        <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-sm text-yellow-800 font-medium">
            ⚠️ Approaching Task Budget Limit
          </p>
        </div>
      )}

      {/* Top Assignees */}
      {taskStats.topAssignees.length > 0 && (
        <div className="pt-4 border-t border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
              Top Contributors
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {taskStats.topAssignees.map((assignee) => (
              <div
                key={assignee.id}
                className="flex items-center gap-2 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg"
              >
                {assignee.avatar_url ? (
                  <Image
                    src={assignee.avatar_url}
                    alt={assignee.name}
                    width={24}
                    height={24}
                    className="w-6 h-6 rounded-full"
                  />
                ) : (
                  <div className="w-6 h-6 rounded-full bg-[#001B51] flex items-center justify-center">
                    <span className="text-xs text-white font-bold">
                      {assignee.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}
                <div className="flex flex-col">
                  <span className="text-xs font-semibold text-gray-900">
                    {assignee.name}
                  </span>
                  <span className="text-xs text-gray-500">
                    {assignee.taskCount} task{assignee.taskCount !== 1 ? 's' : ''}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Total Summary */}
      <div className="pt-4 border-t border-gray-200">
        <div className="flex items-center justify-between">
          <span className="text-sm font-bold text-gray-700 uppercase tracking-wider">
            Budget Status
          </span>
          <span className={`text-xl font-bold ${
            taskStats.budgetVariance >= 0 ? 'text-green-600' : 'text-red-600'
          }`}>
            {taskStats.budgetVariance >= 0 ? 'Under' : 'Over'} by ${Math.abs(taskStats.budgetVariance).toLocaleString()}
          </span>
        </div>
      </div>
    </div>
  );

  const activeTasksCount = taskStats.total - taskStats.completed;

  return (
    <InfoCard
      headerIcon={CheckSquare}
      headerTitle="Task Summary"
      headerDescription={`${activeTasksCount} active task${activeTasksCount !== 1 ? 's' : ''}`}
      fields={fields}
      columns={2}
      footerContent={footerContent}
      className={className}
    />
  );
}
