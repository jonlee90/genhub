-- Migration: Create tracked_materials table
-- Purpose: User watchlist for material price monitoring (max 10 per user)
-- Date: 2026-01-04

-- Create tracked_materials table
CREATE TABLE public.tracked_materials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  material_id uuid NOT NULL REFERENCES public.materials(id) ON DELETE CASCADE,
  tracked_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Create indexes
CREATE INDEX idx_tracked_materials_user ON public.tracked_materials(user_id, tracked_at DESC);
CREATE INDEX idx_tracked_materials_material ON public.tracked_materials(material_id);
CREATE UNIQUE INDEX idx_tracked_materials_user_material ON public.tracked_materials(user_id, material_id);

-- Create trigger function to enforce max 10 tracked materials per user
CREATE OR REPLACE FUNCTION public.check_tracked_materials_limit()
RETURNS TRIGGER AS $$
BEGIN
  IF (SELECT COUNT(*) FROM public.tracked_materials WHERE user_id = NEW.user_id) >= 10 THEN
    RAISE EXCEPTION 'Maximum 10 tracked materials per user';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to enforce limit
CREATE TRIGGER enforce_tracked_materials_limit
  BEFORE INSERT ON public.tracked_materials
  FOR EACH ROW
  EXECUTE FUNCTION public.check_tracked_materials_limit();

-- Create trigger function for updated_at (if it doesn't exist)
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-update updated_at
CREATE TRIGGER update_tracked_materials_updated_at
  BEFORE UPDATE ON public.tracked_materials
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Enable RLS
ALTER TABLE public.tracked_materials ENABLE ROW LEVEL SECURITY;

-- RLS Policy: SELECT - Users can view tracked materials in their company
CREATE POLICY "tracked_materials_select" ON public.tracked_materials
  FOR SELECT
  USING (company_id = public.get_user_company_id(next_auth.uid()));

-- RLS Policy: INSERT - Users can track materials in their company
CREATE POLICY "tracked_materials_insert" ON public.tracked_materials
  FOR INSERT
  WITH CHECK (
    company_id = public.get_user_company_id(next_auth.uid())
    AND user_id = next_auth.uid()
  );

-- RLS Policy: DELETE - Users can only untrack their own materials
CREATE POLICY "tracked_materials_delete" ON public.tracked_materials
  FOR DELETE
  USING (user_id = next_auth.uid());

-- Add table comment
COMMENT ON TABLE public.tracked_materials IS 'User watchlist for material price monitoring (max 10 per user)';
COMMENT ON COLUMN public.tracked_materials.user_id IS 'User who is tracking this material';
COMMENT ON COLUMN public.tracked_materials.material_id IS 'Material being tracked for price monitoring';
COMMENT ON COLUMN public.tracked_materials.tracked_at IS 'When tracking started';
