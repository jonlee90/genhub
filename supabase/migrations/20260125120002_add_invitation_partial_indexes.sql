-- Migration: Add missing partial indexes for invitation performance
-- Date: 2026-01-25
-- Reference: User Invite System Audit - Findings H-002, H-004
-- Issues: Missing indexes for active invitation queries
-- Fix: Create partial indexes for common query patterns

-- ==============================================================================
-- H-002: team_invitations - Partial Index for Active Invitations
-- ==============================================================================
-- ISSUE: Validation queries scan all rows for used_at/expires_at filters
-- FIX: Partial index covers only active (unused, unexpired) invitations
-- IMPACT: Affects validateInvitationToken() - runs on every invite acceptance
-- ==============================================================================

-- Drop existing if present (idempotent)
DROP INDEX IF EXISTS idx_team_invitations_active;

-- Create partial index for active invitations
-- Used by: validateInvitationToken() in app/actions/accept-invite.ts:74-93
CREATE INDEX idx_team_invitations_active
ON public.team_invitations(invitation_token, expires_at)
WHERE used_at IS NULL;

COMMENT ON INDEX idx_team_invitations_active
  IS 'Partial index for active (unused) team invitations. Optimizes validation queries.';

-- ==============================================================================
-- H-004: admin_invitations - Partial Index for Pending Invitations
-- ==============================================================================
-- ISSUE: Duplicate check and pending list queries filter by used_at IS NULL
-- FIX: Partial index for pending invitations by email and expiration
-- IMPACT: Affects inviteAdmin() duplicate check and getPendingAdminInvitations()
-- ==============================================================================

-- Drop existing if present (idempotent)
DROP INDEX IF EXISTS idx_admin_invitations_active;

-- Create partial index for pending invitations
-- Used by:
--   - inviteAdmin() duplicate check in app/actions/owner.ts:218-230
--   - getPendingAdminInvitations() in app/actions/owner.ts
CREATE INDEX idx_admin_invitations_active
ON public.admin_invitations(email, expires_at)
WHERE used_at IS NULL;

COMMENT ON INDEX idx_admin_invitations_active
  IS 'Partial index for active (unused) admin invitations. Optimizes duplicate checks.';

-- ==============================================================================
-- VERIFICATION
-- ==============================================================================

DO $$
DECLARE
  team_idx_count integer;
  admin_idx_count integer;
  team_idx_size text;
  admin_idx_size text;
BEGIN
  -- Check if indexes were created
  SELECT COUNT(*) INTO team_idx_count
  FROM pg_indexes
  WHERE schemaname = 'public'
  AND tablename = 'team_invitations'
  AND indexname = 'idx_team_invitations_active';

  SELECT COUNT(*) INTO admin_idx_count
  FROM pg_indexes
  WHERE schemaname = 'public'
  AND tablename = 'admin_invitations'
  AND indexname = 'idx_admin_invitations_active';

  -- Get index sizes
  SELECT pg_size_pretty(pg_relation_size('idx_team_invitations_active'))
  INTO team_idx_size;

  SELECT pg_size_pretty(pg_relation_size('idx_admin_invitations_active'))
  INTO admin_idx_size;

  -- Report results
  IF team_idx_count = 1 AND admin_idx_count = 1 THEN
    RAISE NOTICE '
================================================================================
✓ Invitation Partial Indexes Created Successfully
================================================================================

INDEXES CREATED:
  ✓ idx_team_invitations_active (%)
    - Covers: (invitation_token, expires_at) WHERE used_at IS NULL
    - Optimizes: validateInvitationToken() queries

  ✓ idx_admin_invitations_active (%)
    - Covers: (email, expires_at) WHERE used_at IS NULL
    - Optimizes: inviteAdmin() duplicate checks, getPendingAdminInvitations()

BENEFITS:
  - Smaller index size (only active invitations)
  - Faster validation queries (no sequential scan)
  - Faster duplicate checks on invitation creation

QUERY PATTERNS OPTIMIZED:
  1. SELECT ... WHERE invitation_token = ? AND used_at IS NULL
  2. SELECT ... WHERE email = ? AND used_at IS NULL AND expires_at > now()
  3. SELECT ... WHERE used_at IS NULL (pending invitations list)

================================================================================
    ', team_idx_size, admin_idx_size;
  ELSE
    RAISE WARNING 'Expected 2 indexes, found: team=%, admin=%', team_idx_count, admin_idx_count;
  END IF;
END $$;
