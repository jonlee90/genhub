'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

type CompleteInviteContentProps = {
  success?: boolean;
  error?: string;
  message?: string;
};

export function CompleteInviteContent({ success, error, message }: CompleteInviteContentProps) {
  const router = useRouter();

  // Auto-redirect on success
  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => {
        router.push('/app');
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [success, router]);

  // Error state
  if (error) {
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
              <h1 className="text-2xl font-black text-gray-900">Invitation Failed</h1>
              <p className="text-gray-600 mt-2">{error}</p>
            </div>
            <div className="space-y-2">
              <Button
                onClick={() => router.push('/app')}
                className="w-full bg-construction-blue hover:bg-construction-blue/90"
              >
                Go to Dashboard
              </Button>
              <Button
                variant="outline"
                onClick={() => router.push('/')}
                className="w-full"
              >
                Return to Home
              </Button>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  // Success state
  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-gray-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md w-full bg-white rounded-2xl shadow-construction-lg border-2 border-gray-200 p-8"
        >
          <div className="text-center space-y-4">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 200 }}
              className="mx-auto w-16 h-16 bg-green-100 rounded-xl flex items-center justify-center"
            >
              <CheckCircle className="w-8 h-8 text-green-600" />
            </motion.div>
            <div>
              <h1 className="text-2xl font-black text-gray-900">Welcome Aboard!</h1>
              <p className="text-gray-600 mt-2">
                {message || 'Your invitation has been accepted successfully.'}
              </p>
            </div>
            <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
              <Loader2 className="w-4 h-4 animate-spin" />
              Redirecting to dashboard...
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  // Loading state (shouldn't normally be shown)
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-construction-lg border-2 border-gray-200 p-8">
        <div className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 bg-construction-blue rounded-xl flex items-center justify-center">
            <Loader2 className="w-8 h-8 text-white animate-spin" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-gray-900">Processing...</h1>
            <p className="text-gray-600 mt-2">Completing your invitation</p>
          </div>
        </div>
      </div>
    </div>
  );
}
