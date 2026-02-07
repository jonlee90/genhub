import "server-only";

import { cache } from "react";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { createClient } from "@/utils/supabase/server";
import {
  getProjectsWithStats,
  getProjectTeamCostSummary,
} from "@/app/actions/projects";
import { getProjectTypes } from "@/app/actions/project-types";
import { getProjectFiles } from "@/app/actions/project-files";
import {
  getProjectPhotosWithReceipts,
  type UnifiedPhoto,
} from "@/app/actions/project-photos";
import type { ProjectFilesRow, ProjectTypeConfigsRow } from "@/types/db/tables/projects";
import type { TaskStats, TeamCostSummary } from "@/app/actions/projects";

export const getProjectsPageData = cache(async function getProjectsPageData() {
  const [supabase, session] = await Promise.all([createClient(), auth()]);

  if (!session?.user?.id) {
    redirect("/");
  }

  // Get user's role for permissions
  const { data: companyUser } = await supabase
    .from("company_users")
    .select("company_id, role")
    .eq("user_id", session.user.id)
    .eq("status", "active")
    .maybeSingle();

  if (!companyUser) {
    return { projects: [], totalCount: 0, role: null, companyId: "" };
  }

  // Fetch projects and project types in parallel (async-parallel pattern)
  // - Projects with enhanced stats
  // - Project types for modal creation
  const [projectsResult, projectTypesResult] = await Promise.all([
    getProjectsWithStats(companyUser.company_id),
    getProjectTypes(),
  ]);

  const { projects, totalCount, error } = projectsResult;

  if (error) {
    return {
      projects: [],
      totalCount: 0,
      role: companyUser.role,
      companyId: companyUser.company_id,
      projectTypes: [],
    };
  }

  return {
    projects: projects || [],
    totalCount: totalCount || 0,
    role: companyUser.role,
    companyId: companyUser.company_id,
    projectTypes: projectTypesResult.success ? projectTypesResult.projectTypes || [] : [],
  };
});

export const getProjectDetailData = cache(async function getProjectDetailData(
  id: string,
) {
  const [supabase, session] = await Promise.all([createClient(), auth()]);

  if (!session?.user?.id) {
    return null;
  }

  // PHASE 0: Auth & Context (Sequential - Required for RLS)
  const { data: companyUser } = await supabase
    .from("company_users")
    .select("company_id, role")
    .eq("user_id", session.user.id)
    .eq("status", "active")
    .maybeSingle();

  if (!companyUser) {
    return null;
  }

  // PHASE 1: Initial Data Fetch
  // OPTIMIZATION: Removed projects and teamMembers from initial fetch
  // These are now lazy-loaded via getModalData() when modals open
  // Savings: ~15-25KB reduction in initial RSC payload
  const { data: project, error } = await supabase
    .from("projects")
    .select(
      `
      id,
      name,
      status,
      description,
      budget,
      start_date,
      end_date,
      address,
      city,
      state,
      zip_code,
      project_type,
      client_name,
      client_email,
      client_phone,
      company_id,
      created_by,
      created_at,
      updated_at,
      completion_percentage,
      health_score,
      image_url,
      project_phases(
        id,
        name,
        order_index,
        status,
        completion_percentage,
        started_at,
        completed_at
      ),
      project_team(
        id,
        user_id,
        subcontractor_id,
        role,
        assigned_at
      ),
      tasks(
        id,
        title,
        status,
        priority,
        task_type,
        approval_status,
        phase_id,
        assignee_id,
        start_date,
        due_date,
        planned_cost,
        actual_cost,
        project_id,
        created_by,
        created_at
      )
    `,
    )
    .eq("id", id)
    .single();

  if (error || !project) {
    return null;
  }

  // PHASE 2: Dependent Queries (Parallel - Depend on Phase 1)
  // Extract IDs from Phase 1 results
  const taskIds = project.tasks?.map((t: any) => t.id) || [];
  const teamUserIds =
    project.project_team
      ?.filter((t: any) => t.user_id)
      .map((t: any) => t.user_id) || [];
  const teamSubIds =
    project.project_team
      ?.filter((t: any) => t.subcontractor_id)
      .map((t: any) => t.subcontractor_id) || [];
  const assigneeIds =
    project.tasks
      ?.filter((t: any) => t.assignee_id)
      .map((t: any) => t.assignee_id) || [];
  const creatorId = project.created_by;

  // Build parallel queries for Phase 2
  // Separate required queries from optional queries for cleaner code
  const phase2Queries = [];

  // Required queries (always execute)
  phase2Queries.push(getProjectFiles(id));
  phase2Queries.push(getProjectPhotosWithReceipts({ projectId: id }));
  phase2Queries.push(getProjectTeamCostSummary(id));
  phase2Queries.push(
    supabase.rpc("get_project_detail_with_stats", {
      p_project_id: id,
    }),
  );
  // Fetch active task types for this company (for modal)
  phase2Queries.push(
    supabase
      .from("task_type_configs")
      .select("*")
      .eq("company_id", companyUser.company_id)
      .eq("is_active", true)
      .order("name", { ascending: true }),
  );

  // Optional queries (only execute if IDs exist)
  const optionalQueries: Array<PromiseLike<any>> = [];

  // Creator profile (conditional)
  if (creatorId) {
    optionalQueries.push(
      supabase
        .from("user_profiles")
        .select("id, name, email, avatar_url")
        .eq("id", creatorId)
        .single(),
    );
  }

  // Team user profiles (conditional)
  if (teamUserIds.length > 0) {
    optionalQueries.push(
      supabase
        .from("user_profiles")
        .select("id, name, email, avatar_url")
        .in("id", teamUserIds),
    );
  }

  // Team subcontractors (conditional)
  if (teamSubIds.length > 0) {
    optionalQueries.push(
      supabase
        .from("subcontractors")
        .select("id, company_name, contact_name, trade_specialization")
        .in("id", teamSubIds),
    );
  }

  // Task assignees (conditional)
  if (assigneeIds.length > 0) {
    optionalQueries.push(
      supabase
        .from("user_profiles")
        .select("id, name, email, avatar_url")
        .in("id", assigneeIds),
    );
  }

  // Task multi-assignees with joined profiles (conditional)
  // Performance: Fetch assignees with user/subcontractor details in single query
  // Before: 3 queries (task_assignees + user_profiles + subcontractors)
  // After: 1 query with nested relations
  if (taskIds.length > 0) {
    optionalQueries.push(
      supabase
        .from("task_assignees")
        .select(`
          id,
          task_id,
          user_id,
          subcontractor_id,
          user:user_profiles!task_assignees_user_id_fkey(id, name, email, avatar_url),
          subcontractor:subcontractors!task_assignees_subcontractor_id_fkey(id, company_name, contact_name, email)
        `)
        .in("task_id", taskIds),
    );

    // Material stats (conditional on taskIds)
    optionalQueries.push(
      supabase
        .from("material_assignments")
        .select("task_id, quantity, total_cost")
        .in("task_id", taskIds),
    );

    // Expense stats (conditional on taskIds)
    optionalQueries.push(
      supabase
        .from("expenses")
        .select("task_id, amount")
        .in("task_id", taskIds),
    );

    // Task dependencies (conditional on taskIds)
    // Security fix: Use proper filter syntax instead of raw string interpolation
    // The .in() method properly escapes values, avoiding SQL injection
    // Fetch dependencies where either task_id or depends_on_task_id is in our task list
    // Using two separate queries and merging results for security
    optionalQueries.push(
      Promise.all([
        supabase
          .from("task_dependencies")
          .select("*")
          .in("task_id", taskIds),
        supabase
          .from("task_dependencies")
          .select("*")
          .in("depends_on_task_id", taskIds),
      ]).then(([result1, result2]) => {
        // Merge and deduplicate results
        const allDeps = [...(result1.data || []), ...(result2.data || [])];
        const uniqueDeps = Array.from(
          new Map(allDeps.map((d) => [d.id, d])).values()
        );
        return { data: uniqueDeps };
      }),
    );
  }

  // Execute all queries in parallel
  const [requiredResults, optionalResults] = await Promise.all([
    Promise.all(phase2Queries),
    Promise.allSettled(optionalQueries),
  ]);

  // Extract required results
  const filesResult = requiredResults[0] as Awaited<
    ReturnType<typeof getProjectFiles>
  >;
  const photosResult = requiredResults[1] as Awaited<
    ReturnType<typeof getProjectPhotosWithReceipts>
  >;
  const teamCostResult = requiredResults[2] as Awaited<
    ReturnType<typeof getProjectTeamCostSummary>
  >;
  const statsResult = requiredResults[3] as { data: any };
  const taskTypesResult = requiredResults[4] as { data: any[] };

  // Extract optional results with safe defaults
  let optionalIndex = 0;
  const getOptionalResult = () => {
    if (optionalIndex < optionalResults.length) {
      const result = optionalResults[optionalIndex++];
      return result.status === "fulfilled" ? result.value : { data: null };
    }
    return { data: null };
  };

  const creator = creatorId ? getOptionalResult().data : null;
  const teamProfiles = teamUserIds.length > 0 ? getOptionalResult().data : [];
  const teamSubs = teamSubIds.length > 0 ? getOptionalResult().data : [];
  const assignees = assigneeIds.length > 0 ? getOptionalResult().data : [];
  const taskAssignees = taskIds.length > 0 ? getOptionalResult().data : [];
  const materialStats = taskIds.length > 0 ? getOptionalResult().data : [];
  const taskExpenseStats = taskIds.length > 0 ? getOptionalResult().data : [];
  const taskDependencies = taskIds.length > 0 ? getOptionalResult().data : [];

  // PHASE 3: Data Assembly (Synchronous - Attach data to objects)
  const teamProfileMap = new Map(
    (Array.isArray(teamProfiles) ? teamProfiles : []).map((profile: any) => [
      profile.id,
      profile,
    ]),
  );
  const teamSubMap = new Map(
    (Array.isArray(teamSubs) ? teamSubs : []).map((sub: any) => [sub.id, sub]),
  );
  const assigneeMap = new Map(
    (Array.isArray(assignees) ? assignees : []).map((assignee: any) => [
      assignee.id,
      assignee,
    ]),
  );
  const phaseMap = new Map(
    (project.project_phases || []).map((phase: any) => [phase.id, phase]),
  );

  // Attach creator profile
  if (creator) {
    (project as any).creator = creator;
  }

  // Attach team profiles and subcontractors
  if (project.project_team && project.project_team.length > 0) {
    (project.project_team as any[]).forEach((member: any) => {
      if (member.user_id) {
        member.user_profiles = teamProfileMap.get(member.user_id) || null;
      }
      if (member.subcontractor_id) {
        member.subcontractors = teamSubMap.get(member.subcontractor_id) || null;
      }
    });
  }

  // Attach phase information to tasks
  if (project.tasks && project.project_phases) {
    (project.tasks as any[]).forEach((task: any) => {
      if (task.phase_id) {
        task.phase = phaseMap.get(task.phase_id) || null;
      }
    });
  }

  // Attach assignees to tasks
  if (project.tasks && assigneeMap.size > 0) {
    (project.tasks as any[]).forEach((task: any) => {
      if (task.assignee_id) {
        task.assignee = assigneeMap.get(task.assignee_id) || null;
      }
    });
  }

  // Process multi-assignees for tasks
  // Performance: User/subcontractor data is now fetched in Phase 2 via nested relations
  // Before: 2 additional queries in Phase 3
  // After: 0 additional queries (data included in task_assignees response)
  if (
    taskAssignees &&
    Array.isArray(taskAssignees) &&
    taskAssignees.length > 0
  ) {
    // Attach assignees to tasks (user/subcontractor data already included from Phase 2)
    (project.tasks as any[]).forEach((task: any) => {
      const taskAssigns = (taskAssignees as any[]).filter(
        (ta: any) => ta.task_id === task.id,
      );
      task.assignees = taskAssigns.map((ta: any) => ({
        id: ta.id,
        user_id: ta.user_id,
        subcontractor_id: ta.subcontractor_id,
        user: ta.user || null,
        subcontractor: ta.subcontractor || null,
      }));
    });
  } else {
    // Initialize empty assignees array for all tasks
    (project.tasks as any[]).forEach((task: any) => {
      task.assignees = [];
    });
  }

  // Attach material stats to tasks
  if (materialStats && Array.isArray(materialStats)) {
    // Aggregate material stats per task
    const statsByTask = (materialStats as any[]).reduce(
      (acc: any, stat: any) => {
        if (!acc[stat.task_id]) {
          acc[stat.task_id] = { count: 0, totalCost: 0 };
        }
        acc[stat.task_id].count += 1;
        acc[stat.task_id].totalCost += Number(stat.total_cost || 0);
        return acc;
      },
      {},
    );

    // Attach material stats to tasks
    (project.tasks as any[]).forEach((task: any) => {
      task.materialStats = statsByTask[task.id] || { count: 0, totalCost: 0 };
    });
  }

  // Attach expense stats to tasks
  if (taskExpenseStats && Array.isArray(taskExpenseStats)) {
    // Aggregate expense stats per task
    const statsByTask = (taskExpenseStats as any[]).reduce(
      (acc: any, expense: any) => {
        if (!acc[expense.task_id]) {
          acc[expense.task_id] = { count: 0, totalAmount: 0 };
        }
        acc[expense.task_id].count += 1;
        acc[expense.task_id].totalAmount += Number(expense.amount || 0);
        return acc;
      },
      {},
    );

    // Attach expense stats to tasks
    (project.tasks as any[]).forEach((task: any) => {
      task.expenseStats = statsByTask[task.id] || { count: 0, totalAmount: 0 };
    });
  }

  // Sort phases by order_index with null-safe handling
  if (project.project_phases) {
    (project.project_phases as any[]).sort((a, b) => {
      const orderA = a.order_index ?? Number.MAX_SAFE_INTEGER;
      const orderB = b.order_index ?? Number.MAX_SAFE_INTEGER;
      return orderA - orderB;
    });
  }

  // PHASE 3B: Compute stats using database function (replaces 300+ lines of JS aggregation)
  const { data: statsData } = statsResult || { data: null };

  // Extract stats from RPC response
  let phaseTaskStats: any[] = [];
  let expenseStats: any = {
    total: 0,
    approved: 0,
    pending: 0,
    rejected: 0,
    totalAmount: 0,
    approvedAmount: 0,
    pendingAmount: 0,
    rejectedAmount: 0,
  };
  let taskStats: TaskStats = {
    total: 0,
    completed: 0,
    inProgress: 0,
    blocked: 0,
    overdue: 0,
    totalPlannedCost: 0,
    totalActualCost: 0,
    budgetVariance: 0,
    budgetUtilization: 0,
    unassignedCount: 0,
    topAssignees: [],
    tasksWithMaterials: 0,
    totalMaterialCost: 0,
  };

  if (statsData && typeof statsData === "object" && "project" in statsData) {
    const statsProject = (statsData as any).project;

    // Convert phase_task_stats object to array format
    if (statsProject.phase_task_stats && project.project_phases) {
      phaseTaskStats = project.project_phases.map((phase: any) => ({
        phaseId: phase.id,
        totalTasks: statsProject.phase_task_stats[phase.id]?.totalTasks || 0,
        completedTasks:
          statsProject.phase_task_stats[phase.id]?.completedTasks || 0,
        blockedTasks:
          statsProject.phase_task_stats[phase.id]?.blockedTasks || 0,
        overdueTasks:
          statsProject.phase_task_stats[phase.id]?.overdueTasks || 0,
      }));
    }

    // Use expense stats from RPC
    if (statsProject.expense_stats) {
      expenseStats = statsProject.expense_stats;
    }

    // Use task stats from RPC
    if (statsProject.task_stats) {
      taskStats = {
        total: statsProject.task_stats.total || 0,
        completed: statsProject.task_stats.completed || 0,
        inProgress: statsProject.task_stats.inProgress || 0,
        blocked: statsProject.task_stats.blocked || 0,
        overdue: statsProject.task_stats.overdue || 0,
        totalPlannedCost: statsProject.task_stats.totalPlannedCost || 0,
        totalActualCost: statsProject.task_stats.totalActualCost || 0,
        budgetVariance: statsProject.task_stats.budgetVariance || 0,
        budgetUtilization: statsProject.task_stats.budgetUtilization || 0,
        unassignedCount: statsProject.task_stats.unassignedCount || 0,
        topAssignees: statsProject.top_assignees || [],
        tasksWithMaterials: statsProject.task_stats.tasksWithMaterials || 0,
        totalMaterialCost: statsProject.task_stats.totalMaterialCost || 0,
      };
    }

    // Update project's health_score with the calculated value from RPC
    if (typeof statsProject.calculated_health_score === "number") {
      (project as any).health_score = statsProject.calculated_health_score;
    }

    // Attach material and expense stats to tasks
    if (project.tasks && Array.isArray(project.tasks)) {
      project.tasks.forEach((task) => {
        if (!task.id) return;

        // Material stats per task
        if (
          statsProject.material_stats_by_task &&
          statsProject.material_stats_by_task[task.id]
        ) {
          (task as any).materialStats =
            statsProject.material_stats_by_task[task.id];
        } else {
          (task as any).materialStats = { count: 0, totalCost: 0 };
        }

        // Expense stats per task
        if (
          statsProject.expense_stats_by_task &&
          statsProject.expense_stats_by_task[task.id]
        ) {
          (task as any).expenseStats =
            statsProject.expense_stats_by_task[task.id];
        } else {
          (task as any).expenseStats = { count: 0, totalAmount: 0 };
        }
      });
    }
  }

  // Use files, photos, and team costs from Phase 2 (already fetched)
  let projectFiles: ProjectFilesRow[] = [];
  if ("error" in filesResult) {
    projectFiles = [];
  } else {
    projectFiles = filesResult.data || [];
  }

  let projectPhotos: UnifiedPhoto[] = [];
  if ("error" in photosResult) {
    projectPhotos = [];
  } else {
    projectPhotos = photosResult.data || [];
  }

  let teamCostSummaries: TeamCostSummary[] = [];
  if ("error" in teamCostResult) {
    teamCostSummaries = [];
  } else {
    teamCostSummaries = teamCostResult.data || [];
  }

  return {
    project,
    phaseTaskStats,
    taskDependencies: taskDependencies || [],
    expenseStats,
    taskStats,
    projectFiles,
    projectPhotos,
    teamCostSummaries,
    taskTypes: taskTypesResult.data || [],
    userRole: companyUser.role,
  };
});
