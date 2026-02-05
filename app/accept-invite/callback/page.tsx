import { Suspense } from "react";
import { redirect } from "next/navigation";
import { acceptInvitation } from "@/app/actions/accept-invite";

type PageProps = {
  searchParams: Promise<{ token?: string }>;
};

/**
 * Callback page after successful login during invitation flow
 *
 * This page is hit after the user logs in via /accept-invite/login
 * At this point, the NextAuth session is fully established, so we can
 * safely call acceptInvitation which requires authentication.
 */
export default async function AcceptInviteCallbackPage({ searchParams }: PageProps) {
  return (
    <Suspense fallback={<CallbackLoading />}>
      <CallbackHandler searchParams={searchParams} />
    </Suspense>
  );
}

async function CallbackHandler({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const params = await searchParams;
  const token = params.token;

  if (!token) {
    redirect("/app");
  }

  // Accept the invitation (session is now available)
  const result = await acceptInvitation(token);

  if (!result.success) {
    // Redirect to error page with message
    redirect(`/accept-invite/error?message=${encodeURIComponent(result.error)}`);
  }

  // Success - redirect to dashboard
  redirect("/app");

  // This return is unreachable but satisfies TypeScript
  // redirect() throws an error that Next.js catches, so this never executes
  return null;
}

function CallbackLoading() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-gray-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white dark:bg-gray-900 rounded-2xl shadow-construction-lg border-2 border-gray-200 dark:border-gray-700 p-8">
        <div className="text-center space-y-4">
          <div className="h-16 w-16 mx-auto bg-gray-200 dark:bg-gray-800 rounded-xl animate-pulse" />
          <div className="h-6 bg-gray-200 dark:bg-gray-800 rounded animate-pulse" />
          <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded animate-pulse w-3/4 mx-auto" />
        </div>
      </div>
    </div>
  );
}
