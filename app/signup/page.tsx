/**
 * Signup Page
 *
 * Server Component wrapper for the signup info page.
 * Since registration is invitation-only, this page explains how to join.
 * Redirects authenticated users to /app.
 *
 * Debug: Shows invitation-only message
 */

import { Suspense } from 'react';
import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { AuthLayout } from '@/components/auth/AuthLayout';
import { SignupInfo } from '@/components/auth/SignupInfo';
import { Skeleton } from '@/components/ui/skeleton';

export default function SignupPage() {
  return (
    <Suspense fallback={<SignupPageLoading />}>
      <SignupPageContent />
    </Suspense>
  );
}

async function SignupPageContent() {
  console.log('[SignupPage] Checking auth status');

  // Debug: Check if user is already authenticated
  const session = await auth();

  if (session?.user) {
    console.log('[SignupPage] User already authenticated, redirecting to /app');
    redirect('/app');
  }

  console.log('[SignupPage] Rendering signup info');

  return (
    <AuthLayout>
      <SignupInfo />
    </AuthLayout>
  );
}

function SignupPageLoading() {
  return (
    <AuthLayout>
      <div className="space-y-6">
        <div className="text-center space-y-2">
          <Skeleton className="h-8 w-48 mx-auto" />
          <Skeleton className="h-4 w-64 mx-auto" />
        </div>
        <div className="space-y-4">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-12 w-full" />
        </div>
      </div>
    </AuthLayout>
  );
}

// Metadata for SEO
export const metadata = {
  title: 'Create Account | GenHub',
  description: 'Join GenHub - Construction project management for your team',
};
