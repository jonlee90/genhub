-- Migration: Add composite indexes for settings page performance
-- Date: 2026-01-23
-- Task: HIGH-4 - Add composite indexes via migration
--
-- Purpose: Optimize queries for active config filtering and ordered listings
-- Affected tables: project_type_configs, task_type_configs

-- ============================================
-- Composite Indexes for Active Filtering
-- ============================================

-- project_type_configs: Optimize filtering by company + is_active
-- Used by: getProjectTypes() query in app/actions/project-types.ts
CREATE INDEX IF NOT EXISTS idx_project_type_configs_company_active
ON project_type_configs(company_id, is_active)
WHERE is_active = true;

-- task_type_configs: Optimize filtering by company + is_active
-- Used by: getTaskTypes() query in app/actions/task-types.ts
CREATE INDEX IF NOT EXISTS idx_task_type_configs_company_active
ON task_type_configs(company_id, is_active)
WHERE is_active = true;

-- ============================================
-- Verification Query (Run after migration)
-- ============================================
-- SELECT indexname, tablename, indexdef
-- FROM pg_indexes
-- WHERE indexname IN ('idx_project_type_configs_company_active', 'idx_task_type_configs_company_active');

-- ============================================
-- Notes
-- ============================================
-- - Partial indexes (WHERE is_active = true) for better performance
-- - Existing order_index indexes remain for drag-and-drop reordering
-- - phase_templates and task_templates already have adequate indexes
