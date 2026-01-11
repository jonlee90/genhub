'use client';

/**
 * useOnlineStatus Hook
 *
 * Detects online/offline status and tracks reconnection state.
 * SSR-safe with no window access during server render.
 *
 * Features:
 * - Returns: { isOnline, wasOffline, pendingCount }
 * - Tracks wasOffline for "back online" message
 * - Auto-clears wasOffline after 3 seconds
 * - Listens to online/offline browser events
 * - No memory leaks (cleanup on unmount)
 */

import { useState, useEffect, useCallback } from 'react';

interface OnlineStatus {
  /** Current online status */
  isOnline: boolean;
  /** True when just came back online (for "Back online" message) */
  wasOffline: boolean;
  /** Number of pending sync operations (placeholder for future use) */
  pendingCount: number;
}

interface UseOnlineStatusOptions {
  /** Duration to show "back online" message (ms). Default: 3000 */
  reconnectMessageDuration?: number;
}

export function useOnlineStatus(options: UseOnlineStatusOptions = {}): OnlineStatus {
  const { reconnectMessageDuration = 3000 } = options;

  // SSR-safe: Default to true, will update on client
  const [isOnline, setIsOnline] = useState(true);
  const [wasOffline, setWasOffline] = useState(false);
  const [pendingCount] = useState(0); // Placeholder for future offline queue

  const handleOffline = useCallback(() => {
    console.log('[useOnlineStatus] Network connection lost');
    setIsOnline(false);
  }, []);

  const handleOnline = useCallback(() => {
    console.log('[useOnlineStatus] Network connection restored');
    setIsOnline(true);
    setWasOffline(true);

    // Auto-clear wasOffline after duration
    const timer = setTimeout(() => {
      setWasOffline(false);
    }, reconnectMessageDuration);

    // Return cleanup for the timer
    return () => clearTimeout(timer);
  }, [reconnectMessageDuration]);

  useEffect(() => {
    // SSR guard
    if (typeof window === 'undefined') {
      return;
    }

    // Set initial status based on navigator.onLine
    const initialOnline = navigator.onLine;
    setIsOnline(initialOnline);

    if (!initialOnline) {
      console.log('[useOnlineStatus] Initial status: offline');
    }

    // Add event listeners
    window.addEventListener('offline', handleOffline);
    window.addEventListener('online', handleOnline);

    // Cleanup
    return () => {
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('online', handleOnline);
    };
  }, [handleOffline, handleOnline]);

  return {
    isOnline,
    wasOffline,
    pendingCount
  };
}
