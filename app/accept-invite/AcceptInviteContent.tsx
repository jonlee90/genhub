'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { acceptInvitation, type InvitationData } from '@/app/actions/accept-invite';
import { signIn } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, HardHat, AlertCircle, Mail, User, Building2, UserCog, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

type AcceptInviteContentProps = {
  invitation?: InvitationData;
  token?: string;
  error?: string;
};

// Role display mapping
const ROLE_DISPLAY: Record<string, { label: string; color: string }> = {
  admin: { label: 'Admin', color: 'bg-construction-blue text-white' },
  project_manager: { label: 'Project Manager', color: 'bg-blue-600 text-white' },
  foreman: { label: 'Foreman', color: 'bg-construction-gray text-white' },
  field_worker: { label: 'Field Worker', color: 'bg-gray-600 text-white' },
  subcontractor: { label: 'Subcontractor', color: 'bg-construction-gray-light text-white' },
  client: { label: 'Client', color: 'bg-gray-500 text-white' },
};

export function AcceptInviteContent({ invitation, token, error: initialError }: AcceptInviteContentProps) {
  const router = useRouter();
  const [isAccepting, setIsAccepting] = useState(false);
  const [error, setError] = useState<string | undefined>(initialError);
  const [success, setSuccess] = useState(false);
  const [authMethod, setAuthMethod] = useState<'google' | 'email' | null>(null);

  // If there's an initial error (invalid token, etc.), show error state
  if (initialError) {
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
              <p className="text-gray-600 mt-2">{initialError}</p>
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

  // If no invitation data, this shouldn't happen but handle it
  if (!invitation || !token) {
    return null;
  }

  const roleInfo = ROLE_DISPLAY[invitation.role] || { label: invitation.role, color: 'bg-gray-500 text-white' };

  const handleGoogleSignIn = async () => {
    setIsAccepting(true);
    setError(undefined);
    try {
      // Sign in with Google, passing the invitation token as a callback URL parameter
      await signIn('google', {
        callbackUrl: `/accept-invite/complete?token=${token}`,
      });
    } catch (err) {
      console.error('Google sign-in error:', err);
      setError('Failed to sign in with Google. Please try again.');
      setIsAccepting(false);
    }
  };

  const handleEmailSignIn = async () => {
    setAuthMethod('email');
    setIsAccepting(true);
    setError(undefined);
    try {
      // Sign in with email magic link
      await signIn('resend', {
        email: invitation.email,
        callbackUrl: `/accept-invite/complete?token=${token}`,
      });

      setSuccess(true);
      // Note: User will receive an email and click the link to complete sign-in
    } catch (err) {
      console.error('Email sign-in error:', err);
      setError('Failed to send email. Please try again.');
      setIsAccepting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-gray-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full bg-white rounded-2xl shadow-construction-lg border-2 border-gray-200 p-8"
      >
        {/* Success State - Email Sent */}
        {success && authMethod === 'email' && (
          <div className="text-center space-y-4">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 200 }}
              className="mx-auto w-16 h-16 bg-blue-100 rounded-xl flex items-center justify-center"
            >
              <Mail className="w-8 h-8 text-construction-blue" />
            </motion.div>
            <div>
              <h1 className="text-2xl font-black text-gray-900">Check Your Email</h1>
              <p className="text-gray-600 mt-2">
                We've sent a magic link to <strong>{invitation.email}</strong>. Click the link in the email to complete your invitation.
              </p>
            </div>
            <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4 text-sm text-gray-600">
              <p className="font-medium">Didn't receive the email?</p>
              <p className="mt-1">Check your spam folder or try signing in again.</p>
            </div>
          </div>
        )}

        {/* Form State */}
        {!success && (
          <>
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
                <h1 className="text-3xl font-black text-gray-900">Join GenHub</h1>
                <p className="text-gray-600 mt-1">Accept your team invitation</p>
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

                <div className="flex items-center gap-2 text-sm">
                  <User className="w-4 h-4 text-gray-500" />
                  <span className="text-gray-600 font-medium">Name:</span>
                  <span className="text-gray-900 font-bold">{invitation.name}</span>
                </div>

                <div className="flex items-center gap-2 text-sm">
                  <Building2 className="w-4 h-4 text-gray-500" />
                  <span className="text-gray-600 font-medium">Company:</span>
                  <span className="text-gray-900 font-bold">{invitation.companyName}</span>
                </div>

                <div className="flex items-center gap-2 text-sm">
                  <UserCog className="w-4 h-4 text-gray-500" />
                  <span className="text-gray-600 font-medium">Role:</span>
                  <Badge className={cn('font-bold', roleInfo.color)}>
                    {roleInfo.label}
                  </Badge>
                </div>
              </div>
            </div>

            {/* Sign-in Options */}
            <div className="space-y-4">
              <p className="text-sm text-center text-gray-600 font-medium">
                Sign in to accept your invitation
              </p>

              {/* Google Sign-in */}
              <Button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={isAccepting}
                className="w-full h-12 text-base font-bold bg-white hover:bg-gray-50 text-gray-900 border-2 border-gray-300 shadow-construction hover:shadow-construction-lg transition-all"
              >
                {isAccepting && authMethod !== 'email' && <Loader2 className="mr-2 h-5 w-5 animate-spin" />}
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
                Continue with Google
              </Button>

              {/* Email Sign-in */}
              <Button
                type="button"
                onClick={handleEmailSignIn}
                disabled={isAccepting}
                className="w-full h-12 text-base font-bold bg-gradient-to-r from-construction-blue to-blue-700 hover:from-construction-blue/90 hover:to-blue-600 shadow-construction hover:shadow-construction-lg transition-all"
              >
                {isAccepting && authMethod === 'email' && <Loader2 className="mr-2 h-5 w-5 animate-spin" />}
                <Mail className="w-5 h-5 mr-2" />
                Continue with Email
              </Button>

              {/* Footer */}
              <p className="text-xs text-center text-gray-500 pt-4 border-t">
                By signing in, you agree to join {invitation.companyName} on GenHub
              </p>
            </div>
          </>
        )}
      </motion.div>
    </div>
  );
}
