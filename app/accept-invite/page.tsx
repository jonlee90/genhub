import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { AcceptInviteContent } from './AcceptInviteContent';
import { validateInvitationToken } from '@/app/actions/accept-invite';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Accept Invitation | GenHub',
  description: 'Accept your team invitation and join GenHub',
};

type SearchParams = Promise<{ [key: string]: string | string[] | undefined }>;

export default async function AcceptInvitePage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  return (
    <Suspense fallback={<AcceptInviteLoading />}>
      <AcceptInviteWrapper searchParams={searchParams} />
    </Suspense>
  );
}

async function AcceptInviteWrapper({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const token = params.token as string | undefined;

  // If no token provided, show error
  if (!token) {
    return <AcceptInviteContent error="Missing invitation token. Please check your invitation link." />;
  }

  // Validate token format (UUID)
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(token)) {
    return <AcceptInviteContent error="Invalid invitation token format. Please check your invitation link." />;
  }

  // Validate the invitation token on the server
  const result = await validateInvitationToken(token);

  if (!result.success) {
    return <AcceptInviteContent error={result.error} />;
  }

  // If valid, render the form with invitation data
  return <AcceptInviteContent invitation={result.invitation} token={token} />;
}

function AcceptInviteLoading() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-construction-lg border-2 border-gray-200 p-8">
        <div className="space-y-4">
          <div className="h-16 w-16 mx-auto bg-gray-200 rounded-xl animate-pulse" />
          <div className="h-8 bg-gray-200 rounded animate-pulse" />
          <div className="h-4 bg-gray-200 rounded animate-pulse" />
          <div className="space-y-3 mt-6">
            <div className="h-10 bg-gray-200 rounded animate-pulse" />
            <div className="h-10 bg-gray-200 rounded animate-pulse" />
            <div className="h-10 bg-gray-200 rounded animate-pulse" />
          </div>
        </div>
      </div>
    </div>
  );
}
