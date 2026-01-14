-- Drop the overly permissive policy
DROP POLICY IF EXISTS "System can create notifications" ON public.notifications;

-- Create a restrictive policy that only allows creating notifications
-- for users within the same company
CREATE POLICY "users_can_notify_company_members" ON public.notifications
  FOR INSERT
  TO authenticated
  WITH CHECK (
    -- Ensure the notification target (user_id) is in the same company as the creator
    user_id IN (
      SELECT cu.user_id
      FROM public.company_users cu
      WHERE cu.company_id = public.get_user_company_id(next_auth.uid())
        AND cu.status = 'active'
    )
  );

COMMENT ON POLICY "users_can_notify_company_members" ON public.notifications IS
  'Users can only create notifications for active members of their own company';
