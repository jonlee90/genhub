import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { auth } from "@/lib/auth";
import { MaterialsPageClient } from "@/components/materials/MaterialsPageClient";
import {
  getTaskLinkedMaterials,
  getTrackedMaterials,
  getMaterialSummaryStats,
} from "@/app/actions/materials";

const getMaterialsData = cache(async () => {
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
    } catch (error) {
      console.error("Database not available:", error);
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

export const metadata = {
  title: "Materials | GenHub",
  description: "Search Home Depot products and manage material procurement",
};

export default async function MaterialsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const params = await searchParams;
  const page = Number.parseInt(params.page || "1", 10);
  const { projects } = await getMaterialsData();

  // Parallel data fetching for all components
  const [materialsResult, trackedResult, statsResult] = await Promise.all([
    getTaskLinkedMaterials(page, 12),
    getTrackedMaterials(),
    getMaterialSummaryStats(),
  ]);

  // Handle errors from server actions
  if (materialsResult.error) {
    console.error(
      "[MaterialsPage] Error fetching materials:",
      materialsResult.error,
    );
  }
  if (trackedResult.error) {
    console.error(
      "[MaterialsPage] Error fetching tracked materials:",
      trackedResult.error,
    );
  }
  if (statsResult.error) {
    console.error(
      "[MaterialsPage] Error fetching summary stats:",
      statsResult.error,
    );
  }

  return (
    <MaterialsPageClient
      projects={projects}
      stats={statsResult.data || null}
      trackedMaterials={trackedResult.data || []}
      initialMaterials={materialsResult.data?.materials || []}
      initialPage={page}
      initialTotalPages={materialsResult.data?.totalPages || 1}
    />
  );
}
