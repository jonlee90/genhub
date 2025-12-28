-- GenHub PWA: Company Users Table
-- Role-based access control linking users to companies
-- Created: 2025-12-04

-- Create role enum
CREATE TYPE public.user_role AS ENUM (
  'gc_admin',        -- Full access to all features
  'project_manager', -- Manage projects and tasks
  'foreman',         -- Field supervision access
  'field_worker',    -- Basic task access
  'subcontractor',   -- Limited to assigned work
  'client'           -- Client portal access only
);

-- Create status enum
CREATE TYPE public.member_status AS ENUM (
  'active',
  'invited',
  'inactive'
);

-- Company users junction table
CREATE TABLE public.company_users (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  user_id uuid NOT NULL DEFAULT next_auth.uid(),
  role public.user_role NOT NULL DEFAULT 'field_worker',
  status public.member_status NOT NULL DEFAULT 'invited',
  invited_by uuid REFERENCES public.user_profiles(id),
  invited_at timestamp with time zone DEFAULT now(),
  joined_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),

  -- Ensure unique user per company
  CONSTRAINT unique_user_per_company UNIQUE (company_id, user_id)
);

-- Add table comment
COMMENT ON TABLE public.company_users IS 'Junction table linking users to companies with role-based access control. Supports multi-company membership.';

-- Enable Row Level Security
ALTER TABLE public.company_users ENABLE ROW LEVEL SECURITY;

-- Create indexes for performance
CREATE INDEX idx_company_users_company_id ON public.company_users(company_id);
CREATE INDEX idx_company_users_user_id ON public.company_users(user_id);
CREATE INDEX idx_company_users_role ON public.company_users(role);
CREATE INDEX idx_company_users_status ON public.company_users(status);

-- RLS Policies
-- Users can see members of their companies
CREATE POLICY "Users can view company members"
  ON public.company_users
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.company_users cu
      WHERE cu.company_id = company_users.company_id
      AND cu.user_id = next_auth.uid()
      AND cu.status = 'active'
    )
  );

-- GC Admins can manage company members
CREATE POLICY "GC Admins can insert members"
  ON public.company_users
  FOR INSERT
  TO authenticated
  WITH CHECK (
    -- Allow self-registration as gc_admin for new companies
    (user_id = next_auth.uid() AND role = 'gc_admin')
    OR
    -- Or GC Admin inviting others
    EXISTS (
      SELECT 1 FROM public.company_users cu
      WHERE cu.company_id = company_users.company_id
      AND cu.user_id = next_auth.uid()
      AND cu.role = 'gc_admin'
      AND cu.status = 'active'
    )
  );

CREATE POLICY "GC Admins can update members"
  ON public.company_users
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.company_users cu
      WHERE cu.company_id = company_users.company_id
      AND cu.user_id = next_auth.uid()
      AND cu.role = 'gc_admin'
      AND cu.status = 'active'
    )
  );

CREATE POLICY "GC Admins can delete members"
  ON public.company_users
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.company_users cu
      WHERE cu.company_id = company_users.company_id
      AND cu.user_id = next_auth.uid()
      AND cu.role = 'gc_admin'
      AND cu.status = 'active'
    )
  );
