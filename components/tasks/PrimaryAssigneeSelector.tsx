"use client";

import Star from "lucide-react/icons/star";
import Building2 from "lucide-react/icons/building-2";
import Users from "lucide-react/icons/users";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn, getInitials } from "@/lib/utils";

/**
 * Assignee option for the primary selector
 */
export interface AssigneeOption {
  id: string;
  type: "user" | "subcontractor";
  name: string;
  avatarUrl?: string | null;
  companyName?: string; // For subcontractors
}

/**
 * Props for PrimaryAssigneeSelector component
 */
export interface PrimaryAssigneeSelectorProps {
  /** List of assignees to choose from */
  assignees: AssigneeOption[];
  /** Currently selected primary assignee ID */
  primaryId: string | null;
  /** Callback when primary assignee changes */
  onPrimaryChange: (id: string) => void;
  /** Whether the selector is disabled */
  disabled?: boolean;
}

/**
 * PrimaryAssigneeSelector - Radio-style selection for primary assignee
 *
 * Used to designate which assignee is primary for expense attribution.
 * Only visible when there are multiple assignees.
 *
 * Features:
 * - Radio-style selection (only one can be primary)
 * - Star icon indicator (filled/outline)
 * - 48px row height for touch targets
 * - Shows avatar, name, and company for subcontractors
 * - Mobile PWA compliant
 */
export function PrimaryAssigneeSelector({
  assignees,
  primaryId,
  onPrimaryChange,
  disabled = false,
}: PrimaryAssigneeSelectorProps) {
  // Only show when there are multiple assignees
  if (assignees.length <= 1) {
    return null;
  }

  return (
    <div className="space-y-2">
      {/* Section Label */}
      <div className="flex items-center gap-2 px-1">
        <Users className="w-4 h-4 text-gray-400 dark:text-gray-500" />
        <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
          Primary Assignee
        </span>
      </div>

      {/* Assignee List */}
      <div
        className={cn(
          "rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 overflow-hidden",
          disabled && "opacity-50",
        )}
      >
        {assignees.map((assignee, index) => {
          const isPrimary = primaryId === assignee.id;
          const isLast = index === assignees.length - 1;

          return (
            <button
              key={`${assignee.type}-${assignee.id}`}
              type="button"
              onClick={() => !disabled && onPrimaryChange(assignee.id)}
              disabled={disabled}
              className={cn(
                "w-full flex items-center gap-3 px-4",
                "min-h-[48px] py-2.5",
                "transition-all duration-150",
                !isLast && "border-b border-gray-100 dark:border-gray-800",
                isPrimary ? "bg-construction-blue/5 dark:bg-construction-blue/10" : "bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800",
                disabled
                  ? "cursor-not-allowed"
                  : "cursor-pointer active:bg-gray-100 dark:active:bg-gray-700",
              )}
            >
              {/* Star Icon */}
              <div
                className={cn(
                  "flex items-center justify-center",
                  "w-8 h-8 rounded-full",
                  "transition-colors duration-150",
                  isPrimary ? "bg-amber-100 dark:bg-amber-900/30" : "bg-gray-100 dark:bg-gray-800",
                )}
              >
                <Star
                  className={cn(
                    "w-4 h-4 transition-colors duration-150",
                    isPrimary
                      ? "text-amber-500 dark:text-amber-400 fill-amber-500 dark:fill-amber-400"
                      : "text-gray-400 dark:text-gray-500",
                  )}
                />
              </div>

              {/* Avatar */}
              <Avatar className="h-8 w-8 flex-shrink-0">
                <AvatarImage src={assignee.avatarUrl || undefined} />
                <AvatarFallback
                  className={cn(
                    "text-[10px] font-semibold text-white",
                    assignee.type === "user" ? "bg-construction-blue" : "bg-orange-600",
                  )}
                >
                  {getInitials(assignee.name)}
                </AvatarFallback>
              </Avatar>

              {/* Name & Company */}
              <div className="flex-1 min-w-0 text-left">
                <div
                  className={cn(
                    "font-medium text-sm truncate",
                    isPrimary ? "text-construction-blue dark:text-blue-400" : "text-gray-900 dark:text-gray-100",
                  )}
                >
                  {assignee.name}
                </div>
                {assignee.type === "subcontractor" && assignee.companyName && (
                  <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                    <Building2 className="w-3 h-3" />
                    <span className="truncate">{assignee.companyName}</span>
                  </div>
                )}
                {assignee.type === "subcontractor" && !assignee.companyName && (
                  <div className="text-xs text-gray-400">Subcontractor</div>
                )}
              </div>

              {/* Selection Indicator */}
              <div
                className={cn(
                  "flex items-center justify-center",
                  "w-5 h-5 rounded-full border-2",
                  "transition-all duration-150",
                  isPrimary
                    ? "border-construction-blue bg-construction-blue"
                    : "border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900",
                )}
              >
                {isPrimary && <div className="w-2 h-2 rounded-full bg-white" />}
              </div>
            </button>
          );
        })}
      </div>

      {/* Hint Text */}
      <p className="text-xs text-gray-500 dark:text-gray-400 px-1">
        The primary assignee will be used as the vendor name for auto-created
        expenses.
      </p>
    </div>
  );
}

/**
 * Get initials from a name string
 */
