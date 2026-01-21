'use client';

/**
 * SyncStatus Component
 *
 * Displays pending sync operations with progress tracking.
 * Shows badge count, progress bar, and retry functionality.
 *
 * Features:
 * - Pending items count badge
 * - Progress bar during sync
 * - Retry button on errors
 * - Accessible with ARIA labels
 * - Auto-refresh on completion
 * - Mobile-friendly touch targets
 *
 * @example
 * ```tsx
 * <SyncStatus />
 * ```
 */

import { useState, useEffect } from 'react';
import { RefreshCw, AlertCircle, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useOfflineSync } from '@/hooks/use-offline-data';
import { useHapticFeedback } from '@/lib/hooks/useHapticFeedback';

interface SyncStatusProps {
  /** Additional className */
  className?: string;
  /** Show detailed view (default: false) */
  detailed?: boolean;
}

export function SyncStatus({ className, detailed = false }: SyncStatusProps) {
  const { queue, totalPending, syncAll, isOnline } = useOfflineSync();
  const { trigger } = useHapticFeedback();

  const [isSyncing, setIsSyncing] = useState(false);
  const [syncProgress, setSyncProgress] = useState(0);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [syncSuccess, setSyncSuccess] = useState(false);

  // Listen for sync events
  useEffect(() => {
    const handleSyncStart = () => {
      setIsSyncing(true);
      setSyncProgress(0);
      setSyncError(null);
      setSyncSuccess(false);
    };

    const handleSyncProgress = (event: Event) => {
      const customEvent = event as CustomEvent<{ progress: number }>;
      setSyncProgress(customEvent.detail.progress);
    };

    const handleSyncEnd = () => {
      setIsSyncing(false);
      setSyncProgress(100);
      setSyncSuccess(true);
      trigger('light');

      // Hide success message after 3s
      setTimeout(() => {
        setSyncSuccess(false);
        setSyncProgress(0);
      }, 3000);
    };

    const handleSyncError = (event: Event) => {
      const customEvent = event as CustomEvent<{ error: string }>;
      setIsSyncing(false);
      setSyncError(customEvent.detail.error);
      trigger('medium');
    };

    window.addEventListener('genhub-sync-start', handleSyncStart);
    window.addEventListener('genhub-sync-progress', handleSyncProgress);
    window.addEventListener('genhub-sync-end', handleSyncEnd);
    window.addEventListener('genhub-sync-error', handleSyncError);

    return () => {
      window.removeEventListener('genhub-sync-start', handleSyncStart);
      window.removeEventListener('genhub-sync-progress', handleSyncProgress);
      window.removeEventListener('genhub-sync-end', handleSyncEnd);
      window.removeEventListener('genhub-sync-error', handleSyncError);
    };
  }, [trigger]);

  const handleSync = async () => {
    if (!isOnline) {
      setSyncError('Cannot sync while offline');
      return;
    }

    setSyncError(null);
    trigger('light');

    // Emit sync start event
    window.dispatchEvent(new CustomEvent('genhub-sync-start'));

    try {
      await syncAll();
      window.dispatchEvent(new CustomEvent('genhub-sync-end'));
    } catch (error) {
      window.dispatchEvent(
        new CustomEvent('genhub-sync-error', {
          detail: { error: error instanceof Error ? error.message : 'Sync failed' },
        })
      );
    }
  };

  // Don't show if no pending items and not syncing
  if (totalPending === 0 && !isSyncing && !syncSuccess && !syncError) {
    return null;
  }

  // Compact badge view
  if (!detailed) {
    return (
      <button
        onClick={handleSync}
        disabled={isSyncing || !isOnline}
        className={cn(
          'relative inline-flex items-center gap-2',
          'px-3 py-2 rounded-lg',
          'bg-construction-blue dark:bg-construction-blue text-white dark:text-white',
          'text-sm font-semibold',
          'transition-all duration-200',
          'active:scale-95',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          'min-h-[44px]',
          className
        )}
        aria-label={`${totalPending} items pending sync`}
      >
        <RefreshCw
          className={cn('w-4 h-4', isSyncing && 'animate-spin')}
        />
        <span>Sync</span>

        {/* Badge count */}
        {totalPending > 0 && (
          <span
            className={cn(
              'absolute -top-1 -right-1',
              'flex items-center justify-center',
              'min-w-[20px] h-5 px-1',
              'bg-[#DC2626] dark:bg-red-600 text-white dark:text-white',
              'text-xs font-bold rounded-full',
              'border-2 border-white dark:border-gray-900'
            )}
          >
            {totalPending > 99 ? '99+' : totalPending}
          </span>
        )}
      </button>
    );
  }

  // Detailed view
  return (
    <div
      className={cn(
        'bg-white dark:bg-gray-900 rounded-xl border-2 border-gray-200 dark:border-gray-700 shadow-sm p-4',
        className
      )}
      role="status"
      aria-live="polite"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <RefreshCw
            className={cn(
              'w-5 h-5 text-construction-blue dark:text-construction-blue',
              isSyncing && 'animate-spin'
            )}
          />
          <h3 className="font-semibold text-gray-900 dark:text-gray-100">Sync Status</h3>
        </div>

        {totalPending > 0 && (
          <span className="px-2 py-1 bg-construction-blue dark:bg-construction-blue text-white dark:text-white text-xs font-bold rounded-lg">
            {totalPending} pending
          </span>
        )}
      </div>

      {/* Progress bar */}
      {isSyncing && (
        <div className="mb-3">
          <div className="h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-construction-blue dark:bg-construction-blue rounded-full transition-all duration-300"
              style={{ width: `${syncProgress}%` }}
            />
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Syncing {Math.round(syncProgress)}%
          </p>
        </div>
      )}

      {/* Success message */}
      {syncSuccess && (
        <div className="flex items-center gap-2 p-3 bg-[#059669] dark:bg-green-700 text-white dark:text-white rounded-lg mb-3">
          <CheckCircle className="w-5 h-5" />
          <p className="text-sm font-semibold">Sync completed</p>
        </div>
      )}

      {/* Error message */}
      {syncError && (
        <div className="flex items-start gap-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg mb-3">
          <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-semibold text-red-900 dark:text-red-300">Sync failed</p>
            <p className="text-xs text-red-700 dark:text-red-400 mt-0.5">{syncError}</p>
          </div>
        </div>
      )}

      {/* Queue details */}
      {totalPending > 0 && (
        <div className="space-y-2 mb-3">
          <p className="text-sm text-gray-600 dark:text-gray-300">Pending changes:</p>
          <div className="space-y-1">
            {Object.entries(
              queue.reduce(
                (acc, item) => {
                  acc[item.entityType] = (acc[item.entityType] || 0) + 1;
                  return acc;
                },
                {} as Record<string, number>
              )
            ).map(([entityType, count]) => (
              <div
                key={entityType}
                className="flex items-center justify-between text-xs"
              >
                <span className="text-gray-600 dark:text-gray-400 capitalize">{entityType}</span>
                <span className="font-semibold text-gray-900 dark:text-gray-100">{count}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Sync button */}
      {totalPending > 0 && (
        <button
          onClick={handleSync}
          disabled={isSyncing || !isOnline}
          className={cn(
            'w-full h-12 px-4',
            'bg-construction-blue dark:bg-construction-blue text-white dark:text-white',
            'font-semibold text-sm rounded-xl',
            'flex items-center justify-center gap-2',
            'transition-all duration-200',
            'active:scale-[0.98]',
            'disabled:opacity-50 disabled:cursor-not-allowed'
          )}
        >
          <RefreshCw
            className={cn('w-4 h-4', isSyncing && 'animate-spin')}
          />
          {isSyncing ? 'Syncing...' : isOnline ? 'Sync Now' : 'Offline'}
        </button>
      )}

      {/* Offline notice */}
      {!isOnline && totalPending > 0 && (
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 text-center">
          Changes will sync when you're back online
        </p>
      )}
    </div>
  );
}
