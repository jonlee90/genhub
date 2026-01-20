'use client';

import { m as motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  HardHat,
  AlertCircle,
  Mail,
  User,
  Clock,
  Loader2,
  Building2,
  Shield,
} from 'lucide-react';
import { format } from 'date-fns';
import type { ValidateAdminInvitationResult } from '@/app/actions/accept-admin-invite';

interface AdminInviteContentProps {
  token?: string;
  validationResult: ValidateAdminInvitationResult | null;
}

export function AdminInviteContent({ token, validationResult }: AdminInviteContentProps) {
  const router = useRouter();
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // No token provided
  if (!token) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-gray-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md w-full bg-white rounded-2xl shadow-construction-lg border-2 border-gray-200 p-8"
        >
          <div className="text-center space-y-4">
            <div className="mx-auto w-16 h-16 bg-red-100 rounded-xl flex items-center justify-center">
              <AlertCircle className="w-8 h-8 text-red-600" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-gray-900">Invalid Link</h1>
              <p className="text-gray-600 mt-2">
                No invitation token was provided. Please check your invitation email for the correct link.
              </p>
            </div>
            <Button
              onClick={() => router.push('/')}
              className="w-full bg-construction-blue hover:bg-construction-blue/90"
            >
              Return to Home
            </Button>
          </div>
        </motion.div>
      </div>
    );
  }

  // Token validation failed
  if (!validationResult?.valid) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-gray-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md w-full bg-white rounded-2xl shadow-construction-lg border-2 border-gray-200 p-8"
        >
          <div className="text-center space-y-4">
            <div className="mx-auto w-16 h-16 bg-red-100 rounded-xl flex items-center justify-center">
              <AlertCircle className="w-8 h-8 text-red-600" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-gray-900">Invalid Invitation</h1>
              <p className="text-gray-600 mt-2">
                {validationResult?.error || 'This invitation link is invalid or has expired.'}
              </p>
            </div>
            <Button
              onClick={() => router.push('/')}
              className="w-full bg-construction-blue hover:bg-construction-blue/90"
            >
              Return to Home
            </Button>
          </div>
        </motion.div>
      </div>
    );
  }

  const invitation = validationResult.invitation!;

  const handleGoogleSignIn = async () => {
    setIsSigningIn(true);
    setError(null);

    try {
      console.log('[AdminInviteContent] Starting Google sign-in');
      await signIn('google', {
        callbackUrl: `/admin-invite/signup?token=${token}`,
      });
    } catch (err) {
      console.error('[AdminInviteContent] Google sign-in error:', err);
      setError('Failed to sign in with Google. Please try again.');
      setIsSigningIn(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-gray-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full bg-white rounded-2xl shadow-construction-lg border-2 border-gray-200 p-8"
      >
        {/* Header */}
        <div className="text-center space-y-4 mb-8">
          <motion.div
            initial={{ rotate: -10 }}
            animate={{ rotate: 0 }}
            transition={{ type: 'spring', stiffness: 200 }}
            className="mx-auto w-16 h-16 bg-construction-blue rounded-xl flex items-center justify-center"
          >
            <HardHat className="w-8 h-8 text-white" />
          </motion.div>
          <div>
            <h1 className="text-3xl font-black text-gray-900">Admin Invitation</h1>
            <p className="text-gray-600 mt-1">You've been invited to create a company on GenHub</p>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Invitation Details */}
        <div className="bg-gradient-to-br from-construction-blue/5 to-blue-50 rounded-xl border-2 border-construction-blue/20 p-4 mb-6 space-y-3">
          <h2 className="font-black text-construction-blue text-sm uppercase tracking-wide">
            Invitation Details
          </h2>

          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <Mail className="w-4 h-4 text-gray-500" />
              <span className="text-gray-600 font-medium">Email:</span>
              <span className="text-gray-900 font-bold">{invitation.email}</span>
            </div>

            {invitation.name && (
              <div className="flex items-center gap-2 text-sm">
                <User className="w-4 h-4 text-gray-500" />
                <span className="text-gray-600 font-medium">Name:</span>
                <span className="text-gray-900 font-bold">{invitation.name}</span>
              </div>
            )}

            <div className="flex items-center gap-2 text-sm">
              <Shield className="w-4 h-4 text-gray-500" />
              <span className="text-gray-600 font-medium">Invited by:</span>
              <span className="text-gray-900 font-bold">{invitation.inviter_name}</span>
            </div>

            <div className="flex items-center gap-2 text-sm">
              <Clock className="w-4 h-4 text-gray-500" />
              <span className="text-gray-600 font-medium">Expires:</span>
              <span className="text-gray-900 font-bold">
                {format(new Date(invitation.expires_at), 'MMM d, yyyy h:mm a')}
              </span>
            </div>
          </div>
        </div>

        {/* What You'll Get */}
        <div className="bg-gray-50 rounded-xl border-2 border-gray-200 p-4 mb-6">
          <h3 className="font-bold text-gray-900 text-sm mb-3">What you'll get:</h3>
          <ul className="space-y-2 text-sm text-gray-600">
            <li className="flex items-center gap-2">
              <Building2 className="w-4 h-4 text-construction-blue" />
              Create your own company on GenHub
            </li>
            <li className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-construction-blue" />
              Full admin access to manage your team
            </li>
            <li className="flex items-center gap-2">
              <HardHat className="w-4 h-4 text-construction-blue" />
              Construction project management tools
            </li>
          </ul>
        </div>

        {/* Sign-in Button */}
        <div className="space-y-4">
          <p className="text-sm text-center text-gray-600 font-medium">
            Sign in to accept your invitation
          </p>

          <Button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={isSigningIn}
            className="w-full h-12 text-base font-bold bg-white hover:bg-gray-50 text-gray-900 border-2 border-gray-300 shadow-construction hover:shadow-construction-lg transition-all"
          >
            {isSigningIn ? (
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            ) : (
              <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
            )}
            Continue with Google
          </Button>

          {/* Footer */}
          <p className="text-xs text-center text-gray-500 pt-4 border-t">
            Make sure to sign in with <strong>{invitation.email}</strong>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
