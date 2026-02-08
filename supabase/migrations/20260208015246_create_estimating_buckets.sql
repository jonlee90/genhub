-- Migration: Create AI Plan Estimator - Storage Buckets
-- Description: Create private storage buckets for plan files and page images with RLS
-- Tasks: 1.3 - Storage buckets with RLS policies
-- Date: 2026-02-08

-- ============================================
-- STORAGE BUCKETS
-- ============================================

-- Create plan-files bucket (for original PDF/image uploads)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'plan-files',
  'plan-files',
  false,
  52428800, -- 50MB limit
  ARRAY['application/pdf', 'image/jpeg', 'image/png']
)
ON CONFLICT (id) DO NOTHING;

-- Create plan-pages bucket (for generated PNG page images)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'plan-pages',
  'plan-pages',
  false,
  10485760, -- 10MB limit per page
  ARRAY['image/png', 'image/jpeg']
)
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- STORAGE RLS POLICIES
-- ============================================

-- plan-files: SELECT policy (company isolation)
-- Path structure: {companyId}/projects/{projectId}/plans/{filename}
CREATE POLICY "Company users can read own plan files"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'plan-files' AND
    (storage.foldername(name))[1] = public.get_user_company_id(next_auth.uid())::text
  );

-- plan-files: INSERT policy (company isolation)
CREATE POLICY "Company users can upload own plan files"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'plan-files' AND
    (storage.foldername(name))[1] = public.get_user_company_id(next_auth.uid())::text
  );

-- plan-files: DELETE policy (admin only)
CREATE POLICY "Company admins can delete own plan files"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'plan-files' AND
    (storage.foldername(name))[1] = public.get_user_company_id(next_auth.uid())::text AND
    public.is_user_admin(next_auth.uid())
  );

-- plan-pages: SELECT policy (company isolation)
-- Path structure: {companyId}/projects/{projectId}/pages/{planId}/page_{pageNumber}.png
CREATE POLICY "Company users can read own plan pages"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'plan-pages' AND
    (storage.foldername(name))[1] = public.get_user_company_id(next_auth.uid())::text
  );

-- plan-pages: INSERT policy (company isolation)
CREATE POLICY "Company users can upload own plan pages"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'plan-pages' AND
    (storage.foldername(name))[1] = public.get_user_company_id(next_auth.uid())::text
  );

-- plan-pages: DELETE policy (admin only)
CREATE POLICY "Company admins can delete own plan pages"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'plan-pages' AND
    (storage.foldername(name))[1] = public.get_user_company_id(next_auth.uid())::text AND
    public.is_user_admin(next_auth.uid())
  );
