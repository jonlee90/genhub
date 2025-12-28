'use server';

import { revalidatePath, revalidateTag } from 'next/cache';
import { z } from 'zod';
import { createClient } from '@/utils/supabase/server';
import { auth } from '@/lib/auth';
import type { Database } from '@/types/database.types';
import { getProjectTemplate, type ProjectType } from '@/lib/default-project-templates';

type Project = Database['public']['Tables']['projects']['Row'];
type ProjectInsert = Database['public']['Tables']['projects']['Insert'];
type ProjectUpdate = Database['public']['Tables']['projects']['Update'];

// ============================================
// Project Stats Types (for enhanced ProjectCard)
// ============================================

export interface TaskCounts {
  total: number;
  completed: number;
  in_progress: number;
  blocked: number;
  overdue: number;
  todo: number;
}

export interface ScheduleStatus {
  daysRemaining: number;
  status: 'on-time' | 'at-risk' | 'delayed';
  daysBehind: number;
}

export interface MaterialsStatus {
  needed: number;
  ordered: number;
  delivered: number;
}

export interface ProjectStats {
  actualSpent: number;
  plannedCost: number;
  budgetVariance: number;
  isUnderBudget: boolean;
  taskCounts: TaskCounts;
  schedule: ScheduleStatus;
  materials: MaterialsStatus;
  teamSize: number;
}

export interface ProjectWithStats extends Project {
  stats: ProjectStats;
  project_phases?: Array<{
    id: string;
    name: string;
    order_index: number;
    status: string;
    completion_percentage: number | null;
  }>;
  project_team?: Array<{
    id: string;
    user_id: string | null;
    role: string;
  }>;
}

// ============================================
// Validation Schemas
// ============================================

const createProjectSchema = z.object({
  name: z.string().min(1, 'Project name is required').max(200),
  client_name: z.string().min(1, 'Client name is required').max(200),
  client_email: z.string().email('Invalid email').optional().or(z.literal('')),
  client_phone: z.string().optional(),
  address: z.string().min(1, 'Address is required'),
  city: z.string().optional(),
  state: z.string().optional(),
  zip_code: z.string().optional(),
  project_type: z.enum(['residential', 'restaurant_cafe', 'commercial_office', 'industrial']),
  description: z.string().optional(),
  start_date: z.string().min(1, 'Start date is required'), // ISO date string
  end_date: z.string().optional().or(z.literal('')),
  budget: z.number().positive('Budget must be positive').optional().or(z.literal(0)),
});

const updateProjectSchema = z.object({
  id: z.string().uuid('Invalid project ID'),
  name: z.string().min(1, 'Project name is required').max(200).optional(),
  client_name: z.string().min(1, 'Client name is required').max(200).optional(),
  client_email: z.string().email('Invalid email').optional().or(z.literal('')),
  client_phone: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zip_code: z.string().optional(),
  project_type: z.enum(['residential', 'restaurant_cafe', 'commercial_office', 'industrial']).optional(),
  description: z.string().optional(),
  start_date: z.string().optional(),
  end_date: z.string().optional().or(z.literal('')),
  budget: z.number().positive('Budget must be positive').optional().or(z.literal(0)),
});

const updateProjectStatusSchema = z.object({
  id: z.string().uuid('Invalid project ID'),
  status: z.enum(['active', 'on_hold', 'completed', 'archived']),
});

// ============================================
// Helper Functions
// ============================================

async function getUserContext() {
  // Get NextAuth session
  const session = await auth();

  if (!session?.user?.id) {
    return { error: 'Not authenticated' };
  }

  // Create Supabase client
  const supabase = await createClient();

  // Get user's company and role using NextAuth user ID
  const { data: companyUser, error: companyError } = await supabase
    .from('company_users')
    .select('company_id, role, status')
    .eq('user_id', session.user.id)
    .eq('status', 'active')
    .maybeSingle();

  if (companyError || !companyUser) {
    return { error: 'No active company found for user' };
  }

  return {
    userId: session.user.id,
    companyId: companyUser.company_id,
    role: companyUser.role,
    supabase,
  };
}

// ============================================
// Server Actions
// ============================================

export async function createProject(formData: FormData) {
  // Get user's company and role
  const userContext = await getUserContext();
  if ('error' in userContext) {
    console.error('User context error:', userContext.error);
    return { error: userContext.error };
  }

  const { userId, companyId, role, supabase } = userContext;
  console.log('Creating project with context:', { userId, companyId, role });

  // Check permissions - only GC Admin and Project Manager can create projects
  if (role !== 'gc_admin' && role !== 'project_manager') {
    return { error: 'Insufficient permissions to create projects' };
  }

  // Parse and validate form data
  const rawData = {
    name: formData.get('name'),
    client_name: formData.get('client_name'),
    client_email: formData.get('client_email') || '',
    client_phone: formData.get('client_phone') || '',
    address: formData.get('address'),
    city: formData.get('city') || '',
    state: formData.get('state') || '',
    zip_code: formData.get('zip_code') || '',
    project_type: formData.get('project_type'),
    description: formData.get('description') || '',
    start_date: formData.get('start_date'),
    end_date: formData.get('end_date') || '',
    budget: formData.get('budget') ? parseFloat(formData.get('budget') as string) : 0,
  };

  const validation = createProjectSchema.safeParse(rawData);

  if (!validation.success) {
    const errors = validation.error.flatten().fieldErrors;
    return { error: 'Validation failed', fieldErrors: errors };
  }

  const data = validation.data;

  // Prepare project data for insertion
  const projectData: ProjectInsert = {
    company_id: companyId,
    name: data.name,
    client_name: data.client_name,
    client_email: data.client_email || null,
    client_phone: data.client_phone || null,
    address: data.address,
    city: data.city || null,
    state: data.state || null,
    zip_code: data.zip_code || null,
    project_type: data.project_type,
    description: data.description || null,
    start_date: data.start_date,
    end_date: data.end_date || null,
    budget: data.budget || null,
    status: 'active',
    created_by: userId,
  };

  // Insert project
  const { data: project, error: insertError } = await supabase
    .from('projects')
    .insert(projectData)
    .select()
    .single();

  if (insertError) {
    console.error('Error creating project:', insertError);
    console.error('Error details:', {
      code: insertError.code,
      message: insertError.message,
      details: insertError.details,
      hint: insertError.hint,
    });
    return {
      error: `Failed to create project: ${insertError.message}`,
      details: process.env.NODE_ENV === 'development' ? insertError : undefined
    };
  }

  // Create default tasks based on project type
  // Note: Phases are automatically created by database trigger 'create_project_phases'
  try {
    const template = getProjectTemplate(data.project_type as ProjectType);
    console.log(`Fetching phases for project ${project.id} to create default tasks`);

    // Query for phases created by the database trigger
    const { data: existingPhases, error: phasesQueryError } = await supabase
      .from('project_phases')
      .select('id, name, order_index')
      .eq('project_id', project.id)
      .order('order_index');

    if (phasesQueryError) {
      console.error('❌ PHASE QUERY FAILED:', phasesQueryError);
    } else if (existingPhases && existingPhases.length > 0) {
      console.log(`Found ${existingPhases.length} phases created by trigger`);

      // Create tasks for each phase
      const allTasks: Array<{
        project_id: string;
        phase_id: string;
        title: string;
        description: string | null;
        status: 'todo';
        created_by: string;
      }> = [];

      // Match existing phases with templates to create tasks
      for (const phase of existingPhases) {
        const phaseTemplate = template.phases.find(
          p => p.order_index === phase.order_index
        );

        if (phaseTemplate) {
          const phaseTasks = phaseTemplate.tasks.map(task => ({
            project_id: project.id,
            phase_id: phase.id,
            title: task.title,
            description: task.description || null,
            status: 'todo' as const,
            created_by: userId,
          }));

          allTasks.push(...phaseTasks);
        }
      }

      if (allTasks.length > 0) {
        console.log(`Attempting to create ${allTasks.length} tasks`);
        const { error: tasksError } = await supabase
          .from('tasks')
          .insert(allTasks);

        if (tasksError) {
          console.error('❌ TASK INSERT FAILED:', tasksError);
          console.error('Task error details:', {
            code: tasksError.code,
            message: tasksError.message,
            details: tasksError.details,
            hint: tasksError.hint,
          });
        } else {
          console.log(`✅ Successfully created ${allTasks.length} tasks across ${existingPhases.length} phases`);
        }
      } else {
        console.log('No tasks to create from template');
      }
    } else {
      console.log('No phases found for project - trigger may not have fired');
    }
  } catch (templateError) {
    console.error('Error creating default tasks:', templateError);
  }

  // Revalidate projects list and related caches
  revalidatePath('/app/projects');
  revalidatePath('/app');
  revalidateTag('projects');
  revalidateTag('dashboard');

  return { success: true, project };
}

export async function updateProject(formData: FormData) {
  // Get user's company and role
  const userContext = await getUserContext();
  if ('error' in userContext) {
    return { error: userContext.error };
  }

  const { companyId, role, supabase } = userContext;

  // Check permissions
  if (role !== 'gc_admin' && role !== 'project_manager') {
    return { error: 'Insufficient permissions to update projects' };
  }

  // Parse and validate form data
  const rawData = {
    id: formData.get('id'),
    name: formData.get('name'),
    client_name: formData.get('client_name'),
    client_email: formData.get('client_email') || '',
    client_phone: formData.get('client_phone') || '',
    address: formData.get('address'),
    city: formData.get('city') || '',
    state: formData.get('state') || '',
    zip_code: formData.get('zip_code') || '',
    project_type: formData.get('project_type'),
    description: formData.get('description') || '',
    start_date: formData.get('start_date'),
    end_date: formData.get('end_date') || '',
    budget: formData.get('budget') ? parseFloat(formData.get('budget') as string) : 0,
  };

  const validation = updateProjectSchema.safeParse(rawData);

  if (!validation.success) {
    const errors = validation.error.flatten().fieldErrors;
    return { error: 'Validation failed', fieldErrors: errors };
  }

  const { id, ...updateData } = validation.data;

  // Verify project belongs to user's company
  const { data: existingProject, error: fetchError } = await supabase
    .from('projects')
    .select('company_id')
    .eq('id', id)
    .single();

  if (fetchError || !existingProject) {
    return { error: 'Project not found' };
  }

  if (existingProject.company_id !== companyId) {
    return { error: 'Insufficient permissions to update this project' };
  }

  // Prepare update data
  const projectUpdate: ProjectUpdate = {
    ...updateData,
    client_email: updateData.client_email || null,
    client_phone: updateData.client_phone || null,
    city: updateData.city || null,
    state: updateData.state || null,
    zip_code: updateData.zip_code || null,
    description: updateData.description || null,
    end_date: updateData.end_date || null,
    budget: updateData.budget || null,
  };

  // Update project
  const { data: project, error: updateError } = await supabase
    .from('projects')
    .update(projectUpdate)
    .eq('id', id)
    .select()
    .single();

  if (updateError) {
    console.error('Error updating project:', updateError);
    return { error: 'Failed to update project. Please try again.' };
  }

  // Revalidate paths and related caches
  revalidatePath('/app/projects');
  revalidatePath(`/app/projects/${id}`);
  revalidateTag('projects');
  revalidateTag(`project-${id}`);

  return { success: true, project };
}

export async function updateProjectStatus(projectId: string, status: 'active' | 'on_hold' | 'completed' | 'archived') {
  // Get user's company and role
  const userContext = await getUserContext();
  if ('error' in userContext) {
    return { error: userContext.error };
  }

  const { companyId, role, supabase } = userContext;

  // Check permissions
  if (role !== 'gc_admin' && role !== 'project_manager') {
    return { error: 'Insufficient permissions to update project status' };
  }

  // Validate input
  const validation = updateProjectStatusSchema.safeParse({ id: projectId, status });

  if (!validation.success) {
    return { error: 'Invalid input' };
  }

  // Verify project belongs to user's company
  const { data: existingProject, error: fetchError } = await supabase
    .from('projects')
    .select('company_id')
    .eq('id', projectId)
    .single();

  if (fetchError || !existingProject) {
    return { error: 'Project not found' };
  }

  if (existingProject.company_id !== companyId) {
    return { error: 'Insufficient permissions to update this project' };
  }

  // Update project status
  const { data: project, error: updateError } = await supabase
    .from('projects')
    .update({ status })
    .eq('id', projectId)
    .select()
    .single();

  if (updateError) {
    console.error('Error updating project status:', updateError);
    return { error: 'Failed to update project status. Please try again.' };
  }

  // Revalidate paths and related caches
  revalidatePath('/app/projects');
  revalidatePath(`/app/projects/${projectId}`);
  revalidateTag('projects');
  revalidateTag(`project-${projectId}`);
  revalidateTag('dashboard');

  return { success: true, project };
}

export async function assignProjectTeamMember(projectId: string, userId: string, userRole: string) {
  // Get user's company and role
  const userContext = await getUserContext();
  if ('error' in userContext) {
    return { error: userContext.error };
  }

  const { companyId, role, supabase } = userContext;

  // Check permissions
  if (role !== 'gc_admin' && role !== 'project_manager') {
    return { error: 'Insufficient permissions to assign team members' };
  }

  // Verify project belongs to user's company
  const { data: existingProject, error: fetchError } = await supabase
    .from('projects')
    .select('company_id')
    .eq('id', projectId)
    .single();

  if (fetchError || !existingProject) {
    return { error: 'Project not found' };
  }

  if (existingProject.company_id !== companyId) {
    return { error: 'Insufficient permissions to assign team to this project' };
  }

  // Verify user exists and belongs to same company
  const { data: userProfile, error: userError } = await supabase
    .from('user_profiles')
    .select('id')
    .eq('id', userId)
    .single();

  if (userError || !userProfile) {
    return { error: 'User not found' };
  }

  // Assign team member
  const { data: teamMember, error: insertError } = await supabase
    .from('project_team')
    .insert({
      project_id: projectId,
      user_id: userId,
      role: userRole as Database['public']['Enums']['user_role'],
      assigned_by: userContext.userId,
    })
    .select()
    .single();

  if (insertError) {
    console.error('Error assigning team member:', insertError);
    return { error: 'Failed to assign team member. They may already be assigned.' };
  }

  // TODO: Create notification for assigned user

  // Revalidate paths and related caches
  revalidatePath(`/app/projects/${projectId}`);
  revalidateTag(`project-${projectId}`);

  return { success: true, teamMember };
}

export async function removeProjectTeamMember(projectId: string, userId: string) {
  // Get user's company and role
  const userContext = await getUserContext();
  if ('error' in userContext) {
    return { error: userContext.error };
  }

  const { companyId, role, supabase } = userContext;

  // Check permissions
  if (role !== 'gc_admin' && role !== 'project_manager') {
    return { error: 'Insufficient permissions to remove team members' };
  }

  // Verify project belongs to user's company
  const { data: existingProject, error: fetchError } = await supabase
    .from('projects')
    .select('company_id')
    .eq('id', projectId)
    .single();

  if (fetchError || !existingProject) {
    return { error: 'Project not found' };
  }

  if (existingProject.company_id !== companyId) {
    return { error: 'Insufficient permissions to manage this project team' };
  }

  // Remove team member
  const { error: deleteError } = await supabase
    .from('project_team')
    .delete()
    .eq('project_id', projectId)
    .eq('user_id', userId);

  if (deleteError) {
    console.error('Error removing team member:', deleteError);
    return { error: 'Failed to remove team member. Please try again.' };
  }

  // Revalidate paths and related caches
  revalidatePath(`/app/projects/${projectId}`);
  revalidateTag(`project-${projectId}`);

  return { success: true };
}

// ============================================
// Enhanced Project Fetch with Stats
// ============================================

/**
 * Calculate schedule status based on end date and completion percentage
 * @param endDate - Project end date
 * @param completionPercentage - Current completion percentage
 * @param startDate - Project start date
 */
function calculateScheduleStatus(
  endDate: string | null,
  completionPercentage: number,
  startDate: string | null
): ScheduleStatus {
  // Default values if no end date
  if (!endDate) {
    return {
      daysRemaining: 0,
      status: 'on-time',
      daysBehind: 0,
    };
  }

  const now = new Date();
  const end = new Date(endDate);
  const daysRemaining = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

  // Calculate expected progress based on timeline
  let expectedProgress = 100;
  if (startDate) {
    const start = new Date(startDate);
    const totalDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    const elapsedDays = Math.ceil((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    expectedProgress = Math.min(100, Math.max(0, (elapsedDays / totalDays) * 100));
  }

  // Calculate days behind based on progress difference
  const progressDifference = expectedProgress - completionPercentage;
  const daysBehind = Math.max(0, Math.round((progressDifference / 100) * daysRemaining));

  // Determine status
  let status: 'on-time' | 'at-risk' | 'delayed' = 'on-time';
  if (daysRemaining < 0) {
    status = 'delayed'; // Past due date
  } else if (daysBehind > 5) {
    status = 'delayed';
  } else if (daysBehind >= 1) {
    status = 'at-risk';
  }

  console.log('[getProjectsWithStats] Schedule calculation:', {
    endDate,
    daysRemaining,
    expectedProgress: expectedProgress.toFixed(1),
    actualProgress: completionPercentage,
    daysBehind,
    status,
  });

  return {
    daysRemaining: Math.max(0, daysRemaining),
    status,
    daysBehind,
  };
}

/**
 * Get all projects for the user's company with enhanced stats for ProjectCard
 * Includes: task counts, budget variance, schedule status, materials status
 */
export async function getProjectsWithStats(): Promise<{
  projects?: ProjectWithStats[];
  error?: string
}> {
  console.log('[getProjectsWithStats] Starting enhanced project fetch...');

  // Get user context
  const userContext = await getUserContext();
  if ('error' in userContext) {
    console.error('[getProjectsWithStats] User context error:', userContext.error);
    return { error: userContext.error };
  }

  const { companyId, supabase } = userContext;
  console.log('[getProjectsWithStats] Fetching for company:', companyId);

  try {
    // 1. Fetch projects with phases and team
    const { data: projects, error: projectsError } = await supabase
      .from('projects')
      .select(`
        *,
        project_phases (
          id,
          name,
          order_index,
          status,
          completion_percentage
        ),
        project_team (
          id,
          user_id,
          role
        )
      `)
      .eq('company_id', companyId)
      .order('created_at', { ascending: false });

    if (projectsError) {
      console.error('[getProjectsWithStats] Error fetching projects:', projectsError);
      return { error: 'Failed to fetch projects' };
    }

    if (!projects || projects.length === 0) {
      console.log('[getProjectsWithStats] No projects found');
      return { projects: [] };
    }

    console.log(`[getProjectsWithStats] Found ${projects.length} projects`);

    // 2. Fetch task counts for all projects in a single query
    const projectIds = projects.map(p => p.id);

    // Get all tasks for these projects
    const { data: tasks, error: tasksError } = await supabase
      .from('tasks')
      .select('id, project_id, status, due_date, actual_cost, planned_cost')
      .in('project_id', projectIds);

    if (tasksError) {
      console.error('[getProjectsWithStats] Error fetching tasks:', tasksError);
      // Continue with empty task counts rather than failing
    }

    // 3. Fetch material assignments for all projects
    const { data: materials, error: materialsError } = await supabase
      .from('material_assignments')
      .select('id, project_id, procurement_status, total_cost')
      .in('project_id', projectIds);

    if (materialsError) {
      console.error('[getProjectsWithStats] Error fetching materials:', materialsError);
      // Continue with empty materials rather than failing
    }

    // 4. Process and calculate stats for each project
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const projectsWithStats: ProjectWithStats[] = projects.map(project => {
      // Filter tasks for this project
      const projectTasks = tasks?.filter(t => t.project_id === project.id) || [];

      // Calculate task counts
      const taskCounts: TaskCounts = {
        total: projectTasks.length,
        completed: projectTasks.filter(t => t.status === 'completed').length,
        in_progress: projectTasks.filter(t => t.status === 'in_progress').length,
        blocked: projectTasks.filter(t => t.status === 'blocked').length,
        todo: projectTasks.filter(t => t.status === 'todo').length,
        overdue: projectTasks.filter(t => {
          if (!t.due_date || t.status === 'completed') return false;
          const dueDate = new Date(t.due_date);
          dueDate.setHours(0, 0, 0, 0);
          return dueDate < today;
        }).length,
      };

      // Calculate budget variance from task costs
      const actualSpent = projectTasks.reduce((sum, t) => sum + (Number(t.actual_cost) || 0), 0);
      const plannedCost = projectTasks.reduce((sum, t) => sum + (Number(t.planned_cost) || 0), 0);
      const budget = Number(project.budget) || 0;
      const budgetVariance = budget - actualSpent;
      const isUnderBudget = budgetVariance >= 0;

      // Calculate schedule status
      const schedule = calculateScheduleStatus(
        project.end_date,
        project.completion_percentage || 0,
        project.start_date
      );

      // Filter materials for this project
      const projectMaterials = materials?.filter(m => m.project_id === project.id) || [];

      // Calculate materials status
      const materialsStatus: MaterialsStatus = {
        needed: projectMaterials.filter(m => m.procurement_status === 'needed').length,
        ordered: projectMaterials.filter(m => m.procurement_status === 'ordered').length,
        delivered: projectMaterials.filter(m => m.procurement_status === 'delivered').length,
      };

      // Add material costs to actual spent
      const materialCosts = projectMaterials.reduce((sum, m) => sum + (Number(m.total_cost) || 0), 0);
      const totalActualSpent = actualSpent + materialCosts;

      // Team size
      const teamSize = project.project_team?.length || 0;

      const stats: ProjectStats = {
        actualSpent: totalActualSpent,
        plannedCost,
        budgetVariance: budget - totalActualSpent,
        isUnderBudget: (budget - totalActualSpent) >= 0,
        taskCounts,
        schedule,
        materials: materialsStatus,
        teamSize,
      };

      console.log(`[getProjectsWithStats] Stats for "${project.name}":`, {
        taskCounts,
        budget,
        actualSpent: totalActualSpent,
        scheduleStatus: schedule.status,
        materialsNeeded: materialsStatus.needed,
      });

      return {
        ...project,
        stats,
      } as ProjectWithStats;
    });

    console.log(`[getProjectsWithStats] Successfully processed ${projectsWithStats.length} projects with stats`);
    return { projects: projectsWithStats };

  } catch (error) {
    console.error('[getProjectsWithStats] Unexpected error:', error);
    return { error: 'An unexpected error occurred' };
  }
}

/**
 * Get a single project with enhanced stats
 */
export async function getProjectWithStats(projectId: string): Promise<{
  project?: ProjectWithStats;
  error?: string;
}> {
  console.log('[getProjectWithStats] Fetching project:', projectId);

  // Get user context
  const userContext = await getUserContext();
  if ('error' in userContext) {
    return { error: userContext.error };
  }

  const { companyId, supabase } = userContext;

  try {
    // 1. Fetch project with phases and team
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select(`
        *,
        project_phases (
          id,
          name,
          order_index,
          status,
          completion_percentage
        ),
        project_team (
          id,
          user_id,
          role
        )
      `)
      .eq('id', projectId)
      .eq('company_id', companyId)
      .single();

    if (projectError || !project) {
      console.error('[getProjectWithStats] Error fetching project:', projectError);
      return { error: 'Project not found' };
    }

    // 2. Fetch tasks for this project
    const { data: tasks } = await supabase
      .from('tasks')
      .select('id, status, due_date, actual_cost, planned_cost')
      .eq('project_id', projectId);

    // 3. Fetch materials for this project
    const { data: materials } = await supabase
      .from('material_assignments')
      .select('id, procurement_status, total_cost')
      .eq('project_id', projectId);

    // 4. Calculate stats
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const projectTasks = tasks || [];

    const taskCounts: TaskCounts = {
      total: projectTasks.length,
      completed: projectTasks.filter(t => t.status === 'completed').length,
      in_progress: projectTasks.filter(t => t.status === 'in_progress').length,
      blocked: projectTasks.filter(t => t.status === 'blocked').length,
      todo: projectTasks.filter(t => t.status === 'todo').length,
      overdue: projectTasks.filter(t => {
        if (!t.due_date || t.status === 'completed') return false;
        const dueDate = new Date(t.due_date);
        dueDate.setHours(0, 0, 0, 0);
        return dueDate < today;
      }).length,
    };

    const actualSpent = projectTasks.reduce((sum, t) => sum + (Number(t.actual_cost) || 0), 0);
    const plannedCost = projectTasks.reduce((sum, t) => sum + (Number(t.planned_cost) || 0), 0);
    const budget = Number(project.budget) || 0;

    const schedule = calculateScheduleStatus(
      project.end_date,
      project.completion_percentage || 0,
      project.start_date
    );

    const projectMaterials = materials || [];
    const materialsStatus: MaterialsStatus = {
      needed: projectMaterials.filter(m => m.procurement_status === 'needed').length,
      ordered: projectMaterials.filter(m => m.procurement_status === 'ordered').length,
      delivered: projectMaterials.filter(m => m.procurement_status === 'delivered').length,
    };

    const materialCosts = projectMaterials.reduce((sum, m) => sum + (Number(m.total_cost) || 0), 0);
    const totalActualSpent = actualSpent + materialCosts;

    const stats: ProjectStats = {
      actualSpent: totalActualSpent,
      plannedCost,
      budgetVariance: budget - totalActualSpent,
      isUnderBudget: (budget - totalActualSpent) >= 0,
      taskCounts,
      schedule,
      materials: materialsStatus,
      teamSize: project.project_team?.length || 0,
    };

    return {
      project: {
        ...project,
        stats,
      } as ProjectWithStats,
    };

  } catch (error) {
    console.error('[getProjectWithStats] Unexpected error:', error);
    return { error: 'An unexpected error occurred' };
  }
}
