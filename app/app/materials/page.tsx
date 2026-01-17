import { MaterialsPageClient } from "@/components/materials/MaterialsPageClient";
import {
  getTaskLinkedMaterials,
  getTrackedMaterials,
  getMaterialSummaryStats,
} from "@/app/actions/materials";
import { getMaterialsData } from "@/lib/materials";

export const metadata = {
  title: "Materials | GenHub",
  description: "Search Home Depot products and manage material procurement",
};

export default async function MaterialsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const [params, { projects }] = await Promise.all([
    searchParams,
    getMaterialsData(),
  ]);
  const page = Number.parseInt(params.page || "1", 10);

  // Parallel data fetching for all components
  const [materialsResult, trackedResult, statsResult] = await Promise.all([
    getTaskLinkedMaterials(page, 12),
    getTrackedMaterials(),
    getMaterialSummaryStats(),
  ]);

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
