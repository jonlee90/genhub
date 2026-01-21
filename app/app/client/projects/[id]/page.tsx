import { Suspense } from "react";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getProjectWithStats } from "@/app/actions/projects";
import { getClientPermissions } from "@/app/actions/client";
import { getActiveModel } from "@/app/actions/spatial";
import { ClientSpatialViewerWrapper } from "@/components/projects/spatial/ClientSpatialViewerWrapper";
import { Skeleton } from "@/components/ui/skeleton";

/**
 * Client Portal Project Detail Page
 *
 * Read-only 3D spatial viewer for client portal.
 * Clients can view the full 3D model, all spatial markers, tasks, materials,
 * and documentation, but cannot create, edit, or delete anything.
 *
 * Budget visibility is controlled by company-level permissions.
 */
export default function ClientProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return (
    <Suspense fallback={<ClientProjectDetailLoading />}>
      <ClientProjectDetailPageContent params={params} />
    </Suspense>
  );
}

async function ClientProjectDetailPageContent({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  console.log("[ClientProjectDetailPage] Loading project:", id);

  // Verify user is authenticated
  const session = await auth();
  if (!session?.user) {
    console.log(
      "[ClientProjectDetailPage] Not authenticated, redirecting to home",
    );
    redirect("/");
  }

  // Fetch project data
  const projectResult = await getProjectWithStats(id);
  if (projectResult.error || !projectResult.project) {
    console.error(
      "[ClientProjectDetailPage] Project not found:",
      projectResult.error,
    );
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="bg-white border-2 border-red-500 rounded-lg p-8 shadow-construction max-w-md">
          <h2 className="text-2xl font-black text-red-600 uppercase mb-2">
            Project Not Found
          </h2>
          <p className="text-gray-600">
            The project you are trying to access does not exist or you do not
            have permission to view it.
          </p>
        </div>
      </div>
    );
  }

  const project = projectResult.project;

  // Fetch client permissions for this project
  const permissionsResult = await getClientPermissions(id);
  const permissions = permissionsResult.data || {
    can_view_budget: false,
    can_approve_change_orders: false,
    can_view_invoices: false,
  };

  // Fetch active 3D model
  const modelResult = await getActiveModel(id);
  const activeModel = modelResult.success ? modelResult.data : null;

  console.log("[ClientProjectDetailPage] Project loaded:", project.name);
  console.log("[ClientProjectDetailPage] Client permissions:", permissions);
  console.log("[ClientProjectDetailPage] Active model:", activeModel?.id);

  return (
    <div className="flex flex-col h-screen bg-white">
      {/* Fixed Blueprint Grid Background */}
      <div
        className="fixed inset-0 pointer-events-none opacity-[0.03] z-0"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M 40 0 L 0 0 0 40' fill='none' stroke='%23001B51' stroke-width='1'/%3E%3C/svg%3E")`,
        }}
      />

      {/* Industrial Header */}
      <div className="relative z-10">
        <div className="h-1 bg-construction-blue" />
        <header className="bg-white border-b-2 border-gray-200 p-4 md:p-6">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <h1 className="text-2xl md:text-3xl font-black uppercase tracking-tight text-construction-blue">
                {project.name}
              </h1>
              <p className="text-gray-600 mt-1 text-sm md:text-base">
                Client Portal - 3D Project View
              </p>
            </div>

            {/* Client View Badge */}
            <div className="px-4 py-2 bg-construction-blue/10 border-2 border-construction-blue rounded-lg">
              <p className="text-xs font-bold uppercase tracking-wide text-construction-blue">
                Client View
              </p>
            </div>
          </div>

          {/* Project Info */}
          {project.description && (
            <p className="text-sm text-gray-600 mt-4 max-w-3xl">
              {project.description}
            </p>
          )}
        </header>
      </div>

      {/* 3D Viewer (Full Height) */}
      <div className="relative z-10 flex-1 overflow-hidden">
        <ClientSpatialViewerWrapper
          projectId={project.id}
          projectType={project.project_type || "commercial_office"}
          modelHighURL={activeModel?.xkt_file_url ?? undefined}
          hasBudgetVisibility={permissions.can_view_budget}
        />
      </div>
    </div>
  );
}

function ClientProjectDetailLoading() {
  return (
    <div className="flex flex-col h-screen bg-white">
      {/* Fixed Blueprint Grid Background */}
      <div
        className="fixed inset-0 pointer-events-none opacity-[0.03] z-0"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M 40 0 L 0 0 0 40' fill='none' stroke='%23001B51' stroke-width='1'/%3E%3C/svg%3E")`,
        }}
      />

      {/* Industrial Header */}
      <div className="relative z-10">
        <div className="h-1 bg-construction-blue" />
        <header className="bg-white border-b-2 border-gray-200 p-4 md:p-6">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 space-y-2">
              <Skeleton className="h-8 w-64" />
              <Skeleton className="h-5 w-48" />
            </div>
            <Skeleton className="h-10 w-24 rounded-lg" />
          </div>
        </header>
      </div>

      {/* 3D Viewer Skeleton */}
      <div className="relative z-10 flex-1 flex items-center justify-center overflow-hidden">
        <div className="text-center space-y-4">
          <Skeleton className="h-16 w-16 rounded-xl mx-auto" />
          <Skeleton className="h-6 w-48 mx-auto" />
        </div>
      </div>
    </div>
  );
}
