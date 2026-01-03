-- ============================================================
-- FIX: Add missing status column to tasks table
-- ============================================================
-- COPY THIS AND PASTE INTO SUPABASE SQL EDITOR
-- ============================================================

-- Create task_status enum if it doesn't exist
DO $$ BEGIN
  CREATE TYPE public.task_status AS ENUM (
    'todo',
    'in_progress',
    'done',
    'blocked'
  );
EXCEPTION
  WHEN duplicate_object THEN
    RAISE NOTICE 'task_status enum already exists, skipping';
END $$;

-- Add status column to tasks table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'tasks'
    AND column_name = 'status'
  ) THEN
    ALTER TABLE public.tasks
    ADD COLUMN status public.task_status NOT NULL DEFAULT 'todo';
    RAISE NOTICE '✅ Added status column to tasks table';
  ELSE
    RAISE NOTICE 'status column already exists in tasks table';
  END IF;
END $$;

-- Add index for performance
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes
    WHERE schemaname = 'public'
    AND tablename = 'tasks'
    AND indexname = 'idx_tasks_status'
  ) THEN
    CREATE INDEX idx_tasks_status ON public.tasks(status);
    RAISE NOTICE '✅ Created index on tasks.status';
  END IF;
END $$;

-- Add column comment
COMMENT ON COLUMN public.tasks.status IS 'Task status: todo, in_progress, done, or blocked';

-- Verify
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'tasks'
  AND column_name = 'status';

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ Tasks table status column fix complete!';
END $$;
