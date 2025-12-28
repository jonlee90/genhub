-- GenHub PWA: Companies Table
-- Multi-tenant company profiles for general contractors
-- Created: 2025-12-04

-- Companies table for multi-tenant isolation
CREATE TABLE public.companies (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name text NOT NULL,
  address text,
  city text,
  state text,
  zip_code text,
  phone text,
  email text,
  logo_url text,
  website text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Add table comment
COMMENT ON TABLE public.companies IS 'Multi-tenant company profiles for general contractors. Each company has isolated data through RLS policies.';

-- Enable Row Level Security
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;

-- Create indexes for performance
CREATE INDEX idx_companies_name ON public.companies(name);

-- RLS Policies: Companies are accessed through company_users membership
-- Users can only see companies they belong to (enforced via company_users join)
CREATE POLICY "Users can view their companies"
  ON public.companies
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.company_users cu
      WHERE cu.company_id = companies.id
      AND cu.user_id = next_auth.uid()
      AND cu.status = 'active'
    )
  );

-- Only GC Admins can update company info
CREATE POLICY "GC Admins can update company"
  ON public.companies
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.company_users cu
      WHERE cu.company_id = companies.id
      AND cu.user_id = next_auth.uid()
      AND cu.role = 'gc_admin'
      AND cu.status = 'active'
    )
  );

-- Allow authenticated users to create companies (for onboarding)
CREATE POLICY "Authenticated users can create company"
  ON public.companies
  FOR INSERT
  TO authenticated
  WITH CHECK (true);
