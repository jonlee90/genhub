-- Migration 032: RPC function to find existing DM room between two users
-- Task 0020: Direct Messaging - Find or Create DM Rooms
-- Created: 2025-12-30

-- RPC function to find existing DM room between two users
-- Returns the chat_room_id if a DM exists between user1 and user2, null otherwise
CREATE OR REPLACE FUNCTION find_dm_room(
  user1_id UUID,
  user2_id UUID
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, next_auth
AS $$
DECLARE
  room_id UUID;
  caller_id UUID;
BEGIN
  -- SECURITY: Get the authenticated user ID
  caller_id := next_auth.uid();

  -- Debug logging
  RAISE NOTICE 'find_dm_room called with user1: %, user2: %, caller: %', user1_id, user2_id, caller_id;

  -- SECURITY: Verify authentication
  IF caller_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  -- SECURITY: Verify caller is one of the participants
  -- This prevents unauthorized users from enumerating DM relationships
  IF caller_id != user1_id AND caller_id != user2_id THEN
    RAISE EXCEPTION 'Unauthorized: You can only search for your own DM rooms';
  END IF;

  -- Find chat room where:
  -- 1. Type is 'dm'
  -- 2. No project_id (DMs are not project-specific)
  -- 3. Both users are participants
  SELECT cr.id INTO room_id
  FROM chat_rooms cr
  WHERE cr.type = 'dm'
    AND cr.project_id IS NULL
    AND EXISTS (
      SELECT 1 FROM chat_participants cp1
      WHERE cp1.chat_room_id = cr.id
        AND cp1.user_id = user1_id
        AND cp1.left_at IS NULL
    )
    AND EXISTS (
      SELECT 1 FROM chat_participants cp2
      WHERE cp2.chat_room_id = cr.id
        AND cp2.user_id = user2_id
        AND cp2.left_at IS NULL
    )
  LIMIT 1;

  -- Debug logging
  RAISE NOTICE 'find_dm_room returning: %', room_id;

  RETURN room_id;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION find_dm_room(UUID, UUID) TO authenticated;

-- Add comment
COMMENT ON FUNCTION find_dm_room IS 'Finds existing DM room between two users, returns null if none exists. Uses SECURITY DEFINER to bypass RLS policies. SECURITY: Verifies caller is one of the participants to prevent unauthorized enumeration.';
