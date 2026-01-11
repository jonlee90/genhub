'use client';

/**
 * OfflineIndicator Component
 *
 * Simple banner for offline/online status using useOnlineStatus hook.
 * Designed for mobile with safe-area-inset-top support.
 *
 * Features:
 * - Fixed to top of screen
 * - Red background when offline: "Offline - changes will sync later"
 * - Green background when back online: "Back online"
 * - Respects safe-area-inset-top for notch
 * - Auto-hides green banner after 3 seconds
 * - Uses WifiOff, Wifi icons from lucide-react
 * - No layout shift when showing/hiding
 */

import { WifiOff, Wifi } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useOnlineStatus } from '@/lib/hooks/useOnlineStatus';

interface OfflineIndicatorProps {
  className?: string;
}

export function OfflineIndicator({ className }: OfflineIndicatorProps) {
  const { isOnline, wasOffline } = useOnlineStatus();

  // Show banner when offline OR when just came back online
  const showBanner = !isOnline || wasOffline;

  if (!showBanner) {
    return null;
  }

  const isOffline = !isOnline;

  return (
    <div
      className={cn(
        // Positioning
        'fixed top-0 left-0 right-0 z-50',
        // Safe area for notch
        'pt-[env(safe-area-inset-top)]',
        // Background colors
        isOffline ? 'bg-[#DC2626]' : 'bg-[#059669]',
        // Text
        'text-white',
        // Mobile only
        'md:hidden',
        // Animation
        'animate-in slide-in-from-top-full duration-300',
        className
      )}
    >
      <div className="flex items-center justify-center gap-2 px-4 py-2.5">
        {/* Icon */}
        {isOffline ? (
          <WifiOff className="w-4 h-4 flex-shrink-0" />
        ) : (
          <Wifi className="w-4 h-4 flex-shrink-0" />
        )}

        {/* Message */}
        <span className="text-sm font-medium">
          {isOffline
            ? 'Offline - changes will sync later'
            : 'Back online'
          }
        </span>
      </div>
    </div>
  );
}
