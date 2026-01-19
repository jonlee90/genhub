"use client";

/**
 * SearchMessages - Message search component with blueprint-inspired design
 *
 * Features:
 * - Modal search interface with construction-themed styling
 * - Real-time search with highlighted results
 * - Toggle between current room and all rooms
 * - Industrial-refined aesthetic with blueprint grid overlays
 */

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn, getInitials } from "@/lib/utils";
import { Search, X, MessageSquare, Hash, Users, Loader2 } from "lucide-react";
import { searchMessages } from "@/app/actions/chat-search";
import { useRouter } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";
import DOMPurify from "dompurify";

interface SearchMessagesProps {
  isOpen: boolean;
  onClose: () => void;
  currentRoomId?: string;
  currentRoomName?: string;
}

interface SearchResultItem {
  id: string;
  content: string;
  snippet: string; // Snippet with <mark> tags for highlights
  sender: {
    id: string;
    name: string;
    avatar_url: string | null;
  };
  chatRoom: {
    id: string;
    name: string;
    type: string;
    project_id: string | null;
  };
  created_at: string;
  entityReferences: any[];
}

// Debug: Main search component with industrial stamped metal modal
export function SearchMessages({
  isOpen,
  onClose,
  currentRoomId,
  currentRoomName,
}: SearchMessagesProps) {
  const [query, setQuery] = useState("");
  const [searchScope, setSearchScope] = useState<"room" | "all">("room");
  const [results, setResults] = useState<SearchResultItem[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const router = useRouter();

  console.log("[SearchMessages] Rendering:", {
    isOpen,
    currentRoomId,
    searchScope,
    resultsCount: results.length,
  });

  // Debug: Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setQuery("");
      setResults([]);
      setSearchScope("room");
    }
  }, [isOpen]);

  // Debug: Debounced search
  useEffect(() => {
    if (!query.trim() || query.length < 2) {
      setResults([]);
      return;
    }

    const timeoutId = setTimeout(async () => {
      await handleSearch();
    }, 300); // Debounce 300ms

    return () => clearTimeout(timeoutId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, searchScope]);

  // Debug: Perform search via server action
  const handleSearch = useCallback(async () => {
    if (!query.trim() || query.length < 2) return;

    console.log("[SearchMessages] Searching:", {
      query,
      searchScope,
      currentRoomId,
    });
    setIsSearching(true);

    try {
      const result = await searchMessages(
        query,
        searchScope === "room" ? currentRoomId : undefined,
      );

      if (result.success && result.results) {
        console.log("[SearchMessages] Found results:", result.results.length);
        setResults(result.results as SearchResultItem[]);
      } else {
        console.error("[SearchMessages] Search failed:", result.error);
        toast.error(result.error || "Search failed");
        setResults([]);
      }
    } catch (error) {
      console.error("[SearchMessages] Search error:", error);
      toast.error("An error occurred while searching");
      setResults([]);
    } finally {
      setIsSearching(false);
    }
  }, [query, searchScope, currentRoomId]);

  // Debug: Navigate to message in context
  const handleResultClick = (result: SearchResultItem) => {
    console.log("[SearchMessages] Navigating to message:", result.id);
    router.push(`/app/chat?room=${result.chatRoom.id}&highlight=${result.id}`);
    onClose();
  };

  // Debug: Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Debug: Backdrop with blueprint grid overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-construction-blue/20 backdrop-blur-md z-50"
            style={{
              backgroundImage: `
                linear-gradient(rgba(0,27,81,0.03) 1px, transparent 1px),
                linear-gradient(90deg, rgba(0,27,81,0.03) 1px, transparent 1px)
              `,
              backgroundSize: "24px 24px",
            }}
          />

          {/* Debug: Search modal with industrial stamped metal design */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            onClick={(e) => e.stopPropagation()}
            className={cn(
              "fixed top-[10%] left-1/2 -translate-x-1/2 z-50",
              "w-full max-w-2xl mx-auto",
              "bg-white rounded-xl shadow-construction-xl",
              "border-4 border-construction-blue/20",
              "overflow-hidden",
            )}
          >
            {/* Debug: Header with stamped metal style */}
            <div className="relative bg-gradient-to-r from-construction-blue to-construction-blue/90 px-6 py-4 border-b-4 border-construction-yellow/60">
              {/* Blueprint grid overlay on header */}
              <div
                className="absolute inset-0 opacity-10"
                style={{
                  backgroundImage: `
                    linear-gradient(white 1px, transparent 1px),
                    linear-gradient(90deg, white 1px, transparent 1px)
                  `,
                  backgroundSize: "16px 16px",
                }}
              />

              <div className="relative flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white/10 rounded-lg backdrop-blur-sm">
                    <Search className="h-5 w-5 text-white" />
                  </div>
                  <h2 className="text-lg font-black text-white tracking-tight uppercase">
                    Search Messages
                  </h2>
                </div>

                <button
                  onClick={onClose}
                  className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                  aria-label="Close search"
                >
                  <X className="h-5 w-5 text-white" />
                </button>
              </div>
            </div>

            {/* Debug: Search input with industrial style */}
            <div className="p-6 border-b-2 border-gray-100">
              <div className="relative">
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search messages..."
                  autoFocus
                  className={cn(
                    "w-full px-4 py-3 pl-12 pr-4",
                    "bg-gray-50 border-2 border-gray-200",
                    "rounded-lg font-medium text-gray-900",
                    "focus:outline-none focus:ring-4 focus:ring-construction-blue/20 focus:border-construction-blue",
                    "transition-all duration-200",
                    "placeholder:text-gray-400 placeholder:font-normal",
                  )}
                />
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />

                {isSearching && (
                  <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-construction-blue animate-spin" />
                )}
              </div>

              {/* Debug: Search scope toggle with stamped buttons */}
              {currentRoomId && (
                <div className="flex gap-2 mt-4">
                  <button
                    onClick={() => setSearchScope("room")}
                    className={cn(
                      "flex-1 px-4 py-2 rounded-lg font-bold text-sm uppercase tracking-wide",
                      "border-2 transition-all duration-200",
                      searchScope === "room"
                        ? "bg-construction-blue text-white border-construction-blue shadow-md"
                        : "bg-white text-gray-700 border-gray-200 hover:border-construction-blue/40 hover:bg-gray-50",
                    )}
                  >
                    <Hash className="inline-block h-4 w-4 mr-1.5 -mt-0.5" />
                    {currentRoomName || "This Room"}
                  </button>

                  <button
                    onClick={() => setSearchScope("all")}
                    className={cn(
                      "flex-1 px-4 py-2 rounded-lg font-bold text-sm uppercase tracking-wide",
                      "border-2 transition-all duration-200",
                      searchScope === "all"
                        ? "bg-construction-blue text-white border-construction-blue shadow-md"
                        : "bg-white text-gray-700 border-gray-200 hover:border-construction-blue/40 hover:bg-gray-50",
                    )}
                  >
                    <MessageSquare className="inline-block h-4 w-4 mr-1.5 -mt-0.5" />
                    All Rooms
                  </button>
                </div>
              )}
            </div>

            {/* Debug: Results list with blueprint-style dividers */}
            <div className="max-h-[400px] overflow-y-auto scrollbar-hide">
              {query.length > 0 && query.length < 2 && (
                <div className="p-8 text-center">
                  <p className="text-sm text-gray-500 font-mono">
                    Type at least 2 characters to search
                  </p>
                </div>
              )}

              {query.length >= 2 && results.length === 0 && !isSearching && (
                <div className="p-8 text-center">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-3">
                    <Search className="h-8 w-8 text-gray-400" />
                  </div>
                  <p className="text-sm font-bold text-gray-900">
                    No results found
                  </p>
                  <p className="text-xs text-gray-500 mt-1 font-mono">
                    Try different keywords
                  </p>
                </div>
              )}

              {results.length > 0 && (
                <div className="divide-y-2 divide-dashed divide-gray-100">
                  {results.map((result, index) => (
                    <SearchResultItem
                      key={result.id}
                      result={result}
                      onClick={() => handleResultClick(result)}
                      index={index}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Debug: Footer with result count */}
            {results.length > 0 && (
              <div className="px-6 py-3 bg-gray-50 border-t-2 border-gray-200">
                <p className="text-xs font-mono text-gray-600">
                  <span className="font-bold text-construction-blue">
                    {results.length}
                  </span>{" "}
                  result{results.length !== 1 ? "s" : ""} found
                </p>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// Debug: Individual search result item with industrial card design
interface SearchResultItemProps {
  result: SearchResultItem;
  onClick: () => void;
  index: number;
}

function SearchResultItem({ result, onClick, index }: SearchResultItemProps) {
  console.log("[SearchResultItem] Rendering:", result.id);

  return (
    <motion.button
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05 }}
      onClick={onClick}
      className={cn(
        "w-full px-6 py-4 text-left",
        "hover:bg-construction-blue/5 transition-all duration-200",
        "border-l-4 border-transparent hover:border-construction-yellow",
        "group",
      )}
    >
      <div className="flex gap-3">
        {/* Debug: Sender avatar */}
        <Avatar className="h-10 w-10 shrink-0 border-2 border-gray-200 group-hover:border-construction-blue transition-colors">
          <AvatarImage src={result.sender.avatar_url || undefined} />
          <AvatarFallback className="bg-gradient-to-br from-construction-blue to-construction-blue/80 text-white text-xs font-black">
            {getInitials(result.sender.name)}
          </AvatarFallback>
        </Avatar>

        <div className="flex-1 min-w-0">
          {/* Debug: Sender and room info */}
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm font-black text-construction-blue">
              {result.sender.name}
            </span>
            <span className="text-xs font-mono text-gray-400">•</span>
            <div className="flex items-center gap-1.5">
              {result.chatRoom.type === "project" ? (
                <Hash className="h-3 w-3 text-gray-400" />
              ) : (
                <Users className="h-3 w-3 text-gray-400" />
              )}
              <span className="text-xs font-mono text-gray-500 truncate max-w-[200px]">
                {result.chatRoom.name}
              </span>
            </div>
          </div>

          {/* Debug: Message snippet with highlighted matches */}
          {/* SECURITY FIX (M1): Sanitize HTML to prevent XSS attacks */}
          <div
            className="text-sm text-gray-700 line-clamp-2 leading-relaxed"
            dangerouslySetInnerHTML={{
              __html: DOMPurify.sanitize(result.snippet, {
                ALLOWED_TAGS: ["mark"], // Only allow <mark> tags for highlights
                ALLOWED_ATTR: [], // No attributes allowed
              }),
            }}
          />

          {/* Debug: Timestamp */}
          <div className="mt-1.5">
            <span className="text-[10px] font-mono text-gray-400 uppercase">
              {formatMessageTime(result.created_at)}
            </span>
          </div>
        </div>
      </div>
    </motion.button>
  );
}

// Debug: Helper functions

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

  if (isToday) return `Today at ${timeStr}`;
  if (isYesterday) return `Yesterday at ${timeStr}`;

  return (
    date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    }) + ` at ${timeStr}`
  );
}
