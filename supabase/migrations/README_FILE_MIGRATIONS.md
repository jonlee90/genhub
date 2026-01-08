# File Management Migrations - Task 0001

## Overview
Database schema for project files and photos feature with versioning, EXIF metadata, audit trails, and RLS policies.

## Migration Files Created

1. **20260106000001_create_file_enums.sql** - Document and photo category enums
2. **20260106000002_create_project_files.sql** - Project files table with versioning
3. **20260106000003_create_project_photos.sql** - Project photos with EXIF data
4. **20260106000004_create_file_audit_log.sql** - Immutable audit trail

## Schema Summary

### Enum Types
- `document_category`: contracts, permits, drawings, reports, financial, safety, meeting_notes, specifications, general
- `photo_category`: site_progress, safety_documentation, permits_approvals, inspection_reports, material_receipts, change_orders, defects_issues, before_after, task_receipts, expense_receipts, general

### Tables

#### project_files
- Document management with version control
- Soft delete (30-day recovery period)
- Client visibility control
- File metadata tracking (SHA-256 hash)
- Parent file linkage for versions

#### project_photos
- Site photos with thumbnails
- EXIF metadata (GPS, camera, exposure)
- Category-based organization
- Client visibility control

#### file_audit_log
- Immutable audit trail
- Tracks all critical file operations
- Stores before/after state snapshots
- Company-scoped access

### Security (RLS)

All tables enforce:
- Company isolation via `get_user_company_id()`
- Project team membership checks
- Owner-only updates/deletes (or GC admin)
- Soft-deleted records hidden from queries

### Indexes

Optimized for:
- Project-scoped queries
- Category filtering
- User activity tracking
- Version history traversal
- Audit log lookups

## How to Apply Migrations

### Option 1: Supabase Dashboard (Recommended)
1. Go to https://supabase.com/dashboard/project/fozwbpqgkcduwxqvmkjd
2. Navigate to SQL Editor
3. Copy-paste each migration file in order
4. Execute each migration
5. Verify in Table Editor

### Option 2: Supabase CLI
```bash
# Ensure you're logged in
npx supabase login

# Link project (if not already linked)
npx supabase link --project-ref fozwbpqgkcduwxqvmkjd

# Push all pending migrations
npx supabase db push
```

### Option 3: Direct psql (requires network access)
```bash
export DATABASE_URL="postgresql://postgres:cB9SBintANEMOiTD@db.fozwbpqgkcduwxqvmkjd.supabase.co:5432/postgres"

psql "$DATABASE_URL" -f supabase/migrations/20260106000001_create_file_enums.sql
psql "$DATABASE_URL" -f supabase/migrations/20260106000002_create_project_files.sql
psql "$DATABASE_URL" -f supabase/migrations/20260106000003_create_project_photos.sql
psql "$DATABASE_URL" -f supabase/migrations/20260106000004_create_file_audit_log.sql
```

## After Migration

### 1. Regenerate TypeScript Types
```bash
# Using MCP Supabase (if available)
mcp__supabase__generate_typescript_types

# OR using Supabase CLI
npx supabase gen types typescript --project-id fozwbpqgkcduwxqvmkjd --schema public > types/database.types.ts
```

### 2. Verify Schema
Check the following in Supabase dashboard:
- [ ] Enum types exist (`document_category`, `photo_category`)
- [ ] Tables created with all columns
- [ ] RLS enabled on all tables
- [ ] Policies created (4 per table for files/photos, 2 for audit log)
- [ ] Indexes created
- [ ] Foreign key constraints working
- [ ] Triggers attached

### 3. Test RLS Policies
```sql
-- Test company isolation
SELECT * FROM project_files; -- Should only see own company's files
SELECT * FROM project_photos; -- Should only see own company's photos

-- Test project team access
INSERT INTO project_files (...); -- Should only work if user is on project team

-- Test soft delete
SELECT * FROM project_files WHERE deleted_at IS NULL; -- Should exclude deleted files
```

### 4. Security Audit
```bash
# Using MCP Supabase
mcp__supabase__get_advisors type:"security"
```

## TypeScript Type Regeneration

After migrations are applied, the following types will be generated:

```typescript
// Enums
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

// Tables
export interface ProjectFile {
  id: string;
  company_id: string;
  project_id: string;
  uploaded_by: string;
  filename: string;
  original_filename: string;
  file_url: string;
  file_size: number;
  file_type: string;
  category: DocumentCategory;
  tags: string[] | null;
  client_visible: boolean;
  version_number: number;
  parent_file_id: string | null;
  metadata: Json | null;
  deleted_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface ProjectPhoto {
  id: string;
  company_id: string;
  project_id: string;
  uploaded_by: string;
  filename: string;
  photo_url: string;
  thumbnail_url: string | null;
  file_size: number;
  category: PhotoCategory;
  tags: string[] | null;
  exif_data: Json | null;
  client_visible: boolean;
  deleted_at: string | null;
  created_at: string;
}

export interface FileAuditLog {
  id: string;
  company_id: string;
  file_id: string | null;
  file_type: string;
  action: string;
  performed_by: string;
  previous_state: Json | null;
  new_state: Json | null;
  created_at: string;
}
```

## Next Steps

1. Apply migrations using one of the methods above
2. Regenerate TypeScript types
3. Create Server Actions in `app/actions/files.ts` and `app/actions/photos.ts`
4. Implement file upload UI components
5. Add Vercel Blob integration for file storage
6. Implement EXIF extraction for photos
7. Create audit log hooks for critical operations

## Troubleshooting

### .env.local Parse Error
If you encounter `unexpected character ']' in variable name`:
- This is a known issue with line 48 in `.env.local`
- Use Option 1 (Dashboard) or temporarily work from a different directory

### Network/DNS Issues
If psql cannot resolve `db.fozwbpqgkcduwxqvmkjd.supabase.co`:
- Check internet connection
- Verify DNS resolution
- Use Supabase Dashboard (Option 1) instead

### Authentication Issues
If Supabase CLI requires login:
```bash
npx supabase login
# Follow prompts to authenticate
```

## References

- [Supabase Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)
- [Supabase CLI](https://supabase.com/docs/guides/cli)
- [GenHub DB Schema](/Users/jonathanlee/Desktop/genhub/.claude/docs/law/DB_SCHEMA.md)
