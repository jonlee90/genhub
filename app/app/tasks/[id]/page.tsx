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

// Type definitions for Supabase query results
interface UserProfile {
  id: string;
  name: string;
  email?: string;
  avatar_url: string | null;
}

interface ActivityRecord {
  id: string;
  user_id: string | null;
  old_value: string | null;
  new_value: string | null;
  comment: string | null;
  created_at: string;
  task_id: string;
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
  const userIds = [task.assignee_id, task.created_by].filter((id): id is string => Boolean(id));
  if (userIds.length > 0) {
    const { data: users } = await supabase
      .from('user_profiles')
      .select('id, name, email, avatar_url')
      .in('id', userIds);

    if (users) {
      const userProfiles = users as UserProfile[];
      if (task.assignee_id) {
        (task as Record<string, unknown>).assignee = userProfiles.find((u) => u.id === task.assignee_id) || null;
      }
      if (task.created_by) {
        (task as Record<string, unknown>).creator = userProfiles.find((u) => u.id === task.created_by) || null;
      }
    }
  }

  // Get task activity
  const { data: activityRaw } = await supabase
    .from('task_activity')
    .select('*')
    .eq('task_id', taskId)
    .order('created_at', { ascending: false });

  // Fetch user profiles for activity separately and transform
  let activity: Array<{
    id: string;
    action: string;
    old_value: string | null;
    new_value: string | null;
    comment: string | null;
    created_at: string;
    user: { id: string; name: string; avatar_url: string | null } | null;
  }> = [];
  if (activityRaw && activityRaw.length > 0) {
    const records = activityRaw as ActivityRecord[];
    const activityUserIds = records
      .filter((a) => a.user_id)
      .map((a) => a.user_id as string);

    const activityUsers: Record<string, UserProfile> = {};
    if (activityUserIds.length > 0) {
      const { data: users } = await supabase
        .from('user_profiles')
        .select('id, name, avatar_url')
        .in('id', activityUserIds);

      if (users) {
        (users as UserProfile[]).forEach((u) => {
          activityUsers[u.id] = u;
        });
      }
    }

    // Transform activity to match Activity type from TaskActivityLog
    // Infer action from data since action column doesn't exist
    activity = records.map((a) => ({
      id: a.id,
      action: a.comment ? 'comment' : a.old_value ? 'updated' : 'created',
      old_value: a.old_value,
      new_value: a.new_value,
      comment: a.comment,
      created_at: a.created_at,
      user: a.user_id && activityUsers[a.user_id] ? activityUsers[a.user_id] : null,
    }));
  }

  // Get task dependencies (tasks that this task depends on)
  const { data: dependenciesRaw } = await supabase
    .from('task_dependencies')
    .select(`
      id,
      task_id,
      depends_on_task_id,
      depends_on_task:tasks!depends_on_task_id (
        id,
        title,
        status
      )
    `)
    .eq('task_id', taskId);

  // Transform dependencies to match Dependency type expected by TaskDependencies
  interface DependencyRecord {
    id: string;
    task_id: string;
    depends_on_task_id: string;
    depends_on_task: { id: string; title: string; status: string } | null;
  }
  const dependencies = (dependenciesRaw as DependencyRecord[] || [])
    .filter((d) => d.depends_on_task !== null)
    .map((d) => ({
      id: d.id,
      depends_on_task_id: d.depends_on_task_id,
      depends_on: d.depends_on_task!,
    }));

  // Get tasks that depend on this task (tasks blocked by this task)
  const { data: dependentsRaw } = await supabase
    .from('task_dependencies')
    .select(`
      id,
      task_id,
      depends_on_task_id,
      blocking_task:tasks!task_id (
        id,
        title,
        status
      )
    `)
    .eq('depends_on_task_id', taskId);

  // Transform dependents to match Dependent type expected by TaskDependencies
  interface DependentRecord {
    id: string;
    task_id: string;
    depends_on_task_id: string;
    blocking_task: { id: string; title: string; status: string } | null;
  }
  const dependents = (dependentsRaw as DependentRecord[] || [])
    .filter((d) => d.blocking_task !== null)
    .map((d) => ({
      id: d.id,
      task_id: d.task_id,
      task: d.blocking_task!,
    }));

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
