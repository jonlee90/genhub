import type { Database } from '@/types/database.types';

// Base types from database
type TaskRow = Database['public']['Tables']['tasks']['Row'];
type TaskDependencyRow = Database['public']['Tables']['task_dependencies']['Row'];

// Time scale options
export type TimeScale = 'day' | 'week' | 'month';

// Extended task with Gantt-specific fields
export interface GanttTask extends Omit<TaskRow, 'due_date'> {
  due_date: string | null;
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
  // Calculated fields for Gantt positioning
  startDate: Date;
  endDate: Date;
  durationDays: number;
}

// Task dependency with relationship info
export type TaskDependency = TaskDependencyRow;

// Configuration for Gantt chart rendering
export interface GanttConfig {
  timeScale: TimeScale;
  cellWidth: number;       // Pixels per time unit
  rowHeight: number;       // Height of each task row
  headerHeight: number;    // Height of time scale header
  sidebarWidth: number;    // Width of task info sidebar
  viewStartDate: Date;     // Visible range start
  viewEndDate: Date;       // Visible range end
  totalDays: number;       // Total days in view
}

// Time scale specific configuration
export interface TimeScaleConfig {
  cellWidth: number;
  headerFormat: string;
  groupFormat: string;
  snapUnit: 'day' | 'week' | 'month';
}

// Position data for a task bar
export interface TaskPosition {
  id: string;
  left: number;          // X position from start
  width: number;         // Bar width in pixels
  top: number;           // Y position
  rowIndex: number;      // Row number (for dependency lines)
}

// Dependency line coordinates
export interface DependencyLine {
  id: string;
  fromTaskId: string;
  toTaskId: string;
  fromX: number;
  fromY: number;
  toX: number;
  toY: number;
  isHighlighted: boolean;
}

// Date range for view bounds
export interface DateRange {
  start: Date;
  end: Date;
}

// Drag state for task bars
export interface DragState {
  taskId: string;
  originalDate: Date;
  currentOffset: number;  // Pixels dragged
  snappedDate: Date;
}

// Props for GanttChart component
export interface GanttChartProps {
  tasks: GanttTask[];
  dependencies: TaskDependency[];
  onTaskClick: (task: GanttTask) => void;
  onTaskDateChange: (taskId: string, newStartDate: string, newDueDate: string) => Promise<void>;
  className?: string;
}

// Props for GanttTaskBar component
export interface GanttTaskBarProps {
  task: GanttTask;
  position: TaskPosition;
  config: GanttConfig;
  isDragging?: boolean;
  isHovered?: boolean;
  onHover?: (taskId: string | null) => void;
  onClick?: (task: GanttTask) => void;
  isMobile?: boolean;
}

// Props for GanttHeader component
export interface GanttHeaderProps {
  config: GanttConfig;
  sortedTasksLength: number;
  dateGroups: DateGroup[];
  dateCells: DateCell[];
}

// Date grouping for header (months/weeks)
export interface DateGroup {
  label: string;
  startX: number;
  width: number;
}

// Individual date cell in header
export interface DateCell {
  date: Date;
  label: string;
  x: number;
  width: number;
  isToday: boolean;
  isWeekend: boolean;
}

// Props for dependency lines
export interface GanttDependencyLinesProps {
  lines: DependencyLine[];
  hoveredTaskId: string | null;
}

// Time scale configurations (Desktop)
export const TIME_SCALE_CONFIGS: Record<TimeScale, TimeScaleConfig> = {
  day: {
    cellWidth: 40,
    headerFormat: 'EEE d',    // "Mon 15"
    groupFormat: 'MMMM yyyy', // "January 2025"
    snapUnit: 'day',
  },
  week: {
    cellWidth: 120,
    headerFormat: 'MMM d',    // "Jan 15"
    groupFormat: 'MMMM yyyy',
    snapUnit: 'week',
  },
  month: {
    cellWidth: 160,
    headerFormat: 'MMMM',     // "January"
    groupFormat: 'yyyy',
    snapUnit: 'month',
  },
};

// Mobile time scale configurations
export const MOBILE_TIME_SCALE_CONFIGS: Record<TimeScale, TimeScaleConfig> = {
  day: {
    cellWidth: 28,
    headerFormat: 'dd',       // "15"
    groupFormat: 'MMM yy',    // "Jan 25"
    snapUnit: 'day',
  },
  week: {
    cellWidth: 80,
    headerFormat: 'M/d',      // "1/15"
    groupFormat: 'MMM yy',    // "Jan 25"
    snapUnit: 'week',
  },
  month: {
    cellWidth: 100,
    headerFormat: 'MMM',      // "Jan"
    groupFormat: 'yyyy',
    snapUnit: 'month',
  },
};

// Default Gantt configuration (Desktop)
export const DEFAULT_GANTT_CONFIG: Omit<GanttConfig, 'viewStartDate' | 'viewEndDate' | 'totalDays'> = {
  timeScale: 'week',
  cellWidth: 120,
  rowHeight: 48,
  headerHeight: 64,
  sidebarWidth: 280,
};

// Mobile-optimized Gantt configuration
export const MOBILE_GANTT_CONFIG: Omit<GanttConfig, 'viewStartDate' | 'viewEndDate' | 'totalDays'> = {
  timeScale: 'week',
  cellWidth: 80,
  rowHeight: 44,
  headerHeight: 48,
  sidebarWidth: 140,
};

// Tablet-optimized Gantt configuration
export const TABLET_GANTT_CONFIG: Omit<GanttConfig, 'viewStartDate' | 'viewEndDate' | 'totalDays'> = {
  timeScale: 'week',
  cellWidth: 100,
  rowHeight: 46,
  headerHeight: 56,
  sidebarWidth: 200,
};

// Priority colors - uniform construction-themed background with priority-based borders
export const PRIORITY_COLORS = {
  low: {
    bg: 'bg-gradient-to-r from-construction-blue to-blue-700',
    border: 'border-emerald-700',
    text: 'text-white',
  },
  medium: {
    bg: 'bg-gradient-to-r from-construction-blue to-blue-700',
    border: 'border-amber-600',
    text: 'text-white',
  },
  high: {
    bg: 'bg-gradient-to-r from-construction-blue to-blue-700',
    border: 'border-red-700',
    text: 'text-white',
  },
  critical: {
    bg: 'bg-gradient-to-r from-construction-blue to-blue-700',
    border: 'border-red-800',
    text: 'text-white',
  },
};

// Status styles for task bars
export const STATUS_STYLES = {
  todo: '',
  in_progress: '',
  review: 'ring-2 ring-amber-400 ring-offset-1',
  blocked: 'border-dashed opacity-75',
  completed: 'opacity-50',
};
