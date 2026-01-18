"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { sendMessage } from "@/app/actions/chat";
import { MessageWithSender, EntityReference } from "@/types/db/chat";
import { Reply, X, Send, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { FileUploader } from "./FileUploader";
import { useTypingIndicator } from "@/lib/hooks/useTypingIndicator";
import { EntityAutocomplete } from "./EntityAutocomplete";
import { EntityMention } from "./EntityMention";

interface MessageInputProps {
  chatRoomId: string;
  replyTo?: MessageWithSender | null;
  onCancelReply?: () => void;
  userId: string;
  userName: string;
  // Optimistic UI functions
  addOptimisticMessage: (message: any) => void;
  confirmMessage: (tempId: string, realMessage: MessageWithSender) => void;
  failMessage: (tempId: string, error: string) => void;
}

// Debug: Message input with auto-resize textarea, @mention autocomplete, and send button
export function MessageInput({
  chatRoomId,
  replyTo,
  onCancelReply,
  userId,
  userName,
  addOptimisticMessage,
  confirmMessage,
  failMessage,
}: MessageInputProps) {
  const [content, setContent] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [pendingMessageId, setPendingMessageId] = useState<string | null>(null);
  const [entityReferences, setEntityReferences] = useState<EntityReference[]>(
    [],
  );

  // Debug: Autocomplete state
  const [showAutocomplete, setShowAutocomplete] = useState(false);
  const [autocompleteQuery, setAutocompleteQuery] = useState("");
  const [autocompletePosition, setAutocompletePosition] = useState({
    x: 0,
    y: 0,
  });
  const [atTriggerIndex, setAtTriggerIndex] = useState(-1);

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  console.log(
    "[MessageInput] Rendering for room:",
    chatRoomId,
    "Reply to:",
    replyTo?.id,
    "Entity refs:",
    entityReferences.length,
  );

  // Debug: Typing indicator hook
  const { startTyping, stopTyping } = useTypingIndicator({
    roomId: chatRoomId,
    userId,
    userName,
  });

  // Debug: Auto-resize textarea on content change
  useEffect(() => {
    if (textareaRef.current) {
      // Reset height to auto to get accurate scrollHeight
      textareaRef.current.style.height = "auto";

      // Calculate new height (min 1 row, max 5 rows)
      const lineHeight = 24; // 1.5rem
      const minHeight = lineHeight;
      const maxHeight = lineHeight * 5;
      const scrollHeight = textareaRef.current.scrollHeight;

      const newHeight = Math.min(Math.max(scrollHeight, minHeight), maxHeight);
      textareaRef.current.style.height = `${newHeight}px`;

      console.log("[MessageInput] Auto-resized textarea to:", newHeight);
    }
  }, [content]);

  // Debug: Focus input on mount and when reply changes
  useEffect(() => {
    textareaRef.current?.focus();
  }, [replyTo]);

  // Debug: Detect @ trigger and show autocomplete
  useEffect(() => {
    if (!textareaRef.current) return;

    const textarea = textareaRef.current;
    const cursorPosition = textarea.selectionStart;
    const textBeforeCursor = content.slice(0, cursorPosition);

    // Find last @ symbol before cursor
    const lastAtIndex = textBeforeCursor.lastIndexOf("@");

    // Check if we should show autocomplete
    if (lastAtIndex !== -1 && lastAtIndex < cursorPosition) {
      const textAfterAt = textBeforeCursor.slice(lastAtIndex + 1);

      // Show autocomplete if:
      // 1. @ is at start OR preceded by whitespace
      // 2. No whitespace after @ (query is continuous)
      const charBeforeAt =
        lastAtIndex > 0 ? textBeforeCursor[lastAtIndex - 1] : " ";
      const isValidTrigger = /\s/.test(charBeforeAt) || lastAtIndex === 0;
      const hasWhitespace = /\s/.test(textAfterAt);

      if (isValidTrigger && !hasWhitespace) {
        console.log("[MessageInput] Detected @ trigger, query:", textAfterAt);

        // Calculate autocomplete position
        const rect = textarea.getBoundingClientRect();
        const lineHeight = 24; // Approximate line height
        const lines = textBeforeCursor.split("\n").length;
        const yOffset = (lines - 1) * lineHeight;

        setAtTriggerIndex(lastAtIndex);
        setAutocompleteQuery(textAfterAt);
        setAutocompletePosition({
          x: rect.left + 16, // Offset by padding
          y: rect.top - yOffset - 300, // Above input, adjusted for scroll
        });
        setShowAutocomplete(true);
      } else {
        setShowAutocomplete(false);
      }
    } else {
      setShowAutocomplete(false);
    }
  }, [content]);

  // Debug: Handle input change with typing indicator
  const handleContentChange = (newContent: string) => {
    setContent(newContent);

    // Start typing indicator if content is not empty
    if (newContent.trim()) {
      startTyping();
    } else {
      stopTyping();
    }
  };

  // Debug: Handle entity selection from autocomplete
  const handleEntitySelect = (entity: {
    type: any;
    id: string;
    displayName: string;
  }) => {
    console.log("[MessageInput] Entity selected:", entity);

    // Replace @trigger text with formatted token
    const beforeTrigger = content.slice(0, atTriggerIndex);
    const afterCursor = content.slice(
      textareaRef.current?.selectionStart || content.length,
    );
    const token = `@[${entity.type}:${entity.id}:${entity.displayName}]`;

    const newContent = beforeTrigger + token + " " + afterCursor;
    setContent(newContent);

    // Add to entity references
    setEntityReferences((prev) => [
      ...prev,
      { type: entity.type, id: entity.id, displayName: entity.displayName },
    ]);

    // Close autocomplete
    setShowAutocomplete(false);

    // Focus textarea
    textareaRef.current?.focus();
  };

  // Debug: Remove entity reference
  const handleRemoveEntity = (index: number) => {
    console.log("[MessageInput] Removing entity at index:", index);
    setEntityReferences((prev) => prev.filter((_, i) => i !== index));
  };

  // Debug: Send message handler with optimistic UI
  const handleSend = async () => {
    if (!content.trim() || isSending) {
      console.log("[MessageInput] Cannot send - empty or already sending");
      return;
    }

    console.log(
      "[MessageInput] Sending message, length:",
      content.length,
      "Entity refs:",
      entityReferences.length,
    );
    setIsSending(true);

    // Stop typing indicator
    stopTyping();

    // Generate temporary ID for optimistic message
    const tempId = `temp-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    console.log(
      "[MessageInput] Creating optimistic message with tempId:",
      tempId,
    );

    // Create optimistic message
    const optimisticMessage = {
      id: tempId,
      chat_room_id: chatRoomId,
      sender_id: userId,
      content: content.trim(),
      created_at: new Date().toISOString(),
      edited_at: null,
      deleted_at: null,
      reply_to_id: replyTo?.id || null,
      entity_references: entityReferences || [],
      sender: {
        id: userId,
        name: userName,
        email: "",
        avatar_url: null,
      },
      _optimistic: true,
      _status: "sending" as const,
      _tempId: tempId,
    };

    // Add to UI immediately
    addOptimisticMessage(optimisticMessage);

    // Clear input immediately for better UX
    const messageContent = content.trim();
    const messageReplyTo = replyTo;
    const messageEntityRefs = entityReferences;

    setContent("");
    setEntityReferences([]);
    onCancelReply?.();
    textareaRef.current?.focus();

    // Prepare FormData
    const formData = new FormData();
    formData.append("chatRoomId", chatRoomId);
    formData.append("content", messageContent);
    if (messageReplyTo) {
      formData.append("replyToId", messageReplyTo.id);
    }

    // Add entity references if any
    if (messageEntityRefs.length > 0) {
      formData.append("entityReferences", JSON.stringify(messageEntityRefs));
      console.log(
        "[MessageInput] Attaching entity references:",
        messageEntityRefs,
      );
    }

    // Send to server
    const result = await sendMessage(formData);

    if (result.success && result.message) {
      console.log(
        "[MessageInput] Message sent successfully, confirming optimistic message",
      );

      // Confirm optimistic message with real message
      confirmMessage(tempId, result.message);

      // Store message ID for file uploads
      if (result.message.id) {
        setPendingMessageId(result.message.id);
      }
    } else {
      console.error("[MessageInput] Failed to send message:", result.error);

      // Mark optimistic message as failed
      failMessage(tempId, result.error || "Failed to send message");

      toast.error(result.error || "Failed to send message");
    }

    setIsSending(false);
  };

  // Debug: Handle file upload complete
  const handleFileUpload = (attachment: any) => {
    console.log("[MessageInput] File uploaded:", attachment);
    toast.success("File attached to message");
  };

  // Debug: Handle keyboard events
  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Send on Enter (without Shift)
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
      console.log("[MessageInput] Send via Enter key");
    }
    // Shift+Enter adds newline (default behavior)
  };

  return (
    <div className="relative border-t-2 border-gray-200 bg-white p-4 shrink-0">
      {/* Debug: Autocomplete dropdown */}
      <AnimatePresence>
        {showAutocomplete && (
          <EntityAutocomplete
            query={autocompleteQuery}
            position={autocompletePosition}
            chatRoomId={chatRoomId}
            onSelect={handleEntitySelect}
            onClose={() => setShowAutocomplete(false)}
          />
        )}
      </AnimatePresence>

      {/* Debug: Reply-to preview with industrial style */}
      <AnimatePresence>
        {replyTo && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="mb-3 overflow-hidden"
          >
            <div className="flex items-start gap-2 bg-gradient-to-r from-construction-blue/5 to-transparent border-l-4 border-construction-blue rounded-r-md p-3">
              <div className="flex-1">
                <div className="flex items-center gap-1.5 mb-1">
                  <Reply className="h-3 w-3 text-construction-blue" />
                  <span className="text-xs font-black text-construction-blue uppercase tracking-wide">
                    Replying to {replyTo.sender.name}
                  </span>
                </div>
                <p className="text-xs text-gray-600 line-clamp-2">
                  {replyTo.content}
                </p>
              </div>
              <button
                onClick={onCancelReply}
                className="p-1 hover:bg-gray-200 rounded transition-colors shrink-0"
              >
                <X className="h-4 w-4 text-gray-500" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Debug: Entity mention badges */}
      {entityReferences.length > 0 && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          transition={{ duration: 0.2 }}
          className="mb-3 flex flex-wrap gap-2"
        >
          {entityReferences.map((entity, index) => (
            <EntityMention
              key={`${entity.type}-${entity.id}-${index}`}
              type={entity.type}
              id={entity.id}
              displayName={entity.displayName || ""}
              onRemove={() => handleRemoveEntity(index)}
            />
          ))}
        </motion.div>
      )}

      {/* Debug: Input area with construction-themed styling */}
      <div className="flex items-end gap-2">
        {/* File uploader */}
        {pendingMessageId && (
          <FileUploader
            messageId={pendingMessageId}
            onUploadComplete={handleFileUpload}
          />
        )}

        {/* Textarea with blueprint-inspired border */}
        <div className="flex-1 relative">
          <textarea
            ref={textareaRef}
            value={content}
            onChange={(e) => handleContentChange(e.target.value)}
            onKeyDown={handleKeyDown}
            onBlur={stopTyping}
            placeholder="Type a message..."
            disabled={isSending}
            className={cn(
              "w-full resize-none rounded-lg px-4 py-3",
              "border-2 border-gray-200",
              "focus:border-construction-blue focus:outline-none focus:ring-2 focus:ring-construction-blue/20",
              "placeholder:text-gray-400 text-sm",
              "transition-all duration-200",
              "disabled:opacity-50 disabled:cursor-not-allowed",
              // Blueprint-style subtle background pattern
              "bg-white",
            )}
            rows={1}
            style={{ minHeight: "44px", maxHeight: "120px" }}
          />
          {/* Character count with industrial monospace */}
          <div className="absolute bottom-2 right-3 text-[10px] font-mono text-gray-400 pointer-events-none">
            {content.length}/10000
          </div>
        </div>

        {/* Send button with industrial stamped metal style */}
        <motion.button
          onClick={handleSend}
          disabled={!content.trim() || isSending}
          whileTap={{ scale: content.trim() && !isSending ? 0.95 : 1 }}
          className={cn(
            "p-3 rounded-lg transition-all duration-200 font-bold",
            "shadow-[inset_0_1px_0_0_rgba(255,255,255,0.3)]",
            content.trim() && !isSending
              ? "bg-gradient-to-b from-construction-blue to-construction-blue/90 hover:from-blue-700 hover:to-blue-800 text-white shadow-lg border border-construction-blue/50"
              : "bg-gray-200 text-gray-400 cursor-not-allowed border border-gray-300",
          )}
        >
          {isSending ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <Send className="h-5 w-5" />
          )}
        </motion.button>
      </div>

      {/* Helper text with monospace industrial style */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="text-[10px] font-mono text-gray-500 mt-2"
      >
        <kbd className="px-1.5 py-0.5 bg-gray-100 border border-gray-300 rounded text-[9px] font-mono">
          ENTER
        </kbd>{" "}
        to send •{" "}
        <kbd className="px-1.5 py-0.5 bg-gray-100 border border-gray-300 rounded text-[9px] font-mono">
          SHIFT+ENTER
        </kbd>{" "}
        for new line
      </motion.p>
    </div>
  );
}
