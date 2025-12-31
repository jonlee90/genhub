-- Migration: Push Subscriptions Table
-- Description: Creates push_subscriptions table for Firebase Cloud Messaging tokens
-- Created: 2025-12-30

-- ============================================
-- Table: push_subscriptions
-- ============================================

CREATE TABLE IF NOT EXISTS public.push_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES next_auth.users(id) ON DELETE CASCADE,
  endpoint text NOT NULL,
  platform text NOT NULL CHECK (platform IN ('web', 'ios', 'android')),
  p256dh_key text NOT NULL,
  auth_key text NOT NULL,
  user_agent text,
  last_used_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),

  -- Unique constraint: one endpoint per user
  CONSTRAINT unique_user_endpoint UNIQUE (user_id, endpoint)
);

COMMENT ON TABLE public.push_subscriptions IS 'Stores push notification subscriptions (FCM tokens) for each user device/platform';
COMMENT ON COLUMN public.push_subscriptions.endpoint IS 'FCM token or endpoint URL';
COMMENT ON COLUMN public.push_subscriptions.platform IS 'Platform type: web, ios, or android';
COMMENT ON COLUMN public.push_subscriptions.p256dh_key IS 'Public key for push encryption (web push)';
COMMENT ON COLUMN public.push_subscriptions.auth_key IS 'Authentication secret for push encryption (web push)';
COMMENT ON COLUMN public.push_subscriptions.last_used_at IS 'Last time a push was successfully sent to this subscription';

-- ============================================
-- Indexes
-- ============================================

CREATE INDEX IF NOT EXISTS idx_push_subscriptions_user_id
  ON public.push_subscriptions(user_id);

CREATE INDEX IF NOT EXISTS idx_push_subscriptions_platform
  ON public.push_subscriptions(platform);

-- ============================================
-- Row Level Security (RLS)
-- ============================================

ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;

-- Users can view their own subscriptions
CREATE POLICY "push_subscriptions_select_own"
  ON public.push_subscriptions
  FOR SELECT
  USING (next_auth.uid() = user_id);

-- Users can insert their own subscriptions
CREATE POLICY "push_subscriptions_insert_own"
  ON public.push_subscriptions
  FOR INSERT
  WITH CHECK (next_auth.uid() = user_id);

-- Users can update their own subscriptions (for last_used_at)
CREATE POLICY "push_subscriptions_update_own"
  ON public.push_subscriptions
  FOR UPDATE
  USING (next_auth.uid() = user_id);

-- Users can delete their own subscriptions
CREATE POLICY "push_subscriptions_delete_own"
  ON public.push_subscriptions
  FOR DELETE
  USING (next_auth.uid() = user_id);

-- ============================================
-- Triggers
-- ============================================

-- Auto-update updated_at timestamp
CREATE TRIGGER update_push_subscriptions_updated_at
  BEFORE UPDATE ON public.push_subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- Add muted_until column to chat_participants
-- ============================================

-- Add muted_until column for Task 0015 (mute notifications)
ALTER TABLE public.chat_participants
  ADD COLUMN IF NOT EXISTS muted_until timestamptz;

COMMENT ON COLUMN public.chat_participants.muted_until IS 'Mute notifications until this timestamp (NULL = not muted)';

-- Index for checking muted rooms
CREATE INDEX IF NOT EXISTS idx_chat_participants_muted
  ON public.chat_participants(user_id, muted_until)
  WHERE muted_until IS NOT NULL;
