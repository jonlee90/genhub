-- Migration: Create Estimate Chat Messages Table
-- Description: Creates table for AI Plan Chat Sidebar feature (Phase 2)
-- Task: EST-P2-001 - AI Plan Chat Sidebar
-- Date: 2026-02-16

-- ============================================
-- TABLE: estimate_chat_messages
-- ============================================

CREATE TABLE public.estimate_chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  estimate_id UUID NOT NULL REFERENCES public.estimates(id) ON DELETE CASCADE,

  -- Message metadata
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  plan_references JSONB NOT NULL DEFAULT '[]'::jsonb,

  -- Audit
  created_by UUID REFERENCES next_auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.estimate_chat_messages IS 'Chat messages for AI Plan Chat Sidebar per estimate';
COMMENT ON COLUMN public.estimate_chat_messages.role IS 'Message sender: user or assistant (AI)';
COMMENT ON COLUMN public.estimate_chat_messages.plan_references IS 'Array of { pageNumber: number, region?: { x, y, width, height } }';

-- ============================================
-- INDEXES
-- ============================================

-- Primary query pattern: fetch all messages for an estimate ordered by time
CREATE INDEX idx_estimate_chat_messages_estimate_id_created_at
  ON public.estimate_chat_messages(estimate_id, created_at);

-- Company isolation for RLS
CREATE INDEX idx_estimate_chat_messages_company_id
  ON public.estimate_chat_messages(company_id);

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

ALTER TABLE public.estimate_chat_messages ENABLE ROW LEVEL SECURITY;

-- Users can view messages for estimates in their company
CREATE POLICY "Users can view chat messages in their company"
  ON public.estimate_chat_messages
  FOR SELECT
  USING (
    company_id IN (
      SELECT company_id
      FROM next_auth.users
      WHERE id = auth.uid()
    )
  );

-- Users can insert messages for estimates in their company
CREATE POLICY "Users can insert chat messages in their company"
  ON public.estimate_chat_messages
  FOR INSERT
  WITH CHECK (
    company_id IN (
      SELECT company_id
      FROM next_auth.users
      WHERE id = auth.uid()
    )
  );

-- ============================================
-- REALTIME SUBSCRIPTION
-- ============================================

-- Enable realtime for chat messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.estimate_chat_messages;
