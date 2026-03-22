"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useEstimatePresence } from "@/lib/collaboration/presence-tracker";
import type { PresenceUser } from "@/lib/collaboration/presence-tracker";

// ============================================
// TYPES
// ============================================

interface CollaborationPresenceProps {
  estimateId: string;
}

// ============================================
// HELPERS
// ============================================

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

// ============================================
// AVATAR COMPONENT
// ============================================

interface AvatarProps {
  user: PresenceUser;
  size?: "sm" | "md";
}

function UserAvatar({ user, size = "md" }: AvatarProps) {
  const sizeClass = size === "sm" ? "w-7 h-7 text-xs" : "w-9 h-9 text-sm";
  const label = `${user.name}${user.section ? ` — editing ${user.section}` : ""}`;

  return (
    <div
      className={`${sizeClass} rounded-full flex items-center justify-center font-semibold text-white shrink-0 ring-2 ring-white dark:ring-gray-900`}
      style={{ backgroundColor: user.color, borderColor: user.color }}
      title={label}
      aria-label={label}
    >
      {getInitials(user.name)}
    </div>
  );
}

// ============================================
// JOIN TOAST
// ============================================

interface JoinToastProps {
  name: string;
  onDismiss: () => void;
}

function JoinToast({ name, onDismiss }: JoinToastProps) {
  useEffect(() => {
    const timer = setTimeout(onDismiss, 4000);
    return () => clearTimeout(timer);
  }, [onDismiss]);

  return (
    <div
      role="status"
      aria-live="polite"
      className="absolute top-full left-0 mt-2 z-50 px-3 py-2 rounded-lg bg-[#001B51] dark:bg-[#001B51] text-white text-xs font-medium shadow-lg whitespace-nowrap pointer-events-none"
    >
      {name} is viewing this estimate
    </div>
  );
}

// ============================================
// MAIN COMPONENT
// ============================================

export function CollaborationPresence({
  estimateId,
}: CollaborationPresenceProps) {
  const { users } = useEstimatePresence(estimateId);
  const [toastUser, setToastUser] = useState<string | null>(null);
  const prevUsersRef = useRef<string[]>([]);

  // Detect newly joined users and show toast
  useEffect(() => {
    const prevIds = prevUsersRef.current;
    const currentIds = users.map((u) => u.userId);

    const newUsers = users.filter((u) => !prevIds.includes(u.userId));
    if (newUsers.length > 0) {
      setToastUser(newUsers[newUsers.length - 1].name);
    }

    prevUsersRef.current = currentIds;
  }, [users]);

  const handleToastDismiss = useCallback(() => setToastUser(null), []);

  // Only render when more than 1 total user is present (we exclude self in hook)
  // users array contains only OTHER users; show when at least 1 other user
  return users.length > 0 ? (
    <div className="relative flex items-center min-h-[44px]">
      {/* Avatar stack — show up to 4, then overflow chip */}
      <div className="flex items-center -space-x-2">
        {users.slice(0, 4).map((user) => (
          <UserAvatar key={user.userId} user={user} />
        ))}

        {users.length > 4 ? (
          <div
            className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-semibold bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 ring-2 ring-white dark:ring-gray-900"
            title={`${users.length - 4} more users`}
            aria-label={`${users.length - 4} more users viewing this estimate`}
          >
            +{users.length - 4}
          </div>
        ) : null}
      </div>

      {/* Join toast */}
      {toastUser !== null ? (
        <JoinToast name={toastUser} onDismiss={handleToastDismiss} />
      ) : null}
    </div>
  ) : null;
}
