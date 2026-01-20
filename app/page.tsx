import { Suspense } from "react";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { Skeleton } from "@/components/ui/skeleton";

export default function Home() {
  return (
    <Suspense fallback={<HomeLoading />}>
      <HomeContent />
    </Suspense>
  );
}

async function HomeContent(): Promise<null> {
  // Get user session
  const session = await auth();
  const user = session?.user;

  // Redirect logged-in users to dashboard
  if (user) {
    redirect('/app');
  }

  // Redirect non-logged-in users to login page
  redirect('/login');
}

function HomeLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-gray-50">
      <div className="text-center space-y-4">
        <Skeleton className="h-16 w-16 rounded-full mx-auto" />
        <Skeleton className="h-6 w-32 mx-auto" />
      </div>
    </div>
  );
}
