-- GenHub PWA: Notifications Table
-- Multi-channel notification system
-- Created: 2025-12-04

-- Notification type enum
CREATE TYPE public.notification_type AS ENUM (
  'task_assigned',
  'task_completed',
  'task_overdue',
  'task_blocked',
  'task_comment',
  'project_update',
  'team_invited',
  'team_joined',
  'mention',
  'deadline_reminder',
  'phase_completed'
);

-- Notifications table
CREATE TABLE public.notifications (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL DEFAULT next_auth.uid(),
  type public.notification_type NOT NULL,
  title text NOT NULL,
  message text,
  link text,
  entity_type text, -- 'task', 'project', 'team', etc.
  entity_id uuid,
  is_read boolean DEFAULT false,
  read_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now()
);

-- Add table comment
COMMENT ON TABLE public.notifications IS 'User notifications for task assignments, updates, mentions, and system events. Supports in-app, email, push, and KakaoTalk channels.';

-- Enable Row Level Security
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Create indexes for performance
CREATE INDEX idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX idx_notifications_is_read ON public.notifications(is_read);
CREATE INDEX idx_notifications_created_at ON public.notifications(created_at DESC);
CREATE INDEX idx_notifications_type ON public.notifications(type);

-- RLS Policies
-- Users can only see their own notifications
CREATE POLICY "Users can view own notifications"
  ON public.notifications
  FOR SELECT
  TO authenticated
  USING (user_id = next_auth.uid());

-- System can insert notifications for any user
CREATE POLICY "System can insert notifications"
  ON public.notifications
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Users can update (mark as read) their own notifications
CREATE POLICY "Users can update own notifications"
  ON public.notifications
  FOR UPDATE
  TO authenticated
  USING (user_id = next_auth.uid());

-- Users can delete their own notifications
CREATE POLICY "Users can delete own notifications"
  ON public.notifications
  FOR DELETE
  TO authenticated
  USING (user_id = next_auth.uid());
