'use client';

/**
 * CompanyCard Component
 *
 * Mobile-optimized company display card.
 *
 * Features:
 * - CardSurface wrapper with interactive prop
 * - Building2 icon in construction-blue/10 circle (44px)
 * - Company name as bold title (truncate if >30 chars)
 * - Contact info: Email, Phone, Address with Lucide icons
 * - Stats row: User count + Project count with badges
 * - "Joined X ago" timestamp using date-fns
 * - All touch targets ≥44px
 * - Active state: scale-[0.99] on press
 */

import { Building2, Mail, Phone, MapPin, Users, FolderKanban } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';
import { CardSurface } from '@/components/ui/CardSurface';

interface Company {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  created_at: string;
  user_count: number;
  project_count: number;
}

interface CompanyCardProps {
  company: Company;
  onClick?: () => void;
  className?: string;
}

export function CompanyCard({ company, onClick, className }: CompanyCardProps) {
  const hasOnClick = Boolean(onClick);

  return (
    <CardSurface
      interactive={hasOnClick}
      onClick={onClick}
      className={cn('p-5', className)}
      as={hasOnClick ? 'button' : 'div'}
    >
      {/* Header: Icon + Name + Timestamp */}
      <div className="flex items-start gap-3 mb-4">
        <div className="flex-shrink-0 w-11 h-11 rounded-lg bg-[var(--construction-blue)]/10 dark:bg-blue-500/20 flex items-center justify-center">
          <Building2 className="w-6 h-6 text-[var(--construction-blue)] dark:text-blue-400" />
        </div>
        <div className="flex-1 min-w-0">
          <h3
            className={cn(
              'text-base font-bold text-gray-900 dark:text-white',
              company.name.length > 30 ? 'truncate' : ''
            )}
            title={company.name}
          >
            {company.name}
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Joined {formatDistanceToNow(new Date(company.created_at), { addSuffix: true })}
          </p>
        </div>
      </div>

      {/* Contact Info */}
      <div className="space-y-2 mb-4">
        {company.email && (
          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
            <Mail className="w-4 h-4 flex-shrink-0 text-gray-400 dark:text-gray-500" />
            <span className="truncate">{company.email}</span>
          </div>
        )}
        {company.phone && (
          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
            <Phone className="w-4 h-4 flex-shrink-0 text-gray-400 dark:text-gray-500" />
            <span>{company.phone}</span>
          </div>
        )}
        {company.address && (
          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
            <MapPin className="w-4 h-4 flex-shrink-0 text-gray-400 dark:text-gray-500" />
            <span className="truncate">{company.address}</span>
          </div>
        )}
      </div>

      {/* Stats Row */}
      <div className="flex items-center gap-4 pt-3 border-t border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-1.5">
          <Users className="w-4 h-4 text-[var(--construction-blue)] dark:text-blue-400" />
          <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
            {company.user_count} {company.user_count === 1 ? 'user' : 'users'}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <FolderKanban className="w-4 h-4 text-[var(--construction-blue)] dark:text-blue-400" />
          <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
            {company.project_count} {company.project_count === 1 ? 'project' : 'projects'}
          </span>
        </div>
      </div>
    </CardSurface>
  );
}

/**
 * Wrapper for use with OwnerDataTable CardComponent prop
 * Adapts the { item } prop signature to CompanyCard's { company } prop
 */
export function CompanyCardAdapter({ item }: { item: Company }) {
  return <CompanyCard company={item} />;
}

export function CompanyCardSkeleton() {
  return (
    <CardSurface className="p-5 animate-pulse">
      <div className="flex items-start gap-3 mb-4">
        <div className="h-11 w-11 bg-gray-200 dark:bg-gray-700 rounded-lg flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <div className="h-4 w-32 bg-gray-200 dark:bg-gray-700 rounded mb-2" />
          <div className="h-3 w-24 bg-gray-200 dark:bg-gray-700 rounded" />
        </div>
      </div>
      <div className="space-y-2 mb-4">
        <div className="h-3 w-full bg-gray-200 dark:bg-gray-700 rounded" />
        <div className="h-3 w-3/4 bg-gray-200 dark:bg-gray-700 rounded" />
        <div className="h-3 w-5/6 bg-gray-200 dark:bg-gray-700 rounded" />
      </div>
      <div className="flex gap-4 pt-3 border-t border-gray-200 dark:border-gray-700">
        <div className="h-4 w-20 bg-gray-200 dark:bg-gray-700 rounded" />
        <div className="h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded" />
      </div>
    </CardSurface>
  );
}
