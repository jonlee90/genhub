import "server-only";

import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { auth } from "@/lib/auth";

export const getMaterialsData = cache(async () => {
  // In development without database, return empty data
  if (process.env.NODE_ENV === "development") {
    try {
      const [supabase, session] = await Promise.all([createClient(), auth()]);

      if (!session?.user?.id) {
        return { projects: [] };
      }

      // Get user's company
      const { data: companyUser } = await supabase
        .from("company_users")
        .select("company_id")
        .eq("user_id", session.user.id)
        .eq("status", "active")
        .maybeSingle();

      if (!companyUser) {
        return { projects: [] };
      }

      // Get all projects for this company
      const { data: projects } = await supabase
        .from("projects")
        .select("id, name")
        .eq("company_id", companyUser.company_id)
        .eq("status", "active")
        .order("name");

      return {
        projects: projects || [],
      };
    } catch {
      return { projects: [] };
    }
  }

  const [supabase, session] = await Promise.all([createClient(), auth()]);

  if (!session?.user?.id) {
    redirect("/");
  }

  // Get user's company
  const { data: companyUser } = await supabase
    .from("company_users")
    .select("company_id")
    .eq("user_id", session.user.id)
    .eq("status", "active")
    .maybeSingle();

  if (!companyUser) {
    redirect("/app/onboarding");
  }

  // Get all projects for this company
  const { data: projects } = await supabase
    .from("projects")
    .select("id, name")
    .eq("company_id", companyUser.company_id)
    .eq("status", "active")
    .order("name");

  return {
    projects: projects || [],
  };
});
