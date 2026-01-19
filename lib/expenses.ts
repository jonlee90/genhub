import "server-only";

import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { auth } from "@/lib/auth";

/**
 * Shared logic to fetch expenses data for a company
 * Fetches projects, expenses, and tasks in parallel with optimized waterfall prevention
 */
async function fetchExpensesDataForCompany(
  supabase: Awaited<ReturnType<typeof createClient>>,
  companyId: string,
  role: string,
) {
  const projectsPromise = supabase
    .from("projects")
    .select("id, name, status, end_date")
    .eq("company_id", companyId)
    .eq("status", "active")
    .order("name");

  const expensesPromise = supabase
    .from("expenses")
    .select(
      `
      *,
      project:projects!expenses_project_id_fkey (
        id,
        name
      ),
      task:tasks!expenses_task_id_fkey (
        id,
        title
      )
    `,
    )
    .eq("company_id", companyId)
    .order("created_at", { ascending: false });

  // Start tasks fetch earlier by chaining off projects promise
  type TaskData = { id: string; title: string; project_id: string; task_type: string };
  const tasksPromise = (async (): Promise<{ data: TaskData[] }> => {
    const projectsResult = await projectsPromise;
    const projectIds = projectsResult.data?.map((p) => p.id) || [];
    if (!projectIds.length) {
      return { data: [] };
    }
    const result = await supabase
      .from("tasks")
      .select("id, title, project_id, task_type")
      .in("project_id", projectIds)
      .order("created_at");
    return { data: (result.data || []) as TaskData[] };
  })();

  const [projectsResult, expensesResult, tasksResult] = await Promise.all([
    projectsPromise,
    expensesPromise,
    tasksPromise,
  ]);

  return {
    expenses: expensesResult.data || [],
    projects: (projectsResult.data || []) as any[],
    tasks: tasksResult.data || [],
    role,
    companyId,
  };
}

export async function getExpensesData() {
  // Get NextAuth session
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/");
  }

  const supabase = await createClient();

  // Get user's company
  const { data: companyUser } = await supabase
    .from("company_users")
    .select("company_id, role")
    .eq("user_id", session.user.id)
    .eq("status", "active")
    .maybeSingle();

  if (!companyUser) {
    // Development: return empty data, Production: redirect to onboarding
    if (process.env.NODE_ENV === "development") {
      return {
        expenses: [],
        projects: [],
        tasks: [],
        role: null,
        companyId: undefined,
      };
    }
    redirect("/app/onboarding");
  }

  // Fetch all data using shared logic
  try {
    return await fetchExpensesDataForCompany(
      supabase,
      companyUser.company_id,
      companyUser.role,
    );
  } catch (error) {
    // Development: return empty data on error
    if (process.env.NODE_ENV === "development") {
      console.error("Error fetching expenses data:", error);
      return {
        expenses: [],
        projects: [],
        tasks: [],
        role: companyUser.role,
        companyId: companyUser.company_id,
      };
    }
    // Production: re-throw error
    throw error;
  }
}
