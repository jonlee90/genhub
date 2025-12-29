import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";

export default async function Home() {
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
