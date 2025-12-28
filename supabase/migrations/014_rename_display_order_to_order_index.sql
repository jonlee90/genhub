-- Rename display_order to order_index in project_phases table
-- This aligns the database schema with the TypeScript types and template interfaces

-- Rename the column
ALTER TABLE public.project_phases
  RENAME COLUMN display_order TO order_index;

-- Update the unique constraint name to match the new column name
ALTER TABLE public.project_phases
  DROP CONSTRAINT unique_order_per_project;

ALTER TABLE public.project_phases
  ADD CONSTRAINT unique_order_per_project UNIQUE (project_id, order_index);

-- Add comment
COMMENT ON COLUMN public.project_phases.order_index IS 'Determines the order of phases in the Metro Journey visualization';
