'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { createClient } from '@/utils/supabase/server';
import { auth } from '@/lib/auth';
import type { Database } from '@/types/database.types';

// ============================================
// Types
// ============================================

type TaskTypeConfig = Database['public']['Tables']['task_type_configs']['Row'];
type TaskTypeInsert = Database['public']['Tables']['task_type_configs']['Insert'];
type TaskTypeUpdate = Database['public']['Tables']['task_type_configs']['Update'];

// ============================================
// Validation Schemas
// ============================================

const createTaskTypeSchema = z.object({
  name: z.string().min(1, 'Name is required').max(50),
  description: z.string().max(200).optional(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid hex color').default('#001B51'),
  icon_name: z.string().default('Hammer'),
});

const updateTaskTypeSchema = z.object({
  name: z.string().min(1, 'Name is required').max(50).optional(),
  description: z.string().max(200).optional(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid hex color').optional(),
  icon_name: z.string().optional(),
  is_active: z.boolean().optional(),
});

// ============================================
// Helper Functions
// ============================================

async function getUserContext() {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: 'Not authenticated' };
  }

  const supabase = await createClient();
  const { data: companyUser, error: companyError } = await supabase
    .from('company_users')
    .select('company_id, role, status')
    .eq('user_id', session.user.id)
    .eq('status', 'active')
    .maybeSingle();

  if (companyError || !companyUser) {
    console.error('[getUserContext] Error fetching company user:', companyError);
    return { error: 'No active company found for user' };
  }

  // Only GC Admin can manage task types
  if (companyUser.role !== 'gc_admin') {
    return { error: 'Insufficient permissions. Only GC Admin can manage task types.' };
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

/**
 * Get all active task types for the user's company
 * Used for general listings (task creation, filters, etc.)
 */
export async function getTaskTypes(): Promise<{
  success?: boolean;
  taskTypes?: TaskTypeConfig[];
  error?: string;
}> {
  console.log('[getTaskTypes] Fetching active task types...');

  const session = await auth();
  if (!session?.user?.id) {
    return { error: 'Not authenticated' };
  }

  const supabase = await createClient();

  const { data: companyUser } = await supabase
    .from('company_users')
    .select('company_id')
    .eq('user_id', session.user.id)
    .eq('status', 'active')
    .maybeSingle();

  if (!companyUser) {
    return { error: 'No active company found' };
  }

  // Fetch active task types only
  const { data: taskTypes, error } = await supabase
    .from('task_type_configs')
    .select('*')
    .eq('company_id', companyUser.company_id)
    .eq('is_active', true)
    .order('name', { ascending: true });

  if (error) {
    console.error('[getTaskTypes] Error:', error);
    return { error: 'Failed to fetch task types' };
  }

  return { success: true, taskTypes: taskTypes || [] };
}

/**
 * Get ALL task types (active and inactive) for the user's company
 * Used for admin management UI only (settings page)
 * Requires GC Admin role
 */
export async function getAllTaskTypes(): Promise<{
  success?: boolean;
  taskTypes?: TaskTypeConfig[];
  error?: string;
}> {
  console.log('[getAllTaskTypes] Fetching all task types for admin...');

  const userContext = await getUserContext();
  if ('error' in userContext) {
    return { error: userContext.error };
  }

  const { companyId, supabase } = userContext;

  // Fetch ALL task types (active and inactive)
  const { data: taskTypes, error } = await supabase
    .from('task_type_configs')
    .select('*')
    .eq('company_id', companyId)
    .order('is_default', { ascending: false }) // Defaults first
    .order('name', { ascending: true });

  if (error) {
    console.error('[getAllTaskTypes] Error:', error);
    return { error: 'Failed to fetch task types' };
  }

  return { success: true, taskTypes: taskTypes || [] };
}

/**
 * Create a new task type
 */
export async function createTaskType(formData: FormData): Promise<{
  success?: boolean;
  taskType?: TaskTypeConfig;
  error?: string;
  fieldErrors?: Record<string, string[]>;
}> {
  console.log('[createTaskType] Creating new task type...');

  const userContext = await getUserContext();
  if ('error' in userContext) {
    return { error: userContext.error };
  }

  const { companyId, supabase } = userContext;

  // Parse and validate
  const rawData = {
    name: formData.get('name'),
    description: formData.get('description') || undefined,
    color: formData.get('color') || '#001B51',
    icon_name: formData.get('icon_name') || 'Hammer',
  };

  const validation = createTaskTypeSchema.safeParse(rawData);
  if (!validation.success) {
    console.error('[createTaskType] Validation failed:', validation.error);
    return {
      error: 'Validation failed',
      fieldErrors: validation.error.flatten().fieldErrors,
    };
  }

  // Insert
  const { data: taskType, error } = await supabase
    .from('task_type_configs')
    .insert({
      company_id: companyId,
      ...validation.data,
    })
    .select()
    .single();

  if (error) {
    console.error('[createTaskType] Error:', error);
    if (error.code === '23505') {
      return { error: 'A task type with this name already exists' };
    }
    return { error: 'Failed to create task type' };
  }

  console.log('[createTaskType] Task type created:', taskType.id);
  revalidatePath('/app/settings');
  return { success: true, taskType };
}

/**
 * Update an existing task type
 * Cannot update if is_default = true
 */
export async function updateTaskType(
  id: string,
  formData: FormData
): Promise<{
  success?: boolean;
  taskType?: TaskTypeConfig;
  error?: string;
  fieldErrors?: Record<string, string[]>;
}> {
  console.log('[updateTaskType] Updating task type:', id);

  const userContext = await getUserContext();
  if ('error' in userContext) {
    return { error: userContext.error };
  }

  const { companyId, supabase } = userContext;

  // Check if task type exists and belongs to company
  const { data: existing } = await supabase
    .from('task_type_configs')
    .select('company_id, is_default')
    .eq('id', id)
    .maybeSingle();

  if (!existing || existing.company_id !== companyId) {
    return { error: 'Task type not found' };
  }

  // Cannot edit default types
  if (existing.is_default) {
    return {
      error: 'Cannot edit default task types. Create a new custom type instead.',
    };
  }

  const rawData = {
    name: formData.get('name') || undefined,
    description: formData.get('description') || undefined,
    color: formData.get('color') || undefined,
    icon_name: formData.get('icon_name') || undefined,
    is_active: formData.get('is_active') === 'true',
  };

  const validation = updateTaskTypeSchema.safeParse(rawData);
  if (!validation.success) {
    console.error('[updateTaskType] Validation failed:', validation.error);
    return {
      error: 'Validation failed',
      fieldErrors: validation.error.flatten().fieldErrors,
    };
  }

  // Update
  const { data: taskType, error } = await supabase
    .from('task_type_configs')
    .update(validation.data)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('[updateTaskType] Error:', error);
    if (error.code === '23505') {
      return { error: 'A task type with this name already exists' };
    }
    return { error: 'Failed to update task type' };
  }

  console.log('[updateTaskType] Task type updated:', taskType.id);
  revalidatePath('/app/settings');
  return { success: true, taskType };
}

/**
 * Soft delete a task type (sets is_active = false)
 * Preserves historical data - existing tasks keep their type
 */
export async function deleteTaskType(id: string): Promise<{
  success?: boolean;
  error?: string;
}> {
  console.log('[deleteTaskType] Soft deleting task type:', id);

  const userContext = await getUserContext();
  if ('error' in userContext) {
    return { error: userContext.error };
  }

  const { companyId, supabase } = userContext;

  // Check if task type exists and belongs to company
  const { data: existing } = await supabase
    .from('task_type_configs')
    .select('company_id, is_default')
    .eq('id', id)
    .maybeSingle();

  if (!existing || existing.company_id !== companyId) {
    return { error: 'Task type not found' };
  }

  // Cannot delete default types
  if (existing.is_default) {
    return {
      error: 'Cannot delete default task types.',
    };
  }

  // Soft delete: set is_active = false
  const { error } = await supabase
    .from('task_type_configs')
    .update({ is_active: false })
    .eq('id', id);

  if (error) {
    console.error('[deleteTaskType] Error:', error);
    return { error: 'Failed to delete task type' };
  }

  console.log('[deleteTaskType] Task type soft deleted:', id);
  revalidatePath('/app/settings');
  return { success: true };
}
