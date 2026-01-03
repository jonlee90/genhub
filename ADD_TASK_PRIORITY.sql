-- ============================================================
-- ADD: priority column to tasks table
-- ============================================================
-- COPY THIS AND PASTE INTO SUPABASE SQL EDITOR
-- ============================================================

-- Create task_priority enum
DO $$ BEGIN
  CREATE TYPE public.task_priority AS ENUM (
    'high',
    'normal',
    'low'
  );
EXCEPTION
  WHEN duplicate_object THEN
    RAISE NOTICE 'task_priority enum already exists, skipping';
END $$;

-- Add priority column to tasks table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'tasks'
    AND column_name = 'priority'
  ) THEN
    ALTER TABLE public.tasks
    ADD COLUMN priority public.task_priority NOT NULL DEFAULT 'normal';
    RAISE NOTICE '✅ Added priority column to tasks table';
  ELSE
    RAISE NOTICE 'priority column already exists in tasks table';
  END IF;
END $$;

-- Add index for performance
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes
    WHERE schemaname = 'public'
    AND tablename = 'tasks'
    AND indexname = 'idx_tasks_priority'
  ) THEN
    CREATE INDEX idx_tasks_priority ON public.tasks(priority);
    RAISE NOTICE '✅ Created index on tasks.priority';
  END IF;
END $$;

-- Add column comment
COMMENT ON COLUMN public.tasks.priority IS 'Task priority: high, normal, or low';

-- Verify
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'tasks'
  AND column_name = 'priority';

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅✅ Tasks priority column added successfully!';
  RAISE NOTICE '📋 Valid values: high, normal, low';
END $$;
