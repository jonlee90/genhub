/**
 * Spatial Domain Types
 *
 * TypeScript types for spatial/3D modeling features:
 * - 3D model management
 * - Spatial markers (task-linked and standalone)
 * - BIM/IFC visualization
 * - Marker clustering and filtering
 */

import type {
  Projects3dModelsRow,
  Projects3dModelsInsert,
  Projects3dModelsUpdate,
  SpatialMarkersRow,
  SpatialMarkersInsert,
  SpatialMarkersUpdate,
  MarkerContentRow,
  MarkerContentInsert,
  MarkerContentUpdate,
  ModelElementsRow,
  ModelElementsInsert,
  ModelElementsUpdate,
  DefaultMarkerConfigsRow,
} from './tables/spatial';
import type {
  SpatialProcessingStatus,
  SpatialMarkerType,
  SpatialMarkerStatus,
  MarkerContentType,
} from './enums';

// ============================================
// Database Table Types
// ============================================

export type Project3DModel = Projects3dModelsRow;
export type Project3DModelInsert = Projects3dModelsInsert;
export type Project3DModelUpdate = Projects3dModelsUpdate;

/**
 * SpatialMarker - A marker placed on a 3D model
 *
 * @property task_id - Optional reference to a linked task.
 *   - When `task_id` is non-null: Marker is linked to a task, clicking opens TaskDetailPanel
 *   - When `task_id` is null: Marker is standalone (issue, note, safety, etc.), clicking shows marker info
 */
export type SpatialMarker = SpatialMarkersRow;
export type SpatialMarkerInsert = SpatialMarkersInsert;
export type SpatialMarkerUpdate = SpatialMarkersUpdate;

export type MarkerContent = MarkerContentRow;
export type { MarkerContentInsert, MarkerContentUpdate };

export type ModelElement = ModelElementsRow;
export type { ModelElementsInsert as ModelElementInsert, ModelElementsUpdate as ModelElementUpdate };

export type DefaultMarkerConfig = DefaultMarkerConfigsRow;

// ============================================
// Enum Types
// ============================================

export type {
  SpatialProcessingStatus,
  SpatialMarkerType,
  SpatialMarkerStatus,
  MarkerContentType,
};

// ============================================
// 3D Geometry Types
// ============================================

export interface Position3D {
  x: number;
  y: number;
  z: number;
}

export interface Normal3D {
  x: number;
  y: number;
  z: number;
}

export interface BoundingBox {
  minX: number;
  minY: number;
  minZ: number;
  maxX: number;
  maxY: number;
  maxZ: number;
}

export interface FloorInfo {
  id: string;
  name: string;
  elevation: number;
}

// ============================================
// Composite Types
// ============================================

export interface MarkerWithContent extends SpatialMarker {
  content: MarkerContent[];
  creator?: {
    id: string;
    name: string;
    avatar_url?: string;
  };
}

export type ModelWithStats = Project3DModel & {
  marker_count?: number;
  element_count?: number | null;
};

// ============================================
// Upload Types
// ============================================

export interface UploadChunkMetadata {
  uploadId: string;
  projectId: string;
  fileName: string;
  chunkIndex: number;
  totalChunks: number;
  chunkSize: number;
  totalSize: number;
}

export interface UploadProgress {
  uploadId: string;
  chunksReceived: number;
  totalChunks: number;
  bytesReceived: number;
  totalBytes: number;
  complete: boolean;
}

// ============================================
// API Response Types
// ============================================

export interface CreateModelResponse {
  success: boolean;
  data?: Project3DModel;
  error?: string;
}

export interface UploadModelResponse {
  success: boolean;
  uploadId?: string;
  chunksReceived?: number;
  totalChunks?: number;
  complete?: boolean;
  modelId?: string;
  error?: string;
}

export interface ConvertModelResponse {
  success: boolean;
  data?: Project3DModel;
  error?: string;
}

export interface CreateMarkerResponse {
  success: boolean;
  data?: SpatialMarker;
  error?: string;
}

export interface GetMarkersResponse {
  success: boolean;
  data?: SpatialMarker[];
  error?: string;
}

export interface AttachContentResponse {
  success: boolean;
  data?: MarkerContent;
  error?: string;
}

// ============================================
// Filter Types
// ============================================

export interface MarkerFilters {
  type?: SpatialMarkerType;
  status?: SpatialMarkerStatus;
  floor_id?: string;
  task_id?: string;
  phase_id?: string;
  created_by?: string;
}

export interface ModelFilters {
  is_active?: boolean;
  processing_status?: SpatialProcessingStatus;
}
