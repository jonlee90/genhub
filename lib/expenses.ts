import "server-only";

import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { auth } from "@/lib/auth";

export async function getExpensesData() {
  // Get NextAuth session
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/");
  }

  // In development without database, return empty data
  if (process.env.NODE_ENV === "development") {
    try {
      const supabase = await createClient();

      // Get user's company
      const { data: companyUser } = await supabase
        .from("company_users")
        .select("company_id, role")
        .eq("user_id", session.user.id)
        .eq("status", "active")
        .maybeSingle();

      if (!companyUser) {
        return {
          expenses: [],
          projects: [],
          tasks: [],
          role: null,
          companyId: undefined,
        };
      }

      const projectsPromise = supabase
        .from("projects")
        .select("id, name, status, end_date")
        .eq("company_id", companyUser.company_id)
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
        .eq("company_id", companyUser.company_id)
        .order("created_at", { ascending: false });

      const [projectsResult, expensesResult] = await Promise.all([
        projectsPromise,
        expensesPromise,
      ]);

      const { data: projects } = projectsResult;
      const { data: expenses } = expensesResult;
      const projectIds = projects?.map((project) => project.id) || [];

      const { data: tasks } = projectIds.length
        ? await supabase
            .from("tasks")
            .select("id, title, project_id, task_type")
            .in("project_id", projectIds)
            .order("created_at")
        : { data: [] as any[] };

      return {
        expenses: expenses || [],
        projects: (projects || []) as any[],
        tasks: tasks || [],
        role: companyUser.role,
        companyId: companyUser.company_id,
      };
    } catch {
      return {
        expenses: [],
        projects: [],
        tasks: [],
        role: null,
        companyId: undefined,
      };
    }
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
    redirect("/app/onboarding");
  }

  const projectsPromise = supabase
    .from("projects")
    .select("id, name, status, end_date")
    .eq("company_id", companyUser.company_id)
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
    .eq("company_id", companyUser.company_id)
    .order("created_at", { ascending: false });

  const [projectsResult, expensesResult] = await Promise.all([
    projectsPromise,
    expensesPromise,
  ]);

  const { data: projects } = projectsResult;
  const { data: expenses } = expensesResult;
  const projectIds = projects?.map((project) => project.id) || [];

  const { data: tasks } = projectIds.length
    ? await supabase
        .from("tasks")
        .select("id, title, project_id, task_type")
        .in("project_id", projectIds)
        .order("created_at")
    : { data: [] as any[] };

  return {
    expenses: expenses || [],
    projects: projects || [],
    tasks: tasks || [],
    role: companyUser.role,
    companyId: companyUser.company_id,
  };
}
