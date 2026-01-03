-- ============================================================
-- FIX: Change chat_rooms foreign key to CASCADE on delete
-- ============================================================
-- COPY THIS AND PASTE INTO SUPABASE SQL EDITOR
-- ============================================================

-- Drop the existing constraint
ALTER TABLE public.chat_rooms
DROP CONSTRAINT IF EXISTS chat_rooms_project_id_fkey;

-- Add the constraint back with CASCADE
ALTER TABLE public.chat_rooms
ADD CONSTRAINT chat_rooms_project_id_fkey
FOREIGN KEY (project_id)
REFERENCES public.projects(id)
ON DELETE CASCADE;

-- Verify
SELECT
    tc.constraint_name,
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    rc.delete_rule
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
JOIN information_schema.referential_constraints AS rc
  ON rc.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_name = 'chat_rooms'
  AND kcu.column_name = 'project_id';

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ chat_rooms foreign key updated to CASCADE!';
  RAISE NOTICE '🗑️  Projects can now be deleted along with their chat rooms';
END $$;
