import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { acceptInvitation } from '@/app/actions/accept-invite';
import { CompleteInviteContent } from './CompleteInviteContent';

export const metadata = {
  title: 'Completing Invitation | GenHub',
  description: 'Finalizing your team invitation',
};

type SearchParams = Promise<{ [key: string]: string | string[] | undefined }>;

export default async function CompleteInvitePage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  return (
    <Suspense fallback={<CompleteInviteLoading />}>
      <CompleteInviteWrapper searchParams={searchParams} />
    </Suspense>
  );
}

async function CompleteInviteWrapper({ searchParams }: { searchParams: SearchParams }) {
  // Check if user is authenticated
  const session = await auth();

  if (!session?.user) {
    // User is not authenticated, redirect back to accept-invite
    const params = await searchParams;
    const token = params.token as string | undefined;
    if (token) {
      redirect(`/accept-invite?token=${token}`);
    }
    redirect('/');
  }

  const params = await searchParams;
  const token = params.token as string | undefined;

  if (!token) {
    return <CompleteInviteContent error="Missing invitation token" />;
  }

  // Validate token format (UUID)
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(token)) {
    return <CompleteInviteContent error="Invalid invitation token format" />;
  }

  // Accept the invitation (activate the user)
  const result = await acceptInvitation(token);

  if (!result.success) {
    return <CompleteInviteContent error={result.error || 'Failed to accept invitation'} />;
  }

  // Success - redirect to dashboard
  return <CompleteInviteContent success={true} message={result.message} />;
}

function CompleteInviteLoading() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-construction-lg border-2 border-gray-200 p-8">
        <div className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 bg-construction-blue rounded-xl flex items-center justify-center">
            <div className="w-8 h-8 border-4 border-white border-t-transparent rounded-full animate-spin" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-gray-900">Processing...</h1>
            <p className="text-gray-600 mt-2">Completing your invitation</p>
          </div>
        </div>
      </div>
    </div>
  );
}
