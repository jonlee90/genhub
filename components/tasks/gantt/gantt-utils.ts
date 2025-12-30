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
} from 'date-fns';
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
} from './gantt-types';

/**
 * Calculate the date range for the Gantt chart based on tasks
 */
export function calculateDateRange(tasks: GanttTask[], padding: number = 30): DateRange {
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
    start: addDays(startOfDay(minDate), -padding),
    end: addDays(endOfDay(maxDate), padding),
  };
}

/**
 * Calculate task position on the timeline
 */
export function getTaskPosition(
  task: GanttTask,
  config: GanttConfig,
  rowIndex: number
): TaskPosition {
  const { viewStartDate, cellWidth, rowHeight, timeScale } = config;

  // Calculate days from start
  const daysFromStart = differenceInCalendarDays(task.startDate, viewStartDate);
  const taskDuration = differenceInCalendarDays(task.endDate, task.startDate);

  // Convert to pixels based on time scale
  let left: number;
  let width: number;

  if (timeScale === 'day') {
    left = daysFromStart * cellWidth;
    width = Math.max(taskDuration * cellWidth, cellWidth); // Minimum 1 cell
  } else if (timeScale === 'week') {
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
    case 'day':
      return startOfDay(date);
    case 'week':
      return startOfWeek(date, { weekStartsOn: 1 }); // Monday
    case 'month':
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
  timeScale: TimeScale
): number {
  const cells = pixels / cellWidth;

  switch (timeScale) {
    case 'day':
      return Math.round(cells); // Days
    case 'week':
      return Math.round(cells * 7); // Days
    case 'month':
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
  timeScaleConfig: typeof TIME_SCALE_CONFIGS[TimeScale]
): DateGroup[] {
  const { viewStartDate, viewEndDate, timeScale, cellWidth } = config;
  const groups: DateGroup[] = [];

  let currentDate = new Date(viewStartDate);
  let currentX = 0;

  if (timeScale === 'day' || timeScale === 'week') {
    // Group by months
    while (currentDate <= viewEndDate) {
      const monthStart = startOfMonth(currentDate);
      const monthEnd = endOfMonth(currentDate);

      const groupStart = monthStart < viewStartDate ? viewStartDate : monthStart;
      const groupEnd = monthEnd > viewEndDate ? viewEndDate : monthEnd;

      const daysInGroup = differenceInCalendarDays(groupEnd, groupStart) + 1;
      const width = timeScale === 'day' ? daysInGroup * cellWidth : (daysInGroup / 7) * cellWidth;

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
  timeScaleConfig: typeof TIME_SCALE_CONFIGS[TimeScale]
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
    if (timeScale === 'day') {
      currentDate = addDays(currentDate, 1);
    } else if (timeScale === 'week') {
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
  hoveredTaskId: string | null
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
  toY: number
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
  if (timeScale === 'day') {
    gridWidth = totalDays * cellWidth;
  } else if (timeScale === 'week') {
    gridWidth = Math.ceil(totalDays / 7) * cellWidth;
  } else {
    gridWidth = Math.ceil(totalDays / 30) * cellWidth;
  }

  return sidebarWidth + gridWidth;
}

/**
 * Get today's position on the timeline
 */
export function getTodayPosition(config: GanttConfig): number {
  const today = startOfDay(new Date());
  const daysFromStart = differenceInCalendarDays(today, config.viewStartDate);

  if (config.timeScale === 'day') {
    return daysFromStart * config.cellWidth;
  } else if (config.timeScale === 'week') {
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

/**
 * Transform tasks to include calculated dates
 */
export function transformTasksForGantt(tasks: any[]): GanttTask[] {
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
  if (tasks.length === 0) return 'week';

  const dateRange = calculateDateRange(tasks, 0);
  const daySpan = differenceInDays(dateRange.end, dateRange.start);

  if (daySpan <= 14) return 'day';
  if (daySpan <= 60) return 'week';
  return 'month';
}
