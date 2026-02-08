-- Migration: Create AI Plan Estimator - Supporting Tables and RLS
-- Description: Supporting tables (line items, templates, AI usage log) and RLS policies
-- Tasks: 1.2 - 4 additional tables + RLS for all 9 tables
-- Date: 2026-02-08

-- ============================================
-- SUPPORTING TABLES
-- ============================================

-- Estimate Line Items Table
CREATE TABLE public.estimate_line_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  estimate_id UUID NOT NULL REFERENCES public.estimates(id) ON DELETE CASCADE,
  takeoff_item_id UUID REFERENCES public.takeoff_items(id) ON DELETE SET NULL,

  -- Item details
  trade TEXT NOT NULL, -- e.g., 'framing', 'drywall'
  category takeoff_category NOT NULL,
  sub_type TEXT NOT NULL,
  description TEXT,

  -- Quantity
  quantity NUMERIC(12,2) NOT NULL,
  unit TEXT NOT NULL,

  -- Cost breakdown
  material_cost NUMERIC(12,2) NOT NULL DEFAULT 0,
  labor_cost NUMERIC(12,2) NOT NULL DEFAULT 0,
  equipment_cost NUMERIC(12,2) NOT NULL DEFAULT 0,
  unit_cost NUMERIC(12,2) NOT NULL DEFAULT 0, -- total unit cost
  subtotal NUMERIC(12,2) NOT NULL DEFAULT 0, -- quantity * unit_cost

  -- Order
  sort_order INT NOT NULL DEFAULT 0,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.estimate_line_items IS 'Individual line items within an estimate';

-- Pricing Templates Table
CREATE TABLE public.pricing_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,

  -- Template metadata
  name TEXT NOT NULL,
  description TEXT,
  is_default BOOLEAN NOT NULL DEFAULT false,

  -- Audit
  created_by UUID NOT NULL REFERENCES next_auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.pricing_templates IS 'Reusable pricing templates for estimate line items';

-- Pricing Template Items Table
CREATE TABLE public.pricing_template_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  template_id UUID NOT NULL REFERENCES public.pricing_templates(id) ON DELETE CASCADE,

  -- Match criteria
  trade TEXT NOT NULL,
  category takeoff_category NOT NULL,
  sub_type TEXT NOT NULL,

  -- Cost data
  material_cost NUMERIC(12,2) NOT NULL DEFAULT 0,
  labor_cost NUMERIC(12,2) NOT NULL DEFAULT 0,
  equipment_cost NUMERIC(12,2) NOT NULL DEFAULT 0,
  unit_cost NUMERIC(12,2) NOT NULL DEFAULT 0,
  unit TEXT NOT NULL,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.pricing_template_items IS 'Line items within pricing templates';

-- AI Usage Log Table
CREATE TABLE public.ai_usage_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES next_auth.users(id),
  page_id UUID REFERENCES public.plan_pages(id) ON DELETE SET NULL,

  -- API call details
  model TEXT NOT NULL,
  prompt_tokens INT NOT NULL,
  completion_tokens INT NOT NULL,
  total_tokens INT NOT NULL,
  cost NUMERIC(10,6) NOT NULL, -- USD
  cached BOOLEAN NOT NULL DEFAULT false,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.ai_usage_log IS 'Log of all AI API calls for budget tracking';

-- ============================================
-- COMPANY TABLE ENHANCEMENT
-- ============================================

-- Add AI monthly budget column to companies table
ALTER TABLE public.companies
ADD COLUMN IF NOT EXISTS ai_monthly_budget NUMERIC(10,2) NOT NULL DEFAULT 50.00;

COMMENT ON COLUMN public.companies.ai_monthly_budget IS 'Monthly AI API budget in USD';

-- ============================================
-- INDEXES
-- ============================================

-- estimate_line_items indexes
CREATE INDEX idx_estimate_line_items_company ON public.estimate_line_items(company_id);
CREATE INDEX idx_estimate_line_items_estimate ON public.estimate_line_items(estimate_id);
CREATE INDEX idx_estimate_line_items_takeoff_item ON public.estimate_line_items(takeoff_item_id) WHERE takeoff_item_id IS NOT NULL;
CREATE INDEX idx_estimate_line_items_trade ON public.estimate_line_items(trade);
CREATE INDEX idx_estimate_line_items_sort_order ON public.estimate_line_items(estimate_id, sort_order);

-- pricing_templates indexes
CREATE INDEX idx_pricing_templates_company ON public.pricing_templates(company_id);
CREATE INDEX idx_pricing_templates_is_default ON public.pricing_templates(company_id, is_default) WHERE is_default = true;

-- pricing_template_items indexes
CREATE INDEX idx_pricing_template_items_company ON public.pricing_template_items(company_id);
CREATE INDEX idx_pricing_template_items_template ON public.pricing_template_items(template_id);
CREATE INDEX idx_pricing_template_items_trade_category ON public.pricing_template_items(trade, category);

-- ai_usage_log indexes
CREATE INDEX idx_ai_usage_log_company ON public.ai_usage_log(company_id);
CREATE INDEX idx_ai_usage_log_company_created_at ON public.ai_usage_log(company_id, created_at DESC);
CREATE INDEX idx_ai_usage_log_user ON public.ai_usage_log(user_id);
CREATE INDEX idx_ai_usage_log_page ON public.ai_usage_log(page_id) WHERE page_id IS NOT NULL;

-- ============================================
-- ENABLE RLS
-- ============================================

ALTER TABLE public.plan_uploads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plan_pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plan_parse_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.takeoff_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.estimates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.estimate_line_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pricing_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pricing_template_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_usage_log ENABLE ROW LEVEL SECURITY;

-- ============================================
-- RLS POLICIES (SELECT ONLY)
-- ============================================

-- Plan Uploads: SELECT only (mutations via Server Actions)
CREATE POLICY "company_read_plan_uploads" ON public.plan_uploads
  FOR SELECT TO authenticated
  USING (company_id = public.get_user_company_id(next_auth.uid()));

-- Plan Pages: SELECT only
CREATE POLICY "company_read_plan_pages" ON public.plan_pages
  FOR SELECT TO authenticated
  USING (company_id = public.get_user_company_id(next_auth.uid()));

-- Plan Parse Results: SELECT only
CREATE POLICY "company_read_plan_parse_results" ON public.plan_parse_results
  FOR SELECT TO authenticated
  USING (company_id = public.get_user_company_id(next_auth.uid()));

-- Takeoff Items: SELECT only
CREATE POLICY "company_read_takeoff_items" ON public.takeoff_items
  FOR SELECT TO authenticated
  USING (company_id = public.get_user_company_id(next_auth.uid()));

-- Estimates: SELECT only
CREATE POLICY "company_read_estimates" ON public.estimates
  FOR SELECT TO authenticated
  USING (company_id = public.get_user_company_id(next_auth.uid()));

-- Estimate Line Items: SELECT only
CREATE POLICY "company_read_estimate_line_items" ON public.estimate_line_items
  FOR SELECT TO authenticated
  USING (company_id = public.get_user_company_id(next_auth.uid()));

-- Pricing Templates: SELECT only
CREATE POLICY "company_read_pricing_templates" ON public.pricing_templates
  FOR SELECT TO authenticated
  USING (company_id = public.get_user_company_id(next_auth.uid()));

-- Pricing Template Items: SELECT only
CREATE POLICY "company_read_pricing_template_items" ON public.pricing_template_items
  FOR SELECT TO authenticated
  USING (company_id = public.get_user_company_id(next_auth.uid()));

-- AI Usage Log: SELECT only
CREATE POLICY "company_read_ai_usage_log" ON public.ai_usage_log
  FOR SELECT TO authenticated
  USING (company_id = public.get_user_company_id(next_auth.uid()));

-- ============================================
-- TRIGGERS
-- ============================================

-- Updated_at trigger for pricing_templates
CREATE TRIGGER update_pricing_templates_updated_at
  BEFORE UPDATE ON public.pricing_templates
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
