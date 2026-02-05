import { Suspense } from "react";
import { validateInvitationToken } from "@/app/actions/accept-invite";
import { InviteLoginForm } from "./InviteLoginForm";
import { redirect } from "next/navigation";

export const metadata = {
  title: "Sign In | Accept Invitation | GenHub",
  description: "Sign in to accept your team invitation",
};

type SearchParams = Promise<{ [key: string]: string | string[] | undefined }>;

export default async function AcceptInviteLoginPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  return (
    <Suspense fallback={<LoginLoading />}>
      <LoginWrapper searchParams={searchParams} />
    </Suspense>
  );
}

async function LoginWrapper({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const token = params.token as string | undefined;
  const showSuccessMessage = params.signup === "success";

  // Redirect if no token
  if (!token) {
    redirect("/");
  }

  // Validate invitation token
  const tokenValidation = await validateInvitationToken(token);

  // If invalid/expired, redirect to home with error
  if (!tokenValidation.success) {
    redirect("/");
  }

  // Pass invitation data to client component
  return (
    <InviteLoginForm
      invitation={tokenValidation.invitation}
      token={token}
      showSuccessMessage={showSuccessMessage}
    />
  );
}

function LoginLoading() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-gray-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white dark:bg-gray-900 rounded-2xl shadow-construction-lg border-2 border-gray-200 dark:border-gray-700 p-8">
        <div className="space-y-4">
          <div className="h-16 w-16 mx-auto bg-gray-200 dark:bg-gray-800 rounded-xl animate-pulse" />
          <div className="h-8 bg-gray-200 dark:bg-gray-800 rounded animate-pulse" />
          <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded animate-pulse" />
          <div className="space-y-3 mt-6">
            <div className="h-10 bg-gray-200 dark:bg-gray-800 rounded animate-pulse" />
            <div className="h-10 bg-gray-200 dark:bg-gray-800 rounded animate-pulse" />
            <div className="h-10 bg-gray-200 dark:bg-gray-800 rounded animate-pulse" />
          </div>
        </div>
      </div>
    </div>
  );
}
