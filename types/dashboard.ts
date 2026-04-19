/**
 * Dashboard Types
 *
 * Type definitions for the GenHub dashboard data model.
 * Used by getDashboardData Server Action and dashboard UI components.
 */

/**
 * KPI metrics displayed in the dashboard header cards
 */
export interface DashboardKPIs {
  // Project metrics
  activeProjects: number;
  totalProjects: number;
  projectsTrend: number; // % change from last month

  // Task metrics
  tasksThisWeek: number;
  tasksDueToday: number;
  tasksOverdue: number;

  // Budget metrics
  budgetUtilization: number; // percentage (actual/planned * 100)
  totalPlannedBudget: number;
  totalActualSpend: number;

  // Schedule metrics
  scheduleOnTime: number;
  scheduleAtRisk: number;
  scheduleDelayed: number;

  // Expense metrics
  totalExpenses: number;
  totalExpenseAmount: number;
  pendingApprovals: number; // tasks needing approval

  // Team metrics
  teamSize: number;
  unassignedTasks: number;
}

/**
 * Project status distribution for ProjectStatusWidget
 */
export interface ProjectStatusData {
  active: number;
  onHold: number;
  completed: number;
  archived: number;
}

/**
 * Task progress metrics for TaskProgressWidget
 */
export interface TaskProgressData {
  total: number;
  completed: number;
  inProgress: number;
  todo: number;
  blocked: number;
  overdue: number;
  completionRate: number;
  velocityTrend: number; // % change in tasks/day
}

/**
 * Budget summary for BudgetSummaryWidget
 */
export interface BudgetSummaryData {
  totalPlanned: number;
  totalActual: number;
  variance: number; // positive = under budget
  utilizationPercent: number;
  totalExpenses: {
    count: number;
    amount: number;
  };
  expensesByCategory: Array<{
    category: string;
    amount: number;
  }>;
}

/**
 * Schedule health metrics for ScheduleHealthWidget
 */
export interface ScheduleHealthData {
  onTime: number;
  atRisk: number; // due within 3 days
  overdue: number;
  onTimePercent: number;
}

/**
 * Team activity data for TeamActivityWidget
 */
export interface TeamActivityData {
  totalMembers: number;
  topAssignees: Array<{
    id: string;
    name: string;
    avatarUrl: string | null;
    taskCount: number;
  }>;
  unassignedTasks: number;
}

/**
 * Materials procurement status for MaterialsStatusWidget
 */
export interface MaterialsStatusData {
  needed: number;
  ordered: number;
  delivered: number;
  total: number;
}

/**
 * Project data for quick action modals
 */
export interface QuickActionProject {
  id: string;
  name: string;
  project_phases?: Array<{
    id: string;
    name: string;
    order_index: number;
  }>;
}

/**
 * Team member data for quick action modals
 */
export interface QuickActionTeamMember {
  id: string;
  name: string;
  email: string;
  avatar_url: string | null;
}

/**
 * Data needed for quick action modals
 */
export interface QuickActionData {
  projects: QuickActionProject[];
  teamMembers: QuickActionTeamMember[];
  companyId: string;
}

/**
 * Complete dashboard data structure
 * Aggregated from multiple database tables for single-fetch efficiency
 */
export interface DashboardData {
  kpis: DashboardKPIs;
  projectStatus: ProjectStatusData;
  taskProgress: TaskProgressData;
  budgetSummary: BudgetSummaryData;
  scheduleHealth: ScheduleHealthData;
  teamActivity: TeamActivityData;
  materialsStatus: MaterialsStatusData;
  quickActionData: QuickActionData;
}

/**
 * Result type for getDashboardData Server Action
 */
export interface DashboardDataResult {
  data?: DashboardData;
  error?: string;
}
