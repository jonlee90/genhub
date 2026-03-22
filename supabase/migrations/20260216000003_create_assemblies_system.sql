-- Migration: Create Assemblies System
-- Description: Assembly library for reusable component groups with versioning
-- Task: EST-P2-002 - Assemblies System
-- Date: 2026-02-16

-- ============================================
-- ENUMS
-- ============================================

CREATE TYPE assembly_category AS ENUM (
  'walls',
  'flooring',
  'ceilings',
  'roofing',
  'sitework',
  'misc'
);

-- ============================================
-- TABLES
-- ============================================

-- Estimate Assemblies Table
CREATE TABLE public.estimate_assemblies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,

  -- Assembly metadata
  name TEXT NOT NULL,
  description TEXT,
  category assembly_category NOT NULL,

  -- Template type
  is_company_template BOOLEAN NOT NULL DEFAULT true,

  -- Versioning
  version INT NOT NULL DEFAULT 1,

  -- Audit
  created_by UUID NOT NULL REFERENCES next_auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.estimate_assemblies IS 'Reusable assemblies for estimate line items with versioning';
COMMENT ON COLUMN public.estimate_assemblies.is_company_template IS 'true=company-wide, false=personal';
COMMENT ON COLUMN public.estimate_assemblies.version IS 'Incremented on each update for change tracking';

-- Assembly Items Table
CREATE TABLE public.assembly_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assembly_id UUID NOT NULL REFERENCES public.estimate_assemblies(id) ON DELETE CASCADE,

  -- Item details
  trade TEXT NOT NULL,
  description TEXT NOT NULL,
  unit TEXT NOT NULL,

  -- Quantity relative to parent
  quantity_multiplier NUMERIC(12,4) NOT NULL DEFAULT 1,

  -- Optional material link
  material_id UUID REFERENCES public.materials(id) ON DELETE SET NULL,

  -- Order
  sort_order INT NOT NULL DEFAULT 0,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.assembly_items IS 'Component items within an assembly';
COMMENT ON COLUMN public.assembly_items.quantity_multiplier IS 'Default quantity multiplier relative to parent takeoff item';

-- ============================================
-- INDEXES
-- ============================================

-- estimate_assemblies indexes
CREATE INDEX idx_estimate_assemblies_company ON public.estimate_assemblies(company_id);
CREATE INDEX idx_estimate_assemblies_category ON public.estimate_assemblies(category);
CREATE INDEX idx_estimate_assemblies_is_company_template ON public.estimate_assemblies(company_id, is_company_template);
CREATE INDEX idx_estimate_assemblies_created_at ON public.estimate_assemblies(created_at DESC);
CREATE INDEX idx_estimate_assemblies_name_search ON public.estimate_assemblies USING gin(to_tsvector('english', name || ' ' || COALESCE(description, '')));

-- assembly_items indexes
CREATE INDEX idx_assembly_items_assembly ON public.assembly_items(assembly_id);
CREATE INDEX idx_assembly_items_material ON public.assembly_items(material_id) WHERE material_id IS NOT NULL;
CREATE INDEX idx_assembly_items_sort_order ON public.assembly_items(assembly_id, sort_order);

-- ============================================
-- ENABLE RLS
-- ============================================

ALTER TABLE public.estimate_assemblies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assembly_items ENABLE ROW LEVEL SECURITY;

-- ============================================
-- RLS POLICIES (SELECT ONLY)
-- ============================================

-- Estimate Assemblies: SELECT only (mutations via Server Actions)
CREATE POLICY "company_read_estimate_assemblies" ON public.estimate_assemblies
  FOR SELECT TO authenticated
  USING (company_id = public.get_user_company_id(next_auth.uid()));

-- Assembly Items: SELECT only
CREATE POLICY "company_read_assembly_items" ON public.assembly_items
  FOR SELECT TO authenticated
  USING (
    assembly_id IN (
      SELECT id FROM public.estimate_assemblies
      WHERE company_id = public.get_user_company_id(next_auth.uid())
    )
  );

-- ============================================
-- TRIGGERS
-- ============================================

-- Updated_at trigger for estimate_assemblies
CREATE TRIGGER update_estimate_assemblies_updated_at
  BEFORE UPDATE ON public.estimate_assemblies
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
