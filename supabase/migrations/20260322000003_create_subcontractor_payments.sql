-- Migration: Create subcontractor_payments table
-- Description: Track payments made against subcontractor contracts
-- Date: 2026-03-22

-- ============================================
-- TABLE
-- ============================================

CREATE TABLE public.subcontractor_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  contract_id UUID NOT NULL REFERENCES public.subcontractor_contracts(id) ON DELETE CASCADE,
  amount NUMERIC(12,2) NOT NULL,
  payment_date DATE NOT NULL,
  payment_method TEXT NOT NULL,
  notes TEXT,
  created_by UUID REFERENCES next_auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.subcontractor_payments IS 'Payments recorded against subcontractor contracts';

-- ============================================
-- INDEXES
-- ============================================

CREATE INDEX idx_sub_payments_company ON public.subcontractor_payments(company_id);
CREATE INDEX idx_sub_payments_contract ON public.subcontractor_payments(contract_id);
CREATE INDEX idx_sub_payments_date ON public.subcontractor_payments(payment_date DESC);

-- ============================================
-- ENABLE RLS
-- ============================================

ALTER TABLE public.subcontractor_payments ENABLE ROW LEVEL SECURITY;

-- ============================================
-- RLS POLICIES (SELECT ONLY)
-- ============================================

CREATE POLICY "company_read_subcontractor_payments" ON public.subcontractor_payments
  FOR SELECT TO authenticated
  USING (company_id = public.get_user_company_id(next_auth.uid()));
