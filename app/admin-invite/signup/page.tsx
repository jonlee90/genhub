import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { validateAdminInvitationToken } from '@/app/actions/accept-admin-invite';
import { AdminSignupForm } from '@/components/admin-invite/AdminSignupForm';
import { Skeleton } from '@/components/ui/skeleton';

/**
 * Admin Invite Signup Page
 *
 * Server Component - Displays the signup form for accepted admin invitations.
 * User must be authenticated to access this page.
 */
export default function AdminInviteSignupPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  return (
    <Suspense fallback={<AdminInviteSignupLoading />}>
      <AdminInviteSignupContent searchParams={searchParams} />
    </Suspense>
  );
}

async function AdminInviteSignupContent({
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

function AdminInviteSignupLoading() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-construction-lg border-2 border-gray-200 p-8">
        <div className="space-y-6">
          <Skeleton className="h-12 w-48 mx-auto" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4 mx-auto" />
          <div className="space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        </div>
      </div>
    </div>
  );
}

export const metadata = {
  title: 'Complete Setup | GenHub',
  description: 'Complete your company setup on GenHub',
};
