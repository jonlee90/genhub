-- ============================================================
-- VERIFICATION QUERY: Check project_phases table columns
-- ============================================================
-- Run this in Supabase SQL Editor to verify all columns exist
-- ============================================================

-- Check all columns in project_phases table
SELECT
  column_name,
  data_type,
  udt_name,
  column_default,
  is_nullable,
  character_maximum_length
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'project_phases'
ORDER BY ordinal_position;

-- ============================================================
-- EXPECTED COLUMNS (minimum required):
-- ============================================================
-- id (uuid)
-- project_id (uuid)
-- name (text)
-- order_index (integer)
-- status (USER-DEFINED / phase_status)  ← MUST EXIST!
-- completion_percentage (integer)
-- start_date (date)
-- end_date (date)
-- description (text)
-- started_at (timestamp with time zone)  ← MUST EXIST!
-- completed_at (timestamp with time zone)  ← MUST EXIST!
-- created_at (timestamp with time zone)
-- updated_at (timestamp with time zone)
-- ============================================================

-- Check if status column exists (should return 1 row)
SELECT COUNT(*) as status_column_exists
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'project_phases'
AND column_name = 'status';

-- Check phase_status enum values
SELECT enumlabel as phase_status_values
FROM pg_enum
WHERE enumtypid = 'public.phase_status'::regtype
ORDER BY enumsortorder;

-- ============================================================
-- If status_column_exists = 0, run APPLY_THIS_FIX_PHASES.sql
-- ============================================================
