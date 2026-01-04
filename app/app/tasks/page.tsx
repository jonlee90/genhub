import { redirect } from 'next/navigation';
import { createClient } from '@/utils/supabase/server';
import { auth } from '@/lib/auth';
import { TaskBoard } from '@/components/tasks/TaskBoard';
import { TaskModalTrigger } from '@/components/tasks/TaskModalTrigger';
import { getTaskAnalytics } from '@/app/actions/tasks';
import type { TaskAnalytics } from '@/types/analytics';

interface TasksPageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

async function getTasks() {
  // In development without database, return empty data
  if (process.env.NODE_ENV === 'development') {
    try {
      const supabase = await createClient();
      const session = await auth();

      if (!session?.user?.id) {
        return { tasks: [], projects: [], teamMembers: [] };
      }

      // Get user's company
      const { data: companyUser } = await supabase
        .from('company_users')
        .select('company_id')
        .eq('user_id', session.user.id)
        .eq('status', 'active')
        .maybeSingle();

      if (!companyUser) {
        return { tasks: [], projects: [], teamMembers: [] };
      }

      // Get all projects for this company (for filtering and modal)
      const { data: projects } = await supabase
        .from('projects')
        .select(`
          id,
          name,
          status,
          health_score,
          completion_percentage,
          project_phases (
            id,
            name,
            order_index
          )
        `)
        .eq('company_id', companyUser.company_id)
        .order('name');

      // Get all team members for this company (for filtering)
      const { data: teamMembers } = await supabase
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
        .eq('status', 'active');

      // Get all tasks for this company's projects
      const { data: tasks, error } = await supabase
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
        .eq('project.company_id', companyUser.company_id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching tasks:', error);
        return { tasks: [], projects: [], teamMembers: [] };
      }

      // Fetch user profiles for assignees and creators separately
      if (tasks && tasks.length > 0) {
        const assigneeIds = tasks
          .filter((t: any) => t.assignee_id)
          .map((t: any) => t.assignee_id);

        const creatorIds = tasks
          .filter((t: any) => t.created_by)
          .map((t: any) => t.created_by);

        // Combine unique IDs
        const uniqueUserIds = Array.from(new Set([...assigneeIds, ...creatorIds]));

        if (uniqueUserIds.length > 0) {
          const { data: users } = await supabase
            .from('user_profiles')
            .select('id, name, email, avatar_url')
            .in('id', uniqueUserIds);

          // Attach assignees and creators to tasks
          if (users) {
            (tasks as any[]).forEach((task: any) => {
              if (task.assignee_id) {
                task.assignee = users.find((u: any) => u.id === task.assignee_id) || null;
              }
              if (task.created_by) {
                task.creator = users.find((u: any) => u.id === task.created_by) || null;
              }
            });
          }
        }

        // Fetch material assignment counts and totals for each task
        const taskIds = tasks.map((t: any) => t.id);
        const { data: materialStats } = await supabase
          .from('material_assignments')
          .select('task_id, quantity, total_cost')
          .in('task_id', taskIds);

        if (materialStats) {
          // Aggregate material stats per task
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
      }

      return {
        tasks: tasks || [],
        projects: projects || [],
        teamMembers: teamMembers?.map((tm) => tm.user_profiles) || [],
      };
    } catch (error) {
      console.error('Database not available:', error);
      return { tasks: [], projects: [], teamMembers: [] };
    }
  }

  const supabase = await createClient();
  const session = await auth();

  if (!session?.user?.id) {
    redirect('/');
  }

  // Get user's company
  const { data: companyUser } = await supabase
    .from('company_users')
    .select('company_id')
    .eq('user_id', session.user.id)
    .eq('status', 'active')
    .maybeSingle();

  if (!companyUser) {
    redirect('/app/onboarding');
  }

  // Get all projects for this company (for filtering and modal)
  const { data: projects } = await supabase
    .from('projects')
    .select(`
      id,
      name,
      status,
      health_score,
      completion_percentage,
      project_phases (
        id,
        name,
        order_index
      )
    `)
    .eq('company_id', companyUser.company_id)
    .order('name');

  // Fetch top team members using database function
  const { data: topTeamMembers } = await supabase
    .rpc('get_top_team_members_by_completed_tasks', {
      p_company_id: companyUser.company_id,
      limit_count: 5
    });

  // Get all team members for this company (for filtering)
  const { data: teamMembers } = await supabase
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
    .eq('status', 'active');

  // Get all tasks for this company's projects
  const { data: tasks, error } = await supabase
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
    .eq('project.company_id', companyUser.company_id)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching tasks:', error);
    return { tasks: [], projects: [], teamMembers: [] };
  }

  // Fetch user profiles for assignees separately
  if (tasks && tasks.length > 0) {
    const assigneeIds = tasks
      .filter((t: any) => t.assignee_id)
      .map((t: any) => t.assignee_id);

    if (assigneeIds.length > 0) {
      const { data: assignees } = await supabase
        .from('user_profiles')
        .select('id, name, email, avatar_url')
        .in('id', assigneeIds);

      // Attach assignees to tasks
      if (assignees) {
        (tasks as any[]).forEach((task: any) => {
          if (task.assignee_id) {
            task.assignee = assignees.find((a: any) => a.id === task.assignee_id) || null;
          }
        });
      }
    }

    // Fetch material assignment counts and totals for each task
    const taskIds = tasks.map((t: any) => t.id);
    const { data: materialStats } = await supabase
      .from('material_assignments')
      .select('task_id, quantity, total_cost')
      .in('task_id', taskIds);

    if (materialStats) {
      // Aggregate material stats per task
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

    // Fetch task dependencies for Gantt chart
    const { data: dependencies } = await supabase
      .from('task_dependencies')
      .select('*')
      .or(`task_id.in.(${taskIds.join(',')}),depends_on_task_id.in.(${taskIds.join(',')})`);

    return {
      tasks: tasks || [],
      projects: projects || [],
      teamMembers: teamMembers?.map((tm) => tm.user_profiles) || [],
      taskDependencies: dependencies || [],
      topTeamMembers: topTeamMembers || [],
    };
  }

  return {
    tasks: tasks || [],
    projects: projects || [],
    teamMembers: teamMembers?.map((tm) => tm.user_profiles) || [],
    taskDependencies: [],
    topTeamMembers: topTeamMembers || [],
  };
}

export default async function TasksPage({ searchParams }: TasksPageProps) {
  const { tasks, projects, teamMembers, taskDependencies, topTeamMembers } = await getTasks();
  const params = await searchParams;

  // Get view mode from URL or default to kanban
  const viewMode = (params.view as string) || 'kanban';

  // Fetch task analytics for the dashboard
  let analytics: TaskAnalytics | undefined;
  let analyticsError: string | undefined;

  const session = await auth();
  if (session?.user?.id) {
    const supabase = await createClient();
    const { data: companyUser } = await supabase
      .from('company_users')
      .select('company_id')
      .eq('user_id', session.user.id)
      .eq('status', 'active')
      .maybeSingle();

    if (companyUser?.company_id) {
      const analyticsResult = await getTaskAnalytics('all', companyUser.company_id);
      if (analyticsResult.error) {
        console.error('[TasksPage] Analytics fetch failed:', analyticsResult.error);
        analyticsError = analyticsResult.error;
      } else {
        analytics = analyticsResult.data;
      }
    }
  }

  return (
    <div className="flex-1 space-y-4 md:space-y-6 p-4 md:p-8 pt-4 md:pt-6 relative overflow-hidden">
      {/* Blueprint Grid Background */}
      <div className="fixed inset-0 pointer-events-none opacity-[0.03]">
        <div className="absolute inset-0" style={{
          backgroundImage: `
            linear-gradient(to right, currentColor 1px, transparent 1px),
            linear-gradient(to bottom, currentColor 1px, transparent 1px)
          `,
          backgroundSize: '40px 40px',
          color: '#001B51'
        }} />
      </div>

      {/* Industrial Header with Blueprint Aesthetic */}
      <div className="relative">
          {/* Construction border */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-construction-blue" />

        <div className="flex items-start justify-between pt-2 md:pt-4 gap-3">
          <div className="space-y-1 md:space-y-3">
            {/* Main Title - Heavy Industrial Typography */}
            <h1 className="text-3xl md:text-5xl font-black tracking-tighter text-construction-blue leading-none">
              TASKS
            </h1>
          </div>

          {/* Action Button with Construction Theme */}
          <TaskModalTrigger
            projects={projects}
            teamMembers={teamMembers}
          />
        </div>
      </div>

      {/* Task Board with Analytics */}
      <TaskBoard
        initialTasks={tasks}
        taskDependencies={taskDependencies}
        projects={projects}
        teamMembers={teamMembers}
        initialView={viewMode as 'kanban' | 'list'}
        topTeamMembers={topTeamMembers}
        analytics={analytics}
        analyticsError={analyticsError}
      />

      {/* Decorative bottom border */}
      <div className="h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent" />
    </div>
  );
}
