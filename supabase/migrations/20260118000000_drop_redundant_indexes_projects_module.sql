-- Drop redundant indexes identified during Phase 4 optimization
-- These older indexes are duplicates of newer, more optimized indexes

-- Material Assignments table
-- Drop old style indexes that duplicate newer idx_* pattern indexes
DROP INDEX IF EXISTS public.material_assignments_material_idx;  -- Duplicate of idx_material_assignments_material_id
DROP INDEX IF EXISTS public.material_assignments_project_idx;   -- Duplicate of idx_material_assignments_project_id
DROP INDEX IF EXISTS public.material_assignments_task_idx;      -- Redundant with idx_material_assignments_task_material

-- Tasks table
-- Keep idx_tasks_assignee (partial index with WHERE assignee_id IS NOT NULL)
-- Drop tasks_assignee_idx (full table index, less efficient)
DROP INDEX IF EXISTS public.tasks_assignee_idx;

-- Keep idx_tasks_due_date_status (composite index)
-- Drop tasks_due_date_idx (single column, covered by composite)
DROP INDEX IF EXISTS public.tasks_due_date_idx;

-- Comment: Remaining indexes are optimal for query patterns
-- - project_files: idx_project_files_project (partial with deleted_at IS NULL)
-- - project_photos: idx_project_photos_project (partial with deleted_at IS NULL)
-- - tasks: idx_tasks_project_status (composite with INCLUDE columns)
-- - material_assignments: idx_material_assignments_project_id, idx_material_assignments_task_material
