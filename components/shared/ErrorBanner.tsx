/**
 * ErrorBanner - Reusable error display component
 * Eliminates duplicate error styling across components
 *
 * Used by: TaskDetail, TaskModal, MaterialTab, ExpensesTab, etc.
 */
'use client';

import { AlertTriangle, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ErrorBannerProps {
  error: string | null;
  onDismiss?: () => void;
  className?: string;
}

export function ErrorBanner({ error, onDismiss, className }: ErrorBannerProps) {
  if (!error) return null;

  return (
    <div
      className={`bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3 ${className || ''}`}
      role="alert"
    >
      <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
      <div className="flex-1">
        <p className="text-sm text-red-700">{error}</p>
      </div>
      {onDismiss && (
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 text-red-600 hover:bg-red-100"
          onClick={onDismiss}
        >
          <X className="w-4 h-4" />
        </Button>
      )}
    </div>
  );
}

interface SuccessBannerProps {
  message: string | null;
  onDismiss?: () => void;
  className?: string;
}

export function SuccessBanner({ message, onDismiss, className }: SuccessBannerProps) {
  if (!message) return null;

  return (
    <div
      className={`bg-green-50 border border-green-200 rounded-lg p-4 flex items-start gap-3 ${className || ''}`}
      role="status"
    >
      <AlertTriangle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
      <div className="flex-1">
        <p className="text-sm text-green-700">{message}</p>
      </div>
      {onDismiss && (
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 text-green-600 hover:bg-green-100"
          onClick={onDismiss}
        >
          <X className="w-4 h-4" />
        </Button>
      )}
    </div>
  );
}
