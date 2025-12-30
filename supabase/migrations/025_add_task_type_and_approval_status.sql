-- Migration: Add task_type and approval_status enums
-- Date: 2025-12-29
-- Description: Adds task types (work, purchase, approval, admin) and approval workflow for approval-type tasks

-- Add task_type enum
CREATE TYPE public.task_type AS ENUM ('work', 'purchase', 'approval', 'admin');

-- Add approval_status enum (for Approval tasks)
CREATE TYPE public.approval_status AS ENUM ('pending', 'approved', 'rejected', 'revision_requested');

-- Add columns to tasks table
ALTER TABLE public.tasks
ADD COLUMN task_type public.task_type NOT NULL DEFAULT 'work',
ADD COLUMN approval_status public.approval_status,
ADD COLUMN approval_notes text,
ADD COLUMN approved_by uuid REFERENCES next_auth.users(id),
ADD COLUMN approved_at timestamptz;

-- Add index for filtering by task type
CREATE INDEX idx_tasks_type ON public.tasks(task_type);

-- Add partial index for approval status (only for approval tasks)
CREATE INDEX idx_tasks_approval_status ON public.tasks(approval_status) WHERE task_type = 'approval';

-- Comment on new columns
COMMENT ON COLUMN public.tasks.task_type IS 'Type of task: work (labor), purchase (materials), approval (permits/sign-offs), admin (overhead)';
COMMENT ON COLUMN public.tasks.approval_status IS 'Status for approval-type tasks: pending, approved, rejected, revision_requested';
COMMENT ON COLUMN public.tasks.approval_notes IS 'Notes from the approver explaining their decision';
COMMENT ON COLUMN public.tasks.approved_by IS 'User who approved/rejected the task';
COMMENT ON COLUMN public.tasks.approved_at IS 'Timestamp when approval decision was made';
