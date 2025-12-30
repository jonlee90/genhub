'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { sendMessage } from '@/app/actions/chat';
import { MessageWithSender } from '@/types/chat.types';
import { Reply, X, Paperclip, Send, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface MessageInputProps {
  chatRoomId: string;
  replyTo?: MessageWithSender | null;
  onCancelReply?: () => void;
}

// Debug: Message input with auto-resize textarea and send button
export function MessageInput({ chatRoomId, replyTo, onCancelReply }: MessageInputProps) {
  const [content, setContent] = useState('');
  const [isSending, setIsSending] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  console.log('[MessageInput] Rendering for room:', chatRoomId, 'Reply to:', replyTo?.id);

  // Debug: Auto-resize textarea on content change
  useEffect(() => {
    if (textareaRef.current) {
      // Reset height to auto to get accurate scrollHeight
      textareaRef.current.style.height = 'auto';

      // Calculate new height (min 1 row, max 5 rows)
      const lineHeight = 24; // 1.5rem
      const minHeight = lineHeight;
      const maxHeight = lineHeight * 5;
      const scrollHeight = textareaRef.current.scrollHeight;

      const newHeight = Math.min(Math.max(scrollHeight, minHeight), maxHeight);
      textareaRef.current.style.height = `${newHeight}px`;

      console.log('[MessageInput] Auto-resized textarea to:', newHeight);
    }
  }, [content]);

  // Debug: Focus input on mount and when reply changes
  useEffect(() => {
    textareaRef.current?.focus();
  }, [replyTo]);

  // Debug: Send message handler
  const handleSend = async () => {
    if (!content.trim() || isSending) {
      console.log('[MessageInput] Cannot send - empty or already sending');
      return;
    }

    console.log('[MessageInput] Sending message, length:', content.length);
    setIsSending(true);

    const formData = new FormData();
    formData.append('chatRoomId', chatRoomId);
    formData.append('content', content.trim());
    if (replyTo) {
      formData.append('replyToId', replyTo.id);
    }

    const result = await sendMessage(formData);

    if (result.success) {
      console.log('[MessageInput] Message sent successfully');
      setContent('');
      onCancelReply?.();
      textareaRef.current?.focus();
      toast.success('Message sent');
    } else {
      console.error('[MessageInput] Failed to send message:', result.error);
      toast.error(result.error || 'Failed to send message');
    }

    setIsSending(false);
  };

  // Debug: Handle keyboard events
  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Send on Enter (without Shift)
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
      console.log('[MessageInput] Send via Enter key');
    }
    // Shift+Enter adds newline (default behavior)
  };

  return (
    <div className="border-t-2 border-gray-200 bg-white p-4 shrink-0">
      {/* Debug: Reply-to preview with industrial style */}
      <AnimatePresence>
        {replyTo && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
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
                <p className="text-xs text-gray-600 line-clamp-2">{replyTo.content}</p>
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

      {/* Debug: Input area with construction-themed styling */}
      <div className="flex items-end gap-2">
        {/* Attachment button (placeholder for Phase 2) */}
        <button
          className="p-2.5 hover:bg-gray-100 rounded-lg transition-colors text-gray-500 disabled:opacity-40 disabled:cursor-not-allowed"
          title="Attach file (coming soon)"
          disabled
        >
          <Paperclip className="h-5 w-5" />
        </button>

        {/* Textarea with blueprint-inspired border */}
        <div className="flex-1 relative">
          <textarea
            ref={textareaRef}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            disabled={isSending}
            className={cn(
              'w-full resize-none rounded-lg px-4 py-3',
              'border-2 border-gray-200',
              'focus:border-construction-blue focus:outline-none focus:ring-2 focus:ring-construction-blue/20',
              'placeholder:text-gray-400 text-sm',
              'transition-all duration-200',
              'disabled:opacity-50 disabled:cursor-not-allowed',
              // Blueprint-style subtle background pattern
              'bg-white'
            )}
            rows={1}
            style={{ minHeight: '44px', maxHeight: '120px' }}
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
            'p-3 rounded-lg transition-all duration-200 font-bold',
            'shadow-[inset_0_1px_0_0_rgba(255,255,255,0.3)]',
            content.trim() && !isSending
              ? 'bg-gradient-to-b from-construction-blue to-construction-blue/90 hover:from-blue-700 hover:to-blue-800 text-white shadow-lg border border-construction-blue/50'
              : 'bg-gray-200 text-gray-400 cursor-not-allowed border border-gray-300'
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
        </kbd>{' '}
        to send •{' '}
        <kbd className="px-1.5 py-0.5 bg-gray-100 border border-gray-300 rounded text-[9px] font-mono">
          SHIFT+ENTER
        </kbd>{' '}
        for new line
      </motion.p>
    </div>
  );
}
