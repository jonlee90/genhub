// Task Analytics Types
// TypeScript interfaces for task analytics data structures
// Created: 2026-01-03

/**
 * Analytics data structure returned by getTaskAnalytics() server action
 * Aggregates 10 key metrics for task management:
 * 1. Completion Performance
 * 2. Schedule Adherence
 * 3. Budget Performance
 * 4. Blocked Tasks
 * 5. Workload Distribution
 * 6. Materials Status
 * 7. Priority Distribution
 * 8. Expenses
 * 9. Dependencies
 * 10. Velocity
 */
export interface TaskAnalytics {
  /** Task completion metrics */
  completion: {
    /** Total number of filtered tasks */
    total: number;
    /** Tasks with status='completed' */
    completed: number;
    /** Completion percentage: (completed / total) * 100 */
    rate: number;
  };

  /** Schedule adherence metrics */
  schedule: {
    /** Tasks past due date and not completed */
    overdue: number;
    /** Tasks due within 3 days and status IN ('todo', 'in_progress') */
    atRisk: number;
    /** Tasks on schedule: total - overdue - atRisk */
    onTime: number;
  };

  /** Budget tracking metrics */
  budget: {
    /** Sum of planned_cost for all tasks */
    planned: number;
    /** Sum of actual_cost for all tasks */
    actual: number;
    /** Budget variance: planned - actual */
    variance: number;
    /** Budget utilization percentage: (actual / planned) * 100 */
    utilization: number;
  };

  /** Blocked task metrics */
  blocked: {
    /** Number of tasks with status='blocked' */
    count: number;
    /** Blocked percentage: (blocked / total) * 100 */
    rate: number;
    /** Top 3 blocker reasons by frequency */
    topReasons: string[];
  };

  /** Workload distribution metrics */
  workload: {
    /** Tasks with assignee_id IS NULL */
    unassigned: number;
    /** Top 3 assignees by task count */
    topAssignees: Array<{
      /** User UUID */
      id: string;
      /** User display name */
      name: string;
      /** User avatar URL */
      avatar_url: string | null;
      /** Number of tasks assigned */
      count: number;
    }>;
  };

  /** Material procurement metrics */
  materials: {
    /** Materials with procurement_status='needed' */
    needed: number;
    /** Materials with procurement_status='ordered' */
    ordered: number;
    /** Materials with procurement_status='delivered' */
    delivered: number;
  };

  /** Priority distribution metrics */
  priority: {
    /** Tasks with priority='high' or 'critical' */
    high: number;
    /** Tasks with priority='medium' */
    medium: number;
    /** Tasks with priority='low' */
    low: number;
  };

  /** Expense tracking metrics */
  expenses: {
    /** Expenses with status IN ('submitted', 'under_review') */
    pending: number;
    /** Total amount of pending expenses */
    pendingAmount: number;
    /** Expenses with status='approved' */
    approved: number;
    /** Total amount of approved expenses */
    approvedAmount: number;
  };

  /** Task dependency metrics */
  dependencies: {
    /** Tasks blocked by incomplete dependencies */
    blockedByDeps: number;
    /** Tasks ready to start: total - blockedByDeps */
    ready: number;
  };

  /** Velocity metrics (task completion rate) */
  velocity: {
    /** Average tasks completed per day (last 7 days) */
    tasksPerDay: number;
    /** Percentage change vs previous 7 days */
    trend: number;
  };
}

/**
 * Props for TaskAnalyticsSection component
 */
export interface TaskAnalyticsSectionProps {
  /** Analytics data to display */
  analytics: TaskAnalytics;
  /** Current project filter: 'all' or project UUID */
  projectFilter: string;
  /** Callback for filter changes (click-to-filter functionality) */
  onFilterChange: (filter: {
    /** Filter by task status */
    status?: string;
    /** Filter by assignee UUID or 'unassigned' */
    assignee?: string;
    /** Filter by priority level */
    priority?: string;
    /** Filter by material procurement status */
    materialStatus?: string;
  }) => void;
}
