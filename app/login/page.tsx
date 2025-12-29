/**
 * Login Page
 *
 * Server Component wrapper for the login form.
 * Redirects authenticated users to /app.
 *
 * Debug: Handles error and callbackUrl from searchParams
 */

import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { AuthLayout } from '@/components/auth/AuthLayout';
import { LoginForm } from '@/components/auth/LoginForm';

interface LoginPageProps {
  searchParams: Promise<{ error?: string; callbackUrl?: string }>;
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
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

// Metadata for SEO
export const metadata = {
  title: 'Sign In | GenHub',
  description: 'Sign in to GenHub - Construction project management made simple',
};
