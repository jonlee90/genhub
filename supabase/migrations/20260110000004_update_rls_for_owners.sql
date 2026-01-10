-- Migration: Update RLS policies to allow owner bypass
-- Owners can view all data across all companies

-- ============================================
-- Companies table - owners can SELECT all
-- ============================================
DROP POLICY IF EXISTS "companies_select" ON public.companies;
CREATE POLICY "companies_select" ON public.companies
FOR SELECT USING (
  id = public.get_user_company_id(next_auth.uid())
  OR public.is_user_owner(next_auth.uid())
);

-- ============================================
-- Company Users table - owners can SELECT all
-- ============================================
DROP POLICY IF EXISTS "company_users_select" ON public.company_users;
CREATE POLICY "company_users_select" ON public.company_users
FOR SELECT USING (
  company_id = public.get_user_company_id(next_auth.uid())
  OR public.is_user_owner(next_auth.uid())
);

-- ============================================
-- User Profiles table - owners can SELECT all
-- ============================================
DROP POLICY IF EXISTS "user_profiles_select" ON public.user_profiles;
CREATE POLICY "user_profiles_select" ON public.user_profiles
FOR SELECT USING (
  id = next_auth.uid()
  OR EXISTS (
    SELECT 1 FROM public.company_users
    WHERE user_id = user_profiles.id
    AND company_id = public.get_user_company_id(next_auth.uid())
  )
  OR public.is_user_owner(next_auth.uid())
);

-- ============================================
-- Projects table - owners can SELECT all
-- ============================================
DROP POLICY IF EXISTS "projects_select" ON public.projects;
CREATE POLICY "projects_select" ON public.projects
FOR SELECT USING (
  company_id = public.get_user_company_id(next_auth.uid())
  OR public.is_user_owner(next_auth.uid())
);
