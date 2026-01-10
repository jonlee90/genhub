import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { validateAdminInvitationToken } from '@/app/actions/accept-admin-invite';
import { AdminSignupForm } from '@/components/admin-invite/AdminSignupForm';

/**
 * Admin Invite Signup Page
 *
 * Server Component - Displays the signup form for accepted admin invitations.
 * User must be authenticated to access this page.
 */
export default async function AdminInviteSignupPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const params = await searchParams;
  const token = params.token;

  console.log('[AdminInviteSignupPage] Checking auth and token');

  // Check authentication
  const session = await auth();
  if (!session?.user) {
    console.log('[AdminInviteSignupPage] User not authenticated, redirecting to invite page');
    redirect(`/admin-invite?token=${token}`);
  }

  // No token provided
  if (!token) {
    console.log('[AdminInviteSignupPage] No token, redirecting to home');
    redirect('/');
  }

  // Validate token
  const validationResult = await validateAdminInvitationToken(token);

  if (!validationResult.valid) {
    console.log('[AdminInviteSignupPage] Invalid token:', validationResult.error);
    redirect(`/admin-invite?token=${token}`);
  }

  const invitation = validationResult.invitation!;

  // Check if email matches
  if (invitation.email.toLowerCase() !== session.user.email?.toLowerCase()) {
    console.log('[AdminInviteSignupPage] Email mismatch', {
      inviteEmail: invitation.email,
      sessionEmail: session.user.email,
    });
    // Redirect with error - they signed in with wrong email
    redirect(`/admin-invite?token=${token}&error=email_mismatch`);
  }

  return (
    <AdminSignupForm
      token={token}
      invitation={invitation}
      userEmail={session.user.email!}
      userName={session.user.name || invitation.name || ''}
    />
  );
}

export const metadata = {
  title: 'Complete Setup | GenHub',
  description: 'Complete your company setup on GenHub',
};
