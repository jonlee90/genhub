"use server";

import { createClient } from "@/utils/supabase/server";
import { auth } from "@/lib/auth";
import { revalidateTag } from "next/cache";
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
} from "@/types/dashboard";

// ============================================
// Helper Functions
// ============================================

async function getUserContext(
  supabaseClient?: Awaited<ReturnType<typeof createClient>>,
) {
  const session = await auth();

  if (!session?.user?.id) {
    return { error: "Not authenticated" };
  }

  const supabase = supabaseClient ?? (await createClient());

  const { data: companyUser, error: companyError } = await supabase
    .from("company_users")
    .select("company_id, role, status")
    .eq("user_id", session.user.id)
    .eq("status", "active")
    .maybeSingle();

  if (companyError || !companyUser) {
    return { error: "No active company found for user" };
  }

  return {
    userId: session.user.id,
    companyId: companyUser.company_id,
    role: companyUser.role,
    supabase,
  };
}

// ============================================
// Quick Action Data Fetcher
// ============================================

async function getQuickActionData(
  supabase: Awaited<ReturnType<typeof createClient>>,
  companyId: string,
): Promise<QuickActionData> {
  // Fetch projects with phases and team members in parallel
  const [projectsResult, teamResult] = await Promise.all([
    supabase
      .from("projects")
      .select(
        `
        id,
        name,
        project_phases (
          id,
          name,
          order_index
        )
      `,
      )
      .eq("company_id", companyId)
      .in("status", ["planning", "active"])
      .order("name"),
    supabase
      .from("company_users")
      .select(
        `
        user_id,
        user_profiles (
          id,
          name,
          email,
          avatar_url
        )
      `,
      )
      .eq("company_id", companyId)
      .eq("status", "active"),
  ]);

  const { data: projects, error: projectsError } = projectsResult;
  const { data: teamData, error: teamError } = teamResult;

  if (projectsError) {
    console.error("[getQuickActionData] Projects error:", projectsError);
  }

  if (teamError) {
    console.error("[getQuickActionData] Team error:", teamError);
  }

  // Transform projects data
  const formattedProjects: QuickActionProject[] = (projects || []).map((p) => ({
    id: p.id,
    name: p.name,
    project_phases: (p.project_phases || [])
      .sort(
        (a: { order_index: number }, b: { order_index: number }) =>
          a.order_index - b.order_index,
      )
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
      const profile = t.user_profiles as {
        id: string;
        name: string | null;
        email: string | null;
        avatar_url: string | null;
      };
      return {
        id: profile.id,
        name: profile.name || "Unknown",
        email: profile.email || "",
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
  companyId: string,
): Promise<
  { id: string; name: string; avatarUrl: string | null; taskCount: number }[]
> {
  // Get task assignees with user profiles
  const { data: tasks, error } = await supabase
    .from("tasks")
    .select(
      `
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
    `,
    )
    .eq("projects.company_id", companyId);

  if (error || !tasks) {
    console.error("[getTopAssignees] Error:", error);
    return [];
  }

  const assigneeCounts = new Map<
    string,
    { id: string; name: string; avatarUrl: string | null; count: number }
  >();

  for (const task of tasks) {
    const taskAssignees = task.task_assignees as Array<{
      user_id: string | null;
      user_profiles: {
        id: string;
        name: string | null;
        avatar_url: string | null;
      } | null;
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
              name: assignee.user_profiles.name || "Unknown",
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
  companyId: string,
): Promise<{ category: string; amount: number }[]> {
  const { data: expenses, error } = await supabase
    .from("expenses")
    .select("category, amount, projects!inner (company_id)")
    .eq("projects.company_id", companyId);

  if (error || !expenses) {
    console.error("[getExpensesByCategory] Error:", error);
    return [];
  }

  const categoryMap = new Map<string, number>();

  for (const expense of expenses) {
    const category = expense.category || "other";
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
 * Internal implementation of dashboard data fetching.
 * Performance optimized via mv_dashboard_kpis materialized view.
 */
async function getDashboardDataImpl(
  companyId: string,
  supabase: Awaited<ReturnType<typeof createClient>>,
): Promise<DashboardDataResult> {
  console.log(
    "[getDashboardDataImpl] Starting dashboard data fetch (optimized with mv_dashboard_kpis)...",
  );

  try {
    // Fetch pre-aggregated KPIs from materialized view (1 query instead of 6!)
    const { data: kpiData, error: kpiError } = await supabase
      .from("mv_dashboard_kpis")
      .select("*")
      .eq("company_id", companyId)
      .single();

    if (kpiError || !kpiData) {
      console.error(
        "[getDashboardData] Error fetching KPIs from materialized view:",
        kpiError,
      );
      // Fallback to original implementation if view doesn't have data yet
      return { error: "Failed to load dashboard data. Please try refreshing." };
    }

    // Fetch additional data that requires joins (top assignees, quick actions, expense categories)
    const [topAssignees, quickActionData, expensesByCategory] =
      await Promise.all([
        getTopAssignees(supabase, companyId),
        getQuickActionData(supabase, companyId),
        getExpensesByCategory(supabase, companyId),
      ]);

    console.log("[getDashboardData] Raw KPI data from view:", {
      projects: kpiData.total_projects,
      tasks: kpiData.total_tasks,
      pendingExpenses: kpiData.pending_expenses,
      materials: kpiData.total_materials,
      team: kpiData.team_size,
      quickActionProjects: quickActionData.projects.length,
    });

    // Calculate derived metrics
    const totalPlannedBudget = Number(kpiData.total_budget) || 0;
    const totalActualSpend =
      (Number(kpiData.total_actual_cost) || 0) +
      (Number(kpiData.approved_expense_amount) || 0);
    const budgetUtilization =
      totalPlannedBudget > 0
        ? Math.round((totalActualSpend / totalPlannedBudget) * 100)
        : 0;

    const completionRate =
      (kpiData.total_tasks ?? 0) > 0
        ? Math.round(
            ((kpiData.completed_tasks ?? 0) / (kpiData.total_tasks ?? 0)) * 100,
          )
        : 0;

    const totalScheduleTasks =
      (kpiData.on_time_tasks ?? 0) +
      (kpiData.at_risk_tasks ?? 0) +
      (kpiData.delayed_tasks ?? 0);
    const onTimePercent =
      totalScheduleTasks > 0
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

    console.log(
      "[getDashboardData] Successfully assembled dashboard data from materialized view",
    );
    return { data };
  } catch (error) {
    console.error("[getDashboardData] Unexpected error:", error);
    return {
      error: "An unexpected error occurred while fetching dashboard data",
    };
  }
}

/**
 * Get aggregated dashboard data for the current user's company.
 * Uses parallel queries and materialized view for optimal performance.
 *
 * Performance: ~50-100ms via mv_dashboard_kpis materialized view
 * Cached by Next.js Server Components; invalidate with revalidateTag('dashboard')
 *
 * @returns Dashboard data aggregated from multiple tables
 */
export async function getDashboardData(): Promise<DashboardDataResult> {
  // Get user context and supabase client (not cached - session/headers are per-request)
  const supabase = await createClient();
  const userContext = await getUserContext(supabase);
  if ("error" in userContext) {
    console.error("[getDashboardData] User context error:", userContext.error);
    return { error: userContext.error };
  }

  const { companyId } = userContext;
  console.log("[getDashboardData] Fetching for company:", companyId);

  // NOTE: unstable_cache removed due to circular structure error when passing Supabase client
  // Performance is already optimized via mv_dashboard_kpis materialized view
  // Server Components provide default caching; use revalidateTag for cache invalidation
  return getDashboardDataImpl(companyId, supabase);
}

// ============================================
// Cache Invalidation Helper
// ============================================

/**
 * Invalidate the dashboard cache when data changes.
 * Call this from Server Actions that modify:
 * - Tasks (create, update, delete, assign)
 * - Projects (create, update, status change)
 * - Expenses (create, approve, reject)
 * - Materials (create, update procurement status)
 * - Team members (add, remove, role change)
 *
 * Usage: await invalidateDashboardCache();
 *
 * Optional: Pass companyId to invalidate only specific company cache:
 * await invalidateDashboardCache(companyId);
 */
export async function invalidateDashboardCache(
  companyId?: string,
): Promise<void> {
  console.log("[invalidateDashboardCache] Invalidating dashboard cache tags");
  revalidateTag("dashboard");
  revalidateTag("dashboard-kpis");

  if (companyId) {
    revalidateTag(`dashboard-${companyId}`);
    console.log(
      `[invalidateDashboardCache] Invalidated cache for company: ${companyId}`,
    );
  }
}
