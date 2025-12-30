"use client";

/**
 * ProjectCard Component - V2 Hero Image Design
 *
 * A modern project card with:
 * - Color-coded header by project type
 * - Hero image placeholder (gradient for now)
 * - Client/Budget info row
 * - 2x2 stats grid
 * - Footer with project ID and spent amount
 *
 * Debug: Construction-themed design for GenHub PWA
 */

import Link from 'next/link';
import Image from 'next/image';
import { motion } from "framer-motion";
import { Users, Calendar, MapPin } from 'lucide-react';
import type { Database } from '@/types/database.types';
import { cn, formatBudget } from '@/lib/utils';
import type { ProjectWithStats } from '@/app/actions/projects';
import { getProjectTheme, PROJECT_STATUS_CONFIG } from '@/lib/project-card-themes';

// Debug: Type definitions
type Project = Database['public']['Tables']['projects']['Row'] & {
  project_phases?: Array<{
    id: string;
    status: string;
    completion_percentage: number | null;
  }>;
};

interface ProjectCardProps {
  project: Project | ProjectWithStats;
}

export function ProjectCard({ project }: ProjectCardProps) {
  // Debug: Get theme configuration based on project type
  const theme = getProjectTheme(project.project_type);
  const TypeIcon = theme.icon;
  const statusConfig = PROJECT_STATUS_CONFIG[project.status as keyof typeof PROJECT_STATUS_CONFIG];

  // Debug: Calculate completion percentage
  const completionPercentage = project.completion_percentage || 0;

  // Debug: Get stats if available
  const hasStats = 'stats' in project && project.stats;
  const stats = hasStats ? project.stats : null;

  // Debug: Get image URL or use placeholder gradient
  const imageUrl = project.image_url;

  return (
    <Link href={`/app/projects/${project.id}`} className="block h-full">
      <motion.article
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        whileHover={{ y: -6 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        className={cn(
          "group relative h-full rounded-xl overflow-hidden",
          "bg-white border border-gray-200",
          "shadow-sm hover:shadow-xl",
          "transition-shadow duration-300",
          "cursor-pointer"
        )}
      >
        {/* Debug: Colored Header Section - Project Type */}
        <header className={cn(
          "relative px-4 py-3",
          theme.headerBg,
          theme.headerText
        )}>
          <div className="flex items-start justify-between gap-3">
            {/* Debug: Project Type Label & Name */}
            <div className="flex-1 min-w-0">
              <p className={cn(
                "text-[10px] font-bold uppercase tracking-[0.15em] mb-0.5",
                theme.accentColor
              )}>
                {theme.labelFull}
              </p>
              <h3 className="text-lg font-bold leading-tight line-clamp-1 tracking-tight">
                {project.name}
              </h3>
            </div>

            {/* Debug: Type Icon */}
            <div className={cn(
              "shrink-0 p-2.5 rounded-lg",
              theme.iconBg
            )}>
              <TypeIcon className="h-5 w-5" strokeWidth={2} />
            </div>
          </div>

          {/* Debug: Decorative bottom edge */}
          <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-black/10" />
        </header>

        {/* Debug: Hero Image / Placeholder Section */}
        <div className="relative h-36 overflow-hidden">
          {imageUrl ? (
            // Debug: Actual image when available
            <Image
              src={imageUrl}
              alt={`${project.name} site view`}
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-105"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
          ) : (
            // Debug: Gradient placeholder with icon
            <div className={cn(
              "absolute inset-0 bg-gradient-to-br",
              theme.placeholderGradient
            )}>
              {/* Debug: Blueprint grid pattern overlay */}
              <div
                className="absolute inset-0 opacity-10"
                style={{
                  backgroundImage: `
                    linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
                    linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)
                  `,
                  backgroundSize: '20px 20px'
                }}
              />

              {/* Debug: Centered icon */}
              <div className="absolute inset-0 flex items-center justify-center">
                <TypeIcon
                  className="h-16 w-16 text-white/20"
                  strokeWidth={1}
                />
              </div>

              {/* Debug: Address hint if available */}
              {project.address && (
                <div className="absolute bottom-2 left-3 right-3">
                  <p className="text-[10px] text-white/60 truncate font-medium">
                    {project.address}
                    {project.city && `, ${project.city}`}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Debug: Gradient overlay for text readability */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />
        </div>

        {/* Debug: Content Section */}
        <div className="p-4 space-y-3">
          {/* Debug: Client & Budget Row */}
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <p className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold mb-0.5">
                Client
              </p>
              <p className="text-sm font-semibold text-gray-900 truncate">
                {project.client_name}
              </p>
            </div>
            <div className="text-right shrink-0">
              <p className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold mb-0.5">
                Budget
              </p>
              <p className="text-sm font-bold text-construction-blue">
                {formatBudget(project.budget)}
              </p>
            </div>
          </div>

          {/* Debug: Divider */}
          <div className="h-px bg-gray-100" />

          {/* Debug: Stats Grid - 2x2 */}
          <div className="grid grid-cols-2 gap-x-4 gap-y-2">
            {/* Status */}
            <div>
              <p className="text-[10px] text-gray-400 uppercase tracking-wider font-medium">
                Status
              </p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className={cn(
                  "inline-block w-1.5 h-1.5 rounded-full",
                  statusConfig?.dotColor || 'bg-gray-400'
                )} />
                <span className={cn(
                  "text-sm font-semibold",
                  statusConfig?.textColor || 'text-gray-700'
                )}>
                  {statusConfig?.label || project.status}
                </span>
              </div>
            </div>

            {/* Progress */}
            <div>
              <p className="text-[10px] text-gray-400 uppercase tracking-wider font-medium">
                Progress
              </p>
              <div className="flex items-center gap-2 mt-0.5">
                <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-construction-blue rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${completionPercentage}%` }}
                    transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
                  />
                </div>
                <span className="text-sm font-bold text-construction-blue shrink-0 tabular-nums">
                  {completionPercentage}%
                </span>
              </div>
            </div>

            {/* Schedule */}
            <div>
              <p className="text-[10px] text-gray-400 uppercase tracking-wider font-medium">
                Schedule
              </p>
              <div className="flex items-center gap-1 mt-0.5">
                <Calendar className="h-3.5 w-3.5 text-gray-400" />
                <span className="text-sm font-semibold text-gray-700">
                  {stats?.schedule.daysRemaining ?? '--'}
                  <span className="text-gray-400 font-normal ml-0.5">days</span>
                </span>
              </div>
            </div>

            {/* Members */}
            <div>
              <p className="text-[10px] text-gray-400 uppercase tracking-wider font-medium">
                Team
              </p>
              <div className="flex items-center gap-1 mt-0.5">
                <Users className="h-3.5 w-3.5 text-gray-400" />
                <span className="text-sm font-semibold text-gray-700">
                  {stats?.teamSize ?? project.project_team?.length ?? 0}
                  <span className="text-gray-400 font-normal ml-0.5">members</span>
                </span>
              </div>
            </div>
          </div>

          {/* Debug: Divider */}
          <div className="h-px bg-gray-100" />

          {/* Debug: Footer - Google Maps Address Link */}
          <div className="flex items-center justify-between">
            {/* Debug: If address exists, show clickable Google Maps link */}
            {project.address ? (
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                  `${project.address}${project.city ? `, ${project.city}` : ''}`
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => {
                  // Debug: Prevent parent Link navigation
                  e.stopPropagation();
                  console.log('[ProjectCard] Opening Google Maps for address:', project.address);
                }}
                className={cn(
                  "flex items-center gap-1.5 group/link",
                  "text-construction-blue hover:text-construction-blue/80",
                  "transition-colors duration-200"
                )}
              >
                <MapPin className="h-3.5 w-3.5 shrink-0" />
                <span className="text-xs font-medium group-hover/link:underline truncate max-w-[200px]">
                  {project.address}
                  {project.city && `, ${project.city}`}
                </span>
              </a>
            ) : (
              // Debug: Fallback when no address is available
              <div className="flex items-center gap-1.5 text-gray-300">
                <MapPin className="h-3.5 w-3.5" />
                <span className="text-xs">No address</span>
              </div>
            )}

            {/* Debug: Start date display (right side) */}
            <span className="text-[11px] text-gray-400 font-medium shrink-0">
              {project.start_date
                ? new Date(project.start_date).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric'
                  })
                : 'Not started'
              }
            </span>
          </div>
        </div>

        {/* Debug: Hover indicator line at bottom */}
        <div className={cn(
          "absolute bottom-0 left-0 right-0 h-1",
          "bg-gradient-to-r opacity-0 group-hover:opacity-100",
          "transition-opacity duration-300",
          theme.placeholderGradient
        )} />
      </motion.article>
    </Link>
  );
}
