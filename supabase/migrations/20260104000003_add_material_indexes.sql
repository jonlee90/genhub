-- Migration: Add indexes to materials and material_assignments tables
-- Purpose: Optimize queries for Home Depot sync, pagination, and aggregation
-- Date: 2026-01-04

-- Indexes on materials table

-- For Home Depot price sync lookup (only index non-null product IDs)
CREATE INDEX IF NOT EXISTS idx_materials_home_depot_product_id
  ON public.materials(home_depot_product_id)
  WHERE home_depot_product_id IS NOT NULL;

-- For company-wide material lookups (only index active materials)
CREATE INDEX IF NOT EXISTS idx_materials_company_active
  ON public.materials(company_id, is_active)
  WHERE is_active = true;

-- Indexes on material_assignments table

-- For aggregating materials by quantity (used in pagination queries)
CREATE INDEX IF NOT EXISTS idx_material_assignments_material_id
  ON public.material_assignments(material_id);

-- For counting tasks per material (composite index)
CREATE INDEX IF NOT EXISTS idx_material_assignments_task_material
  ON public.material_assignments(task_id, material_id);

-- For aggregating by project
CREATE INDEX IF NOT EXISTS idx_material_assignments_project_id
  ON public.material_assignments(project_id);

-- Add index comments
COMMENT ON INDEX public.idx_materials_home_depot_product_id IS 'Optimizes Home Depot API price sync lookups';
COMMENT ON INDEX public.idx_materials_company_active IS 'Optimizes company-wide active material queries';
COMMENT ON INDEX public.idx_material_assignments_material_id IS 'Optimizes material quantity aggregation queries';
COMMENT ON INDEX public.idx_material_assignments_task_material IS 'Optimizes task-per-material counting';
COMMENT ON INDEX public.idx_material_assignments_project_id IS 'Optimizes project-level material aggregation';
