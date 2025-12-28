'use client';

import { useState, useOptimistic, useTransition, useId } from 'react';
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
import { TaskCard } from './TaskCard';
import { updateTaskStatus } from '@/app/actions/tasks';
import { BackgroundBoxes } from '@/components/ui/aceternity/background-boxes';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import type { Database } from '@/types/database.types';

type TaskStatus = Database['public']['Enums']['task_status'];

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
};

// Phase type for project context
type Phase = {
  id: string;
  name: string;
  order_index?: number;
};

interface KanbanBoardProps {
  tasks: Task[];
  onTaskClick?: (task: Task) => void;
  /** When provided, we're in project context - pass to KanbanColumn for phase lookup */
  phases?: Phase[];
}

const COLUMNS: { id: TaskStatus; title: string; color: string; shortTitle: string }[] = [
  { id: 'todo', title: 'To Do', shortTitle: 'To Do', color: 'bg-gray-50' },
  { id: 'in_progress', title: 'In Progress', shortTitle: 'In Progress', color: 'bg-[#001B51]/5' },
  { id: 'review', title: 'Review', shortTitle: 'Review', color: 'bg-[#3C3C3C]/5' },
  { id: 'blocked', title: 'Blocked', shortTitle: 'Blocked', color: 'bg-[#DC2626]/5' },
  { id: 'completed', title: 'Completed', shortTitle: 'Done', color: 'bg-[#059669]/5' },
];

// Valid status values for checking drop targets
const VALID_STATUSES = new Set<string>(['todo', 'in_progress', 'review', 'blocked', 'completed']);

export function KanbanBoard({ tasks, onTaskClick, phases }: KanbanBoardProps) {
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [isPending, startTransition] = useTransition();
  // Debug: Mobile-specific state - track active column/status tab
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

  // Debug: Configure sensors with delay and distance to prevent accidental drags on click
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 15, // Increased from 8 to prevent accidental drags on click
        delay: 100, // 100ms delay - must hold pointer down before drag starts
        tolerance: 5, // Allow 5px of movement during delay without canceling
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Group tasks by status
  const tasksByStatus = COLUMNS.reduce(
    (acc, column) => {
      acc[column.id] = optimisticTasks.filter((task) => task.status === column.id);
      return acc;
    },
    {} as Record<TaskStatus, Task[]>
  );

  const handleDragStart = (event: DragStartEvent) => {
    // Debug: Only set active task if event is valid (not a canceled click)
    const task = optimisticTasks.find((t) => t.id === event.active.id);
    if (task) {
      setActiveTask(task);
      setIsDragging(true);
      console.log('[KanbanBoard] Drag started for task:', task.title);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveTask(null);
    setIsDragging(false);

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

  // Debug: Get task count for each status (for mobile tabs)
  const getStatusCount = (status: TaskStatus) => {
    return tasksByStatus[status]?.length || 0;
  };

  return (
    <div className="relative">
      {/* Industrial Grid Background */}
      <div className="fixed inset-0 pointer-events-none opacity-[0.03] z-0">
        <BackgroundBoxes boxSize={40} className="text-[#001B51]" />
      </div>

      <DndContext
        id={dndContextId}
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        {/* Debug: Mobile Status Tabs - Sticky at top, scrollable */}
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
                    {/* Debug: Active indicator */}
                    {isActive && (
                      <motion.div
                        layoutId="mobileActiveTab"
                        className="absolute inset-0 bg-construction-blue rounded-lg shadow-construction-lg"
                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                      />
                    )}

                    <span className="relative z-10">{column.shortTitle}</span>

                    {/* Debug: Task count badge */}
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

        {/* Debug: Desktop view - All columns side by side */}
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

        {/* Debug: Mobile view - Single column based on active status tab */}
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
