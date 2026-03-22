"use client";

import { useState, useEffect, useRef, useCallback, memo } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import MessageCircle from "lucide-react/icons/message-circle";
import Send from "lucide-react/icons/send";
import X from "lucide-react/icons/x";
import Loader2 from "lucide-react/icons/loader-2";
import { getChatHistory, sendChatMessage } from "@/app/actions/estimate-chat";
import { getBrowserClient } from "@/utils/supabase/browser";

type PlanChatSidebarProps = {
  estimateId: string;
  isOpen: boolean;
  onClose: () => void;
  onReferenceClick?: (
    pageNumber: number,
    region?: { x: number; y: number; width: number; height: number },
  ) => void;
};

type PlanReference = {
  pageNumber: number;
  region?: { x: number; y: number; width: number; height: number };
};

type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  plan_references: PlanReference[];
  created_at: string;
  created_by: string | null;
};

const SUGGESTED_PROMPTS = [
  "How many doors?",
  "Total square footage?",
  "List all electrical panels",
  "Count windows by type",
  "Show wall dimensions",
];

// Memoized message component
const MessageBubble = memo(function MessageBubble({
  message,
  onReferenceClick,
}: {
  message: ChatMessage;
  onReferenceClick?: (pageNumber: number, region?: any) => void;
}) {
  const isUser = message.role === "user";

  return (
    <div className={cn("flex mb-4", isUser ? "justify-end" : "justify-start")}>
      <div
        className={cn(
          "max-w-[85%] rounded-lg px-4 py-2",
          isUser
            ? "bg-construction-blue text-white dark:bg-construction-blue"
            : "bg-gray-100 text-gray-900 dark:bg-gray-800 dark:text-gray-100",
        )}
      >
        <p className="text-sm whitespace-pre-wrap">{message.content}</p>

        {/* References */}
        {message.plan_references && message.plan_references.length > 0 ? (
          <div className="flex flex-wrap gap-2 mt-2">
            {message.plan_references.map((ref, idx) => (
              <button
                key={idx}
                onClick={() => onReferenceClick?.(ref.pageNumber, ref.region)}
                className={cn(
                  "text-xs px-2 py-1 rounded",
                  "min-h-[32px]",
                  "bg-white/20 hover:bg-white/30",
                  "active:scale-95 transition-transform",
                  "border border-white/30",
                )}
                aria-label={`View page ${ref.pageNumber} reference`}
              >
                [Page {ref.pageNumber}, Region {String.fromCharCode(65 + idx)}]
              </button>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
});

export function PlanChatSidebar({
  estimateId,
  isOpen,
  onClose,
  onReferenceClick,
}: PlanChatSidebarProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Load chat history on mount
  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;

    async function loadHistory() {
      try {
        setIsLoading(true);
        const result = await getChatHistory(estimateId);

        if (!isMounted) return;

        if (result.success && result.data) {
          setMessages(result.data as ChatMessage[]);
        } else {
          toast.error(result.error || "Failed to load chat history");
        }
      } catch (err) {
        if (!isMounted) return;
        console.error("[PlanChatSidebar] Error loading history:", err);
        toast.error("Failed to load chat history");
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadHistory();

    return () => {
      isMounted = false;
    };
  }, [estimateId, isOpen]);

  // Realtime subscription
  useEffect(() => {
    if (!isOpen) return;

    const supabase = getBrowserClient();

    const channel = supabase
      .channel(`estimate_chat:${estimateId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "estimate_chat_messages",
          filter: `estimate_id=eq.${estimateId}`,
        },
        (payload) => {
          const newMessage = payload.new as ChatMessage;
          setMessages((prev) => [...prev, newMessage]);
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [estimateId, isOpen]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  }, [inputValue]);

  const handleSendMessage = useCallback(
    async (message: string) => {
      if (!message.trim() || isSending) return;

      const userMessage = message.trim();
      setInputValue("");
      setIsSending(true);

      try {
        const result = await sendChatMessage({
          estimateId,
          message: userMessage,
        });

        if (!result.success) {
          toast.error(result.error || "Failed to send message");
        }
      } catch (err) {
        console.error("[PlanChatSidebar] Send error:", err);
        toast.error("Failed to send message");
      } finally {
        setIsSending(false);
      }
    },
    [estimateId, isSending],
  );

  const handlePromptClick = useCallback(
    (prompt: string) => {
      handleSendMessage(prompt);
    },
    [handleSendMessage],
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSendMessage(inputValue);
      }
    },
    [inputValue, handleSendMessage],
  );

  if (!isOpen) return null;

  return (
    <>
      {/* Desktop sidebar */}
      <div
        className={cn(
          "hidden md:flex",
          "fixed right-0 top-0 bottom-0 z-50",
          "w-[320px] bg-white dark:bg-gray-900",
          "border-l border-gray-200 dark:border-gray-700",
          "flex-col",
          "transition-transform duration-300",
          isOpen ? "translate-x-0" : "translate-x-full",
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2">
            <MessageCircle className="w-5 h-5 text-construction-blue dark:text-construction-blue" />
            <h3 className="font-bold text-gray-900 dark:text-gray-100">
              Plan Chat
            </h3>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="min-h-[44px] min-w-[44px] active:scale-95"
            aria-label="Close chat"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4">
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="w-6 h-6 animate-spin text-construction-blue dark:text-construction-blue" />
            </div>
          ) : messages.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Ask questions about the plan
              </p>
            </div>
          ) : (
            <>
              {messages.map((msg) => (
                <MessageBubble
                  key={msg.id}
                  message={msg}
                  onReferenceClick={onReferenceClick}
                />
              ))}
              {isSending ? (
                <div className="flex justify-start mb-4">
                  <div className="bg-gray-100 dark:bg-gray-800 rounded-lg px-4 py-2">
                    <span className="animate-pulse">●●●</span>
                  </div>
                </div>
              ) : null}
              <div ref={messagesEndRef} />
            </>
          )}
        </div>

        {/* Suggested prompts */}
        <div className="border-t border-gray-200 dark:border-gray-700 p-3">
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {SUGGESTED_PROMPTS.map((prompt) => (
              <button
                key={prompt}
                onClick={() => handlePromptClick(prompt)}
                disabled={isSending}
                className={cn(
                  "flex-shrink-0 px-3 py-2",
                  "min-h-[44px]",
                  "text-xs bg-gray-100 dark:bg-gray-800",
                  "hover:bg-gray-200 dark:hover:bg-gray-700",
                  "active:scale-95",
                  "rounded-full transition-all",
                  "border border-gray-300 dark:border-gray-600",
                  "whitespace-nowrap",
                )}
                aria-label={`Ask: ${prompt}`}
              >
                {prompt}
              </button>
            ))}
          </div>
        </div>

        {/* Input */}
        <div className="border-t border-gray-200 dark:border-gray-700 p-4">
          <div className="flex gap-2">
            <textarea
              ref={textareaRef}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask about the plan..."
              disabled={isSending}
              className={cn(
                "flex-1 px-3 py-2",
                "min-h-[44px] max-h-[120px]",
                "text-sm resize-none",
                "bg-gray-50 dark:bg-gray-800",
                "border border-gray-300 dark:border-gray-600",
                "rounded-lg focus:outline-none focus:ring-2 focus:ring-construction-blue",
                "text-gray-900 dark:text-gray-100",
                "placeholder:text-gray-500 dark:placeholder:text-gray-400",
              )}
              aria-label="Chat message input"
              rows={1}
            />
            <Button
              onClick={() => handleSendMessage(inputValue)}
              disabled={!inputValue.trim() || isSending}
              className="min-h-[44px] min-w-[44px] active:scale-95"
              aria-label="Send message"
            >
              {isSending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile bottom sheet (simplified version) */}
      <div
        className={cn(
          "md:hidden",
          "fixed inset-0 z-50 bg-black/50",
          "transition-opacity duration-300",
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none",
        )}
        onClick={onClose}
      >
        <div
          onClick={(e) => e.stopPropagation()}
          className={cn(
            "absolute bottom-0 left-0 right-0",
            "bg-white dark:bg-gray-900",
            "rounded-t-2xl",
            "flex flex-col",
            "transition-transform duration-300",
            "pb-[env(safe-area-inset-bottom)]",
            isOpen ? "translate-y-0" : "translate-y-full",
            "max-h-[85dvh]",
          )}
        >
          {/* Handle */}
          <div className="flex justify-center pt-3 pb-2">
            <div className="w-12 h-1 bg-gray-300 dark:bg-gray-600 rounded-full" />
          </div>

          {/* Header */}
          <div className="flex items-center justify-between px-4 pb-3 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-2">
              <MessageCircle className="w-5 h-5 text-construction-blue dark:text-construction-blue" />
              <h3 className="font-bold text-gray-900 dark:text-gray-100">
                Plan Chat
              </h3>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="min-h-[44px] min-w-[44px] active:scale-95"
              aria-label="Close chat"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4">
            {isLoading ? (
              <div className="flex items-center justify-center h-full">
                <Loader2 className="w-6 h-6 animate-spin text-construction-blue dark:text-construction-blue" />
              </div>
            ) : messages.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Ask questions about the plan
                </p>
              </div>
            ) : (
              <>
                {messages.map((msg) => (
                  <MessageBubble
                    key={msg.id}
                    message={msg}
                    onReferenceClick={onReferenceClick}
                  />
                ))}
                {isSending ? (
                  <div className="flex justify-start mb-4">
                    <div className="bg-gray-100 dark:bg-gray-800 rounded-lg px-4 py-2">
                      <span className="animate-pulse">●●●</span>
                    </div>
                  </div>
                ) : null}
                <div ref={messagesEndRef} />
              </>
            )}
          </div>

          {/* Suggested prompts */}
          <div className="border-t border-gray-200 dark:border-gray-700 p-3">
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
              {SUGGESTED_PROMPTS.map((prompt) => (
                <button
                  key={prompt}
                  onClick={() => handlePromptClick(prompt)}
                  disabled={isSending}
                  className={cn(
                    "flex-shrink-0 px-3 py-2",
                    "min-h-[44px]",
                    "text-xs bg-gray-100 dark:bg-gray-800",
                    "hover:bg-gray-200 dark:hover:bg-gray-700",
                    "active:scale-95",
                    "rounded-full transition-all",
                    "border border-gray-300 dark:border-gray-600",
                    "whitespace-nowrap",
                  )}
                  aria-label={`Ask: ${prompt}`}
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>

          {/* Input */}
          <div className="border-t border-gray-200 dark:border-gray-700 p-4">
            <div className="flex gap-2">
              <textarea
                ref={textareaRef}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask about the plan..."
                disabled={isSending}
                className={cn(
                  "flex-1 px-3 py-2",
                  "min-h-[44px] max-h-[120px]",
                  "text-sm resize-none",
                  "bg-gray-50 dark:bg-gray-800",
                  "border border-gray-300 dark:border-gray-600",
                  "rounded-lg focus:outline-none focus:ring-2 focus:ring-construction-blue",
                  "text-gray-900 dark:text-gray-100",
                  "placeholder:text-gray-500 dark:placeholder:text-gray-400",
                )}
                aria-label="Chat message input"
                rows={1}
              />
              <Button
                onClick={() => handleSendMessage(inputValue)}
                disabled={!inputValue.trim() || isSending}
                className="min-h-[44px] min-w-[44px] active:scale-95"
                aria-label="Send message"
              >
                {isSending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
