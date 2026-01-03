# Quick Fix for "cafe" Project Type Error

## The Problem
Creating a project with type "cafe" fails because the database enum doesn't include it.

## The Solution (Choose One)

### Option 1: Supabase Dashboard (30 seconds) ⭐
1. Open Supabase Dashboard → SQL Editor
2. Run this SQL:

```sql
-- Add new values
ALTER TYPE public.project_type ADD VALUE IF NOT EXISTS 'restaurant';
ALTER TYPE public.project_type ADD VALUE IF NOT EXISTS 'cafe';

-- Recreate enum
ALTER TYPE public.project_type RENAME TO project_type_old;

CREATE TYPE public.project_type AS ENUM (
  'residential',
  'restaurant',
  'cafe',
  'commercial_office',
  'industrial'
);

ALTER TABLE public.projects
  ALTER COLUMN project_type TYPE public.project_type
  USING project_type::text::public.project_type;

ALTER TABLE public.phase_templates
  ALTER COLUMN project_type TYPE public.project_type
  USING project_type::text::public.project_type;

DROP TYPE public.project_type_old;
```

3. Done! Restart your Next.js server and test.

### Option 2: Supabase CLI
```bash
npx supabase link --project-ref [YOUR-REF]
npx supabase db push
```

## Verify It Worked
Try creating a project with type "cafe" - it should work! ✅

## More Details
See `FIX_SUMMARY.md` and `MIGRATION_INSTRUCTIONS.md` for complete documentation.
