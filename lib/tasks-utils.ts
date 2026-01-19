/**
 * Shared utility functions for task operations
 * Used across multiple task action files
 */

import type { createClient } from "@/utils/supabase/server";

/**
 * Verify user has access to a project
 * @param supabase - Supabase client
 * @param projectId - Project UUID
 * @param companyId - Company UUID from user context
 * @returns Project data or error
 */
export async function verifyProjectAccess(
  supabase: Awaited<ReturnType<typeof createClient>>,
  projectId: string,
  companyId: string,
) {
  const { data: project, error } = await supabase
    .from("projects")
    .select("id, company_id")
    .eq("id", projectId)
    .single();

  if (error || !project) {
    return { error: "Project not found" };
  }

  if (project.company_id !== companyId) {
    return { error: "Insufficient permissions to access this project" };
  }

  return { project };
}

/**
 * Verify user has access to a task
 * @param supabase - Supabase client
 * @param taskId - Task UUID
 * @param companyId - Company UUID from user context
 * @returns Task data and projectId or error
 */
export async function verifyTaskAccess(
  supabase: Awaited<ReturnType<typeof createClient>>,
  taskId: string,
  companyId: string,
) {
  const { data: task, error } = await supabase
    .from("tasks")
    .select(
      `
      *,
      projects!inner (
        id,
        company_id
      )
    `,
    )
    .eq("id", taskId)
    .single();

  if (error || !task) {
    return { error: "Task not found" };
  }

  const project = task.projects as unknown as {
    id: string;
    company_id: string;
  };

  if (project.company_id !== companyId) {
    return { error: "Insufficient permissions to access this task" };
  }

  return { task, projectId: project.id };
}
