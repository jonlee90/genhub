-- Add missing foreign key relationship between company_users and user_profiles
-- This enables Supabase PostgREST to properly join these tables
--
-- Note: company_users.user_id already has a FK to next_auth.users (company_users_user_id_fkey)
-- This adds a SECOND FK to user_profiles so PostgREST can detect the relationship for joins

-- Add foreign key constraint for user_id -> user_profiles
ALTER TABLE public.company_users
ADD CONSTRAINT company_users_user_profile_fkey
FOREIGN KEY (user_id)
REFERENCES public.user_profiles(id)
ON DELETE CASCADE;

-- Add comment explaining the relationship
COMMENT ON CONSTRAINT company_users_user_profile_fkey ON public.company_users IS
'Links company users to their user profile. Enables PostgREST joins. CASCADE delete ensures cleanup when user is deleted.';
