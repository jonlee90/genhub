-- Migration: Add days_offset to task_templates
-- Description: Add days_offset field to automatically schedule tasks relative to project start date
-- Date: 2026-01-01

-- Add days_offset column to task_templates
-- This represents the number of days after project start that this task should begin
-- When a task is created from a template, start_date and due_date will be calculated based on this offset
ALTER TABLE public.task_templates
ADD COLUMN days_offset integer DEFAULT NULL;

COMMENT ON COLUMN public.task_templates.days_offset IS 'Number of days after project start date when this task should begin. Used to auto-calculate start_date and due_date when creating tasks from templates.';

-- Example usage:
-- If days_offset = 0, task starts on project start date
-- If days_offset = 7, task starts 7 days after project start date
-- If days_offset = 30, task starts 30 days after project start date
-- If days_offset is NULL, no automatic date scheduling
