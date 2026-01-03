# Apply Migration 045 - Fix Project Creation Error

## Quick Summary

**Error:** "Failed to create project: relation 'public.phases' does not exist"

**Cause:** Migration 045 trigger not applied to database

**Fix:** Apply SQL migration manually via Supabase Dashboard

---

## Step-by-Step Fix

### 1. Open Supabase SQL Editor

Click this link: **[Open SQL Editor](https://supabase.com/dashboard/project/fozwbpqgkcduwxqvmkjd/sql/new)**

### 2. Copy Migration SQL

Open file: `supabase/migrations/045_auto_create_phases_tasks_from_templates.sql`

Select all (Cmd+A or Ctrl+A) and copy (Cmd+C or Ctrl+C)

### 3. Paste and Execute

1. Paste the SQL into the editor
2. Click the green **"Run"** button (or press Cmd+Enter)
3. Wait for success message

### 4. Verify Migration Worked

Run this command in your terminal:

```bash
node scripts/verify-migration-applied.mjs
```

**Expected output:**
```
✅ SUCCESS! 5 phases auto-created:
   1. Initiation (status: not_started)
   2. Pre-Construction (status: not_started)
   3. Procurement (status: not_started)
   4. Construction (status: not_started)
   5. Post-Construction (status: not_started)

🟢 RESULT: Migration successfully applied!
```

### 5. Test in App

Try creating a project again through your app. It should now work without errors!

---

## What This Migration Does

✅ Creates database trigger `create_phases_and_tasks_on_project_insert`
✅ Creates function `create_phases_and_tasks_from_templates()`
✅ Automatically creates 5 default phases when a project is created
✅ Will use templates from `phase_templates` table (if configured)

---

## Troubleshooting

**If verification still fails:**

1. Check Supabase Dashboard → Logs for errors
2. Ensure you're using the Service Role key (not anon key)
3. Try applying migration again
4. Check that `project_phases` table exists

**If you see "function does not exist" errors:**

The SQL may need to be run in smaller batches. Try copying sections one at a time:
- Section 1: Add column (lines 1-26)
- Section 2: Drop old triggers (lines 28-34)
- Section 3: Create function (lines 36-132)
- Section 4: Create trigger (lines 134-140)

---

## Migration File Content Preview

The migration creates this trigger function:

```sql
CREATE OR REPLACE FUNCTION public.create_phases_and_tasks_from_templates()
RETURNS TRIGGER AS $$
BEGIN
  -- If no project_type_config_id, create 5 default phases
  IF NEW.project_type_config_id IS NULL THEN
    INSERT INTO public.project_phases (project_id, name, order_index, status)
    VALUES
      (NEW.id, 'Initiation', 1, 'not_started'),
      (NEW.id, 'Pre-Construction', 2, 'not_started'),
      (NEW.id, 'Procurement', 3, 'not_started'),
      (NEW.id, 'Construction', 4, 'not_started'),
      (NEW.id, 'Post-Construction', 5, 'not_started');
    RETURN NEW;
  END IF;

  -- Otherwise, create from templates...
  -- (see full file for complete logic)
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

And this trigger:

```sql
CREATE TRIGGER create_phases_and_tasks_on_project_insert
  AFTER INSERT ON public.projects
  FOR EACH ROW
  EXECUTE FUNCTION public.create_phases_and_tasks_from_templates();
```

---

## After Applying

Once the migration is applied:

- ✅ Creating a project will automatically create 5 phases
- ✅ If you configure `project_type_configs` and templates, it will use those instead
- ✅ No more "relation 'public.phases' does not exist" errors
- ✅ Your project creation flow will work end-to-end

---

## Need Help?

If you're still having issues:

1. Check `FIX_PROJECT_CREATION_ERROR.md` for detailed diagnosis
2. Run `node scripts/check-trigger-status.mjs` to see current state
3. Verify tables exist: `node scripts/check-tables.mjs`
