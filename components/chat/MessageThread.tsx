'use client';

/**
 * MessageThread - Threaded replies panel
 *
 * Features:
 * - Display parent message at top
 * - List all replies chronologically below
 * - Include MessageInput at bottom for adding replies
 * - Close button to return to main chat
 * - Construction-themed design
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { X, MessageSquare, Loader2 } from 'lucide-react';
import { MessageItem } from './MessageItem';
import { MessageInput } from './MessageInput';
import { getThreadMessages } from '@/app/actions/chat';
import type { MessageWithSender } from '@/types/chat.types';

interface MessageThreadProps {
  parentMessageId: string;
  onClose: () => void;
  userId: string;
  userName: string;
  addOptimisticMessage: (message: any) => void;
  confirmMessage: (tempId: string, realMessage: MessageWithSender) => void;
  failMessage: (tempId: string, error: string) => void;
}

// Debug: Thread panel component
export function MessageThread({
  parentMessageId,
  onClose,
  userId,
  userName,
  addOptimisticMessage,
  confirmMessage,
  failMessage,
}: MessageThreadProps) {
  const [parentMessage, setParentMessage] = useState<MessageWithSender | null>(null);
  const [replies, setReplies] = useState<MessageWithSender[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  console.log('[MessageThread] Rendering thread for parent:', parentMessageId);

  // Debug: Fetch thread messages
  useEffect(() => {
    async function loadThread() {
      console.log('[MessageThread] Loading thread messages...');
      setIsLoading(true);
      setError(null);

      const result = await getThreadMessages(parentMessageId);

      if (result.success) {
        console.log('[MessageThread] Thread loaded:', result.replies?.length, 'replies');
        setParentMessage(result.parentMessage as unknown as MessageWithSender);
        setReplies(result.replies as unknown as MessageWithSender[]);
      } else {
        console.error('[MessageThread] Failed to load thread:', result.error);
        setError(result.error || 'Failed to load thread');
      }

      setIsLoading(false);
    }

    loadThread();
  }, [parentMessageId]);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', damping: 30, stiffness: 300 }}
        className={cn(
          'fixed inset-y-0 right-0 z-50',
          'w-full md:w-[500px] lg:w-[600px]',
          'bg-white border-l-4 border-construction-blue',
          'shadow-construction-lg',
          'flex flex-col'
        )}
      >
        {/* Debug: Header */}
        <div className="shrink-0 flex items-center justify-between px-4 py-3 bg-gradient-to-r from-construction-blue to-construction-blue/90 text-white border-b-2 border-construction-blue/50">
          <div className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            <h2 className="text-sm font-black uppercase tracking-wide">
              Thread
            </h2>
            {!isLoading && replies.length > 0 && (
              <span className="text-xs font-mono bg-white/20 px-2 py-0.5 rounded-full">
                {replies.length} {replies.length === 1 ? 'reply' : 'replies'}
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-white/20 rounded-lg transition-colors"
            aria-label="Close thread"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Debug: Loading state */}
        {isLoading && (
          <div className="flex-1 flex items-center justify-center">
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="h-8 w-8 text-construction-blue animate-spin" />
              <p className="text-sm font-mono text-gray-500">Loading thread...</p>
            </div>
          </div>
        )}

        {/* Debug: Error state */}
        {error && !isLoading && (
          <div className="flex-1 flex items-center justify-center p-6">
            <div className="text-center space-y-2">
              <div className="w-12 h-12 mx-auto bg-red-100 rounded-full flex items-center justify-center">
                <X className="h-6 w-6 text-red-600" />
              </div>
              <p className="text-sm font-bold text-red-700">Failed to load thread</p>
              <p className="text-xs text-red-600">{error}</p>
            </div>
          </div>
        )}

        {/* Debug: Thread content */}
        {!isLoading && !error && parentMessage && (
          <>
            {/* Parent message */}
            <div className="shrink-0 border-b-4 border-gray-200 bg-gray-50 p-4">
              <div className="mb-2 flex items-center gap-2">
                <div className="h-1 w-8 bg-construction-blue rounded-full" />
                <span className="text-[10px] font-black uppercase tracking-wider text-construction-blue">
                  Original Message
                </span>
              </div>
              <MessageItem message={parentMessage} />
            </div>

            {/* Replies */}
            <div className="flex-1 overflow-y-auto p-4 space-y-1">
              {replies.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-3">
                    <MessageSquare className="h-8 w-8 text-gray-400" />
                  </div>
                  <p className="text-sm font-bold text-gray-700 mb-1">No replies yet</p>
                  <p className="text-xs text-gray-500 max-w-[200px]">
                    Be the first to reply to this message
                  </p>
                </div>
              ) : (
                <>
                  <div className="mb-3 flex items-center gap-2">
                    <div className="h-1 w-8 bg-construction-blue/40 rounded-full" />
                    <span className="text-[10px] font-black uppercase tracking-wider text-gray-500">
                      {replies.length} {replies.length === 1 ? 'Reply' : 'Replies'}
                    </span>
                  </div>
                  {replies.map((reply) => (
                    <MessageItem key={reply.id} message={reply} />
                  ))}
                </>
              )}
            </div>

            {/* Input for new reply */}
            <div className="shrink-0">
              <MessageInput
                chatRoomId={parentMessage.chat_room_id}
                replyTo={parentMessage}
                onCancelReply={onClose}
                userId={userId}
                userName={userName}
                addOptimisticMessage={addOptimisticMessage}
                confirmMessage={confirmMessage}
                failMessage={failMessage}
              />
            </div>
          </>
        )}
      </motion.div>
    </AnimatePresence>
  );
}
