-- Migration: Add performance indexes to subcontractors table
-- Date: 2026-01-25
-- Purpose: Improve query performance for company + email lookups and active filtering

-- Composite index for company + email lookups (used in create/update duplicate checks)
-- Partial index (only indexes rows with non-null email) to save space
CREATE INDEX IF NOT EXISTS idx_subcontractors_company_email
ON subcontractors(company_id, email)
WHERE email IS NOT NULL;

-- Partial index for active subcontractors (used in UI filtering)
-- Only indexes active subcontractors to improve query performance
CREATE INDEX IF NOT EXISTS idx_subcontractors_company_active
ON subcontractors(company_id, is_active)
WHERE is_active = true;

-- Index for trade specialization filtering (common query pattern)
CREATE INDEX IF NOT EXISTS idx_subcontractors_company_trade
ON subcontractors(company_id, trade_specialization)
WHERE is_active = true;

-- Comments for documentation
COMMENT ON INDEX idx_subcontractors_company_email IS 'Improves performance of duplicate email checks in create/update operations';
COMMENT ON INDEX idx_subcontractors_company_active IS 'Improves performance of active subcontractor filtering in UI';
COMMENT ON INDEX idx_subcontractors_company_trade IS 'Improves performance of trade specialization filtering in UI';
