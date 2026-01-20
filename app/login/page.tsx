/**
 * Login Page
 *
 * Server Component wrapper for the login form.
 * Redirects authenticated users to /app.
 *
 * Debug: Handles error and callbackUrl from searchParams
 */

import { Suspense } from 'react';
import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { AuthLayout } from '@/components/auth/AuthLayout';
import { LoginForm } from '@/components/auth/LoginForm';
import { Skeleton } from '@/components/ui/skeleton';

interface LoginPageProps {
  searchParams: Promise<{ error?: string; callbackUrl?: string }>;
}

export default function LoginPage({ searchParams }: LoginPageProps) {
  return (
    <Suspense fallback={<LoginPageLoading />}>
      <LoginPageContent searchParams={searchParams} />
    </Suspense>
  );
}

async function LoginPageContent({ searchParams }: LoginPageProps) {
  console.log('[LoginPage] Checking auth status');

  // Debug: Check if user is already authenticated
  const session = await auth();

  if (session?.user) {
    console.log('[LoginPage] User already authenticated, redirecting to /app');
    redirect('/app');
  }

  // Debug: Get search params
  const params = await searchParams;
  const error = params.error;
  const callbackUrl = params.callbackUrl || '/app';

  console.log('[LoginPage] Rendering login form, error:', error);

  return (
    <AuthLayout>
      <LoginForm error={error} callbackUrl={callbackUrl} />
    </AuthLayout>
  );
}

function LoginPageLoading() {
  return (
    <AuthLayout>
      <div className="space-y-6">
        <div className="text-center space-y-2">
          <Skeleton className="h-8 w-48 mx-auto" />
          <Skeleton className="h-4 w-64 mx-auto" />
        </div>
        <div className="space-y-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      </div>
    </AuthLayout>
  );
}

// Metadata for SEO
export const metadata = {
  title: 'Sign In | GenHub',
  description: 'Sign in to GenHub - Construction project management made simple',
};
