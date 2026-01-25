-- Check current state
SELECT '=== USERS ===' as section;
SELECT id, email, name FROM next_auth.users LIMIT 5;

SELECT '=== COMPANIES ===' as section;
SELECT id, name, created_at FROM public.companies LIMIT 5;

SELECT '=== COMPANY_USERS ===' as section;
SELECT user_id, company_id, role, status FROM public.company_users LIMIT 5;

-- Find users without companies
SELECT '=== USERS WITHOUT COMPANIES ===' as section;
SELECT u.id, u.email, u.name
FROM next_auth.users u
LEFT JOIN public.company_users cu ON u.id = cu.user_id
WHERE cu.user_id IS NULL;

-- FIX: Create company and link user
-- Change the user_id value below to match your actual user ID from the query above
DO $$
DECLARE
  v_user_id uuid;
  v_company_id uuid;
  v_user_email text;
  v_user_name text;
BEGIN
  -- Get the first user without a company
  SELECT u.id, u.email, u.name INTO v_user_id, v_user_email, v_user_name
  FROM next_auth.users u
  LEFT JOIN public.company_users cu ON u.id = cu.user_id
  WHERE cu.user_id IS NULL
  LIMIT 1;

  IF v_user_id IS NOT NULL THEN
    RAISE NOTICE 'Creating company for user: % (%)', v_user_name, v_user_email;

    -- Create company
    INSERT INTO public.companies (name, status)
    VALUES (COALESCE(v_user_name, v_user_email) || '''s Company', 'active')
    RETURNING id INTO v_company_id;

    RAISE NOTICE 'Company created with ID: %', v_company_id;

    -- Link user to company as Admin
    INSERT INTO public.company_users (user_id, company_id, role, status, joined_at)
    VALUES (v_user_id, v_company_id, 'admin', 'active', now());

    RAISE NOTICE 'User linked to company as Admin';
  ELSE
    RAISE NOTICE 'All users already have companies!';
  END IF;
END $$;

-- Verify the fix
SELECT '=== VERIFICATION ===' as section;
SELECT
  u.id as user_id,
  u.email,
  u.name,
  cu.company_id,
  c.name as company_name,
  cu.role,
  cu.status
FROM next_auth.users u
LEFT JOIN public.company_users cu ON u.id = cu.user_id
LEFT JOIN public.companies c ON cu.company_id = c.id;
