-- GenHub PWA: User Profiles Table
-- Extended user profiles linked to next-auth users
-- Created: 2025-12-04

-- User profiles extending next-auth users
CREATE TABLE public.user_profiles (
  id uuid PRIMARY KEY DEFAULT next_auth.uid(),
  name text NOT NULL,
  email text NOT NULL UNIQUE,
  avatar_url text,
  phone text,
  job_title text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Add table comment
COMMENT ON TABLE public.user_profiles IS 'Extended user profiles linked to next-auth authenticated users. Contains additional user information beyond auth data.';

-- Enable Row Level Security
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- Create indexes
CREATE INDEX idx_user_profiles_email ON public.user_profiles(email);

-- RLS Policies
-- Users can view profiles of people in their company
CREATE POLICY "Users can view profiles in their company"
  ON public.user_profiles
  FOR SELECT
  TO authenticated
  USING (
    -- Can always view own profile
    id = next_auth.uid()
    OR
    -- Can view profiles of users in same company
    EXISTS (
      SELECT 1 FROM public.company_users cu1
      JOIN public.company_users cu2 ON cu1.company_id = cu2.company_id
      WHERE cu1.user_id = next_auth.uid()
      AND cu2.user_id = user_profiles.id
      AND cu1.status = 'active'
    )
  );

-- Users can only update their own profile
CREATE POLICY "Users can update own profile"
  ON public.user_profiles
  FOR UPDATE
  TO authenticated
  USING (id = next_auth.uid());

-- Users can insert their own profile
CREATE POLICY "Users can create own profile"
  ON public.user_profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (id = next_auth.uid());
