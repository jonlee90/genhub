# Task 0001: Database Migrations & Type Generation

## Status
- **Phase**: 1 - Database
- **Agent**: agent-backend-engineer
- **Estimated Effort**: 3-4 hours
- **Dependencies**: None
- **Approved**: DRAFT

---

## Overview

Create database schema for project files and photos feature: tables for `project_files`, `project_photos`, `file_audit_log`, enum types, RLS policies, indexes, and regenerate TypeScript types.

---

## Objectives

1. Create enum types for document and photo categories
2. Create `project_files` table with versioning support
3. Create `project_photos` table with EXIF metadata
4. Create `file_audit_log` table for audit trail
5. Implement RLS policies for company isolation and role-based access
6. Create optimized indexes for query performance
7. Regenerate TypeScript types from new schema

---

## Requirements Reference

- **REQ-4**: Document Upload with File Type Validation
- **REQ-5**: Document Categorization & Folder Structure
- **REQ-2**: Photo Gallery & Organization
- **REQ-3**: Photo Categorization & Tagging
- **REQ-8**: File Versioning & Audit Trail
- **REQ-12**: Permissions & Access Control

---

## Files to Create/Modify

### New Migration Files

**Migration 1: Enum Types**
- **Path**: `supabase/migrations/YYYYMMDDHHMMSS_create_file_enums.sql`
- **Purpose**: Create enum types for categories

**Migration 2: project_files Table**
- **Path**: `supabase/migrations/YYYYMMDDHHMMSS_create_project_files.sql`
- **Purpose**: Create files table with versioning, RLS, indexes

**Migration 3: project_photos Table**
- **Path**: `supabase/migrations/YYYYMMDDHHMMSS_create_project_photos.sql`
- **Purpose**: Create photos table with EXIF, RLS, indexes

**Migration 4: file_audit_log Table**
- **Path**: `supabase/migrations/YYYYMMDDHHMMSS_create_file_audit_log.sql`
- **Purpose**: Create audit log table with append-only RLS

### Types to Regenerate

- **Path**: `types/database.types.ts`
- **Tool**: MCP Supabase `generate_typescript_types`

---

## Implementation Details

### Migration 1: Enum Types

```sql
-- Document categories
CREATE TYPE document_category AS ENUM (
  'contracts',      -- Contracts & Agreements
  'permits',        -- Permits & Approvals
  'drawings',       -- Drawings & Blueprints
  'reports',        -- Reports
  'financial',      -- Financial documents
  'safety',         -- Safety & Compliance
  'meeting_notes',  -- Meeting Notes
  'specifications', -- Specifications
  'general'         -- General
);

COMMENT ON TYPE document_category IS 'Categories for construction documents following industry standards';

-- Photo categories
CREATE TYPE photo_category AS ENUM (
  'site_progress',        -- Site Progress
  'safety_documentation', -- Safety Documentation
  'permits_approvals',    -- Permits & Approvals
  'inspection_reports',   -- Inspection Reports
  'material_receipts',    -- Material Receipts
  'change_orders',        -- Change Orders
  'defects_issues',       -- Defects/Issues
  'before_after',         -- Before/After
  'task_receipts',        -- Read-only: from tasks module
  'expense_receipts',     -- Read-only: from expenses module
  'general'               -- General
);

COMMENT ON TYPE photo_category IS 'Categories for construction site photos with receipt integration';
```

### Migration 2: project_files Table

```sql
-- ============================================================================
-- project_files: Document storage with versioning
-- ============================================================================

CREATE TABLE project_files (
  -- Primary key
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Company isolation (RLS)
  company_id uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,

  -- Parent project
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,

  -- File metadata
  uploaded_by uuid NOT NULL REFERENCES next_auth.users(id),
  filename text NOT NULL,
  original_filename text NOT NULL,
  file_url text NOT NULL,                    -- Vercel Blob URL
  file_size bigint NOT NULL,                 -- Size in bytes
  file_type text NOT NULL,                   -- MIME type

  -- Organization
  category document_category NOT NULL DEFAULT 'general',
  tags text[],                                -- Custom tags array

  -- Permissions
  client_visible boolean DEFAULT false,       -- Client portal visibility

  -- Versioning
  version_number integer NOT NULL DEFAULT 1,
  parent_file_id uuid REFERENCES project_files(id), -- Version chain

  -- Metadata
  metadata jsonb,                             -- SHA-256 hash, custom data

  -- Soft delete
  deleted_at timestamptz,

  -- Timestamps
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Comments
COMMENT ON TABLE project_files IS 'Project documents with versioning and audit trail';
COMMENT ON COLUMN project_files.file_url IS 'Vercel Blob URL (signed URLs generated at runtime)';
COMMENT ON COLUMN project_files.parent_file_id IS 'Links to original file for version history';
COMMENT ON COLUMN project_files.metadata IS 'JSON object: { hash: "sha256...", custom: {...} }';
COMMENT ON COLUMN project_files.deleted_at IS 'Soft delete timestamp for 30-day recovery period';

-- Indexes
CREATE INDEX idx_project_files_project
  ON project_files(project_id)
  WHERE deleted_at IS NULL;

CREATE INDEX idx_project_files_category
  ON project_files(project_id, category)
  WHERE deleted_at IS NULL;

CREATE INDEX idx_project_files_uploaded_by
  ON project_files(uploaded_by);

CREATE INDEX idx_project_files_parent
  ON project_files(parent_file_id)
  WHERE parent_file_id IS NOT NULL;

CREATE INDEX idx_project_files_company
  ON project_files(company_id);

-- RLS Policies
ALTER TABLE project_files ENABLE ROW LEVEL SECURITY;

-- SELECT: Company members can view all non-deleted files
CREATE POLICY "project_files_select" ON project_files
FOR SELECT
USING (
  company_id = get_user_company_id(next_auth.uid())
  AND deleted_at IS NULL
);

-- INSERT: Project team members can upload
CREATE POLICY "project_files_insert" ON project_files
FOR INSERT
WITH CHECK (
  company_id = get_user_company_id(next_auth.uid())
  AND EXISTS (
    SELECT 1 FROM project_team
    WHERE project_id = project_files.project_id
    AND user_id = next_auth.uid()
  )
);

-- UPDATE: Own files or GC/PM can edit
CREATE POLICY "project_files_update" ON project_files
FOR UPDATE
USING (
  company_id = get_user_company_id(next_auth.uid())
  AND (
    uploaded_by = next_auth.uid()
    OR is_user_gc_admin(next_auth.uid())
  )
);

-- DELETE: Soft delete (set deleted_at) - own files or GC/PM
CREATE POLICY "project_files_delete" ON project_files
FOR DELETE
USING (
  company_id = get_user_company_id(next_auth.uid())
  AND (
    uploaded_by = next_auth.uid()
    OR is_user_gc_admin(next_auth.uid())
  )
);

-- Updated_at trigger
CREATE TRIGGER update_project_files_updated_at
BEFORE UPDATE ON project_files
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();
```

### Migration 3: project_photos Table

```sql
-- ============================================================================
-- project_photos: Photo storage with EXIF metadata
-- ============================================================================

CREATE TABLE project_photos (
  -- Primary key
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Company isolation (RLS)
  company_id uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,

  -- Parent project
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,

  -- Photo metadata
  uploaded_by uuid NOT NULL REFERENCES next_auth.users(id),
  filename text NOT NULL,
  photo_url text NOT NULL,                   -- Full-size Vercel Blob URL
  thumbnail_url text,                        -- 300x300 thumbnail URL
  file_size bigint NOT NULL,                 -- Size in bytes

  -- Organization
  category photo_category NOT NULL DEFAULT 'general',
  tags text[],                                -- Custom tags array

  -- EXIF metadata
  exif_data jsonb,                            -- GPS, camera, timestamp, exposure

  -- Permissions
  client_visible boolean DEFAULT false,       -- Client portal visibility

  -- Soft delete
  deleted_at timestamptz,

  -- Timestamps
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Comments
COMMENT ON TABLE project_photos IS 'Project site photos with EXIF metadata and thumbnail support';
COMMENT ON COLUMN project_photos.photo_url IS 'Vercel Blob URL for full-resolution image';
COMMENT ON COLUMN project_photos.thumbnail_url IS '300x300px thumbnail for gallery display';
COMMENT ON COLUMN project_photos.exif_data IS 'JSON: { timestamp, camera: { make, model }, gps: { latitude, longitude }, exposure: { focalLength, fNumber, iso } }';

-- Indexes
CREATE INDEX idx_project_photos_project
  ON project_photos(project_id)
  WHERE deleted_at IS NULL;

CREATE INDEX idx_project_photos_category
  ON project_photos(project_id, category)
  WHERE deleted_at IS NULL;

CREATE INDEX idx_project_photos_uploaded_by
  ON project_photos(uploaded_by);

CREATE INDEX idx_project_photos_company
  ON project_photos(company_id);

-- RLS Policies
ALTER TABLE project_photos ENABLE ROW LEVEL SECURITY;

-- SELECT: Company members can view all non-deleted photos
CREATE POLICY "project_photos_select" ON project_photos
FOR SELECT
USING (
  company_id = get_user_company_id(next_auth.uid())
  AND deleted_at IS NULL
);

-- INSERT: Project team members can upload
CREATE POLICY "project_photos_insert" ON project_photos
FOR INSERT
WITH CHECK (
  company_id = get_user_company_id(next_auth.uid())
  AND EXISTS (
    SELECT 1 FROM project_team
    WHERE project_id = project_photos.project_id
    AND user_id = next_auth.uid()
  )
);

-- UPDATE: Own photos or GC/PM can edit
CREATE POLICY "project_photos_update" ON project_photos
FOR UPDATE
USING (
  company_id = get_user_company_id(next_auth.uid())
  AND (
    uploaded_by = next_auth.uid()
    OR is_user_gc_admin(next_auth.uid())
  )
);

-- DELETE: Soft delete - own photos or GC/PM
CREATE POLICY "project_photos_delete" ON project_photos
FOR DELETE
USING (
  company_id = get_user_company_id(next_auth.uid())
  AND (
    uploaded_by = next_auth.uid()
    OR is_user_gc_admin(next_auth.uid())
  )
);
```

### Migration 4: file_audit_log Table

```sql
-- ============================================================================
-- file_audit_log: Immutable audit trail for file operations
-- ============================================================================

CREATE TABLE file_audit_log (
  -- Primary key
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Company isolation (RLS)
  company_id uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,

  -- File reference
  file_id uuid,                              -- References project_files OR project_photos
  file_type text NOT NULL,                   -- 'document' or 'photo'

  -- Action details
  action text NOT NULL,                      -- 'upload', 'delete', 'version_update', 'category_change'
  performed_by uuid NOT NULL REFERENCES next_auth.users(id),

  -- State tracking
  previous_state jsonb,                      -- State before action
  new_state jsonb,                           -- State after action

  -- Immutable timestamp
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Comments
COMMENT ON TABLE file_audit_log IS 'Immutable audit trail for critical file operations';
COMMENT ON COLUMN file_audit_log.file_id IS 'References project_files.id OR project_photos.id';
COMMENT ON COLUMN file_audit_log.previous_state IS 'JSON snapshot before action (for rollback/audit)';
COMMENT ON COLUMN file_audit_log.new_state IS 'JSON snapshot after action';

-- Indexes
CREATE INDEX idx_file_audit_log_file
  ON file_audit_log(file_id, file_type);

CREATE INDEX idx_file_audit_log_created
  ON file_audit_log(created_at DESC);

CREATE INDEX idx_file_audit_log_company
  ON file_audit_log(company_id);

-- RLS Policies
ALTER TABLE file_audit_log ENABLE ROW LEVEL SECURITY;

-- SELECT: Company members can view audit logs
CREATE POLICY "file_audit_log_select" ON file_audit_log
FOR SELECT
USING (company_id = get_user_company_id(next_auth.uid()));

-- INSERT: Append-only (triggered by app logic, not direct inserts)
CREATE POLICY "file_audit_log_insert" ON file_audit_log
FOR INSERT
WITH CHECK (
  company_id = get_user_company_id(next_auth.uid())
  AND performed_by = next_auth.uid()
);

-- NO UPDATE/DELETE: Audit log is immutable
```

---

## Acceptance Criteria

### Database Schema

- [x] Enum types created for `document_category` and `photo_category`
- [x] `project_files` table created with all columns, constraints, indexes
- [x] `project_photos` table created with all columns, constraints, indexes
- [x] `file_audit_log` table created with append-only design
- [x] All tables reference `companies` and `projects` with cascade delete
- [x] Foreign keys to `next_auth.users` for uploader/performer tracking

### RLS Policies

- [x] Company isolation enforced on all tables via `get_user_company_id()`
- [x] Project team membership checked for file uploads (INSERT policies)
- [x] Own files editable, GC/PM can edit all (UPDATE policies)
- [x] Own files deletable, GC/PM can delete all (DELETE policies)
- [x] Audit log is append-only (no UPDATE/DELETE policies)

### Indexes

- [x] Composite indexes on `(project_id, category)` for filtered queries
- [x] Indexes on `uploaded_by` for user file listings
- [x] Index on `parent_file_id` for version history traversal
- [x] Indexes exclude soft-deleted rows via `WHERE deleted_at IS NULL`
- [x] Audit log indexed by `created_at DESC` for chronological queries

### TypeScript Types

- [x] `types/database.types.ts` regenerated with new tables
- [x] Enum types exported for use in client/server code
- [x] Types include joined data from uploader profile

---

## Testing Checklist

### Manual Verification

```sql
-- Verify tables created
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN ('project_files', 'project_photos', 'file_audit_log');

-- Verify enum types
SELECT typname FROM pg_type
WHERE typname IN ('document_category', 'photo_category');

-- Verify RLS enabled
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN ('project_files', 'project_photos', 'file_audit_log');

-- Verify indexes
SELECT indexname FROM pg_indexes
WHERE schemaname = 'public'
AND tablename IN ('project_files', 'project_photos', 'file_audit_log');
```

### Policy Testing

```sql
-- Test company isolation (should return only own company's files)
SELECT * FROM project_files;

-- Test insert permission (should fail for non-team members)
INSERT INTO project_files (company_id, project_id, uploaded_by, filename, original_filename, file_url, file_size, file_type, category)
VALUES (...);

-- Test update permission (should fail for other users' files unless GC/PM)
UPDATE project_files SET category = 'reports' WHERE id = '...';

-- Test delete permission (should fail for other users' files unless GC/PM)
DELETE FROM project_files WHERE id = '...';

-- Test audit log immutability (should fail)
UPDATE file_audit_log SET action = 'modified' WHERE id = '...';
DELETE FROM file_audit_log WHERE id = '...';
```

---

## Rollback Plan

If issues arise, rollback migrations in reverse order:

```sql
-- Drop migration 4
DROP TABLE IF EXISTS file_audit_log CASCADE;

-- Drop migration 3
DROP TABLE IF EXISTS project_photos CASCADE;

-- Drop migration 2
DROP TABLE IF EXISTS project_files CASCADE;

-- Drop migration 1
DROP TYPE IF EXISTS photo_category CASCADE;
DROP TYPE IF EXISTS document_category CASCADE;
```

---

## Notes

- **Soft Delete**: `deleted_at` allows 30-day recovery period (per NFR-3)
- **Versioning**: `parent_file_id` creates version chains (REQ-8)
- **EXIF Data**: Store as JSONB for flexible schema (GPS, camera, exposure)
- **Audit Trail**: Immutable log for compliance (REQ-8, NFR-6)
- **Client Visibility**: `client_visible` flag controls client portal access (REQ-12)
- **Tags**: Text array allows custom organization beyond categories (REQ-3)
- **Receipt Integration**: `task_receipts` and `expense_receipts` categories are read-only in UI (REQ-14)

---

## References

- **Design Document**: `.claude/docs/design/project-files-upload.md`
- **Requirements**: `.claude/docs/requirements/project-files-upload.md`
- **Database Law**: `.claude/docs/law/DB_SCHEMA.md`
- **Migration Pattern**: `supabase/migrations/` (timestamped SQL files)
- **Type Generation**: MCP Supabase tool

---

**END OF TASK 0001**
