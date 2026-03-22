-- Migration: Create Budgets and Budget Categories Tables
-- Description: Support for detailed budgets with categories converted from estimates
-- Tasks: EST-P2-006 - Estimate-to-Budget Conversion
-- Date: 2026-02-16

-- ============================================
-- ENUMS
-- ============================================

CREATE TYPE budget_status AS ENUM ('draft', 'approved', 'locked');

-- ============================================
-- TABLES
-- ============================================

-- Budgets Table
CREATE TABLE public.budgets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,

  -- Budget metadata
  name TEXT NOT NULL,
  description TEXT,
  status budget_status NOT NULL DEFAULT 'draft',

  -- Cost tracking
  total_amount NUMERIC(12,2) NOT NULL DEFAULT 0,

  -- Source tracking
  source_estimate_id UUID REFERENCES public.estimates(id) ON DELETE SET NULL,

  -- Audit
  created_by UUID NOT NULL REFERENCES next_auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  approved_by UUID REFERENCES next_auth.users(id),
  approved_at TIMESTAMPTZ
);

COMMENT ON TABLE public.budgets IS 'Project budgets with category breakdown';

-- Budget Categories Table
CREATE TABLE public.budget_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  budget_id UUID NOT NULL REFERENCES public.budgets(id) ON DELETE CASCADE,

  -- Category details
  name TEXT NOT NULL, -- e.g., 'Framing', 'Electrical', 'Contingency'
  description TEXT,

  -- Budget allocation
  allocated_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  spent_amount NUMERIC(12,2) NOT NULL DEFAULT 0,

  -- Order
  sort_order INT NOT NULL DEFAULT 0,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.budget_categories IS 'Budget categories for tracking spending by trade/area';

-- ============================================
-- INDEXES
-- ============================================

-- budgets indexes
CREATE INDEX idx_budgets_company ON public.budgets(company_id);
CREATE INDEX idx_budgets_project ON public.budgets(project_id);
CREATE INDEX idx_budgets_status ON public.budgets(status);
CREATE INDEX idx_budgets_source_estimate ON public.budgets(source_estimate_id) WHERE source_estimate_id IS NOT NULL;
CREATE INDEX idx_budgets_created_at ON public.budgets(created_at DESC);

-- budget_categories indexes
CREATE INDEX idx_budget_categories_company ON public.budget_categories(company_id);
CREATE INDEX idx_budget_categories_budget ON public.budget_categories(budget_id);
CREATE INDEX idx_budget_categories_sort_order ON public.budget_categories(budget_id, sort_order);

-- ============================================
-- ENABLE RLS
-- ============================================

ALTER TABLE public.budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.budget_categories ENABLE ROW LEVEL SECURITY;

-- ============================================
-- RLS POLICIES (SELECT ONLY)
-- ============================================

-- Budgets: SELECT only (mutations via Server Actions)
CREATE POLICY "company_read_budgets" ON public.budgets
  FOR SELECT TO authenticated
  USING (company_id = public.get_user_company_id(next_auth.uid()));

-- Budget Categories: SELECT only
CREATE POLICY "company_read_budget_categories" ON public.budget_categories
  FOR SELECT TO authenticated
  USING (company_id = public.get_user_company_id(next_auth.uid()));

-- ============================================
-- TRIGGERS
-- ============================================

-- Updated_at trigger for budgets
CREATE TRIGGER update_budgets_updated_at
  BEFORE UPDATE ON public.budgets
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Updated_at trigger for budget_categories
CREATE TRIGGER update_budget_categories_updated_at
  BEFORE UPDATE ON public.budget_categories
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
