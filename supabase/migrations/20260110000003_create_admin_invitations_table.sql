-- Migration: Create admin_invitations table
-- For owners to invite new company admins who will create their own companies

-- Create admin_invitations table
CREATE TABLE public.admin_invitations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  name text,
  invitation_token uuid NOT NULL UNIQUE DEFAULT gen_random_uuid(),
  invited_by uuid NOT NULL REFERENCES public.owners(id) ON DELETE CASCADE,
  invited_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '7 days'),
  used_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.admin_invitations IS 'Invitations from owners to create new company admins';
COMMENT ON COLUMN public.admin_invitations.email IS 'Email of the invited admin (will create their own company)';
COMMENT ON COLUMN public.admin_invitations.name IS 'Optional name of the invited person';
COMMENT ON COLUMN public.admin_invitations.invitation_token IS 'Unique token for invitation URL';
COMMENT ON COLUMN public.admin_invitations.invited_by IS 'Reference to the owner who sent the invitation';
COMMENT ON COLUMN public.admin_invitations.expires_at IS 'Invitation expires after 7 days';
COMMENT ON COLUMN public.admin_invitations.used_at IS 'When the invitation was accepted (null if not yet used)';

-- Indexes
CREATE INDEX idx_admin_invitations_email ON public.admin_invitations(email);
CREATE INDEX idx_admin_invitations_token ON public.admin_invitations(invitation_token);
CREATE INDEX idx_admin_invitations_invited_by ON public.admin_invitations(invited_by);
CREATE INDEX idx_admin_invitations_expires_at ON public.admin_invitations(expires_at);

-- Enable RLS
ALTER TABLE public.admin_invitations ENABLE ROW LEVEL SECURITY;

-- No user-facing RLS policies - all operations done via service role by owner actions
-- Owners manage invitations through server actions with admin client

-- Auto-update trigger for updated_at
CREATE TRIGGER update_admin_invitations_updated_at
BEFORE UPDATE ON public.admin_invitations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
