'use client';

/**
 * OwnerPageHeader Component
 *
 * Consistent header for all owner admin pages.
 *
 * Features:
 * - Industrial header style (text-3xl md:text-5xl font-black)
 * - Construction-blue top border
 * - "Platform Admin" label
 * - Optional Lucide icon in construction-blue circle
 * - Optional right-side action button
 * - Responsive: smaller text on mobile (<768px)
 */

import { Building2, Mail, Users } from 'lucide-react';
import { cn } from '@/lib/utils';

// Icon map for server-to-client serialization
const ICON_MAP = {
  building2: Building2,
  mail: Mail,
  users: Users,
} as const;

type IconName = keyof typeof ICON_MAP;

interface OwnerPageHeaderProps {
  /** Page title (e.g., "COMPANIES") */
  title: string;

  /** Subtitle description */
  subtitle: string;

  /** Optional icon name (e.g., "building2", "mail") */
  iconName?: IconName;

  /** Optional right-side action button */
  action?: React.ReactNode;

  /** Additional className */
  className?: string;
}

export function OwnerPageHeader({
  title,
  subtitle,
  iconName,
  action,
  className,
}: OwnerPageHeaderProps) {
  const Icon = iconName ? ICON_MAP[iconName] : null;
  return (
    <div
      className={cn(
        'border-t-4 border-[var(--construction-blue)] pt-6 pb-4',
        className
      )}
    >
      {/* Platform Admin Label */}
      <div className="flex items-center justify-between gap-4 mb-2">
        <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
          Platform Admin
        </p>
        {action && <div className="flex-shrink-0">{action}</div>}
      </div>

      {/* Title Row */}
      <div className="flex items-start gap-4">
        {/* Optional Icon */}
        {Icon && (
          <div className="flex-shrink-0 w-12 h-12 md:w-16 md:h-16 rounded-xl bg-[var(--construction-blue)]/10 dark:bg-blue-500/20 flex items-center justify-center">
            <Icon className="w-6 h-6 md:w-8 md:h-8 text-[var(--construction-blue)] dark:text-blue-400" />
          </div>
        )}

        {/* Title + Subtitle */}
        <div className="flex-1 min-w-0">
          <h1 className="text-3xl md:text-5xl font-black text-gray-900 dark:text-white leading-tight tracking-tight">
            {title}
          </h1>
          <p className="mt-2 text-sm md:text-base text-gray-600 dark:text-gray-400">
            {subtitle}
          </p>
        </div>
      </div>
    </div>
  );
}
