'use client';

/**
 * MessageList - Virtualized message list with real-time updates
 *
 * Features:
 * - Virtual scrolling with @tanstack/react-virtual
 * - Real-time message subscription via useMessages hook
 * - Optimistic UI for sent messages
 * - Infinite scroll for older messages
 * - Connection status indicator
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { motion, AnimatePresence } from 'framer-motion';
import { getMessages } from '@/app/actions/chat-queries';
import { markMessagesAsRead } from '@/app/actions/chat';
import { useMessages, type OptimisticMessage } from '@/lib/hooks/useMessages';
import { MessageItem } from './MessageItem';
import { ConnectionStatus } from './ConnectionStatus';
import { MessageWithSender } from '@/types/chat.types';
import { Loader2 } from 'lucide-react';

interface MessageListProps {
  chatRoomId: string;
  onReply?: (message: MessageWithSender) => void;
  onNewMessage?: (message: MessageWithSender) => void;
}

// Debug: Virtualized message list with real-time updates
export function MessageList({ chatRoomId, onReply, onNewMessage }: MessageListProps) {
  const [initialMessages, setInitialMessages] = useState<MessageWithSender[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const prevChatRoomId = useRef<string>(chatRoomId);
  const isAtBottomRef = useRef(true);

  console.log('[MessageList] Rendering for room:', chatRoomId);

  // Debug: Load initial messages
  useEffect(() => {
    async function loadMessages() {
      // Reset if room changed
      if (prevChatRoomId.current !== chatRoomId) {
        console.log('[MessageList] Room changed, resetting');
        setInitialMessages([]);
        setNextCursor(null);
        prevChatRoomId.current = chatRoomId;
      }

      setIsLoading(true);
      console.log('[MessageList] Loading messages for room:', chatRoomId);

      const result = await getMessages(chatRoomId);

      if (result.messages) {
        // Messages come in DESC order (newest first), reverse for display (oldest first)
        const reversed = result.messages.reverse();
        console.log('[MessageList] Loaded', reversed.length, 'messages');
        setInitialMessages(reversed);
        setNextCursor(result.nextCursor || null);

        // Mark messages as read
        await markMessagesAsRead(chatRoomId);
      } else if (result.error) {
        console.error('[MessageList] Error loading messages:', result.error);
      }

      setIsLoading(false);
    }

    loadMessages();
  }, [chatRoomId]);

  // Debug: Use real-time messages hook
  const {
    messages,
    isConnected,
    connectionError,
    setMessages,
  } = useMessages({
    roomId: chatRoomId,
    initialMessages,
    onNewMessage: (message) => {
      console.log('[MessageList] New message received:', message.id);
      onNewMessage?.(message);

      // Auto-scroll to bottom if user was at bottom
      if (isAtBottomRef.current && scrollContainerRef.current) {
        setTimeout(() => {
          scrollContainerRef.current?.scrollTo({
            top: scrollContainerRef.current.scrollHeight,
            behavior: 'smooth',
          });
        }, 100);
      }

      // Mark as read
      markMessagesAsRead(chatRoomId);
    },
    onMessageUpdate: (message) => {
      console.log('[MessageList] Message updated:', message.id);
    },
  });

  // Debug: Sync initial messages to hook when they load
  useEffect(() => {
    if (initialMessages.length > 0 && !isLoading) {
      console.log('[MessageList] Syncing initial messages to hook');
      setMessages(initialMessages);
    }
  }, [initialMessages, isLoading, setMessages]);

  // Debug: Auto-scroll to bottom on initial load
  useEffect(() => {
    if (!isLoading && messages.length > 0 && scrollContainerRef.current) {
      console.log('[MessageList] Auto-scrolling to bottom');
      scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight;
    }
  }, [isLoading, messages.length]);

  // Debug: Virtualization setup with dynamic size estimation
  const rowVirtualizer = useVirtualizer({
    count: messages.length,
    getScrollElement: () => scrollContainerRef.current,
    estimateSize: (index) => {
      const message = messages[index];
      if (message?.deleted_at) return 60; // Deleted messages are shorter
      if (message?.reply_to) return 120; // Messages with replies are taller
      return 80; // Default message height
    },
    overscan: 10,
  });

  // Debug: Track if user is at bottom of scroll
  const checkIfAtBottom = useCallback(() => {
    if (!scrollContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current;
    const threshold = 100; // pixels from bottom
    isAtBottomRef.current = scrollHeight - scrollTop - clientHeight < threshold;
  }, []);

  // Debug: Infinite scroll - load older messages on scroll up
  const handleScroll = useCallback(
    async (e: React.UIEvent<HTMLDivElement>) => {
      checkIfAtBottom();
      const target = e.currentTarget;

      // Detect scroll to top (load older messages)
      if (target.scrollTop < 100 && !isLoadingMore && nextCursor) {
        console.log('[MessageList] Loading older messages, cursor:', nextCursor);
        setIsLoadingMore(true);

        const prevScrollHeight = target.scrollHeight;
        const prevScrollTop = target.scrollTop;

        const result = await getMessages(chatRoomId, nextCursor);

        if (result.messages) {
          const reversed = result.messages.reverse();
          console.log('[MessageList] Loaded', reversed.length, 'older messages');
          setMessages((prev) => [...reversed, ...prev]);
          setNextCursor(result.nextCursor || null);

          // Maintain scroll position
          setTimeout(() => {
            if (scrollContainerRef.current) {
              const newScrollHeight = scrollContainerRef.current.scrollHeight;
              scrollContainerRef.current.scrollTop =
                prevScrollTop + (newScrollHeight - prevScrollHeight);
            }
          }, 0);
        }

        setIsLoadingMore(false);
      }
    },
    [chatRoomId, nextCursor, isLoadingMore, checkIfAtBottom, setMessages]
  );

  // Debug: Determine connection state for UI
  const connectionState = isConnected
    ? 'connected'
    : connectionError
      ? 'disconnected'
      : 'connecting';

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-white">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
          className="text-center"
        >
          <Loader2 className="h-8 w-8 animate-spin text-construction-blue mx-auto mb-3" />
          <p className="text-sm font-mono text-gray-500">LOADING_MESSAGES...</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-hidden relative bg-white">
      {/* Debug: Connection status indicator */}
      <AnimatePresence>
        {connectionState !== 'connected' && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="absolute top-2 left-1/2 -translate-x-1/2 z-20"
          >
            <ConnectionStatus state={connectionState} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Debug: Loading spinner at top when loading more */}
      <AnimatePresence>
        {isLoadingMore && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="absolute top-4 left-1/2 -translate-x-1/2 z-20"
          >
            <div className="flex items-center gap-2 bg-white border-2 border-construction-blue/20 rounded-lg px-4 py-2 shadow-lg">
              <Loader2 className="h-4 w-4 animate-spin text-construction-blue" />
              <span className="text-xs font-mono font-bold text-construction-blue">
                LOADING...
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Debug: Scrollable container with blueprint grid */}
      <div
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className="h-full overflow-y-auto px-4 py-4 relative"
        style={{
          backgroundImage:
            'linear-gradient(rgba(0,27,81,0.015) 1px, transparent 1px), linear-gradient(90deg, rgba(0,27,81,0.015) 1px, transparent 1px)',
          backgroundSize: '20px 20px',
        }}
      >
        {messages.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center h-full text-center"
          >
            <div className="w-16 h-16 rounded-full bg-gray-100 border-2 border-dashed border-gray-300 flex items-center justify-center mb-4">
              <span className="text-2xl">💬</span>
            </div>
            <h3 className="text-sm font-bold text-gray-900 mb-1">No Messages Yet</h3>
            <p className="text-xs text-gray-500 max-w-[250px]">
              Start the conversation by sending the first message.
            </p>
          </motion.div>
        ) : (
          <div
            style={{
              height: `${rowVirtualizer.getTotalSize()}px`,
              position: 'relative',
            }}
          >
            {rowVirtualizer.getVirtualItems().map((virtualItem) => {
              const message = messages[virtualItem.index] as OptimisticMessage;

              return (
                <div
                  key={message._tempId || virtualItem.key}
                  data-index={virtualItem.index}
                  ref={rowVirtualizer.measureElement}
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    transform: `translateY(${virtualItem.start}px)`,
                  }}
                >
                  <MessageItem
                    message={message}
                    onReply={onReply}
                    isOptimistic={message._optimistic}
                    status={message._status}
                    error={message._error}
                  />
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
