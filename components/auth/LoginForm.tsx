'use client';

/**
 * LoginForm Component
 *
 * Main login form combining Google OAuth and Email magic link sign-in.
 * Construction-themed with error handling for NextAuth error codes.
 *
 * Debug: Displays auth errors from URL params
 */

import { m as motion } from 'framer-motion';
import Link from 'next/link';
import { HardHat, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { GoogleSignInButton } from './GoogleSignInButton';
import { EmailSignInForm } from './EmailSignInForm';

interface LoginFormProps {
  error?: string;
  callbackUrl?: string;
}

// Debug: Map NextAuth error codes to user-friendly messages
const ERROR_MESSAGES: Record<string, string> = {
  OAuthAccountNotLinked: 'This email is already associated with another account. Try signing in with a different method.',
  EmailSignin: 'Failed to send the sign-in email. Please try again.',
  Configuration: 'There is a server configuration error. Please contact support.',
  AccessDenied: 'Access denied. You may not have permission to sign in.',
  Verification: 'The sign-in link has expired or has already been used.',
  Default: 'An error occurred during sign-in. Please try again.',
};

export function LoginForm({ error, callbackUrl = '/app' }: LoginFormProps) {
  console.log('[LoginForm] Rendering with error:', error, 'callbackUrl:', callbackUrl);

  // Debug: Get user-friendly error message
  const errorMessage = error ? ERROR_MESSAGES[error] || ERROR_MESSAGES.Default : null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-4">
        <motion.div
          initial={{ rotate: -10, scale: 0.9 }}
          animate={{ rotate: 0, scale: 1 }}
          transition={{ type: 'spring', stiffness: 200 }}
          className="mx-auto w-16 h-16 bg-construction-blue rounded-xl flex items-center justify-center"
        >
          <HardHat className="w-8 h-8 text-white" />
        </motion.div>
        <div>
          <h1 className="text-3xl font-black text-gray-900 dark:text-gray-100">Sign in to GenHub</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Access your construction projects</p>
        </div>
      </div>

      {/* Error Alert */}
      {errorMessage && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{errorMessage}</AlertDescription>
          </Alert>
        </motion.div>
      )}

      {/* Google Sign-in */}
      <GoogleSignInButton callbackUrl={callbackUrl} />

      {/* Divider */}
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t-2 border-gray-200 dark:border-gray-700" />
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="bg-white dark:bg-gray-900 px-4 text-gray-500 dark:text-gray-400 font-medium">or continue with email</span>
        </div>
      </div>

      {/* Email Sign-in */}
      <EmailSignInForm callbackUrl={callbackUrl} />

      {/* Footer Link */}
      <div className="text-center pt-4 border-t border-gray-200 dark:border-gray-700">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Don't have an account?{' '}
          <Link
            href="/signup"
            className="font-bold text-construction-blue dark:text-blue-400 hover:underline"
          >
            Create Account
          </Link>
        </p>
      </div>
    </div>
  );
}
