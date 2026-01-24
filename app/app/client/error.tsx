'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { AlertCircle } from 'lucide-react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Client page error:', error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[100dvh] gap-6 px-4 bg-gray-50">
      <div className="flex flex-col items-center text-center max-w-md">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
          <AlertCircle className="w-8 h-8 text-red-600" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Client Portal Error
        </h1>
        <p className="text-gray-600 mb-6">
          {error.message || 'Failed to load client page. Please try again.'}
        </p>
      </div>
      <Button
        onClick={reset}
        className="min-h-[44px] min-w-[44px] px-6 active:scale-[0.98] transition-all"
      >
        Reload page
      </Button>
    </div>
  );
}
