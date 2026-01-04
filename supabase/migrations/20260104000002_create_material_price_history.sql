-- Migration: Create material_price_history table
-- Purpose: Historical price snapshots for materials (90-day retention)
-- Date: 2026-01-04

-- Create material_price_history table
CREATE TABLE public.material_price_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  material_id uuid NOT NULL REFERENCES public.materials(id) ON DELETE CASCADE,
  price numeric(10,2) NOT NULL,
  recorded_at timestamptz NOT NULL DEFAULT now(),
  source text NOT NULL DEFAULT 'home_depot_api',
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Create indexes
CREATE INDEX idx_price_history_material_date ON public.material_price_history(material_id, recorded_at DESC);
CREATE INDEX idx_price_history_recorded_at ON public.material_price_history(recorded_at DESC);
CREATE INDEX idx_price_history_company ON public.material_price_history(company_id);

-- Enable RLS
ALTER TABLE public.material_price_history ENABLE ROW LEVEL SECURITY;

-- RLS Policy: SELECT - Company members can view price history
CREATE POLICY "material_price_history_select" ON public.material_price_history
  FOR SELECT
  USING (company_id = public.get_user_company_id(next_auth.uid()));

-- RLS Policy: INSERT - Only service role can insert (for scheduled jobs)
-- Note: This policy allows service_role to bypass RLS for inserts
-- Regular authenticated users cannot insert
CREATE POLICY "material_price_history_insert" ON public.material_price_history
  FOR INSERT
  WITH CHECK (false); -- Deny all regular inserts, service role bypasses RLS

-- No UPDATE or DELETE policies (append-only table)

-- Add table comment
COMMENT ON TABLE public.material_price_history IS 'Historical price snapshots for materials (90-day retention, append-only)';
COMMENT ON COLUMN public.material_price_history.price IS 'Price snapshot at recorded_at timestamp';
COMMENT ON COLUMN public.material_price_history.recorded_at IS 'When this price was recorded';
COMMENT ON COLUMN public.material_price_history.source IS 'Data source (e.g., home_depot_api, manual)';
