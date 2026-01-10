import { validateAdminInvitationToken } from '@/app/actions/accept-admin-invite';
import { AdminInviteContent } from '@/components/admin-invite/AdminInviteContent';

/**
 * Admin Invite Token Page
 *
 * Server Component - Validates the invitation token and displays
 * invitation details with sign-in options.
 */
export default async function AdminInvitePage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const params = await searchParams;
  const token = params.token;

  console.log('[AdminInvitePage] Validating token:', token?.substring(0, 8) + '...');

  // Validate token if present
  let validationResult = null;
  if (token) {
    validationResult = await validateAdminInvitationToken(token);
    console.log('[AdminInvitePage] Validation result:', {
      valid: validationResult.valid,
      error: validationResult.error,
    });
  }

  return (
    <AdminInviteContent
      token={token}
      validationResult={validationResult}
    />
  );
}

export const metadata = {
  title: 'Admin Invitation | GenHub',
  description: 'Accept your admin invitation to join GenHub',
};
