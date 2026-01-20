"use client";

/**
 * MessageReactions - Display grouped reactions with counts
 *
 * Features:
 * - Group reactions by emoji with count (e.g., "👍 5")
 * - Highlight reactions where current user has reacted (navy blue background)
 * - Show tooltip with reactor names on hover
 * - Click reaction to toggle
 * - Construction-themed design
 */

import { m as motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { toggleReaction } from "@/app/actions/chat";
import { toast } from "sonner";
import { useState } from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export interface MessageReactionGroup {
  emoji: string;
  count: number;
  hasReacted: boolean;
  users: Array<{
    id: string;
    name: string;
    avatar_url: string | null;
  }>;
}

interface MessageReactionsProps {
  messageId: string;
  reactions: MessageReactionGroup[];
  onReactionChange?: () => void;
}

// Debug: Display reactions for a message
export function MessageReactions({
  messageId,
  reactions,
  onReactionChange,
}: MessageReactionsProps) {
  const [optimisticReactions, setOptimisticReactions] = useState(reactions);
  const [togglingEmoji, setTogglingEmoji] = useState<string | null>(null);

  console.log(
    "[MessageReactions] Rendering",
    reactions.length,
    "unique reactions for message:",
    messageId,
  );

  // Debug: Handle reaction toggle with optimistic UI
  const handleToggle = async (emoji: string, currentlyReacted: boolean) => {
    console.log(
      "[MessageReactions] Toggling reaction:",
      emoji,
      "Currently reacted:",
      currentlyReacted,
    );

    setTogglingEmoji(emoji);

    // Optimistic update
    setOptimisticReactions((prev) => {
      return prev
        .map((r) => {
          if (r.emoji === emoji) {
            return {
              ...r,
              count: currentlyReacted ? r.count - 1 : r.count + 1,
              hasReacted: !currentlyReacted,
            };
          }
          return r;
        })
        .filter((r) => r.count > 0); // Remove reactions with 0 count
    });

    // Call server action
    const result = await toggleReaction(messageId, emoji);

    if (result.success) {
      console.log(
        "[MessageReactions] Reaction toggled successfully:",
        result.action,
      );
      onReactionChange?.();
    } else {
      console.error(
        "[MessageReactions] Failed to toggle reaction:",
        result.error,
      );
      toast.error(result.error || "Failed to toggle reaction");

      // Revert optimistic update on error
      setOptimisticReactions(reactions);
    }

    setTogglingEmoji(null);
  };

  if (optimisticReactions.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-wrap items-center gap-1.5 mt-2">
      <TooltipProvider delayDuration={300}>
        {optimisticReactions.map((reaction) => (
          <Tooltip key={reaction.emoji}>
            <TooltipTrigger asChild>
              <motion.button
                onClick={() =>
                  handleToggle(reaction.emoji, reaction.hasReacted)
                }
                disabled={togglingEmoji === reaction.emoji}
                whileTap={{ scale: 0.95 }}
                whileHover={{ scale: 1.05 }}
                className={cn(
                  "group relative flex items-center gap-1.5 px-2.5 py-1",
                  "border-2 rounded-full",
                  "transition-all duration-200",
                  "hover:shadow-md disabled:opacity-60 disabled:cursor-not-allowed",
                  // User's own reaction: Navy blue background
                  reaction.hasReacted
                    ? "bg-construction-blue/10 border-construction-blue text-construction-blue"
                    : "bg-white border-gray-200 text-gray-700 hover:border-construction-blue/40",
                )}
              >
                {/* Debug: Emoji */}
                <span
                  className="text-sm leading-none"
                  role="img"
                  aria-label={reaction.emoji}
                >
                  {reaction.emoji}
                </span>

                {/* Debug: Count with industrial monospace font */}
                <span
                  className={cn(
                    "text-xs font-mono font-bold leading-none",
                    reaction.hasReacted
                      ? "text-construction-blue"
                      : "text-gray-600",
                  )}
                >
                  {reaction.count}
                </span>

                {/* Debug: Loading spinner */}
                {togglingEmoji === reaction.emoji && (
                  <div className="absolute inset-0 flex items-center justify-center bg-white/80 rounded-full">
                    <div className="w-3 h-3 border-2 border-construction-blue border-t-transparent rounded-full animate-spin" />
                  </div>
                )}
              </motion.button>
            </TooltipTrigger>

            {/* Debug: Tooltip showing reactor names */}
            <TooltipContent
              side="top"
              className="bg-construction-accent text-white border-construction-accent max-w-xs"
            >
              <div className="space-y-0.5">
                {reaction.users.slice(0, 10).map((user, _idx) => (
                  <div key={user.id} className="text-xs font-mono">
                    {user.name}
                  </div>
                ))}
                {reaction.users.length > 10 && (
                  <div className="text-xs font-mono text-gray-300">
                    and {reaction.users.length - 10} more...
                  </div>
                )}
              </div>
            </TooltipContent>
          </Tooltip>
        ))}
      </TooltipProvider>
    </div>
  );
}
