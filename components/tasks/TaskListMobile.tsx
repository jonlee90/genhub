'use client';

import { useState } from 'react';
import { SwipeableCard } from '@/components/mobile/SwipeableCard';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Calendar, AlertTriangle, Ban, FolderKanban, Check, Trash2 } from 'lucide-react';
import { cn, formatDate } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { updateTaskStatus, deleteTask } from '@/app/actions/tasks';
import { TASK_STATUS_CONFIG, TASK_PRIORITY_CONFIG } from '@/lib/config/task-colors';
import type { Database } from '@/types/database.types';

type Task = Database['public']['Tables']['tasks']['Row'] & {
  assignee?: {
    id: string;
    name: string;
    email: string;
    avatar_url: string | null;
  } | null;
  project?: {
    id: string;
    name: string;
  } | null;
  phase?: {
    id: string;
    name: string;
  } | null;
  materialStats?: {
    count: number;
    totalCost: number;
  };
};

type Phase = {
  id: string;
  name: string;
  order_index?: number;
};

interface TaskListMobileProps {
  tasks: Task[];
  onTaskClick?: (task: Task) => void;
  /** When provided, we're in project context - look up phase from this array */
  phases?: Phase[];
  /** Enable swipe-to-complete action */
  enableComplete?: boolean;
  /** Enable swipe-to-delete action */
  enableDelete?: boolean;
}

/**
 * TaskListMobile - Mobile-optimized task list with swipe actions
 *
 * Features:
 * - Card-based layout for touch devices
 * - Swipe right to complete task
 * - Swipe left to delete task
 * - Tap to open task modal
 * - Smooth animations with Framer Motion
 */
export function TaskListMobile({
  tasks,
  onTaskClick,
  phases,
  enableComplete = true,
  enableDelete = true,
}: TaskListMobileProps) {
  const [pendingActions, setPendingActions] = useState<Set<string>>(new Set());

  // Get phase name - from phases array in project context, or from task.phase otherwise
  const getPhaseName = (task: Task) => {
    if (phases) {
      const phase = phases.find((p) => p.id === task.phase_id);
      return phase?.name || null;
    }
    return task.phase?.name || null;
  };

  const isOverdue = (task: Task) => {
    if (!task.due_date || task.status === 'completed') return false;
    const [year, month, day] = task.due_date.split('T')[0].split('-').map(Number);
    const dueDate = new Date(year, month - 1, day);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return dueDate < today;
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const handleComplete = async (task: Task) => {
    if (task.status === 'completed' || pendingActions.has(task.id)) return;

    setPendingActions((prev) => new Set(prev).add(task.id));

    try {
      await updateTaskStatus(task.id, 'completed');
    } catch {
      // Task completion failed - UI will remain in pending state briefly
    } finally {
      setPendingActions((prev) => {
        const next = new Set(prev);
        next.delete(task.id);
        return next;
      });
    }
  };

  const handleDelete = async (task: Task) => {
    if (pendingActions.has(task.id)) return;

    // Confirm deletion
    if (!window.confirm(`Delete "${task.title}"? This action cannot be undone.`)) {
      return;
    }

    setPendingActions((prev) => new Set(prev).add(task.id));

    try {
      await deleteTask(task.id);
    } catch {
      // Task deletion failed - UI will remain in pending state briefly
    } finally {
      setPendingActions((prev) => {
        const next = new Set(prev);
        next.delete(task.id);
        return next;
      });
    }
  };

  if (tasks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center px-4">
        <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
          <FolderKanban className="w-8 h-8 text-gray-400" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-1">No tasks found</h3>
        <p className="text-sm text-gray-500">
          Tasks will appear here once created
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <AnimatePresence mode="popLayout">
        {tasks.map((task, index) => {
          const statusConfig = TASK_STATUS_CONFIG[task.status];
          const priorityConfig = TASK_PRIORITY_CONFIG[task.priority];
          const taskIsOverdue = isOverdue(task);
          const isPending = pendingActions.has(task.id);
          const phaseName = getPhaseName(task);

          return (
            <motion.div
              key={task.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: isPending ? 0.5 : 1, y: 0 }}
              exit={{ opacity: 0, x: -100 }}
              transition={{ delay: index * 0.02 }}
              layout
            >
              <SwipeableCard
                onSwipeRight={
                  enableComplete && task.status !== 'completed'
                    ? () => handleComplete(task)
                    : undefined
                }
                onSwipeLeft={enableDelete ? () => handleDelete(task) : undefined}
                leftActionIcon={<Check className="w-6 h-6" />}
                rightActionIcon={<Trash2 className="w-6 h-6" />}
                disabled={isPending}
              >
                <button
                  onClick={() => onTaskClick?.(task)}
                  disabled={isPending}
                  className={cn(
                    'w-full text-left p-4',
                    'border-l-4 border-[#001B51]',
                    'active:bg-gray-50 transition-colors',
                    task.status === 'blocked' && 'bg-red-50'
                  )}
                >
                  {/* Header: Title + Priority */}
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        {task.status === 'blocked' && (
                          <Ban className="h-4 w-4 text-red-500 flex-shrink-0" />
                        )}
                        {taskIsOverdue && task.status !== 'blocked' && (
                          <AlertTriangle className="h-4 w-4 text-orange-500 flex-shrink-0" />
                        )}
                        <h3 className="font-bold text-gray-900 line-clamp-2 text-[15px]">
                          {task.title}
                        </h3>
                      </div>
                    </div>
                    <Badge
                      variant="secondary"
                      className={cn('text-[10px] font-bold shrink-0', priorityConfig.badgeColor)}
                    >
                      {priorityConfig.label}
                    </Badge>
                  </div>

                  {/* Project/Phase Info */}
                  {(task.project || phaseName) && (
                    <div className="flex items-center gap-1 text-xs text-gray-500 mb-2">
                      <FolderKanban className="h-3 w-3" />
                      <span className="truncate">
                        {phases ? (
                          // Project context - show only phase
                          phaseName
                        ) : (
                          // Tasks page - show project / phase
                          <>
                            {task.project?.name}
                            {phaseName && ` / ${phaseName}`}
                          </>
                        )}
                      </span>
                    </div>
                  )}

                  {/* Footer: Status, Due Date, Assignee */}
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      {/* Status Badge */}
                      <Badge className={cn('text-[10px] font-bold', statusConfig.solidColor)}>
                        {statusConfig.label}
                      </Badge>

                      {/* Due Date */}
                      {task.due_date && (
                        <div
                          className={cn(
                            'flex items-center gap-1 text-xs',
                            taskIsOverdue ? 'text-red-600' : 'text-gray-500'
                          )}
                        >
                          <Calendar className="h-3 w-3" />
                          {formatDate(task.due_date)}
                        </div>
                      )}
                    </div>

                    {/* Assignee */}
                    {task.assignee && (
                      <Avatar className="h-6 w-6">
                        <AvatarImage src={task.assignee.avatar_url || undefined} />
                        <AvatarFallback className="text-[10px] bg-[#001B51] text-white">
                          {getInitials(task.assignee.name)}
                        </AvatarFallback>
                      </Avatar>
                    )}
                  </div>

                  {/* Blocked Reason */}
                  {task.status === 'blocked' && task.blocked_reason && (
                    <p className="text-xs text-red-600 bg-red-100 p-2 rounded mt-2 line-clamp-2">
                      {task.blocked_reason}
                    </p>
                  )}
                </button>
              </SwipeableCard>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
