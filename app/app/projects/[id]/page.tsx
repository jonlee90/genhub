import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import { createClient } from '@/utils/supabase/server';
import { auth } from '@/lib/auth';
import { ChevronLeft } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ProjectDetailContent } from '@/components/projects/ProjectDetailContent';
import type { ProjectsRow, ProjectFilesRow } from '@/types/db/tables/projects';
import type { TaskStats, TeamCostSummary } from '@/app/actions/projects';
import { getProjectFiles } from '@/app/actions/project-files';
import { getProjectPhotosWithReceipts, type UnifiedPhoto } from '@/app/actions/project-photos';
import { getProjectTeamCostSummary } from '@/app/actions/projects';

type Project = ProjectsRow;

async function getProjectData(id: string) {
  const supabase = await createClient();
  const session = await auth();

  if (!session?.user?.id) {
    return null;
  }

  // PHASE 0: Auth & Context (Sequential - Required for RLS)
  const { data: companyUser } = await supabase
    .from('company_users')
    .select('company_id, role')
    .eq('user_id', session.user.id)
    .eq('status', 'active')
    .maybeSingle();

  if (!companyUser) {
    return null;
  }

  // PHASE 1: Initial Data Fetch (Parallel - All Independent)
  const [
    { data: projects },
    { data: teamMembersData },
    { data: project, error },
    { data: expenses, error: expensesError },
  ] = await Promise.all([
    // Get all projects for this company (for modal)
    supabase
      .from('projects')
      .select('id, name, project_phases(id, name, order_index)')
      .eq('company_id', companyUser.company_id)
      .order('name'),

    // Get all team members for this company (for modal)
    supabase
      .from('company_users')
      .select(`
        user_id,
        user_profiles!inner (
          id,
          name,
          email,
          avatar_url
        )
      `)
      .eq('company_id', companyUser.company_id)
      .eq('status', 'active'),

    // Get the specific project with nested relations
    supabase
      .from('projects')
      .select(`
        id,
        name,
        status,
        description,
        budget,
        start_date,
        end_date,
        address,
        project_type,
        client_name,
        client_email,
        client_phone,
        company_id,
        created_by,
        created_at,
        updated_at,
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
      `)
      .eq('id', id)
      .single(),

    // Fetch expense stats for this project
    supabase
      .from('expenses')
      .select('id, amount, status')
      .eq('project_id', id)
  ]);

  const teamMembers = teamMembersData?.map((tm) => tm.user_profiles).filter((p): p is NonNullable<typeof p> => p !== null && p !== undefined) || [];

  // Error handling for Phase 1
  if (expensesError) {
    console.error('[getProjectData] Error fetching expenses:', expensesError);
  }

  if (error || !project) {
    console.log('Error fetching project:', error);
    return null;
  }

  // PHASE 2: Dependent Queries (Parallel - Depend on Phase 1)
  // Extract IDs from Phase 1 results
  const taskIds = project.tasks?.map((t: any) => t.id) || [];
  const teamUserIds = project.project_team?.filter((t: any) => t.user_id).map((t: any) => t.user_id) || [];
  const teamSubIds = project.project_team?.filter((t: any) => t.subcontractor_id).map((t: any) => t.subcontractor_id) || [];
  const assigneeIds = project.tasks?.filter((t: any) => t.assignee_id).map((t: any) => t.assignee_id) || [];
  const creatorId = project.created_by;

  // Build parallel queries for Phase 2
  const phase2Queries = [];

  // Creator profile (conditional)
  if (creatorId) {
    phase2Queries.push(
      supabase
        .from('user_profiles')
        .select('id, name, email, avatar_url')
        .eq('id', creatorId)
        .single()
    );
  } else {
    phase2Queries.push(Promise.resolve({ data: null }));
  }

  // Team user profiles (conditional)
  if (teamUserIds.length > 0) {
    phase2Queries.push(
      supabase
        .from('user_profiles')
        .select('id, name, email, avatar_url')
        .in('id', teamUserIds)
    );
  } else {
    phase2Queries.push(Promise.resolve({ data: [] }));
  }

  // Team subcontractors (conditional)
  if (teamSubIds.length > 0) {
    phase2Queries.push(
      supabase
        .from('subcontractors')
        .select('id, company_name, contact_name, trade_specialization')
        .in('id', teamSubIds)
    );
  } else {
    phase2Queries.push(Promise.resolve({ data: [] }));
  }

  // Task assignees (conditional)
  if (assigneeIds.length > 0) {
    phase2Queries.push(
      supabase
        .from('user_profiles')
        .select('id, name, email, avatar_url')
        .in('id', assigneeIds)
    );
  } else {
    phase2Queries.push(Promise.resolve({ data: [] }));
  }

  // Task multi-assignees (conditional)
  if (taskIds.length > 0) {
    phase2Queries.push(
      supabase
        .from('task_assignees')
        .select('id, task_id, user_id, subcontractor_id')
        .in('task_id', taskIds)
    );
  } else {
    phase2Queries.push(Promise.resolve({ data: [] }));
  }

  // Material stats (conditional)
  if (taskIds.length > 0) {
    phase2Queries.push(
      supabase
        .from('material_assignments')
        .select('task_id, quantity, total_cost')
        .in('task_id', taskIds)
    );
  } else {
    phase2Queries.push(Promise.resolve({ data: [] }));
  }

  // Expense stats (conditional)
  if (taskIds.length > 0) {
    phase2Queries.push(
      supabase
        .from('expenses')
        .select('task_id, amount')
        .in('task_id', taskIds)
    );
  } else {
    phase2Queries.push(Promise.resolve({ data: [] }));
  }

  // Task dependencies (conditional)
  if (taskIds.length > 0) {
    phase2Queries.push(
      supabase
        .from('task_dependencies')
        .select('*')
        .or(`task_id.in.(${taskIds.join(',')}),depends_on_task_id.in.(${taskIds.join(',')})`)
    );
  } else {
    phase2Queries.push(Promise.resolve({ data: [] }));
  }

  // Note: Material and expense aggregations are now handled by the RPC function
  // We keep these minimal queries only for data assembly (attaching stats to tasks)
  // The heavy aggregation work (200+ lines of JS) is now done in the database

  // Files and photos (Server Actions - run in parallel with DB queries)
  phase2Queries.push(getProjectFiles(id));
  phase2Queries.push(getProjectPhotosWithReceipts(id));
  phase2Queries.push(getProjectTeamCostSummary(id));

  // Execute all Phase 2 queries in parallel
  const phase2Results = await Promise.all(phase2Queries);
  const [
    { data: creator },
    { data: teamProfiles },
    { data: teamSubs },
    { data: assignees },
    { data: taskAssignees },
    { data: materialStats },
    { data: taskExpenseStats },
    { data: taskDependencies },
  ] = phase2Results as Array<{ data: any }>;

  const filesResult = phase2Results[8] as Awaited<ReturnType<typeof getProjectFiles>>;
  const photosResult = phase2Results[9] as Awaited<ReturnType<typeof getProjectPhotosWithReceipts>>;
  const teamCostResult = phase2Results[10] as Awaited<ReturnType<typeof getProjectTeamCostSummary>>;

  // PHASE 3: Data Assembly (Synchronous - Attach data to objects)

  // Attach creator profile
  if (creator) {
    (project as any).creator = creator;
  }

  // Attach team profiles and subcontractors
  if (project.project_team && project.project_team.length > 0) {
    (project.project_team as any[]).forEach((member: any) => {
      if (member.user_id && teamProfiles && Array.isArray(teamProfiles)) {
        member.user_profiles = (teamProfiles as any[]).find((p: any) => p.id === member.user_id) || null;
      }
      if (member.subcontractor_id && teamSubs && Array.isArray(teamSubs)) {
        member.subcontractors = (teamSubs as any[]).find((s: any) => s.id === member.subcontractor_id) || null;
      }
    });
  }

  // Attach phase information to tasks
  if (project.tasks && project.project_phases) {
    (project.tasks as any[]).forEach((task: any) => {
      if (task.phase_id) {
        task.phase = project.project_phases.find((p: any) => p.id === task.phase_id) || null;
      }
    });
  }

  // Attach assignees to tasks
  if (project.tasks && assignees && Array.isArray(assignees)) {
    (project.tasks as any[]).forEach((task: any) => {
      if (task.assignee_id) {
        task.assignee = (assignees as any[]).find((a: any) => a.id === task.assignee_id) || null;
      }
    });
  }

  // Process multi-assignees for tasks
  if (taskAssignees && Array.isArray(taskAssignees) && taskAssignees.length > 0) {
    // Get unique user IDs and subcontractor IDs for Phase 3 queries
    const userIds = [...new Set((taskAssignees as any[]).filter(ta => ta.user_id).map(ta => ta.user_id))] as string[];
    const subIds = [...new Set((taskAssignees as any[]).filter(ta => ta.subcontractor_id).map(ta => ta.subcontractor_id))] as string[];

    // Fetch user profiles and subcontractors for multi-assignees
    const [
      { data: userProfiles },
      { data: subcontractors }
    ] = await Promise.all([
      userIds.length > 0
        ? supabase.from('user_profiles').select('id, name, email, avatar_url').in('id', userIds)
        : Promise.resolve({ data: [] }),
      subIds.length > 0
        ? supabase.from('subcontractors').select('id, company_name, contact_name, email').in('id', subIds)
        : Promise.resolve({ data: [] })
    ]);

    // Attach assignees to tasks
    (project.tasks as any[]).forEach((task: any) => {
      const taskAssigns = (taskAssignees as any[]).filter((ta: any) => ta.task_id === task.id);
      task.assignees = taskAssigns.map((ta: any) => ({
        id: ta.id,
        user_id: ta.user_id,
        subcontractor_id: ta.subcontractor_id,
        user: ta.user_id ? userProfiles?.find((u: any) => u.id === ta.user_id) || null : null,
        subcontractor: ta.subcontractor_id ? subcontractors?.find((s: any) => s.id === ta.subcontractor_id) || null : null,
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
    const statsByTask = (materialStats as any[]).reduce((acc: any, stat: any) => {
      if (!acc[stat.task_id]) {
        acc[stat.task_id] = { count: 0, totalCost: 0 };
      }
      acc[stat.task_id].count += 1;
      acc[stat.task_id].totalCost += Number(stat.total_cost || 0);
      return acc;
    }, {});

    // Attach material stats to tasks
    (project.tasks as any[]).forEach((task: any) => {
      task.materialStats = statsByTask[task.id] || { count: 0, totalCost: 0 };
    });
  }

  // Attach expense stats to tasks
  if (taskExpenseStats && Array.isArray(taskExpenseStats)) {
    // Aggregate expense stats per task
    const statsByTask = (taskExpenseStats as any[]).reduce((acc: any, expense: any) => {
      if (!acc[expense.task_id]) {
        acc[expense.task_id] = { count: 0, totalAmount: 0 };
      }
      acc[expense.task_id].count += 1;
      acc[expense.task_id].totalAmount += Number(expense.amount || 0);
      return acc;
    }, {});

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
  const { data: statsData, error: statsError } = await supabase
    .rpc('get_project_detail_with_stats', { p_project_id: id });

  if (statsError) {
    console.error('[getProjectData] Error fetching stats:', statsError);
  }

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

  if (statsData && typeof statsData === 'object' && 'project' in statsData) {
    const statsProject = (statsData as any).project;

    // Convert phase_task_stats object to array format
    if (statsProject.phase_task_stats && project.project_phases) {
      phaseTaskStats = project.project_phases.map((phase: any) => ({
        phaseId: phase.id,
        totalTasks: statsProject.phase_task_stats[phase.id]?.totalTasks || 0,
        completedTasks: statsProject.phase_task_stats[phase.id]?.completedTasks || 0,
        blockedTasks: statsProject.phase_task_stats[phase.id]?.blockedTasks || 0,
        overdueTasks: statsProject.phase_task_stats[phase.id]?.overdueTasks || 0,
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

    // Attach material and expense stats to tasks
    if (project.tasks && Array.isArray(project.tasks)) {
      project.tasks.forEach((task) => {
        if (!task.id) return;

        // Material stats per task
        if (statsProject.material_stats_by_task && statsProject.material_stats_by_task[task.id]) {
          (task as any).materialStats = statsProject.material_stats_by_task[task.id];
        } else {
          (task as any).materialStats = { count: 0, totalCost: 0 };
        }

        // Expense stats per task
        if (statsProject.expense_stats_by_task && statsProject.expense_stats_by_task[task.id]) {
          (task as any).expenseStats = statsProject.expense_stats_by_task[task.id];
        } else {
          (task as any).expenseStats = { count: 0, totalAmount: 0 };
        }
      });
    }
  }

  console.log('[getProjectData] Expense stats (from RPC):', expenseStats);
  console.log('[getProjectData] Task stats (from RPC):', taskStats);

  // Use files, photos, and team costs from Phase 2 (already fetched)
  let projectFiles: ProjectFilesRow[] = [];
  if ('error' in filesResult) {
    console.warn('[getProjectData] Failed to load files:', filesResult.error);
  } else {
    projectFiles = filesResult.data || [];
  }

  let projectPhotos: UnifiedPhoto[] = [];
  if ('error' in photosResult) {
    console.warn('[getProjectData] Failed to load photos:', photosResult.error);
  } else {
    projectPhotos = photosResult.data || [];
  }

  console.log('[getProjectData] Files:', projectFiles.length, 'Photos:', projectPhotos.length);

  let teamCostSummaries: TeamCostSummary[] = [];
  if ('error' in teamCostResult) {
    console.warn('[getProjectData] Failed to load team costs:', teamCostResult.error);
  } else {
    teamCostSummaries = teamCostResult.data || [];
  }

  console.log('[getProjectData] Team cost summaries:', teamCostSummaries.length);

  return {
    project,
    projects: projects || [],
    teamMembers: teamMembers || [],
    phaseTaskStats,
    taskDependencies: taskDependencies || [],
    expenseStats,
    taskStats,
    projectFiles,
    projectPhotos,
    teamCostSummaries
  };
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const data = await getProjectData(id);
  if (!data?.project) {
    return { title: 'Project Not Found | GenHub' };
  }

  return {
    title: `${data.project.name} | GenHub`,
    description: `Project details for ${data.project.name}`,
  };
}

export default async function ProjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const data = await getProjectData(id);

  if (!data?.project) {
    notFound();
  }

  const { project, projects, teamMembers, phaseTaskStats, taskDependencies, expenseStats, taskStats, projectFiles, projectPhotos, teamCostSummaries } = data;

  console.log('[ProjectDetailPage] Loading project:', id, 'with expense stats:', expenseStats, 'task stats:', taskStats, 'teamCostSummaries:', teamCostSummaries?.length);

  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Blueprint Grid Background */}
      <div className="fixed inset-0 pointer-events-none opacity-[0.03] z-0">
        <div className="absolute inset-0" style={{
          backgroundImage: `
            linear-gradient(to right, currentColor 1px, transparent 1px),
            linear-gradient(to bottom, currentColor 1px, transparent 1px)
          `,
          backgroundSize: '40px 40px',
          color: '#001B51'
        }} />
      </div>

      {/* Main Content */}
      <div className="relative z-10 flex-1 space-y-4 p-4 pt-4 md:space-y-6 md:p-8 md:pt-6">
        {/* Industrial Header */}
        <div className="relative">
          {/* Construction border */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-construction-blue" />

          {/* Breadcrumb Navigation */}
          <div className="flex items-center gap-2 pt-3 mb-4 md:gap-3 md:pt-4 md:mb-6">
            <Link href="/app/projects">
              <Button
                variant="ghost"
                size="sm"
                className="gap-2 text-construction-blue hover:bg-construction-blue/10 font-semibold group"
              >
                <ChevronLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
                All Projects
              </Button>
            </Link>
          </div>
        </div>

        {/* Project Detail Content */}
        <ProjectDetailContent
          project={project}
          projects={projects || []}
          teamMembers={teamMembers || []}
          phaseTaskStats={phaseTaskStats || []}
          taskDependencies={taskDependencies || []}
          expenseStats={expenseStats}
          taskStats={taskStats}
          projectFiles={projectFiles || []}
          projectPhotos={projectPhotos || []}
          teamCostSummaries={teamCostSummaries || []}
        />
      </div>
    </div>
  );
}
