'use client';

/**
 * OnlinePresence - Display user online/offline status
 *
 * Features:
 * - Green dot for online users
 * - Gray dot for offline/away users
 * - Can be used as avatar badge or standalone indicator
 * - Construction-themed colors
 */

import { cn } from '@/lib/utils';
import type { PresenceStatus } from '@/lib/hooks/usePresence';

interface OnlinePresenceProps {
  status: PresenceStatus;
  showText?: boolean;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

// Debug: Presence indicator component
export function OnlinePresence({
  status,
  showText = false,
  className,
  size = 'md',
}: OnlinePresenceProps) {
  console.log('[OnlinePresence] Rendering status:', status);

  // Debug: Size mapping for dot
  const sizeClasses = {
    sm: 'w-2 h-2',
    md: 'w-2.5 h-2.5',
    lg: 'w-3 h-3',
  };

  // Debug: Color mapping for status
  const colorClasses = {
    online: 'bg-green-500 ring-green-200',
    away: 'bg-gray-400 ring-gray-200',
  };

  const textColor = {
    online: 'text-green-600',
    away: 'text-gray-500',
  };

  return (
    <div className={cn('flex items-center gap-1.5', className)}>
      {/* Debug: Status dot with ring effect */}
      <div
        className={cn(
          'rounded-full ring-2',
          sizeClasses[size],
          colorClasses[status]
        )}
        aria-label={`User is ${status}`}
      />

      {/* Debug: Optional text label */}
      {showText && (
        <span className={cn('text-xs font-mono uppercase tracking-tight', textColor[status])}>
          {status}
        </span>
      )}
    </div>
  );
}

interface PresenceBadgeProps {
  status: PresenceStatus;
  className?: string;
}

// Debug: Presence badge for avatars (positioned absolutely)
export function PresenceBadge({ status, className }: PresenceBadgeProps) {
  console.log('[PresenceBadge] Rendering badge for status:', status);

  return (
    <div
      className={cn(
        'absolute -bottom-0.5 -right-0.5',
        'w-3 h-3 rounded-full ring-2 ring-white',
        status === 'online' ? 'bg-green-500' : 'bg-gray-400',
        className
      )}
      aria-label={`User is ${status}`}
    />
  );
}
