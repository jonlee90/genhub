'use client';

/**
 * InvitationCard Component
 *
 * Invitation display with swipe actions for mobile.
 *
 * Features:
 * - SwipeableCard wrapper for mobile swipe actions
 * - Swipe right action: Copy link (green bg, Copy icon)
 * - Swipe left action: Revoke (red bg, Trash2 icon)
 * - Email as primary text (bold, truncate if long)
 * - Optional name as secondary text
 * - Sent date with Clock icon
 * - Expires date with Calendar icon
 * - Expired badge: "EXPIRED" in red if isAfter(now, expires_at)
 * - Desktop: Show Copy/Revoke buttons (no swipe needed)
 * - Mobile: Buttons hidden, revealed via swipe
 * - Haptic feedback on swipe threshold cross
 */

import { Copy, Trash2, Clock, Calendar } from 'lucide-react';
import { isAfter } from 'date-fns';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { CardSurface } from '@/components/ui/CardSurface';
import { SwipeableCard } from '@/components/mobile/SwipeableCard';

interface AdminInvitation {
  id: string;
  email: string;
  name: string | null;
  invitation_token: string;
  invited_at: string;
  expires_at: string;
}

interface InvitationCardProps {
  invitation: AdminInvitation;
  onCopyLink: (inviteLink: string) => void;
  onRevoke: (id: string, email: string) => void;
  isRevoking?: boolean;
  className?: string;
}

export function InvitationCard({
  invitation,
  onCopyLink,
  onRevoke,
  isRevoking = false,
  className,
}: InvitationCardProps) {
  const isExpired = isAfter(new Date(), new Date(invitation.expires_at));
  const inviteLink = `${window.location.origin}/accept-invitation?token=${invitation.invitation_token}`;

  const handleCopy = () => {
    onCopyLink(inviteLink);
  };

  const handleRevoke = () => {
    onRevoke(invitation.id, invitation.email);
  };

  const cardContent = (
    <CardSurface className={cn('p-4', className)}>
      {/* Email + Name */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <div className="text-base font-bold text-gray-900 dark:text-white truncate">
              {invitation.email}
            </div>
            {isExpired && (
              <Badge className="bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 text-xs font-semibold">
                EXPIRED
              </Badge>
            )}
          </div>
          {invitation.name && (
            <div className="text-sm text-gray-600 dark:text-gray-400">
              {invitation.name}
            </div>
          )}
        </div>
      </div>

      {/* Sent + Expires */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-gray-500 dark:text-gray-400 mb-4">
        <div className="flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5 flex-shrink-0" />
          <span>
            Sent {formatDistanceToNow(new Date(invitation.invited_at), { addSuffix: true })}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <Calendar className="w-3.5 h-3.5 flex-shrink-0" />
          <span>
            Expires {formatDistanceToNow(new Date(invitation.expires_at), { addSuffix: true })}
          </span>
        </div>
      </div>

      {/* Desktop Buttons (visible on md+) */}
      <div className="hidden md:flex items-center gap-2">
        <button
          type="button"
          onClick={handleCopy}
          disabled={isRevoking}
          className={cn(
            'flex-1 min-h-[44px] px-4 py-2 rounded-lg',
            'bg-[#059669] hover:bg-[#047857] active:bg-[#065f46]',
            'text-white font-semibold text-sm',
            'transition-colors duration-150',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            'flex items-center justify-center gap-2'
          )}
        >
          <Copy className="w-4 h-4" />
          Copy Link
        </button>
        <button
          type="button"
          onClick={handleRevoke}
          disabled={isRevoking}
          className={cn(
            'flex-1 min-h-[44px] px-4 py-2 rounded-lg',
            'bg-[#DC2626] hover:bg-[#B91C1C] active:bg-[#991B1B]',
            'text-white font-semibold text-sm',
            'transition-colors duration-150',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            'flex items-center justify-center gap-2'
          )}
        >
          <Trash2 className="w-4 h-4" />
          {isRevoking ? 'Revoking...' : 'Revoke'}
        </button>
      </div>
    </CardSurface>
  );

  return (
    <>
      {/* Mobile: Wrap in SwipeableCard */}
      <div className="md:hidden">
        <SwipeableCard
          onSwipeRight={handleCopy}
          onSwipeLeft={handleRevoke}
          leftActionIcon={<Copy className="w-6 h-6" />}
          rightActionIcon={<Trash2 className="w-6 h-6" />}
          leftActionColor="bg-[#059669]"
          rightActionColor="bg-[#DC2626]"
          disabled={isRevoking}
          className={className}
        >
          {cardContent}
        </SwipeableCard>
      </div>

      {/* Desktop: Show card with buttons */}
      <div className="hidden md:block">{cardContent}</div>
    </>
  );
}

export function InvitationCardSkeleton() {
  return (
    <CardSurface className="p-4 animate-pulse">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex-1 min-w-0">
          <div className="h-4 w-48 bg-gray-200 dark:bg-gray-700 rounded mb-2" />
          <div className="h-3 w-32 bg-gray-200 dark:bg-gray-700 rounded" />
        </div>
      </div>
      <div className="flex gap-4 mb-4">
        <div className="h-3 w-28 bg-gray-200 dark:bg-gray-700 rounded" />
        <div className="h-3 w-32 bg-gray-200 dark:bg-gray-700 rounded" />
      </div>
      <div className="hidden md:flex gap-2">
        <div className="flex-1 h-11 bg-gray-200 dark:bg-gray-700 rounded-lg" />
        <div className="flex-1 h-11 bg-gray-200 dark:bg-gray-700 rounded-lg" />
      </div>
    </CardSurface>
  );
}
