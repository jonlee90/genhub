'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { createClient } from '@/utils/supabase/server';
import { auth } from '@/lib/auth';
import type { Database } from '@/types/database.types';

type PhaseStatus = Database['public']['Enums']['phase_status'];

// ============================================
// Validation Schemas
// ============================================

const updatePhaseStatusSchema = z.object({
  phaseId: z.string().uuid('Invalid phase ID'),
  status: z.enum(['not_started', 'in_progress', 'completed', 'on_hold']),
});

const updatePhaseSchema = z.object({
  phaseId: z.string().uuid('Invalid phase ID'),
  started_at: z.string().optional().nullable(),
  completed_at: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
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
    .single();

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

async function verifyPhaseAccess(supabase: Awaited<ReturnType<typeof createClient>>, phaseId: string, companyId: string) {
  // Get phase with project info
  const { data: phase, error: fetchError } = await supabase
    .from('project_phases')
    .select(`
      id,
      project_id,
      status,
      projects!inner (
        id,
        company_id
      )
    `)
    .eq('id', phaseId)
    .single();

  if (fetchError || !phase) {
    return { error: 'Phase not found' };
  }

  // TypeScript needs help with the nested type
  const project = phase.projects as unknown as { id: string; company_id: string };

  if (project.company_id !== companyId) {
    return { error: 'Insufficient permissions to access this phase' };
  }

  return { phase, projectId: project.id };
}

// ============================================
// Server Actions
// ============================================

/**
 * Update a phase's status
 * Only GC Admin and Project Manager can update phase status
 */
export async function updatePhaseStatus(phaseId: string, status: PhaseStatus) {
  // Get user's company and role
  const userContext = await getUserContext();
  if ('error' in userContext) {
    return { error: userContext.error };
  }

  const { companyId, role, supabase } = userContext;

  // Check permissions
  if (role !== 'gc_admin' && role !== 'project_manager') {
    return { error: 'Insufficient permissions to update phase status' };
  }

  // Validate input
  const validation = updatePhaseStatusSchema.safeParse({ phaseId, status });
  if (!validation.success) {
    return { error: 'Invalid input' };
  }

  // Verify phase access
  const accessCheck = await verifyPhaseAccess(supabase, phaseId, companyId);
  if ('error' in accessCheck) {
    return { error: accessCheck.error };
  }

  const { projectId } = accessCheck;

  // Prepare update data
  const updateData: { status: PhaseStatus; started_at?: string | null; completed_at?: string | null } = { status };

  // Auto-set timestamps based on status change
  if (status === 'in_progress') {
    updateData.started_at = new Date().toISOString();
  } else if (status === 'completed') {
    updateData.completed_at = new Date().toISOString();
  }

  // Update phase status
  const { data: phase, error: updateError } = await supabase
    .from('project_phases')
    .update(updateData)
    .eq('id', phaseId)
    .select()
    .single();

  if (updateError) {
    console.error('Error updating phase status:', updateError);
    return { error: 'Failed to update phase status. Please try again.' };
  }

  // Revalidate paths
  revalidatePath(`/app/projects/${projectId}`);

  return { success: true, phase };
}

/**
 * Update phase details (dates, notes)
 * Only GC Admin and Project Manager can update phase details
 */
export async function updatePhase(formData: FormData) {
  // Get user's company and role
  const userContext = await getUserContext();
  if ('error' in userContext) {
    return { error: userContext.error };
  }

  const { companyId, role, supabase } = userContext;

  // Check permissions
  if (role !== 'gc_admin' && role !== 'project_manager') {
    return { error: 'Insufficient permissions to update phase' };
  }

  // Parse form data
  const rawData = {
    phaseId: formData.get('phaseId') as string,
    started_at: formData.get('started_at') || null,
    completed_at: formData.get('completed_at') || null,
    notes: formData.get('notes') || null,
  };

  // Validate input
  const validation = updatePhaseSchema.safeParse(rawData);
  if (!validation.success) {
    return { error: 'Invalid input', fieldErrors: validation.error.flatten().fieldErrors };
  }

  const { phaseId, ...updateData } = validation.data;

  // Verify phase access
  const accessCheck = await verifyPhaseAccess(supabase, phaseId, companyId);
  if ('error' in accessCheck) {
    return { error: accessCheck.error };
  }

  const { projectId } = accessCheck;

  // Update phase
  const { data: phase, error: updateError } = await supabase
    .from('project_phases')
    .update(updateData)
    .eq('id', phaseId)
    .select()
    .single();

  if (updateError) {
    console.error('Error updating phase:', updateError);
    return { error: 'Failed to update phase. Please try again.' };
  }

  // Revalidate paths
  revalidatePath(`/app/projects/${projectId}`);

  return { success: true, phase };
}

/**
 * Get all phases for a project
 * Used for Metro Journey view
 */
export async function getProjectPhases(projectId: string) {
  const supabase = await createClient();

  // Get NextAuth session
  const session = await auth();
  if (!session?.user?.id) {
    return { error: 'Not authenticated' };
  }

  // Get user's company and role
  const { data: companyUser, error: companyError } = await supabase
    .from('company_users')
    .select('company_id, role, status')
    .eq('user_id', session.user.id)
    .eq('status', 'active')
    .maybeSingle();

  if (companyError || !companyUser) {
    return { error: 'No active company found for user' };
  }

  const companyId = companyUser.company_id;

  // Verify project access
  const { data: project, error: projectError } = await supabase
    .from('projects')
    .select('id, company_id')
    .eq('id', projectId)
    .single();

  if (projectError || !project) {
    return { error: 'Project not found' };
  }

  if (project.company_id !== companyId) {
    return { error: 'Insufficient permissions to access this project' };
  }

  // Fetch phases with task counts
  const { data: phases, error: phasesError } = await supabase
    .from('project_phases')
    .select(`
      *,
      tasks:tasks(count)
    `)
    .eq('project_id', projectId)
    .order('order_index', { ascending: true });

  if (phasesError) {
    console.error('Error fetching phases:', phasesError);
    return { error: 'Failed to load phases' };
  }

  return { success: true, phases };
}

/**
 * Start the next phase in sequence
 * Automatically marks current 'not_started' phase as 'in_progress'
 */
export async function startNextPhase(projectId: string) {
  // Get user's company and role
  const userContext = await getUserContext();
  if ('error' in userContext) {
    return { error: userContext.error };
  }

  const { companyId, role, supabase } = userContext;

  // Check permissions
  if (role !== 'gc_admin' && role !== 'project_manager') {
    return { error: 'Insufficient permissions to start phase' };
  }

  // Verify project access
  const { data: project, error: projectError } = await supabase
    .from('projects')
    .select('id, company_id')
    .eq('id', projectId)
    .single();

  if (projectError || !project) {
    return { error: 'Project not found' };
  }

  if (project.company_id !== companyId) {
    return { error: 'Insufficient permissions to access this project' };
  }

  // Get the next not_started phase
  const { data: nextPhase, error: phaseError } = await supabase
    .from('project_phases')
    .select('*')
    .eq('project_id', projectId)
    .eq('status', 'not_started')
    .order('order_index', { ascending: true })
    .limit(1)
    .single();

  if (phaseError || !nextPhase) {
    return { error: 'No pending phases to start' };
  }

  // Start the phase
  const { data: phase, error: updateError } = await supabase
    .from('project_phases')
    .update({
      status: 'in_progress',
      started_at: new Date().toISOString(),
    })
    .eq('id', nextPhase.id)
    .select()
    .single();

  if (updateError) {
    console.error('Error starting phase:', updateError);
    return { error: 'Failed to start phase. Please try again.' };
  }

  // Revalidate paths
  revalidatePath(`/app/projects/${projectId}`);

  return { success: true, phase };
}

/**
 * Complete current phase and optionally start next
 * Marks the current in_progress phase as completed
 */
export async function completeCurrentPhase(projectId: string, startNext: boolean = true) {
  // Get user's company and role
  const userContext = await getUserContext();
  if ('error' in userContext) {
    return { error: userContext.error };
  }

  const { companyId, role, supabase } = userContext;

  // Check permissions
  if (role !== 'gc_admin' && role !== 'project_manager') {
    return { error: 'Insufficient permissions to complete phase' };
  }

  // Verify project access
  const { data: project, error: projectError } = await supabase
    .from('projects')
    .select('id, company_id')
    .eq('id', projectId)
    .single();

  if (projectError || !project) {
    return { error: 'Project not found' };
  }

  if (project.company_id !== companyId) {
    return { error: 'Insufficient permissions to access this project' };
  }

  // Get the current in_progress phase
  const { data: currentPhase, error: phaseError } = await supabase
    .from('project_phases')
    .select('*')
    .eq('project_id', projectId)
    .eq('status', 'in_progress')
    .order('order_index', { ascending: true })
    .limit(1)
    .single();

  if (phaseError || !currentPhase) {
    return { error: 'No active phase to complete' };
  }

  // Complete the current phase
  const { error: updateError } = await supabase
    .from('project_phases')
    .update({
      status: 'completed',
      completed_at: new Date().toISOString(),
      completion_percentage: 100,
    })
    .eq('id', currentPhase.id);

  if (updateError) {
    console.error('Error completing phase:', updateError);
    return { error: 'Failed to complete phase. Please try again.' };
  }

  // Optionally start the next phase
  if (startNext) {
    const startResult = await startNextPhase(projectId);
    if ('error' in startResult) {
      // Not an error if no next phase (project might be complete)
      console.log('No next phase to start:', startResult.error);
    }
  }

  // Revalidate paths
  revalidatePath(`/app/projects/${projectId}`);

  return { success: true };
}

// ============================================
// Project-Level Phase CRUD Operations
// (For gc_admin and project_manager)
// ============================================

const createPhaseSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  description: z.string().max(500).optional(),
});

const updatePhaseNameSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100).optional(),
  description: z.string().max(500).optional(),
  order_index: z.number().int().min(0).optional(),
});

/**
 * Check if user has permission to manage phases within a project
 * gc_admin and project_manager (with project access) can manage phases
 */
async function checkProjectPhasePermission(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  companyId: string,
  role: string,
  projectId: string
): Promise<{ hasPermission: boolean; error?: string }> {
  // gc_admin has full access
  if (role === 'gc_admin') {
    return { hasPermission: true };
  }

  // project_manager needs to verify they have access to this project
  if (role === 'project_manager') {
    // Check if project belongs to user's company
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('id, company_id')
      .eq('id', projectId)
      .eq('company_id', companyId)
      .maybeSingle();

    if (projectError || !project) {
      return { hasPermission: false, error: 'Project not found' };
    }

    // Check if user is on the project team
    const { data: teamMember } = await supabase
      .from('project_team')
      .select('id')
      .eq('project_id', projectId)
      .eq('user_id', userId)
      .maybeSingle();

    if (teamMember) {
      return { hasPermission: true };
    }

    return {
      hasPermission: false,
      error: 'You do not have access to this project',
    };
  }

  return {
    hasPermission: false,
    error: 'Insufficient permissions. Only GC Admin and Project Manager can manage phases.',
  };
}

/**
 * Create a new phase within a project
 * Accessible to gc_admin and project_manager (with project access)
 */
export async function createPhase(
  projectId: string,
  formData: FormData
): Promise<{
  success?: boolean;
  phase?: Database['public']['Tables']['project_phases']['Row'];
  error?: string;
  fieldErrors?: Record<string, string[]>;
}> {
  console.log('[createPhase] Creating new phase for project:', projectId);

  const userContext = await getUserContext();
  if ('error' in userContext) {
    return { error: userContext.error };
  }

  const { userId, companyId, role, supabase } = userContext;

  // Check permission
  const permissionCheck = await checkProjectPhasePermission(
    supabase,
    userId,
    companyId,
    role,
    projectId
  );
  if (!permissionCheck.hasPermission) {
    return { error: permissionCheck.error || 'Insufficient permissions' };
  }

  // Parse and validate
  const rawData = {
    name: formData.get('name'),
    description: formData.get('description') || undefined,
  };

  const validation = createPhaseSchema.safeParse(rawData);
  if (!validation.success) {
    console.error('[createPhase] Validation failed:', validation.error);
    return {
      error: 'Validation failed',
      fieldErrors: validation.error.flatten().fieldErrors,
    };
  }

  // Get max order_index for this project
  const { data: maxOrder } = await supabase
    .from('project_phases')
    .select('order_index')
    .eq('project_id', projectId)
    .order('order_index', { ascending: false })
    .limit(1)
    .maybeSingle();

  const newOrderIndex = (maxOrder?.order_index ?? -1) + 1;

  // Insert
  const { data: phase, error } = await supabase
    .from('project_phases')
    .insert({
      project_id: projectId,
      ...validation.data,
      order_index: newOrderIndex,
      status: 'not_started',
    })
    .select()
    .single();

  if (error) {
    console.error('[createPhase] Error:', error);
    return { error: 'Failed to create phase' };
  }

  console.log('[createPhase] Phase created:', phase.id);
  revalidatePath(`/app/projects/${projectId}`);
  return { success: true, phase };
}

/**
 * Update an existing project phase (name, description, order)
 * Accessible to gc_admin and project_manager (with project access)
 */
export async function updatePhaseName(
  phaseId: string,
  formData: FormData
): Promise<{
  success?: boolean;
  phase?: Database['public']['Tables']['project_phases']['Row'];
  error?: string;
  fieldErrors?: Record<string, string[]>;
}> {
  console.log('[updatePhaseName] Updating phase:', phaseId);

  const userContext = await getUserContext();
  if ('error' in userContext) {
    return { error: userContext.error };
  }

  const { userId, companyId, role, supabase } = userContext;

  // Get phase to find project ID
  const { data: existingPhase } = await supabase
    .from('project_phases')
    .select('id, project_id')
    .eq('id', phaseId)
    .maybeSingle();

  if (!existingPhase) {
    return { error: 'Phase not found' };
  }

  // Check permission
  const permissionCheck = await checkProjectPhasePermission(
    supabase,
    userId,
    companyId,
    role,
    existingPhase.project_id
  );
  if (!permissionCheck.hasPermission) {
    return { error: permissionCheck.error || 'Insufficient permissions' };
  }

  const rawData = {
    name: formData.get('name') || undefined,
    description: formData.get('description') || undefined,
    order_index: formData.get('order_index')
      ? parseInt(formData.get('order_index') as string)
      : undefined,
  };

  const validation = updatePhaseNameSchema.safeParse(rawData);
  if (!validation.success) {
    console.error('[updatePhaseName] Validation failed:', validation.error);
    return {
      error: 'Validation failed',
      fieldErrors: validation.error.flatten().fieldErrors,
    };
  }

  // Update
  const { data: phase, error } = await supabase
    .from('project_phases')
    .update(validation.data)
    .eq('id', phaseId)
    .select()
    .single();

  if (error) {
    console.error('[updatePhaseName] Error:', error);
    return { error: 'Failed to update phase' };
  }

  console.log('[updatePhaseName] Phase updated:', phase.id);
  revalidatePath(`/app/projects/${existingPhase.project_id}`);
  return { success: true, phase };
}

/**
 * Delete a project phase with task handling options
 * Accessible to gc_admin and project_manager (with project access)
 *
 * @param phaseId - ID of the phase to delete
 * @param taskHandling - 'move' to move tasks to another phase, 'delete' to delete tasks
 * @param targetPhaseId - Required if taskHandling is 'move'
 */
export async function deletePhase(
  phaseId: string,
  taskHandling: 'move' | 'delete',
  targetPhaseId?: string
): Promise<{
  success?: boolean;
  error?: string;
}> {
  console.log('[deletePhase] Deleting phase:', phaseId, 'taskHandling:', taskHandling);

  const userContext = await getUserContext();
  if ('error' in userContext) {
    return { error: userContext.error };
  }

  const { userId, companyId, role, supabase } = userContext;

  // Get phase to find project ID
  const { data: existingPhase } = await supabase
    .from('project_phases')
    .select('id, project_id')
    .eq('id', phaseId)
    .maybeSingle();

  if (!existingPhase) {
    return { error: 'Phase not found' };
  }

  // Check permission
  const permissionCheck = await checkProjectPhasePermission(
    supabase,
    userId,
    companyId,
    role,
    existingPhase.project_id
  );
  if (!permissionCheck.hasPermission) {
    return { error: permissionCheck.error || 'Insufficient permissions' };
  }

  // Handle tasks based on taskHandling option
  if (taskHandling === 'move') {
    if (!targetPhaseId) {
      return { error: 'Target phase ID is required when moving tasks' };
    }

    // Verify target phase exists and belongs to same project
    const { data: targetPhase } = await supabase
      .from('project_phases')
      .select('id, project_id')
      .eq('id', targetPhaseId)
      .eq('project_id', existingPhase.project_id)
      .maybeSingle();

    if (!targetPhase) {
      return { error: 'Target phase not found or does not belong to the same project' };
    }

    // Move all tasks to target phase
    const { error: moveError } = await supabase
      .from('tasks')
      .update({ phase_id: targetPhaseId })
      .eq('phase_id', phaseId);

    if (moveError) {
      console.error('[deletePhase] Error moving tasks:', moveError);
      return { error: 'Failed to move tasks to target phase' };
    }

    console.log('[deletePhase] Tasks moved to phase:', targetPhaseId);
  } else if (taskHandling === 'delete') {
    // Delete all tasks in this phase
    const { error: deleteTasksError } = await supabase
      .from('tasks')
      .delete()
      .eq('phase_id', phaseId);

    if (deleteTasksError) {
      console.error('[deletePhase] Error deleting tasks:', deleteTasksError);
      return { error: 'Failed to delete tasks in phase' };
    }

    console.log('[deletePhase] Tasks deleted from phase:', phaseId);
  } else {
    return { error: 'Invalid task handling option. Use "move" or "delete"' };
  }

  // Delete the phase
  const { error } = await supabase
    .from('project_phases')
    .delete()
    .eq('id', phaseId);

  if (error) {
    console.error('[deletePhase] Error:', error);
    return { error: 'Failed to delete phase' };
  }

  console.log('[deletePhase] Phase deleted:', phaseId);
  revalidatePath(`/app/projects/${existingPhase.project_id}`);
  return { success: true };
}

/**
 * Apply task templates to a phase
 * Creates tasks from templates in the specified phase
 * Prevents duplicates by checking if task with same title already exists
 *
 * @param phaseId - ID of the phase to create tasks in
 * @param phaseTemplateId - ID of the phase template to get task templates from
 */
export async function applyTaskTemplates(
  phaseId: string,
  phaseTemplateId: string
): Promise<{
  success?: boolean;
  tasksCreated?: number;
  error?: string;
}> {
  console.log('[applyTaskTemplates] Applying task templates to phase:', phaseId, 'from template:', phaseTemplateId);

  const userContext = await getUserContext();
  if ('error' in userContext) {
    return { error: userContext.error };
  }

  const { userId, companyId, supabase } = userContext;

  // Get phase to find project ID and verify access
  const { data: phase } = await supabase
    .from('project_phases')
    .select('id, project_id, name')
    .eq('id', phaseId)
    .maybeSingle();

  if (!phase) {
    return { error: 'Phase not found' };
  }

  // Verify project access and get start_date for task scheduling
  const { data: project } = await supabase
    .from('projects')
    .select('id, company_id, start_date')
    .eq('id', phase.project_id)
    .maybeSingle();

  if (!project || project.company_id !== companyId) {
    return { error: 'Insufficient permissions to access this project' };
  }

  // Get task templates for this phase template
  const { data: taskTemplates, error: templatesError } = await supabase
    .from('task_templates')
    .select('*')
    .eq('phase_template_id', phaseTemplateId)
    .eq('is_active', true)
    .order('order_index', { ascending: true });

  if (templatesError) {
    console.error('[applyTaskTemplates] Error fetching task templates:', templatesError);
    return { error: 'Failed to fetch task templates' };
  }

  if (!taskTemplates || taskTemplates.length === 0) {
    return { error: 'No task templates found for this phase' };
  }

  // Get existing tasks in this phase to check for duplicates
  const { data: existingTasks } = await supabase
    .from('tasks')
    .select('title')
    .eq('phase_id', phaseId);

  const existingTitles = new Set(existingTasks?.map(t => t.title.toLowerCase()) || []);

  // Create tasks from templates (skip duplicates)
  const tasksToCreate = taskTemplates
    .filter(template => !existingTitles.has(template.title.toLowerCase()))
    .map(template => {
      // Calculate start_date and due_date based on days_offset if provided
      let start_date: string | null = null;
      let due_date: string | null = null;

      if (template.days_offset !== null && template.days_offset !== undefined && project.start_date) {
        const projectStartDate = new Date(project.start_date);
        const taskStartDate = new Date(projectStartDate);
        taskStartDate.setDate(taskStartDate.getDate() + template.days_offset);
        start_date = taskStartDate.toISOString().split('T')[0]; // YYYY-MM-DD format
        // Set due_date to same as start_date by default (can be adjusted later)
        due_date = start_date;
      }

      return {
        project_id: phase.project_id,
        phase_id: phaseId,
        title: template.title,
        description: template.description,
        task_type: template.default_task_type as Database['public']['Enums']['task_type'],
        priority: template.default_priority as Database['public']['Enums']['task_priority'],
        status: 'todo' as Database['public']['Enums']['task_status'],
        created_by: userId,
        start_date,
        due_date,
      };
    });

  if (tasksToCreate.length === 0) {
    return { error: 'All tasks from templates already exist in this phase' };
  }

  // Insert tasks
  const { data: createdTasks, error: insertError } = await supabase
    .from('tasks')
    .insert(tasksToCreate)
    .select();

  if (insertError) {
    console.error('[applyTaskTemplates] Error creating tasks:', insertError);
    return { error: 'Failed to create tasks from templates' };
  }

  const tasksCreated = createdTasks?.length || 0;
  console.log('[applyTaskTemplates] Created', tasksCreated, 'tasks from templates');

  revalidatePath(`/app/projects/${phase.project_id}`);
  return { success: true, tasksCreated };
}
