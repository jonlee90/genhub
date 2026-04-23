"use client";

/**
 * ProjectCard Component - Unified Responsive Design
 *
 * A single responsive project card that adapts to mobile and desktop:
 * - Responsive sizing (smaller on mobile, larger on desktop)
 * - Construction-blue header with project type icon
 * - Hero image/placeholder section
 * - Client & Budget row
 * - 2x2 stats grid (status, progress, schedule, team)
 * - Footer with address and date
 *
 * Performance optimizations:
 * - Single component for both mobile/desktop (no duplicate code)
 * - CSS-based animations instead of per-item framer-motion
 * - Memoized theme lookups
 */

import { memo, useMemo, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
// Performance optimization: Direct imports instead of barrel file (saves 200-800ms per page)
import Users from "lucide-react/icons/users";
import Calendar from "lucide-react/icons/calendar";
import MapPin from "lucide-react/icons/map-pin";
import Building2 from "lucide-react/icons/building-2";
import type {
  ProjectsRow,
  ProjectTypeConfigsRow,
} from "@/types/db/tables/projects";
import { cn, formatBudget, formatPercentWhole, formatDate } from "@/lib/utils";
import type { ProjectWithStats } from "@/app/actions/projects";
import { PROJECT_STATUS_CONFIG } from "@/lib/project-card-themes";
import { PROJECT_TYPE_ICON_MAP } from "@/lib/config/project-type-display";

type Project = ProjectsRow & {
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

interface ProjectCardProps {
  project: Project | ProjectWithStats;
  className?: string;
  projectTypes?: ProjectTypeConfigsRow[];
}

/**
 * Calculate days remaining from end date if stats not available
 * Hoisted outside component to avoid recreation on every render (performance optimization)
 */
function calculateDaysRemaining(
  endDate: string | null | undefined,
): number | null {
  if (!endDate) return null;
  const end = new Date(endDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diffTime = end.getTime() - today.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

function ProjectCardComponent({
  project,
  className,
  projectTypes = [],
}: ProjectCardProps) {
  // Look up the actual project type config from database
  const projectTypeConfig = useMemo(() => {
    // First try to match by project_type_config_id (most accurate)
    if (project.project_type_config_id && projectTypes.length > 0) {
      const configById = projectTypes.find(
        (pt) => pt.id === project.project_type_config_id,
      );
      if (configById) return configById;
    }

    // Fallback: match by normalized project_type string
    if (projectTypes.length > 0) {
      const normalizedType = project.project_type
        .toLowerCase()
        .replace(/\s+/g, "_");
      const configByName = projectTypes.find(
        (pt) => pt.name.toLowerCase().replace(/\s+/g, "_") === normalizedType,
      );
      if (configByName) return configByName;
    }

    return null;
  }, [project.project_type_config_id, project.project_type, projectTypes]);

  // Get icon component from database or use default
  const TypeIcon = useMemo(() => {
    if (
      projectTypeConfig?.icon_name &&
      PROJECT_TYPE_ICON_MAP[projectTypeConfig.icon_name]
    ) {
      return PROJECT_TYPE_ICON_MAP[projectTypeConfig.icon_name];
    }
    return Building2; // Default fallback icon
  }, [projectTypeConfig]);

  // Get display name from database or use project_type field
  const projectTypeName = projectTypeConfig?.name || project.project_type;

  const statusConfig = useMemo(
    () =>
      PROJECT_STATUS_CONFIG[
        project.status as keyof typeof PROJECT_STATUS_CONFIG
      ],
    [project.status],
  );

  // Performance optimization: Memoize computed values
  const completionPercentage = useMemo(
    () => project.completion_percentage || 0,
    [project.completion_percentage],
  );

  const hasStats = useMemo(
    () => "stats" in project && project.stats,
    [project],
  );
  const stats = hasStats ? project.stats : null;

  const daysRemaining = useMemo(
    () =>
      stats?.schedule?.daysRemaining ??
      calculateDaysRemaining(project.end_date),
    [stats?.schedule?.daysRemaining, project.end_date],
  );

  const imageUrl = project.image_url;

  // Performance optimization: Memoize event handlers
  const handleAddressClick = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      window.open(
        `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
          `${project.address}${project.city ? `, ${project.city}` : ""}`,
        )}`,
        "_blank",
        "noopener,noreferrer",
      );
    },
    [project.address, project.city],
  );

  return (
    <Link href={`/app/projects/${project.id}`} className="block h-full">
      <article
        className={cn(
          "group relative h-full rounded-xl overflow-hidden",
          "bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800",
          "shadow-sm hover:shadow-xl active:shadow-md",
          "transition-all duration-300",
          "cursor-pointer",
          "hover:-translate-y-1.5 md:hover:-translate-y-2",
          "active:scale-[0.98] md:active:scale-100",
          className,
        )}
      >
        {/* Header Section - Construction Blue */}
        <header className="relative px-3 md:px-4 py-2.5 md:py-3 bg-construction-blue text-white">
          <div className="flex items-start justify-between gap-2 md:gap-3">
            {/* Project Type Label & Name */}
            <div className="flex-1 min-w-0">
              <p className="text-[9px] md:text-[10px] font-bold uppercase tracking-[0.15em] mb-0.5 text-blue-200">
                {projectTypeName}
              </p>
              <h3 className="text-base md:text-lg font-bold leading-tight line-clamp-1 tracking-tight">
                {project.name}
              </h3>
            </div>

            {/* Color-Coded Type Icon */}
            <div
              className={cn(
                "shrink-0 p-2 md:p-2.5 rounded-lg bg-white/95 backdrop-blur-sm",
                "border border-white/20 shadow-sm",
              )}
            >
              <TypeIcon
                className="h-4 w-4 md:h-5 md:w-5 text-construction-blue"
                strokeWidth={2.5}
              />
            </div>
          </div>

          {/* Decorative bottom edge */}
          <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-black/10" />
        </header>

        {/* Hero Image / Placeholder Section */}
        <div className="relative h-28 md:h-36 overflow-hidden">
          {imageUrl ? (
            <Image
              src={imageUrl}
              alt={`${project.name} site view`}
              fill
              className="object-contain transition-transform duration-500 group-hover:scale-105"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-gray-100 to-gray-200">
              {/* Blueprint grid pattern overlay */}
              <div
                className="absolute inset-0 opacity-30"
                style={{
                  backgroundImage: `
                    linear-gradient(rgba(0,27,81,0.1) 1px, transparent 1px),
                    linear-gradient(90deg, rgba(0,27,81,0.1) 1px, transparent 1px)
                  `,
                  backgroundSize: "16px 16px",
                }}
              />

              {/* Centered icon */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="p-3 md:p-4 rounded-xl bg-construction-blue/10">
                  <TypeIcon
                    className="h-8 w-8 md:h-12 md:w-12 text-construction-blue opacity-40"
                    strokeWidth={1.5}
                  />
                </div>
              </div>

              {/* Address hint if available */}
              {project.address && (
                <div className="absolute bottom-1.5 md:bottom-2 left-2 md:left-3 right-2 md:right-3">
                  <p className="text-[9px] md:text-[10px] text-gray-600 truncate font-medium">
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
        <div className="p-3 md:p-4 space-y-2.5 md:space-y-3">
          {/* Client & Budget Row */}
          <div className="flex items-start justify-between gap-3 md:gap-4">
            <div className="flex-1 min-w-0">
              <p className="text-[9px] md:text-[10px] text-gray-400 dark:text-gray-500 uppercase tracking-wider font-semibold mb-0.5">
                Client
              </p>
              <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">
                {project.client_name}
              </p>
            </div>
            <div className="text-right shrink-0">
              <p className="text-[9px] md:text-[10px] text-gray-400 dark:text-gray-500 uppercase tracking-wider font-semibold mb-0.5">
                Budget
              </p>
              <p className="text-sm font-bold text-construction-blue dark:text-blue-400">
                {formatBudget(project.budget)}
              </p>
            </div>
          </div>

          {/* Divider */}
          <div className="h-px bg-gray-100 dark:bg-gray-800" />

          {/* Stats Grid - 2x2 */}
          <div className="grid grid-cols-2 gap-x-3 md:gap-x-4 gap-y-1.5 md:gap-y-2">
            {/* Status */}
            <div>
              <p className="text-[9px] md:text-[10px] text-gray-400 dark:text-gray-500 uppercase tracking-wider font-medium">
                Status
              </p>
              <div className="flex items-center gap-1 md:gap-1.5 mt-0.5">
                <span
                  className={cn(
                    "inline-block w-1.5 h-1.5 rounded-full",
                    statusConfig?.dotColor || "bg-gray-400",
                  )}
                />
                <span
                  className={cn(
                    "text-xs md:text-sm font-semibold",
                    statusConfig?.textColor || "text-gray-700",
                  )}
                >
                  {statusConfig?.label || project.status}
                </span>
              </div>
            </div>

            {/* Progress */}
            <div>
              <p className="text-[9px] md:text-[10px] text-gray-400 dark:text-gray-500 uppercase tracking-wider font-medium">
                Progress
              </p>
              <div className="flex items-center gap-1.5 md:gap-2 mt-0.5">
                <div className="flex-1 h-1 md:h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-construction-blue dark:bg-blue-400 rounded-full transition-all duration-700 ease-out"
                    style={{ width: `${completionPercentage}%` }}
                  />
                </div>
                <span className="text-xs md:text-sm font-bold text-construction-blue dark:text-blue-400 shrink-0 tabular-nums">
                  {formatPercentWhole(completionPercentage)}
                </span>
              </div>
            </div>

            {/* Schedule */}
            <div>
              <p className="text-[9px] md:text-[10px] text-gray-400 dark:text-gray-500 uppercase tracking-wider font-medium">
                Schedule
              </p>
              <div className="flex items-center gap-1 mt-0.5">
                <Calendar className="h-3 w-3 md:h-3.5 md:w-3.5 text-gray-400 dark:text-gray-500" />
                <span className="text-xs md:text-sm font-semibold text-gray-700 dark:text-gray-300">
                  {daysRemaining ?? "--"}
                  <span className="text-gray-400 dark:text-gray-500 font-normal ml-0.5">
                    days
                  </span>
                </span>
              </div>
            </div>

            {/* Members */}
            <div>
              <p className="text-[9px] md:text-[10px] text-gray-400 dark:text-gray-500 uppercase tracking-wider font-medium">
                Team
              </p>
              <div className="flex items-center gap-1 mt-0.5">
                <Users className="h-3 w-3 md:h-3.5 md:w-3.5 text-gray-400 dark:text-gray-500" />
                <span className="text-xs md:text-sm font-semibold text-gray-700 dark:text-gray-300">
                  {stats?.teamSize ?? 0}
                  <span className="text-gray-400 dark:text-gray-500 font-normal ml-0.5">
                    members
                  </span>
                </span>
              </div>
            </div>
          </div>

          {/* Divider */}
          <div className="h-px bg-gray-100 dark:bg-gray-800" />

          {/* Footer - Address & Date */}
          <div className="flex items-center justify-between">
            {project.address ? (
              <button
                type="button"
                onClick={handleAddressClick}
                className={cn(
                  "flex items-center gap-1 md:gap-1.5 group/link",
                  "text-construction-blue dark:text-blue-400 hover:text-construction-blue/80 dark:hover:text-blue-300",
                  "transition-colors duration-200",
                  "bg-transparent border-none cursor-pointer p-0 min-w-0",
                )}
              >
                <MapPin className="h-3 w-3 md:h-3.5 md:w-3.5 shrink-0" />
                <span className="text-[10px] md:text-xs font-medium group-hover/link:underline truncate max-w-[150px] md:max-w-[200px]">
                  {project.address}
                  {project.city && `, ${project.city}`}
                </span>
              </button>
            ) : (
              <div className="flex items-center gap-1 md:gap-1.5 text-gray-300 dark:text-gray-700">
                <MapPin className="h-3 w-3 md:h-3.5 md:w-3.5" />
                <span className="text-[10px] md:text-xs">No address</span>
              </div>
            )}

            <span className="text-[10px] md:text-[11px] text-gray-400 dark:text-gray-500 font-medium shrink-0">
              {formatDate(project.start_date, { fallback: "Not started" })}
            </span>
          </div>
        </div>

        {/* Hover/active indicator line at bottom */}
        <div
          className={cn(
            "absolute bottom-0 left-0 right-0 h-1",
            "opacity-0 group-hover:opacity-100 group-active:opacity-100",
            "transition-opacity duration-300",
            "bg-construction-blue",
          )}
        />
      </article>
    </Link>
  );
}

// Memoize the component to prevent unnecessary re-renders
export const ProjectCard = memo(ProjectCardComponent);

/**
 * ProjectCardSkeleton - Loading placeholder (responsive)
 */
export function ProjectCardSkeleton() {
  return (
    <div className="w-full bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden animate-pulse">
      {/* Header skeleton */}
      <div className="bg-gray-200 dark:bg-gray-800 px-3 md:px-4 py-2.5 md:py-3">
        <div className="flex items-start justify-between gap-2 md:gap-3">
          <div className="flex-1">
            <div className="h-2 w-16 bg-gray-300 dark:bg-gray-700 rounded mb-1" />
            <div className="h-4 md:h-5 w-32 bg-gray-300 dark:bg-gray-700 rounded" />
          </div>
          <div className="w-8 h-8 md:w-10 md:h-10 bg-gray-300 dark:bg-gray-700 rounded-lg" />
        </div>
      </div>

      {/* Image skeleton */}
      <div className="h-28 md:h-36 bg-gray-100 dark:bg-gray-800" />

      {/* Content skeleton */}
      <div className="p-3 md:p-4 space-y-2.5 md:space-y-3">
        <div className="flex justify-between">
          <div>
            <div className="h-2 w-10 bg-gray-200 dark:bg-gray-700 rounded mb-1" />
            <div className="h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded" />
          </div>
          <div className="text-right">
            <div className="h-2 w-10 bg-gray-200 dark:bg-gray-700 rounded mb-1" />
            <div className="h-4 w-16 bg-gray-200 dark:bg-gray-700 rounded" />
          </div>
        </div>

        <div className="h-px bg-gray-100 dark:bg-gray-800" />

        <div className="grid grid-cols-2 gap-3">
          {[...Array(4)].map((_, i) => (
            <div key={i}>
              <div className="h-2 w-12 bg-gray-200 dark:bg-gray-700 rounded mb-1" />
              <div className="h-3 w-16 bg-gray-200 dark:bg-gray-700 rounded" />
            </div>
          ))}
        </div>

        <div className="h-px bg-gray-100 dark:bg-gray-800" />

        <div className="flex justify-between">
          <div className="h-3 w-32 bg-gray-200 dark:bg-gray-700 rounded" />
          <div className="h-3 w-12 bg-gray-200 dark:bg-gray-700 rounded" />
        </div>
      </div>
    </div>
  );
}
