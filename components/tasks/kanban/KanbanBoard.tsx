'use client';

import { useState, useOptimistic, useTransition, useId, useMemo } from 'react';
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
} from '@dnd-kit/core';
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { KanbanColumn } from './KanbanColumn';
import { TaskCard } from '../list/TaskCard';
import { updateTaskStatus } from '@/app/actions/tasks';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import type { TaskWithRelations, Phase, TaskStatus } from '@/types/db/task';

interface KanbanBoardProps {
  tasks: TaskWithRelations[];
  onTaskClick?: (task: TaskWithRelations) => void;
  /** When provided, we're in project context - pass to KanbanColumn for phase lookup */
  phases?: Phase[];
}

const COLUMNS: { id: TaskStatus; title: string; color: string; shortTitle: string }[] = [
  { id: 'todo', title: 'To Do', shortTitle: 'To Do', color: 'bg-gray-50' },
  { id: 'in_progress', title: 'In Progress', shortTitle: 'In Progress', color: 'bg-gray-50' },
  { id: 'review', title: 'Review', shortTitle: 'Review', color: 'bg-gray-50' },
  { id: 'blocked', title: 'Blocked', shortTitle: 'Blocked', color: 'bg-gray-50' },
  { id: 'completed', title: 'Completed', shortTitle: 'Completed', color: 'bg-gray-50' },
];

// Valid status values for checking drop targets
const VALID_STATUSES = new Set<string>(['todo', 'in_progress', 'review', 'blocked', 'completed']);

export function KanbanBoard({ tasks, onTaskClick, phases }: KanbanBoardProps) {
  const [activeTask, setActiveTask] = useState<TaskWithRelations | null>(null);
  const [isPending, startTransition] = useTransition();
  // Mobile-specific state - track active column/status tab
  const [mobileActiveStatus, setMobileActiveStatus] = useState<TaskStatus>('todo');

  // Stable ID for DndContext to prevent hydration mismatch
  const dndContextId = useId();

  // Optimistic state for immediate UI updates
  const [optimisticTasks, setOptimisticTasks] = useOptimistic(
    tasks,
    (state, { taskId, newStatus }: { taskId: string; newStatus: TaskStatus }) =>
      state.map((task) =>
        task.id === taskId ? { ...task, status: newStatus } : task
      )
  );

  // Configure sensors with larger distance threshold for mobile
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // Larger distance to prevent accidental drags
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Group tasks by status - memoized to prevent recalculation on every render
  const tasksByStatus = useMemo(() =>
    COLUMNS.reduce(
      (acc, column) => {
        acc[column.id] = optimisticTasks.filter((task) => task.status === column.id);
        return acc;
      },
      {} as Record<TaskStatus, TaskWithRelations[]>
    ),
    [optimisticTasks]
  );

  const handleDragStart = (event: DragStartEvent) => {
    const task = optimisticTasks.find((t) => t.id === event.active.id);
    setActiveTask(task || null);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveTask(null);

    if (!over) return;

    const taskId = active.id as string;
    const overId = over.id as string;

    // Determine the target status:
    // - If overId is a valid status (dropped on column), use it directly
    // - Otherwise, overId is a task ID (dropped on a task), find that task's status
    let newStatus: TaskStatus;
    if (VALID_STATUSES.has(overId)) {
      newStatus = overId as TaskStatus;
    } else {
      // Find the task we dropped onto and use its status
      const targetTask = optimisticTasks.find((t) => t.id === overId);
      if (!targetTask) return;
      newStatus = targetTask.status;
    }

    // Find the task being dragged
    const task = optimisticTasks.find((t) => t.id === taskId);
    if (!task || task.status === newStatus) return;

    // Handle blocked status - need reason
    if (newStatus === 'blocked') {
      const reason = window.prompt('Please enter a reason for blocking this task:');
      if (!reason) return;

      startTransition(async () => {
        setOptimisticTasks({ taskId, newStatus });
        await updateTaskStatus(taskId, newStatus, reason);
      });
    } else {
      startTransition(async () => {
        setOptimisticTasks({ taskId, newStatus });
        await updateTaskStatus(taskId, newStatus);
      });
    }
  };

  // Get task count for each status (for mobile tabs)
  const getStatusCount = (status: TaskStatus) => {
    return tasksByStatus[status]?.length || 0;
  };

  return (
    <div className="relative">

      <DndContext
        id={dndContextId}
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        {/* Mobile Status Tabs - Sticky at top, scrollable */}
        <div className="md:hidden sticky top-0 z-20 bg-white border-b-2 border-gray-200 mb-4 -mx-4 px-4 shadow-construction">
          <div className="overflow-x-auto scrollbar-hide">
            <div className="flex gap-2 py-3 min-w-max">
              {COLUMNS.map((column) => {
                const count = getStatusCount(column.id);
                const isActive = mobileActiveStatus === column.id;

                return (
                  <motion.button
                    key={column.id}
                    onClick={() => setMobileActiveStatus(column.id)}
                    className={cn(
                      "relative flex items-center gap-2 px-4 py-2.5 rounded-lg font-bold text-sm transition-all duration-300 min-h-[44px]",
                      isActive
                        ? "bg-construction-blue text-white shadow-construction-lg"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200 active:bg-gray-300"
                    )}
                    whileTap={{ scale: 0.95 }}
                  >
                    {/* Active indicator */}
                    {isActive && (
                      <motion.div
                        layoutId="mobileActiveTab"
                        className="absolute inset-0 bg-construction-blue rounded-lg shadow-construction-lg"
                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                      />
                    )}

                    <span className="relative z-10">{column.shortTitle}</span>

                    {/* Task count badge */}
                    <span
                      className={cn(
                        "relative z-10 flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full text-xs font-black",
                        isActive
                          ? "bg-white/20 text-white"
                          : "bg-gray-200 text-gray-600"
                      )}
                    >
                      {count}
                    </span>
                  </motion.button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Desktop view - All columns side by side */}
        <div className="hidden md:flex gap-4 overflow-x-auto pb-4 relative z-10">
          {COLUMNS.map((column) => (
            <KanbanColumn
              key={column.id}
              id={column.id}
              title={column.title}
              color={column.color}
              tasks={tasksByStatus[column.id] || []}
              onTaskClick={onTaskClick}
              phases={phases}
            />
          ))}
        </div>

        {/* Mobile view - Single column based on active status tab */}
        <div className="md:hidden relative z-10">
          {COLUMNS.map((column) => {
            const isActive = mobileActiveStatus === column.id;

            return (
              <motion.div
                key={column.id}
                initial={false}
                animate={{
                  display: isActive ? 'block' : 'none',
                  opacity: isActive ? 1 : 0,
                }}
                transition={{ duration: 0.2 }}
              >
                {isActive && (
                  <KanbanColumn
                    id={column.id}
                    title={column.title}
                    color={column.color}
                    tasks={tasksByStatus[column.id] || []}
                    onTaskClick={onTaskClick}
                    phases={phases}
                    isMobile={true}
                  />
                )}
              </motion.div>
            );
          })}
        </div>

        <DragOverlay>
          {activeTask ? (
            <TaskCard task={activeTask} isDragging phases={phases} />
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
}