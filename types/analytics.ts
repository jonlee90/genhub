/**
 * Task Analytics Types
 * Defines the structure for task-related analytics and metrics
 */

/**
 * Task completion metrics
 */
export interface CompletionMetrics {
  total: number;
  completed: number;
  rate: number; // Percentage (0-100)
}

/**
 * Task schedule metrics
 */
export interface ScheduleMetrics {
  overdue: number;
  atRisk: number;
  onTime: number;
}

/**
 * Budget metrics for tasks
 */
export interface BudgetMetrics {
  planned: number;
  actual: number;
  variance: number;
  utilization: number; // Percentage (0-100)
}

/**
 * Blocked tasks metrics
 */
export interface BlockedMetrics {
  count: number;
  rate: number; // Percentage (0-100)
  topReasons: string[];
}

/**
 * Assignee information for workload analysis
 */
export interface AssigneeWorkload {
  id: string;
  name: string;
  avatar_url: string | null;
  count: number;
}

/**
 * Workload distribution metrics
 */
export interface WorkloadMetrics {
  unassigned: number;
  topAssignees: AssigneeWorkload[];
}

/**
 * Material tracking metrics
 */
export interface MaterialMetrics {
  needed: number;
  ordered: number;
  delivered: number;
}

/**
 * Priority distribution metrics
 */
export interface PriorityMetrics {
  high: number;
  medium: number;
  low: number;
}

/**
 * Expense tracking metrics
 */
export interface ExpenseMetrics {
  pending: number;
  pendingAmount: number;
  approved: number;
  approvedAmount: number;
}

/**
 * Task dependency metrics
 */
export interface DependencyMetrics {
  blockedByDeps: number;
  ready: number;
}

/**
 * Team velocity metrics
 */
export interface VelocityMetrics {
  tasksPerDay: number;
  trend: number; // Positive/negative trend indicator
}

/**
 * Complete task analytics data structure
 */
export interface TaskAnalytics {
  completion: CompletionMetrics;
  schedule: ScheduleMetrics;
  budget: BudgetMetrics;
  blocked: BlockedMetrics;
  workload: WorkloadMetrics;
  materials: MaterialMetrics;
  priority: PriorityMetrics;
  expenses: ExpenseMetrics;
  dependencies: DependencyMetrics;
  velocity: VelocityMetrics;
}
