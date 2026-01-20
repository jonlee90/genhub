'use client';

/**
 * SignupInfo Component
 *
 * Informational component explaining that GenHub accounts are
 * created via team invitation only. No self-registration.
 *
 * Debug: Links back to login page
 */

import { m as motion } from 'framer-motion';
import Link from 'next/link';
import { UserPlus, CheckCircle, Mail, ArrowRight, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function SignupInfo() {
  console.log('[SignupInfo] Rendering signup info page');

  // Debug: Steps for getting an account
  const steps = [
    {
      icon: Mail,
      text: 'Receive an invitation email from your team',
    },
    {
      icon: ArrowRight,
      text: 'Click the invitation link in the email',
    },
    {
      icon: CheckCircle,
      text: 'Sign in with Google or email to join',
    },
  ];

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
          <UserPlus className="w-8 h-8 text-white" />
        </motion.div>
        <div>
          <h1 className="text-3xl font-black text-gray-900">Join GenHub</h1>
          <p className="text-gray-600 mt-1">Invitation Required</p>
        </div>
      </div>

      {/* Info Box */}
      <div className="bg-gradient-to-br from-construction-blue/5 to-blue-50 rounded-xl border-2 border-construction-blue/20 p-6 space-y-4">
        <p className="text-gray-700 text-center">
          GenHub accounts are created via <strong className="text-construction-blue">team invitation</strong>.
          When your team invites you, here's what to expect:
        </p>

        {/* Steps */}
        <div className="space-y-3">
          {steps.map((step, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="flex items-center gap-3 bg-white rounded-lg p-3 border border-gray-200"
            >
              <div className="shrink-0 w-8 h-8 bg-construction-blue/10 rounded-lg flex items-center justify-center">
                <step.icon className="w-4 h-4 text-construction-blue" />
              </div>
              <span className="text-sm font-medium text-gray-700">{step.text}</span>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Already Have Invitation */}
      <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4 text-center">
        <p className="text-sm font-medium text-gray-700 mb-2">
          Already have an invitation?
        </p>
        <p className="text-sm text-gray-600">
          Check your email for the invitation link, or ask your team admin to resend it.
        </p>
      </div>

      {/* Back to Login */}
      <div className="text-center pt-4 border-t border-gray-200">
        <Link href="/login">
          <Button variant="outline" className="font-bold">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Sign In
          </Button>
        </Link>
      </div>
    </div>
  );
}
