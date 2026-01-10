'use client';

// Debug: Phase 4 - Task Details Tab (read-only task information display)
// Shows all task metadata: title, description, status, priority, dates, assignee, phase, location, costs

import { Calendar, User, MapPin, DollarSign, Flag, Clock } from 'lucide-react';
import { cn, formatPercent } from '@/lib/utils';
import { TASK_STATUS_CONFIG, TASK_PRIORITY_CONFIG } from '@/lib/config/task-colors';
import type { TaskDetails } from './TaskDetailPanel';

// Debug: Component props
export interface TaskDetailsTabProps {
  task: TaskDetails;
  userRole: string; // For future edit permissions
}

/**
 * TaskDetailsTab - Display task metadata in structured layout
 * Read-only for Phase 4, edit functionality in future phase
 */
export function TaskDetailsTab({ task, userRole }: TaskDetailsTabProps) {
  console.log('[TaskDetailsTab] Rendering task:', task.id);

  // Debug: Format date helper
  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Not set';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  // Get status/priority configs from shared color system
  const statusConfig = TASK_STATUS_CONFIG[task.status as keyof typeof TASK_STATUS_CONFIG] || TASK_STATUS_CONFIG.todo;
  const priorityConfig = TASK_PRIORITY_CONFIG[task.priority as keyof typeof TASK_PRIORITY_CONFIG] || TASK_PRIORITY_CONFIG.medium;

  return (
    <div className="space-y-6">
      {/* Debug: Status and Priority Badges */}
      <div className="flex gap-2 flex-wrap">
        <div className={cn(
          'px-3 py-1.5 rounded-lg text-sm font-bold uppercase flex items-center gap-2 border',
          statusConfig.badgeColor
        )}>
          <Clock className="h-4 w-4" />
          {statusConfig.label}
        </div>
        <div className={cn(
          'px-3 py-1.5 rounded-lg text-sm font-bold uppercase flex items-center gap-2 border',
          priorityConfig.badgeColor
        )}>
          <Flag className="h-4 w-4" />
          {priorityConfig.label}
        </div>
      </div>

      {/* Debug: Description */}
      {task.description && (
        <div className="border-l-4 border-l-[#001B51] pl-4">
          <h3 className="text-xs font-bold uppercase text-gray-500 mb-2">Description</h3>
          <p className="text-sm text-gray-700 whitespace-pre-wrap">{task.description}</p>
        </div>
      )}

      {/* Debug: Key Details Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Debug: Assignee */}
        <div className="border-2 border-gray-200 rounded-lg p-3">
          <div className="flex items-center gap-2 text-xs font-bold uppercase text-gray-500 mb-2">
            <User className="h-4 w-4" />
            Assignee
          </div>
          {task.assignee ? (
            <div className="flex items-center gap-2">
              {task.assignee.avatar_url ? (
                <img
                  src={task.assignee.avatar_url}
                  alt={task.assignee.name}
                  className="h-8 w-8 rounded-full border-2 border-gray-200"
                />
              ) : (
                <div className="h-8 w-8 rounded-full bg-[#001B51] flex items-center justify-center text-white text-sm font-bold">
                  {task.assignee.name.charAt(0).toUpperCase()}
                </div>
              )}
              <span className="font-semibold text-sm">{task.assignee.name}</span>
            </div>
          ) : (
            <span className="text-sm text-gray-400">Unassigned</span>
          )}
        </div>

        {/* Debug: Phase */}
        <div className="border-2 border-gray-200 rounded-lg p-3">
          <div className="flex items-center gap-2 text-xs font-bold uppercase text-gray-500 mb-2">
            <Flag className="h-4 w-4" />
            Phase
          </div>
          <span className="font-semibold text-sm">
            {task.phase ? task.phase.name : 'No phase'}
          </span>
        </div>

        {/* Debug: Start Date */}
        <div className="border-2 border-gray-200 rounded-lg p-3">
          <div className="flex items-center gap-2 text-xs font-bold uppercase text-gray-500 mb-2">
            <Calendar className="h-4 w-4" />
            Start Date
          </div>
          <span className="font-semibold text-sm">{formatDate(task.start_date)}</span>
        </div>

        {/* Debug: Due Date */}
        <div className="border-2 border-gray-200 rounded-lg p-3">
          <div className="flex items-center gap-2 text-xs font-bold uppercase text-gray-500 mb-2">
            <Calendar className="h-4 w-4" />
            Due Date
          </div>
          <span className={cn(
            'font-semibold text-sm',
            task.due_date && new Date(task.due_date) < new Date() && task.status !== 'completed'
              ? 'text-red-600'
              : ''
          )}>
            {formatDate(task.due_date)}
          </span>
        </div>
      </div>

      {/* Debug: 3D Location (if spatial marker exists) */}
      {task.spatial_marker && (
        <div className="border-2 border-[#001B51] rounded-lg p-4 bg-[#001B51]/5">
          <div className="flex items-center gap-2 text-xs font-bold uppercase text-[#001B51] mb-3">
            <MapPin className="h-4 w-4" />
            3D Location
          </div>
          <div className="grid grid-cols-3 gap-2 text-sm">
            <div>
              <span className="text-xs text-gray-500 block">X</span>
              <span className="font-mono font-semibold">{task.spatial_marker.position_x.toFixed(2)}</span>
            </div>
            <div>
              <span className="text-xs text-gray-500 block">Y</span>
              <span className="font-mono font-semibold">{task.spatial_marker.position_y.toFixed(2)}</span>
            </div>
            <div>
              <span className="text-xs text-gray-500 block">Z</span>
              <span className="font-mono font-semibold">{task.spatial_marker.position_z.toFixed(2)}</span>
            </div>
          </div>
          {task.spatial_marker.element_id && (
            <div className="mt-2 text-xs text-gray-600">
              <span className="font-semibold">Element ID:</span> {task.spatial_marker.element_id}
            </div>
          )}
        </div>
      )}

      {/* Debug: Cost Summary */}
      {(task.planned_cost !== undefined || task.actual_cost !== undefined) && (
        <div className="border-2 border-gray-200 rounded-lg p-4">
          <div className="flex items-center gap-2 text-xs font-bold uppercase text-gray-500 mb-3">
            <DollarSign className="h-4 w-4" />
            Cost Summary
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <span className="text-xs text-gray-500 block mb-1">Planned</span>
              <span className="text-lg font-black text-[#001B51]">
                ${(task.planned_cost || 0).toFixed(2)}
              </span>
            </div>
            <div>
              <span className="text-xs text-gray-500 block mb-1">Actual</span>
              <span className={cn(
                'text-lg font-black',
                task.actual_cost && task.planned_cost && task.actual_cost > task.planned_cost
                  ? 'text-red-600'
                  : 'text-green-600'
              )}>
                ${(task.actual_cost || 0).toFixed(2)}
              </span>
            </div>
          </div>
          {task.actual_cost !== undefined && task.planned_cost !== undefined && (
            <div className="mt-3 pt-3 border-t border-gray-200">
              <span className="text-xs text-gray-500 block mb-1">Variance</span>
              <span className={cn(
                'text-sm font-bold',
                task.actual_cost > task.planned_cost ? 'text-red-600' : 'text-green-600'
              )}>
                {task.actual_cost > task.planned_cost ? '+' : ''}
                ${(task.actual_cost - task.planned_cost).toFixed(2)}
                {' '}
                ({task.actual_cost > task.planned_cost ? '+' : '-'}{formatPercent(Math.abs((task.actual_cost / task.planned_cost - 1) * 100))})
              </span>
            </div>
          )}
        </div>
      )}

      {/* Debug: Metadata */}
      <div className="border-t border-gray-200 pt-4 text-xs text-gray-500 space-y-1">
        <p>
          <span className="font-semibold">Created:</span> {formatDate(task.created_at)}
        </p>
        <p>
          <span className="font-semibold">Last Updated:</span> {formatDate(task.updated_at)}
        </p>
      </div>
    </div>
  );
}
