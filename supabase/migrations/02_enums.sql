-- ============================================
-- Part 2: All ENUM Types
-- Run this SECOND
-- ============================================

-- Drop types if they exist (for re-running)
DROP TYPE IF EXISTS public.user_role CASCADE;
DROP TYPE IF EXISTS public.member_status CASCADE;
DROP TYPE IF EXISTS public.trade_type CASCADE;
DROP TYPE IF EXISTS public.project_type CASCADE;
DROP TYPE IF EXISTS public.project_status CASCADE;
DROP TYPE IF EXISTS public.phase_status CASCADE;
DROP TYPE IF EXISTS public.task_status CASCADE;
DROP TYPE IF EXISTS public.task_priority CASCADE;
DROP TYPE IF EXISTS public.activity_action CASCADE;
DROP TYPE IF EXISTS public.notification_type CASCADE;
DROP TYPE IF EXISTS public.attachment_entity_type CASCADE;

-- User role enum
CREATE TYPE public.user_role AS ENUM (
  'gc_admin',
  'project_manager',
  'foreman',
  'field_worker',
  'subcontractor',
  'client'
);

-- Member status enum
CREATE TYPE public.member_status AS ENUM (
  'active',
  'invited',
  'inactive'
);

-- Trade specialization enum
CREATE TYPE public.trade_type AS ENUM (
  'general',
  'electrical',
  'plumbing',
  'hvac',
  'carpentry',
  'masonry',
  'roofing',
  'flooring',
  'painting',
  'drywall',
  'concrete',
  'landscaping',
  'demolition',
  'steel_work',
  'glass_glazing',
  'fire_protection',
  'insulation',
  'other'
);

-- Project type enum
CREATE TYPE public.project_type AS ENUM (
  'residential',
  'restaurant',
  'cafe',
  'commercial_office',
  'industrial'
);

-- Project status enum
CREATE TYPE public.project_status AS ENUM (
  'active',
  'on_hold',
  'completed',
  'archived'
);

-- Phase status enum
CREATE TYPE public.phase_status AS ENUM (
  'not_started',
  'in_progress',
  'completed',
  'on_hold'
);

-- Task status enum
CREATE TYPE public.task_status AS ENUM (
  'todo',
  'in_progress',
  'review',
  'blocked',
  'completed'
);

-- Task priority enum
CREATE TYPE public.task_priority AS ENUM (
  'low',
  'medium',
  'high',
  'critical'
);

-- Activity action enum
CREATE TYPE public.activity_action AS ENUM (
  'created',
  'updated',
  'deleted',
  'status_changed',
  'assigned',
  'commented',
  'attachment_added',
  'attachment_removed'
);

-- Notification type enum
CREATE TYPE public.notification_type AS ENUM (
  'task_assigned',
  'task_completed',
  'task_overdue',
  'task_blocked',
  'project_update',
  'team_invited',
  'mention',
  'system'
);

-- Attachment entity type enum
CREATE TYPE public.attachment_entity_type AS ENUM (
  'task',
  'project',
  'phase',
  'profile',
  'subcontractor'
);
