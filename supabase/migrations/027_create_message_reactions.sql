-- Migration: Create message_reactions table
-- Date: 2025-12-30
-- Description: Enables emoji reactions on chat messages with construction-themed support
-- Task: 0006-message-reactions (Phase 2: Rich Features)

-- ============================================
-- Create message_reactions table
-- ============================================

CREATE TABLE IF NOT EXISTS public.message_reactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id uuid NOT NULL REFERENCES public.messages(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES next_auth.users(id) ON DELETE CASCADE,
  emoji text NOT NULL CHECK (char_length(emoji) > 0 AND char_length(emoji) <= 10),
  created_at timestamptz DEFAULT now(),

  -- Ensure one reaction type per user per message
  CONSTRAINT message_reactions_unique UNIQUE (message_id, user_id, emoji)
);

-- ============================================
-- Add indexes for performance
-- ============================================

-- Index for fetching all reactions for a message (primary use case)
CREATE INDEX idx_message_reactions_message_id ON public.message_reactions(message_id);

-- Index for fetching user's reactions (for highlighting)
CREATE INDEX idx_message_reactions_user_id ON public.message_reactions(user_id);

-- Composite index for checking if user already reacted with specific emoji
CREATE INDEX idx_message_reactions_lookup ON public.message_reactions(message_id, user_id, emoji);

-- ============================================
-- Enable Row Level Security
-- ============================================

ALTER TABLE public.message_reactions ENABLE ROW LEVEL SECURITY;

-- ============================================
-- RLS Policies
-- ============================================

-- Policy: Users can view reactions in chat rooms they participate in
CREATE POLICY "Users can view reactions in accessible rooms"
ON public.message_reactions
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.messages m
    JOIN public.chat_participants cp ON cp.chat_room_id = m.chat_room_id
    WHERE m.id = message_reactions.message_id
      AND cp.user_id = next_auth.uid()
  )
);

-- Policy: Users can create reactions in chat rooms they participate in
CREATE POLICY "Users can create reactions in accessible rooms"
ON public.message_reactions
FOR INSERT
TO authenticated
WITH CHECK (
  user_id = next_auth.uid()
  AND EXISTS (
    SELECT 1
    FROM public.messages m
    JOIN public.chat_participants cp ON cp.chat_room_id = m.chat_room_id
    WHERE m.id = message_reactions.message_id
      AND cp.user_id = next_auth.uid()
  )
);

-- Policy: Users can delete their own reactions only
CREATE POLICY "Users can delete own reactions"
ON public.message_reactions
FOR DELETE
TO authenticated
USING (user_id = next_auth.uid());

-- ============================================
-- Add table comment
-- ============================================

COMMENT ON TABLE public.message_reactions IS 'Emoji reactions to chat messages. One reaction type per user per message. No notifications generated (silent acknowledgment per requirements Req 3.7).';

-- ============================================
-- Optional: Update message timestamp on reaction
-- ============================================

-- This trigger updates the message's updated_at timestamp when reactions change
-- Useful for cache invalidation and Realtime updates
CREATE OR REPLACE FUNCTION update_message_updated_at_on_reaction()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.messages
  SET updated_at = now()
  WHERE id = COALESCE(NEW.message_id, OLD.message_id);
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER message_reactions_update_message_timestamp
AFTER INSERT OR DELETE ON public.message_reactions
FOR EACH ROW
EXECUTE FUNCTION update_message_updated_at_on_reaction();
