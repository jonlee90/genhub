-- Migration: Add GIN index on entity_references JSONB column
-- Created: 2025-12-30
-- Description: Adds index for efficient querying of entity references in messages (@mentions, task refs, etc.)

-- Add GIN index on entity_references JSONB column for efficient querying
-- This allows us to quickly find messages that reference specific entities

DO $$
BEGIN
  -- Check if index doesn't exist before creating
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes
    WHERE schemaname = 'public'
    AND tablename = 'messages'
    AND indexname = 'idx_messages_entity_references'
  ) THEN
    CREATE INDEX idx_messages_entity_references ON public.messages USING gin (entity_references);
    RAISE NOTICE 'Index idx_messages_entity_references created successfully';
  ELSE
    RAISE NOTICE 'Index idx_messages_entity_references already exists';
  END IF;
END $$;

COMMENT ON INDEX public.idx_messages_entity_references IS 'GIN index for efficient querying of entity references in messages (supports @mentions, task refs, etc.)';
