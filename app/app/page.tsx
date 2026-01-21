import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getDashboardPageData } from "@/lib/dashboard";
import { DashboardContent } from "@/components/dashboard/DashboardContent";
import { auth } from "@/lib/auth";
import DashboardLoading from "./loading";

/**
 * GenHub Dashboard Page - Server Component
 *
 * Fetches dashboard data and project types server-side in parallel.
 * Passes prefetched project types to modal to avoid client-side fetching.
 * Handles authentication redirects and error states.
 */
export default function DashboardPage() {
  return (
    <Suspense fallback={<DashboardLoading />}>
      <DashboardPageContent />
    </Suspense>
  );
}

async function DashboardPageContent() {
  // Get user session for name display
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  // Fetch dashboard data and project types in parallel (async-parallel pattern)
  const { data, error, projectTypes } = await getDashboardPageData();

  // Handle error state
  if (error) {
    // If auth error, redirect to login
    if (
      error === "Not authenticated" ||
      error === "No active company found for user"
    ) {
      redirect("/login");
    }

    // Show error UI for other errors
    return (
      <div className="min-h-screen p-4 md:p-8 flex items-center justify-center bg-white dark:bg-gray-950">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center">
            <svg
              className="w-8 h-8 text-red-600 dark:text-red-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
            Unable to Load Dashboard
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">{error}</p>
          <a
            href="/app"
            className="inline-flex items-center px-4 py-2 bg-construction-blue text-white rounded-lg hover:bg-construction-blue/90 transition-colors"
          >
            Try Again
          </a>
        </div>
      </div>
    );
  }

  // Handle case where data is null (shouldn't happen if no error, but TypeScript safety)
  if (!data) {
    redirect("/login");
  }

  // Extract user name from session
  const userName =
    session.user.name || session.user.email?.split("@")[0] || "User";

  return <DashboardContent data={data} userName={userName} projectTypes={projectTypes} />;
}
