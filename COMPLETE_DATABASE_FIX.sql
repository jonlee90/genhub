-- ============================================================
-- COMPLETE DATABASE FIX - Add ALL missing columns
-- ============================================================
-- COPY THIS ENTIRE FILE AND PASTE INTO SUPABASE SQL EDITOR
-- This fixes ALL missing columns in one go!
-- ============================================================

-- 1. Add task_status enum
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

-- 2. Add status column to tasks table
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

-- 3. Add actual_cost column to projects table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'projects'
    AND column_name = 'actual_cost'
  ) THEN
    ALTER TABLE public.projects
    ADD COLUMN actual_cost NUMERIC(12, 2) DEFAULT 0.00;
    RAISE NOTICE '✅ Added actual_cost column to projects table';
  ELSE
    RAISE NOTICE 'actual_cost column already exists in projects table';
  END IF;
END $$;

-- 4. Add indexes for performance
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

-- 5. Add column comments
COMMENT ON COLUMN public.tasks.status IS 'Task status: todo, in_progress, done, or blocked';
COMMENT ON COLUMN public.projects.actual_cost IS 'Actual cost spent on the project so far';

-- 6. Verify all columns exist
DO $$
DECLARE
  tasks_status_exists BOOLEAN;
  projects_actual_cost_exists BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'tasks' AND column_name = 'status'
  ) INTO tasks_status_exists;

  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'projects' AND column_name = 'actual_cost'
  ) INTO projects_actual_cost_exists;

  IF tasks_status_exists AND projects_actual_cost_exists THEN
    RAISE NOTICE '✅✅✅ ALL COLUMNS ADDED SUCCESSFULLY! ✅✅✅';
    RAISE NOTICE '✅ tasks.status - EXISTS';
    RAISE NOTICE '✅ projects.actual_cost - EXISTS';
    RAISE NOTICE '🚀 Ready to seed demo data!';
  ELSE
    RAISE NOTICE '❌ Some columns are still missing!';
    IF NOT tasks_status_exists THEN
      RAISE NOTICE '❌ tasks.status - MISSING';
    END IF;
    IF NOT projects_actual_cost_exists THEN
      RAISE NOTICE '❌ projects.actual_cost - MISSING';
    END IF;
  END IF;
END $$;
