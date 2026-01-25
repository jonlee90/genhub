-- Fix add_chat_participant_on_team_join() trigger function to use 'admin' instead of 'gc_admin'
-- Issue: The function still references the old 'gc_admin' enum value which no longer exists
-- This causes INSERT failures on project_team table

CREATE OR REPLACE FUNCTION public.add_chat_participant_on_team_join()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_catalog'
AS $function$
DECLARE
  v_chat_room_id uuid;
  v_participant_role text;
BEGIN
  -- Only process if user_id is set (not subcontractor-only team members)
  IF NEW.user_id IS NULL THEN
    RETURN NEW;
  END IF;

  -- Get the chat room for this project
  SELECT id INTO v_chat_room_id
  FROM public.chat_rooms
  WHERE project_id = NEW.project_id
    AND type = 'project'
  LIMIT 1;

  -- If no chat room exists, skip (shouldn't happen due to trigger 1)
  IF v_chat_room_id IS NULL THEN
    RETURN NEW;
  END IF;

  -- Determine chat participant role based on project role
  -- FIXED: Changed 'gc_admin' to 'admin'
  v_participant_role := CASE
    WHEN NEW.role IN ('admin', 'project_manager') THEN 'admin'
    ELSE 'member'
  END;

  -- Add user as chat participant (ignore if already exists)
  INSERT INTO public.chat_participants (
    chat_room_id,
    user_id,
    role
  ) VALUES (
    v_chat_room_id,
    NEW.user_id,
    v_participant_role
  )
  ON CONFLICT (chat_room_id, user_id) DO NOTHING;

  RETURN NEW;
END;
$function$;
