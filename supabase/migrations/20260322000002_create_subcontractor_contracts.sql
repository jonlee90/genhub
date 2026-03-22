-- Migration: Create subcontractor_contracts table
-- Description: Track sub contracts per project with compliance status fields
-- Date: 2026-03-22

-- ============================================
-- TABLE
-- ============================================

CREATE TABLE public.subcontractor_contracts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  subcontractor_id UUID NOT NULL REFERENCES public.subcontractors(id) ON DELETE RESTRICT,
  contract_amount NUMERIC(12,2) NOT NULL,
  phase TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  insurance_received BOOLEAN NOT NULL DEFAULT false,
  contract_executed BOOLEAN NOT NULL DEFAULT false,
  ntp_issued BOOLEAN NOT NULL DEFAULT false,
  schedule_received BOOLEAN NOT NULL DEFAULT false,
  punchlist_complete BOOLEAN NOT NULL DEFAULT false,
  notes TEXT,
  created_by UUID REFERENCES next_auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.subcontractor_contracts IS 'Subcontractor contracts per project with compliance tracking';

-- ============================================
-- INDEXES
-- ============================================

CREATE INDEX idx_sub_contracts_company ON public.subcontractor_contracts(company_id);
CREATE INDEX idx_sub_contracts_project ON public.subcontractor_contracts(project_id);
CREATE INDEX idx_sub_contracts_sub ON public.subcontractor_contracts(subcontractor_id);
CREATE INDEX idx_sub_contracts_project_sub ON public.subcontractor_contracts(project_id, subcontractor_id);

-- ============================================
-- ENABLE RLS
-- ============================================

ALTER TABLE public.subcontractor_contracts ENABLE ROW LEVEL SECURITY;

-- ============================================
-- RLS POLICIES (SELECT ONLY)
-- ============================================

CREATE POLICY "company_read_subcontractor_contracts" ON public.subcontractor_contracts
  FOR SELECT TO authenticated
  USING (company_id = public.get_user_company_id(next_auth.uid()));

-- ============================================
-- TRIGGERS
-- ============================================

CREATE TRIGGER update_subcontractor_contracts_updated_at
  BEFORE UPDATE ON public.subcontractor_contracts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
