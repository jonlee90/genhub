'use client';

/**
 * MobileProjectCard - Mobile version of ProjectCard with same visual design
 *
 * Matches ProjectCard design:
 * - Construction-blue header with project type icon
 * - Hero image/placeholder section
 * - Client & Budget row
 * - 2x2 stats grid (status, progress, schedule, team)
 * - Footer with address and date
 */

import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { Users, Calendar, MapPin } from 'lucide-react';
import type { Database } from '@/types/database.types';
import { cn, formatBudget, formatPercentWhole } from '@/lib/utils';
import { getProjectTheme, PROJECT_STATUS_CONFIG } from '@/lib/project-card-themes';

type Project = Database['public']['Tables']['projects']['Row'] & {
  project_phases?: Array<{
    id: string;
    status: string;
    completion_percentage: number | null;
  }>;
  stats?: {
    schedule: { daysRemaining: number | null };
    teamSize: number;
  };
};

interface MobileProjectCardProps {
  project: Project;
  onClick?: () => void;
  className?: string;
}

export function MobileProjectCard({ project, onClick, className }: MobileProjectCardProps) {
  // Get theme configuration based on project type
  const theme = getProjectTheme(project.project_type);
  const TypeIcon = theme.icon;
  const statusConfig = PROJECT_STATUS_CONFIG[project.status as keyof typeof PROJECT_STATUS_CONFIG];

  // Calculate completion percentage
  const completionPercentage = project.completion_percentage || 0;

  // Get stats if available
  const hasStats = 'stats' in project && project.stats;
  const stats = hasStats ? project.stats : null;

  // Calculate days remaining if no stats
  const daysRemaining = (() => {
    if (stats?.schedule?.daysRemaining !== undefined) {
      return stats.schedule.daysRemaining;
    }
    if (!project.end_date) return null;
    const endDate = new Date(project.end_date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const diffTime = endDate.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  })();

  // Get image URL or use placeholder
  const imageUrl = project.image_url;

  const cardContent = (
    <motion.article
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileTap={{ scale: 0.98 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className={cn(
        'group relative h-full rounded-xl overflow-hidden',
        'bg-white border border-gray-200',
        'shadow-sm active:shadow-md',
        'transition-shadow duration-300',
        className
      )}
    >
      {/* Header Section - Construction Blue */}
      <header
        className={cn('relative px-3 py-2.5', theme.headerBg, theme.headerText)}
      >
        <div className="flex items-start justify-between gap-2">
          {/* Project Type Label & Name */}
          <div className="flex-1 min-w-0">
            <p
              className={cn(
                'text-[9px] font-bold uppercase tracking-[0.15em] mb-0.5',
                theme.accentColor
              )}
            >
              {theme.labelFull}
            </p>
            <h3 className="text-base font-bold leading-tight line-clamp-1 tracking-tight">
              {project.name}
            </h3>
          </div>

          {/* Color-Coded Type Icon */}
          <div
            className={cn(
              'shrink-0 p-2 rounded-lg bg-white/95 backdrop-blur-sm',
              'border border-white/20 shadow-sm'
            )}
          >
            <TypeIcon className={cn('h-4 w-4', theme.iconColor)} strokeWidth={2.5} />
          </div>
        </div>

        {/* Decorative bottom edge */}
        <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-black/10" />
      </header>

      {/* Hero Image / Placeholder Section */}
      <div className="relative h-28 overflow-hidden">
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={`${project.name} site view`}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 50vw"
          />
        ) : (
          <div className={cn('absolute inset-0 bg-gradient-to-br', theme.placeholderGradient)}>
            {/* Blueprint grid pattern overlay */}
            <div
              className="absolute inset-0 opacity-30"
              style={{
                backgroundImage: `
                  linear-gradient(rgba(0,27,81,0.1) 1px, transparent 1px),
                  linear-gradient(90deg, rgba(0,27,81,0.1) 1px, transparent 1px)
                `,
                backgroundSize: '16px 16px',
              }}
            />

            {/* Centered icon */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className={cn('p-3 rounded-xl', theme.iconBg)}>
                <TypeIcon className={cn('h-8 w-8', theme.iconColor, 'opacity-40')} strokeWidth={1.5} />
              </div>
            </div>

            {/* Address hint if available */}
            {project.address && (
              <div className="absolute bottom-1.5 left-2 right-2">
                <p className="text-[9px] text-gray-600 truncate font-medium">
                  {project.address}
                  {project.city && `, ${project.city}`}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Subtle gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/5 via-transparent to-transparent" />
      </div>

      {/* Content Section */}
      <div className="p-3 space-y-2.5">
        {/* Client & Budget Row */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <p className="text-[9px] text-gray-400 uppercase tracking-wider font-semibold mb-0.5">
              Client
            </p>
            <p className="text-sm font-semibold text-gray-900 truncate">{project.client_name}</p>
          </div>
          <div className="text-right shrink-0">
            <p className="text-[9px] text-gray-400 uppercase tracking-wider font-semibold mb-0.5">
              Budget
            </p>
            <p className="text-sm font-bold text-construction-blue">
              {formatBudget(project.budget)}
            </p>
          </div>
        </div>

        {/* Divider */}
        <div className="h-px bg-gray-100" />

        {/* Stats Grid - 2x2 */}
        <div className="grid grid-cols-2 gap-x-3 gap-y-1.5">
          {/* Status */}
          <div>
            <p className="text-[9px] text-gray-400 uppercase tracking-wider font-medium">Status</p>
            <div className="flex items-center gap-1 mt-0.5">
              <span
                className={cn(
                  'inline-block w-1.5 h-1.5 rounded-full',
                  statusConfig?.dotColor || 'bg-gray-400'
                )}
              />
              <span className={cn('text-xs font-semibold', statusConfig?.textColor || 'text-gray-700')}>
                {statusConfig?.label || project.status}
              </span>
            </div>
          </div>

          {/* Progress */}
          <div>
            <p className="text-[9px] text-gray-400 uppercase tracking-wider font-medium">Progress</p>
            <div className="flex items-center gap-1.5 mt-0.5">
              <div className="flex-1 h-1 bg-gray-100 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-construction-blue rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${completionPercentage}%` }}
                  transition={{ duration: 0.8, ease: 'easeOut', delay: 0.2 }}
                />
              </div>
              <span className="text-xs font-bold text-construction-blue shrink-0 tabular-nums">
                {formatPercentWhole(completionPercentage)}
              </span>
            </div>
          </div>

          {/* Schedule */}
          <div>
            <p className="text-[9px] text-gray-400 uppercase tracking-wider font-medium">Schedule</p>
            <div className="flex items-center gap-1 mt-0.5">
              <Calendar className="h-3 w-3 text-gray-400" />
              <span className="text-xs font-semibold text-gray-700">
                {daysRemaining ?? '--'}
                <span className="text-gray-400 font-normal ml-0.5">days</span>
              </span>
            </div>
          </div>

          {/* Members */}
          <div>
            <p className="text-[9px] text-gray-400 uppercase tracking-wider font-medium">Team</p>
            <div className="flex items-center gap-1 mt-0.5">
              <Users className="h-3 w-3 text-gray-400" />
              <span className="text-xs font-semibold text-gray-700">
                {stats?.teamSize ?? 0}
                <span className="text-gray-400 font-normal ml-0.5">members</span>
              </span>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="h-px bg-gray-100" />

        {/* Footer - Address & Date */}
        <div className="flex items-center justify-between">
          {project.address ? (
            <div className="flex items-center gap-1 text-construction-blue min-w-0">
              <MapPin className="h-3 w-3 shrink-0" />
              <span className="text-[10px] font-medium truncate max-w-[180px]">
                {project.address}
                {project.city && `, ${project.city}`}
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-1 text-gray-300">
              <MapPin className="h-3 w-3" />
              <span className="text-[10px]">No address</span>
            </div>
          )}

          <span className="text-[10px] text-gray-400 font-medium shrink-0">
            {project.start_date
              ? new Date(project.start_date).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                })
              : 'Not started'}
          </span>
        </div>
      </div>

      {/* Hover/active indicator line at bottom */}
      <div
        className={cn(
          'absolute bottom-0 left-0 right-0 h-1',
          'opacity-0 group-active:opacity-100',
          'transition-opacity duration-300',
          theme.borderAccent.replace('border-t-', 'bg-')
        )}
      />
    </motion.article>
  );

  // Wrap in Link for navigation
  return (
    <Link href={`/app/projects/${project.id}`} className="block">
      {cardContent}
    </Link>
  );
}

/**
 * MobileProjectCardSkeleton - Loading placeholder
 */
export function MobileProjectCardSkeleton() {
  return (
    <div className="w-full bg-white rounded-xl border border-gray-200 overflow-hidden animate-pulse">
      {/* Header skeleton */}
      <div className="bg-gray-200 px-3 py-2.5">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1">
            <div className="h-2 w-16 bg-gray-300 rounded mb-1" />
            <div className="h-4 w-32 bg-gray-300 rounded" />
          </div>
          <div className="w-8 h-8 bg-gray-300 rounded-lg" />
        </div>
      </div>

      {/* Image skeleton */}
      <div className="h-28 bg-gray-100" />

      {/* Content skeleton */}
      <div className="p-3 space-y-2.5">
        <div className="flex justify-between">
          <div>
            <div className="h-2 w-10 bg-gray-200 rounded mb-1" />
            <div className="h-4 w-24 bg-gray-200 rounded" />
          </div>
          <div className="text-right">
            <div className="h-2 w-10 bg-gray-200 rounded mb-1" />
            <div className="h-4 w-16 bg-gray-200 rounded" />
          </div>
        </div>

        <div className="h-px bg-gray-100" />

        <div className="grid grid-cols-2 gap-3">
          {[...Array(4)].map((_, i) => (
            <div key={i}>
              <div className="h-2 w-12 bg-gray-200 rounded mb-1" />
              <div className="h-3 w-16 bg-gray-200 rounded" />
            </div>
          ))}
        </div>

        <div className="h-px bg-gray-100" />

        <div className="flex justify-between">
          <div className="h-3 w-32 bg-gray-200 rounded" />
          <div className="h-3 w-12 bg-gray-200 rounded" />
        </div>
      </div>
    </div>
  );
}
