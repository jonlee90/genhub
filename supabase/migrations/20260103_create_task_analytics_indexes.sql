-- Migration: 20260103_create_task_analytics_indexes.sql
-- Purpose: Create optimized indexes for get_task_analytics function
-- Performance target: < 500ms for 1000 tasks
-- Reference: supabase/migrations/20260103_create_task_analytics_function.sql

-- =============================================================================
-- PROJECTS TABLE INDEXES
-- =============================================================================

-- Index for company-scoped project lookups (used in filtered_tasks CTE)
-- Supports: WHERE company_id = p_company_id in subquery
CREATE INDEX IF NOT EXISTS idx_projects_company_id
  ON public.projects (company_id)
  INCLUDE (id);

COMMENT ON INDEX public.idx_projects_company_id IS
  'Optimizes company-scoped project lookups for analytics filtering. Includes id for index-only scans.';

-- =============================================================================
-- TASKS TABLE INDEXES
-- =============================================================================

-- Composite index for project + status filtering (primary analytics query pattern)
-- Supports: WHERE project_id IN (...) AND status = ...
CREATE INDEX IF NOT EXISTS idx_tasks_project_status
  ON public.tasks (project_id, status)
  INCLUDE (assignee_id, due_date, priority, planned_cost, actual_cost, completed_at, blocked_reason);

COMMENT ON INDEX public.idx_tasks_project_status IS
  'Optimizes project-scoped task analytics with status filtering. Includes all columns needed for aggregations.';

-- Index for overdue/at-risk calculations (schedule metrics)
-- Supports: WHERE due_date < NOW() AND status != 'completed'
--           WHERE due_date BETWEEN NOW() AND NOW() + INTERVAL '3 days'
CREATE INDEX IF NOT EXISTS idx_tasks_due_date_status
  ON public.tasks (due_date, status)
  WHERE due_date IS NOT NULL;

COMMENT ON INDEX public.idx_tasks_due_date_status IS
  'Optimizes overdue and at-risk task queries. Partial index excludes tasks without due dates.';

-- Index for velocity trend calculations (last 7/14 days)
-- Supports: WHERE completed_at >= NOW() - INTERVAL '7 days'
CREATE INDEX IF NOT EXISTS idx_tasks_completed_at
  ON public.tasks (completed_at)
  WHERE completed_at IS NOT NULL;

COMMENT ON INDEX public.idx_tasks_completed_at IS
  'Optimizes velocity trend calculations (tasks completed in last 7/14 days). Partial index for efficiency.';

-- Index for assignee-based aggregations
-- Supports: WHERE assignee_id IS NOT NULL for top assignees query
CREATE INDEX IF NOT EXISTS idx_tasks_assignee
  ON public.tasks (assignee_id)
  WHERE assignee_id IS NOT NULL;

COMMENT ON INDEX public.idx_tasks_assignee IS
  'Optimizes assignee-based aggregations for workload metrics. Partial index excludes unassigned tasks.';

-- Index for blocked tasks analysis
-- Supports: WHERE status = 'blocked' AND blocked_reason IS NOT NULL
CREATE INDEX IF NOT EXISTS idx_tasks_blocked
  ON public.tasks (status, blocked_reason)
  WHERE status = 'blocked' AND blocked_reason IS NOT NULL;

COMMENT ON INDEX public.idx_tasks_blocked IS
  'Optimizes blocked task analysis for top blocker reasons. Partial index for efficiency.';

-- =============================================================================
-- MATERIAL_ASSIGNMENTS TABLE INDEXES
-- =============================================================================

-- Composite index for task-scoped material lookups with procurement status
-- Supports: WHERE task_id IN (...) AND procurement_status = ...
CREATE INDEX IF NOT EXISTS idx_material_assignments_task_procurement
  ON public.material_assignments (task_id, procurement_status);

COMMENT ON INDEX public.idx_material_assignments_task_procurement IS
  'Optimizes material procurement status aggregations (needed/ordered/delivered) for analytics.';

-- =============================================================================
-- EXPENSES TABLE INDEXES
-- =============================================================================

-- Composite index for task-scoped expense lookups with status
-- Supports: WHERE task_id IN (...) AND status IN ('submitted', 'under_review', 'approved')
CREATE INDEX IF NOT EXISTS idx_expenses_task_status
  ON public.expenses (task_id, status)
  INCLUDE (amount);

COMMENT ON INDEX public.idx_expenses_task_status IS
  'Optimizes expense status aggregations (pending/approved) for analytics. Includes amount for sum calculations.';

-- =============================================================================
-- TASK_DEPENDENCIES TABLE INDEXES
-- =============================================================================

-- Index for dependency lookups by task
-- Supports: WHERE task_id IN (...)
CREATE INDEX IF NOT EXISTS idx_task_dependencies_task_id
  ON public.task_dependencies (task_id)
  INCLUDE (depends_on_task_id);

COMMENT ON INDEX public.idx_task_dependencies_task_id IS
  'Optimizes task dependency lookups for blocked-by-dependencies calculations. Includes depends_on_task_id for join.';

-- Index for reverse dependency lookups
-- Supports: WHERE depends_on_task_id IN (...)
CREATE INDEX IF NOT EXISTS idx_task_dependencies_depends_on
  ON public.task_dependencies (depends_on_task_id)
  INCLUDE (task_id);

COMMENT ON INDEX public.idx_task_dependencies_depends_on IS
  'Optimizes reverse dependency lookups (tasks blocking others). Includes task_id for join.';

-- =============================================================================
-- USER_PROFILES TABLE INDEXES
-- =============================================================================

-- Index for assignee profile lookups (used in filtered_tasks CTE)
-- Supports: LEFT JOIN user_profiles ON assignee_id = user_profiles.id
CREATE INDEX IF NOT EXISTS idx_user_profiles_id
  ON public.user_profiles (id)
  INCLUDE (name, avatar_url);

COMMENT ON INDEX public.idx_user_profiles_id IS
  'Optimizes user profile lookups for assignee information in analytics. Includes name and avatar_url for index-only scans.';

-- =============================================================================
-- VERIFY INDEX CREATION
-- =============================================================================

-- Output summary of created indexes
DO $$
DECLARE
  index_count INTEGER;
BEGIN
  SELECT COUNT(*)
  INTO index_count
  FROM pg_indexes
  WHERE schemaname = 'public'
    AND indexname LIKE 'idx_%'
    AND (
      indexname LIKE 'idx_projects_%' OR
      indexname LIKE 'idx_tasks_%' OR
      indexname LIKE 'idx_material_assignments_%' OR
      indexname LIKE 'idx_expenses_%' OR
      indexname LIKE 'idx_task_dependencies_%' OR
      indexname LIKE 'idx_user_profiles_%'
    );

  RAISE NOTICE 'Task analytics indexes created successfully. Total indexes: %', index_count;
END $$;
