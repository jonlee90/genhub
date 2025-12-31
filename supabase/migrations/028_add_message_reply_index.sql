-- Migration: Add index for threaded replies performance
-- Date: 2025-12-30
-- Description: Adds index on reply_to_id for efficient thread queries

-- Add index on reply_to_id if it doesn't exist (for thread queries)
CREATE INDEX IF NOT EXISTS idx_messages_reply_to_id
  ON public.messages (reply_to_id)
  WHERE deleted_at IS NULL;

-- Add composite index for chat room + reply filtering
CREATE INDEX IF NOT EXISTS idx_messages_chat_room_reply
  ON public.messages (chat_room_id, reply_to_id)
  WHERE deleted_at IS NULL;

COMMENT ON INDEX idx_messages_reply_to_id IS 'Index for efficient threaded reply queries';
COMMENT ON INDEX idx_messages_chat_room_reply IS 'Composite index for filtering main messages (reply_to_id IS NULL) in chat rooms';
