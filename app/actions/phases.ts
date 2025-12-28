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
