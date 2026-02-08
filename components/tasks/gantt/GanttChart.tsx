"use client";

import {
  useState,
  useMemo,
  useCallback,
  useTransition,
  useEffect,
  useRef,
} from "react";
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
import { GanttPhaseRow } from "./GanttPhaseRow";
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
  groupTasksByPhase,
  buildGanttRows,
  getPhasePosition,
} from "./gantt-utils";
import type {
  GanttChartProps,
  TimeScale,
  GanttConfig,
  TaskPosition,
  PhasePosition,
  GanttRow,
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
  const [timeScale, setTimeScale] = useState<TimeScale>("week");
  const [hoveredTaskId, setHoveredTaskId] = useState<string | null>(null);
  const [activeTaskId, setActiveTaskId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);
  const [isDraggingScroll, setIsDraggingScroll] = useState(false);
  // Lazy state initialization - avoid object creation on every render (rerender-lazy-state-init)
  const [scrollStart, setScrollStart] = useState(() => ({
    x: 0,
    scrollLeft: 0,
  }));
  const scrollAreaRef = useRef<HTMLDivElement | null>(null);
  const [collapsedPhaseIds, setCollapsedPhaseIds] = useState<Set<string>>(
    new Set(),
  );

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
    const container = e.currentTarget.querySelector(
      "[data-radix-scroll-area-viewport]",
    ) as HTMLDivElement;
    if (!container) return;

    setIsDraggingScroll(true);
    setScrollStart({
      x: e.pageX,
      scrollLeft: container.scrollLeft,
    });
  }, []);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!isDraggingScroll) return;

      const container = e.currentTarget.querySelector(
        "[data-radix-scroll-area-viewport]",
      ) as HTMLDivElement;
      if (!container) return;

      e.preventDefault();
      const x = e.pageX;
      const walk = (x - scrollStart.x) * 2; // Multiply by 2 for faster scrolling
      container.scrollLeft = scrollStart.scrollLeft - walk;
    },
    [isDraggingScroll, scrollStart],
  );

  const handleMouseUp = useCallback(() => {
    setIsDraggingScroll(false);
  }, []);

  const handleMouseLeave = useCallback(() => {
    setIsDraggingScroll(false);
  }, []);

  // Toggle phase collapse
  const togglePhaseCollapse = useCallback((phaseId: string) => {
    setCollapsedPhaseIds((prev) => {
      const next = new Set(prev);
      if (next.has(phaseId)) {
        next.delete(phaseId);
      } else {
        next.add(phaseId);
      }
      return next;
    });
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
    }),
  );

  // Calculate Gantt configuration based on screen size
  const config: GanttConfig = useMemo(() => {
    const dateRange = calculateDateRange(sortedTasks);
    const baseConfig = isMobile
      ? MOBILE_GANTT_CONFIG
      : isTablet
        ? TABLET_GANTT_CONFIG
        : DEFAULT_GANTT_CONFIG;

    const timeScaleConfigs = isMobile
      ? MOBILE_TIME_SCALE_CONFIGS
      : TIME_SCALE_CONFIGS;
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
    [config, timeScaleConfig],
  );
  const dateCells = useMemo(
    () => generateDateCells(config, timeScaleConfig),
    [config, timeScaleConfig],
  );

  // Initialize collapsed phases (auto-collapse completed phases on first render)
  const [initialCollapseComputed, setInitialCollapseComputed] = useState(false);

  // Group tasks by phase and build rows (only when NOT showing project instead of phase)
  const { ganttRows, phaseGroups } = useMemo(() => {
    if (showProjectInsteadOfPhase) {
      // Flat list - no phase grouping
      return {
        ganttRows: sortedTasks.map((task, index) => ({
          type: "task" as const,
          task,
          rowIndex: index,
          isFirstInPhase: false,
          isLastInPhase: false,
        })),
        phaseGroups: [],
      };
    }

    // Phase grouping
    const groups = groupTasksByPhase(sortedTasks, collapsedPhaseIds);
    const rows = buildGanttRows(groups);
    return { ganttRows: rows, phaseGroups: groups };
  }, [sortedTasks, collapsedPhaseIds, showProjectInsteadOfPhase]);

  // Auto-collapse completed phases on initial render (only once)
  useEffect(() => {
    if (showProjectInsteadOfPhase || initialCollapseComputed) return;

    // Compute initial collapsed state from sorted tasks (before grouping)
    const phaseCompletionMap = new Map<string, boolean>();

    sortedTasks.forEach((task) => {
      const phaseId = task.phase?.id || "__unphased__";
      if (!phaseCompletionMap.has(phaseId)) {
        phaseCompletionMap.set(phaseId, true);
      }
      // If any task in phase is not completed, mark phase as not all completed
      if (task.status !== "completed") {
        phaseCompletionMap.set(phaseId, false);
      }
    });

    const completedPhaseIds = Array.from(phaseCompletionMap.entries())
      .filter(([_, allCompleted]) => allCompleted)
      .map(([phaseId]) => phaseId);

    if (completedPhaseIds.length > 0) {
      setCollapsedPhaseIds(new Set(completedPhaseIds));
    }
    setInitialCollapseComputed(true);
  }, [sortedTasks, showProjectInsteadOfPhase, initialCollapseComputed]);

  // Calculate task positions using ganttRows
  const taskPositions = useMemo(() => {
    const positions = new Map<string, TaskPosition>();
    ganttRows.forEach((row) => {
      if (row.type === "task") {
        const position = getTaskPosition(row.task, config, row.rowIndex);
        positions.set(row.task.id, position);
      }
    });
    return positions;
  }, [ganttRows, config]);

  // Calculate phase positions
  const phasePositions = useMemo(() => {
    const positions = new Map<string, PhasePosition>();
    ganttRows.forEach((row) => {
      if (row.type === "phase") {
        const position = getPhasePosition(row.phaseGroup, config, row.rowIndex);
        positions.set(row.phaseGroup.id, position);
      }
    });
    return positions;
  }, [ganttRows, config]);

  // Calculate dependency lines (optimized - remove hoveredTaskId from deps)
  const dependencyLines = useMemo(
    () => calculateDependencyLines(dependencies, taskPositions, hoveredTaskId),
    [dependencies, taskPositions],
  );

  // Calculate total width based on actual dateCells count to ensure alignment
  // between header columns and grid lines (fixes mismatch in week/month views)
  const gridWidth = dateCells.length * config.cellWidth;
  const totalWidth = config.sidebarWidth + gridWidth;
  const totalHeight = ganttRows.length * config.rowHeight;

  // Compute phase-to-last-task connector lines
  const phaseConnectors = useMemo(() => {
    if (showProjectInsteadOfPhase) return [];

    const connectors: Array<{
      id: string;
      x: number;
      yStart: number;
      yEnd: number;
      taskBarRight: number;
      bracketEndX: number;
    }> = [];

    for (const row of ganttRows) {
      if (row.type !== "phase" || row.phaseGroup.isCollapsed) continue;
      if (row.phaseGroup.tasks.length === 0) continue;
      if (row.phaseGroup.allCompleted) continue;

      const phasePos = phasePositions.get(row.phaseGroup.id);
      if (!phasePos) continue;

      // Find the last task row for this phase
      const lastTask = row.phaseGroup.tasks[row.phaseGroup.tasks.length - 1];
      const lastTaskPos = taskPositions.get(lastTask.id);
      if (!lastTaskPos) continue;

      // Right edge of last task bar + small offset for the hook
      const lastTaskBarRight =
        config.sidebarWidth +
        lastTaskPos.left +
        Math.max(lastTaskPos.width, 20);
      const hookOffset = 12;
      const x = lastTaskBarRight + hookOffset;
      // Bottom of phase row (where the L-bracket ends)
      const yStart = (row.rowIndex + 1) * config.rowHeight;
      // Center of last task row
      const yEnd =
        lastTaskPos.rowIndex * config.rowHeight + config.rowHeight / 2;

      connectors.push({
        id: row.phaseGroup.id,
        x,
        yStart,
        yEnd,
        taskBarRight: lastTaskBarRight,
        // bracketEndX relative to timeline area (without sidebarWidth)
        bracketEndX: x - config.sidebarWidth,
      });
    }
    return connectors;
  }, [
    ganttRows,
    phasePositions,
    taskPositions,
    config.sidebarWidth,
    config.rowHeight,
    showProjectInsteadOfPhase,
  ]);

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
      const daysMoved = pixelsToDateOffset(
        delta.x,
        config.cellWidth,
        config.timeScale,
      );

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
          format(snappedDueDate, "yyyy-MM-dd"),
        );
      });
    },
    [sortedTasks, config, onTaskDateChange],
  );

  // Empty state
  if (sortedTasks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 bg-gray-50 dark:bg-gray-800 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-600">
        <p className="text-gray-600 dark:text-gray-300 font-medium">
          No tasks to display in timeline view
        </p>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
          Create tasks to see them on the Gantt chart
        </p>
      </div>
    );
  }

  // Conditionally wrap content with DndContext only on desktop
  const chartContent = (
    <ScrollArea
      className={cn(
        "w-full min-w-0 select-none bg-white dark:bg-gray-900",
        // Only show grab cursor on desktop
        !isMobile && (isDraggingScroll ? "cursor-grabbing" : "cursor-grab"),
      )}
      style={{
        height: Math.min(
          totalHeight + config.headerHeight + (isMobile ? 20 : 40),
          isMobile ? 400 : 600,
        ),
        // Prevent overscroll and constrain touch behavior on mobile
        ...(isMobile && {
          touchAction: "pan-x",
          overscrollBehavior: "contain",
          WebkitOverflowScrolling: "touch",
        }),
      }}
      onMouseDown={!isMobile ? handleMouseDown : undefined}
      onMouseMove={!isMobile ? handleMouseMove : undefined}
      onMouseUp={!isMobile ? handleMouseUp : undefined}
      onMouseLeave={!isMobile ? handleMouseLeave : undefined}
    >
      <div
        className="relative bg-white dark:bg-gray-900"
        style={{
          width: totalWidth,
        }}
      >
        {/* Header */}
        <GanttHeader
          config={config}
          dateGroups={dateGroups}
          taskCount={sortedTasks.length}
          dateCells={dateCells}
        />

        {/* Task area - grid and rows share same positioning context */}
        <div className="relative">
          {/* Grid background */}
          <GanttTimeline
            config={config}
            dateCells={dateCells}
            taskCount={ganttRows.length}
            totalWidth={totalWidth}
          />

          {/* Dependency lines */}
          <div
            className="absolute inset-0"
            style={{ left: config.sidebarWidth }}
          >
            <GanttDependencyLines
              lines={dependencyLines}
              hoveredTaskId={hoveredTaskId}
            />
          </div>

          {/* Phase and Task rows */}
          {ganttRows.map((row) => {
            if (row.type === "phase") {
              const phasePosition = phasePositions.get(row.phaseGroup.id);
              if (!phasePosition) return null;

              const conn = phaseConnectors.find(
                (c) => c.id === row.phaseGroup.id,
              );

              return (
                <GanttPhaseRow
                  key={`phase-${row.phaseGroup.id}`}
                  phaseGroup={row.phaseGroup}
                  phasePosition={phasePosition}
                  config={config}
                  onToggleCollapse={togglePhaseCollapse}
                  isMobile={isMobile}
                  bracketEndX={conn?.bracketEndX}
                />
              );
            } else if (row.type === "task") {
              const position = taskPositions.get(row.task.id);
              if (!position) return null;

              return (
                <GanttTaskRow
                  key={row.task.id}
                  task={row.task}
                  position={position}
                  config={config}
                  isDragging={activeTaskId === row.task.id}
                  hoveredTaskId={hoveredTaskId}
                  onHover={setHoveredTaskId}
                  onClick={onTaskClick}
                  isMobile={isMobile}
                  taskTypes={taskTypes}
                  showProjectInsteadOfPhase={showProjectInsteadOfPhase}
                  isNested={!showProjectInsteadOfPhase}
                  isFirstInPhase={row.isFirstInPhase}
                  isLastInPhase={row.isLastInPhase}
                />
              );
            }
            return null;
          })}

          {/* Phase-to-task connector lines (overlay) */}
          {phaseConnectors.map((conn) => (
            <div key={`conn-${conn.id}`} className="pointer-events-none">
              {/* Vertical line - overlap with bracket's border-right (3px) */}
              <div
                className="absolute bg-gray-500 dark:bg-gray-400"
                style={{
                  left: conn.x - 3,
                  top: conn.yStart,
                  width: 3,
                  height: conn.yEnd - conn.yStart + 1,
                }}
              />
              {/* Horizontal tick from task bar to vertical line */}
              <div
                className="absolute bg-gray-500 dark:bg-gray-400"
                style={{
                  left: conn.taskBarRight,
                  top: conn.yEnd - 1,
                  width: conn.x - conn.taskBarRight,
                  height: 3,
                }}
              />
            </div>
          ))}
        </div>
      </div>
      <ScrollBar orientation="horizontal" />
    </ScrollArea>
  );

  return (
    <div
      className={cn(
        " bg-white dark:bg-gray-900 rounded-xl border-2 border-gray-200 dark:border-gray-700 shadow-construction overflow-hidden",
        className,
      )}
    >
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
        <GanttViewToggle
          timeScale={timeScale}
          onTimeScaleChange={setTimeScale}
          isMobile={isMobile}
        />
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
            <p className="text-construction-blue font-bold">
              Updating task date...
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
