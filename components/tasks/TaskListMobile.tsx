"use client";

import { useState, useCallback } from "react";
import { SwipeableCard } from "@/components/mobile/SwipeableCard";
import { TaskCard } from ".//TaskCard";
import { FolderKanban } from "lucide-react";
import { Check } from "lucide-react";
import { Trash2 } from "lucide-react";
import { m as motion, AnimatePresence } from "framer-motion";
import { updateTaskStatus, deleteTask } from "@/app/actions/tasks";
import type { TaskWithRelations, Phase } from "@/types/db/task";

interface TaskListMobileProps {
  tasks: TaskWithRelations[];
  onTaskClick?: (task: TaskWithRelations) => void;
  /** When provided, we"re in project context - look up phase from this array */
  phases?: Phase[];
  /** Enable swipe-to-complete action */
  enableComplete?: boolean;
  /** Enable swipe-to-delete action */
  enableDelete?: boolean;
  /** Task type configs from database - for icon/color display */
  taskTypes?: any[];
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
  taskTypes,
}: TaskListMobileProps) {
  const [pendingActions, setPendingActions] = useState<Set<string>>(new Set());

  // Memoize handleComplete to prevent unnecessary re-renders of SwipeableCard
  const handleComplete = useCallback(async (task: TaskWithRelations) => {
    if (task.status === "completed" || pendingActions.has(task.id)) return;

    setPendingActions((prev) => new Set(prev).add(task.id));

    try {
      await updateTaskStatus(task.id, "completed");
    } catch {
      // Task completion failed - UI will remain in pending state briefly
    } finally {
      setPendingActions((prev) => {
        const next = new Set(prev);
        next.delete(task.id);
        return next;
      });
    }
  }, [pendingActions]);

  // Memoize handleDelete to prevent unnecessary re-renders of SwipeableCard
  const handleDelete = useCallback(async (task: TaskWithRelations) => {
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
  }, [pendingActions]);

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
          const isPending = pendingActions.has(task.id);

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
                  enableComplete && task.status !== "completed"
                    ? () => handleComplete(task)
                    : undefined
                }
                onSwipeLeft={enableDelete ? () => handleDelete(task) : undefined}
                leftActionIcon={<Check className="w-6 h-6" />}
                rightActionIcon={<Trash2 className="w-6 h-6" />}
                disabled={isPending}
              >
                <TaskCard
                  task={task}
                  onTaskClick={onTaskClick}
                  phases={phases}
                  expenseStats={task.expenseStats}
                  taskTypes={taskTypes}
                />
              </SwipeableCard>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
