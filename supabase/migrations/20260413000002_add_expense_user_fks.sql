-- Add foreign keys from expenses.submitted_by and expenses.reviewed_by to user_profiles.id
-- so PostgREST can resolve the `submitted_by_user` / `reviewed_by_user` embeds.

-- Null out any orphaned reviewed_by values so ADD CONSTRAINT does not fail.
UPDATE public.expenses e
SET reviewed_by = NULL
WHERE reviewed_by IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM public.user_profiles p WHERE p.id = e.reviewed_by
  );

-- submitted_by is NOT NULL; if any rows reference missing profiles, the migration
-- will fail here and we investigate manually rather than silently lose data.
DO $$
DECLARE
  orphan_count int;
BEGIN
  SELECT COUNT(*) INTO orphan_count
  FROM public.expenses e
  WHERE NOT EXISTS (
    SELECT 1 FROM public.user_profiles p WHERE p.id = e.submitted_by
  );
  IF orphan_count > 0 THEN
    RAISE EXCEPTION
      'Cannot add expenses_submitted_by_fkey: % expense row(s) reference a missing user_profiles id',
      orphan_count;
  END IF;
END$$;

ALTER TABLE public.expenses
  DROP CONSTRAINT IF EXISTS expenses_submitted_by_fkey;
ALTER TABLE public.expenses
  ADD CONSTRAINT expenses_submitted_by_fkey
  FOREIGN KEY (submitted_by) REFERENCES public.user_profiles(id) ON DELETE RESTRICT;

ALTER TABLE public.expenses
  DROP CONSTRAINT IF EXISTS expenses_reviewed_by_fkey;
ALTER TABLE public.expenses
  ADD CONSTRAINT expenses_reviewed_by_fkey
  FOREIGN KEY (reviewed_by) REFERENCES public.user_profiles(id) ON DELETE SET NULL;

NOTIFY pgrst, 'reload schema';
