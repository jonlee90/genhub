/**
 * Signup Page
 *
 * Server Component wrapper for the signup info page.
 * Since registration is invitation-only, this page explains how to join.
 * Redirects authenticated users to /app.
 *
 * Debug: Shows invitation-only message
 */

import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { AuthLayout } from '@/components/auth/AuthLayout';
import { SignupInfo } from '@/components/auth/SignupInfo';

export default async function SignupPage() {
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

// Metadata for SEO
export const metadata = {
  title: 'Create Account | GenHub',
  description: 'Join GenHub - Construction project management for your team',
};
