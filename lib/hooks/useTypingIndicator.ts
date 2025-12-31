'use client';

/**
 * useTypingIndicator - Real-time typing indicators using Supabase Broadcast
 *
 * Features:
 * - Ephemeral typing state (NO database writes)
 * - Broadcast typing start when user begins typing
 * - Auto-stop after 3 seconds of no input
 * - Subscribe to typing events from other users
 * - Auto-remove stale typing indicators after 3 second timeout
 * - Clean up subscriptions on unmount
 *
 * Technical details:
 * - Uses Supabase Realtime Broadcast channel (websocket-based)
 * - Debounced to avoid spamming the channel
 * - Handles edge cases (user navigates away while typing)
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { getBrowserClient } from '@/utils/supabase/browser';
import type { RealtimeChannel } from '@supabase/supabase-js';

// Debug: Typing user interface
export interface TypingUser {
  userId: string;
  userName: string;
}

// Debug: Broadcast payload types
interface TypingStartPayload {
  type: 'typing_start';
  userId: string;
  userName: string;
  timestamp: number;
}

interface TypingStopPayload {
  type: 'typing_stop';
  userId: string;
  timestamp: number;
}

type TypingBroadcastPayload = TypingStartPayload | TypingStopPayload;

export interface UseTypingIndicatorReturn {
  typingUsers: TypingUser[];
  startTyping: () => void;
  stopTyping: () => void;
}

interface UseTypingIndicatorOptions {
  roomId: string;
  userId: string;
  userName: string;
}

/**
 * Hook for managing typing indicators in a chat room
 *
 * @param roomId - Chat room ID
 * @param userId - Current user's ID (to filter out own typing events)
 * @param userName - Current user's name (to broadcast to others)
 *
 * @returns {UseTypingIndicatorReturn} Typing state and control functions
 *
 * @example
 * ```tsx
 * const { typingUsers, startTyping, stopTyping } = useTypingIndicator({
 *   roomId: 'room-123',
 *   userId: 'user-456',
 *   userName: 'John Doe'
 * });
 *
 * // On input change
 * <input onChange={startTyping} onBlur={stopTyping} />
 *
 * // Display typing users
 * {typingUsers.length > 0 && (
 *   <TypingIndicator users={typingUsers} />
 * )}
 * ```
 */
export function useTypingIndicator({
  roomId,
  userId,
  userName,
}: UseTypingIndicatorOptions): UseTypingIndicatorReturn {
  // Debug: State - Map of userId to typing user info with timeout
  const [typingUsers, setTypingUsers] = useState<TypingUser[]>([]);

  // Debug: Refs
  const channelRef = useRef<RealtimeChannel | null>(null);
  const supabaseRef = useRef(getBrowserClient());
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const cleanupTimersRef = useRef<Map<string, NodeJS.Timeout>>(new Map());

  console.log('[useTypingIndicator] Hook initialized for room:', roomId, 'user:', userId);

  // Debug: Clean up typing indicator for a specific user after 3 seconds
  const scheduleTypingCleanup = useCallback((typingUserId: string) => {
    console.log('[useTypingIndicator] Scheduling cleanup for user:', typingUserId);

    // Clear existing timer if any
    const existingTimer = cleanupTimersRef.current.get(typingUserId);
    if (existingTimer) {
      clearTimeout(existingTimer);
    }

    // Set new timer to remove user after 3 seconds
    const timer = setTimeout(() => {
      console.log('[useTypingIndicator] Auto-removing typing user:', typingUserId);
      setTypingUsers((prev) => prev.filter((u) => u.userId !== typingUserId));
      cleanupTimersRef.current.delete(typingUserId);
    }, 3000);

    cleanupTimersRef.current.set(typingUserId, timer);
  }, []);

  // Debug: Broadcast typing start
  const startTyping = useCallback(() => {
    console.log('[useTypingIndicator] startTyping called');

    if (!channelRef.current) {
      console.warn('[useTypingIndicator] Channel not ready, cannot broadcast');
      return;
    }

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Broadcast typing start (debounced - only if not already typing)
    const payload: TypingStartPayload = {
      type: 'typing_start',
      userId,
      userName,
      timestamp: Date.now(),
    };

    console.log('[useTypingIndicator] Broadcasting typing_start:', payload);

    channelRef.current.send({
      type: 'broadcast',
      event: 'typing',
      payload,
    });

    // Auto-stop after 3 seconds of no activity
    typingTimeoutRef.current = setTimeout(() => {
      console.log('[useTypingIndicator] Auto-stopping typing after 3s');
      stopTyping();
    }, 3000);
  }, [userId, userName]);

  // Debug: Broadcast typing stop
  const stopTyping = useCallback(() => {
    console.log('[useTypingIndicator] stopTyping called');

    if (!channelRef.current) {
      console.warn('[useTypingIndicator] Channel not ready, cannot broadcast');
      return;
    }

    // Clear timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }

    // Broadcast typing stop
    const payload: TypingStopPayload = {
      type: 'typing_stop',
      userId,
      timestamp: Date.now(),
    };

    console.log('[useTypingIndicator] Broadcasting typing_stop:', payload);

    channelRef.current.send({
      type: 'broadcast',
      event: 'typing',
      payload,
    });
  }, [userId]);

  // Debug: Setup Broadcast channel subscription
  useEffect(() => {
    console.log('[useTypingIndicator] Setting up Broadcast channel for room:', roomId);

    const supabase = supabaseRef.current;

    // Debug: Create channel with room-specific name for typing
    const channel = supabase
      .channel(`typing:${roomId}`, {
        config: {
          broadcast: { self: false }, // Don't receive own broadcasts
        },
      })
      .on('broadcast', { event: 'typing' }, (payload) => {
        console.log('[useTypingIndicator] Received broadcast:', payload);

        const data = payload.payload as TypingBroadcastPayload;

        // Debug: Ignore own events (extra safety even though self: false)
        if (data.userId === userId) {
          console.log('[useTypingIndicator] Ignoring own typing event');
          return;
        }

        if (data.type === 'typing_start') {
          console.log('[useTypingIndicator] User started typing:', data.userName);

          setTypingUsers((prev) => {
            // Check if user already in typing list
            const exists = prev.some((u) => u.userId === data.userId);
            if (exists) {
              console.log('[useTypingIndicator] User already typing, refreshing timeout');
              // User already typing, just refresh timeout
              scheduleTypingCleanup(data.userId);
              return prev;
            }

            console.log('[useTypingIndicator] Adding user to typing list');
            // Add new typing user
            scheduleTypingCleanup(data.userId);
            return [...prev, { userId: data.userId, userName: data.userName }];
          });
        } else if (data.type === 'typing_stop') {
          console.log('[useTypingIndicator] User stopped typing:', data.userId);

          // Clear cleanup timer
          const timer = cleanupTimersRef.current.get(data.userId);
          if (timer) {
            clearTimeout(timer);
            cleanupTimersRef.current.delete(data.userId);
          }

          // Remove user from typing list
          setTypingUsers((prev) => prev.filter((u) => u.userId !== data.userId));
        }
      })
      .subscribe((status, err) => {
        console.log('[useTypingIndicator] Subscription status:', status);

        if (status === 'SUBSCRIBED') {
          console.log('[useTypingIndicator] Successfully subscribed to typing channel');
        } else if (status === 'CHANNEL_ERROR') {
          console.error('[useTypingIndicator] Channel error:', err);
        } else if (status === 'CLOSED') {
          console.log('[useTypingIndicator] Channel closed');
        }
      });

    channelRef.current = channel;

    // Debug: Cleanup on unmount or room change
    return () => {
      console.log('[useTypingIndicator] Cleaning up typing channel for room:', roomId);

      // Clear typing timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = null;
      }

      // Clear all cleanup timers
      cleanupTimersRef.current.forEach((timer) => clearTimeout(timer));
      cleanupTimersRef.current.clear();

      // Unsubscribe from channel
      if (channelRef.current) {
        // Send typing_stop before leaving (edge case: user navigates away while typing)
        if (typingTimeoutRef.current) {
          const payload: TypingStopPayload = {
            type: 'typing_stop',
            userId,
            timestamp: Date.now(),
          };
          channelRef.current.send({
            type: 'broadcast',
            event: 'typing',
            payload,
          });
        }

        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }

      // Reset state
      setTypingUsers([]);
    };
  }, [roomId, userId, scheduleTypingCleanup]);

  return {
    typingUsers,
    startTyping,
    stopTyping,
  };
}
