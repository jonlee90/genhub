# Fix: Missing status column in project_phases table

## Error
```
column "status" of relation "project_phases" does not exist
```

## Solution

### Apply the fix via Supabase SQL Editor:

1. **Open Supabase Dashboard** → SQL Editor
2. **Copy the entire contents** of `APPLY_THIS_FIX_PHASES.sql`
3. **Paste into SQL Editor**
4. **Click "Run"**

### What this fix does:

✅ Creates `phase_status` enum type (if missing)
✅ Adds `status` column with default value 'not_started'
✅ Adds index on `status` for query performance
✅ Adds `completion_percentage` column (0-100)
✅ Adds `started_at` timestamp column
✅ Adds `completed_at` timestamp column
✅ Verifies all columns exist

### Expected Result:

After running the SQL, you should see a table showing all columns in `project_phases`, including:

- `id` (uuid)
- `project_id` (uuid)
- `name` (text)
- `order_index` (integer)
- **`status` (phase_status)** ← This should now exist!
- `completion_percentage` (integer)
- `start_date` (date)
- `end_date` (date)
- `description` (text)
- `started_at` (timestamp)
- `completed_at` (timestamp)
- `created_at` (timestamp)
- `updated_at` (timestamp)

### Regenerate TypeScript Types (IMPORTANT):

After applying the fix, regenerate your database types:

```bash
npx supabase gen types typescript --project-id YOUR_PROJECT_REF > types/database.types.ts
```

Replace `YOUR_PROJECT_REF` with your Supabase project reference ID (found in your Supabase URL).

### Test the fix:

Try creating a project again. The error should be gone.

---

## Root Cause Analysis

The `project_phases` table was created via migration `006_project_phases.sql` which includes the `status` column. However, it appears this migration was not fully applied to your database, possibly due to:

1. Migration file not run in Supabase
2. Table created manually without all columns
3. Column accidentally dropped in a later migration

This fix uses idempotent SQL (safe to run multiple times) to ensure all required columns exist.
