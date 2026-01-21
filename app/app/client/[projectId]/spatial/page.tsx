import { Suspense } from "react";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { createClient } from "@/utils/supabase/server";
import { getActiveModel } from "@/app/actions/spatial";
import { Building2 } from "lucide-react";
import { ClientSpatialViewerWrapper } from "@/components/projects/spatial/ClientSpatialViewerWrapper";
import { Skeleton } from "@/components/ui/skeleton";

interface ClientSpatialPageProps {
  params: Promise<{
    projectId: string;
  }>;
}

/**
 * Client Portal - Spatial Viewer Page
 * Read-only 3D viewer for clients at /app/client/{projectId}/spatial
 */
export default function ClientSpatialPage(props: ClientSpatialPageProps) {
  return (
    <Suspense fallback={<ClientSpatialLoading />}>
      <ClientSpatialPageContent params={props.params} />
    </Suspense>
  );
}

async function ClientSpatialPageContent({ params: paramsPromise }: ClientSpatialPageProps) {
  const params = await paramsPromise;
  const session = await auth();
  if (!session?.user) {
    redirect("/");
  }

  const supabase = await createClient();

  // Verify client has access to this project
  const { data: companyUser } = await supabase
    .from("company_users")
    .select("company_id, role")
    .eq("user_id", session.user.id!)
    .eq("status", "active")
    .single();

  if (!companyUser) {
    redirect("/app");
  }

  // Get project details including type and client budget visibility
  const { data: project } = await supabase
    .from("projects")
    .select("id, name, description, company_id, project_type")
    .eq("id", params.projectId)
    .eq("company_id", companyUser.company_id)
    .single();

  // Get company settings for client budget visibility
  const { data: company } = await supabase
    .from("companies")
    .select("client_can_view_budget")
    .eq("id", companyUser.company_id)
    .single();

  if (!project) {
    redirect("/app/client");
  }

  // Get active 3D model
  const modelResult = await getActiveModel(params.projectId);
  const activeModel = modelResult.success ? modelResult.data : null;

  return (
    <div className="relative min-h-screen bg-white">
      {/* Blueprint Grid Background */}
      <div
        className="fixed inset-0 pointer-events-none opacity-[0.03] z-0"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M 40 0 L 0 0 0 40' fill='none' stroke='%23001B51' stroke-width='1'/%3E%3C/svg%3E")`,
        }}
      />

      {/* Industrial Header */}
      <div className="relative z-10 border-b-2 border-construction-blue">
        <div className="p-4 md:p-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-construction-blue rounded-lg">
              <Building2 className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-black uppercase tracking-tight">
                {project.name}
              </h1>
              <p className="text-sm text-gray-600">3D Project View</p>
            </div>
          </div>
        </div>
      </div>

      {/* 3D Viewer */}
      <div className="relative z-10" style={{ height: "calc(100vh - 120px)" }}>
        <ClientSpatialViewerWrapper
          projectId={params.projectId}
          projectType={project.project_type || "residential"}
          modelHighURL={activeModel?.xkt_file_url ?? undefined}
          hasBudgetVisibility={company?.client_can_view_budget ?? false}
        />
      </div>
    </div>
  );
}

function ClientSpatialLoading() {
  return (
    <div className="relative min-h-screen bg-white">
      {/* Blueprint Grid Background */}
      <div
        className="fixed inset-0 pointer-events-none opacity-[0.03] z-0"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M 40 0 L 0 0 0 40' fill='none' stroke='%23001B51' stroke-width='1'/%3E%3C/svg%3E")`,
        }}
      />

      {/* Industrial Header */}
      <div className="relative z-10 border-b-2 border-construction-blue">
        <div className="p-4 md:p-6">
          <div className="flex items-center gap-3">
            <Skeleton className="h-10 w-10 rounded-lg" />
            <div className="space-y-2">
              <Skeleton className="h-7 w-48" />
              <Skeleton className="h-4 w-32" />
            </div>
          </div>
        </div>
      </div>

      {/* 3D Viewer Skeleton */}
      <div className="relative z-10 flex items-center justify-center" style={{ height: "calc(100vh - 120px)" }}>
        <div className="text-center space-y-4">
          <Skeleton className="h-16 w-16 rounded-xl mx-auto" />
          <Skeleton className="h-6 w-48 mx-auto" />
        </div>
      </div>
    </div>
  );
}
