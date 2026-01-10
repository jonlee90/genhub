-- Migration: Create owners table for platform super users
-- Owners are developers/operators with access to ALL companies and users

-- Create owners table (platform super users, NOT company-scoped)
CREATE TABLE public.owners (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES next_auth.users(id) ON DELETE CASCADE,
  email text NOT NULL UNIQUE,
  name text NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.owners IS 'Platform owners (super users) with access to all companies';
COMMENT ON COLUMN public.owners.user_id IS 'Reference to next_auth.users - the authenticated user';
COMMENT ON COLUMN public.owners.is_active IS 'Whether this owner account is active';

-- Indexes for fast lookup
CREATE INDEX idx_owners_user_id ON public.owners(user_id);
CREATE INDEX idx_owners_email ON public.owners(email);
CREATE INDEX idx_owners_is_active ON public.owners(is_active);

-- Enable RLS
ALTER TABLE public.owners ENABLE ROW LEVEL SECURITY;

-- Owners can only see themselves (use service role for admin operations)
CREATE POLICY "owners_select_self" ON public.owners
FOR SELECT USING (user_id = next_auth.uid());

-- Auto-update trigger for updated_at
CREATE TRIGGER update_owners_updated_at
BEFORE UPDATE ON public.owners
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Helper function to check if user is an owner
CREATE OR REPLACE FUNCTION public.is_user_owner(p_user_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.owners
    WHERE user_id = p_user_id
    AND is_active = true
  );
$$;

COMMENT ON FUNCTION public.is_user_owner IS 'Check if user is a platform owner (super user)';
