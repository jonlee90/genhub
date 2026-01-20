"use client";

import { useState } from "react";
import { m as motion } from "framer-motion";
import { cn, getInitials } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MessageWithSender, EntityReference } from "@/types/db/chat";
import {
  Reply,
  Copy,
  Pencil,
  Trash2,
  Ban,
  Check,
  Loader2,
  AlertCircle,
  RefreshCw,
  Smile,
  MessageSquare,
} from "lucide-react";
import { toast } from "sonner";
import { useSession } from "next-auth/react";
import type { MessageStatus } from "@/lib/hooks/useMessages";
import { MessageReactions, MessageReactionGroup } from "./MessageReactions";
import { ReactionPicker } from "./ReactionPicker";
import { FilePreview, MessageAttachment } from "./FilePreview";
import { EntityPreview } from "./EntityPreview";
import { EditMessageForm } from "./EditMessageForm";
import { DeleteConfirmDialog } from "./DeleteConfirmDialog";
import { toggleReaction } from "@/app/actions/chat";

interface MessageItemProps {
  message: MessageWithSender;
  onReply?: (message: MessageWithSender) => void;
  onEdit?: (message: MessageWithSender) => void;
  onDelete?: (messageId: string) => void;
  onRetry?: () => void;
  onOpenThread?: (messageId: string) => void;
  reactions?: MessageReactionGroup[];
  replyCount?: number;
  attachments?: MessageAttachment[];
  onRefreshMetadata?: (messageId: string) => void;
  // Optimistic UI props
  isOptimistic?: boolean;
  status?: MessageStatus;
  error?: string;
}

// Debug: Individual message item with sender, content, and hover actions
export function MessageItem({
  message,
  onReply,
  onEdit: _onEdit,
  onDelete: _onDelete,
  onRetry,
  onOpenThread,
  reactions: reactionsProp,
  replyCount: replyCountProp,
  attachments: attachmentsProp,
  onRefreshMetadata,
  isOptimistic,
  status,
  error,
}: MessageItemProps) {
  const [showActions, setShowActions] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showReactionPicker, setShowReactionPicker] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const { data: session } = useSession();

  const reactions = reactionsProp ?? [];
  const replyCount = replyCountProp ?? 0;
  const attachments = attachmentsProp ?? [];

  console.log(
    "[MessageItem] Rendering message:",
    message.id,
    "Deleted:",
    !!message.deleted_at,
    "Optimistic:",
    isOptimistic,
    "Status:",
    status,
  );

  // Debug: Check if message is from current user
  const isOwnMessage = session?.user?.id === message.sender_id;

  // Debug: Determine if message is in a pending state
  const isSending = isOptimistic && status === "sending";
  const hasFailed = isOptimistic && status === "error";

  // Debug: Handle reaction change
  const handleReactionChange = async () => {
    console.log("[MessageItem] Reaction changed, refreshing reactions...");
    await onRefreshMetadata?.(message.id);
  };

  // Debug: Handle attachment deletion
  const handleAttachmentDelete = async () => {
    console.log("[MessageItem] Attachment deleted, refreshing attachments...");
    await onRefreshMetadata?.(message.id);
  };

  // Debug: Handle copy to clipboard
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(message.content);
      setCopied(true);
      toast.success("Message copied to clipboard");
      setTimeout(() => setCopied(false), 2000);
      console.log("[MessageItem] Copied message to clipboard");
    } catch (error) {
      console.error("[MessageItem] Failed to copy:", error);
      toast.error("Failed to copy message");
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: isSending ? 0.7 : 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className={cn(
        "group relative py-2",
        isSending && "opacity-70",
        hasFailed && "bg-red-50/50 -mx-2 px-2 rounded-lg",
      )}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      {/* Debug: Deleted message placeholder with industrial style */}
      {message.deleted_at ? (
        <div className="flex items-center gap-2 py-3 px-4 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
          <Ban className="h-4 w-4 text-gray-400" />
          <span className="text-sm text-gray-500 italic font-medium">
            This message was deleted
          </span>
        </div>
      ) : (
        <div className="flex gap-3">
          {/* Debug: Avatar with construction-themed fallback */}
          <Avatar className="h-10 w-10 shrink-0 border-2 border-gray-200 shadow-sm">
            <AvatarImage src={message.sender.avatar_url || undefined} />
            <AvatarFallback className="bg-gradient-to-br from-construction-blue to-construction-blue/80 text-white text-xs font-black">
              {getInitials(message.sender.name)}
            </AvatarFallback>
          </Avatar>

          {/* Debug: Content */}
          <div className="flex-1 min-w-0">
            {/* Header: Sender name + Timestamp + Edited indicator */}
            <div className="flex items-baseline gap-2 mb-1">
              <span className="text-sm font-black text-construction-blue">
                {message.sender.name}
              </span>
              <span className="text-[10px] font-mono text-gray-500 tracking-tight">
                {formatMessageTime(message.created_at)}
              </span>
              {message.edited_at && (
                <span className="text-[10px] font-mono text-gray-400 italic">
                  (EDITED)
                </span>
              )}
            </div>

            {/* Debug: Reply-to preview (if replying to another message) */}
            {message.reply_to && (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="mb-2 pl-3 border-l-4 border-construction-blue/40 bg-gradient-to-r from-construction-blue/5 to-transparent rounded-r-md p-2"
              >
                <div className="flex items-center gap-1.5 mb-1">
                  <Reply className="h-3 w-3 text-construction-blue" />
                  <span className="text-xs font-bold text-construction-blue">
                    {message.reply_to.sender.name}
                  </span>
                </div>
                <p className="text-xs text-gray-600 line-clamp-2">
                  {message.reply_to.content}
                </p>
              </motion.div>
            )}

            {/* Debug: Message content with blueprint-style container or edit form */}
            <div className="relative">
              {isEditing ? (
                <EditMessageForm
                  messageId={message.id}
                  currentContent={message.content}
                  onSave={() => {
                    setIsEditing(false);
                    // Optionally refresh message data here
                  }}
                  onCancel={() => setIsEditing(false)}
                />
              ) : (
                <div
                  className={cn(
                    "text-sm whitespace-pre-wrap break-words leading-relaxed",
                    isSending && "text-gray-500",
                    hasFailed && "text-gray-800",
                    !isOptimistic && "text-gray-800",
                  )}
                >
                  {message.content}
                </div>
              )}

              {/* Debug: Optimistic UI - Sending indicator */}
              {isSending && (
                <div className="flex items-center gap-1.5 mt-1.5 text-gray-400">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  <span className="text-[10px] font-mono">SENDING...</span>
                </div>
              )}

              {/* Debug: Optimistic UI - Error state with retry */}
              {hasFailed && (
                <div className="flex items-center gap-2 mt-2 p-2 bg-red-50 border border-red-200 rounded-md">
                  <AlertCircle className="h-4 w-4 text-red-500 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <span className="text-xs font-mono font-bold text-red-700">
                      FAILED
                    </span>
                    {error && (
                      <p className="text-[10px] text-red-600 truncate">
                        {error}
                      </p>
                    )}
                  </div>
                  {onRetry && (
                    <button
                      onClick={onRetry}
                      className="flex items-center gap-1 px-2 py-1 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded transition-colors"
                    >
                      <RefreshCw className="h-3 w-3" />
                      Retry
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Debug: File attachments */}
          {attachments.length > 0 && (
            <FilePreview
              attachments={attachments}
              canDelete={isOwnMessage}
              onDelete={handleAttachmentDelete}
            />
          )}

          {/* Debug: Entity previews */}
          {message.entity_references &&
            Array.isArray(message.entity_references) &&
            message.entity_references.length > 0 && (
              <div className="space-y-3 mt-3">
                {(
                  message.entity_references as unknown as EntityReference[]
                ).map((ref, index) => (
                  <EntityPreview
                    key={`${ref.type}-${ref.id}-${index}`}
                    type={ref.type}
                    id={ref.id}
                  />
                ))}
              </div>
            )}

          {/* Debug: Reactions */}
          {reactions.length > 0 && (
            <MessageReactions
              messageId={message.id}
              reactions={reactions}
              onReactionChange={handleReactionChange}
            />
          )}

          {/* Debug: Reply count badge */}
          {replyCount > 0 && (
            <button
              onClick={() => onOpenThread?.(message.id)}
              className={cn(
                "flex items-center gap-1.5 mt-2",
                "px-2.5 py-1.5 bg-construction-blue/5 hover:bg-construction-blue/10",
                "border-2 border-construction-blue/20 hover:border-construction-blue/40",
                "rounded-lg transition-all duration-200",
                "group",
              )}
            >
              <MessageSquare className="h-3.5 w-3.5 text-construction-blue" />
              <span className="text-xs font-mono font-bold text-construction-blue">
                {replyCount} {replyCount === 1 ? "reply" : "replies"}
              </span>
            </button>
          )}

          {/* Debug: Hover actions menu with industrial stamped metal style */}
          <div className="relative">
            <motion.div
              initial={false}
              animate={{
                opacity: showActions ? 1 : 0,
                scale: showActions ? 1 : 0.95,
                y: showActions ? 0 : -5,
              }}
              transition={{ duration: 0.15 }}
              className={cn(
                "absolute top-0 right-2 flex items-center gap-0.5",
                "bg-white border-2 border-gray-200 rounded-lg shadow-lg p-1",
                "transition-opacity",
                showActions ? "pointer-events-auto" : "pointer-events-none",
              )}
            >
              {/* React button */}
              <button
                onClick={() => setShowReactionPicker(!showReactionPicker)}
                className="p-1.5 hover:bg-construction-blue/10 rounded transition-colors group/btn"
                title="React"
                aria-label="React to message"
              >
                <Smile className="h-4 w-4 text-gray-600 group-hover/btn:text-construction-blue transition-colors" />
              </button>

              {/* Reply button */}
              <button
                onClick={() => onReply?.(message)}
                className="p-1.5 hover:bg-construction-blue/10 rounded transition-colors group/btn"
                title="Reply"
                aria-label="Reply to message"
              >
                <Reply className="h-4 w-4 text-gray-600 group-hover/btn:text-construction-blue transition-colors" />
              </button>

              {/* Copy button */}
              <button
                onClick={handleCopy}
                className="p-1.5 hover:bg-construction-blue/10 rounded transition-colors group/btn"
                title="Copy"
                aria-label="Copy message to clipboard"
              >
                {copied ? (
                  <Check className="h-4 w-4 text-construction-green" />
                ) : (
                  <Copy className="h-4 w-4 text-gray-600 group-hover/btn:text-construction-blue transition-colors" />
                )}
              </button>

              {/* Edit button (only for own messages) */}
              {isOwnMessage && !isEditing && (
                <button
                  onClick={() => {
                    console.log("[MessageItem] Edit button clicked");
                    setIsEditing(true);
                    setShowActions(false);
                  }}
                  className="p-1.5 hover:bg-construction-blue/10 rounded transition-colors group/btn"
                  title="Edit"
                  aria-label="Edit message"
                >
                  <Pencil className="h-4 w-4 text-gray-600 group-hover/btn:text-construction-blue transition-colors" />
                </button>
              )}

              {/* Delete button (only for own messages) */}
              {isOwnMessage && !isEditing && (
                <button
                  onClick={() => {
                    console.log("[MessageItem] Delete button clicked");
                    setShowDeleteDialog(true);
                    setShowActions(false);
                  }}
                  className="p-1.5 hover:bg-red-50 rounded transition-colors group/btn"
                  title="Delete"
                  aria-label="Delete message"
                >
                  <Trash2 className="h-4 w-4 text-gray-600 group-hover/btn:text-red-600 transition-colors" />
                </button>
              )}
            </motion.div>

            {/* Debug: Reaction picker */}
            <ReactionPicker
              messageId={message.id}
              isOpen={showReactionPicker}
              onSelect={async (emoji) => {
                await toggleReaction(message.id, emoji);
                handleReactionChange();
              }}
              onClose={() => setShowReactionPicker(false)}
            />
          </div>
        </div>
      )}

      {/* Debug: Delete confirmation dialog */}
      <DeleteConfirmDialog
        isOpen={showDeleteDialog}
        messageId={message.id}
        onConfirm={() => {
          setShowDeleteDialog(false);
          // Optionally refresh message list here
        }}
        onCancel={() => setShowDeleteDialog(false)}
      />
    </motion.div>
  );
}

// Debug: Helper functions

// Debug: Format message time (9:45 AM, Yesterday at 3:00 PM, Dec 15 at 2:30 PM)
function formatMessageTime(timestamp: string): string {
  const date = new Date(timestamp);
  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();

  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const isYesterday = date.toDateString() === yesterday.toDateString();

  const timeStr = date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });

  if (isToday) return timeStr;
  if (isYesterday) return `YDA ${timeStr}`;

  return (
    date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    }) + ` ${timeStr}`
  );
}
