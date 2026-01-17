import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getDashboardData } from "@/app/actions/dashboard";
import { DashboardContent } from "@/components/dashboard/DashboardContent";
import { auth } from "@/lib/auth";
import DashboardLoading from "./loading";

/**
 * GenHub Dashboard Page - Server Component
 *
 * Fetches dashboard data server-side and passes to client component.
 * Handles authentication redirects and error states.
 */
export default async function DashboardPage() {
  // Get user session for name display
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  // Fetch dashboard data server-side
  const { data, error } = await getDashboardData();

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
      <div className="min-h-screen p-4 md:p-8 flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-100 flex items-center justify-center">
            <svg
              className="w-8 h-8 text-red-600"
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
          <h2 className="text-xl font-bold text-gray-900 mb-2">
            Unable to Load Dashboard
          </h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <a
            href="/app"
            className="inline-flex items-center px-4 py-2 bg-[#001B51] text-white rounded-lg hover:bg-[#001B51]/90 transition-colors"
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

  return (
    <Suspense fallback={<DashboardLoading />}>
      <DashboardContent data={data} userName={userName} />
    </Suspense>
  );
}
