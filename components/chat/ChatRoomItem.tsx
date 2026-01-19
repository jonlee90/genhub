"use client";

import { motion } from "framer-motion";
import { cn, getInitials } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ChatRoomWithUnread } from "@/types/db/chat";
import { BellOff } from "lucide-react";

interface ChatRoomItemProps {
  room: ChatRoomWithUnread;
  isActive: boolean;
  onSelect: () => void;
  index: number;
}

// Debug: Individual chat room item with unread badges and hover effects
export function ChatRoomItem({
  room,
  isActive,
  onSelect,
  index,
}: ChatRoomItemProps) {
  console.log(
    "[ChatRoomItem] Rendering room:",
    room.name,
    "Unread:",
    room.unread_count,
  );

  // Debug: Check if room is muted
  const isMuted = room.muted_until && new Date(room.muted_until) > new Date();

  return (
    <motion.button
      onClick={onSelect}
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{
        delay: index * 0.05,
        type: "spring",
        stiffness: 300,
        damping: 25,
      }}
      whileTap={{ scale: 0.98 }}
      className={cn(
        "w-full flex items-start gap-3 p-3 transition-all relative group",
        "hover:bg-gradient-to-r hover:from-construction-blue/5 hover:to-transparent",
        // Industrial stamped metal badge style for active state
        "border-l-4",
        isActive
          ? "bg-gradient-to-r from-construction-blue/10 to-construction-blue/5 border-l-construction-blue shadow-[inset_0_1px_0_0_rgba(255,255,255,0.5)]"
          : "border-l-transparent",
      )}
    >
      {/* Debug: Blueprint-style active indicator */}
      {isActive && (
        <motion.div
          layoutId="activeRoom"
          className="absolute inset-0 border-2 border-construction-blue/20 pointer-events-none"
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
        />
      )}

      {/* Debug: Avatar with construction-themed fallback */}
      <Avatar className="h-12 w-12 shrink-0 border-2 border-gray-200 shadow-sm">
        <AvatarImage src={getAvatarUrl(room)} />
        <AvatarFallback className="bg-gradient-to-br from-construction-blue to-construction-blue/80 text-white font-black text-sm">
          {getInitials(room.name || "Chat")}
        </AvatarFallback>
      </Avatar>

      {/* Debug: Content */}
      <div className="flex-1 min-w-0 text-left">
        {/* Room Name + Timestamp */}
        <div className="flex items-start justify-between gap-2 mb-1">
          <h3
            className={cn(
              "text-sm truncate transition-colors",
              room.unread_count > 0
                ? "font-black text-construction-blue"
                : "font-semibold text-gray-700",
            )}
          >
            {room.name || "Unnamed Chat"}
          </h3>
          <span className="text-[10px] font-mono text-gray-500 shrink-0 tracking-tight">
            {formatRelativeTime(
              room.last_message?.created_at || room.created_at,
            )}
          </span>
        </div>

        {/* Last Message Preview */}
        <div className="flex items-center justify-between gap-2">
          <p
            className={cn(
              "text-xs truncate transition-colors",
              room.unread_count > 0
                ? "text-gray-700 font-medium"
                : "text-gray-500",
            )}
          >
            {getMessagePreview(room.last_message)}
          </p>

          {/* Debug: Unread Badge + Muted Icon with stamped metal style */}
          <div className="flex items-center gap-1.5 shrink-0">
            {isMuted && <BellOff className="h-3 w-3 text-gray-400" />}
            {room.unread_count > 0 && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 500, damping: 15 }}
              >
                {/* Industrial stamped badge */}
                <Badge
                  className={cn(
                    "text-[10px] font-black px-2 py-0.5 min-w-[22px] flex items-center justify-center",
                    "bg-gradient-to-b from-construction-blue to-construction-blue/90",
                    "text-white shadow-[inset_0_1px_0_0_rgba(255,255,255,0.3),0_2px_4px_0_rgba(0,27,81,0.3)]",
                    "border border-construction-blue/50",
                  )}
                >
                  {room.unread_count > 99 ? "99+" : room.unread_count}
                </Badge>
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </motion.button>
  );
}

// Debug: Helper functions

function getAvatarUrl(room: ChatRoomWithUnread): string | undefined {
  if (room.type === "project") {
    return undefined; // Will show initials fallback
  }
  return undefined; // For DMs, will be implemented with participant data
}

// Debug: Format relative time (2m, 1h, Yesterday, Dec 15)
function formatRelativeTime(timestamp: string): string {
  const now = new Date();
  const date = new Date(timestamp);
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "NOW";
  if (diffMins < 60) return `${diffMins}m`;
  if (diffHours < 24) return `${diffHours}h`;
  if (diffDays === 1) return "YDA";
  if (diffDays < 7) return `${diffDays}d`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

// Debug: Get message preview (truncate to 50 chars)
function getMessagePreview(message?: any): string {
  if (!message) return "No messages yet";
  if (message.deleted_at) return "This message was deleted";
  const content = message.content.replace(/\n/g, " ").trim();
  return content.length > 50 ? `${content.slice(0, 50)}...` : content;
}
