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
