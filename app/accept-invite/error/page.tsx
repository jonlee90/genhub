import { Suspense } from "react";
import { ErrorContent } from "./ErrorContent";

export default function AcceptInviteErrorPage() {
  return (
    <Suspense fallback={<ErrorLoading />}>
      <ErrorContent />
    </Suspense>
  );
}

function ErrorLoading() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-gray-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white dark:bg-gray-900 rounded-2xl shadow-construction-lg border-2 border-gray-200 dark:border-gray-700 p-8">
        <div className="space-y-4">
          <div className="h-16 w-16 mx-auto bg-gray-200 dark:bg-gray-800 rounded-xl animate-pulse" />
          <div className="h-8 bg-gray-200 dark:bg-gray-800 rounded animate-pulse" />
          <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded animate-pulse" />
        </div>
      </div>
    </div>
  );
}
