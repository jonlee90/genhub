-- Migration: Create Plan Measurements Table
-- Description: Stores manual measurement annotations on plan pages (area, linear, count)
-- Task: EST-P3-001-A
-- Date: 2026-02-16

-- ============================================
-- TABLE
-- ============================================

CREATE TABLE public.plan_measurements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_upload_id UUID NOT NULL REFERENCES public.plan_uploads(id) ON DELETE CASCADE,
  page_number INTEGER NOT NULL,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  measurement_type TEXT NOT NULL CHECK (measurement_type IN ('area', 'linear', 'count')),
  points JSONB NOT NULL, -- [{ x, y }]
  scale_ratio NUMERIC(10,4),
  result_value NUMERIC(12,2),
  result_unit TEXT,
  takeoff_item_id UUID REFERENCES public.takeoff_items(id) ON DELETE SET NULL,
  created_by UUID NOT NULL REFERENCES next_auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.plan_measurements IS 'Manual measurement annotations drawn on plan pages (area, linear, count)';
COMMENT ON COLUMN public.plan_measurements.points IS 'Array of {x, y} coordinates defining the measurement shape';
COMMENT ON COLUMN public.plan_measurements.scale_ratio IS 'Pixels-per-unit scale ratio used to compute result_value';

-- ============================================
-- INDEXES
-- ============================================

CREATE INDEX idx_plan_measurements_company ON public.plan_measurements(company_id);
CREATE INDEX idx_plan_measurements_upload ON public.plan_measurements(plan_upload_id);
CREATE INDEX idx_plan_measurements_page ON public.plan_measurements(plan_upload_id, page_number);
CREATE INDEX idx_plan_measurements_takeoff_item ON public.plan_measurements(takeoff_item_id) WHERE takeoff_item_id IS NOT NULL;

-- ============================================
-- UPDATED_AT TRIGGER
-- ============================================

CREATE TRIGGER update_plan_measurements_updated_at
  BEFORE UPDATE ON public.plan_measurements
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================
-- ENABLE RLS
-- ============================================

ALTER TABLE public.plan_measurements ENABLE ROW LEVEL SECURITY;

-- ============================================
-- RLS POLICIES (SELECT ONLY — mutations enforced via Server Actions)
-- ============================================

CREATE POLICY "company_read_plan_measurements" ON public.plan_measurements
  FOR SELECT TO authenticated
  USING (company_id = public.get_user_company_id(next_auth.uid()));
