"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { cn, getInitials } from "@/lib/utils";
import { Mail, Briefcase, Circle } from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { EntityPreviewSkeleton, EntityPreviewError } from "../EntityPreview";

interface UserPreviewProps {
  id: string;
}

interface UserData {
  id: string;
  name: string;
  email: string;
  avatar_url: string | null;
  role: string;
  is_online?: boolean;
}

// Debug: User preview card component
export function UserPreview({ id }: UserPreviewProps) {
  const [user, setUser] = useState<UserData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  console.log("[UserPreview] Rendering for user:", id);

  // Debug: Fetch user data
  useEffect(() => {
    async function fetchUser() {
      console.log("[UserPreview] Fetching user data:", id);

      try {
        const response = await fetch(
          `/api/chat/entity-preview?type=user&id=${id}`,
        );
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Failed to fetch user");
        }

        console.log("[UserPreview] User data loaded:", data);
        setUser(data);
      } catch (err: any) {
        console.error("[UserPreview] Error fetching user:", err);
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    }

    fetchUser();
  }, [id]);

  // Debug: Loading state
  if (isLoading) {
    return <EntityPreviewSkeleton />;
  }

  // Debug: Error state
  if (error || !user) {
    return <EntityPreviewError error={error || "User not found"} />;
  }

  // Debug: Role badge variant
  const roleVariant = getRoleVariant(user.role);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.2 }}
      className={cn(
        "w-full max-w-md bg-white border-2 border-construction-blue rounded-xl p-4",
        "shadow-construction",
      )}
    >
      <div className="flex items-start gap-4">
        {/* Debug: Avatar with online indicator */}
        <div className="relative shrink-0">
          <Avatar className="h-12 w-12 border-2 border-construction-blue shadow-md">
            <AvatarImage src={user.avatar_url || undefined} />
            <AvatarFallback className="bg-gradient-to-br from-construction-blue to-construction-blue/80 text-white font-black">
              {getInitials(user.name)}
            </AvatarFallback>
          </Avatar>

          {/* Debug: Online presence indicator */}
          {user.is_online !== undefined && (
            <div
              className={cn(
                "absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-white",
                user.is_online ? "bg-construction-green" : "bg-gray-400",
              )}
              title={user.is_online ? "Online" : "Offline"}
            />
          )}
        </div>

        {/* Debug: User details */}
        <div className="flex-1 min-w-0">
          <h3 className="text-base font-black text-construction-blue mb-1">
            {user.name}
          </h3>

          {/* Debug: Email */}
          <div className="flex items-center gap-2 mb-2">
            <Mail className="h-3.5 w-3.5 text-gray-500 shrink-0" />
            <span className="text-sm text-gray-600 truncate">{user.email}</span>
          </div>

          {/* Debug: Role badge */}
          <div className="flex items-center gap-2">
            <Briefcase className="h-3.5 w-3.5 text-gray-500 shrink-0" />
            <Badge
              className={cn(
                "text-[10px] font-bold px-2 py-0.5",
                roleVariant.bg,
                roleVariant.text,
              )}
            >
              {user.role}
            </Badge>
          </div>
        </div>

        {/* Debug: Online status text */}
        {user.is_online !== undefined && (
          <div className="flex items-center gap-1.5">
            <Circle
              className={cn(
                "h-2 w-2",
                user.is_online
                  ? "text-construction-green fill-construction-green"
                  : "text-gray-400 fill-gray-400",
              )}
            />
            <span
              className={cn(
                "text-xs font-mono font-bold",
                user.is_online ? "text-construction-green" : "text-gray-400",
              )}
            >
              {user.is_online ? "ONLINE" : "OFFLINE"}
            </span>
          </div>
        )}
      </div>
    </motion.div>
  );
}

// Debug: Helper functions

function getRoleVariant(role: string): { bg: string; text: string } {
  const variants: Record<string, { bg: string; text: string }> = {
    admin: { bg: "bg-construction-red/20", text: "text-construction-red" },
    gc: { bg: "bg-construction-blue/20", text: "text-construction-blue" },
    pm: { bg: "bg-construction-blue/20", text: "text-construction-blue" },
    foreman: {
      bg: "bg-construction-accent/20",
      text: "text-construction-accent",
    },
    worker: { bg: "bg-gray-200", text: "text-gray-700" },
    sub: { bg: "bg-construction-yellow/20", text: "text-construction-yellow" },
    client: { bg: "bg-construction-green/20", text: "text-construction-green" },
    member: { bg: "bg-gray-200", text: "text-gray-700" },
  };

  return variants[role.toLowerCase()] || variants.member;
}
