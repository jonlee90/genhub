"use client";

import { useState, useMemo, useCallback, useTransition, useEffect, useRef } from "react";
import { addDays, format, differenceInCalendarDays } from "date-fns";
import {
  DndContext,
  DragOverlay,
  useSensor,
  useSensors,
  PointerSensor,
  type DragStartEvent,
  type DragEndEvent,
} from "@dnd-kit/core";
import { restrictToHorizontalAxis } from "@dnd-kit/modifiers";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { GanttHeader } from "./GanttHeader";
import { GanttTimeline } from "./GanttTimeline";
import { GanttTaskRow } from "./GanttTaskRow";
import { GanttDependencyLines } from "./GanttDependencyLines";
import { GanttViewToggle } from "./GanttViewToggle";
import {
  calculateDateRange,
  getTaskPosition,
  snapToDate,
  pixelsToDateOffset,
  calculateDependencyLines,
  generateDateGroups,
  generateDateCells,
  calculateTotalWidth,
} from "./gantt-utils";
import type {
  GanttChartProps,
  TimeScale,
  GanttConfig,
  TaskPosition,
} from "./gantt-types";
import {
  DEFAULT_GANTT_CONFIG,
  MOBILE_GANTT_CONFIG,
  TABLET_GANTT_CONFIG,
  TIME_SCALE_CONFIGS,
  MOBILE_TIME_SCALE_CONFIGS,
} from "./gantt-types";
import { cn } from "@/lib/utils";

export function GanttChart({
  tasks,
  dependencies,
  onTaskClick,
  onTaskDateChange,
  className,
  taskTypes,
  showProjectInsteadOfPhase = false,
}: GanttChartProps) {
  const [timeScale, setTimeScale] = useState<TimeScale>("day");
  const [hoveredTaskId, setHoveredTaskId] = useState<string | null>(null);
  const [activeTaskId, setActiveTaskId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);
  const [isDraggingScroll, setIsDraggingScroll] = useState(false);
  // Lazy state initialization - avoid object creation on every render (rerender-lazy-state-init)
  const [scrollStart, setScrollStart] = useState(() => ({ x: 0, scrollLeft: 0 }));
  const scrollAreaRef = useRef<HTMLDivElement | null>(null);

  // Detect screen size for responsive config
  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      setIsMobile(width < 768);
      setIsTablet(width >= 768 && width < 1024);
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Mouse drag scrolling handlers
  const handleMouseDown = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const container = e.currentTarget.querySelector("[data-radix-scroll-area-viewport]") as HTMLDivElement;
    if (!container) return;

    setIsDraggingScroll(true);
    setScrollStart({
      x: e.pageX,
      scrollLeft: container.scrollLeft,
    });
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDraggingScroll) return;

    const container = e.currentTarget.querySelector("[data-radix-scroll-area-viewport]") as HTMLDivElement;
    if (!container) return;

    e.preventDefault();
    const x = e.pageX;
    const walk = (x - scrollStart.x) * 2; // Multiply by 2 for faster scrolling
    container.scrollLeft = scrollStart.scrollLeft - walk;
  }, [isDraggingScroll, scrollStart]);

  const handleMouseUp = useCallback(() => {
    setIsDraggingScroll(false);
  }, []);

  const handleMouseLeave = useCallback(() => {
    setIsDraggingScroll(false);
  }, []);

  // Sort tasks by: 1) phase order, 2) due date (closest first), 3) status, 4) priority (high to low)
  const sortedTasks = useMemo(() => {
    const statusOrder: Record<string, number> = {
      todo: 1,
      in_progress: 2,
      review: 3,
      blocked: 4,
      completed: 5,
    };

    const priorityOrder: Record<string, number> = {
      critical: 4,
      high: 3,
      medium: 2,
      low: 1,
    };

    return [...tasks].sort((a, b) => {
      // 1. Sort by phase order_index (tasks without phase go to end)
      const phaseOrderA = a.phase?.order_index ?? 999;
      const phaseOrderB = b.phase?.order_index ?? 999;

      if (phaseOrderA !== phaseOrderB) {
        return phaseOrderA - phaseOrderB;
      }

      // 2. Sort by due date (closest first, null dates go to end)
      if (a.due_date !== b.due_date) {
        if (!a.due_date) return 1;
        if (!b.due_date) return -1;
        return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
      }

      // 3. Sort by status (todo first, completed last)
      const statusA = statusOrder[a.status || "todo"] || 1;
      const statusB = statusOrder[b.status || "todo"] || 1;
      if (statusA !== statusB) {
        return statusA - statusB;
      }

      // 4. Sort by priority (high to low)
      const priorityA = priorityOrder[a.priority || "low"] || 1;
      const priorityB = priorityOrder[b.priority || "low"] || 1;
      return priorityB - priorityA;
    });
  }, [tasks]);

  // Configure sensors for drag and drop with mobile-optimized settings
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: isMobile ? 12 : 8, // More distance on mobile to prevent accidental drags
        tolerance: isMobile ? 10 : 5,
      },
    })
  );

  // Calculate Gantt configuration based on screen size
  const config: GanttConfig = useMemo(() => {
    const dateRange = calculateDateRange(sortedTasks);
    const baseConfig = isMobile
      ? MOBILE_GANTT_CONFIG
      : isTablet
      ? TABLET_GANTT_CONFIG
      : DEFAULT_GANTT_CONFIG;

    const timeScaleConfigs = isMobile ? MOBILE_TIME_SCALE_CONFIGS : TIME_SCALE_CONFIGS;
    const timeScaleConfig = timeScaleConfigs[timeScale];
    const totalDays = differenceInCalendarDays(dateRange.end, dateRange.start);

    return {
      ...baseConfig,
      timeScale,
      cellWidth: timeScaleConfig.cellWidth,
      viewStartDate: dateRange.start,
      viewEndDate: dateRange.end,
      totalDays,
    };
  }, [sortedTasks, timeScale, isMobile, isTablet]);

  // Generate header data with responsive configs
  const timeScaleConfig = useMemo(() => {
    const configs = isMobile ? MOBILE_TIME_SCALE_CONFIGS : TIME_SCALE_CONFIGS;
    return configs[timeScale];
  }, [timeScale, isMobile]);

  const dateGroups = useMemo(
    () => generateDateGroups(config, timeScaleConfig),
    [config, timeScaleConfig]
  );
  const dateCells = useMemo(
    () => generateDateCells(config, timeScaleConfig),
    [config, timeScaleConfig]
  );

  // Calculate task positions
  const taskPositions = useMemo(() => {
    const positions = new Map<string, TaskPosition>();
    sortedTasks.forEach((task, index) => {
      const position = getTaskPosition(task, config, index);
      positions.set(task.id, position);
    });
    return positions;
  }, [sortedTasks, config]);

  // Calculate dependency lines (optimized - remove hoveredTaskId from deps)
  const dependencyLines = useMemo(
    () => calculateDependencyLines(dependencies, taskPositions, hoveredTaskId),
    [dependencies, taskPositions]
  );

  const totalWidth = calculateTotalWidth(config);
  const totalHeight = sortedTasks.length * config.rowHeight;

  // Drag and drop handlers
  const handleDragStart = useCallback((event: DragStartEvent) => {
    const taskId = event.active.id as string;
    setActiveTaskId(taskId);
  }, []);

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, delta } = event;
      setActiveTaskId(null);

      if (!delta.x) return;

      const taskId = active.id as string;
      const task = sortedTasks.find((t) => t.id === taskId);
      if (!task) return;

      // Calculate days moved based on drag distance
      const daysMoved = pixelsToDateOffset(delta.x, config.cellWidth, config.timeScale);

      // Move both start and end dates by the same offset
      const newStartDate = addDays(task.startDate, daysMoved);
      const newDueDate = addDays(task.endDate, daysMoved);

      // Snap both dates to grid
      const snappedStartDate = snapToDate(newStartDate, config.timeScale);
      const snappedDueDate = snapToDate(newDueDate, config.timeScale);

      // Optimistic update + server action
      startTransition(async () => {
        await onTaskDateChange(
          taskId,
          format(snappedStartDate, "yyyy-MM-dd"),
          format(snappedDueDate, "yyyy-MM-dd")
        );
      });
    },
    [sortedTasks, config, onTaskDateChange]
  );

  // Empty state
  if (sortedTasks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 bg-gray-50 dark:bg-gray-800 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-600">
        <p className="text-gray-600 dark:text-gray-300 font-medium">No tasks to display in timeline view</p>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">Create tasks to see them on the Gantt chart</p>
      </div>
    );
  }

  // Conditionally wrap content with DndContext only on desktop
  const chartContent = (
    <ScrollArea
      className={cn(
        "w-full min-w-0 select-none bg-white dark:bg-gray-900",
        // Only show grab cursor on desktop
        !isMobile && (isDraggingScroll ? "cursor-grabbing" : "cursor-grab")
      )}
      style={{
        height: Math.min(
          totalHeight + config.headerHeight + (isMobile ? 20 : 40),
          isMobile ? 400 : 600
        ),
        // Prevent overscroll and constrain touch behavior on mobile
        ...(isMobile && {
          touchAction: 'pan-x',
          overscrollBehavior: 'contain',
          WebkitOverflowScrolling: 'touch'
        })
      }}
      onMouseDown={!isMobile ? handleMouseDown : undefined}
      onMouseMove={!isMobile ? handleMouseMove : undefined}
      onMouseUp={!isMobile ? handleMouseUp : undefined}
      onMouseLeave={!isMobile ? handleMouseLeave : undefined}
    >
          <div
            className="relative bg-white dark:bg-gray-900"
            style={{
              width: totalWidth
            }}
          >
            {/* Header */}
            <GanttHeader config={config} dateGroups={dateGroups} sortedTasksLength={sortedTasks.length} dateCells={dateCells} />

            {/* Timeline grid and task rows */}
              {/* Grid background */}
              <GanttTimeline config={config} dateCells={dateCells} taskCount={sortedTasks.length} />

              {/* Dependency lines */}
              <div className="absolute inset-0" style={{ left: config.sidebarWidth }}>
                <GanttDependencyLines lines={dependencyLines} hoveredTaskId={hoveredTaskId} />
              </div>

              {/* Task rows */}
              <div className="relative">
                {sortedTasks.map((task, index) => {
                  const position = taskPositions.get(task.id);
                  if (!position) return null;

                  return (
                    <GanttTaskRow
                      key={task.id}
                      task={task}
                      position={position}
                      config={config}
                      isDragging={activeTaskId === task.id}
                      hoveredTaskId={hoveredTaskId}
                      onHover={setHoveredTaskId}
                      onClick={onTaskClick}
                      isMobile={isMobile}
                      taskTypes={taskTypes}
                      showProjectInsteadOfPhase={showProjectInsteadOfPhase}
                    />
                  );
                })}
              </div>
            </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      );

  return (
    <div className={cn(" bg-white dark:bg-gray-900 rounded-xl border-2 border-gray-200 dark:border-gray-700 shadow-construction overflow-hidden", className)}>
      {/* Header with time scale toggle */}
      <div className="flex items-center justify-between p-2 sm:p-4 border-b-2 border-gray-200 dark:border-gray-700 bg-gradient-to-r from-gray-50 dark:from-gray-800 to-white dark:to-gray-900">

        {isMobile ? null : (
          <div className="flex items-center gap-2 sm:gap-3">
            <h3 className="text-sm sm:text-lg font-black text-construction-blue">
              PROJECT TIMELINE
            </h3>
            <span className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
              {sortedTasks.length} {sortedTasks.length === 1 ? "task" : "tasks"}
            </span>
          </div>
        )}
        <GanttViewToggle timeScale={timeScale} onTimeScaleChange={setTimeScale} isMobile={isMobile} />
      </div>

      {/* Gantt Chart - Wrapped in DndContext only on desktop */}
      {isMobile ? (
        chartContent
      ) : (
        <DndContext
          sensors={sensors}
          modifiers={[restrictToHorizontalAxis]}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          {chartContent}

          {/* Drag overlay */}
          <DragOverlay>
            {activeTaskId && (
              <div className="bg-construction-blue text-white rounded-lg shadow-construction-lg font-bold px-4 py-2 text-sm">
                {sortedTasks.find((t) => t.id === activeTaskId)?.title}
              </div>
            )}
          </DragOverlay>
        </DndContext>
      )}

      {/* Loading overlay */}
      {isPending && (
        <div className="absolute inset-0 bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 px-6 py-4 rounded-lg shadow-construction-lg">
            <p className="text-construction-blue font-bold">Updating task date...</p>
          </div>
        </div>
      )}
    </div>
  );
}
