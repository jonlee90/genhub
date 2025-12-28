-- GenHub PWA: Subcontractors Directory Table
-- Subcontractor profiles with trade info, license, and performance tracking
-- Created: 2025-12-04

-- Trade specialization enum
CREATE TYPE public.trade_type AS ENUM (
  'general',
  'electrical',
  'plumbing',
  'hvac',
  'carpentry',
  'masonry',
  'roofing',
  'flooring',
  'painting',
  'drywall',
  'concrete',
  'landscaping',
  'demolition',
  'steel_work',
  'glass_glazing',
  'fire_protection',
  'insulation',
  'other'
);

-- Subcontractors directory table
CREATE TABLE public.subcontractors (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  company_name text NOT NULL,
  trade_specialization public.trade_type NOT NULL DEFAULT 'general',
  contact_name text NOT NULL,
  contact_email text,
  contact_phone text,
  address text,
  city text,
  state text,
  zip_code text,
  license_number text,
  license_expiry date,
  insurance_provider text,
  insurance_policy_number text,
  insurance_expiry date,
  performance_rating decimal(3,2) CHECK (performance_rating >= 0 AND performance_rating <= 5),
  total_projects integer DEFAULT 0,
  notes text,
  is_active boolean DEFAULT true,
  created_by uuid NOT NULL DEFAULT next_auth.uid(),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Add table comment
COMMENT ON TABLE public.subcontractors IS 'Directory of subcontractors with trade specializations, licensing, insurance, and performance tracking. Isolated by company.';

-- Enable Row Level Security
ALTER TABLE public.subcontractors ENABLE ROW LEVEL SECURITY;

-- Create indexes for performance
CREATE INDEX idx_subcontractors_company_id ON public.subcontractors(company_id);
CREATE INDEX idx_subcontractors_trade ON public.subcontractors(trade_specialization);
CREATE INDEX idx_subcontractors_is_active ON public.subcontractors(is_active);
CREATE INDEX idx_subcontractors_company_name ON public.subcontractors(company_name);

-- RLS Policies
-- Company members can view subcontractors
CREATE POLICY "Company members can view subcontractors"
  ON public.subcontractors
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.company_users cu
      WHERE cu.company_id = subcontractors.company_id
      AND cu.user_id = next_auth.uid()
      AND cu.status = 'active'
    )
  );

-- GC Admins and PMs can manage subcontractors
CREATE POLICY "GC Admins and PMs can insert subcontractors"
  ON public.subcontractors
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.company_users cu
      WHERE cu.company_id = subcontractors.company_id
      AND cu.user_id = next_auth.uid()
      AND cu.role IN ('gc_admin', 'project_manager')
      AND cu.status = 'active'
    )
  );

CREATE POLICY "GC Admins and PMs can update subcontractors"
  ON public.subcontractors
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.company_users cu
      WHERE cu.company_id = subcontractors.company_id
      AND cu.user_id = next_auth.uid()
      AND cu.role IN ('gc_admin', 'project_manager')
      AND cu.status = 'active'
    )
  );

CREATE POLICY "GC Admins can delete subcontractors"
  ON public.subcontractors
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.company_users cu
      WHERE cu.company_id = subcontractors.company_id
      AND cu.user_id = next_auth.uid()
      AND cu.role = 'gc_admin'
      AND cu.status = 'active'
    )
  );
