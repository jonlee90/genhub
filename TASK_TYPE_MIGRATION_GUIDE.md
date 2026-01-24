# Task Type Migration Guide

## Overview

This migration converts the `tasks.task_type` column from a PostgreSQL enum to a text column, allowing users to add custom task type names via Settings > Project Configuration > Task Type.

## Problem Solved

**Before:** Task types were restricted to these enum values:
- work
- purchase
- approval
- admin

**After:** Any custom task type name can be added via the UI, stored as snake_case slugs.

Example: User creates "Custom Task Type" → stored as `custom_task_type`

---

## Migration Files Created

### 0. `20260123000000_cleanup_before_task_type_migration.sql` (DEV ONLY)

**What it does:**
- Deletes ALL data from: tasks, project_phases, projects
- **Run this first!** (Dev environment only)

### 1. `20260123000001_convert_task_type_enum_to_text.sql`

**What it does:**
- Drops dependent database functions that cast to `task_type` enum
- Drops the index on `task_type`
- **Drops the old enum column entirely** (safe because data was already deleted)
- **Creates new text column** with same name
- Adds NOT NULL and DEFAULT 'work' constraints
- Recreates the index
- Drops the `task_type` enum type
- Recreates the `seed_default_configs_for_company()` function with text support

**Must be applied second!**

### 2. `20260123000002_recreate_template_functions_text.sql`

**What it does:**
- Recreates `create_phases_and_tasks_from_templates()` function with text support
- This function is triggered when projects are created to generate default phases/tasks

**Must be applied third!**

---

## How to Apply Migrations

### Via Supabase Dashboard (DEV ENVIRONMENT ONLY)

**⚠️ WARNING: This deletes all projects, tasks, and related data!**

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. **Step 1:** Copy the contents of `20260123000000_cleanup_before_task_type_migration.sql`
   - Paste and run
   - This deletes all project/task data
4. **Step 2:** Copy the contents of `20260123000001_convert_task_type_enum_to_text.sql`
   - Paste and run
   - Wait for success confirmation
5. **Step 3:** Copy the contents of `20260123000002_recreate_template_functions_text.sql`
   - Paste and run
   - Verify success

### Alternative: Via Supabase CLI (if connected to local database)

```bash
# Reset local database (applies all migrations in order)
npx supabase db reset --local
```

**Note:** The Supabase MCP tools don't work for this migration due to infrastructure constraints.

---

## Post-Migration Steps

### 1. Regenerate TypeScript Types

After applying both migrations, regenerate your TypeScript types from the database:

```bash
npx supabase gen types typescript --project-id YOUR_PROJECT_ID > types/database.types.ts
```

Or use the MCP tool:

```typescript
// Via Supabase MCP
mcp__supabase__generate_typescript_types()
```

**Expected change in `types/db/enums.ts`:**

```typescript
// Before:
export type TaskType = 'work' | 'purchase' | 'approval' | 'admin';

// After:
export type TaskType = string; // or the enum is removed entirely
```

### 2. Verify Build Passes

```bash
npm run build
```

**No code changes should be needed!** The application code already treats `task_type` as a string.

---

## Testing Checklist

After migration, verify:

- [ ] Existing projects still load correctly
- [ ] Existing tasks show correct task types
- [ ] Can create new projects (triggers template function)
- [ ] Can create tasks with existing task types
- [ ] In Settings > Project Configuration > Task Type:
  - [ ] Can add a new custom task type (e.g., "Custom Type")
  - [ ] Can rename an existing task type
  - [ ] Can create a task with the new custom type
  - [ ] Custom type name is converted to snake_case for storage

---

## Rollback Plan

If issues arise, you can rollback by:

1. Restore from backup (if available)
2. Or manually revert:

```sql
-- Drop the text column and recreate enum (data loss!)
ALTER TABLE tasks ALTER COLUMN task_type DROP DEFAULT;
ALTER TABLE tasks DROP COLUMN task_type;

CREATE TYPE task_type AS ENUM ('work', 'purchase', 'approval', 'admin');

ALTER TABLE tasks ADD COLUMN task_type task_type NOT NULL DEFAULT 'work';
```

**WARNING:** This will lose any custom task type data!

---

## Related Changes

This migration follows the same pattern as the `project_type` migration completed earlier:

- **20260122000002_convert_project_type_enum_to_text.sql** - Converted project types
- **20260123000001_convert_task_type_enum_to_text.sql** - Converts task types (this migration)

Both allow users to add custom types via the Settings UI.

---

## Questions?

If you encounter any issues:

1. Check Supabase logs for detailed error messages
2. Verify both migration files were applied in order
3. Confirm TypeScript types were regenerated
4. Check the build output for any type errors

---

**Status:** ✅ Migration files created for DEV environment (deletes all data)
**Next Step:** Apply 3 migrations in order via Supabase Dashboard SQL Editor
