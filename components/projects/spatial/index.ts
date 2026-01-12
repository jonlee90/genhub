// Debug: Barrel exports for spatial 3D viewer components
// Phase 2 - 3D Rendering Core

// P2.2 - Core canvas
export { ThreeDViewerCanvas } from './3DViewerCanvas';
export type { ThreeDViewerCanvasProps, CameraState } from './3DViewerCanvas';

// P2.5 - Model loading
export { ModelLoader } from './ModelLoader';
export type { ModelLoaderProps } from './ModelLoader';

// P2.3 - Camera controls
export { CameraControls } from './CameraControls';
export type { CameraControlsProps } from './CameraControls';

// P2.6 - LOD management
export { LODManager } from './LODManager';
export type { LODManagerProps } from './LODManager';

// P2.7 - Interaction
export { InteractionLayer } from './InteractionLayer';
export type { InteractionLayerProps } from './InteractionLayer';

// Complete integration
export { SpatialViewer } from './SpatialViewer';
export type { SpatialViewerProps } from './SpatialViewer';

// Phase 4 - GenHub Integration
export { PhaseFilter } from './PhaseFilter';
export { TaskLinker } from './TaskLinker';
export { PhotoLocationSuggester } from './PhotoLocationSuggester';
export {
  MaterialMarkerBadge,
  MaterialMarkerListItem,
  MaterialStatusLegend,
} from './MaterialMarkers';

// Spatial Viewer Redesign - Mobile PWA Components
export { MarkerFilterSheet } from './MarkerFilterSheet';
export type { MarkerFilterSheetProps } from './MarkerFilterSheet';
