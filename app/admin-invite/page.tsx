import { Suspense } from 'react';
import { validateAdminInvitationToken } from '@/app/actions/accept-admin-invite';
import { AdminInviteContent } from '@/components/admin-invite/AdminInviteContent';
import { Skeleton } from '@/components/ui/skeleton';

/**
 * Admin Invite Token Page
 *
 * Server Component - Validates the invitation token and displays
 * invitation details with sign-in options.
 */
export default function AdminInvitePage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  return (
    <Suspense fallback={<AdminInviteLoading />}>
      <AdminInvitePageContent searchParams={searchParams} />
    </Suspense>
  );
}

async function AdminInvitePageContent({
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

function AdminInviteLoading() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-construction-lg border-2 border-gray-200 p-8">
        <div className="text-center space-y-6">
          <Skeleton className="h-16 w-16 rounded-xl mx-auto" />
          <div className="space-y-2">
            <Skeleton className="h-8 w-48 mx-auto" />
            <Skeleton className="h-4 w-64 mx-auto" />
          </div>
          <Skeleton className="h-12 w-full" />
        </div>
      </div>
    </div>
  );
}

export const metadata = {
  title: 'Admin Invitation | GenHub',
  description: 'Accept your admin invitation to join GenHub',
};
