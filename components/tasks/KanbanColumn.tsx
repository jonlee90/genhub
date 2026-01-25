"use client";

import { useMemo, useCallback, useRef, useEffect } from "react";
import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { useVirtualizer } from "@tanstack/react-virtual";
import { TaskCard } from "./TaskCard";
import { cn } from "@/lib/utils";
import { m as motion } from "framer-motion";
import HardHat from "lucide-react/icons/hard-hat";
import type { TaskStatus } from "@/types/db/enums";
import type { TaskWithRelations } from "@/types/db/task";
import type { TaskTypeConfigsRow } from "@/types/db/tables/tasks";

// Phase type for project context
type Phase = {
  id: string;
  name: string;
  order_index?: number;
};

interface KanbanColumnProps {
  id: TaskStatus;
  title: string;
  color: string;
  tasks: TaskWithRelations[];
  onTaskClick?: (task: TaskWithRelations) => void;
  /** When provided, we"re in project context - pass to TaskCard for phase lookup */
  phases?: Phase[];
  /** Mobile mode - full width layout */
  isMobile?: boolean;
  /** Task type configs from database - pass to TaskCard for icon/color display */
  taskTypes?: TaskTypeConfigsRow[];
}

export function KanbanColumn({ id, title, color, tasks, onTaskClick, phases, isMobile = false, taskTypes }: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id,
  });

  // Memoize task IDs to prevent unnecessary re-renders (stable identity for SortableContext)
  const taskIds = useMemo(() => tasks.map((t) => t.id), [tasks]);

  // Stabilize callback to prevent TaskCard re-renders
  const handleTaskClick = useCallback((task: TaskWithRelations) => {
    onTaskClick?.(task);
  }, [onTaskClick]);

  // Virtualization setup - VIRT-01, VIRT-02
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // VIRT-01, VIRT-03, VIRT-04: Configure virtualizer with TaskCard height estimate
  const virtualizer = useVirtualizer({
    count: tasks.length,
    getScrollElement: () => scrollContainerRef.current,
    estimateSize: () => 130, // TaskCard height ~130px
    overscan: 5, // Render 5 items above/below viewport for smooth scrolling
  });

  // VIRT-05: Get only visible items
  const virtualItems = virtualizer.getVirtualItems();

  // VIRT-09: Reset scroll position when switching mobile tabs
  useEffect(() => {
    if (isMobile && scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = 0;
    }
  }, [isMobile, id]);

  return (
    <motion.div
      role="region"
      aria-label={`${title} column with ${tasks.length} tasks`}
      className={cn(
        "flex-shrink-0 rounded-lg border-2 transition-all duration-300 bg-white dark:bg-gray-900 shadow-construction",
        "border-gray-200 dark:border-gray-700",
        isMobile ? "w-full" : "w-[300px]"
      )}
      animate={isOver ? {
        boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06), 0 0 20px rgba(0, 27, 81, 0.4), inset 0 0 10px rgba(0, 27, 81, 0.2)",
        borderColor: "rgba(0, 27, 81, 0.5)",
        scale: isMobile ? 1 : 1.02
      } : {
        boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
        borderColor: "rgba(229, 231, 235, 1)",
        scale: 1
      }}
      transition={{ duration: 0.3, ease: "easeInOut" }}
    >
      {/* Column Header - hidden on mobile since we have tabs */}
      {!isMobile && (
        <div className="p-3 border-b-2 border-gray-200 dark:border-gray-700 bg-gradient-to-r from-[var(--construction-blue)]/5 dark:from-[var(--construction-blue)]/10 to-transparent">
          <div className="flex items-center justify-between">
            <h3 className="font-black text-sm uppercase tracking-wider text-construction-blue dark:text-blue-400">
              {title}
            </h3>
            <span className="text-xs font-bold text-construction-blue dark:text-blue-400 bg-gray-50 dark:bg-gray-800 px-2 py-0.5 rounded-full border border-construction-blue/20 dark:border-blue-400/20">
              {tasks.length}
            </span>
          </div>
        </div>
      )}

      {/* Column Content - Scrollable with virtualization - VIRT-02 */}
      <div
        ref={(node) => {
          // Attach both droppable and scroll refs
          setNodeRef(node);
          (scrollContainerRef as React.MutableRefObject<HTMLDivElement | null>).current = node;
        }}
        className={cn(
          "p-3 min-h-[200px] bg-white dark:bg-gray-900 overflow-y-auto scroll-smooth",
          "scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600 scrollbar-track-gray-100 dark:scrollbar-track-gray-800",
          isMobile
            ? "max-h-[calc(100dvh-240px)]" // Mobile: Account for sticky tabs + bottom nav
            : "max-h-[calc(100vh-150px)]"  // Desktop: Account for page header + padding
        )}
      >
        {/* DND-01: SortableContext with stable task IDs */}
        <SortableContext
          items={taskIds}
          strategy={verticalListSortingStrategy}
        >
          {tasks.length === 0 ? (
            <motion.div
              className="flex flex-col items-center justify-center py-12"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
            >
              <motion.div
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              >
                <HardHat className="w-16 h-16 text-construction-blue/30 dark:text-blue-400/30" />
              </motion.div>
              <p className="mt-4 text-sm font-bold text-gray-600 dark:text-gray-400">No tasks yet</p>
              <p className="text-xs text-gray-500 dark:text-gray-500">Start building your workflow</p>
            </motion.div>
          ) : (
            // VIRT-06, VIRT-07, VIRT-08: Virtual list container with absolute positioning
            <div
              style={{
                height: `${virtualizer.getTotalSize()}px`,
                width: "100%",
                position: "relative",
              }}
            >
              {/* VIRT-05: Render only visible items */}
              {virtualItems.map((virtualItem) => {
                const task = tasks[virtualItem.index];
                return (
                  <div
                    key={task.id} // VIRT-10: Use task.id, not index
                    style={{
                      position: "absolute",
                      top: 0,
                      left: 0,
                      width: "100%",
                      transform: `translateY(${virtualItem.start}px)`, // VIRT-07: translateY for position
                    }}
                    className="pb-2"
                  >
                    <TaskCard
                      task={task}
                      onTaskClick={handleTaskClick}
                      phases={phases}
                      expenseStats={task.expenseStats}
                      taskTypes={taskTypes}
                    />
                  </div>
                );
              })}
            </div>
          )}
        </SortableContext>
      </div>
    </motion.div>
  );
}
