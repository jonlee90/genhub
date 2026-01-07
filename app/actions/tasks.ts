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
type TaskType = Database['public']['Enums']['task_type'];
type ApprovalStatus = Database['public']['Enums']['approval_status'];
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
  priority: z.enum(['low', 'medium', 'high']).optional(),
  planned_cost: z.number().min(0).optional().nullable(),
  task_type: z.enum(['work', 'purchase', 'approval', 'admin']).default('work'),
  receipt_photo_url: z.string().url('Invalid receipt photo URL').optional().nullable(),
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
  priority: z.enum(['low', 'medium', 'high']).optional(),
  planned_cost: z.number().min(0).optional().nullable(),
  actual_cost: z.number().min(0).optional().nullable(),
  phase_id: z.string().uuid('Invalid phase ID').optional().nullable(),
  receipt_photo_url: z.string().url('Invalid receipt photo URL').optional().nullable(),
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

const updateApprovalStatusSchema = z.object({
  task_id: z.string().uuid('Invalid task ID'),
  approval_status: z.enum(['pending', 'approved', 'rejected', 'revision_requested']),
  approval_notes: z.string().max(2000).optional().nullable(),
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

  const taskType = formData.get('task_type') as string;

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
    task_type: taskType && ['work', 'purchase', 'approval', 'admin'].includes(taskType)
      ? taskType
      : 'work',
    receipt_photo_url: formData.get('receipt_photo_url') || null,
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

  // Prepare task data with task_type support
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
    task_type: data.task_type as TaskType,
    // Set approval_status to 'pending' for approval-type tasks
    approval_status: data.task_type === 'approval' ? 'pending' : null,
    receipt_photo_url: data.receipt_photo_url || null,
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

    // Send AlimTalk notification to assignee (Task 0018)
    try {
      const { KakaoService } = await import('@/lib/services/kakao');
      const { data: project } = await supabase
        .from('projects')
        .select('name')
        .eq('id', data.project_id)
        .single();

      await KakaoService.sendAlimTalk(data.assignee_id, {
        template: 'task_assignment',
        params: {
          taskTitle: data.title,
          dueDate: data.due_date || 'Not set',
          projectName: project?.name || 'Unknown Project',
        },
      });
    } catch (error) {
      console.error('[createTask] Error sending AlimTalk:', error);
      // Don't fail task creation if AlimTalk fails
    }
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

  // P4.2: Log task completion to linked spatial marker
  if (status === 'completed' && existingTask.status !== 'completed') {
    await logTaskCompletionToMarker(taskId);
  }

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
        if (manager.user_id) {
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
 * Update approval status for an approval-type task
 * Only applicable to tasks with task_type = 'approval'
 */
export async function updateApprovalStatus(
  taskId: string,
  approvalStatus: ApprovalStatus,
  approvalNotes?: string
) {
  console.log('[updateApprovalStatus] Starting approval update for task:', taskId);

  // Get user context
  const userContext = await getUserContext();
  if ('error' in userContext) {
    return { error: userContext.error };
  }

  const { userId, companyId, role, supabase } = userContext;

  // Validate input
  const validation = updateApprovalStatusSchema.safeParse({
    task_id: taskId,
    approval_status: approvalStatus,
    approval_notes: approvalNotes,
  });
  if (!validation.success) {
    console.error('[updateApprovalStatus] Validation failed:', validation.error);
    return { error: 'Invalid input', fieldErrors: validation.error.flatten().fieldErrors };
  }

  // Verify task access
  const taskCheck = await verifyTaskAccess(supabase, taskId, companyId);
  if ('error' in taskCheck) {
    return { error: taskCheck.error };
  }

  const { task: existingTask, projectId } = taskCheck;

  // Verify task is an approval-type task
  if (existingTask.task_type !== 'approval') {
    console.error('[updateApprovalStatus] Task is not an approval type:', existingTask.task_type);
    return { error: 'Only approval-type tasks can have their approval status updated' };
  }

  // Only GC Admin and PM can approve/reject tasks
  if (role !== 'gc_admin' && role !== 'project_manager') {
    return { error: 'Insufficient permissions to update approval status' };
  }

  // Prepare update
  const taskUpdate: TaskUpdate = {
    approval_status: approvalStatus,
    approval_notes: approvalNotes || null,
    approved_by: userId,
    approved_at: new Date().toISOString(),
  };

  // If approved, also update task status to completed
  if (approvalStatus === 'approved') {
    taskUpdate.status = 'completed';
    taskUpdate.completed_at = new Date().toISOString();
  } else if (approvalStatus === 'rejected' || approvalStatus === 'revision_requested') {
    // Keep task in review or blocked status for rejected/revision tasks
    taskUpdate.status = 'blocked';
    taskUpdate.blocked_reason = approvalStatus === 'rejected'
      ? `Rejected: ${approvalNotes || 'No reason provided'}`
      : `Revision requested: ${approvalNotes || 'No details provided'}`;
  }

  // Update task
  const { data: task, error: updateError } = await supabase
    .from('tasks')
    .update(taskUpdate)
    .eq('id', taskId)
    .select()
    .single();

  if (updateError) {
    console.error('[updateApprovalStatus] Error updating task:', updateError);
    return { error: 'Failed to update approval status. Please try again.' };
  }

  console.log('[updateApprovalStatus] Task updated successfully:', task.id);

  // Log activity
  await logTaskActivity(
    supabase,
    taskId,
    userId,
    'status_changed',
    existingTask.approval_status || 'pending',
    approvalStatus,
    approvalNotes
  );

  // Notify task creator and assignee about approval decision
  const notifyUsers = new Set<string>();
  if (existingTask.created_by && existingTask.created_by !== userId) {
    notifyUsers.add(existingTask.created_by);
  }
  if (existingTask.assignee_id && existingTask.assignee_id !== userId) {
    notifyUsers.add(existingTask.assignee_id);
  }

  const statusMessages: Record<ApprovalStatus, string> = {
    pending: 'is pending approval',
    approved: 'has been approved',
    rejected: 'has been rejected',
    revision_requested: 'requires revision',
  };

  for (const notifyUserId of notifyUsers) {
    await supabase.from('notifications').insert({
      user_id: notifyUserId,
      type: 'system', // Using 'system' for approval workflow notifications
      title: `Approval ${approvalStatus === 'approved' ? 'Granted' : 'Update'}`,
      message: `Task "${existingTask.title}" ${statusMessages[approvalStatus]}`,
      link: `/app/tasks/${taskId}`,
    });
  }

  // Revalidate paths
  revalidatePath('/app/tasks');
  revalidatePath(`/app/tasks/${taskId}`);
  revalidatePath(`/app/projects/${projectId}`);

  return { success: true, task };
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

// ============================================
// P4.2 - SPATIAL MARKER INTEGRATION
// ============================================

/**
 * Link a task to a spatial marker
 * @param taskId - Task UUID
 * @param markerId - Spatial marker UUID
 */
export async function linkTaskToMarker(taskId: string, markerId: string) {
  console.log('[linkTaskToMarker] Linking task:', taskId, 'to marker:', markerId);

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

  const { task, projectId } = taskCheck;

  // Verify marker exists and belongs to same project
  const { data: marker, error: markerError } = await supabase
    .from('spatial_markers')
    .select('id, project_id')
    .eq('id', markerId)
    .single();

  if (markerError || !marker) {
    return { error: 'Spatial marker not found' };
  }

  if (marker.project_id !== task.project_id) {
    return { error: 'Task and marker must belong to the same project' };
  }

  // Update task with spatial_marker_id
  const { data: updatedTask, error: updateError } = await supabase
    .from('tasks')
    .update({ spatial_marker_id: markerId })
    .eq('id', taskId)
    .select()
    .single();

  if (updateError) {
    console.error('[linkTaskToMarker] Error:', updateError);
    return { error: 'Failed to link task to marker' };
  }

  // Log activity
  await logTaskActivity(
    supabase,
    taskId,
    userId,
    'updated',
    null,
    `Linked to spatial marker: ${markerId}`
  );

  // Revalidate paths
  revalidatePath('/app/tasks');
  revalidatePath(`/app/tasks/${taskId}`);
  revalidatePath(`/app/projects/${projectId}`);
  revalidatePath(`/app/projects/${projectId}/spatial`);

  console.log('[linkTaskToMarker] Task linked successfully');
  return { success: true, task: updatedTask };
}

/**
 * Get all tasks linked to a spatial marker
 * @param markerId - Spatial marker UUID
 */
export async function getTasksByMarker(markerId: string) {
  console.log('[getTasksByMarker] Fetching tasks for marker:', markerId);

  const userContext = await getUserContext();
  if ('error' in userContext) {
    return { error: userContext.error };
  }

  const { companyId, supabase } = userContext;

  // Verify marker access by checking project access
  const { data: marker, error: markerError } = await supabase
    .from('spatial_markers')
    .select('id, project_id')
    .eq('id', markerId)
    .single();

  if (markerError || !marker) {
    return { error: 'Spatial marker not found' };
  }

  // Verify project access
  const projectCheck = await verifyProjectAccess(supabase, marker.project_id, companyId);
  if ('error' in projectCheck) {
    return { error: projectCheck.error };
  }

  // Fetch tasks linked to this marker
  const { data: tasks, error } = await supabase
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
    .eq('spatial_marker_id', markerId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('[getTasksByMarker] Error:', error);
    return { error: 'Failed to fetch tasks' };
  }

  console.log('[getTasksByMarker] Found', tasks?.length || 0, 'tasks');
  return { success: true, tasks: tasks || [] };
}

/**
 * Activity logger for task status changes that creates marker activity content
 * This is called automatically when task status changes to 'completed'
 */
export async function logTaskCompletionToMarker(taskId: string) {
  console.log('[logTaskCompletionToMarker] Logging task completion for:', taskId);

  const userContext = await getUserContext();
  if ('error' in userContext) {
    return { error: userContext.error };
  }

  const { userId, companyId, supabase } = userContext;

  // Get task with marker info
  const { data: task, error: taskError } = await supabase
    .from('tasks')
    .select('id, title, spatial_marker_id, project_id, completed_at')
    .eq('id', taskId)
    .single();

  if (taskError || !task) {
    return { error: 'Task not found' };
  }

  // Only proceed if task has a linked marker
  if (!task.spatial_marker_id) {
    return { success: true, message: 'Task has no linked spatial marker' };
  }

  // Create activity content on the marker
  const { error: contentError } = await supabase
    .from('marker_content')
    .insert({
      marker_id: task.spatial_marker_id,
      type: 'activity',
      activity_type: 'task_completed',
      activity_data: {
        task_id: task.id,
        task_title: task.title,
        completed_by: userId,
        completed_at: task.completed_at || new Date().toISOString(),
      },
      created_by: userId,
    });

  if (contentError) {
    console.error('[logTaskCompletionToMarker] Error creating activity:', contentError);
    return { error: 'Failed to log activity to marker' };
  }

  // Revalidate spatial view
  revalidatePath(`/app/projects/${task.project_id}/spatial`);

  console.log('[logTaskCompletionToMarker] Activity logged successfully');
  return { success: true };
}

// ============================================
// P4 - TASK DETAIL PANEL SERVER ACTIONS
// ============================================

/**
 * Get full task details with related data for Task Detail Panel (Phase 4)
 * Fetches task with assignee, phase, spatial marker, and related counts
 * @param taskId - Task UUID
 * @returns TaskDetails object or error
 */
export async function getTaskDetails(taskId: string): Promise<{
  data?: {
    id: string;
    title: string;
    description?: string;
    status: TaskStatus;
    priority: TaskPriority;
    due_date?: string;
    start_date?: string;
    assignee?: {
      id: string;
      name: string;
      avatar_url?: string;
    };
    phase?: {
      id: string;
      name: string;
    };
    spatial_marker?: {
      id: string;
      position_x: number;
      position_y: number;
      position_z: number;
      element_id?: string;
    };
    material_count?: number;
    expense_count?: number;
    attachment_count?: number;
    planned_cost?: number;
    actual_cost?: number;
    created_at: string;
    updated_at: string;
  };
  error?: string;
}> {
  console.log('[getTaskDetails] Fetching details for task:', taskId);

  // Get user context
  const userContext = await getUserContext();
  if ('error' in userContext) {
    return { error: userContext.error };
  }

  const { companyId, supabase } = userContext;

  // Verify task access
  const taskCheck = await verifyTaskAccess(supabase, taskId, companyId);
  if ('error' in taskCheck) {
    return { error: taskCheck.error };
  }

  // Fetch task with all related data
  const { data: task, error: taskError } = await supabase
    .from('tasks')
    .select(`
      id,
      title,
      description,
      status,
      priority,
      due_date,
      start_date,
      planned_cost,
      actual_cost,
      created_at,
      updated_at,
      assignee:user_profiles!tasks_assignee_id_fkey (
        id,
        name,
        avatar_url
      ),
      phase:project_phases!tasks_phase_id_fkey (
        id,
        name
      ),
      spatial_marker:spatial_markers!tasks_spatial_marker_id_fkey (
        id,
        position_x,
        position_y,
        position_z,
        element_id
      )
    `)
    .eq('id', taskId)
    .single();

  if (taskError || !task) {
    console.error('[getTaskDetails] Error fetching task:', taskError);
    return { error: 'Task not found' };
  }

  // Get material count
  const { count: materialCount } = await supabase
    .from('material_assignments')
    .select('id', { count: 'exact', head: true })
    .eq('task_id', taskId);

  // Get expense count
  const { count: expenseCount } = await supabase
    .from('expenses')
    .select('id', { count: 'exact', head: true })
    .eq('task_id', taskId);

  // Get attachment count (assuming attachments table exists, else return 0)
  const { count: attachmentCount } = await supabase
    .from('attachments')
    .select('id', { count: 'exact', head: true })
    .eq('task_id', taskId)
    .is('deleted_at', null);

  // Transform data
  const taskDetails = {
    id: task.id,
    title: task.title,
    description: task.description || undefined,
    status: task.status,
    priority: task.priority,
    due_date: task.due_date || undefined,
    start_date: task.start_date || undefined,
    assignee: task.assignee ? {
      id: (task.assignee as any).id,
      name: (task.assignee as any).name,
      avatar_url: (task.assignee as any).avatar_url || undefined,
    } : undefined,
    phase: task.phase ? {
      id: (task.phase as any).id,
      name: (task.phase as any).name,
    } : undefined,
    spatial_marker: task.spatial_marker ? {
      id: (task.spatial_marker as any).id,
      position_x: (task.spatial_marker as any).position_x,
      position_y: (task.spatial_marker as any).position_y,
      position_z: (task.spatial_marker as any).position_z,
      element_id: (task.spatial_marker as any).element_id || undefined,
    } : undefined,
    material_count: materialCount || 0,
    expense_count: expenseCount || 0,
    attachment_count: attachmentCount || 0,
    planned_cost: task.planned_cost || undefined,
    actual_cost: task.actual_cost || undefined,
    created_at: task.created_at,
    updated_at: task.updated_at,
  };

  console.log('[getTaskDetails] Task details fetched successfully', {
    taskId,
    materialCount,
    expenseCount,
    attachmentCount,
  });

  return { data: taskDetails };
}

/**
 * Get chronological activity log for a task (Phase 4)
 * Fetches activity from task_activity table with user details
 * @param taskId - Task UUID
 * @returns Array of activity logs or error
 */
export async function getTaskActivity(taskId: string): Promise<{
  data?: Array<{
    id: string;
    action: ActivityAction;
    user_name: string;
    timestamp: string;
    old_value?: string;
    new_value?: string;
    comment?: string;
  }>;
  error?: string;
}> {
  console.log('[getTaskActivity] Fetching activity for task:', taskId);

  // Get user context
  const userContext = await getUserContext();
  if ('error' in userContext) {
    return { error: userContext.error };
  }

  const { companyId, supabase } = userContext;

  // Verify task access
  const taskCheck = await verifyTaskAccess(supabase, taskId, companyId);
  if ('error' in taskCheck) {
    return { error: taskCheck.error };
  }

  // Fetch activity log with user details
  const { data: activities, error: activityError } = await supabase
    .from('task_activity')
    .select(`
      id,
      action,
      old_value,
      new_value,
      comment,
      created_at,
      user:user_profiles!task_activity_user_id_fkey (
        name
      )
    `)
    .eq('task_id', taskId)
    .order('created_at', { ascending: false });

  if (activityError) {
    console.error('[getTaskActivity] Error fetching activity:', activityError);
    return { error: 'Failed to fetch activity log' };
  }

  // Transform data
  const activityLog = (activities || []).map((activity) => ({
    id: activity.id,
    action: activity.action as ActivityAction,
    user_name: (activity.user as any)?.name || 'Unknown User',
    timestamp: activity.created_at,
    old_value: activity.old_value || undefined,
    new_value: activity.new_value || undefined,
    comment: activity.comment || undefined,
  }));

  console.log('[getTaskActivity] Activity log fetched successfully', {
    taskId,
    activityCount: activityLog.length,
  });

  return { data: activityLog };
}

/**
 * Get attachments for a task (Phase 4)
 * Fetches all non-deleted attachments linked to a task
 * @param taskId - Task UUID
 * @returns Array of attachments or error
 */
export async function getTaskAttachments(taskId: string): Promise<{
  data?: Array<{
    id: string;
    file_name: string;
    file_url: string;
    file_type?: string;
    file_size_bytes?: number;
    thumbnail_url?: string;
    created_at: string;
  }>;
  error?: string;
}> {
  console.log('[getTaskAttachments] Fetching attachments for task:', taskId);

  // Get user context
  const userContext = await getUserContext();
  if ('error' in userContext) {
    return { error: userContext.error };
  }

  const { companyId, supabase } = userContext;

  // Verify task access
  const taskCheck = await verifyTaskAccess(supabase, taskId, companyId);
  if ('error' in taskCheck) {
    return { error: taskCheck.error };
  }

  // Fetch attachments (non-deleted only)
  const { data: attachments, error: attachmentsError } = await supabase
    .from('attachments')
    .select(`
      id,
      file_name,
      file_url,
      file_type,
      file_size_bytes,
      thumbnail_url,
      created_at
    `)
    .eq('task_id', taskId)
    .is('deleted_at', null)
    .order('created_at', { ascending: false });

  if (attachmentsError) {
    console.error('[getTaskAttachments] Error fetching attachments:', attachmentsError);
    return { error: 'Failed to fetch attachments' };
  }

  console.log('[getTaskAttachments] Attachments fetched successfully', {
    taskId,
    attachmentCount: attachments?.length || 0,
  });

  return { data: attachments || [] };
}

// ============================================
// Task Analytics
// ============================================

/**
 * Get comprehensive task analytics for a project or all projects
 * Returns 10 key metrics: completion, schedule, budget, blocked, workload,
 * materials, priority, expenses, dependencies, velocity
 *
 * @param projectFilter - 'all' or project UUID to filter analytics
 * @param companyId - Company UUID for RLS filtering
 * @returns TaskAnalytics data or error
 */
export async function getTaskAnalytics(
  projectFilter: string = 'all',
  companyId: string
): Promise<{ data?: import('@/types/analytics').TaskAnalytics; error?: string }> {
  try {
    console.log('[getTaskAnalytics] Fetching analytics', { projectFilter, companyId });

    // Auth check: require authenticated user
    const session = await auth();
    if (!session?.user?.id) {
      console.error('[getTaskAnalytics] Not authenticated');
      return { error: 'Not authenticated' };
    }

    // Input validation
    const validationSchema = z.object({
      projectFilter: z.union([
        z.literal('all'),
        z.string().uuid('Invalid project ID'),
      ]),
      companyId: z.string().uuid('Invalid company ID'),
    });

    const validationResult = validationSchema.safeParse({ projectFilter, companyId });
    if (!validationResult.success) {
      console.error('[getTaskAnalytics] Validation failed:', validationResult.error);
      return { error: 'Invalid input parameters' };
    }

    // Create Supabase client
    const supabase = await createClient();

    // SECURITY: Verify user belongs to the requested company
    const { data: userCompany, error: companyError } = await supabase
      .from('company_users')
      .select('company_id')
      .eq('user_id', session.user.id)
      .eq('company_id', companyId)
      .eq('status', 'active')
      .single();

    if (companyError || !userCompany) {
      console.error('[getTaskAnalytics] User does not belong to company:', companyId);
      return { error: 'Unauthorized' };
    }

    // SECURITY: If projectFilter is not 'all', verify project belongs to the company
    if (projectFilter !== 'all') {
      const { data: project, error: projectError } = await supabase
        .from('projects')
        .select('company_id')
        .eq('id', projectFilter)
        .single();

      if (projectError || !project || project.company_id !== companyId) {
        console.error('[getTaskAnalytics] Project does not belong to company:', { projectFilter, companyId });
        return { error: 'Invalid project' };
      }
    }

    // Call optimized PostgreSQL function
    const { data, error } = await supabase.rpc('get_task_analytics', {
      project_filter: projectFilter,
      p_company_id: companyId,
    });

    if (error) {
      console.error('[getTaskAnalytics] RPC error:', error);
      return { error: 'Failed to fetch analytics' };
    }

    // Handle empty result set
    if (!data || data.length === 0) {
      console.warn('[getTaskAnalytics] No data returned');
      // Return empty analytics structure
      return {
        data: {
          completion: { total: 0, completed: 0, rate: 0 },
          schedule: { overdue: 0, atRisk: 0, onTime: 0 },
          budget: { planned: 0, actual: 0, variance: 0, utilization: 0 },
          blocked: { count: 0, rate: 0, topReasons: [] },
          workload: { unassigned: 0, topAssignees: [] },
          materials: { needed: 0, ordered: 0, delivered: 0 },
          priority: { high: 0, medium: 0, low: 0 },
          expenses: { pending: 0, pendingAmount: 0, approved: 0, approvedAmount: 0 },
          dependencies: { blockedByDeps: 0, ready: 0 },
          velocity: { tasksPerDay: 0, trend: 0 },
        },
      };
    }

    // Extract first row (function returns single row)
    const row = data[0];

    // Transform database result to TaskAnalytics interface
    const analytics: import('@/types/analytics').TaskAnalytics = {
      completion: {
        total: Number(row.total_tasks) || 0,
        completed: Number(row.completed) || 0,
        rate: Number(row.completion_rate) || 0,
      },
      schedule: {
        overdue: Number(row.overdue) || 0,
        atRisk: Number(row.at_risk) || 0,
        onTime: Number(row.on_time) || 0,
      },
      budget: {
        planned: Number(row.total_planned) || 0,
        actual: Number(row.total_actual) || 0,
        variance: Number(row.budget_variance) || 0,
        utilization: Number(row.budget_utilization) || 0,
      },
      blocked: {
        count: Number(row.blocked_count) || 0,
        rate: Number(row.blocked_rate) || 0,
        topReasons: row.top_blocked_reasons || [],
      },
      workload: {
        unassigned: Number(row.unassigned) || 0,
        topAssignees: row.top_assignees_json || [],
      },
      materials: {
        needed: Number(row.materials_needed) || 0,
        ordered: Number(row.materials_ordered) || 0,
        delivered: Number(row.materials_delivered) || 0,
      },
      priority: {
        high: Number(row.priority_high) || 0,
        medium: Number(row.priority_medium) || 0,
        low: Number(row.priority_low) || 0,
      },
      expenses: {
        pending: Number(row.expenses_pending) || 0,
        pendingAmount: Number(row.pending_amount) || 0,
        approved: Number(row.expenses_approved) || 0,
        approvedAmount: Number(row.approved_amount) || 0,
      },
      dependencies: {
        blockedByDeps: Number(row.blocked_by_deps) || 0,
        ready: Number(row.ready_to_start) || 0,
      },
      velocity: {
        tasksPerDay: Number(row.tasks_per_day) || 0,
        trend: Number(row.velocity_trend) || 0,
      },
    };

    console.log('[getTaskAnalytics] Analytics fetched successfully', {
      totalTasks: analytics.completion.total,
      completionRate: analytics.completion.rate,
    });

    return { data: analytics };
  } catch (error) {
    console.error('[getTaskAnalytics] Unexpected error:', error);
    return { error: 'An unexpected error occurred' };
  }
}
