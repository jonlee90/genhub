'use client';

/**
 * OfflineIndicator Component
 *
 * Shows connection status banner with contextual messages.
 * Uses haptic feedback for connect/disconnect events.
 *
 * Features:
 * - Auto-hide when online
 * - Haptic feedback on state changes
 * - Accessible with ARIA labels
 * - Configurable position (top/bottom)
 * - Smooth slide animations
 * - High contrast for outdoor visibility
 *
 * @example
 * ```tsx
 * <OfflineIndicator position="top" />
 * ```
 */

import { useEffect, useState } from 'react';
import { WifiOff, Wifi, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useOnlineStatus } from '@/lib/hooks/useOnlineStatus';
import { useHapticFeedback } from '@/lib/hooks/useHapticFeedback';

interface OfflineIndicatorProps {
  /** Position of indicator (default: 'top') */
  position?: 'top' | 'bottom';
  /** Additional className */
  className?: string;
  /** Show sync status */
  showSyncStatus?: boolean;
}

type ConnectionStatus = 'online' | 'offline' | 'syncing';

export function OfflineIndicator({
  position = 'top',
  className,
  showSyncStatus = true,
}: OfflineIndicatorProps) {
  const isOnline = useOnlineStatus();
  const { trigger } = useHapticFeedback();

  const [status, setStatus] = useState<ConnectionStatus>('online');
  const [isSyncing, setIsSyncing] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  // Track previous online state for haptic feedback
  const [prevOnline, setPrevOnline] = useState(isOnline);

  useEffect(() => {
    // Haptic feedback on state change
    if (prevOnline !== isOnline) {
      trigger(isOnline ? 'light' : 'medium');
      setPrevOnline(isOnline);
    }

    if (!isOnline) {
      setStatus('offline');
      setIsVisible(true);
    } else if (isSyncing) {
      setStatus('syncing');
      setIsVisible(true);
    } else {
      setStatus('online');
      // Hide after delay when online
      const timeout = setTimeout(() => {
        setIsVisible(false);
      }, 2000);
      return () => clearTimeout(timeout);
    }
  }, [isOnline, isSyncing, prevOnline, trigger]);

  // Listen for sync events (from service worker or offline hooks)
  useEffect(() => {
    const handleSyncStart = () => {
      setIsSyncing(true);
      setIsVisible(true);
    };

    const handleSyncEnd = () => {
      setIsSyncing(false);
      trigger('light');
    };

    window.addEventListener('genhub-sync-start', handleSyncStart);
    window.addEventListener('genhub-sync-end', handleSyncEnd);

    return () => {
      window.removeEventListener('genhub-sync-start', handleSyncStart);
      window.removeEventListener('genhub-sync-end', handleSyncEnd);
    };
  }, [trigger]);

  // Don't render anything if permanently hidden
  if (!isVisible && status === 'online') {
    return null;
  }

  const config = {
    offline: {
      icon: WifiOff,
      text: 'Offline - Working locally',
      bgColor: 'bg-[#F59E0B]',
      textColor: 'text-white',
      iconColor: 'text-white',
      ariaLabel: 'You are currently offline',
    },
    syncing: {
      icon: RefreshCw,
      text: 'Syncing...',
      bgColor: 'bg-[#001B51]',
      textColor: 'text-white',
      iconColor: 'text-white',
      ariaLabel: 'Syncing data',
    },
    online: {
      icon: Wifi,
      text: 'Back online',
      bgColor: 'bg-[#059669]',
      textColor: 'text-white',
      iconColor: 'text-white',
      ariaLabel: 'You are online',
    },
  };

  const { icon: Icon, text, bgColor, textColor, iconColor, ariaLabel } = config[status];

  return (
    <div
      role="status"
      aria-label={ariaLabel}
      aria-live="polite"
      className={cn(
        'fixed left-0 right-0 z-[100]',
        'px-4 py-3',
        'transition-all duration-300 ease-in-out',
        bgColor,
        // Position
        position === 'top' ? 'top-0' : 'bottom-0',
        // Slide animation
        position === 'top'
          ? isVisible
            ? 'translate-y-0'
            : '-translate-y-full'
          : isVisible
            ? 'translate-y-0'
            : 'translate-y-full',
        className
      )}
    >
      <div className="max-w-7xl mx-auto flex items-center justify-center gap-2">
        <Icon
          className={cn(
            'w-4 h-4 shrink-0',
            iconColor,
            status === 'syncing' && 'animate-spin'
          )}
        />
        <span className={cn('text-sm font-semibold', textColor)}>{text}</span>
      </div>

      {/* Safe area spacing for mobile */}
      {position === 'bottom' && (
        <div className="h-[env(safe-area-inset-bottom)]" />
      )}
    </div>
  );
}

/**
 * OfflineIndicatorCompact Component
 *
 * Smaller badge version for embedding in layouts
 */
export function OfflineIndicatorCompact() {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div
      role="status"
      aria-label="You are offline"
      className={cn(
        'inline-flex items-center gap-1.5',
        'px-2 py-1 rounded-lg',
        'bg-[#F59E0B] text-white',
        'text-xs font-semibold'
      )}
    >
      <WifiOff className="w-3 h-3" />
      <span>Offline</span>
    </div>
  );
}
