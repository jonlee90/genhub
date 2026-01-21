"use client";

import React from "react";
import { LucideIcon } from "lucide-react";
// Direct Lucide imports for performance (200-800ms savings)
import Trash2 from "lucide-react/icons/trash-2";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * Badge configuration for TypesCard
 */
export interface TypesBadge {
  label: string;
  icon?: LucideIcon;
  variant: 'default' | 'warning' | 'inactive';
}

/**
 * Count badge configuration (e.g., project count)
 */
export interface TypesCountBadge {
  count: number;
  label: string;
  icon?: LucideIcon;
}

/**
 * Props for TypesCard component
 * Supports project types and task types with flexible badge configurations
 */
export interface TypesCardProps {
  // Core content
  title: string;
  description?: string;

  // Visual styling
  icon: LucideIcon;
  iconColor?: string; // hex color for dynamic theming (e.g., "var(--construction-blue)", "#3b82f6")

  // Status/info badges
  badges?: TypesBadge[];

  // Optional count badge (e.g., "5 projects")
  countBadge?: TypesCountBadge;

  // Actions
  onEdit: () => void;
  onDelete: () => void;
  deleteDisabled?: boolean; // e.g., when project_count > 0

  // Styling
  className?: string;
  style?: React.CSSProperties;
}

// Badge variant styles matching construction theme
const badgeVariants = {
  default: "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-700",
  warning: "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 border-red-300 dark:border-red-700",
  inactive: "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 border-gray-300 dark:border-gray-600",
} as const;

/**
 * TypesCard - Reusable card for "type" entities (project types, task types)
 *
 * Features:
 * - Mobile-first design with ~140-160px height on mobile (optimized for compact layout)
 * - 44px minimum tap targets for touch devices
 * - High contrast colors for outdoor construction use
 * - Dynamic icon theming with customizable colors
 * - Touch feedback with active states
 * - Gradient hover glow effect (desktop only)
 * - Flexible badge system for status and counts
 *
 * Layout Strategy (Mobile):
 * - Single-row compact header with icon, title, badges
 * - Description line-clamped to 1 line on mobile (saves ~20px)
 * - Footer with "Click to edit" + delete button
 * - Total height: ~140-160px on mobile
 *
 * Usage:
 * ```tsx
 * // Project Type
 * <TypesCard
 *   title="Residential"
 *   description="Single-family homes and duplexes"
 *   icon={Home}
 *   iconColor="var(--construction-blue)"
 *   badges={[{ label: "Inactive", icon: XCircle, variant: "inactive" }]}
 *   countBadge={{ count: 5, label: "project", icon: Building2 }}
 *   onEdit={() => setEditingType(type)}
 *   onDelete={() => setDeletingType(type)}
 *   deleteDisabled={type.project_count > 0}
 * />
 *
 * // Task Type
 * <TypesCard
 *   title="Demolition"
 *   description="Tear down and removal work"
 *   icon={Hammer}
 *   iconColor="#ef4444"
 *   badges={[
 *     { label: "Default", icon: Sparkles, variant: "default" },
 *     { label: "Inactive", icon: XCircle, variant: "inactive" }
 *   ]}
 *   onEdit={() => setEditingType(type)}
 *   onDelete={() => setDeletingType(type)}
 * />
 * ```
 *
 * Performance:
 * - Wrapped in React.memo (when used in parent)
 * - Direct icon imports
 * - CSS transitions instead of JS animations
 */
export const TypesCard = React.memo(function TypesCard({
  title,
  description,
  icon: Icon,
  iconColor = "var(--construction-blue)",
  badges = [],
  countBadge,
  onEdit,
  onDelete,
  deleteDisabled = false,
  className,
  style,
}: TypesCardProps) {
  return (
    <div className={cn("relative group h-full", className)} style={style}>
      {/* Gradient background glow - desktop only */}
      <div
        className="absolute inset-0 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-xl hidden sm:block"
        style={{
          background: `linear-gradient(135deg, ${iconColor}15, ${iconColor}05)`,
        }}
      />

      {/* Main card container - clickable to edit */}
      <div
        onClick={onEdit}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onEdit();
          }
        }}
        role="button"
        tabIndex={0}
        className="relative w-full bg-white dark:bg-gray-900 border-2 border-gray-200 dark:border-gray-700 rounded-lg p-4 sm:p-5 shadow-construction hover:shadow-construction-lg hover:border-construction-blue/30 transition-all duration-300 h-full flex flex-col text-left cursor-pointer active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-construction-blue focus-visible:ring-offset-2"
      >
        {/* Card header with icon and content */}
        <div className="flex items-start gap-3 sm:gap-4 mb-3 sm:mb-4">
          {/* Icon */}
          <div
            className="p-2 sm:p-3 rounded-lg border-2 shrink-0 transition-transform duration-300 group-hover:scale-110"
            style={{
              backgroundColor: `${iconColor}15`,
              borderColor: `${iconColor}30`,
            }}
          >
            <Icon
              className="h-5 w-5 sm:h-6 sm:w-6"
              style={{ color: iconColor }}
            />
          </div>

          {/* Title, badges, description, count badge */}
          <div className="flex-1 min-w-0">
            {/* Title and status badges */}
            <div className="flex items-start justify-between gap-2 mb-1 sm:mb-2">
              <h4 className="font-black text-construction-blue dark:text-construction-blue uppercase tracking-tight text-sm sm:text-base leading-tight">
                {title}
              </h4>
              {/* Status badges (Default, Inactive) */}
              {badges.length > 0 && (
                <div className="flex items-center gap-1 shrink-0">
                  {badges.map((badge, index) => {
                    const BadgeIcon = badge.icon;
                    return (
                      <span
                        key={index}
                        className={cn(
                          "inline-flex items-center gap-1 px-1.5 sm:px-2 py-0.5 rounded-md text-[10px] sm:text-xs font-bold border",
                          badgeVariants[badge.variant]
                        )}
                      >
                        {BadgeIcon && <BadgeIcon className="h-2.5 w-2.5 sm:h-3 sm:w-3" />}
                        {badge.label}
                      </span>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Description - single line on mobile, 2 lines on desktop */}
            <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 line-clamp-1 sm:line-clamp-2 min-h-[1rem] sm:min-h-[2.5rem]">
              {description || "No description provided"}
            </p>

            {/* Count badge (e.g., "5 projects") */}
            {countBadge && (
              <div className="mt-1.5 sm:mt-2 inline-flex items-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 py-0.5 sm:py-1 bg-gray-100 dark:bg-gray-800 rounded-md">
                {countBadge.icon && (
                  <countBadge.icon className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-gray-600 dark:text-gray-400" />
                )}
                <span className="text-[10px] sm:text-xs font-bold text-gray-900 dark:text-gray-100">
                  {countBadge.count} {countBadge.label}
                  {countBadge.count !== 1 ? 's' : ''}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Card footer with edit hint and delete button */}
        <div className="flex items-center justify-between gap-3 pt-2 sm:pt-3 mt-auto border-t-2 border-gray-100 dark:border-gray-800">
          <span className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 font-medium">
            Click to edit
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation(); // Prevent edit modal from opening
              onDelete();
            }}
            disabled={deleteDisabled}
            className="min-h-[44px] min-w-[44px] hover:bg-red-50 dark:hover:bg-red-900/30 hover:text-red-600 dark:hover:text-red-400 active:bg-red-100 dark:active:bg-red-900/50 font-semibold transition-all duration-150 active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed"
            aria-label="Delete"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
});
