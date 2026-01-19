"use client";

/**
 * TeamMemberCard Component
 *
 * Mobile-optimized card for displaying team member information.
 * Designed for use with SwipeableCard for swipe actions.
 *
 * Features:
 * - Avatar with initials fallback
 * - Name, email, role display
 * - Status badge
 * - Project count
 * - Touch-friendly tap target
 */

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { cn, getInitials } from "@/lib/utils";
import { ROLE_CONFIG, STATUS_CONFIG } from "@/lib/team-config";
import type { TeamMember } from "@/types/team";

interface TeamMemberCardProps {
  member: TeamMember;
  onClick?: () => void;
  className?: string;
}

export function TeamMemberCard({
  member,
  onClick,
  className,
}: TeamMemberCardProps) {
  const roleConfig = ROLE_CONFIG[member.role] || ROLE_CONFIG.field_worker;
  const statusConfig = STATUS_CONFIG[member.status] || STATUS_CONFIG.inactive;
  const RoleIcon = roleConfig.icon;

  const name = member.user_profiles?.name || "Unknown";
  const email = member.user_profiles?.email || "No email";
  const avatarUrl = member.user_profiles?.avatar_url;

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        // Base styles
        "w-full text-left",
        "p-4 bg-white",
        "flex items-center gap-4",

        // Touch feedback
        "active:bg-gray-50",
        "transition-colors duration-100",

        // Touch optimization
        "touch-manipulation",

        className,
      )}
    >
      {/* Avatar */}
      <Avatar className="h-12 w-12 border-2 border-gray-200 flex-shrink-0">
        <AvatarImage src={avatarUrl || undefined} alt={name} />
        <AvatarFallback className="bg-[#001B51] text-white font-semibold text-sm">
          {getInitials(name)}
        </AvatarFallback>
      </Avatar>

      {/* Member info */}
      <div className="flex-1 min-w-0">
        {/* Name and status */}
        <div className="flex items-center gap-2 mb-1">
          <h3 className="font-semibold text-gray-900 truncate text-base">
            {name}
          </h3>
          {/* Status dot */}
          <div
            className={cn(
              "w-2 h-2 rounded-full flex-shrink-0",
              statusConfig.dotColor,
            )}
            title={statusConfig.label}
          />
        </div>

        {/* Email */}
        <p className="text-sm text-gray-500 truncate mb-2">{email}</p>

        {/* Role badge and project count */}
        <div className="flex items-center gap-2 flex-wrap">
          <Badge
            variant="secondary"
            className={cn(
              "text-xs font-medium px-2 py-0.5 flex items-center gap-1",
              roleConfig.color,
            )}
          >
            <RoleIcon className="h-3 w-3" />
            {roleConfig.label}
          </Badge>

          {member.project_count > 0 && (
            <span className="text-xs text-gray-500">
              {member.project_count} project
              {member.project_count !== 1 ? "s" : ""}
            </span>
          )}
        </div>
      </div>
    </button>
  );
}
