import { redirect } from 'next/navigation';
import { createClient } from '@/utils/supabase/server';
import { auth } from '@/lib/auth';
import { TaskBoard } from '@/components/tasks/TaskBoard';
import { Wrench, CheckSquare, Clock, AlertTriangle, Ban } from 'lucide-react';
import { TaskModalTrigger } from '@/components/tasks/TaskModalTrigger';

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
    };
  }

  return {
    tasks: tasks || [],
    projects: projects || [],
    teamMembers: teamMembers?.map((tm) => tm.user_profiles) || [],
    taskDependencies: [],
  };
}

export default async function TasksPage({ searchParams }: TasksPageProps) {
  const { tasks, projects, teamMembers, taskDependencies } = await getTasks();
  const params = await searchParams;

  // Get view mode from URL or default to kanban
  const viewMode = (params.view as string) || 'kanban';

  // Calculate stats
  const totalTasks = tasks.length;
  const activeTasks = tasks.filter(t => t.status === 'in_progress').length;
  const completedTasks = tasks.filter(t => t.status === 'completed').length;
  const blockedTasks = tasks.filter(t => t.status === 'blocked').length;
  const overdueTasks = tasks.filter(t =>
    t.due_date && new Date(t.due_date) < new Date() && t.status !== 'completed'
  ).length;

  return (
    <div className="flex-1 space-y-6 p-8 pt-6 relative overflow-hidden">
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

        <div className="flex items-start justify-between pt-4">
          <div className="space-y-3">
            {/* Main Title - Heavy Industrial Typography */}
            <h1 className="text-5xl font-black tracking-tighter text-construction-blue leading-none">
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

      {/* Industrial Stats Dashboard - Work Progress Tracker */}
      {totalTasks > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {/* Total Tasks */}
          <div className="relative group">
            <div className="absolute inset-0 bg-gradient-to-br from-construction-blue/5 to-construction-blue/10 rounded-lg transform group-hover:scale-105 transition-transform" />
            <div className="relative bg-white border-2 border-gray-200 rounded-lg p-5 shadow-construction hover:shadow-construction-lg transition-all">
              <div className="flex items-center justify-between mb-3">
                <div className="p-2 bg-construction-blue/10 rounded-lg border-2 border-construction-blue/20">
                  <CheckSquare className="h-5 w-5 text-construction-blue" />
                </div>
                <div className="text-xs font-mono uppercase tracking-wider text-construction-blue/60">Total</div>
              </div>
              <div className="text-4xl font-black text-construction-blue leading-none mb-1">{totalTasks}</div>
              <div className="text-sm font-bold text-gray-600">Work Items</div>
            </div>
          </div>

          {/* Active Tasks */}
          <div className="relative group">
            <div className="absolute inset-0 bg-gradient-to-br from-construction-blue/5 to-construction-blue/10 rounded-lg transform group-hover:scale-105 transition-transform" />
            <div className="relative bg-white border-2 border-gray-200 rounded-lg p-5 shadow-construction hover:shadow-construction-lg transition-all">
              <div className="flex items-center justify-between mb-3">
                <div className="p-2 bg-construction-blue/10 rounded-lg border-2 border-construction-blue/20">
                  <Wrench className="h-5 w-5 text-construction-blue" />
                </div>
                <div className="text-xs font-mono uppercase tracking-wider text-construction-blue/60">Active</div>
              </div>
              <div className="text-4xl font-black text-construction-blue leading-none mb-1">{activeTasks}</div>
              <div className="text-sm font-bold text-gray-600">In Progress</div>
            </div>
          </div>

          {/* Completed Tasks */}
          <div className="relative group">
            <div className="absolute inset-0 bg-gradient-to-br from-construction-green/5 to-construction-green/10 rounded-lg transform group-hover:scale-105 transition-transform" />
            <div className="relative bg-white border-2 border-gray-200 rounded-lg p-5 shadow-construction hover:shadow-construction-lg transition-all">
              <div className="flex items-center justify-between mb-3">
                <div className="p-2 bg-construction-green/10 rounded-lg border-2 border-construction-green/20">
                  <CheckSquare className="h-5 w-5 text-construction-green" />
                </div>
                <div className="text-xs font-mono uppercase tracking-wider text-construction-green/60">Done</div>
              </div>
              <div className="text-4xl font-black text-construction-green leading-none mb-1">{completedTasks}</div>
              <div className="text-sm font-bold text-gray-600">Completed</div>
            </div>
          </div>

          {/* Overdue Tasks */}
          <div className="relative group">
            <div className="absolute inset-0 bg-gradient-to-br from-construction-accent/5 to-construction-accent/10 rounded-lg transform group-hover:scale-105 transition-transform" />
            <div className="relative bg-white border-2 border-gray-200 rounded-lg p-5 shadow-construction hover:shadow-construction-lg transition-all">
              <div className="flex items-center justify-between mb-3">
                <div className="p-2 bg-construction-accent/10 rounded-lg border-2 border-construction-accent/20">
                  <Clock className="h-5 w-5 text-construction-accent" />
                </div>
                <div className="text-xs font-mono uppercase tracking-wider text-construction-accent/60">Overdue</div>
              </div>
              <div className="text-4xl font-black text-construction-accent leading-none mb-1">{overdueTasks}</div>
              <div className="text-sm font-bold text-gray-600">Past Due</div>
            </div>
          </div>

          {/* Blocked Tasks */}
          <div className="relative group">
            <div className="absolute inset-0 bg-gradient-to-br from-construction-red/5 to-construction-red/10 rounded-lg transform group-hover:scale-105 transition-transform" />
            <div className="relative bg-white border-2 border-gray-200 rounded-lg p-5 shadow-construction hover:shadow-construction-lg transition-all">
              <div className="flex items-center justify-between mb-3">
                <div className="p-2 bg-construction-red/10 rounded-lg border-2 border-construction-red/20">
                  <Ban className="h-5 w-5 text-construction-red" />
                </div>
                <div className="text-xs font-mono uppercase tracking-wider text-construction-red/60">Blocked</div>
              </div>
              <div className="text-4xl font-black text-construction-red leading-none mb-1">{blockedTasks}</div>
              <div className="text-sm font-bold text-gray-600">Need Help</div>
            </div>
          </div>
        </div>
      )}

      {/* Task Board */}
      <TaskBoard
        initialTasks={tasks}
        taskDependencies={taskDependencies}
        projects={projects}
        teamMembers={teamMembers}
        initialView={viewMode as 'kanban' | 'list'}
      />

      {/* Decorative bottom border */}
      <div className="h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent" />
    </div>
  );
}
