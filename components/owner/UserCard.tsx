'use client';

/**
 * UserCard Component
 *
 * Mobile-optimized user display card.
 *
 * Features:
 * - CardSurface wrapper
 * - Avatar + name + email in header section
 * - Company name with Building2 icon
 * - Role badge (inline, not block)
 * - Status indicator: Active/Invited/Inactive with dot icon
 * - Joined date on same line as status
 * - All touch targets ≥44px
 * - Active state on press if onClick provided
 * - Shares ROLE_DISPLAY mapping with UserRow
 */

import Image from 'next/image';
import { Building2, Clock } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { CardSurface } from '@/components/ui/CardSurface';
import { ROLE_DISPLAY, STATUS_DISPLAY } from '@/lib/constants/roles';

interface User {
  id: string;
  name: string | null;
  email: string;
  avatar_url: string | null;
  role: string;
  status: 'active' | 'invited' | 'inactive';
  company_name: string | null;
  created_at: string;
}

interface UserCardProps {
  user: User;
  onClick?: () => void;
  className?: string;
}

export function UserCard({ user, onClick, className }: UserCardProps) {
  const hasOnClick = Boolean(onClick);
  const roleDisplay = ROLE_DISPLAY[user.role] || {
    label: user.role,
    color: 'bg-gray-500 text-white',
  };
  const statusDisplay = STATUS_DISPLAY[user.status] || STATUS_DISPLAY.inactive;
  const StatusIcon = statusDisplay.icon;

  // Generate initials from name or email
  const getInitials = () => {
    if (user.name) {
      const names = user.name.split(' ');
      return names.length > 1
        ? `${names[0][0]}${names[1][0]}`.toUpperCase()
        : names[0].slice(0, 2).toUpperCase();
    }
    return user.email.slice(0, 2).toUpperCase();
  };

  return (
    <CardSurface
      interactive={hasOnClick}
      onClick={onClick}
      className={cn('p-4', className)}
      as={hasOnClick ? 'button' : 'div'}
    >
      {/* Header: Avatar + Name + Email */}
      <div className="flex items-start gap-3 mb-3">
        {/* Avatar */}
        {user.avatar_url ? (
          <Image
            src={user.avatar_url}
            alt={user.name || user.email}
            width={40}
            height={40}
            className="rounded-full flex-shrink-0"
          />
        ) : (
          <div className="w-10 h-10 rounded-full bg-[var(--construction-blue)]/10 dark:bg-blue-500/20 flex items-center justify-center flex-shrink-0">
            <span className="text-sm font-semibold text-[var(--construction-blue)] dark:text-blue-400">
              {getInitials()}
            </span>
          </div>
        )}

        {/* Name + Email */}
        <div className="flex-1 min-w-0 text-left">
          <div className="text-base font-bold text-gray-900 dark:text-white truncate">
            {user.name || 'Unknown User'}
          </div>
          <div className="text-sm text-gray-500 dark:text-gray-400 truncate">
            {user.email}
          </div>
        </div>
      </div>

      {/* Company + Role */}
      <div className="flex items-center justify-between gap-3 mb-3 pb-3 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300 min-w-0">
          <Building2 className="w-4 h-4 text-gray-400 dark:text-gray-500 flex-shrink-0" />
          <span className="truncate">{user.company_name || 'No Company'}</span>
        </div>
        <Badge className={cn('text-xs font-semibold flex-shrink-0', roleDisplay.color)}>
          {roleDisplay.label}
        </Badge>
      </div>

      {/* Status + Joined */}
      <div className="flex items-center justify-between gap-3 text-xs">
        {/* Status */}
        <div className="flex items-center gap-1.5">
          <StatusIcon className={cn('w-4 h-4', statusDisplay.color)} />
          <span className={cn('font-medium', statusDisplay.color)}>
            {statusDisplay.label}
          </span>
        </div>

        {/* Joined Date */}
        <div className="flex items-center gap-1.5 text-gray-500 dark:text-gray-400">
          <Clock className="w-3.5 h-3.5 flex-shrink-0" />
          <span>
            {formatDistanceToNow(new Date(user.created_at), { addSuffix: true })}
          </span>
        </div>
      </div>
    </CardSurface>
  );
}

export function UserCardSkeleton() {
  return (
    <CardSurface className="p-4 animate-pulse">
      <div className="flex items-start gap-3 mb-3">
        <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-full flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <div className="h-4 w-32 bg-gray-200 dark:bg-gray-700 rounded mb-2" />
          <div className="h-3 w-48 bg-gray-200 dark:bg-gray-700 rounded" />
        </div>
      </div>
      <div className="flex items-center justify-between gap-3 mb-3 pb-3 border-b border-gray-200 dark:border-gray-700">
        <div className="h-3 w-40 bg-gray-200 dark:bg-gray-700 rounded" />
        <div className="h-5 w-16 bg-gray-200 dark:bg-gray-700 rounded" />
      </div>
      <div className="flex items-center justify-between gap-3">
        <div className="h-3 w-16 bg-gray-200 dark:bg-gray-700 rounded" />
        <div className="h-3 w-24 bg-gray-200 dark:bg-gray-700 rounded" />
      </div>
    </CardSurface>
  );
}
