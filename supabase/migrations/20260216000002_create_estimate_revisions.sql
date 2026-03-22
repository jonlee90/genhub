-- Migration: Create Estimate Revisions Table
-- Description: Enables version comparison and change tracking for estimates
-- Task: EST-P2-004 - Revision Comparison View
-- Date: 2026-02-16

-- ============================================
-- ESTIMATE REVISIONS TABLE
-- ============================================

CREATE TABLE public.estimate_revisions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  estimate_id UUID NOT NULL REFERENCES public.estimates(id) ON DELETE CASCADE,
  previous_estimate_id UUID NOT NULL REFERENCES public.estimates(id) ON DELETE CASCADE,
  new_plan_upload_id UUID NOT NULL REFERENCES public.plan_uploads(id) ON DELETE CASCADE,

  -- Diff data (computed by AI comparison)
  diff_results JSONB NOT NULL DEFAULT '{}'::jsonb,
  -- Structure: { changes: DiffChange[], summary: { added, removed, modified, totalCostDelta } }

  -- Change tracking
  changes_applied JSONB NOT NULL DEFAULT '[]'::jsonb,
  -- Array of change IDs that have been accepted

  -- Metadata
  notes TEXT,

  -- Audit
  created_by UUID NOT NULL REFERENCES next_auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.estimate_revisions IS 'Tracks estimate revisions with AI-computed diff results';
COMMENT ON COLUMN public.estimate_revisions.diff_results IS 'AI-computed diff: { changes: DiffChange[], summary: { added, removed, modified, totalCostDelta } }';
COMMENT ON COLUMN public.estimate_revisions.changes_applied IS 'Array of change IDs that have been accepted by user';

-- ============================================
-- INDEXES
-- ============================================

CREATE INDEX idx_estimate_revisions_company ON public.estimate_revisions(company_id);
CREATE INDEX idx_estimate_revisions_estimate ON public.estimate_revisions(estimate_id);
CREATE INDEX idx_estimate_revisions_previous ON public.estimate_revisions(previous_estimate_id);
CREATE INDEX idx_estimate_revisions_created_at ON public.estimate_revisions(created_at DESC);

-- ============================================
-- RLS
-- ============================================

ALTER TABLE public.estimate_revisions ENABLE ROW LEVEL SECURITY;

-- Estimate Revisions: SELECT only (mutations via Server Actions)
CREATE POLICY "company_read_estimate_revisions" ON public.estimate_revisions
  FOR SELECT TO authenticated
  USING (company_id = public.get_user_company_id(next_auth.uid()));

-- ============================================
-- TRIGGERS
-- ============================================

CREATE TRIGGER update_estimate_revisions_updated_at
  BEFORE UPDATE ON public.estimate_revisions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
