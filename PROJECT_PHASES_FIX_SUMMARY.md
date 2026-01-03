# Project Phases Fix Summary

## Issue
**Error:** `column "status" of relation "project_phases" does not exist`

**Location:** Creating a new project fails when trying to insert phases with status column.

## Root Cause
The `project_phases` table is missing the `status` column and potentially other columns (`started_at`, `completed_at`, `completion_percentage`) that are expected by the application code.

## Files Created

### 1. `APPLY_THIS_FIX_PHASES.sql` ⭐ **USE THIS**
**Copy and paste this entire file into Supabase SQL Editor and run it.**

This file will:
- ✅ Create `phase_status` enum type
- ✅ Add `status` column with default 'not_started'
- ✅ Add index on `status` for performance
- ✅ Add `completion_percentage` column (0-100)
- ✅ Add `started_at` timestamp column
- ✅ Add `completed_at` timestamp column
- ✅ All operations are idempotent (safe to run multiple times)

### 2. `VERIFY_PHASES_COLUMNS.sql`
**Run this to check if the fix was successful.**

Shows all columns in `project_phases` table and verifies:
- Status column exists
- Enum values are correct
- All expected columns are present

### 3. `supabase/migrations/047_fix_project_phases_add_status.sql`
**Migration file for version control.**

Same as `APPLY_THIS_FIX_PHASES.sql` but saved in migrations folder for future reference.

### 4. `FIX_PHASES_README.md`
**Detailed guide with step-by-step instructions.**

## Quick Start

### Step 1: Apply the Fix
1. Open Supabase Dashboard → SQL Editor
2. Copy entire contents of `APPLY_THIS_FIX_PHASES.sql`
3. Paste and click "Run"

### Step 2: Verify
1. Copy contents of `VERIFY_PHASES_COLUMNS.sql`
2. Paste and click "Run"
3. Confirm `status` column exists

### Step 3: Regenerate Types
```bash
npx supabase gen types typescript --project-id YOUR_PROJECT_REF > types/database.types.ts
```

### Step 4: Test
Try creating a project again. Error should be gone!

## Expected Schema After Fix

```sql
CREATE TABLE project_phases (
  id uuid PRIMARY KEY,
  project_id uuid REFERENCES projects(id),
  name text NOT NULL,
  order_index integer NOT NULL,
  status phase_status NOT NULL DEFAULT 'not_started',  ← FIXED
  completion_percentage integer DEFAULT 0,             ← ADDED
  start_date date,
  end_date date,
  description text,
  started_at timestamp with time zone,                 ← ADDED
  completed_at timestamp with time zone,               ← ADDED
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Enum type
CREATE TYPE phase_status AS ENUM (
  'not_started',
  'in_progress',
  'completed'
);
```

## Columns Added/Fixed

| Column | Type | Default | Required | Purpose |
|--------|------|---------|----------|---------|
| `status` | phase_status | 'not_started' | YES | Track phase progress |
| `completion_percentage` | integer | 0 | NO | Track % completion (0-100) |
| `started_at` | timestamp | NULL | NO | When phase started |
| `completed_at` | timestamp | NULL | NO | When phase completed |

## Why This Happened

The migration file `006_project_phases.sql` includes the `status` column definition, but it appears it was not fully applied to your database. This can happen if:

1. Migration was not run in Supabase
2. Table was created manually without all columns
3. Column was accidentally dropped in a later operation

## Prevention

To prevent this in the future:
1. Always run migrations through Supabase CLI or SQL Editor
2. Verify migrations with `VERIFY_PHASES_COLUMNS.sql`
3. Keep `database.types.ts` regenerated after schema changes
4. Use migration files in `supabase/migrations/` folder

---

**Need Help?**
- Check `FIX_PHASES_README.md` for detailed instructions
- Run `VERIFY_PHASES_COLUMNS.sql` to check current state
- Review migration file `047_fix_project_phases_add_status.sql`
