# Fix: "relation public.phases does not exist" Error

## Problem Summary

When creating a project, you're getting the error: **"Failed to create project: relation 'public.phases' does not exist"**

## Root Cause

The database trigger `create_phases_and_tasks_from_templates()` has **NOT been applied** to your Supabase database yet. This trigger is supposed to automatically create phases and tasks when a new project is created, but it only exists in the migration file locally—it hasn't been executed on the remote database.

## Evidence

✅ Table `project_phases` exists
✅ Table `tasks` exists
✅ Table `phase_templates` exists
✅ Table `task_templates` exists
❌ Trigger `create_phases_and_tasks_on_project_insert` **does NOT exist**
❌ Function `create_phases_and_tasks_from_templates()` **does NOT exist**

**Test result:** When creating a project, 0 phases are created automatically (trigger not firing).

## Solution: Apply Migration Manually via Supabase Dashboard

Since automated SQL execution is blocked, you need to apply the migration manually:

### Step 1: Open Supabase SQL Editor

Go to: **[Supabase Dashboard → SQL Editor](https://supabase.com/dashboard/project/fozwbpqgkcduwxqvmkjd/sql/new)**

### Step 2: Copy Migration SQL

Open the file:
`supabase/migrations/045_auto_create_phases_tasks_from_templates.sql`

Copy the entire contents of that file.

### Step 3: Paste and Run

1. Paste the SQL into the Supabase SQL Editor
2. Click **"Run"** button
3. Wait for confirmation

### Step 4: Verify

After running the migration, create a test script to verify:

```bash
node scripts/check-trigger-status.mjs
```

You should see:
✅ Trigger worked! Created 5 phases

---

## What the Migration Does

The migration file `045_auto_create_phases_tasks_from_templates.sql` does the following:

1. **Adds `project_type_config_id` column** to `projects` table (if not exists)
2. **Drops old hardcoded triggers** (cleanup)
3. **Creates function** `create_phases_and_tasks_from_templates()` that:
   - Checks if project has a `project_type_config_id`
   - If YES: Creates phases/tasks from templates in `phase_templates` and `task_templates`
   - If NO: Creates 5 default universal phases (fallback)
4. **Creates trigger** `create_phases_and_tasks_on_project_insert` that:
   - Fires AFTER INSERT on `projects` table
   - Automatically calls the function above

---

## Alternative: Use Supabase CLI (if you have it set up)

If you have Supabase CLI configured with your project:

```bash
npx supabase db push
```

This will push all pending migrations to the remote database.

---

## Why Automated Scripts Failed

1. ❌ **Direct PostgreSQL connection** (`apply-migration-pg.mjs`) → Database hostname blocked
2. ❌ **Management API** (`apply-migration-management-api.mjs`) → Requires personal access token
3. ❌ **RPC methods** (`apply-migration-simple.mjs`) → No `exec_sql` or `query` function exists in your database

The **only reliable method** for Supabase hosted instances without CLI is **manual SQL execution via Dashboard**.

---

## After Applying the Migration

Once the migration is applied successfully:

1. The trigger will automatically create phases when you create a new project
2. If `project_type_config_id` is set → Creates phases/tasks from templates
3. If `project_type_config_id` is NULL → Creates 5 default phases:
   - Initiation
   - Pre-Construction
   - Procurement
   - Construction
   - Post-Construction

---

## Files Created for Diagnosis

During troubleshooting, these diagnostic scripts were created:

- `scripts/check-tables.mjs` - Lists tables in database
- `scripts/check-trigger-function.mjs` - Checks trigger function source
- `scripts/test-project-creation.mjs` - Tests project creation with detailed errors
- `scripts/check-trigger-status.mjs` - Verifies trigger status
- `scripts/apply-migration-pg.mjs` - Attempts PostgreSQL direct connection (fails)
- `scripts/apply-migration-management-api.mjs` - Attempts Management API (needs token)
- `scripts/apply-migration-simple.mjs` - Attempts RPC method (no function exists)

You can delete these after fixing the issue, or keep them for future debugging.

---

## Summary

**To fix the error:**

1. Open [Supabase SQL Editor](https://supabase.com/dashboard/project/fozwbpqgkcduwxqvmkjd/sql/new)
2. Copy/paste contents of `supabase/migrations/045_auto_create_phases_tasks_from_templates.sql`
3. Click "Run"
4. Try creating a project again

**The migration file is already written and ready to apply—it just needs to be executed on the remote database.**
