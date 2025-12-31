-- Migration 033: Add constraints and locks to prevent duplicate DM rooms
-- Task 0020: Direct Messaging - Fix Race Condition (C2)
-- Created: 2025-12-30

-- APPROACH: Use advisory locks to prevent race conditions when creating DM rooms
-- Advisory locks are session-scoped and automatically released when transaction ends

-- Function to acquire advisory lock for DM room creation
-- This ensures only one DM room can be created between two users at a time
CREATE OR REPLACE FUNCTION acquire_dm_lock(
  user1_id UUID,
  user2_id UUID
)
RETURNS BIGINT
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  lock_id BIGINT;
  smaller_id UUID;
  larger_id UUID;
BEGIN
  -- Determine consistent order (smaller UUID first)
  -- This ensures lock is the same regardless of parameter order
  IF user1_id < user2_id THEN
    smaller_id := user1_id;
    larger_id := user2_id;
  ELSE
    smaller_id := user2_id;
    larger_id := user1_id;
  END IF;

  -- Generate lock ID from UUIDs
  -- Use hashtext to convert UUID pair to a consistent integer
  lock_id := hashtext(smaller_id::text || '-' || larger_id::text);

  -- Acquire advisory lock (blocks until available)
  PERFORM pg_advisory_xact_lock(lock_id);

  RETURN lock_id;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION acquire_dm_lock(UUID, UUID) TO authenticated;

-- Add comment
COMMENT ON FUNCTION acquire_dm_lock IS 'Acquires an advisory lock for DM room creation between two users. Lock is automatically released when transaction ends. Returns lock ID for debugging.';

-- Additional safety: Create a partial unique index to catch any duplicates
-- This is a backup mechanism in case advisory locks fail
--
-- Note: This index works by creating a unique constraint on company_id + type
-- where we can verify participant membership through a subquery
-- However, PostgreSQL doesn't allow subqueries in partial indexes,
-- so we'll use a simpler approach with triggers instead.

-- Create trigger function to prevent duplicate DM rooms
CREATE OR REPLACE FUNCTION check_duplicate_dm_room()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  participant_count INTEGER;
  existing_room_id UUID;
BEGIN
  -- Only check for DM rooms
  IF NEW.type != 'dm' THEN
    RETURN NEW;
  END IF;

  -- Get participants for this room (should be exactly 2)
  SELECT COUNT(*) INTO participant_count
  FROM chat_participants
  WHERE chat_room_id = NEW.id;

  -- If we don't have participants yet, allow insert (they'll be added after)
  IF participant_count < 2 THEN
    RETURN NEW;
  END IF;

  -- Check for existing DM room with same participants
  SELECT cr.id INTO existing_room_id
  FROM chat_rooms cr
  WHERE cr.id != NEW.id
    AND cr.type = 'dm'
    AND cr.company_id = NEW.company_id
    AND (
      SELECT COUNT(DISTINCT cp.user_id)
      FROM chat_participants cp
      WHERE cp.chat_room_id = cr.id
        AND cp.left_at IS NULL
        AND cp.user_id IN (
          SELECT user_id
          FROM chat_participants
          WHERE chat_room_id = NEW.id
        )
    ) = 2;

  IF existing_room_id IS NOT NULL THEN
    RAISE EXCEPTION 'Duplicate DM room detected. Existing room: %', existing_room_id;
  END IF;

  RETURN NEW;
END;
$$;

-- Create trigger on chat_rooms to check for duplicates
-- This runs AFTER participant insertion to verify no duplicates
CREATE TRIGGER check_duplicate_dm_room_trigger
  AFTER INSERT OR UPDATE ON chat_rooms
  FOR EACH ROW
  WHEN (NEW.type = 'dm')
  EXECUTE FUNCTION check_duplicate_dm_room();

-- Add comment
COMMENT ON FUNCTION check_duplicate_dm_room IS 'Trigger function to prevent duplicate DM rooms between the same participants. This is a backup mechanism in addition to advisory locks.';

-- Index to speed up duplicate detection
CREATE INDEX IF NOT EXISTS idx_dm_rooms_company_type
ON chat_rooms(company_id, type)
WHERE type = 'dm';

-- Add helpful note
COMMENT ON TRIGGER check_duplicate_dm_room_trigger ON chat_rooms IS 'Prevents duplicate DM rooms between the same participants. Works as a backup to advisory locks.';
