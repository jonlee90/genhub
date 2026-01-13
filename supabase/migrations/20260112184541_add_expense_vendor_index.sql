-- Migration: add_expense_vendor_index
-- Purpose: Optimize vendor_name lookups for cost aggregation in getProjectTeamCostSummary
--
-- This index supports queries that filter expenses by project_id and then
-- process vendor_name for matching against team members/subcontractors.
--
-- Note: Using CREATE INDEX CONCURRENTLY to avoid locking the expenses table.
-- This must be run outside a transaction block.

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_expenses_vendor_project
ON public.expenses (vendor_name, project_id);

-- Add comment for documentation
COMMENT ON INDEX idx_expenses_vendor_project IS 'Optimizes vendor_name lookups for cost aggregation queries (e.g., getProjectTeamCostSummary)';
