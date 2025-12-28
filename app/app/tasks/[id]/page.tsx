import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/utils/supabase/server';
import { auth } from '@/lib/auth';
import { TaskDetail } from '@/components/tasks/TaskDetail';
import { Button } from '@/components/ui/button';
import { ChevronLeft, FolderOpen } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface TaskPageProps {
  params: Promise<{ id: string }>;
}

async function getTask(taskId: string) {
  const supabase = await createClient();
  const session = await auth();

  if (!session?.user?.id) {
    redirect('/');
  }

  // Get user's company
  const { data: companyUser } = await supabase
    .from('company_users')
    .select('company_id, role')
    .eq('user_id', session.user.id)
    .eq('status', 'active')
    .maybeSingle();

  if (!companyUser) {
    redirect('/app/onboarding');
  }

  // Get task with all related data
  const { data: task, error } = await supabase
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
    .eq('id', taskId)
    .single();

  if (error || !task) {
    return null;
  }

  // Verify company access
  const project = task.project as { id: string; name: string; company_id: string };
  if (project.company_id !== companyUser.company_id) {
    return null;
  }

  // Fetch assignee and creator profiles separately
  const userIds = [task.assignee_id, task.created_by].filter(Boolean);
  if (userIds.length > 0) {
    const { data: users } = await supabase
      .from('user_profiles')
      .select('id, name, email, avatar_url')
      .in('id', userIds);

    if (users) {
      if (task.assignee_id) {
        (task as any).assignee = users.find((u: any) => u.id === task.assignee_id) || null;
      }
      if (task.created_by) {
        (task as any).creator = users.find((u: any) => u.id === task.created_by) || null;
      }
    }
  }

  // Get task activity
  const { data: activity } = await supabase
    .from('task_activity')
    .select('*')
    .eq('task_id', taskId)
    .order('created_at', { ascending: false });

  // Fetch user profiles for activity separately
  if (activity && activity.length > 0) {
    const activityUserIds = activity
      .filter((a: any) => a.user_id)
      .map((a: any) => a.user_id);

    if (activityUserIds.length > 0) {
      const { data: activityUsers } = await supabase
        .from('user_profiles')
        .select('id, name, avatar_url')
        .in('id', activityUserIds);

      if (activityUsers) {
        (activity as any[]).forEach((a: any) => {
          if (a.user_id) {
            a.user = activityUsers.find((u: any) => u.id === a.user_id) || null;
          }
        });
      }
    }
  }

  // Get task dependencies
  const { data: dependencies } = await supabase
    .from('task_dependencies')
    .select(`
      id,
      depends_on_task_id,
      depends_on:tasks (
        id,
        title,
        status
      )
    `)
    .eq('task_id', taskId);

  // Get tasks that depend on this task
  const { data: dependents } = await supabase
    .from('task_dependencies')
    .select(`
      id,
      task_id,
      task:tasks (
        id,
        title,
        status
      )
    `)
    .eq('depends_on_task_id', taskId);

  // Get all project phases for phase selector
  const { data: phases } = await supabase
    .from('project_phases')
    .select('id, name, order_index')
    .eq('project_id', project.id)
    .order('order_index');

  // Get team members for assignee selector
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

  return {
    task,
    activity: activity || [],
    dependencies: dependencies || [],
    dependents: dependents || [],
    phases: phases || [],
    teamMembers: teamMembers?.map((tm) => tm.user_profiles) || [],
    userRole: companyUser.role,
  };
}

export default async function TaskPage({ params }: TaskPageProps) {
  const { id } = await params;
  const data = await getTask(id);

  if (!data) {
    notFound();
  }

  const { task, activity, dependencies, dependents, phases, teamMembers, userRole } = data;
  const project = task.project as { id: string; name: string };

  return (
    <div className="flex-1 space-y-6 p-8 pt-6 relative overflow-hidden">
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

      {/* Industrial Header */}
      <div className="relative z-10">
        {/* Construction border */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-construction-blue" />

        {/* Breadcrumb Navigation */}
        <div className="flex items-center gap-3 pt-4 mb-6">
          <Link href="/app/tasks">
            <Button
              variant="ghost"
              size="sm"
              className="gap-2 text-construction-blue hover:bg-construction-blue/10 font-semibold group"
            >
              <ChevronLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
              All Tasks
            </Button>
          </Link>
          <span className="text-gray-400">/</span>
          <Link
            href={`/app/projects/${task.project_id}`}
            className="flex items-center gap-2 text-sm text-gray-600 hover:text-construction-blue transition-colors font-medium group"
          >
            <FolderOpen className="h-4 w-4 group-hover:scale-110 transition-transform" />
            {project.name}
          </Link>
        </div>
      </div>

      {/* Task Detail Component */}
      <div className="relative z-10">
        <TaskDetail
          task={task}
          activity={activity}
          dependencies={dependencies}
          dependents={dependents}
          phases={phases}
          teamMembers={teamMembers}
          userRole={userRole}
        />
      </div>
    </div>
  );
}
