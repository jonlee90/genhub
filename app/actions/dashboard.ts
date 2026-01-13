'use server';

import { createClient } from '@/utils/supabase/server';
import { auth } from '@/lib/auth';
import type {
  DashboardData,
  DashboardDataResult,
  DashboardKPIs,
  ProjectStatusData,
  TaskProgressData,
  BudgetSummaryData,
  ScheduleHealthData,
  TeamActivityData,
  MaterialsStatusData,
  QuickActionData,
  QuickActionProject,
  QuickActionTeamMember,
} from '@/types/dashboard';

// ============================================
// Helper Functions
// ============================================

async function getUserContext() {
  const session = await auth();

  if (!session?.user?.id) {
    return { error: 'Not authenticated' };
  }

  const supabase = await createClient();

  const { data: companyUser, error: companyError } = await supabase
    .from('company_users')
    .select('company_id, role, status')
    .eq('user_id', session.user.id)
    .eq('status', 'active')
    .maybeSingle();

  if (companyError || !companyUser) {
    return { error: 'No active company found for user' };
  }

  return {
    userId: session.user.id,
    companyId: companyUser.company_id,
    role: companyUser.role,
    supabase,
  };
}

// ============================================
// Data Fetching Helpers
// ============================================

interface ProjectStats {
  total: number;
  active: number;
  onHold: number;
  completed: number;
  archived: number;
  totalBudget: number;
}

async function getProjectStats(
  supabase: Awaited<ReturnType<typeof createClient>>,
  companyId: string
): Promise<ProjectStats> {
  const { data: projects, error } = await supabase
    .from('projects')
    .select('id, status, budget')
    .eq('company_id', companyId);

  if (error || !projects) {
    console.error('[getProjectStats] Error:', error);
    return {
      total: 0,
      active: 0,
      onHold: 0,
      completed: 0,
      archived: 0,
      totalBudget: 0,
    };
  }

  return {
    total: projects.length,
    active: projects.filter((p) => p.status === 'active').length,
    onHold: projects.filter((p) => p.status === 'on_hold').length,
    completed: projects.filter((p) => p.status === 'completed').length,
    archived: projects.filter((p) => p.status === 'archived').length,
    totalBudget: projects.reduce((sum, p) => sum + (Number(p.budget) || 0), 0),
  };
}

interface TaskStats {
  total: number;
  completed: number;
  inProgress: number;
  todo: number;
  blocked: number;
  overdue: number;
  dueToday: number;
  dueThisWeek: number;
  onTime: number;
  atRisk: number;
  delayed: number;
  pendingApproval: number;
  unassigned: number;
  totalPlannedCost: number;
  totalActualCost: number;
  assigneeCounts: Map<string, { id: string; name: string; avatarUrl: string | null; count: number }>;
}

async function getTaskStats(
  supabase: Awaited<ReturnType<typeof createClient>>,
  companyId: string
): Promise<TaskStats> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayStr = today.toISOString().split('T')[0];

  // End of today
  const endOfToday = new Date(today);
  endOfToday.setHours(23, 59, 59, 999);

  // End of this week (Sunday)
  const endOfWeek = new Date(today);
  const daysUntilSunday = 7 - today.getDay();
  endOfWeek.setDate(today.getDate() + daysUntilSunday);
  endOfWeek.setHours(23, 59, 59, 999);
  const endOfWeekStr = endOfWeek.toISOString().split('T')[0];

  // 3 days from now (for at-risk calculation)
  const threeDaysFromNow = new Date(today);
  threeDaysFromNow.setDate(today.getDate() + 3);
  const threeDaysStr = threeDaysFromNow.toISOString().split('T')[0];

  // Fetch tasks with assignees (filter through project's company_id)
  // Use non-aliased join pattern for reliable PostgREST filtering
  const { data: tasks, error } = await supabase
    .from('tasks')
    .select(`
      id,
      status,
      due_date,
      planned_cost,
      actual_cost,
      approval_status,
      projects!inner (
        company_id
      ),
      task_assignees (
        user_id,
        user_profiles!task_assignees_user_id_fkey (
          id,
          name,
          avatar_url
        )
      )
    `)
    .eq('projects.company_id', companyId);

  if (error || !tasks) {
    console.error('[getTaskStats] Error:', error);
    return {
      total: 0,
      completed: 0,
      inProgress: 0,
      todo: 0,
      blocked: 0,
      overdue: 0,
      dueToday: 0,
      dueThisWeek: 0,
      onTime: 0,
      atRisk: 0,
      delayed: 0,
      pendingApproval: 0,
      unassigned: 0,
      totalPlannedCost: 0,
      totalActualCost: 0,
      assigneeCounts: new Map(),
    };
  }

  const assigneeCounts = new Map<string, { id: string; name: string; avatarUrl: string | null; count: number }>();

  let overdue = 0;
  let dueToday = 0;
  let dueThisWeek = 0;
  let onTime = 0;
  let atRisk = 0;
  let delayed = 0;
  let pendingApproval = 0;
  let unassigned = 0;

  for (const task of tasks) {
    // Count by due date
    if (task.due_date && task.status !== 'completed') {
      const dueDate = task.due_date;
      if (dueDate < todayStr) {
        overdue++;
        delayed++;
      } else if (dueDate === todayStr) {
        dueToday++;
        dueThisWeek++;
        onTime++;
      } else if (dueDate <= endOfWeekStr) {
        dueThisWeek++;
        if (dueDate <= threeDaysStr) {
          atRisk++;
        } else {
          onTime++;
        }
      } else {
        onTime++;
      }
    } else if (task.status !== 'completed') {
      // Tasks without due dates count as on-time
      onTime++;
    }

    // Pending approval
    if (task.approval_status === 'pending') {
      pendingApproval++;
    }

    // Count assignees
    const taskAssignees = task.task_assignees as Array<{
      user_id: string | null;
      user_profiles: { id: string; name: string | null; avatar_url: string | null } | null;
    }> | null;

    if (!taskAssignees || taskAssignees.length === 0) {
      unassigned++;
    } else {
      for (const assignee of taskAssignees) {
        if (assignee.user_id && assignee.user_profiles) {
          const existing = assigneeCounts.get(assignee.user_id);
          if (existing) {
            existing.count++;
          } else {
            assigneeCounts.set(assignee.user_id, {
              id: assignee.user_id,
              name: assignee.user_profiles.name || 'Unknown',
              avatarUrl: assignee.user_profiles.avatar_url,
              count: 1,
            });
          }
        }
      }
    }
  }

  return {
    total: tasks.length,
    completed: tasks.filter((t) => t.status === 'completed').length,
    inProgress: tasks.filter((t) => t.status === 'in_progress').length,
    todo: tasks.filter((t) => t.status === 'todo').length,
    blocked: tasks.filter((t) => t.status === 'blocked').length,
    overdue,
    dueToday,
    dueThisWeek,
    onTime,
    atRisk,
    delayed,
    pendingApproval,
    unassigned,
    totalPlannedCost: tasks.reduce((sum, t) => sum + (Number(t.planned_cost) || 0), 0),
    totalActualCost: tasks.reduce((sum, t) => sum + (Number(t.actual_cost) || 0), 0),
    assigneeCounts,
  };
}

interface ExpenseStats {
  pendingCount: number;
  pendingAmount: number;
  approvedAmount: number;
  byCategory: Array<{ category: string; amount: number }>;
}

async function getExpenseStats(
  supabase: Awaited<ReturnType<typeof createClient>>,
  companyId: string
): Promise<ExpenseStats> {
  const { data: expenses, error } = await supabase
    .from('expenses')
    .select('id, amount, status, category')
    .eq('company_id', companyId);

  if (error || !expenses) {
    console.error('[getExpenseStats] Error:', error);
    return {
      pendingCount: 0,
      pendingAmount: 0,
      approvedAmount: 0,
      byCategory: [],
    };
  }

  const categoryMap = new Map<string, number>();

  let pendingCount = 0;
  let pendingAmount = 0;
  let approvedAmount = 0;

  for (const expense of expenses) {
    const amount = Number(expense.amount) || 0;

    // Pending = submitted or under_review
    if (expense.status === 'submitted' || expense.status === 'under_review') {
      pendingCount++;
      pendingAmount += amount;
    } else if (expense.status === 'approved' || expense.status === 'paid') {
      approvedAmount += amount;
    }

    // Category aggregation
    const category = expense.category || 'other';
    categoryMap.set(category, (categoryMap.get(category) || 0) + amount);
  }

  // Convert to array sorted by amount
  const byCategory = Array.from(categoryMap.entries())
    .map(([category, amount]) => ({ category, amount }))
    .sort((a, b) => b.amount - a.amount);

  return {
    pendingCount,
    pendingAmount,
    approvedAmount,
    byCategory,
  };
}

interface MaterialStats {
  needed: number;
  ordered: number;
  delivered: number;
  total: number;
}

async function getMaterialStats(
  supabase: Awaited<ReturnType<typeof createClient>>,
  companyId: string
): Promise<MaterialStats> {
  // Filter through project's company_id since material_assignments doesn't have company_id
  // Use non-aliased join pattern (like chat-search.ts) for reliable PostgREST filtering
  const { data: materials, error } = await supabase
    .from('material_assignments')
    .select(`
      id,
      procurement_status,
      projects!inner (
        company_id
      )
    `)
    .eq('projects.company_id', companyId);

  if (error || !materials) {
    console.error('[getMaterialStats] Error:', error);
    return {
      needed: 0,
      ordered: 0,
      delivered: 0,
      total: 0,
    };
  }

  // Count by procurement status (includes installed in total but not as separate bucket)
  return {
    needed: materials.filter((m) => m.procurement_status === 'needed').length,
    ordered: materials.filter((m) => m.procurement_status === 'ordered').length,
    delivered: materials.filter((m) => m.procurement_status === 'delivered' || m.procurement_status === 'installed').length,
    total: materials.length,
  };
}

interface TeamStats {
  totalMembers: number;
}

async function getTeamStats(
  supabase: Awaited<ReturnType<typeof createClient>>,
  companyId: string
): Promise<TeamStats> {
  const { data: members, error } = await supabase
    .from('company_users')
    .select('id')
    .eq('company_id', companyId)
    .eq('status', 'active');

  if (error || !members) {
    console.error('[getTeamStats] Error:', error);
    return { totalMembers: 0 };
  }

  return { totalMembers: members.length };
}

// ============================================
// Quick Action Data Fetcher
// ============================================

async function getQuickActionData(
  supabase: Awaited<ReturnType<typeof createClient>>,
  companyId: string
): Promise<QuickActionData> {
  // Fetch projects with phases for task creation modal
  const { data: projects, error: projectsError } = await supabase
    .from('projects')
    .select(`
      id,
      name,
      project_phases (
        id,
        name,
        order_index
      )
    `)
    .eq('company_id', companyId)
    .in('status', ['planning', 'active'])
    .order('name');

  if (projectsError) {
    console.error('[getQuickActionData] Projects error:', projectsError);
  }

  // Fetch team members for task assignment
  const { data: teamData, error: teamError } = await supabase
    .from('company_users')
    .select(`
      user_id,
      user_profiles (
        id,
        name,
        email,
        avatar_url
      )
    `)
    .eq('company_id', companyId)
    .eq('status', 'active');

  if (teamError) {
    console.error('[getQuickActionData] Team error:', teamError);
  }

  // Transform projects data
  const formattedProjects: QuickActionProject[] = (projects || []).map((p) => ({
    id: p.id,
    name: p.name,
    project_phases: (p.project_phases || [])
      .sort((a: { order_index: number }, b: { order_index: number }) => a.order_index - b.order_index)
      .map((phase: { id: string; name: string; order_index: number }) => ({
        id: phase.id,
        name: phase.name,
        order_index: phase.order_index,
      })),
  }));

  // Transform team members data
  const formattedTeamMembers: QuickActionTeamMember[] = (teamData || [])
    .filter((t) => t.user_profiles)
    .map((t) => {
      const profile = t.user_profiles as { id: string; name: string | null; email: string | null; avatar_url: string | null };
      return {
        id: profile.id,
        name: profile.name || 'Unknown',
        email: profile.email || '',
        avatar_url: profile.avatar_url,
      };
    });

  return {
    projects: formattedProjects,
    teamMembers: formattedTeamMembers,
    companyId,
  };
}

// ============================================
// Optimized Helper Functions for Materialized View
// ============================================

/**
 * Get top assignees by task count (for team activity widget)
 */
async function getTopAssignees(
  supabase: Awaited<ReturnType<typeof createClient>>,
  companyId: string
): Promise<{ id: string; name: string; avatarUrl: string | null; taskCount: number }[]> {
  // Get task assignees with user profiles
  const { data: tasks, error } = await supabase
    .from('tasks')
    .select(`
      id,
      projects!inner (company_id),
      task_assignees (
        user_id,
        user_profiles!task_assignees_user_id_fkey (
          id,
          name,
          avatar_url
        )
      )
    `)
    .eq('projects.company_id', companyId);

  if (error || !tasks) {
    console.error('[getTopAssignees] Error:', error);
    return [];
  }

  const assigneeCounts = new Map<string, { id: string; name: string; avatarUrl: string | null; count: number }>();

  for (const task of tasks) {
    const taskAssignees = task.task_assignees as Array<{
      user_id: string | null;
      user_profiles: { id: string; name: string | null; avatar_url: string | null } | null;
    }> | null;

    if (taskAssignees) {
      for (const assignee of taskAssignees) {
        if (assignee.user_id && assignee.user_profiles) {
          const existing = assigneeCounts.get(assignee.user_id);
          if (existing) {
            existing.count++;
          } else {
            assigneeCounts.set(assignee.user_id, {
              id: assignee.user_id,
              name: assignee.user_profiles.name || 'Unknown',
              avatarUrl: assignee.user_profiles.avatar_url,
              count: 1,
            });
          }
        }
      }
    }
  }

  return Array.from(assigneeCounts.values())
    .sort((a, b) => b.count - a.count)
    .slice(0, 5)
    .map((a) => ({
      id: a.id,
      name: a.name,
      avatarUrl: a.avatarUrl,
      taskCount: a.count,
    }));
}

/**
 * Get expenses by category (for budget summary widget)
 */
async function getExpensesByCategory(
  supabase: Awaited<ReturnType<typeof createClient>>,
  companyId: string
): Promise<{ category: string; amount: number }[]> {
  const { data: expenses, error } = await supabase
    .from('expenses')
    .select('category, amount, projects!inner (company_id)')
    .eq('projects.company_id', companyId);

  if (error || !expenses) {
    console.error('[getExpensesByCategory] Error:', error);
    return [];
  }

  const categoryMap = new Map<string, number>();

  for (const expense of expenses) {
    const category = expense.category || 'other';
    const amount = Number(expense.amount) || 0;
    categoryMap.set(category, (categoryMap.get(category) || 0) + amount);
  }

  return Array.from(categoryMap.entries())
    .map(([category, amount]) => ({ category, amount }))
    .sort((a, b) => b.amount - a.amount);
}

// ============================================
// Main Dashboard Data Action
// ============================================

/**
 * Get aggregated dashboard data for the current user's company.
 * Uses parallel queries for optimal performance.
 *
 * @returns Dashboard data aggregated from multiple tables
 */
export async function getDashboardData(): Promise<DashboardDataResult> {
  console.log('[getDashboardData] Starting dashboard data fetch (optimized with mv_dashboard_kpis)...');

  // Get user context
  const userContext = await getUserContext();
  if ('error' in userContext) {
    console.error('[getDashboardData] User context error:', userContext.error);
    return { error: userContext.error };
  }

  const { companyId, supabase } = userContext;
  console.log('[getDashboardData] Fetching for company:', companyId);

  try {
    // Fetch pre-aggregated KPIs from materialized view (1 query instead of 6!)
    const { data: kpiData, error: kpiError } = await supabase
      .from('mv_dashboard_kpis')
      .select('*')
      .eq('company_id', companyId)
      .single();

    if (kpiError || !kpiData) {
      console.error('[getDashboardData] Error fetching KPIs from materialized view:', kpiError);
      // Fallback to original implementation if view doesn't have data yet
      return { error: 'Failed to load dashboard data. Please try refreshing.' };
    }

    // Fetch additional data that requires joins (top assignees, quick actions, expense categories)
    const [topAssignees, quickActionData, expensesByCategory] = await Promise.all([
      getTopAssignees(supabase, companyId),
      getQuickActionData(supabase, companyId),
      getExpensesByCategory(supabase, companyId),
    ]);

    console.log('[getDashboardData] Raw KPI data from view:', {
      projects: kpiData.total_projects,
      tasks: kpiData.total_tasks,
      pendingExpenses: kpiData.pending_expenses,
      materials: kpiData.total_materials,
      team: kpiData.team_size,
      quickActionProjects: quickActionData.projects.length,
    });

    // Calculate derived metrics
    const totalPlannedBudget = Number(kpiData.total_budget) || 0;
    const totalActualSpend = (Number(kpiData.total_actual_cost) || 0) + (Number(kpiData.approved_expense_amount) || 0);
    const budgetUtilization = totalPlannedBudget > 0
      ? Math.round((totalActualSpend / totalPlannedBudget) * 100)
      : 0;

    const completionRate = (kpiData.total_tasks ?? 0) > 0
      ? Math.round(((kpiData.completed_tasks ?? 0) / (kpiData.total_tasks ?? 0)) * 100)
      : 0;

    const totalScheduleTasks = (kpiData.on_time_tasks ?? 0) + (kpiData.at_risk_tasks ?? 0) + (kpiData.delayed_tasks ?? 0);
    const onTimePercent = totalScheduleTasks > 0
      ? Math.round(((kpiData.on_time_tasks ?? 0) / totalScheduleTasks) * 100)
      : 100;

    // Assemble dashboard data from materialized view
    const kpis: DashboardKPIs = {
      activeProjects: kpiData.active_projects ?? 0,
      totalProjects: kpiData.total_projects ?? 0,
      projectsTrend: 0, // TODO: Calculate from historical data

      tasksThisWeek: kpiData.due_this_week_tasks ?? 0,
      tasksDueToday: kpiData.due_today_tasks ?? 0,
      tasksOverdue: kpiData.overdue_tasks ?? 0,

      budgetUtilization,
      totalPlannedBudget,
      totalActualSpend,

      scheduleOnTime: kpiData.on_time_tasks ?? 0,
      scheduleAtRisk: kpiData.at_risk_tasks ?? 0,
      scheduleDelayed: kpiData.delayed_tasks ?? 0,

      pendingExpenses: kpiData.pending_expenses ?? 0,
      pendingExpenseAmount: Number(kpiData.pending_expense_amount) || 0,
      pendingApprovals: kpiData.pending_approval_tasks ?? 0,

      teamSize: kpiData.team_size ?? 0,
      unassignedTasks: kpiData.unassigned_tasks ?? 0,
    };

    const projectStatus: ProjectStatusData = {
      active: kpiData.active_projects ?? 0,
      onHold: kpiData.on_hold_projects ?? 0,
      completed: kpiData.completed_projects ?? 0,
      archived: kpiData.archived_projects ?? 0,
    };

    const taskProgress: TaskProgressData = {
      total: kpiData.total_tasks ?? 0,
      completed: kpiData.completed_tasks ?? 0,
      inProgress: kpiData.in_progress_tasks ?? 0,
      todo: kpiData.todo_tasks ?? 0,
      blocked: kpiData.blocked_tasks ?? 0,
      overdue: kpiData.overdue_tasks ?? 0,
      completionRate,
      velocityTrend: 0, // TODO: Calculate from historical data
    };

    const budgetSummary: BudgetSummaryData = {
      totalPlanned: totalPlannedBudget,
      totalActual: totalActualSpend,
      variance: totalPlannedBudget - totalActualSpend,
      utilizationPercent: budgetUtilization,
      pendingExpenses: {
        count: kpiData.pending_expenses ?? 0,
        amount: Number(kpiData.pending_expense_amount) || 0,
      },
      expensesByCategory,
    };

    const scheduleHealth: ScheduleHealthData = {
      onTime: kpiData.on_time_tasks ?? 0,
      atRisk: kpiData.at_risk_tasks ?? 0,
      overdue: kpiData.delayed_tasks ?? 0,
      onTimePercent,
    };

    const teamActivity: TeamActivityData = {
      totalMembers: kpiData.team_size ?? 0,
      topAssignees,
      unassignedTasks: kpiData.unassigned_tasks ?? 0,
    };

    const materialsStatus: MaterialsStatusData = {
      needed: kpiData.materials_needed ?? 0,
      ordered: kpiData.materials_ordered ?? 0,
      delivered: kpiData.materials_delivered ?? 0,
      total: kpiData.total_materials ?? 0,
    };

    const data: DashboardData = {
      kpis,
      projectStatus,
      taskProgress,
      budgetSummary,
      scheduleHealth,
      teamActivity,
      materialsStatus,
      quickActionData,
    };

    console.log('[getDashboardData] Successfully assembled dashboard data from materialized view');
    return { data };
  } catch (error) {
    console.error('[getDashboardData] Unexpected error:', error);
    return { error: 'An unexpected error occurred while fetching dashboard data' };
  }
}
