"use client";

/**
 * ChatMemberList - Read-only member list for chat room settings
 *
 * Features:
 * - Display all participants with avatars and roles
 * - Role badges with construction-themed styling
 * - Synced from project_team (read-only)
 * - Industrial-refined design
 */

import { memo } from "react";
import { m as motion } from "framer-motion";
import { cn, getInitials } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Users, Shield, Wrench, HardHat, User } from "lucide-react";

export interface ChatMember {
  id: string;
  user_id: string;
  name: string;
  email: string;
  avatar_url: string | null;
  role: string; // 'admin', 'pm', 'field_worker', 'subcontractor', etc.
  joined_at: string;
}

interface ChatMemberListProps {
  members: ChatMember[];
}

// Debug: Member list with construction-themed role badges
export function ChatMemberList({ members }: ChatMemberListProps) {
  console.log("[ChatMemberList] Rendering with members:", members.length);

  if (members.length === 0) {
    return (
      <div className="p-8 text-center">
        <Users className="h-12 w-12 text-gray-300 mx-auto mb-3" />
        <p className="text-sm font-mono text-gray-500">No members found</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {members.map((member, index) => (
        <ChatMemberRow key={member.id} member={member} index={index} />
      ))}
    </div>
  );
}

const ChatMemberRow = memo(function ChatMemberRow({
  member,
  index,
}: {
  member: ChatMember;
  index: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05 }}
      className={cn(
        "flex items-center gap-3 p-3 rounded-lg",
        "bg-white border-2 border-gray-100",
        "hover:border-construction-blue/20 hover:bg-construction-blue/5",
        "transition-all duration-200",
      )}
    >
      {/* Debug: Avatar */}
      <Avatar className="h-10 w-10 shrink-0 border-2 border-gray-200">
        <AvatarImage src={member.avatar_url || undefined} />
        <AvatarFallback className="bg-gradient-to-br from-construction-blue to-construction-blue/80 text-white text-xs font-black">
          {getInitials(member.name)}
        </AvatarFallback>
      </Avatar>

      {/* Debug: Member info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold text-gray-900 truncate">
            {member.name}
          </span>
          <RoleBadge role={member.role} />
        </div>
        <p className="text-xs font-mono text-gray-500 truncate">
          {member.email}
        </p>
      </div>

      {/* Debug: Role icon */}
      <div className="shrink-0">
        <RoleIcon role={member.role} />
      </div>
    </motion.div>
  );
}, areChatMemberEqual);

function areChatMemberEqual(
  prev: { member: ChatMember; index: number },
  next: { member: ChatMember; index: number },
) {
  return (
    prev.member.id === next.member.id &&
    prev.member.name === next.member.name &&
    prev.member.email === next.member.email &&
    prev.member.avatar_url === next.member.avatar_url &&
    prev.member.role === next.member.role &&
    prev.index === next.index
  );
}

// Debug: Role badge with construction-themed colors
function RoleBadge({ role }: { role: string }) {
  const badges: Record<string, { label: string; className: string }> = {
    admin: {
      label: "GC ADMIN",
      className: "bg-construction-blue text-white border-construction-blue",
    },
    pm: {
      label: "PM",
      className: "bg-construction-accent text-white border-construction-accent",
    },
    field_worker: {
      label: "FIELD",
      className:
        "bg-construction-yellow text-construction-accent border-construction-yellow",
    },
    subcontractor: {
      label: "SUB",
      className: "bg-gray-100 text-gray-700 border-gray-300",
    },
  };

  const badge = badges[role] || {
    label: role.toUpperCase(),
    className: "bg-gray-100 text-gray-600 border-gray-200",
  };

  return (
    <span
      className={cn(
        "px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider",
        "border-2",
        badge.className,
      )}
    >
      {badge.label}
    </span>
  );
}

// Debug: Role icon with construction context
function RoleIcon({ role }: { role: string }) {
  const icons: Record<string, React.ReactNode> = {
    admin: <Shield className="h-5 w-5 text-construction-blue" />,
    pm: <Wrench className="h-5 w-5 text-construction-accent" />,
    field_worker: <HardHat className="h-5 w-5 text-construction-yellow" />,
    subcontractor: <User className="h-5 w-5 text-gray-500" />,
  };

  return (
    <div className="p-2 bg-gray-50 rounded-lg">
      {icons[role] || <User className="h-5 w-5 text-gray-400" />}
    </div>
  );
}
