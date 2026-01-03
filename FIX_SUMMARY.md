# Project Type Enum Fix - Summary

## Issue
**Error**: `Failed to create project: invalid input value for enum project_type: "cafe"`

**Root Cause**: Mismatch between frontend and database enum values.

### Frontend (CreateProjectForm.tsx)
Offers 5 project types:
- `residential`
- `restaurant` ⚠️
- `cafe` ⚠️
- `commercial_office`
- `industrial`

### Database (Before Fix)
Only had 4 values:
- `residential`
- `restaurant_cafe` ⚠️ (combined type)
- `commercial_office`
- `industrial`

---

## What Was Fixed

### 1. Created Migration File
**File**: `supabase/migrations/20260102150000_update_project_type_enum.sql`

This migration:
- Adds `restaurant` and `cafe` as separate enum values
- Migrates any existing `restaurant_cafe` projects to `restaurant`
- Recreates the enum without the old `restaurant_cafe` value
- Updates all tables that use the enum

### 2. Updated Base Migration Files
To prevent this issue in future deployments:

- ✅ `supabase/migrations/02_enums.sql` - Updated
- ✅ `supabase/migrations/005_projects.sql` - Updated
- ✅ `supabase/migrations/__consolidated_migration.sql` - Updated

All now define the enum as:
```sql
CREATE TYPE public.project_type AS ENUM (
  'residential',
  'restaurant',
  'cafe',
  'commercial_office',
  'industrial'
);
```

---

## Next Steps (ACTION REQUIRED)

### Step 1: Apply the Migration to Your Database

You have 3 options:

#### Option A: Supabase Dashboard (Easiest) ⭐
1. Go to your Supabase dashboard
2. Navigate to **SQL Editor**
3. Copy the SQL from `supabase/migrations/20260102150000_update_project_type_enum.sql`
4. Paste and run it
5. Verify success

#### Option B: Supabase CLI
```bash
npx supabase link --project-ref [YOUR-PROJECT-REF]
npx supabase db push
```

#### Option C: PostgreSQL CLI
```bash
export DATABASE_URL="your-connection-string"
psql $DATABASE_URL -f supabase/migrations/20260102150000_update_project_type_enum.sql
```

**See `MIGRATION_INSTRUCTIONS.md` for detailed instructions for each method.**

---

### Step 2: Regenerate TypeScript Types

After applying the migration, update your TypeScript types:

```bash
# Get your project ref from NEXT_PUBLIC_SUPABASE_URL
# Example: https://abcdefghijk.supabase.co → ref is "abcdefghijk"

npx supabase gen types typescript --project-id [YOUR-PROJECT-REF] > types/database.types.ts
```

---

### Step 3: Verify the Fix

1. **Check the enum in Supabase**:
   ```sql
   SELECT enumlabel
   FROM pg_enum
   WHERE enumtypid = 'project_type'::regtype
   ORDER BY enumsortorder;
   ```

   Should return:
   - residential
   - restaurant
   - cafe
   - commercial_office
   - industrial

2. **Test in your app**:
   - Restart your Next.js dev server
   - Try creating a project with type "cafe"
   - Should work without errors ✅

---

## Files Modified

### Migration Files (Local)
- ✅ `supabase/migrations/20260102150000_update_project_type_enum.sql` (new)
- ✅ `supabase/migrations/02_enums.sql` (updated)
- ✅ `supabase/migrations/005_projects.sql` (updated)
- ✅ `supabase/migrations/__consolidated_migration.sql` (updated)

### Documentation
- ✅ `MIGRATION_INSTRUCTIONS.md` (new - detailed migration guide)
- ✅ `FIX_SUMMARY.md` (this file)

### Scripts (Optional)
- ✅ `scripts/apply-project-type-migration.ts` (alternative migration method)

---

## Why This Happened

The original database schema combined restaurant and cafe into a single `restaurant_cafe` type, but the frontend UI was later designed to offer them as separate options for better user experience and project categorization.

This fix aligns the database with the frontend design.

---

## Future Prevention

- The base migration files (`02_enums.sql`, `005_projects.sql`, `__consolidated_migration.sql`) have been updated
- Any new database deployments will use the correct enum values
- Existing databases need to apply the migration (`20260102150000_update_project_type_enum.sql`)

---

## Troubleshooting

### Still getting the error?
1. Verify the migration ran successfully in Supabase
2. Clear browser cache and restart dev server
3. Check if TypeScript types were regenerated
4. Verify you're using the latest code

### Migration fails?
- See detailed troubleshooting in `MIGRATION_INSTRUCTIONS.md`
- Check Supabase logs for specific error messages
- Ensure you have admin access to run migrations

---

## Questions?

Check the following files:
- **Migration instructions**: `MIGRATION_INSTRUCTIONS.md`
- **Migration SQL**: `supabase/migrations/20260102150000_update_project_type_enum.sql`
- **Frontend form**: `components/projects/CreateProjectForm.tsx`
