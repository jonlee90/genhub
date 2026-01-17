import { redirect } from 'next/navigation';
import { createClient } from '@/utils/supabase/server';
import { auth } from '@/lib/auth';
import { TasksPageClient } from '@/components/tasks/TasksPageClient';

interface TasksPageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

async function getTasks() {
  const supabase = await createClient();
  const session = await auth();

  if (!session?.user?.id) {
    if (process.env.NODE_ENV === 'development') {
      return { tasks: [], projects: [], teamMembers: [], taskDependencies: [], userRole: null };
    }
    redirect('/');
  }

  // Get user's company and role first (required for all other queries)
  const { data: companyUser } = await supabase
    .from('company_users')
    .select('company_id, role')
    .eq('user_id', session.user.id)
    .eq('status', 'active')
    .maybeSingle();

  if (!companyUser) {
    if (process.env.NODE_ENV === 'development') {
      return { tasks: [], projects: [], teamMembers: [], taskDependencies: [], userRole: null };
    }
    redirect('/app/onboarding');
  }

  const companyId = companyUser.company_id;
  const userRole = companyUser.role;

  // OPTIMIZATION: Run all independent queries in parallel
  const [projectsResult, teamMembersResult, tasksResult] = await Promise.all([
    // Get all projects for this company (for filtering and modal)
    supabase
      .from('projects')
      .select(`
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
        )
      `)
      .eq('company_id', companyId)
      .order('name'),

    // Get all team members for this company (for filtering)
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
      .eq('company_id', companyId)
      .eq('status', 'active'),

    // Get all tasks for this company's projects
    supabase
      .from('tasks')
      .select(`
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
      `)
      .eq('project.company_id', companyId)
      .order('created_at', { ascending: false }),
  ]);

  const projects = projectsResult.data || [];
  const teamMembers = teamMembersResult.data?.map((tm) => tm.user_profiles) || [];
  const tasks = tasksResult.data || [];

  if (tasksResult.error) {
    console.error('Error fetching tasks:', tasksResult.error);
    return { tasks: [], projects, teamMembers, taskDependencies: [], userRole };
  }

  // If no tasks, return early
  if (tasks.length === 0) {
    return { tasks: [], projects, teamMembers, taskDependencies: [], userRole };
  }

  // Collect unique IDs for batch fetching
  const assigneeIds = [...new Set(tasks.filter((t: any) => t.assignee_id).map((t: any) => t.assignee_id))];
  const taskIds = tasks.map((t: any) => t.id);

  // OPTIMIZATION: Run secondary queries in parallel
  const [assigneesResult, materialStatsResult, expenseStatsResult, dependenciesResult] = await Promise.all([
    // Fetch user profiles for assignees
    assigneeIds.length > 0
      ? supabase
          .from('user_profiles')
          .select('id, name, email, avatar_url')
          .in('id', assigneeIds)
      : Promise.resolve({ data: [] }),

    // Fetch material assignment counts and totals for each task
    supabase
      .from('material_assignments')
      .select('task_id, quantity, total_cost')
      .in('task_id', taskIds),

    // Fetch expense counts and totals for each task
    supabase
      .from('expenses')
      .select('task_id, amount')
      .in('task_id', taskIds),

    // Fetch task dependencies for Gantt chart
    supabase
      .from('task_dependencies')
      .select('*')
      .or(`task_id.in.(${taskIds.join(',')}),depends_on_task_id.in.(${taskIds.join(',')})`),
  ]);

  // Attach assignees to tasks
  const assignees = assigneesResult.data || [];
  if (assignees.length > 0) {
    const assigneeMap = new Map(assignees.map((a: any) => [a.id, a]));
    (tasks as any[]).forEach((task: any) => {
      if (task.assignee_id) {
        task.assignee = assigneeMap.get(task.assignee_id) || null;
      }
    });
  }

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

  return {
    tasks,
    projects,
    teamMembers,
    taskDependencies: dependenciesResult.data || [],
    userRole,
  };
}

export default async function TasksPage({ searchParams }: TasksPageProps) {
  const { tasks, projects, teamMembers, taskDependencies, userRole } = await getTasks();
  const params = await searchParams;

  // Get view mode from URL or default to kanban
  const viewMode = (params.view as string) || 'kanban';

  return (
    <TasksPageClient
      tasks={tasks}
      projects={projects}
      teamMembers={teamMembers}
      taskDependencies={taskDependencies || []}
      initialView={viewMode as 'kanban' | 'list'}
      userRole={userRole}
    />
  );
}
