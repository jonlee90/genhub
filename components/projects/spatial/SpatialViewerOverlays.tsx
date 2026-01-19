import { SpatialMarkerContextMenu } from "./SpatialMarkerContextMenu";
import { TaskLinker } from "./TaskLinker";
import { MarkerCreationModal } from "./MarkerCreationModal";
import { TaskDetailPanel } from "@/components/tasks/TaskDetailPanel";
import type { SpatialMarker } from "@/types/db/spatial";

interface SpatialViewerOverlaysProps {
  contextMenuOpen: boolean;
  contextMenuPosition: { x: number; y: number };
  clickedPosition: {
    x: number;
    y: number;
    z: number;
    normal?: { x: number; y: number; z: number };
    elementId?: string;
  } | null;
  userRole: string;
  onCloseContextMenu: () => void;
  onCreateTask: () => void;
  onLinkTask: () => void;
  onCreateMarker: (type: "issue" | "note" | "safety" | "progress") => void;
  taskLinkerOpen: boolean;
  taskLinkerMode: "create" | "link";
  onCloseTaskLinker: () => void;
  projectId: string;
  phases: Array<{ id: string; name: string }>;
  teamMembers: Array<{ id: string; name: string }>;
  projectTasks: Array<any>;
  onTaskCreated: (task: any, marker: SpatialMarker) => void;
  onTaskLinked: (taskId: string) => void;
  markerModalOpen: boolean;
  selectedMarkerType: "issue" | "note" | "safety" | "progress";
  onCloseMarkerModal: () => void;
  onMarkerCreated: (marker: SpatialMarker) => void;
  detailPanelOpen: boolean;
  selectedTaskId: string | null;
  onCloseDetailPanel: () => void;
  markerSelectionMenu: {
    open: boolean;
    position: { x: number; y: number };
    markers: SpatialMarker[];
  };
  onSelectMarker: (marker: SpatialMarker) => void;
  onCloseMarkerSelection: () => void;
}

export function SpatialViewerOverlays({
  contextMenuOpen,
  contextMenuPosition,
  clickedPosition,
  userRole,
  onCloseContextMenu,
  onCreateTask,
  onLinkTask,
  onCreateMarker,
  taskLinkerOpen,
  taskLinkerMode,
  onCloseTaskLinker,
  projectId,
  phases,
  teamMembers,
  projectTasks,
  onTaskCreated,
  onTaskLinked,
  markerModalOpen,
  selectedMarkerType,
  onCloseMarkerModal,
  onMarkerCreated,
  detailPanelOpen,
  selectedTaskId,
  onCloseDetailPanel,
  markerSelectionMenu,
  onSelectMarker,
  onCloseMarkerSelection,
}: SpatialViewerOverlaysProps) {
  const fallbackPosition = clickedPosition || { x: 0, y: 0, z: 0 };
  const fallbackNormal = clickedPosition?.normal || { x: 0, y: 0, z: 0 };

  return (
    <>
      <SpatialMarkerContextMenu
        isOpen={contextMenuOpen}
        position={contextMenuPosition}
        worldPosition={fallbackPosition}
        normal={clickedPosition?.normal}
        elementId={clickedPosition?.elementId}
        userRole={userRole}
        onClose={onCloseContextMenu}
        onCreateTask={onCreateTask}
        onLinkTask={onLinkTask}
        onAddIssue={() => onCreateMarker("issue")}
        onAddNote={() => onCreateMarker("note")}
        onAddSafety={() => onCreateMarker("safety")}
        onAddMilestone={() => onCreateMarker("progress")}
      />

      <TaskLinker
        isOpen={taskLinkerOpen}
        onClose={onCloseTaskLinker}
        mode={taskLinkerMode}
        position={fallbackPosition}
        normal={fallbackNormal}
        elementId={clickedPosition?.elementId}
        projectId={projectId}
        phaseId={phases[0]?.id}
        phases={phases}
        teamMembers={teamMembers}
        projectTasks={projectTasks}
        onTaskCreated={onTaskCreated}
        onTaskLinked={onTaskLinked}
      />

      <MarkerCreationModal
        isOpen={markerModalOpen}
        onClose={onCloseMarkerModal}
        markerType={selectedMarkerType}
        position={fallbackPosition}
        normal={fallbackNormal}
        elementId={clickedPosition?.elementId}
        projectId={projectId}
        phaseId={phases[0]?.id}
        onSubmit={onMarkerCreated}
        teamMembers={teamMembers}
      />

      <TaskDetailPanel
        taskId={selectedTaskId}
        isOpen={detailPanelOpen}
        onClose={onCloseDetailPanel}
        userRole={userRole}
      />

      {markerSelectionMenu.open && (
        <div
          className="fixed z-50 bg-white rounded-lg shadow-2xl p-2 border-2 border-gray-200"
          style={{
            top: markerSelectionMenu.position.y,
            left: markerSelectionMenu.position.x,
            transform: "translate(-50%, -100%)",
          }}
        >
          <div className="text-xs uppercase font-semibold text-gray-500 mb-1 px-2">
            Select Marker
          </div>
          {markerSelectionMenu.markers.map((marker) => {
            const config = {
              issue: { color: "#DC2626", label: "Issue" },
              note: { color: "#FBBF24", label: "Note" },
              photo: { color: "#3B82F6", label: "Photo" },
              inspection: { color: "#8B5CF6", label: "Inspection" },
              rfi: { color: "#EC4899", label: "RFI" },
              safety: { color: "#F97316", label: "Safety" },
              material: { color: "#059669", label: "Material" },
              progress: { color: "#10B981", label: "Progress" },
            }[marker.type] || { color: "#6B7280", label: "Marker" };

            return (
              <button
                key={marker.id}
                onClick={() => {
                  onSelectMarker(marker);
                  onCloseMarkerSelection();
                }}
                className="w-full text-left px-3 py-2 hover:bg-gray-100 rounded flex items-center gap-2"
              >
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: config.color }}
                />
                <span className="text-sm">{marker.title}</span>
              </button>
            );
          })}
        </div>
      )}
    </>
  );
}
