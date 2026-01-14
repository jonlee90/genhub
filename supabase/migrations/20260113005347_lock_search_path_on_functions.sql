-- Migration: Lock search_path on all functions to prevent schema injection attacks
-- Issue: PERF-006 - 22 functions vulnerable to schema injection
-- Impact: Eliminates security vulnerability, no performance change
-- Date: 2026-01-13

-- Critical auth/RLS functions (public schema)
ALTER FUNCTION public.get_user_company_id(p_user_id uuid) SET search_path = public, pg_catalog;
ALTER FUNCTION public.is_user_admin(p_user_id uuid) SET search_path = public, pg_catalog;

-- Auth function (next_auth schema)
ALTER FUNCTION next_auth.uid() SET search_path = public, next_auth, pg_catalog;

-- Trigger functions (public schema) - no parameters
ALTER FUNCTION public.update_updated_at_column() SET search_path = public, pg_catalog;
ALTER FUNCTION public.update_task_costs() SET search_path = public, pg_catalog;
ALTER FUNCTION public.set_task_completed_at() SET search_path = public, pg_catalog;
ALTER FUNCTION public.update_phase_completion() SET search_path = public, pg_catalog;
ALTER FUNCTION public.update_project_completion() SET search_path = public, pg_catalog;
ALTER FUNCTION public.ensure_single_primary_assignee() SET search_path = public, pg_catalog;

-- Chat-related functions (public schema)
ALTER FUNCTION public.get_unread_count(p_chat_room_id uuid, p_user_id uuid) SET search_path = public, pg_catalog;
ALTER FUNCTION public.create_project_chat_room() SET search_path = public, pg_catalog;
ALTER FUNCTION public.add_chat_participant_on_team_join() SET search_path = public, pg_catalog;
ALTER FUNCTION public.remove_chat_participant_on_team_leave() SET search_path = public, pg_catalog;
ALTER FUNCTION public.update_chat_updated_at() SET search_path = public, pg_catalog;
ALTER FUNCTION public.sync_project_chat_attachments() SET search_path = public, pg_catalog;
ALTER FUNCTION public.update_message_on_attachment_change() SET search_path = public, pg_catalog;
ALTER FUNCTION public.update_message_updated_at_on_reaction() SET search_path = public, pg_catalog;

-- Project/Phase/Task management functions (public schema)
ALTER FUNCTION public.create_phases_and_tasks_from_templates() SET search_path = public, pg_catalog;
ALTER FUNCTION public.get_task_analytics(project_filter text, p_company_id uuid) SET search_path = public, pg_catalog;

-- Material/Spatial functions (public schema)
ALTER FUNCTION public.get_project_material_summary(project_uuid uuid) SET search_path = public, pg_catalog;
ALTER FUNCTION public.check_tracked_materials_limit() SET search_path = public, pg_catalog;
ALTER FUNCTION public.update_marker_content_count() SET search_path = public, pg_catalog;

-- Comment: All 22 vulnerable functions now have locked search_path
-- Functions already locked (13 total) remain unchanged
-- Total: 35 functions now have locked search_path (22 fixed + 13 already locked)
