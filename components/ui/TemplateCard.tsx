"use client";

import React, { useState } from "react";
import { m as motion, AnimatePresence } from "framer-motion";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { LucideIcon } from "lucide-react";
// Direct Lucide imports for performance (200-800ms savings)
import GripVertical from "lucide-react/icons/grip-vertical";
import ChevronDown from "lucide-react/icons/chevron-down";
import ChevronRight from "lucide-react/icons/chevron-right";
import Trash2 from "lucide-react/icons/trash-2";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

/**
 * Badge configuration for template cards
 */
export interface TemplateBadge {
  label: string;
  className?: string;
  icon?: LucideIcon;
}

/**
 * Props for TemplateCard component
 * Supports both expandable (phase templates) and simple (task templates) modes
 */
export interface TemplateCardProps {
  /** Unique identifier for drag-and-drop */
  id: string;
  /** Template title - NOT truncated on mobile for visibility */
  title: string;
  /** Optional description shown below title */
  description?: string;
  /** Icon component to display */
  icon?: LucideIcon;
  /** Icon background color */
  iconBgColor?: string;
  /** Icon color */
  iconColor?: string;
  /** Border accent color (left border on cards) */
  borderColor?: string;
  /** Badges to display (e.g., task count, type, priority) */
  badges?: TemplateBadge[];
  /** Order index to display (e.g., #1, #2) */
  orderIndex?: number;
  /** Whether card can expand to show children */
  expandable?: boolean;
  /** Initial expanded state */
  defaultExpanded?: boolean;
  /** Content to show when expanded */
  children?: React.ReactNode;
  /** Click handler for card (opens edit modal) */
  onEdit?: () => void;
  /** Delete handler */
  onDelete?: () => void;
  /** Additional CSS classes */
  className?: string;
}

/**
 * TemplateCard - Reusable template card component
 *
 * Features:
 * - Mobile-first design with proper stacking on small screens
 * - NO title truncation on mobile (multiline allowed for visibility)
 * - 44px minimum tap targets for touch devices
 * - High contrast colors for outdoor construction use
 * - Drag-and-drop support via @dnd-kit
 * - Optional expandable content section
 * - Touch feedback with active states
 *
 * Usage:
 * ```tsx
 * // Phase template (expandable)
 * <TemplateCard
 *   id={phase.id}
 *   title={phase.name}
 *   icon={Layers}
 *   expandable
 *   badges={[{ label: `${taskCount} tasks` }]}
 *   onEdit={() => setEditingPhase(phase)}
 *   onDelete={() => setDeletingPhase(phase)}
 * >
 *   <TaskTemplatesList tasks={phase.task_templates} />
 * </TemplateCard>
 *
 * // Task template (simple)
 * <TemplateCard
 *   id={task.id}
 *   title={task.title}
 *   orderIndex={task.order_index}
 *   badges={[
 *     { label: "Work", icon: Hammer },
 *     { label: "High", className: "border-red-300 text-red-700" }
 *   ]}
 *   onEdit={() => setEditingTask(task)}
 *   onDelete={() => setDeletingTask(task)}
 * />
 * ```
 *
 * Performance:
 * - Wrapped in React.memo (when used in parent)
 * - Direct icon imports
 * - CSS transitions instead of JS animations where possible
 */
export const TemplateCard = React.memo(function TemplateCard({
  id,
  title,
  description,
  icon: Icon,
  iconBgColor = "bg-construction-blue/10",
  iconColor = "text-construction-blue",
  borderColor = "border-l-construction-blue",
  badges = [],
  orderIndex,
  expandable = false,
  defaultExpanded = false,
  children,
  onEdit,
  onDelete,
  className,
}: TemplateCardProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn("relative group", isDragging && "opacity-50 z-50", className)}
    >
      {/* Gradient background glow on hover - desktop only */}
      <div className="absolute inset-0 bg-gradient-to-br from-construction-blue/5 to-construction-blue/10 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 hidden sm:block" />

      {/* Main card container */}
      <div className={cn(
        "relative bg-white dark:bg-gray-900 rounded-lg shadow-sm",
        "border-2 border-gray-200 dark:border-gray-800",
        "hover:shadow-construction hover:border-construction-blue/30 dark:hover:border-construction-blue/40",
        "transition-all duration-300",
        "border-l-4",
        borderColor
      )}>
        {/* Card header - COMPACT single-row layout on mobile (~100px height) */}
        <div className="flex items-center gap-1.5 sm:gap-3 p-2 sm:p-4">
          {/* Left section: Drag handle (with expand chevron overlay for expandable) */}
          <div className="relative shrink-0">
            <button
              {...attributes}
              {...listeners}
              onClick={(e) => e.stopPropagation()}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md cursor-grab active:cursor-grabbing transition-colors touch-manipulation min-h-[44px] min-w-[44px] flex items-center justify-center"
              aria-label="Drag to reorder"
            >
              <GripVertical className="h-5 w-5 text-gray-400 dark:text-gray-500" />
            </button>
          </div>

          {/* Expand/collapse toggle - compact on mobile */}
          {expandable && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsExpanded(!isExpanded);
              }}
              className="shrink-0 p-1.5 sm:p-2 hover:bg-construction-blue/10 rounded-md transition-colors min-h-[44px] min-w-[36px] sm:min-w-[44px] flex items-center justify-center"
              aria-label={isExpanded ? "Collapse" : "Expand"}
            >
              {isExpanded ? (
                <ChevronDown className="h-5 w-5 text-construction-blue" />
              ) : (
                <ChevronRight className="h-5 w-5 text-construction-blue" />
              )}
            </button>
          )}

          {/* Order index - inline on both mobile and desktop */}
          {orderIndex !== undefined && orderIndex !== null && (
            <div className="shrink-0 flex items-center justify-center w-6 h-6 sm:w-8 sm:h-8 bg-construction-blue/10 text-construction-blue font-black text-[10px] sm:text-sm rounded-md border-2 border-construction-blue/20">
              {orderIndex + 1}
            </div>
          )}

          {/* Icon - compact on mobile */}
          {Icon && (
            <div className={cn(
              "shrink-0 p-1.5 sm:p-2.5 rounded-lg border-2",
              iconBgColor,
              "border-construction-blue/20"
            )}>
              <Icon className={cn("h-4 w-4 sm:h-5 sm:w-5", iconColor)} />
            </div>
          )}

          {/* Center: Title + Badges inline - flex-1 to take remaining space */}
          <div
            onClick={onEdit}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onEdit?.();
              }
            }}
            role="button"
            tabIndex={0}
            className="flex-1 min-w-0 cursor-pointer hover:bg-construction-blue/5 px-1 sm:px-2 py-1 rounded-lg transition-colors focus-visible:ring-2 focus-visible:ring-construction-blue focus-visible:ring-offset-2"
          >
            {/* Title - single line truncated on mobile for compact height */}
            <h4 className={cn(
              "font-black text-construction-blue uppercase tracking-tight leading-tight",
              "text-sm sm:text-base",
              "truncate"
            )}>
              {title}
            </h4>
            {/* Badges inline below title on mobile, beside on desktop */}
            {badges.length > 0 && (
              <div className="flex items-center gap-1 mt-0.5 sm:mt-1 flex-wrap">
                {badges.map((badge, index) => {
                  const BadgeIcon = badge.icon;
                  return (
                    <Badge
                      key={index}
                      className={cn(
                        "text-[9px] sm:text-xs font-bold shrink-0 px-1 sm:px-2 py-0 sm:py-0.5 h-4 sm:h-auto",
                        badge.className || "bg-construction-blue/10 text-construction-blue border-construction-blue/20"
                      )}
                    >
                      {BadgeIcon && <BadgeIcon className="h-2 w-2 sm:h-3 sm:w-3 mr-0.5" />}
                      <span className="whitespace-nowrap">{badge.label}</span>
                    </Badge>
                  );
                })}
              </div>
            )}
            {/* Description - hidden on mobile for compact height, visible on desktop */}
            {description && (
              <p className="hidden sm:block text-sm text-gray-600 dark:text-gray-400 line-clamp-1 mt-1">
                {description}
              </p>
            )}
          </div>

          {/* Right: Delete button - compact on mobile */}
          {onDelete && (
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
              className="shrink-0 h-10 sm:h-8 w-10 sm:w-auto px-2 hover:bg-red-50 hover:text-red-600 font-semibold transition-colors touch-manipulation min-h-[44px] min-w-[44px] sm:min-h-0 sm:min-w-0 flex items-center justify-center"
              aria-label="Delete"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>

        {/* Expandable content section */}
        {expandable && (
          <AnimatePresence>
            {isExpanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div className="px-3 sm:px-4 pb-3 sm:pb-4 pt-2 border-t-2 border-gray-100 dark:border-gray-800">
                  {children}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
});
