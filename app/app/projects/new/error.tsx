'use client';

import { useEffect } from 'react';
import { AlertTriangle, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function NewProjectError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('New project page error:', error);
    // TODO: Send to error tracking service (Sentry, LogRocket, etc.)
  }, [error]);

  return (
    <div className="flex-1 flex flex-col items-center justify-center min-h-[400px] p-8">
      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-destructive/10 mb-6">
        <AlertTriangle className="h-10 w-10 text-destructive" />
      </div>
      <h2 className="text-2xl font-bold mb-2">Unable to Load Project Form</h2>
      <p className="text-muted-foreground mb-6 text-center max-w-md">
        We encountered an error while setting up the project creation form. Please try again.
      </p>
      <div className="flex gap-3">
        <Button onClick={reset}>Try again</Button>
        <Button variant="outline" asChild>
          <Link href="/app/projects">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Projects
          </Link>
        </Button>
      </div>
      {process.env.NODE_ENV === 'development' && (
        <details className="mt-8 p-4 bg-muted rounded-lg max-w-2xl">
          <summary className="cursor-pointer font-mono text-sm text-muted-foreground mb-2">
            Error details (development only)
          </summary>
          <pre className="text-xs overflow-auto">
            {error.message}
            {'\n\n'}
            {error.stack}
          </pre>
        </details>
      )}
    </div>
  );
}
