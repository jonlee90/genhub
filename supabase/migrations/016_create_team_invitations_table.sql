-- GenHub PWA: Team Invitations Table
-- Separate table for pending team invitations
-- Fixes: Placeholder user creation issue in Epic 4, Task 1
-- Created: 2025-12-06

-- Team invitations table for pre-auth invitations
CREATE TABLE public.team_invitations (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  email text NOT NULL,
  name text NOT NULL,
  role public.user_role NOT NULL,
  invitation_token uuid NOT NULL UNIQUE DEFAULT uuid_generate_v4(),
  invited_by uuid NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  invited_at timestamp with time zone DEFAULT now() NOT NULL,
  expires_at timestamp with time zone DEFAULT (now() + interval '7 days') NOT NULL,
  used_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL,

  -- Ensure unique email per company (can re-invite with new token)
  CONSTRAINT unique_invitation_per_company UNIQUE (company_id, email)
);

-- Add table comment
COMMENT ON TABLE public.team_invitations IS 'Pending team invitations before user authentication. Tokens expire after 7 days and are single-use.';

-- Add column comments
COMMENT ON COLUMN public.team_invitations.expires_at IS 'Invitation expires 7 days after creation';
COMMENT ON COLUMN public.team_invitations.used_at IS 'Timestamp when invitation was accepted (null = not used yet)';
COMMENT ON COLUMN public.team_invitations.invitation_token IS 'Secure UUID token sent in invitation email';

-- Enable Row Level Security
ALTER TABLE public.team_invitations ENABLE ROW LEVEL SECURITY;

-- Create indexes for performance
CREATE INDEX idx_team_invitations_company_id ON public.team_invitations(company_id);
CREATE INDEX idx_team_invitations_email ON public.team_invitations(LOWER(email));
CREATE INDEX idx_team_invitations_token ON public.team_invitations(invitation_token);
CREATE INDEX idx_team_invitations_expires_at ON public.team_invitations(expires_at);

-- RLS Policies
-- GC Admins can view invitations for their company
CREATE POLICY "GC Admins can view company invitations"
  ON public.team_invitations
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.company_users cu
      WHERE cu.company_id = team_invitations.company_id
      AND cu.user_id = next_auth.uid()
      AND cu.role = 'gc_admin'
      AND cu.status = 'active'
    )
  );

-- GC Admins can create invitations
CREATE POLICY "GC Admins can create invitations"
  ON public.team_invitations
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.company_users cu
      WHERE cu.company_id = team_invitations.company_id
      AND cu.user_id = next_auth.uid()
      AND cu.role = 'gc_admin'
      AND cu.status = 'active'
    )
  );

-- GC Admins can update invitations (e.g., resend with new token)
CREATE POLICY "GC Admins can update invitations"
  ON public.team_invitations
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.company_users cu
      WHERE cu.company_id = team_invitations.company_id
      AND cu.user_id = next_auth.uid()
      AND cu.role = 'gc_admin'
      AND cu.status = 'active'
    )
  );

-- GC Admins can delete invitations
CREATE POLICY "GC Admins can delete invitations"
  ON public.team_invitations
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.company_users cu
      WHERE cu.company_id = team_invitations.company_id
      AND cu.user_id = next_auth.uid()
      AND cu.role = 'gc_admin'
      AND cu.status = 'active'
    )
  );

-- Update updated_at trigger
CREATE TRIGGER update_team_invitations_updated_at
  BEFORE UPDATE ON public.team_invitations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
