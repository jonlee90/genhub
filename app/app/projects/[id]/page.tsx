import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import { createClient } from '@/utils/supabase/server';
import { auth } from '@/lib/auth';
import { ChevronLeft } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ProjectDetailContent } from '@/components/projects/ProjectDetailContent';
import type { Database } from '@/types/database.types';

type Project = Database['public']['Tables']['projects']['Row'];

async function getProjectData(id: string) {
  const supabase = await createClient();
  const session = await auth();

  if (!session?.user?.id) {
    return null;
  }

  // Get user's company
  const { data: companyUser } = await supabase
    .from('company_users')
    .select('company_id')
    .eq('user_id', session.user.id)
    .eq('status', 'active')
    .maybeSingle();

  if (!companyUser) {
    return null;
  }

  // Get all projects for this company (for modal)
  const { data: projects } = await supabase
    .from('projects')
    .select('id, name, project_phases(id, name, order_index)')
    .eq('company_id', companyUser.company_id)
    .order('name');

  // Get all team members for this company (for modal)
  const { data: teamMembersData } = await supabase
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

  const teamMembers = teamMembersData?.map((tm) => tm.user_profiles) || [];

  // Get the specific project
  const { data: project, error } = await supabase
    .from('projects')
    .select(`
      *,
      project_phases(
        id,
        name,
        order_index,
        status,
        completion_percentage,
        started_at,
        completed_at,
        notes
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
        description,
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
        blocked_reason,
        created_by,
        created_at
      )
    `)
    .eq('id', id)
    .single();

  // Fetch creator profile if project has created_by
  if (project && project.created_by) {
    const { data: creator } = await supabase
      .from('user_profiles')
      .select('id, name, email, avatar_url')
      .eq('id', project.created_by)
      .single();

    if (creator) {
      (project as any).creator = creator;
    }
  }

  if (error || !project) {
    console.log('Error fetching project:', error);
    return null;
  }

  // Fetch user profiles and subcontractors for team members separately
  if (project.project_team && project.project_team.length > 0) {
    const userIds = project.project_team
      .filter((t: any) => t.user_id)
      .map((t: any) => t.user_id);
    const subcontractorIds = project.project_team
      .filter((t: any) => t.subcontractor_id)
      .map((t: any) => t.subcontractor_id);

    // Fetch user profiles
    if (userIds.length > 0) {
      const { data: profiles } = await supabase
        .from('user_profiles')
        .select('id, name, email, avatar_url')
        .in('id', userIds);

      // Attach profiles to team members
      if (profiles) {
        (project.project_team as any[]).forEach((member: any) => {
          if (member.user_id) {
            member.user_profiles = profiles.find((p: any) => p.id === member.user_id) || null;
          }
        });
      }
    }

    // Fetch subcontractors
    if (subcontractorIds.length > 0) {
      const { data: subs } = await supabase
        .from('subcontractors')
        .select('id, company_name, contact_name, trade_specialization')
        .in('id', subcontractorIds);

      // Attach subcontractors to team members
      if (subs) {
        (project.project_team as any[]).forEach((member: any) => {
          if (member.subcontractor_id) {
            member.subcontractors = subs.find((s: any) => s.id === member.subcontractor_id) || null;
          }
        });
      }
    }
  }

  // Attach phase information to tasks
  if (project.tasks && project.project_phases) {
    (project.tasks as any[]).forEach((task: any) => {
      if (task.phase_id) {
        task.phase = project.project_phases.find((p: any) => p.id === task.phase_id) || null;
      }
    });
  }

  // Fetch assignees for tasks
  if (project.tasks && project.tasks.length > 0) {
    const assigneeIds = project.tasks
      .filter((t: any) => t.assignee_id)
      .map((t: any) => t.assignee_id);

    if (assigneeIds.length > 0) {
      const { data: assignees } = await supabase
        .from('user_profiles')
        .select('id, name, email, avatar_url')
        .in('id', assigneeIds);

      if (assignees) {
        (project.tasks as any[]).forEach((task: any) => {
          if (task.assignee_id) {
            task.assignee = assignees.find((a: any) => a.id === task.assignee_id) || null;
          }
        });
      }
    }

    // Fetch material assignment counts and totals for each task
    const taskIds = project.tasks.map((t: any) => t.id);
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
      (project.tasks as any[]).forEach((task: any) => {
        task.materialStats = statsByTask[task.id] || { count: 0, totalCost: 0 };
      });
    }
  }

  // Fetch task dependencies for Gantt chart
  let taskDependencies: any[] = [];
  if (project.tasks && project.tasks.length > 0) {
    const taskIds = project.tasks.map((t: any) => t.id);
    if (taskIds.length > 0) {
      const { data: dependencies } = await supabase
        .from('task_dependencies')
        .select('*')
        .or(`task_id.in.(${taskIds.join(',')}),depends_on_task_id.in.(${taskIds.join(',')})`);

      taskDependencies = dependencies || [];
    }
  }

  // Sort phases by order_index with null-safe handling
  if (project.project_phases) {
    (project.project_phases as any[]).sort((a, b) => {
      const orderA = a.order_index ?? Number.MAX_SAFE_INTEGER;
      const orderB = b.order_index ?? Number.MAX_SAFE_INTEGER;
      return orderA - orderB;
    });
  }

  // Calculate task stats per phase
  const phaseTaskStats = project.project_phases?.map((phase: any) => {
    const phaseTasks = project.tasks?.filter((t: any) => t.phase_id === phase.id) || [];
    const completedTasks = phaseTasks.filter((t: any) => t.status === 'completed').length;
    const blockedTasks = phaseTasks.filter((t: any) => t.status === 'blocked').length;
    const overdueTasks = phaseTasks.filter(
      (t: any) => t.due_date && new Date(t.due_date) < new Date() && t.status !== 'completed'
    ).length;

    return {
      phaseId: phase.id,
      totalTasks: phaseTasks.length,
      completedTasks,
      blockedTasks,
      overdueTasks,
    };
  });

  // Fetch expense stats for this project
  const { data: expenses, error: expensesError } = await supabase
    .from('expenses')
    .select('id, amount, status')
    .eq('project_id', id);

  // Fix H2: Add error handling for expense query
  if (expensesError) {
    console.error('[getProjectData] Error fetching expenses:', expensesError);
  }

  // Fix C3: Safe default for null expenses (already handled)
  const projectExpenses = expenses || [];
  const expenseStats = {
    total: projectExpenses.length,
    approved: projectExpenses.filter(e => e.status === 'approved').length,
    pending: projectExpenses.filter(e => e.status === 'submitted').length,
    rejected: projectExpenses.filter(e => e.status === 'rejected').length,
    totalAmount: projectExpenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0),
    approvedAmount: projectExpenses
      .filter(e => e.status === 'approved')
      .reduce((sum, e) => sum + (Number(e.amount) || 0), 0),
    pendingAmount: projectExpenses
      .filter(e => e.status === 'submitted')
      .reduce((sum, e) => sum + (Number(e.amount) || 0), 0),
    rejectedAmount: projectExpenses
      .filter(e => e.status === 'rejected')
      .reduce((sum, e) => sum + (Number(e.amount) || 0), 0),
  };

  console.log('[getProjectData] Expense stats:', expenseStats);

  // Fetch active 3D model for this project
  const { data: activeModel } = await supabase
    .from('projects_3d_models')
    .select('*')
    .eq('project_id', id)
    .eq('is_active', true)
    .eq('processing_status', 'ready')
    .maybeSingle();

  console.log('[getProjectData] Active 3D model:', activeModel);

  return { project, projects: projects || [], teamMembers, phaseTaskStats, taskDependencies, expenseStats, activeModel };
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

  const { project, projects, teamMembers, phaseTaskStats, taskDependencies, expenseStats, activeModel } = data;

  console.log('[ProjectDetailPage] Loading project:', id, 'with expense stats:', expenseStats);

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
      <div className="relative z-10 flex-1 space-y-6 p-8 pt-6">
        {/* Industrial Header */}
        <div className="relative">
          {/* Construction border */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-construction-blue" />

          {/* Breadcrumb Navigation */}
          <div className="flex items-center gap-3 pt-4 mb-6">
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
          projects={projects}
          teamMembers={teamMembers}
          phaseTaskStats={phaseTaskStats || []}
          taskDependencies={taskDependencies || []}
          expenseStats={expenseStats}
          activeModel={activeModel || null}
        />
      </div>
    </div>
  );
}
