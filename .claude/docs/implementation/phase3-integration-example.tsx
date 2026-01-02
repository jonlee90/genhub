// Integration Example: How to use Phase 3 Marker System components
// This shows how to wire up MarkerPlacement, MarkerPanel, and ContentDrawer

'use client';

import { useState } from 'react';
import { MarkerPlacement } from '@/components/projects/spatial/MarkerPlacement';
import { MarkerPanel } from '@/components/projects/spatial/MarkerPanel';
import { ContentDrawer } from '@/components/projects/spatial/ContentDrawer';
import { InteractionLayer } from '@/components/projects/spatial/InteractionLayer';
import type { SpatialMarker, MarkerContent } from '@/types/spatial';
import type { Viewer } from '@xeokit/xeokit-sdk';

interface SpatialViewerWithMarkersProps {
  projectId: string;
  modelId: string | null;
  viewer: Viewer | null;
  markers: SpatialMarker[];
  // Fetch marker content when marker selected
  onMarkerSelect?: (markerId: string) => Promise<MarkerContent[]>;
}

/**
 * Integration Example: Wire up marker components
 */
export function SpatialViewerWithMarkers({
  projectId,
  modelId,
  viewer,
  markers,
  onMarkerSelect,
}: SpatialViewerWithMarkersProps) {
  console.log('[SpatialViewerWithMarkers] Rendering', { markerCount: markers.length });

  // State: Selected marker
  const [selectedMarkerId, setSelectedMarkerId] = useState<string | null>(null);
  const [selectedMarkerContent, setSelectedMarkerContent] = useState<MarkerContent[]>([]);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // State: Placement mode
  const [isPlacementMode, setIsPlacementMode] = useState(false);

  // Get selected marker
  const selectedMarker = markers.find((m) => m.id === selectedMarkerId) || null;

  // Handle marker clicked in panel
  const handleMarkerClick = async (marker: SpatialMarker) => {
    console.log('[SpatialViewerWithMarkers] Marker clicked:', marker.id);

    setSelectedMarkerId(marker.id);

    // TODO: Fly camera to marker position
    // if (cameraControls) {
    //   cameraControls.flyTo({
    //     eye: [marker.position_x, marker.position_y, marker.position_z + 2],
    //     look: [marker.position_x, marker.position_y, marker.position_z],
    //     duration: 1000,
    //   });
    // }

    // Fetch content
    if (onMarkerSelect) {
      const content = await onMarkerSelect(marker.id);
      setSelectedMarkerContent(content);
    }

    // Open drawer
    setIsDrawerOpen(true);
  };

  // Handle surface click in placement mode
  const handleSurfaceClick = (result: any) => {
    console.log('[SpatialViewerWithMarkers] Surface clicked in placement mode:', result);
    // MarkerPlacement component will handle this via its own state machine
  };

  // Handle create marker button
  const handleCreateMarker = () => {
    console.log('[SpatialViewerWithMarkers] Create marker button clicked');
    setIsPlacementMode(true);
  };

  // Handle drawer close
  const handleDrawerClose = () => {
    console.log('[SpatialViewerWithMarkers] Drawer closed');
    setIsDrawerOpen(false);
    setSelectedMarkerId(null);
    setSelectedMarkerContent([]);
  };

  return (
    <div className="flex h-full">
      {/* Marker Panel (left sidebar) */}
      <MarkerPanel
        markers={markers}
        selectedMarkerId={selectedMarkerId}
        onMarkerClick={handleMarkerClick}
        onCreateMarker={handleCreateMarker}
        className="border-r-2 border-gray-200"
      />

      {/* 3D Viewer (center) */}
      <div className="flex-1 relative">
        {/* InteractionLayer for click detection */}
        <InteractionLayer
          viewer={viewer}
          onSurfaceClick={handleSurfaceClick}
        />

        {/* Marker Placement overlay */}
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20">
          <MarkerPlacement
            projectId={projectId}
            modelId={modelId}
            onSurfaceClick={handleSurfaceClick}
          />
        </div>

        {/* TODO: Render 3D markers as HTML overlays */}
        {/* {markers.map((marker) => (
          <MarkerOverlay
            key={marker.id}
            marker={marker}
            isSelected={marker.id === selectedMarkerId}
            onClick={() => handleMarkerClick(marker)}
          />
        ))} */}
      </div>

      {/* Content Drawer (right overlay) */}
      <ContentDrawer
        marker={selectedMarker}
        content={selectedMarkerContent}
        isOpen={isDrawerOpen}
        onClose={handleDrawerClose}
        onEdit={(marker) => {
          console.log('TODO: Edit marker', marker.id);
        }}
        onDelete={(marker) => {
          console.log('TODO: Delete marker', marker.id);
          // const confirmed = window.confirm('Delete this marker?');
          // if (confirmed) {
          //   await deleteMarker(marker.id);
          //   handleDrawerClose();
          // }
        }}
      />
    </div>
  );
}

// Example server component that fetches data and passes to client component
// app/app/projects/[id]/spatial/page.tsx

import { getProjectMarkers, getMarkerContent } from '@/app/actions/spatial';

export default async function SpatialViewerPage({ params }: { params: { id: string } }) {
  const projectId = params.id;

  // Fetch initial markers (server-side)
  const { data: markers = [] } = await getProjectMarkers(projectId);

  // Fetch marker content handler (client-side via server action)
  const fetchMarkerContent = async (markerId: string) => {
    'use server';
    const { data: content = [] } = await getMarkerContent(markerId);
    return content;
  };

  return (
    <div className="h-screen">
      <SpatialViewerWithMarkers
        projectId={projectId}
        modelId={null} // TODO: Get from active model
        viewer={null} // TODO: Pass from 3DViewerCanvas
        markers={markers}
        onMarkerSelect={fetchMarkerContent}
      />
    </div>
  );
}
