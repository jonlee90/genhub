-- Migration: Create Estimate Collaboration Tables
-- Description: Adds trade-level locking and activity audit log for real-time collaboration
-- Task: EST-P3-002-A
-- Date: 2026-02-16

-- ============================================
-- TABLE: estimate_locks
-- ============================================
-- Provides trade-level exclusive editing locks.
-- UNIQUE(estimate_id, trade) enforces one lock per trade per estimate.

CREATE TABLE public.estimate_locks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  estimate_id UUID NOT NULL REFERENCES public.estimates(id) ON DELETE CASCADE,
  trade TEXT NOT NULL,
  locked_by UUID NOT NULL REFERENCES next_auth.users(id),
  locked_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + INTERVAL '30 minutes'),
  company_id UUID NOT NULL REFERENCES public.companies(id),
  UNIQUE(estimate_id, trade)
);

COMMENT ON TABLE public.estimate_locks IS 'Trade-level exclusive editing locks for collaborative estimate editing';
COMMENT ON COLUMN public.estimate_locks.expires_at IS 'Lock expires 30 minutes after acquisition; stale locks are ignored by application logic';

-- ============================================
-- INDEXES: estimate_locks
-- ============================================

CREATE INDEX idx_estimate_locks_estimate ON public.estimate_locks(estimate_id);
CREATE INDEX idx_estimate_locks_expires ON public.estimate_locks(expires_at);

-- ============================================
-- TABLE: estimate_activity
-- ============================================
-- Audit log for all user actions on an estimate (activity feed).

CREATE TABLE public.estimate_activity (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  estimate_id UUID NOT NULL REFERENCES public.estimates(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES public.companies(id),
  user_id UUID NOT NULL REFERENCES next_auth.users(id),
  action_type TEXT NOT NULL CHECK (action_type IN (
    'item_added', 'item_edited', 'item_deleted',
    'cost_updated', 'assembly_applied',
    'bulk_accepted', 'bulk_rejected'
  )),
  details JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.estimate_activity IS 'Audit log of user actions on estimates, used for the real-time activity feed';
COMMENT ON COLUMN public.estimate_activity.details IS 'Action-specific payload (e.g. { trade, item_id, old_value, new_value })';

-- ============================================
-- INDEXES: estimate_activity
-- ============================================

CREATE INDEX idx_estimate_activity_estimate ON public.estimate_activity(estimate_id, created_at DESC);
CREATE INDEX idx_estimate_activity_company ON public.estimate_activity(company_id);

-- ============================================
-- ENABLE RLS
-- ============================================

ALTER TABLE public.estimate_locks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.estimate_activity ENABLE ROW LEVEL SECURITY;

-- ============================================
-- RLS POLICIES: estimate_locks
-- SELECT-only per GenHub convention; mutations enforced in Server Actions.
-- ============================================

CREATE POLICY "company_read_estimate_locks" ON public.estimate_locks
  FOR SELECT TO authenticated
  USING (company_id = public.get_user_company_id(next_auth.uid()));

-- ============================================
-- RLS POLICIES: estimate_activity
-- SELECT-only per GenHub convention; mutations enforced in Server Actions.
-- ============================================

CREATE POLICY "company_read_estimate_activity" ON public.estimate_activity
  FOR SELECT TO authenticated
  USING (company_id = public.get_user_company_id(next_auth.uid()));

-- ============================================
-- REALTIME PUBLICATION
-- Both tables subscribe to Supabase Realtime for live updates.
-- ============================================

ALTER PUBLICATION supabase_realtime ADD TABLE public.estimate_locks;
ALTER PUBLICATION supabase_realtime ADD TABLE public.estimate_activity;

-- ============================================
-- STALE LOCK CLEANUP NOTE
-- ============================================
-- STALE LOCK CLEANUP: Locks expire after 30 minutes via expires_at column.
-- To auto-clean, schedule: DELETE FROM estimate_locks WHERE expires_at < now();
-- (can be done via pg_cron or a Supabase Edge Function cron job)
