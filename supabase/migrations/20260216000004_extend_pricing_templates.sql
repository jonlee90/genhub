-- Migration: Extend Pricing Templates for Phase 2
-- Description: Add versioning, categories, and template_usage table
-- Tasks: EST-P2-007 - Template Management
-- Date: 2026-02-16

-- ============================================
-- EXTEND PRICING_TEMPLATES TABLE
-- ============================================

-- Add new columns to pricing_templates
ALTER TABLE public.pricing_templates
ADD COLUMN IF NOT EXISTS category TEXT,
ADD COLUMN IF NOT EXISTS is_company_template BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN IF NOT EXISTS version INT NOT NULL DEFAULT 1,
ADD COLUMN IF NOT EXISTS template_data JSONB NOT NULL DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS changelog TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];

-- Add index for category and template type filtering
CREATE INDEX IF NOT EXISTS idx_pricing_templates_category
  ON public.pricing_templates(company_id, category)
  WHERE category IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_pricing_templates_company_template
  ON public.pricing_templates(company_id, is_company_template);

-- Add index for JSONB template_data (GIN index for efficient JSONB queries)
CREATE INDEX IF NOT EXISTS idx_pricing_templates_template_data
  ON public.pricing_templates USING gin(template_data);

COMMENT ON COLUMN public.pricing_templates.category IS 'Template category (residential, commercial_ti, warehouse, retail, office)';
COMMENT ON COLUMN public.pricing_templates.is_company_template IS 'If true, shared across company. If false, personal to creator.';
COMMENT ON COLUMN public.pricing_templates.version IS 'Current version number for template versioning';
COMMENT ON COLUMN public.pricing_templates.template_data IS 'JSONB containing lineItems array with trade, description, unit, unitCost';
COMMENT ON COLUMN public.pricing_templates.changelog IS 'Array of changelog entries (e.g., "v1: Created template", "v2: Updated pricing")';

-- ============================================
-- CREATE TEMPLATE_USAGE TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS public.template_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID NOT NULL REFERENCES public.pricing_templates(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES next_auth.users(id),
  estimate_id UUID REFERENCES public.estimates(id) ON DELETE SET NULL,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.template_usage IS 'Tracks when templates are applied to estimates for last-used tracking';

-- Indexes for template_usage
CREATE INDEX IF NOT EXISTS idx_template_usage_template
  ON public.template_usage(template_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_template_usage_user
  ON public.template_usage(user_id);

CREATE INDEX IF NOT EXISTS idx_template_usage_estimate
  ON public.template_usage(estimate_id)
  WHERE estimate_id IS NOT NULL;

-- ============================================
-- RLS POLICIES
-- ============================================

-- Enable RLS on template_usage
ALTER TABLE public.template_usage ENABLE ROW LEVEL SECURITY;

-- Template Usage: SELECT only
CREATE POLICY "company_read_template_usage" ON public.template_usage
  FOR SELECT TO authenticated
  USING (
    template_id IN (
      SELECT id FROM public.pricing_templates
      WHERE company_id = public.get_user_company_id(next_auth.uid())
    )
  );
