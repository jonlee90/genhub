import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { createClient } from '@/utils/supabase/server';
import { ClientSpatialViewer } from '@/components/projects/spatial/ClientSpatialViewer';
import { getActiveModel, getProjectMarkers } from '@/app/actions/spatial';
import { Building2 } from 'lucide-react';

interface ClientSpatialPageProps {
  params: Promise<{
    projectId: string;
  }>;
}

/**
 * Client Portal - Spatial Viewer Page
 * Read-only 3D viewer for clients at /app/client/{projectId}/spatial
 */
export default async function ClientSpatialPage(props: ClientSpatialPageProps) {
  const params = await props.params;
  const session = await auth();
  if (!session?.user) {
    redirect('/');
  }

  const supabase = await createClient();

  // Verify client has access to this project
  const { data: companyUser } = await supabase
    .from('company_users')
    .select('company_id, role')
    .eq('user_id', session.user.id)
    .eq('status', 'active')
    .single();

  if (!companyUser) {
    redirect('/app');
  }

  // Get project details
  const { data: project } = await supabase
    .from('projects')
    .select('id, name, description, company_id')
    .eq('id', params.projectId)
    .eq('company_id', companyUser.company_id)
    .single();

  if (!project) {
    redirect('/app/client');
  }

  // Get active 3D model
  const modelResult = await getActiveModel(params.projectId);
  const activeModel = modelResult.success ? modelResult.data : null;

  // Get client-visible markers
  const markersResult = await getProjectMarkers(params.projectId);
  const allMarkers = markersResult.success ? markersResult.data || [] : [];

  // Server action to handle client information requests
  async function handleRequestInformation(markerId: string, message: string) {
    'use server';

    console.log('[ClientSpatialPage] Client request:', { markerId, message });

    const session = await auth();
    if (!session?.user?.id) {
      throw new Error('Not authenticated');
    }

    const supabase = await createClient();

    // Create a client note with requires_response flag
    const { error } = await supabase.from('marker_content').insert({
      marker_id: markerId,
      type: 'note',
      text_content: message,
      created_by: session.user.id,
      is_client_note: true,
      requires_response: true,
    });

    if (error) {
      console.error('[ClientSpatialPage] Failed to create request:', error);
      throw new Error('Failed to submit request');
    }

    console.log('[ClientSpatialPage] Client request created successfully');
  }

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
      <div className="relative z-10 border-b-2 border-[#001B51]">
        <div className="p-4 md:p-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[#001B51] rounded-lg">
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
      <div className="relative z-10" style={{ height: 'calc(100vh - 120px)' }}>
        <ClientSpatialViewer
          projectId={params.projectId}
          modelHighURL={activeModel?.xkt_file_url}
          thumbnailURL={activeModel?.thumbnail_url}
          markers={allMarkers}
          onRequestInformation={handleRequestInformation}
        />
      </div>
    </div>
  );
}
