'use client';

/**
 * UserRow Component
 *
 * Desktop table row for user display.
 *
 * Features:
 * - Renders as <tr> with <td> cells
 * - Avatar: 32px circle, fallback to initials in construction-blue circle
 * - Name + Email in first column
 * - Company name with Building2 icon
 * - Role badge using ROLE_DISPLAY mapping
 * - Status indicator: CheckCircle (green), Mail (yellow), AlertCircle (gray)
 * - Joined date with Clock icon, formatDistanceToNow
 * - Hover state: bg-gray-50/50 dark:hover:bg-gray-800/50
 */

import Image from 'next/image';
import { Building2, Clock } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
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

interface UserRowProps {
  user: User;
  className?: string;
}

export function UserRow({ user, className }: UserRowProps) {
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
    <tr
      className={cn(
        'transition-colors duration-150',
        'hover:bg-gray-50/50 dark:hover:bg-gray-800/50',
        className
      )}
    >
      {/* User (Avatar + Name + Email) */}
      <td className="px-4 py-4 whitespace-nowrap">
        <div className="flex items-center gap-3">
          {/* Avatar */}
          {user.avatar_url ? (
            <Image
              src={user.avatar_url}
              alt={user.name || user.email}
              width={32}
              height={32}
              className="rounded-full flex-shrink-0"
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-[var(--construction-blue)]/10 dark:bg-blue-500/20 flex items-center justify-center flex-shrink-0">
              <span className="text-xs font-semibold text-[var(--construction-blue)] dark:text-blue-400">
                {getInitials()}
              </span>
            </div>
          )}
          {/* Name + Email */}
          <div className="min-w-0">
            <div className="text-sm font-semibold text-gray-900 dark:text-white truncate">
              {user.name || 'Unknown User'}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400 truncate hidden md:block">
              {user.email}
            </div>
          </div>
        </div>
      </td>

      {/* Email (hidden on mobile, shown on desktop) */}
      <td className="hidden md:table-cell px-4 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
        {user.email}
      </td>

      {/* Company */}
      <td className="px-4 py-4 whitespace-nowrap">
        <div className="flex items-center gap-2 text-sm text-gray-900 dark:text-white">
          <Building2 className="w-4 h-4 text-gray-400 dark:text-gray-500 flex-shrink-0" />
          <span className="truncate">{user.company_name || 'No Company'}</span>
        </div>
      </td>

      {/* Role */}
      <td className="px-4 py-4 whitespace-nowrap">
        <Badge className={cn('text-xs font-semibold', roleDisplay.color)}>
          {roleDisplay.label}
        </Badge>
      </td>

      {/* Status */}
      <td className="px-4 py-4 whitespace-nowrap">
        <div className="flex items-center gap-2">
          <StatusIcon className={cn('w-4 h-4', statusDisplay.color)} />
          <span className={cn('text-sm font-medium', statusDisplay.color)}>
            {statusDisplay.label}
          </span>
        </div>
      </td>

      {/* Joined */}
      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-gray-400 dark:text-gray-500 flex-shrink-0" />
          <span>
            {formatDistanceToNow(new Date(user.created_at), { addSuffix: true })}
          </span>
        </div>
      </td>
    </tr>
  );
}
