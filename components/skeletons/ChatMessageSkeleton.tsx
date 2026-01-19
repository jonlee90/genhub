/**
 * ChatMessageSkeleton Component
 *
 * Loading placeholder for chat messages.
 * Supports both individual messages and lists.
 *
 * Features:
 * - Avatar + message bubble layout
 * - Alternating left/right alignment
 * - Timestamp placeholder
 * - Shimmer effect with animate-pulse
 * - Accessible with ARIA labels
 */

import { cn } from '@/lib/utils';

interface ChatMessageSkeletonProps {
  /** Align message to right (sent by current user) */
  isOwn?: boolean;
  /** Additional className */
  className?: string;
}

export function ChatMessageSkeleton({
  isOwn = false,
  className,
}: ChatMessageSkeletonProps) {
  return (
    <div
      role="status"
      aria-label="Loading message"
      className={cn(
        'flex gap-3 animate-pulse',
        isOwn ? 'flex-row-reverse' : 'flex-row',
        className
      )}
    >
      {/* Avatar skeleton */}
      <div className="w-8 h-8 bg-gray-200 rounded-full shrink-0" />

      {/* Message content */}
      <div className={cn('flex-1 max-w-[70%] space-y-2', isOwn && 'items-end')}>
        {/* Sender name (only for others' messages) */}
        {!isOwn && <div className="h-3 w-24 bg-gray-200 rounded" />}

        {/* Message bubble */}
        <div
          className={cn(
            'rounded-2xl p-3 space-y-2',
            isOwn
              ? 'bg-gray-200 rounded-br-sm ml-auto'
              : 'bg-gray-100 rounded-bl-sm'
          )}
        >
          <div className="h-4 w-full bg-gray-300 rounded" />
          <div className="h-4 w-3/4 bg-gray-300 rounded" />
        </div>

        {/* Timestamp */}
        <div
          className={cn(
            'h-2.5 w-16 bg-gray-200 rounded',
            isOwn && 'ml-auto'
          )}
        />
      </div>
    </div>
  );
}

/**
 * ChatMessageListSkeleton Component
 *
 * Renders multiple message skeletons with alternating alignment
 */
interface ChatMessageListSkeletonProps {
  /** Number of messages to show (default: 5) */
  count?: number;
  /** Additional className */
  className?: string;
}

export function ChatMessageListSkeleton({
  count = 5,
  className,
}: ChatMessageListSkeletonProps) {
  return (
    <div
      role="status"
      aria-label="Loading chat messages"
      className={cn('space-y-4', className)}
    >
      {Array.from({ length: count }).map((_, i) => (
        <ChatMessageSkeleton key={i} isOwn={i % 3 === 0} />
      ))}
    </div>
  );
}

/**
 * ChatRoomSkeleton Component
 *
 * Complete chat room loading state
 */
export function ChatRoomSkeleton() {
  return (
    <div className="flex flex-col h-full">
      {/* Header skeleton */}
      <div className="border-b border-gray-200 p-4 bg-white animate-pulse">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gray-200 rounded-full" />
          <div className="flex-1 space-y-2">
            <div className="h-4 w-32 bg-gray-200 rounded" />
            <div className="h-3 w-24 bg-gray-200 rounded" />
          </div>
          <div className="w-8 h-8 bg-gray-200 rounded" />
        </div>
      </div>

      {/* Messages list */}
      <div className="flex-1 overflow-y-auto p-4">
        <ChatMessageListSkeleton count={8} />
      </div>

      {/* Input skeleton */}
      <div className="border-t border-gray-200 p-4 bg-white animate-pulse">
        <div className="flex items-center gap-2">
          <div className="flex-1 h-12 bg-gray-200 rounded-xl" />
          <div className="w-12 h-12 bg-gray-200 rounded-xl" />
        </div>
      </div>
    </div>
  );
}

/**
 * ChatRoomListSkeleton Component
 *
 * Skeleton for chat room list (sidebar)
 */
interface ChatRoomListSkeletonProps {
  count?: number;
  className?: string;
}

export function ChatRoomListSkeleton({
  count = 5,
  className,
}: ChatRoomListSkeletonProps) {
  return (
    <div
      role="status"
      aria-label="Loading chat rooms"
      className={cn('space-y-1', className)}
    >
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="flex items-center gap-3 p-3 rounded-lg bg-white border border-gray-200 animate-pulse"
        >
          <div className="relative">
            <div className="w-12 h-12 bg-gray-200 rounded-full" />
            {/* Online indicator */}
            {i === 0 && (
              <div className="absolute bottom-0 right-0 w-3 h-3 bg-gray-300 rounded-full border-2 border-white" />
            )}
          </div>

          <div className="flex-1 min-w-0 space-y-2">
            <div className="flex items-center justify-between">
              <div className="h-4 w-32 bg-gray-200 rounded" />
              <div className="h-3 w-12 bg-gray-200 rounded" />
            </div>
            <div className="h-3 w-48 bg-gray-200 rounded" />
          </div>

          {/* Unread badge */}
          {i < 2 && (
            <div className="w-6 h-6 bg-gray-200 rounded-full shrink-0" />
          )}
        </div>
      ))}
    </div>
  );
}
