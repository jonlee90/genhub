'use client';

import { useEffect } from 'react';
import AlertTriangle from 'lucide-react/icons/alert-triangle';
import { Button } from '@/components/ui/button';

export default function TeamError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Team page error:', error);
  }, [error]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="text-center max-w-md px-4">
        <div className="flex justify-center mb-4">
          <div className="bg-red-100 p-4 rounded-full">
            <AlertTriangle className="h-12 w-12 text-red-600" />
          </div>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Error Loading Team
        </h1>
        <p className="text-gray-600 mb-6">
          {error.message || 'An unexpected error occurred while loading your team members.'}
        </p>
        <Button
          onClick={reset}
          className="bg-construction-blue hover:bg-construction-blue/90 text-white"
        >
          Try Again
        </Button>
      </div>
    </div>
  );
}
