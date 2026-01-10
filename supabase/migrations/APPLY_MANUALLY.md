# Manual Migration Application Guide

## Why Manual Application is Needed

The `exec_sql` RPC function required by the automated script doesn't exist in this Supabase project. The recommended approach is to use the Supabase Dashboard SQL Editor.

## Quick Steps

1. Open Supabase Dashboard: https://supabase.com/dashboard/project/fozwbpqgkcduwxqvmkjd/sql
2. Click "New Query"
3. Copy-paste each migration file content below (in order)
4. Click "RUN" for each one
5. Verify success

---

## Migration 1: Enum Types

```sql
-- Migration: Create enum types for document and photo categories
-- Author: agent-backend-engineer
-- Date: 2026-01-06

-- Document categories enum
CREATE TYPE public.document_category AS ENUM (
  'contracts',
  'permits',
  'drawings',
  'reports',
  'financial',
  'safety',
  'meeting_notes',
  'specifications',
  'general'
);

COMMENT ON TYPE public.document_category IS 'Categories for construction documents following industry standards';

-- Photo categories enum
CREATE TYPE public.photo_category AS ENUM (
  'site_progress',
  'safety_documentation',
  'permits_approvals',
  'inspection_reports',
  'material_receipts',
  'change_orders',
  'defects_issues',
  'before_after',
  'task_receipts',
  'expense_receipts',
  'general'
);

COMMENT ON TYPE public.photo_category IS 'Categories for construction site photos with receipt integration';
```

**Expected Result:** "Success. No rows returned"

---

## Migration 2: project_files Table

[See full content in: 20260106000002_create_project_files.sql]

This migration creates:
- project_files table with all columns
- 5 indexes for performance
- RLS policies (4 total: SELECT, INSERT, UPDATE, DELETE)
- Auto-update timestamp trigger

**Expected Result:** "Success. No rows returned"

---

## Migration 3: project_photos Table

[See full content in: 20260106000003_create_project_photos.sql]

This migration creates:
- project_photos table with EXIF support
- 4 indexes for performance
- RLS policies (4 total)

**Expected Result:** "Success. No rows returned"

---

## Migration 4: file_audit_log Table

[See full content in: 20260106000004_create_file_audit_log.sql]

This migration creates:
- file_audit_log table
- 3 indexes
- RLS policies (2 total: SELECT, INSERT)

**Expected Result:** "Success. No rows returned"

---

## Verification Queries

After applying all migrations, run these queries to verify:

```sql
-- Check enum types exist
SELECT typname FROM pg_type WHERE typname IN ('document_category', 'photo_category');

-- Check tables exist
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN ('project_files', 'project_photos', 'file_audit_log');

-- Check RLS is enabled
SELECT tablename, rowsecurity FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN ('project_files', 'project_photos', 'file_audit_log');

-- Check policies exist (should return 10 total)
SELECT tablename, policyname FROM pg_policies
WHERE schemaname = 'public'
AND tablename IN ('project_files', 'project_photos', 'file_audit_log');

-- Check indexes exist
SELECT tablename, indexname FROM pg_indexes
WHERE schemaname = 'public'
AND tablename IN ('project_files', 'project_photos', 'file_audit_log');
```

---

## After Migration

### Regenerate TypeScript Types

**Option A: Using Supabase CLI**
```bash
npx supabase gen types typescript --project-id fozwbpqgkcduwxqvmkjd --schema public > types/database.types.ts
```

**Option B: Load env vars first**
```bash
source <(grep -E '^SUPABASE_' .env.local | xargs -I {} echo "export {}") && \
npx supabase gen types typescript --project-id "$SUPABASE_PROJECT_ID" > types/database.types.ts
```

### Commit Changes

```bash
git add supabase/migrations/202601060000*.sql
git add supabase/migrations/README_FILE_MIGRATIONS.md
git add types/database.types.ts
git commit -m "feat(database): add file management schema with versioning and audit trail"
```

---

## Troubleshooting

### Error: "type already exists"
- Enum types may have been created in a previous attempt
- Either drop them first or skip to the next migration:
```sql
DROP TYPE IF EXISTS public.document_category CASCADE;
DROP TYPE IF EXISTS public.photo_category CASCADE;
```

### Error: "relation already exists"
- Table may have been partially created
- Either drop it first or verify it's complete:
```sql
DROP TABLE IF EXISTS public.project_files CASCADE;
-- Then re-run the migration
```

### Error: "function ... does not exist"
- Helper functions (`get_user_company_id`, `is_user_gc_admin`, `update_updated_at_column`) must already exist
- Check if they're defined in earlier migrations

---

## Alternative: Create exec_sql Helper Function

If you want to enable automated migration scripts, first create this function:

```sql
CREATE OR REPLACE FUNCTION public.exec_sql(query text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  EXECUTE query;
END;
$$;

-- Grant execute permission to service role
GRANT EXECUTE ON FUNCTION public.exec_sql(text) TO service_role;

COMMENT ON FUNCTION public.exec_sql IS 'Execute arbitrary SQL (use with extreme caution)';
```

**⚠️ WARNING:** This function allows arbitrary SQL execution and should only be accessible to service_role.

After creating this function, you can run:
```bash
node scripts/apply-file-migrations.mjs
```

