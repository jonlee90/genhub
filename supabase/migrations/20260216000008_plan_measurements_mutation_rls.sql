-- Add mutation RLS policies for plan_measurements
-- SELECT-only policy was created in 20260216000007; this adds write policies

CREATE POLICY "company_insert_plan_measurements" ON public.plan_measurements
  FOR INSERT TO authenticated
  WITH CHECK (company_id = public.get_user_company_id(next_auth.uid()));

CREATE POLICY "company_update_plan_measurements" ON public.plan_measurements
  FOR UPDATE TO authenticated
  USING (company_id = public.get_user_company_id(next_auth.uid()))
  WITH CHECK (company_id = public.get_user_company_id(next_auth.uid()));

CREATE POLICY "company_delete_plan_measurements" ON public.plan_measurements
  FOR DELETE TO authenticated
  USING (company_id = public.get_user_company_id(next_auth.uid()));
