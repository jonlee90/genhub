'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { createClient } from '@/utils/supabase/server';
import { auth } from '@/lib/auth';
import type { Database } from '@/types/database.types';

type Task = Database['public']['Tables']['tasks']['Row'];
type TaskInsert = Database['public']['Tables']['tasks']['Insert'];
type TaskUpdate = Database['public']['Tables']['tasks']['Update'];
type TaskStatus = Database['public']['Enums']['task_status'];
type TaskPriority = Database['public']['Enums']['task_priority'];
type ActivityAction = Database['public']['Enums']['activity_action'];

// ============================================
// Validation Schemas
// ============================================

const createTaskSchema = z.object({
  title: z.string().min(1, 'Task title is required').max(500),
  project_id: z.string().uuid('Invalid project ID'),
  phase_id: z.string().uuid('Invalid phase ID').optional().nullable(),
  description: z.string().optional().nullable(),
  assignee_id: z.string().uuid('Invalid assignee ID').optional().nullable(),
  start_date: z.string().optional().nullable(),
  due_date: z.string().optional().nullable(),
  priority: z.enum(['low', 'medium', 'high', 'critical']).optional(),
  planned_cost: z.number().min(0).optional().nullable(),
}).refine(
  (data) => {
    // If both dates are provided, start_date must be <= due_date
    if (data.start_date && data.due_date) {
      return data.start_date <= data.due_date;
    }
    return true;
  },
  {
    message: 'Start date must be before or equal to due date',
    path: ['start_date'],
  }
);

const updateTaskSchema = z.object({
  id: z.string().uuid('Invalid task ID'),
  title: z.string().min(1, 'Task title is required').max(500).optional(),
  description: z.string().optional().nullable(),
  assignee_id: z.string().uuid('Invalid assignee ID').optional().nullable(),
  start_date: z.string().optional().nullable(),
  due_date: z.string().optional().nullable(),
  priority: z.enum(['low', 'medium', 'high', 'critical']).optional(),
  planned_cost: z.number().min(0).optional().nullable(),
  actual_cost: z.number().min(0).optional().nullable(),
  phase_id: z.string().uuid('Invalid phase ID').optional().nullable(),
}).refine(
  (data) => {
    // If both dates are provided, start_date must be <= due_date
    if (data.start_date && data.due_date) {
      return data.start_date <= data.due_date;
    }
    return true;
  },
  {
    message: 'Start date must be before or equal to due date',
    path: ['start_date'],
  }
);

const updateTaskStatusSchema = z.object({
  id: z.string().uuid('Invalid task ID'),
  status: z.enum(['todo', 'in_progress', 'review', 'blocked', 'completed']),
  blocked_reason: z.string().optional().nullable(),
});

const taskDependencySchema = z.object({
  task_id: z.string().uuid('Invalid task ID'),
  depends_on_task_id: z.string().uuid('Invalid dependency task ID'),
});

const addCommentSchema = z.object({
  task_id: z.string().uuid('Invalid task ID'),
  comment: z.string().min(1, 'Comment is required').max(5000),
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

async function verifyProjectAccess(
  supabase: Awaited<ReturnType<typeof createClient>>,
  projectId: string,
  companyId: string
) {
  const { data: project, error } = await supabase
    .from('projects')
    .select('id, company_id')
    .eq('id', projectId)
    .single();

  if (error || !project) {
    return { error: 'Project not found' };
  }

  if (project.company_id !== companyId) {
    return { error: 'Insufficient permissions to access this project' };
  }

  return { project };
}

async function verifyTaskAccess(
  supabase: Awaited<ReturnType<typeof createClient>>,
  taskId: string,
  companyId: string
) {
  const { data: task, error } = await supabase
    .from('tasks')
    .select(`
      *,
      projects!inner (
        id,
        company_id
      )
    `)
    .eq('id', taskId)
    .single();

  if (error || !task) {
    return { error: 'Task not found' };
  }

  const project = task.projects as unknown as { id: string; company_id: string };

  if (project.company_id !== companyId) {
    return { error: 'Insufficient permissions to access this task' };
  }

  return { task, projectId: project.id };
}

async function logTaskActivity(
  supabase: Awaited<ReturnType<typeof createClient>>,
  taskId: string,
  userId: string,
  action: ActivityAction,
  oldValue?: string | null,
  newValue?: string | null,
  comment?: string | null
) {
  await supabase.from('task_activity').insert({
    task_id: taskId,
    user_id: userId,
    action,
    old_value: oldValue || null,
    new_value: newValue || null,
    comment: comment || null,
  });
}

// ============================================
// Server Actions
// ============================================

/**
 * Create a new task
 */
export async function createTask(prevState: any, formData: FormData) {
  // Get user context
  const userContext = await getUserContext();
  if ('error' in userContext) {
    return { error: userContext.error };
  }

  const { userId, companyId, supabase } = userContext;

  // Parse form data
  const phaseId = formData.get('phase_id') as string;
  const assigneeId = formData.get('assignee_id') as string;

  const rawData = {
    title: formData.get('title'),
    project_id: formData.get('project_id'),
    phase_id: phaseId && phaseId !== 'none' && phaseId !== '' ? phaseId : null,
    description: formData.get('description') || null,
    assignee_id: assigneeId && assigneeId !== 'unassigned' && assigneeId !== 'none' && assigneeId !== '' ? assigneeId : null,
    start_date: formData.get('start_date') || null,
    due_date: formData.get('due_date') || null,
    priority: formData.get('priority') || 'medium',
    planned_cost: formData.get('planned_cost')
      ? parseFloat(formData.get('planned_cost') as string)
      : null,
  };

  // Validate input
  const validation = createTaskSchema.safeParse(rawData);
  if (!validation.success) {
    return { error: 'Validation failed', fieldErrors: validation.error.flatten().fieldErrors };
  }

  const data = validation.data;

  // Verify project access
  const projectCheck = await verifyProjectAccess(supabase, data.project_id, companyId);
  if ('error' in projectCheck) {
    return { error: projectCheck.error };
  }

  // Prepare task data
  const taskData: TaskInsert = {
    project_id: data.project_id,
    phase_id: data.phase_id || null,
    title: data.title,
    description: data.description || null,
    assignee_id: data.assignee_id || null,
    start_date: data.start_date || null,
    due_date: data.due_date || null,
    priority: (data.priority || 'medium') as TaskPriority,
    planned_cost: data.planned_cost || null,
    status: 'todo',
    created_by: userId,
  };

  // Insert task
  const { data: task, error: insertError } = await supabase
    .from('tasks')
    .insert(taskData)
    .select()
    .single();

  if (insertError) {
    console.error('Error creating task:', insertError);
    return { error: 'Failed to create task. Please try again.' };
  }

  // Log activity
  await logTaskActivity(supabase, task.id, userId, 'created');

  // Create notification for assignee if assigned
  if (data.assignee_id && data.assignee_id !== userId) {
    await supabase.from('notifications').insert({
      user_id: data.assignee_id,
      type: 'task_assigned',
      title: 'New Task Assigned',
      message: `You have been assigned to: ${data.title}`,
      link: `/app/tasks/${task.id}`,
    });
  }

  // Revalidate paths
  revalidatePath('/app/tasks');
  revalidatePath(`/app/projects/${data.project_id}`);

  return { success: true, task };
}

/**
 * Update a task's fields
 */
export async function updateTask(formData: FormData) {
  // Get user context
  const userContext = await getUserContext();
  if ('error' in userContext) {
    return { error: userContext.error };
  }

  const { userId, companyId, supabase } = userContext;

  // Parse form data
  const assigneeId = formData.get('assignee_id') as string;
  const phaseId = formData.get('phase_id') as string;
  const description = formData.get('description') as string;
  const startDate = formData.get('start_date') as string;
  const dueDate = formData.get('due_date') as string;

  const rawData = {
    id: formData.get('id'),
    title: formData.get('title') || undefined,
    description: description || null,
    assignee_id: assigneeId && assigneeId !== 'unassigned' && assigneeId !== 'none' && assigneeId !== '' ? assigneeId : null,
    start_date: startDate || null,
    due_date: dueDate || null,
    priority: formData.get('priority') || undefined,
    planned_cost: formData.get('planned_cost')
      ? parseFloat(formData.get('planned_cost') as string)
      : undefined,
    actual_cost: formData.get('actual_cost')
      ? parseFloat(formData.get('actual_cost') as string)
      : undefined,
    phase_id: phaseId && phaseId !== 'none' && phaseId !== '' ? phaseId : null,
  };

  // Validate input
  const validation = updateTaskSchema.safeParse(rawData);
  if (!validation.success) {
    return { error: 'Validation failed', fieldErrors: validation.error.flatten().fieldErrors };
  }

  const { id, ...updateData } = validation.data;

  // Verify task access
  const taskCheck = await verifyTaskAccess(supabase, id, companyId);
  if ('error' in taskCheck) {
    return { error: taskCheck.error };
  }

  const { task: existingTask, projectId } = taskCheck;

  // Track changes for activity log
  const changes: Array<{ field: string; oldValue: string; newValue: string }> = [];

  if (updateData.title && updateData.title !== existingTask.title) {
    changes.push({ field: 'title', oldValue: existingTask.title, newValue: updateData.title });
  }
  if (updateData.assignee_id !== undefined && updateData.assignee_id !== existingTask.assignee_id) {
    changes.push({
      field: 'assignee',
      oldValue: existingTask.assignee_id || 'none',
      newValue: updateData.assignee_id || 'none',
    });
  }
  if (updateData.priority && updateData.priority !== existingTask.priority) {
    changes.push({
      field: 'priority',
      oldValue: existingTask.priority,
      newValue: updateData.priority,
    });
  }

  // Prepare update
  const taskUpdate: TaskUpdate = {};
  if (updateData.title !== undefined) taskUpdate.title = updateData.title;
  if (updateData.description !== undefined) taskUpdate.description = updateData.description;
  if (updateData.assignee_id !== undefined) taskUpdate.assignee_id = updateData.assignee_id;
  if (updateData.start_date !== undefined) taskUpdate.start_date = updateData.start_date;
  if (updateData.due_date !== undefined) taskUpdate.due_date = updateData.due_date;
  if (updateData.priority !== undefined) taskUpdate.priority = updateData.priority as TaskPriority;
  if (updateData.planned_cost !== undefined) taskUpdate.planned_cost = updateData.planned_cost;
  if (updateData.actual_cost !== undefined) taskUpdate.actual_cost = updateData.actual_cost;
  if (updateData.phase_id !== undefined) taskUpdate.phase_id = updateData.phase_id;

  // Update task
  const { data: task, error: updateError } = await supabase
    .from('tasks')
    .update(taskUpdate)
    .eq('id', id)
    .select()
    .single();

  if (updateError) {
    console.error('Error updating task:', updateError);
    return { error: 'Failed to update task. Please try again.' };
  }

  // Log changes
  for (const change of changes) {
    await logTaskActivity(
      supabase,
      id,
      userId,
      'updated',
      `${change.field}: ${change.oldValue}`,
      `${change.field}: ${change.newValue}`
    );
  }

  // Notify new assignee if changed
  if (
    updateData.assignee_id &&
    updateData.assignee_id !== existingTask.assignee_id &&
    updateData.assignee_id !== userId
  ) {
    await supabase.from('notifications').insert({
      user_id: updateData.assignee_id,
      type: 'task_assigned',
      title: 'Task Assigned',
      message: `You have been assigned to: ${task.title}`,
      link: `/app/tasks/${task.id}`,
    });
  }

  // Revalidate paths
  revalidatePath('/app/tasks');
  revalidatePath(`/app/tasks/${id}`);
  revalidatePath(`/app/projects/${projectId}`);

  return { success: true, task };
}

/**
 * Update a task's status
 * Requires blocked_reason when status is 'blocked'
 */
export async function updateTaskStatus(
  taskId: string,
  status: TaskStatus,
  blockedReason?: string
) {
  // Get user context
  const userContext = await getUserContext();
  if ('error' in userContext) {
    return { error: userContext.error };
  }

  const { userId, companyId, role, supabase } = userContext;

  // Validate input
  const validation = updateTaskStatusSchema.safeParse({
    id: taskId,
    status,
    blocked_reason: blockedReason,
  });
  if (!validation.success) {
    return { error: 'Invalid input' };
  }

  // Require blocked reason when status is blocked
  if (status === 'blocked' && !blockedReason) {
    return { error: 'Blocked reason is required when status is blocked' };
  }

  // Verify task access
  const taskCheck = await verifyTaskAccess(supabase, taskId, companyId);
  if ('error' in taskCheck) {
    return { error: taskCheck.error };
  }

  const { task: existingTask, projectId } = taskCheck;

  // Prepare update
  const taskUpdate: TaskUpdate = {
    status,
    blocked_reason: status === 'blocked' ? blockedReason : null,
  };

  // Set completed_at when completing (trigger will also handle this)
  if (status === 'completed' && existingTask.status !== 'completed') {
    taskUpdate.completed_at = new Date().toISOString();
  }

  // Update task
  const { data: task, error: updateError } = await supabase
    .from('tasks')
    .update(taskUpdate)
    .eq('id', taskId)
    .select()
    .single();

  if (updateError) {
    console.error('Error updating task status:', updateError);
    return { error: 'Failed to update task status. Please try again.' };
  }

  // Log activity
  await logTaskActivity(
    supabase,
    taskId,
    userId,
    'status_changed',
    existingTask.status,
    status,
    status === 'blocked' ? blockedReason : null
  );

  // Notify PM when task is blocked
  if (status === 'blocked' && (role === 'foreman' || role === 'field_worker')) {
    // Find project managers for this project
    const { data: managers } = await supabase
      .from('project_team')
      .select('user_id')
      .eq('project_id', projectId)
      .eq('role', 'project_manager');

    if (managers) {
      for (const manager of managers) {
        await supabase.from('notifications').insert({
          user_id: manager.user_id,
          type: 'task_blocked',
          title: 'Task Blocked',
          message: `Task "${task.title}" is blocked: ${blockedReason}`,
          link: `/app/tasks/${taskId}`,
        });
      }
    }
  }

  // Revalidate paths
  revalidatePath('/app/tasks');
  revalidatePath(`/app/tasks/${taskId}`);
  revalidatePath(`/app/projects/${projectId}`);

  return { success: true, task };
}

/**
 * Add a task dependency
 */
export async function addTaskDependency(taskId: string, dependsOnTaskId: string) {
  // Get user context
  const userContext = await getUserContext();
  if ('error' in userContext) {
    return { error: userContext.error };
  }

  const { userId, companyId, supabase } = userContext;

  // Validate input
  const validation = taskDependencySchema.safeParse({
    task_id: taskId,
    depends_on_task_id: dependsOnTaskId,
  });
  if (!validation.success) {
    return { error: 'Invalid input' };
  }

  // Prevent self-dependencies
  if (taskId === dependsOnTaskId) {
    return { error: 'A task cannot depend on itself' };
  }

  // Verify both tasks exist and are in same project
  const taskCheck = await verifyTaskAccess(supabase, taskId, companyId);
  if ('error' in taskCheck) {
    return { error: taskCheck.error };
  }

  const dependsCheck = await verifyTaskAccess(supabase, dependsOnTaskId, companyId);
  if ('error' in dependsCheck) {
    return { error: 'Dependency task not found' };
  }

  if (taskCheck.projectId !== dependsCheck.projectId) {
    return { error: 'Tasks must be in the same project' };
  }

  // Check for circular dependencies
  const { data: existingDeps } = await supabase
    .from('task_dependencies')
    .select('*')
    .eq('task_id', dependsOnTaskId)
    .eq('depends_on_task_id', taskId);

  if (existingDeps && existingDeps.length > 0) {
    return { error: 'This would create a circular dependency' };
  }

  // Create dependency
  const { error: insertError } = await supabase
    .from('task_dependencies')
    .insert({
      task_id: taskId,
      depends_on_task_id: dependsOnTaskId,
      created_by: userId,
    });

  if (insertError) {
    if (insertError.code === '23505') {
      return { error: 'This dependency already exists' };
    }
    console.error('Error adding dependency:', insertError);
    return { error: 'Failed to add dependency. Please try again.' };
  }

  // Log activity
  await logTaskActivity(
    supabase,
    taskId,
    userId,
    'updated',
    null,
    `Added dependency: ${dependsCheck.task.title}`
  );

  // Auto-block task if dependency is not completed
  if (dependsCheck.task.status !== 'completed' && taskCheck.task.status === 'todo') {
    await supabase
      .from('tasks')
      .update({
        status: 'blocked',
        blocked_reason: `Waiting for: ${dependsCheck.task.title}`,
      })
      .eq('id', taskId);
  }

  // Revalidate paths
  revalidatePath('/app/tasks');
  revalidatePath(`/app/tasks/${taskId}`);
  revalidatePath(`/app/projects/${taskCheck.projectId}`);

  return { success: true };
}

/**
 * Remove a task dependency
 */
export async function removeTaskDependency(taskId: string, dependsOnTaskId: string) {
  // Get user context
  const userContext = await getUserContext();
  if ('error' in userContext) {
    return { error: userContext.error };
  }

  const { userId, companyId, supabase } = userContext;

  // Verify task access
  const taskCheck = await verifyTaskAccess(supabase, taskId, companyId);
  if ('error' in taskCheck) {
    return { error: taskCheck.error };
  }

  // Get dependency info for logging
  const { data: depTask } = await supabase
    .from('tasks')
    .select('title')
    .eq('id', dependsOnTaskId)
    .single();

  // Remove dependency
  const { error: deleteError } = await supabase
    .from('task_dependencies')
    .delete()
    .eq('task_id', taskId)
    .eq('depends_on_task_id', dependsOnTaskId);

  if (deleteError) {
    console.error('Error removing dependency:', deleteError);
    return { error: 'Failed to remove dependency. Please try again.' };
  }

  // Log activity
  await logTaskActivity(
    supabase,
    taskId,
    userId,
    'updated',
    `Dependency: ${depTask?.title || dependsOnTaskId}`,
    null
  );

  // Revalidate paths
  revalidatePath('/app/tasks');
  revalidatePath(`/app/tasks/${taskId}`);
  revalidatePath(`/app/projects/${taskCheck.projectId}`);

  return { success: true };
}

/**
 * Add a comment to a task
 */
export async function addTaskComment(taskId: string, comment: string) {
  // Get user context
  const userContext = await getUserContext();
  if ('error' in userContext) {
    return { error: userContext.error };
  }

  const { userId, companyId, supabase } = userContext;

  // Validate input
  const validation = addCommentSchema.safeParse({ task_id: taskId, comment });
  if (!validation.success) {
    return { error: 'Invalid input' };
  }

  // Verify task access
  const taskCheck = await verifyTaskAccess(supabase, taskId, companyId);
  if ('error' in taskCheck) {
    return { error: taskCheck.error };
  }

  // Log comment
  const { data: activity, error: insertError } = await supabase
    .from('task_activity')
    .insert({
      task_id: taskId,
      user_id: userId,
      action: 'commented',
      comment,
    })
    .select()
    .single();

  if (insertError) {
    console.error('Error adding comment:', insertError);
    return { error: 'Failed to add comment. Please try again.' };
  }

  // Notify task participants (creator and assignee)
  const { task } = taskCheck;
  const notifyUsers = new Set<string>();

  if (task.created_by && task.created_by !== userId) {
    notifyUsers.add(task.created_by);
  }
  if (task.assignee_id && task.assignee_id !== userId) {
    notifyUsers.add(task.assignee_id);
  }

  for (const notifyUserId of notifyUsers) {
    await supabase.from('notifications').insert({
      user_id: notifyUserId,
      type: 'mention',
      title: 'New Comment',
      message: `New comment on task: ${task.title}`,
      link: `/app/tasks/${taskId}`,
    });
  }

  // Revalidate paths
  revalidatePath('/app/tasks');
  revalidatePath(`/app/tasks/${taskId}`);

  return { success: true, activity };
}

/**
 * Delete a task
 */
export async function deleteTask(taskId: string) {
  // Get user context
  const userContext = await getUserContext();
  if ('error' in userContext) {
    return { error: userContext.error };
  }

  const { companyId, role, supabase } = userContext;

  // Only GC Admin and PM can delete tasks
  if (role !== 'gc_admin' && role !== 'project_manager') {
    return { error: 'Insufficient permissions to delete tasks' };
  }

  // Verify task access
  const taskCheck = await verifyTaskAccess(supabase, taskId, companyId);
  if ('error' in taskCheck) {
    return { error: taskCheck.error };
  }

  const { projectId } = taskCheck;

  // Delete task (cascades to dependencies and activity)
  const { error: deleteError } = await supabase
    .from('tasks')
    .delete()
    .eq('id', taskId);

  if (deleteError) {
    console.error('Error deleting task:', deleteError);
    return { error: 'Failed to delete task. Please try again.' };
  }

  // Revalidate paths
  revalidatePath('/app/tasks');
  revalidatePath(`/app/projects/${projectId}`);

  return { success: true };
}

/**
 * Get tasks for a project (with filters)
 */
export async function getProjectTasks(
  projectId: string,
  filters?: {
    phase_id?: string;
    status?: TaskStatus;
    assignee_id?: string;
    priority?: TaskPriority;
  }
) {
  // Get user context
  const userContext = await getUserContext();
  if ('error' in userContext) {
    return { error: userContext.error };
  }

  const { companyId, supabase } = userContext;

  // Verify project access
  const projectCheck = await verifyProjectAccess(supabase, projectId, companyId);
  if ('error' in projectCheck) {
    return { error: projectCheck.error };
  }

  // Build query
  let query = supabase
    .from('tasks')
    .select(`
      *,
      assignee:user_profiles (
        id,
        name,
        email,
        avatar_url
      ),
      phase:project_phases (
        id,
        name,
        status
      )
    `)
    .eq('project_id', projectId)
    .order('created_at', { ascending: false });

  // Apply filters
  if (filters?.phase_id) {
    query = query.eq('phase_id', filters.phase_id);
  }
  if (filters?.status) {
    query = query.eq('status', filters.status);
  }
  if (filters?.assignee_id) {
    query = query.eq('assignee_id', filters.assignee_id);
  }
  if (filters?.priority) {
    query = query.eq('priority', filters.priority);
  }

  const { data: tasks, error } = await query;

  if (error) {
    console.error('Error fetching tasks:', error);
    return { error: 'Failed to load tasks' };
  }

  return { success: true, tasks };
}

/**
 * Update a task's due date (for Gantt chart drag-and-drop)
 * @deprecated Use updateTaskDates instead to update both start_date and due_date
 */
export async function updateTaskDueDate(taskId: string, newDueDate: string) {
  const userContext = await getUserContext();
  if ('error' in userContext) {
    return { error: userContext.error };
  }

  const { userId, companyId, supabase } = userContext;

  // Verify task access
  const taskCheck = await verifyTaskAccess(supabase, taskId, companyId);
  if ('error' in taskCheck) {
    return { error: taskCheck.error };
  }

  const { task: existingTask, projectId } = taskCheck;

  // Update task
  const { data: task, error: updateError } = await supabase
    .from('tasks')
    .update({ due_date: newDueDate })
    .eq('id', taskId)
    .select()
    .single();

  if (updateError) {
    console.error('Error updating task due date:', updateError);
    return { error: 'Failed to update task date' };
  }

  // Log activity
  await logTaskActivity(
    supabase,
    taskId,
    userId,
    'updated',
    `due_date: ${existingTask.due_date || 'none'}`,
    `due_date: ${newDueDate}`
  );

  // Revalidate paths
  revalidatePath('/app/tasks');
  revalidatePath(`/app/projects/${projectId}`);

  return { success: true, task };
}

/**
 * Update a task's start and due dates (for Gantt chart drag-and-drop)
 */
export async function updateTaskDates(
  taskId: string,
  newStartDate: string,
  newDueDate: string
) {
  const userContext = await getUserContext();
  if ('error' in userContext) {
    return { error: userContext.error };
  }

  const { userId, companyId, supabase } = userContext;

  // Verify task access
  const taskCheck = await verifyTaskAccess(supabase, taskId, companyId);
  if ('error' in taskCheck) {
    return { error: taskCheck.error };
  }

  const { task: existingTask, projectId } = taskCheck;

  // Update task with both dates
  const { data: task, error: updateError } = await supabase
    .from('tasks')
    .update({
      start_date: newStartDate,
      due_date: newDueDate,
    })
    .eq('id', taskId)
    .select()
    .single();

  if (updateError) {
    console.error('Error updating task dates:', updateError);
    return { error: 'Failed to update task dates' };
  }

  // Log activity
  await logTaskActivity(
    supabase,
    taskId,
    userId,
    'updated',
    `start_date: ${existingTask.start_date || 'none'}, due_date: ${existingTask.due_date || 'none'}`,
    `start_date: ${newStartDate}, due_date: ${newDueDate}`
  );

  // Revalidate paths
  revalidatePath('/app/tasks');
  revalidatePath(`/app/projects/${projectId}`);

  return { success: true, task };
}

/**
 * Fetch task dependencies for a set of tasks
 */
export async function getTaskDependencies(taskIds: string[]) {
  const userContext = await getUserContext();
  if ('error' in userContext) {
    return { error: userContext.error, dependencies: [] };
  }

  const { supabase } = userContext;

  const { data: dependencies, error } = await supabase
    .from('task_dependencies')
    .select('*')
    .or(`task_id.in.(${taskIds.join(',')}),depends_on_task_id.in.(${taskIds.join(',')})`);

  if (error) {
    console.error('Error fetching dependencies:', error);
    return { error: 'Failed to load dependencies', dependencies: [] };
  }

  return { success: true, dependencies: dependencies || [] };
}
