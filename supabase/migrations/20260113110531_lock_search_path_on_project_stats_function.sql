-- Fix WARN: Function search_path must be locked for security
-- This prevents SQL injection attacks through schema manipulation
ALTER FUNCTION get_project_detail_with_stats(UUID) SET search_path = '';
