/**
 * Project Deferred Data Actions
 *
 * These actions fetch non-critical project data that can be loaded after initial render
 * to improve perceived performance and Time to Interactive (TTI).
 *
 * Usage Pattern:
 * 1. Page loads critical data immediately (project info, tasks, team)
 * 2. Client components use useDeferredData() to fetch these in background
 * 3. User sees page content faster, secondary data populates as it loads
 */

'use server';

import { cache } from 'react';
import { createClient } from '@/utils/supabase/server';
import { auth } from '@/lib/auth';
import { getProjectTeamCostSummary } from './projects';
import type { TeamCostSummary, TaskStats, ExpenseStats } from './projects';
import { z } from 'zod';

// ============================================
// Validation Schemas
// ============================================

const projectIdSchema = z.object({
  projectId: z.string().uuid(),
});

// Type for the RPC response structure
interface ProjectDetailWithStatsResponse {
  project?: {
    id?: string;
    name?: string;
    status?: string;
    budget?: number;
    task_stats?: Record<string, unknown>;
    expense_stats?: Record<string, unknown>;
    phase_task_stats?: Record<string, unknown>;
    [key: string]: unknown;
  };
  [key: string]: unknown;
}

/**
 * Load expense statistics for a project
 * Non-critical - can be deferred after initial render
 */
export async function getProjectExpenseStats(input: unknown) {
  const validation = projectIdSchema.safeParse(input);
  if (!validation.success) {
    console.error('[getProjectExpenseStats] Validation failed:', validation.error);
    throw new Error('Invalid project ID');
  }

  const { projectId } = validation.data;

  const supabase = await createClient();
  const session = await auth();

  if (!session?.user?.id) {
    throw new Error('Unauthorized');
  }

  try {    const { data: rpcResult, error: rpcError } = await (supabase.rpc as any)(
      'get_project_detail_with_stats',
      {
        p_project_id: projectId,
      }
    );

    // Check for RPC error
    if (rpcError) {
      console.error('[getProjectExpenseStats] RPC error:', rpcError);
      // Return default empty stats on error
      return {
        expenseStats: {
          total: 0,
          approved: 0,
          pending: 0,
          rejected: 0,
          totalAmount: 0,
          approvedAmount: 0,
          pendingAmount: 0,
          rejectedAmount: 0,
        } as ExpenseStats,
        taskStats: null,
        phaseTaskStats: [],
      };
    }

    // Type the result
    const result = rpcResult as ProjectDetailWithStatsResponse;

    // Safely extract the project data from the nested structure
    const projectData = result?.project;
    if (!projectData) {
      console.warn('[getProjectExpenseStats] No project data in RPC response');
      return {
        expenseStats: {
          total: 0,
          approved: 0,
          pending: 0,
          rejected: 0,
          totalAmount: 0,
          approvedAmount: 0,
          pendingAmount: 0,
          rejectedAmount: 0,
        } as ExpenseStats,
        taskStats: null,
        phaseTaskStats: [],
      };
    }

    // Extract stats from the response, with proper typing
    const expenseStatsData = projectData.expense_stats as Record<string, unknown> | undefined;
    const rawTaskStats = projectData.task_stats as Record<string, unknown> | undefined;
    const phaseTaskStats = projectData.phase_task_stats as Record<string, unknown> | undefined;

    // Construct proper ExpenseStats object with all required fields
    const expenseStats: ExpenseStats = {
      total: (expenseStatsData?.total as number) || 0,
      approved: (expenseStatsData?.approved as number) || 0,
      pending: (expenseStatsData?.pending as number) || 0,
      rejected: (expenseStatsData?.rejected as number) || 0,
      totalAmount: (expenseStatsData?.totalAmount as number) || 0,
      approvedAmount: (expenseStatsData?.approvedAmount as number) || 0,
      pendingAmount: (expenseStatsData?.pendingAmount as number) || 0,
      rejectedAmount: (expenseStatsData?.rejectedAmount as number) || 0,
    };

    // Construct proper TaskStats object with all required fields
    const taskStats: TaskStats | null = rawTaskStats
      ? {
          total: (rawTaskStats.total as number) || 0,
          completed: (rawTaskStats.completed as number) || 0,
          inProgress: (rawTaskStats.inProgress as number) || 0,
          blocked: (rawTaskStats.blocked as number) || 0,
          overdue: (rawTaskStats.overdue as number) || 0,
          totalPlannedCost: (rawTaskStats.totalPlannedCost as number) || 0,
          totalActualCost: (rawTaskStats.totalActualCost as number) || 0,
          budgetVariance: ((rawTaskStats.budgetVariance as number) || 0),
          budgetUtilization: ((rawTaskStats.budgetUtilization as number) || 0),
          unassignedCount: (rawTaskStats.unassignedCount as number) || 0,
          topAssignees: (rawTaskStats.topAssignees as TaskStats['topAssignees']) || [],
          tasksWithMaterials: (rawTaskStats.tasksWithMaterials as number) || 0,
          totalMaterialCost: (rawTaskStats.totalMaterialCost as number) || 0,
        }
      : null;

    return {
      expenseStats: expenseStats,
      taskStats: taskStats,
      phaseTaskStats: phaseTaskStats ? Object.values(phaseTaskStats) : [],
    };
  } catch (error) {
    console.error('[getProjectExpenseStats] Unexpected error:', error);
    // Return default empty stats on error
    return {
      expenseStats: {
        total: 0,
        approved: 0,
        pending: 0,
        rejected: 0,
        totalAmount: 0,
        approvedAmount: 0,
        pendingAmount: 0,
        rejectedAmount: 0,
      } as ExpenseStats,
      taskStats: null,
      phaseTaskStats: [],
    };
  }
}

/**
 * Load team cost summaries for a project
 * Non-critical - expensive calculation that can be deferred
 */
export async function getProjectTeamCosts(input: unknown): Promise<{
  teamCostSummaries: TeamCostSummary[];
}> {
  const validation = projectIdSchema.safeParse(input);
  if (!validation.success) {
    console.error('[getProjectTeamCosts] Validation failed:', validation.error);
    throw new Error('Invalid project ID');
  }

  const { projectId } = validation.data;

  const session = await auth();

  if (!session?.user?.id) {
    throw new Error('Unauthorized');
  }

  try {
    const teamCostResult = await getProjectTeamCostSummary(projectId);

    return {
      teamCostSummaries: teamCostResult.data || [],
    };
  } catch (error) {
    console.error('[getProjectTeamCosts] Error:', error);
    return {
      teamCostSummaries: [],
    };
  }
}

/**
 * Load task dependencies for a project
 * Non-critical - only needed for gantt/dependency views
 */
export async function getProjectTaskDependencies(input: unknown) {
  const validation = projectIdSchema.safeParse(input);
  if (!validation.success) {
    console.error('[getProjectTaskDependencies] Validation failed:', validation.error);
    throw new Error('Invalid project ID');
  }

  const { projectId } = validation.data;

  const supabase = await createClient();
  const session = await auth();

  if (!session?.user?.id) {
    throw new Error('Unauthorized');
  }

  try {
    // Get task IDs for this project
    const { data: tasks, error: tasksError } = await supabase
      .from('tasks')
      .select('id')
      .eq('project_id', projectId);

    // Handle error or empty result
    if (tasksError) {
      console.error('[getProjectTaskDependencies] Error fetching tasks:', tasksError);
      return { taskDependencies: [] };
    }

    if (!tasks || tasks.length === 0) {
      return { taskDependencies: [] };
    }

    const taskIds = tasks.map((t) => t.id);

    // Fetch dependencies
    const [result1, result2] = await Promise.all([
      supabase.from('task_dependencies').select('*').in('task_id', taskIds),
      supabase
        .from('task_dependencies')
        .select('*')
        .in('depends_on_task_id', taskIds),
    ]);

    // Merge and deduplicate
    const allDeps = [...(result1.data || []), ...(result2.data || [])];
    const uniqueDeps = Array.from(
      new Map(allDeps.map((d) => [d.id, d])).values()
    );

    return {
      taskDependencies: uniqueDeps,
    };
  } catch (error) {
    console.error('[getProjectTaskDependencies] Unexpected error:', error);
    return { taskDependencies: [] };
  }
}

/**
 * Load all deferred data in one call
 * Use this if you want to load everything at once after initial render
 */
export const getProjectDeferredData = cache(async (input: unknown) => {
  const validation = projectIdSchema.safeParse(input);
  if (!validation.success) {
    console.error('[getProjectDeferredData] Validation failed:', validation.error);
    throw new Error('Invalid project ID');
  }

  const { projectId } = validation.data;

  const [expenseData, teamData, dependencyData] = await Promise.allSettled([
    getProjectExpenseStats({ projectId }),
    getProjectTeamCosts({ projectId }),
    getProjectTaskDependencies({ projectId }),
  ]);

  return {
    expenseStats:
      expenseData.status === 'fulfilled'
        ? expenseData.value.expenseStats
        : null,
    taskStats:
      expenseData.status === 'fulfilled' ? expenseData.value.taskStats : null,
    phaseTaskStats:
      expenseData.status === 'fulfilled'
        ? expenseData.value.phaseTaskStats
        : [],
    teamCostSummaries:
      teamData.status === 'fulfilled' ? teamData.value.teamCostSummaries : [],
    taskDependencies:
      dependencyData.status === 'fulfilled'
        ? dependencyData.value.taskDependencies
        : [],
  };
});
