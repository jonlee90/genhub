// P1.10 - TypeScript types for spatial domain
import type { Database } from './database.types';

// Database table types
export type Project3DModel = Database['public']['Tables']['projects_3d_models']['Row'];
export type Project3DModelInsert = Database['public']['Tables']['projects_3d_models']['Insert'];
export type Project3DModelUpdate = Database['public']['Tables']['projects_3d_models']['Update'];

/**
 * SpatialMarker - A marker placed on a 3D model
 *
 * @property task_id - Optional reference to a linked task.
 *   - When `task_id` is non-null: Marker is linked to a task, clicking opens TaskDetailPanel
 *   - When `task_id` is null: Marker is standalone (issue, note, safety, etc.), clicking shows marker info
 */
export type SpatialMarker = Database['public']['Tables']['spatial_markers']['Row'];
export type SpatialMarkerInsert = Database['public']['Tables']['spatial_markers']['Insert'];
export type SpatialMarkerUpdate = Database['public']['Tables']['spatial_markers']['Update'];

export type MarkerContent = Database['public']['Tables']['marker_content']['Row'];
export type MarkerContentInsert = Database['public']['Tables']['marker_content']['Insert'];
export type MarkerContentUpdate = Database['public']['Tables']['marker_content']['Update'];

export type ModelElement = Database['public']['Tables']['model_elements']['Row'];
export type ModelElementInsert = Database['public']['Tables']['model_elements']['Insert'];
export type ModelElementUpdate = Database['public']['Tables']['model_elements']['Update'];

// Enum types
export type SpatialProcessingStatus = Database['public']['Enums']['spatial_processing_status'];
export type SpatialMarkerType = Database['public']['Enums']['spatial_marker_type'];
export type SpatialMarkerStatus = Database['public']['Enums']['spatial_marker_status'];
export type MarkerContentType = Database['public']['Enums']['marker_content_type'];

// 3D geometry types
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

// Composite types
export interface MarkerWithContent extends SpatialMarker {
  content: MarkerContent[];
  creator?: {
    id: string;
    name: string;
    avatar_url?: string;
  };
}

export interface ModelWithStats extends Project3DModel {
  marker_count?: number;
  element_count?: number;
}

// Upload types
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

// API response types
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

// Filter types for queries
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
