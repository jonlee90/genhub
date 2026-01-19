'use client';

import dynamic from 'next/dynamic';

const ClientSpatialViewer = dynamic(
  () =>
    import('@/components/projects/spatial/ClientSpatialViewer').then((mod) => ({
      default: mod.ClientSpatialViewer,
    })),
  {
    ssr: false,
  },
);

interface ClientSpatialViewerWrapperProps {
  projectId: string;
  projectType: string;
  modelHighURL?: string;
  hasBudgetVisibility: boolean;
}

export function ClientSpatialViewerWrapper({
  projectId,
  projectType,
  modelHighURL,
  hasBudgetVisibility,
}: ClientSpatialViewerWrapperProps) {
  return (
    <ClientSpatialViewer
      projectId={projectId}
      projectType={projectType}
      modelHighURL={modelHighURL}
      hasBudgetVisibility={hasBudgetVisibility}
    />
  );
}
