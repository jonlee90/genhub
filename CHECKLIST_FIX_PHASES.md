# Fix Project Phases - Checklist

Use this checklist to ensure the fix is applied correctly.

## Pre-Fix Verification

- [ ] Confirmed error: `column "status" of relation "project_phases" does not exist`
- [ ] Error occurs when creating a new project
- [ ] Have access to Supabase SQL Editor

## Apply Fix

- [ ] **Step 1:** Open Supabase Dashboard
  - Go to https://app.supabase.com
  - Select your project
  - Click "SQL Editor" in left sidebar

- [ ] **Step 2:** Copy `APPLY_THIS_FIX_PHASES.sql`
  - Open file: `APPLY_THIS_FIX_PHASES.sql`
  - Copy entire contents (Cmd/Ctrl+A, Cmd/Ctrl+C)

- [ ] **Step 3:** Run in SQL Editor
  - Paste into SQL Editor (Cmd/Ctrl+V)
  - Click "Run" button
  - Wait for success message

- [ ] **Step 4:** Verify Results
  - Check console output for "NOTICE" messages
  - Should see: "Added status column to project_phases"
  - Should see table with all columns listed

## Post-Fix Verification

- [ ] **Step 5:** Run Verification Query
  - Open file: `VERIFY_PHASES_COLUMNS.sql`
  - Copy and paste into SQL Editor
  - Click "Run"
  - Confirm these columns exist:
    - [ ] `status` (phase_status type)
    - [ ] `completion_percentage` (integer)
    - [ ] `started_at` (timestamp)
    - [ ] `completed_at` (timestamp)

- [ ] **Step 6:** Check Enum Values
  - Verify phase_status enum has values:
    - [ ] `not_started`
    - [ ] `in_progress`
    - [ ] `completed`

- [ ] **Step 7:** Regenerate TypeScript Types
  ```bash
  npx supabase gen types typescript --project-id YOUR_PROJECT_REF > types/database.types.ts
  ```
  - [ ] Replace `YOUR_PROJECT_REF` with actual project ID
  - [ ] Run command in terminal
  - [ ] Verify `types/database.types.ts` was updated

## Test Fix

- [ ] **Step 8:** Create Test Project
  - Go to your app
  - Try creating a new project
  - Fill in required fields
  - Click "Create Project"

- [ ] **Step 9:** Verify Success
  - [ ] No error message appears
  - [ ] Project is created successfully
  - [ ] Project phases are visible
  - [ ] Phases show correct status ('not_started')

## Cleanup (Optional)

- [ ] Commit migration file to git:
  ```bash
  git add supabase/migrations/047_fix_project_phases_add_status.sql
  git commit -m "fix(database): add missing status column to project_phases"
  ```

- [ ] Archive fix files (if desired):
  - Move `APPLY_THIS_FIX_PHASES.sql` to `docs/fixes/`
  - Move `VERIFY_PHASES_COLUMNS.sql` to `docs/fixes/`
  - Keep `FIX_PHASES_README.md` for reference

## Troubleshooting

### If fix fails:
- [ ] Check Supabase database permissions
- [ ] Verify you're in correct project
- [ ] Check for conflicting migrations
- [ ] Review error message in SQL Editor

### If project creation still fails:
- [ ] Check browser console for errors
- [ ] Verify user has proper role (gc_admin or project_manager)
- [ ] Check company_users table has active status
- [ ] Review RLS policies on project_phases table

### If types regeneration fails:
- [ ] Verify Supabase CLI is installed: `npx supabase --version`
- [ ] Check project ID is correct
- [ ] Verify you're logged in: `npx supabase login`

---

## Success Criteria

✅ **Fix is successful when:**
1. No database errors when creating projects
2. Project phases are created with status 'not_started'
3. All phase columns exist in database
4. TypeScript types include phase_status enum
5. Application works normally

---

**Questions? Check:**
- `PROJECT_PHASES_FIX_SUMMARY.md` - Overview
- `FIX_PHASES_README.md` - Detailed guide
- `supabase/migrations/006_project_phases.sql` - Original schema
