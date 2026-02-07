import "server-only";

import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { auth } from "@/lib/auth";
import type { TaskStatus } from "@/types/db/task";

interface TasksPageFilters {
  projectFilter?: string;
  statusFilter?: TaskStatus | "all";
  searchQuery?: string;
  limit?: number;
  offset?: number;
}

export const getTasksPageData = cache(async function getTasksPageData(
  filters?: TasksPageFilters,
) {
  const [supabase, session] = await Promise.all([createClient(), auth()]);

  if (!session?.user?.id) {
    if (process.env.NODE_ENV === "development") {
      return {
        tasks: [],
        projects: [],
        teamMembers: [],
        taskDependencies: [],
        userRole: null,
      };
    }
    redirect("/");
  }

  // Get user's company and role first (required for all other queries)
  const { data: companyUser } = await supabase
    .from("company_users")
    .select("company_id, role")
    .eq("user_id", session.user.id)
    .eq("status", "active")
    .maybeSingle();

  if (!companyUser) {
    if (process.env.NODE_ENV === "development") {
      return {
        tasks: [],
        projects: [],
        teamMembers: [],
        taskDependencies: [],
        userRole: null,
      };
    }
    redirect("/app/onboarding");
  }

  const companyId = companyUser.company_id;
  const userRole = companyUser.role;

  // OPTIMIZATION: Run all independent queries in parallel
  const [projectsResult, teamMembersResult, tasksResult, taskTypesResult] = await Promise.all([
    // Get all projects for this company (for filtering and modal)
    supabase
      .from("projects")
      .select(
        `
        id,
        name,
        budget,
        status,
        health_score,
        completion_percentage,
        end_date,
        project_phases (
          id,
          name,
          order_index
        ),
        project_type_config:project_type_configs (
          id,
          name,
          color,
          icon_name
        )
      `,
      )
      .eq("company_id", companyId)
      .order("name"),

    // Get all team members for this company (for filtering)
    supabase
      .from("company_users")
      .select(
        `
        user_id,
        user_profiles:user_profiles!company_users_user_profile_fkey (
          id,
          name,
          email,
          avatar_url
        )
      `,
      )
      .eq("company_id", companyId)
      .eq("status", "active"),

    // Get all tasks for this company's projects with server-side filtering
    (() => {
      let query = supabase
        .from("tasks")
        .select(
          `
          *,
          project:projects!inner (
            id,
            name,
            company_id
          ),
          phase:project_phases (
            id,
            name,
            order_index,
            icon_name
          )
        `,
        )
        .eq("project.company_id", companyId);

      // Apply server-side filters
      if (filters?.projectFilter && filters.projectFilter !== "all") {
        query = query.eq("project_id", filters.projectFilter);
      }
      if (filters?.statusFilter && filters.statusFilter !== "all") {
        query = query.eq("status", filters.statusFilter as TaskStatus);
      }
      if (filters?.searchQuery) {
        query = query.ilike("title", `%${filters.searchQuery}%`);
      }

      // Apply pagination
      const limit = filters?.limit || 50;
      const offset = filters?.offset || 0;
      query = query.range(offset, offset + limit - 1);

      return query.order("created_at", { ascending: false });
    })(),

    // Get all active task types for this company (for modal)
    supabase
      .from("task_type_configs")
      .select("*")
      .eq("company_id", companyId)
      .eq("is_active", true)
      .order("name", { ascending: true }),
  ]);

  const projects = projectsResult.data || [];
  const teamMembers =
    teamMembersResult.data?.map((tm) => tm.user_profiles).filter(Boolean) || [];
  const tasks = tasksResult.data || [];
  const taskTypes = taskTypesResult.data || [];

  if (tasksResult.error || tasks.length === 0) {
    return {
      tasks: [],
      projects,
      teamMembers,
      taskDependencies: [],
      taskTypes,
      userRole,
    };
  }

  // Collect task IDs for batch fetching related data
  const taskIds = tasks.map((task: any) => task.id);

  // OPTIMIZATION: Run secondary queries in parallel
  const [assigneesResult, taskAssigneesResult, materialStatsResult, expenseStatsResult, dependenciesResult] =
    await Promise.all([
      // Fetch assignee user profiles
      supabase
        .from("user_profiles")
        .select("id, name, email, avatar_url")
        .in(
          "id",
          tasks.map((t: any) => t.assignee_id).filter((id): id is string => !!id),
        ),

      // Fetch task assignees with nested user/subcontractor data
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

      // Fetch material assignment counts and totals for each task
      supabase
        .from("material_assignments")
        .select("task_id, quantity, total_cost")
        .in("task_id", taskIds),

      // Fetch expense counts and totals for each task
      supabase.from("expenses").select("task_id, amount").in("task_id", taskIds),

      // Fetch task dependencies for Gantt chart
      supabase
        .from("task_dependencies")
        .select("*")
        .or(
          `task_id.in.(${taskIds.join(",")}),depends_on_task_id.in.(${taskIds.join(",")})`,
        ),
    ]);

  // Aggregate material stats per task
  const materialStats = materialStatsResult.data || [];
  if (materialStats.length > 0) {
    const statsByTask = materialStats.reduce((acc: any, stat: any) => {
      if (!acc[stat.task_id]) {
        acc[stat.task_id] = { count: 0, totalCost: 0 };
      }
      acc[stat.task_id].count += 1;
      acc[stat.task_id].totalCost += Number(stat.total_cost || 0);
      return acc;
    }, {});

    // Attach material stats to tasks
    (tasks as any[]).forEach((task: any) => {
      task.materialStats = statsByTask[task.id] || { count: 0, totalCost: 0 };
    });
  }

  // Aggregate expense stats per task
  const expenseStats = expenseStatsResult.data || [];
  if (expenseStats.length > 0) {
    const statsByTask = expenseStats.reduce((acc: any, expense: any) => {
      if (!acc[expense.task_id]) {
        acc[expense.task_id] = { count: 0, totalAmount: 0 };
      }
      acc[expense.task_id].count += 1;
      acc[expense.task_id].totalAmount += Number(expense.amount || 0);
      return acc;
    }, {});

    // Attach expense stats to tasks
    (tasks as any[]).forEach((task: any) => {
      task.expenseStats = statsByTask[task.id] || { count: 0, totalAmount: 0 };
    });
  }

  // Attach assignee user profiles to tasks
  const assignees = assigneesResult.data || [];
  if (assignees.length > 0) {
    const assigneeMap = assignees.reduce((acc: any, assignee: any) => {
      acc[assignee.id] = assignee;
      return acc;
    }, {});

    (tasks as any[]).forEach((task: any) => {
      task.assignee = task.assignee_id ? assigneeMap[task.assignee_id] || null : null;
    });
  }

  // Attach multi-assignees to tasks
  const taskAssigneesData = taskAssigneesResult.data || [];
  if (taskAssigneesData.length > 0) {
    (tasks as any[]).forEach((task: any) => {
      const taskAssigns = taskAssigneesData.filter((ta: any) => ta.task_id === task.id);
      task.assignees = taskAssigns.map((ta: any) => ({
        id: ta.id,
        user_id: ta.user_id,
        subcontractor_id: ta.subcontractor_id,
        user: ta.user || null,
        subcontractor: ta.subcontractor || null,
      }));
    });
  } else {
    (tasks as any[]).forEach((task: any) => {
      task.assignees = [];
    });
  }

  return {
    tasks,
    projects,
    teamMembers,
    taskDependencies: dependenciesResult.data || [],
    taskTypes,
    userRole,
  };
});

interface TaskUserProfile {
  id: string;
  name: string;
  email?: string;
  avatar_url: string | null;
}

interface TaskActivityRecord {
  id: string;
  user_id: string | null;
  old_value: string | null;
  new_value: string | null;
  comment: string | null;
  created_at: string;
  task_id: string;
}

interface TaskDependencyRecord {
  id: string;
  task_id: string;
  depends_on_task_id: string;
  depends_on_task: { id: string; title: string; status: string } | null;
}

interface TaskDependentRecord {
  id: string;
  task_id: string;
  depends_on_task_id: string;
  blocking_task: { id: string; title: string; status: string } | null;
}

export const getTaskDetailData = cache(async function getTaskDetailData(
  taskId: string,
) {
  const [supabase, session] = await Promise.all([createClient(), auth()]);

  if (!session?.user?.id) {
    redirect("/");
  }

  // Get user's company
  const { data: companyUser } = await supabase
    .from("company_users")
    .select("company_id, role")
    .eq("user_id", session.user.id)
    .eq("status", "active")
    .maybeSingle();

  if (!companyUser) {
    redirect("/app/onboarding");
  }

  // Get task with all related data
  const { data: task, error } = await supabase
    .from("tasks")
    .select(
      `
      *,
      project:projects!inner (
        id,
        name,
        company_id
      ),
      phase:project_phases (
        id,
        name
      )
    `,
    )
    .eq("id", taskId)
    .single();

  if (error || !task) {
    return null;
  }

  const project = task.project as {
    id: string;
    name: string;
    company_id: string;
  };
  if (project.company_id !== companyUser.company_id) {
    return null;
  }

  const userIds = [task.assignee_id, task.created_by].filter(
    Boolean,
  ) as string[];
  const userProfilesPromise = userIds.length
    ? supabase
        .from("user_profiles")
        .select("id, name, email, avatar_url")
        .in("id", userIds)
    : Promise.resolve({ data: [] });

  const activityPromise = supabase
    .from("task_activity")
    .select(
      `
      *,
      user:user_profiles!task_activity_user_id_fkey (
        id,
        name,
        avatar_url
      )
    `,
    )
    .eq("task_id", taskId)
    .order("created_at", { ascending: false });

  const dependenciesPromise = supabase
    .from("task_dependencies")
    .select(
      `
      id,
      task_id,
      depends_on_task_id,
      depends_on_task:tasks!depends_on_task_id (
        id,
        title,
        status
      )
    `,
    )
    .eq("task_id", taskId);

  const dependentsPromise = supabase
    .from("task_dependencies")
    .select(
      `
      id,
      task_id,
      depends_on_task_id,
      blocking_task:tasks!task_id (
        id,
        title,
        status
      )
    `,
    )
    .eq("depends_on_task_id", taskId);

  const phasesPromise = supabase
    .from("project_phases")
    .select("id, name, order_index")
    .eq("project_id", project.id)
    .order("order_index");

  const teamMembersPromise = supabase
    .from("company_users")
    .select(
      `
      user_id,
      user_profiles:user_profiles!company_users_user_profile_fkey (
        id,
        name,
        email,
        avatar_url
      )
    `,
    )
    .eq("company_id", companyUser.company_id)
    .eq("status", "active");

  const [
    userProfilesResult,
    activityResult,
    dependenciesRaw,
    dependentsRaw,
    phasesResult,
    teamMembersResult,
  ] = await Promise.all([
    userProfilesPromise,
    activityPromise,
    dependenciesPromise,
    dependentsPromise,
    phasesPromise,
    teamMembersPromise,
  ]);

  const userProfiles = (userProfilesResult.data as TaskUserProfile[]) || [];
  const userProfileMap = new Map(
    userProfiles.map((profile) => [profile.id, profile]),
  );

  if (task.assignee_id) {
    (task as Record<string, unknown>).assignee =
      userProfileMap.get(task.assignee_id) || null;
  }

  if (task.created_by) {
    (task as Record<string, unknown>).creator =
      userProfileMap.get(task.created_by) || null;
  }

  const activityRaw = activityResult.data as (TaskActivityRecord & {
    user: TaskUserProfile | null;
  })[] | null;
  const activity: Array<{
    id: string;
    action: string;
    old_value: string | null;
    new_value: string | null;
    comment: string | null;
    created_at: string;
    user: { id: string; name: string; avatar_url: string | null } | null;
  }> = activityRaw
    ? activityRaw.map((record) => ({
        id: record.id,
        action: record.comment
          ? "comment"
          : record.old_value
            ? "updated"
            : "created",
        old_value: record.old_value,
        new_value: record.new_value,
        comment: record.comment,
        created_at: record.created_at,
        user: record.user || null,
      }))
    : [];

  const dependencies = ((dependenciesRaw.data as TaskDependencyRecord[]) || [])
    .filter((record) => record.depends_on_task !== null)
    .map((record) => ({
      id: record.id,
      depends_on_task_id: record.depends_on_task_id,
      depends_on: record.depends_on_task!,
    }));

  const dependents = ((dependentsRaw.data as TaskDependentRecord[]) || [])
    .filter((record) => record.blocking_task !== null)
    .map((record) => ({
      id: record.id,
      task_id: record.task_id,
      task: record.blocking_task!,
    }));

  return {
    task,
    activity,
    dependencies,
    dependents,
    phases: phasesResult.data || [],
    teamMembers:
      teamMembersResult.data
        ?.map((member) => member.user_profiles)
        .filter(Boolean) || [],
    userRole: companyUser.role,
  };
});
