import {
  addDays,
  addWeeks,
  addMonths,
  startOfDay,
  startOfWeek,
  startOfMonth,
  endOfDay,
  endOfWeek,
  endOfMonth,
  differenceInDays,
  differenceInCalendarDays,
  min,
  max,
  format,
  isWeekend,
  isSameDay,
} from "date-fns";
import type {
  GanttTask,
  GanttConfig,
  TaskPosition,
  DependencyLine,
  TaskDependency,
  TimeScale,
  DateRange,
  DateGroup,
  DateCell,
  TIME_SCALE_CONFIGS,
  PhaseGroup,
  PhasePosition,
  GanttRow,
} from "./gantt-types";

/**
 * Calculate the date range for the Gantt chart based on tasks
 */
export function calculateDateRange(
  tasks: GanttTask[],
  padding: number = 10,
): DateRange {
  if (tasks.length === 0) {
    const today = new Date();
    return {
      start: addDays(today, -padding),
      end: addDays(today, padding * 2),
    };
  }

  const dates = tasks.flatMap((task) => [task.startDate, task.endDate]);
  const minDate = min(dates);
  const maxDate = max(dates);

  return {
    start: addDays(startOfDay(minDate), -padding / 2),
    end: addDays(endOfDay(maxDate), padding),
  };
}

/**
 * Calculate task position on the timeline
 */
export function getTaskPosition(
  task: GanttTask,
  config: GanttConfig,
  rowIndex: number,
): TaskPosition {
  const { viewStartDate, cellWidth, rowHeight, timeScale } = config;

  // Calculate days from start
  const daysFromStart = differenceInCalendarDays(task.startDate, viewStartDate);
  const taskDuration = differenceInCalendarDays(task.endDate, task.startDate);

  // Convert to pixels based on time scale
  let left: number;
  let width: number;

  if (timeScale === "day") {
    left = daysFromStart * cellWidth;
    width = Math.max(taskDuration * cellWidth, cellWidth); // Minimum 1 cell
  } else if (timeScale === "week") {
    left = (daysFromStart / 7) * cellWidth;
    width = Math.max((taskDuration / 7) * cellWidth, cellWidth / 2);
  } else {
    // month
    left = (daysFromStart / 30) * cellWidth;
    width = Math.max((taskDuration / 30) * cellWidth, cellWidth / 2);
  }

  return {
    id: task.id,
    left: Math.round(left),
    width: Math.round(width),
    top: rowIndex * rowHeight,
    rowIndex,
  };
}

/**
 * Snap date to grid based on time scale
 */
export function snapToDate(date: Date, timeScale: TimeScale): Date {
  switch (timeScale) {
    case "day":
      return startOfDay(date);
    case "week":
      return startOfWeek(date, { weekStartsOn: 1 }); // Monday
    case "month":
      return startOfMonth(date);
    default:
      return startOfDay(date);
  }
}

/**
 * Convert pixel offset to date offset
 */
export function pixelsToDateOffset(
  pixels: number,
  cellWidth: number,
  timeScale: TimeScale,
): number {
  const cells = pixels / cellWidth;

  switch (timeScale) {
    case "day":
      return Math.round(cells); // Days
    case "week":
      return Math.round(cells * 7); // Days
    case "month":
      return Math.round(cells * 30); // Days
    default:
      return Math.round(cells);
  }
}

/**
 * Generate date groups for header (months/weeks)
 */
export function generateDateGroups(
  config: GanttConfig,
  timeScaleConfig: (typeof TIME_SCALE_CONFIGS)[TimeScale],
): DateGroup[] {
  const { viewStartDate, viewEndDate, timeScale, cellWidth } = config;
  const groups: DateGroup[] = [];

  let currentDate = new Date(viewStartDate);
  let currentX = 0;

  if (timeScale === "day" || timeScale === "week") {
    // Group by months
    while (currentDate <= viewEndDate) {
      const monthStart = startOfMonth(currentDate);
      const monthEnd = endOfMonth(currentDate);

      const groupStart =
        monthStart < viewStartDate ? viewStartDate : monthStart;
      const groupEnd = monthEnd > viewEndDate ? viewEndDate : monthEnd;

      const daysInGroup = differenceInCalendarDays(groupEnd, groupStart) + 1;
      const width =
        timeScale === "day"
          ? daysInGroup * cellWidth
          : (daysInGroup / 7) * cellWidth;

      groups.push({
        label: format(currentDate, timeScaleConfig.groupFormat),
        startX: currentX,
        width: Math.round(width),
      });

      currentX += width;
      currentDate = addMonths(currentDate, 1);
    }
  } else {
    // Group by years for month view
    while (currentDate <= viewEndDate) {
      const yearStart = new Date(currentDate.getFullYear(), 0, 1);
      const yearEnd = new Date(currentDate.getFullYear(), 11, 31);

      const groupStart = yearStart < viewStartDate ? viewStartDate : yearStart;
      const groupEnd = yearEnd > viewEndDate ? viewEndDate : yearEnd;

      const daysInGroup = differenceInCalendarDays(groupEnd, groupStart) + 1;
      const width = (daysInGroup / 30) * cellWidth;

      groups.push({
        label: format(currentDate, timeScaleConfig.groupFormat),
        startX: currentX,
        width: Math.round(width),
      });

      currentX += width;
      currentDate = addMonths(currentDate, 12);
    }
  }

  return groups;
}

/**
 * Generate date cells for header
 */
export function generateDateCells(
  config: GanttConfig,
  timeScaleConfig: (typeof TIME_SCALE_CONFIGS)[TimeScale],
): DateCell[] {
  const { viewStartDate, viewEndDate, timeScale, cellWidth } = config;
  const cells: DateCell[] = [];
  const today = startOfDay(new Date());

  let currentDate = new Date(viewStartDate);
  let currentX = 0;

  while (currentDate <= viewEndDate) {
    cells.push({
      date: new Date(currentDate),
      label: format(currentDate, timeScaleConfig.headerFormat),
      x: currentX,
      width: cellWidth,
      isToday: isSameDay(currentDate, today),
      isWeekend: isWeekend(currentDate),
    });

    currentX += cellWidth;

    // Increment based on time scale
    if (timeScale === "day") {
      currentDate = addDays(currentDate, 1);
    } else if (timeScale === "week") {
      currentDate = addWeeks(currentDate, 1);
    } else {
      currentDate = addMonths(currentDate, 1);
    }
  }

  return cells;
}

/**
 * Calculate dependency line coordinates
 */
export function calculateDependencyLines(
  dependencies: TaskDependency[],
  taskPositions: Map<string, TaskPosition>,
  hoveredTaskId: string | null,
): DependencyLine[] {
  const lines: DependencyLine[] = [];

  for (const dep of dependencies) {
    const fromPos = taskPositions.get(dep.depends_on_task_id);
    const toPos = taskPositions.get(dep.task_id);

    if (!fromPos || !toPos) continue;

    // Arrow from end of predecessor to start of successor
    const fromX = fromPos.left + fromPos.width;
    const fromY = fromPos.top + 24; // Center of row

    const toX = toPos.left;
    const toY = toPos.top + 24;

    const isHighlighted =
      hoveredTaskId === dep.task_id || hoveredTaskId === dep.depends_on_task_id;

    lines.push({
      id: dep.id,
      fromTaskId: dep.depends_on_task_id,
      toTaskId: dep.task_id,
      fromX,
      fromY,
      toX,
      toY,
      isHighlighted,
    });
  }

  return lines;
}

/**
 * Create SVG path for dependency line with bezier curve
 */
export function createDependencyPath(
  fromX: number,
  fromY: number,
  toX: number,
  toY: number,
): string {
  const midX = (fromX + toX) / 2;

  // S-curve for smooth flow
  return `M ${fromX} ${fromY} C ${midX} ${fromY}, ${midX} ${toY}, ${toX} ${toY}`;
}

/**
 * Calculate total width of Gantt chart
 */
export function calculateTotalWidth(config: GanttConfig): number {
  const { totalDays, cellWidth, timeScale, sidebarWidth } = config;

  let gridWidth: number;
  if (timeScale === "day") {
    gridWidth = totalDays * cellWidth;
  } else if (timeScale === "week") {
    gridWidth = Math.ceil(totalDays / 7) * cellWidth;
  } else {
    gridWidth = Math.ceil(totalDays / 30) * cellWidth;
  }

  return sidebarWidth + gridWidth;
}

/**
 * Get today"s position on the timeline
 */
export function getTodayPosition(config: GanttConfig): number {
  const today = startOfDay(new Date());
  const daysFromStart = differenceInCalendarDays(today, config.viewStartDate);

  if (config.timeScale === "day") {
    return daysFromStart * config.cellWidth;
  } else if (config.timeScale === "week") {
    return (daysFromStart / 7) * config.cellWidth;
  } else {
    return (daysFromStart / 30) * config.cellWidth;
  }
}

/**
 * Check if a date is within the visible range
 */
export function isDateInView(date: Date, config: GanttConfig): boolean {
  return date >= config.viewStartDate && date <= config.viewEndDate;
}

// Input task type for transformation - from database with relations
interface TaskInput {
  id: string;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  due_date: string | null;
  start_date: string | null;
  created_at: string;
  updated_at: string;
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
  [key: string]: unknown; // Allow additional properties from database row
}

/**
 * Transform tasks to include calculated dates
 */
export function transformTasksForGantt(tasks: TaskInput[]): GanttTask[] {
  return tasks.map((task) => {
    // Use due_date if available, otherwise use created_at + 7 days
    const endDate = task.due_date
      ? startOfDay(new Date(task.due_date))
      : addDays(startOfDay(new Date(task.created_at)), 7);

    // Use start_date if available, otherwise use created_at or estimate 7 days before end
    const startDate = task.start_date
      ? startOfDay(new Date(task.start_date))
      : task.created_at
        ? startOfDay(new Date(task.created_at))
        : addDays(endDate, -7);

    const durationDays = differenceInCalendarDays(endDate, startDate);

    return {
      ...task,
      startDate,
      endDate,
      durationDays,
    } as GanttTask;
  });
}

/**
 * Get optimal time scale based on task date range
 */
export function getOptimalTimeScale(tasks: GanttTask[]): TimeScale {
  if (tasks.length === 0) return "week";

  const dateRange = calculateDateRange(tasks, 0);
  const daySpan = differenceInDays(dateRange.end, dateRange.start);

  if (daySpan <= 14) return "day";
  if (daySpan <= 60) return "week";
  return "month";
}

/**
 * Group tasks by phase and compute summary information
 */
export function groupTasksByPhase(
  sortedTasks: GanttTask[],
  collapsedPhaseIds: Set<string>,
): PhaseGroup[] {
  // Group tasks by phase ID
  const phaseMap = new Map<string, GanttTask[]>();

  for (const task of sortedTasks) {
    const phaseId = task.phase?.id || "__unphased__";
    const existing = phaseMap.get(phaseId);
    if (existing) {
      existing.push(task);
    } else {
      phaseMap.set(phaseId, [task]);
    }
  }

  // Convert to PhaseGroup array
  const phaseGroups: PhaseGroup[] = [];

  phaseMap.forEach((tasks, phaseId) => {
    const firstTask = tasks[0];
    const isUnphased = phaseId === "__unphased__";

    // Compute summary dates
    const taskStartDates = tasks.map((t) => t.startDate);
    const taskEndDates = tasks.map((t) => t.endDate);
    const summaryStartDate = min(taskStartDates);
    const summaryEndDate = max(taskEndDates);

    // Check if all tasks are completed
    const allCompleted = tasks.every((t) => t.status === "completed");

    // Collapse state is controlled by collapsedPhaseIds Set
    const isCollapsed = collapsedPhaseIds.has(phaseId);

    phaseGroups.push({
      id: phaseId,
      name: isUnphased
        ? "Other Tasks"
        : firstTask.phase?.name || "Unknown Phase",
      iconName: isUnphased ? null : firstTask.phase?.icon_name || null,
      orderIndex: isUnphased ? 999 : (firstTask.phase?.order_index ?? 999),
      tasks,
      isCollapsed,
      allCompleted,
      summaryStartDate,
      summaryEndDate,
    });
  });

  // Sort by orderIndex, unphased at end
  return phaseGroups.sort((a, b) => a.orderIndex - b.orderIndex);
}

/**
 * Build flat list of GanttRow items from phase groups
 */
export function buildGanttRows(phaseGroups: PhaseGroup[]): GanttRow[] {
  const rows: GanttRow[] = [];
  let currentRowIndex = 0;

  for (const phaseGroup of phaseGroups) {
    // Add phase header row
    rows.push({
      type: "phase",
      phaseGroup,
      rowIndex: currentRowIndex,
    });
    currentRowIndex++;

    // Add task rows if not collapsed
    if (!phaseGroup.isCollapsed) {
      phaseGroup.tasks.forEach((task, taskIndex) => {
        const isFirstInPhase = taskIndex === 0;
        const isLastInPhase = taskIndex === phaseGroup.tasks.length - 1;
        rows.push({
          type: "task",
          task,
          rowIndex: currentRowIndex,
          isFirstInPhase,
          isLastInPhase,
        });
        currentRowIndex++;
      });
    }
  }

  return rows;
}

/**
 * Calculate phase position on the timeline
 */
export function getPhasePosition(
  phaseGroup: PhaseGroup,
  config: GanttConfig,
  rowIndex: number,
): PhasePosition {
  const { viewStartDate, cellWidth, rowHeight, timeScale } = config;

  // Calculate days from start
  const daysFromStart = differenceInCalendarDays(
    phaseGroup.summaryStartDate,
    viewStartDate,
  );
  const phaseDuration = differenceInCalendarDays(
    phaseGroup.summaryEndDate,
    phaseGroup.summaryStartDate,
  );

  // Convert to pixels based on time scale
  let left: number;
  let width: number;

  if (timeScale === "day") {
    left = daysFromStart * cellWidth;
    width = Math.max(phaseDuration * cellWidth, cellWidth);
  } else if (timeScale === "week") {
    left = (daysFromStart / 7) * cellWidth;
    width = Math.max((phaseDuration / 7) * cellWidth, cellWidth / 2);
  } else {
    // month
    left = (daysFromStart / 30) * cellWidth;
    width = Math.max((phaseDuration / 30) * cellWidth, cellWidth / 2);
  }

  return {
    phaseId: phaseGroup.id,
    left: Math.round(left),
    width: Math.round(width),
    top: rowIndex * rowHeight,
    rowIndex,
  };
}
