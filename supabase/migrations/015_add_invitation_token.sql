-- GenHub PWA: Add invitation token to company_users
-- Created: 2025-12-06
-- Epic 4, Task 1: Team invitation acceptance flow

-- Add invitation_token column to company_users table
ALTER TABLE public.company_users
ADD COLUMN invitation_token uuid UNIQUE;

-- Add index for faster token lookup
CREATE INDEX idx_company_users_invitation_token ON public.company_users(invitation_token);

-- Add comment
COMMENT ON COLUMN public.company_users.invitation_token IS 'Unique token for invitation links. Used for accepting team invitations.';

-- Also rename joined_at to activated_at for consistency (if exists)
ALTER TABLE public.company_users
RENAME COLUMN joined_at TO activated_at;
