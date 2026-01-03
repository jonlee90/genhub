# Project Type Enum Migration Instructions

## Problem
The frontend form offers these project types:
- `residential`
- `restaurant`
- `cafe`
- `commercial_office`
- `industrial`

But the database only has:
- `residential`
- `restaurant_cafe` (combined)
- `commercial_office`
- `industrial`

This causes the error: `invalid input value for enum project_type: "cafe"`

## Solution
Update the `project_type` enum to split `restaurant_cafe` into separate `restaurant` and `cafe` types.

---

## Method 1: Supabase Dashboard (Recommended)

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Click **New Query**
4. Copy and paste the SQL below:

```sql
-- Step 1: Add new enum values
ALTER TYPE public.project_type ADD VALUE IF NOT EXISTS 'restaurant';
ALTER TYPE public.project_type ADD VALUE IF NOT EXISTS 'cafe';

-- Step 2: Update any existing projects (if any)
UPDATE public.projects
SET project_type = 'restaurant'
WHERE project_type = 'restaurant_cafe';

-- Step 3: Recreate the enum without the old value
-- Save old enum
ALTER TYPE public.project_type RENAME TO project_type_old;

-- Create new enum with correct values
CREATE TYPE public.project_type AS ENUM (
  'residential',
  'restaurant',
  'cafe',
  'commercial_office',
  'industrial'
);

-- Update the column to use the new type
ALTER TABLE public.projects
  ALTER COLUMN project_type TYPE public.project_type
  USING project_type::text::public.project_type;

-- Update phase_templates table if it exists
ALTER TABLE public.phase_templates
  ALTER COLUMN project_type TYPE public.project_type
  USING project_type::text::public.project_type;

-- Drop old enum
DROP TYPE public.project_type_old;

-- Add comment
COMMENT ON TYPE public.project_type IS 'Project types: residential, restaurant, cafe, commercial_office, industrial';
```

5. Click **Run** or press `Ctrl+Enter`
6. Verify success (should see "Success. No rows returned")

---

## Method 2: Using psql (if you have PostgreSQL CLI)

1. Get your database URL from Supabase dashboard:
   - Go to **Project Settings** > **Database**
   - Copy the connection string (make sure to replace `[YOUR-PASSWORD]`)

2. Run the migration:

```bash
# Set the DATABASE_URL
export DATABASE_URL="postgresql://postgres:[YOUR-PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres"

# Apply the migration
psql $DATABASE_URL -f supabase/migrations/20260102150000_update_project_type_enum.sql
```

---

## Method 3: Using Supabase CLI

```bash
# Link to your project (if not already linked)
npx supabase link --project-ref [YOUR-PROJECT-REF]

# Push the migration
npx supabase db push
```

---

## Verification

After running the migration, verify it worked:

### In Supabase Dashboard:
1. Go to **SQL Editor**
2. Run this query:

```sql
SELECT enumlabel
FROM pg_enum
WHERE enumtypid = 'project_type'::regtype
ORDER BY enumsortorder;
```

You should see:
- residential
- restaurant
- cafe
- commercial_office
- industrial

### In your app:
1. Try creating a project with type "cafe"
2. It should now work without errors

---

## Regenerate TypeScript Types

After the migration, regenerate your TypeScript types:

```bash
# Get your project ref from NEXT_PUBLIC_SUPABASE_URL
# Example: https://abcdefghijk.supabase.co → project ref is "abcdefghijk"

npx supabase gen types typescript --project-id [YOUR-PROJECT-REF] > types/database.types.ts
```

---

## Troubleshooting

### Error: "type already exists"
- This means some enum values were already added
- You can skip to step 3 (recreating the enum)

### Error: "cannot drop type because other objects depend on it"
- Make sure to update all tables that use the enum before dropping the old type
- Check if there are other tables besides `projects` and `phase_templates`

### Still getting "invalid input value"
1. Clear your browser cache
2. Restart your Next.js dev server
3. Verify the enum was updated (run the verification query above)
4. Check if you regenerated the TypeScript types

---

## File Locations

- **Migration file**: `supabase/migrations/20260102150000_update_project_type_enum.sql`
- **Frontend form**: `components/projects/CreateProjectForm.tsx` (lines 43-74)
- **TypeScript types**: `types/database.types.ts` (regenerate after migration)
