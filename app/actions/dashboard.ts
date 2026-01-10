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
// Main Dashboard Data Action
// ============================================

/**
 * Get aggregated dashboard data for the current user's company.
 * Uses parallel queries for optimal performance.
 *
 * @returns Dashboard data aggregated from multiple tables
 */
export async function getDashboardData(): Promise<DashboardDataResult> {
  console.log('[getDashboardData] Starting dashboard data fetch...');

  // Get user context
  const userContext = await getUserContext();
  if ('error' in userContext) {
    console.error('[getDashboardData] User context error:', userContext.error);
    return { error: userContext.error };
  }

  const { companyId, supabase } = userContext;
  console.log('[getDashboardData] Fetching for company:', companyId);

  try {
    // Fetch all data in parallel
    const [projectStats, taskStats, expenseStats, materialStats, teamStats, quickActionData] = await Promise.all([
      getProjectStats(supabase, companyId),
      getTaskStats(supabase, companyId),
      getExpenseStats(supabase, companyId),
      getMaterialStats(supabase, companyId),
      getTeamStats(supabase, companyId),
      getQuickActionData(supabase, companyId),
    ]);

    console.log('[getDashboardData] Raw stats:', {
      projects: projectStats.total,
      tasks: taskStats.total,
      pendingExpenses: expenseStats.pendingCount,
      materials: materialStats.total,
      team: teamStats.totalMembers,
      quickActionProjects: quickActionData.projects.length,
    });

    // Calculate derived metrics
    const totalPlannedBudget = projectStats.totalBudget;
    const totalActualSpend = taskStats.totalActualCost + expenseStats.approvedAmount;
    const budgetUtilization = totalPlannedBudget > 0
      ? Math.round((totalActualSpend / totalPlannedBudget) * 100)
      : 0;

    const completionRate = taskStats.total > 0
      ? Math.round((taskStats.completed / taskStats.total) * 100)
      : 0;

    const totalScheduleTasks = taskStats.onTime + taskStats.atRisk + taskStats.delayed;
    const onTimePercent = totalScheduleTasks > 0
      ? Math.round((taskStats.onTime / totalScheduleTasks) * 100)
      : 100;

    // Get top 5 assignees
    const topAssignees = Array.from(taskStats.assigneeCounts.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, 5)
      .map((a) => ({
        id: a.id,
        name: a.name,
        avatarUrl: a.avatarUrl,
        taskCount: a.count,
      }));

    // Assemble dashboard data
    const kpis: DashboardKPIs = {
      activeProjects: projectStats.active,
      totalProjects: projectStats.total,
      projectsTrend: 0, // TODO: Calculate from historical data

      tasksThisWeek: taskStats.dueThisWeek,
      tasksDueToday: taskStats.dueToday,
      tasksOverdue: taskStats.overdue,

      budgetUtilization,
      totalPlannedBudget,
      totalActualSpend,

      scheduleOnTime: taskStats.onTime,
      scheduleAtRisk: taskStats.atRisk,
      scheduleDelayed: taskStats.delayed,

      pendingExpenses: expenseStats.pendingCount,
      pendingExpenseAmount: expenseStats.pendingAmount,
      pendingApprovals: taskStats.pendingApproval,

      teamSize: teamStats.totalMembers,
      unassignedTasks: taskStats.unassigned,
    };

    const projectStatus: ProjectStatusData = {
      active: projectStats.active,
      onHold: projectStats.onHold,
      completed: projectStats.completed,
      archived: projectStats.archived,
    };

    const taskProgress: TaskProgressData = {
      total: taskStats.total,
      completed: taskStats.completed,
      inProgress: taskStats.inProgress,
      todo: taskStats.todo,
      blocked: taskStats.blocked,
      overdue: taskStats.overdue,
      completionRate,
      velocityTrend: 0, // TODO: Calculate from historical data
    };

    const budgetSummary: BudgetSummaryData = {
      totalPlanned: totalPlannedBudget,
      totalActual: totalActualSpend,
      variance: totalPlannedBudget - totalActualSpend,
      utilizationPercent: budgetUtilization,
      pendingExpenses: {
        count: expenseStats.pendingCount,
        amount: expenseStats.pendingAmount,
      },
      expensesByCategory: expenseStats.byCategory,
    };

    const scheduleHealth: ScheduleHealthData = {
      onTime: taskStats.onTime,
      atRisk: taskStats.atRisk,
      overdue: taskStats.delayed,
      onTimePercent,
    };

    const teamActivity: TeamActivityData = {
      totalMembers: teamStats.totalMembers,
      topAssignees,
      unassignedTasks: taskStats.unassigned,
    };

    const materialsStatus: MaterialsStatusData = {
      needed: materialStats.needed,
      ordered: materialStats.ordered,
      delivered: materialStats.delivered,
      total: materialStats.total,
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

    console.log('[getDashboardData] Successfully assembled dashboard data');
    return { data };
  } catch (error) {
    console.error('[getDashboardData] Unexpected error:', error);
    return { error: 'An unexpected error occurred while fetching dashboard data' };
  }
}
