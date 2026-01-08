/**
 * File Management Types
 * Generated from supabase migrations (20260106000001-000004)
 *
 * These types correspond to:
 * - project_files table (documents with versioning)
 * - project_photos table (photos with EXIF metadata)
 * - file_audit_log table (immutable audit trail)
 *
 * NOTE: These are manual type definitions. After Supabase migrations are deployed,
 * regenerate types/database.types.ts to ensure full type coverage:
 * npx supabase gen types typescript --project-id fozwbpqgkcduwxqvmkjd --schema public > types/database.types.ts
 */

// ============================================================================
// Enums
// ============================================================================

export type DocumentCategory =
  | 'contracts'
  | 'permits'
  | 'drawings'
  | 'reports'
  | 'financial'
  | 'safety'
  | 'meeting_notes'
  | 'specifications'
  | 'general';

export type PhotoCategory =
  | 'site_progress'
  | 'safety_documentation'
  | 'permits_approvals'
  | 'inspection_reports'
  | 'material_receipts'
  | 'change_orders'
  | 'defects_issues'
  | 'before_after'
  | 'task_receipts'
  | 'expense_receipts'
  | 'general';

export type FileAuditAction = 'upload' | 'delete' | 'version_update' | 'category_change';
export type FileAuditType = 'document' | 'photo';

// ============================================================================
// Project Files Table
// ============================================================================

export interface ProjectFile {
  id: string; // uuid PK
  company_id: string; // uuid FK
  project_id: string; // uuid FK
  uploaded_by: string; // uuid FK (next_auth.users)
  filename: string; // Displayed filename
  original_filename: string; // Original filename on upload
  file_url: string; // Vercel Blob URL
  file_size: number; // Size in bytes
  file_type: string; // MIME type (e.g., 'application/pdf')
  category: DocumentCategory; // Document category
  tags: string[] | null; // Custom tags array
  client_visible: boolean; // Visibility in client portal
  version_number: number; // Version number (default 1)
  parent_file_id: string | null; // Links to original for version history
  metadata: {
    hash?: string; // SHA-256 hash for integrity
    [key: string]: any; // Custom metadata
  } | null;
  deleted_at: string | null; // Soft delete timestamp (ISO 8601)
  created_at: string; // ISO 8601 timestamp
  updated_at: string; // ISO 8601 timestamp
}

export interface ProjectFileInsert {
  company_id: string;
  project_id: string;
  uploaded_by: string;
  filename: string;
  original_filename: string;
  file_url: string;
  file_size: number;
  file_type: string;
  category?: DocumentCategory;
  tags?: string[];
  client_visible?: boolean;
  metadata?: Record<string, any>;
}

export interface ProjectFileUpdate {
  category?: DocumentCategory;
  tags?: string[];
  client_visible?: boolean;
  metadata?: Record<string, any>;
}

// ============================================================================
// Project Photos Table
// ============================================================================

export interface ProjectPhoto {
  id: string; // uuid PK
  company_id: string; // uuid FK
  project_id: string; // uuid FK
  uploaded_by: string; // uuid FK (next_auth.users)
  filename: string; // Photo filename
  photo_url: string; // Vercel Blob URL (full-size)
  thumbnail_url: string | null; // Vercel Blob URL (300x300px)
  file_size: number; // Size in bytes
  category: PhotoCategory; // Photo category
  tags: string[] | null; // Custom tags array
  exif_data: {
    timestamp?: string; // ISO 8601 timestamp from EXIF
    camera?: {
      make?: string; // Camera manufacturer
      model?: string; // Camera model
      lens?: string; // Lens info
    };
    gps?: {
      latitude?: number;
      longitude?: number;
      altitude?: number; // Optional altitude in meters
    };
    exposure?: {
      iso?: number;
      fNumber?: number; // f-stop (e.g., 2.8)
      exposureTime?: string; // Shutter speed (e.g., "1/250")
      focalLength?: number; // Focal length in mm
    };
  } | null;
  client_visible: boolean; // Visibility in client portal
  deleted_at: string | null; // Soft delete timestamp (ISO 8601)
  created_at: string; // ISO 8601 timestamp
}

export interface ProjectPhotoInsert {
  company_id: string;
  project_id: string;
  uploaded_by: string;
  filename: string;
  photo_url: string;
  thumbnail_url?: string | null;
  file_size: number;
  category?: PhotoCategory;
  tags?: string[];
  exif_data?: ProjectPhoto['exif_data'];
  client_visible?: boolean;
}

export interface ProjectPhotoUpdate {
  category?: PhotoCategory;
  tags?: string[];
  exif_data?: ProjectPhoto['exif_data'];
  client_visible?: boolean;
}

// ============================================================================
// File Audit Log Table
// ============================================================================

export interface FileAuditLog {
  id: string; // uuid PK
  company_id: string; // uuid FK
  file_id: string | null; // uuid (references project_files OR project_photos)
  file_type: FileAuditType; // 'document' or 'photo'
  action: FileAuditAction; // Action type
  performed_by: string; // uuid FK (next_auth.users)
  previous_state: Record<string, any> | null; // JSON snapshot before action
  new_state: Record<string, any> | null; // JSON snapshot after action
  created_at: string; // ISO 8601 timestamp (immutable)
}

export interface FileAuditLogInsert {
  company_id: string;
  file_id?: string | null;
  file_type: FileAuditType;
  action: FileAuditAction;
  performed_by: string;
  previous_state?: Record<string, any> | null;
  new_state?: Record<string, any> | null;
}

// ============================================================================
// Unified File Types (for aggregation)
// ============================================================================

export type UnifiedFile = ProjectFile | ProjectPhoto;

export interface UnifiedFileMetadata {
  source: 'document' | 'photo';
  id: string;
  project_id: string;
  company_id: string;
  uploaded_by: string;
  filename: string;
  file_size: number;
  category: DocumentCategory | PhotoCategory;
  tags: string[] | null;
  client_visible: boolean;
  deleted_at: string | null;
  created_at: string;
  updated_at?: string;
  // Photo-specific
  photo_url?: string;
  thumbnail_url?: string;
  exif_data?: ProjectPhoto['exif_data'];
  // Document-specific
  file_url?: string;
  file_type?: string;
  version_number?: number;
  parent_file_id?: string;
  metadata?: Record<string, any>;
}

// ============================================================================
// Query Response Types
// ============================================================================

export interface ProjectFilesResponse {
  files: ProjectFile[];
  total: number;
  hasMore: boolean;
}

export interface ProjectPhotosResponse {
  photos: ProjectPhoto[];
  total: number;
  hasMore: boolean;
}

export interface FileAuditLogResponse {
  logs: FileAuditLog[];
  total: number;
  hasMore: boolean;
}

// ============================================================================
// Filter & Search Types
// ============================================================================

export interface FileFilterOptions {
  category?: DocumentCategory | PhotoCategory;
  uploadedBy?: string;
  dateFrom?: string; // ISO 8601 date
  dateTo?: string; // ISO 8601 date
  clientVisible?: boolean;
  searchTerm?: string;
}

export interface FileAuditFilterOptions {
  fileId?: string;
  fileType?: FileAuditType;
  action?: FileAuditAction;
  performedBy?: string;
  dateFrom?: string; // ISO 8601 date
  dateTo?: string; // ISO 8601 date
}
