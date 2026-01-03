-- ============================================
-- Update project_type enum to match frontend
-- ============================================
-- The frontend offers: residential, restaurant, cafe, commercial_office, industrial
-- The database had: residential, restaurant_cafe, commercial_office, industrial
-- This migration splits restaurant_cafe into separate restaurant and cafe types
--
-- Created: 2026-01-02
-- ============================================

-- Step 1: Add new enum values
ALTER TYPE public.project_type ADD VALUE IF NOT EXISTS 'restaurant';
ALTER TYPE public.project_type ADD VALUE IF NOT EXISTS 'cafe';

-- Step 2: Update existing projects that use 'restaurant_cafe'
-- Note: This assumes no projects exist yet with restaurant_cafe
-- If they do, we'll migrate them to 'restaurant' as the default
UPDATE public.projects
SET project_type = 'restaurant'
WHERE project_type = 'restaurant_cafe';

-- Step 3: Remove old enum value (PostgreSQL doesn't support removing enum values directly)
-- We need to recreate the enum type
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

-- Drop old enum
DROP TYPE public.project_type_old;

-- Add comment
COMMENT ON TYPE public.project_type IS 'Project types: residential (single-family homes, apartments), restaurant (full-service dining), cafe (coffee shops, small eateries), commercial_office (office buildings, retail), industrial (warehouses, factories)';
