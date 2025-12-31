'use client';

/**
 * usePresence - Real-time online presence tracking hook
 *
 * Features:
 * - Track online users in a room using Supabase Realtime Presence API
 * - Automatically track current user with name, avatar, and lastActive timestamp
 * - Update presence state on sync/join/leave events
 * - Set user as "away" after 5 minutes of inactivity (300000ms)
 * - Track user activity (mouse movement, keyboard events) to reset idle timer
 * - Clean up subscriptions on unmount
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { getBrowserClient } from '@/utils/supabase/browser';
import { useAuth } from '@/lib/hooks/useAuth';
import type { RealtimeChannel, RealtimePresenceState } from '@supabase/supabase-js';

// Debug: Presence user status
export type PresenceStatus = 'online' | 'away';

// Debug: User presence data
export interface PresenceUser {
  userId: string;
  userName: string;
  avatarUrl?: string;
  status: PresenceStatus;
  lastActive: number;
}

// Debug: Presence state is a map of presence keys to arrays of presence data
// Supabase can have multiple presences per key (e.g., multiple tabs)
export type PresenceState = Record<string, PresenceUser[]>;

interface UsePresenceOptions {
  roomId: string;
  onUserJoin?: (user: PresenceUser) => void;
  onUserLeave?: (userId: string) => void;
  onUserStatusChange?: (user: PresenceUser) => void;
}

interface UsePresenceReturn {
  onlineUsers: PresenceUser[];
  presenceState: PresenceState;
  isTracking: boolean;
  updateStatus: (status: PresenceStatus) => void;
}

// Debug: Idle timeout - 5 minutes
const IDLE_TIMEOUT = 300000; // 5 minutes in milliseconds

export function usePresence({
  roomId,
  onUserJoin,
  onUserLeave,
  onUserStatusChange,
}: UsePresenceOptions): UsePresenceReturn {
  // Debug: Get current user from session
  const { user } = useAuth();

  // Debug: State
  const [presenceState, setPresenceState] = useState<PresenceState>({});
  const [isTracking, setIsTracking] = useState(false);
  const [currentStatus, setCurrentStatus] = useState<PresenceStatus>('online');

  // Debug: Refs
  const supabaseRef = useRef(getBrowserClient());
  const channelRef = useRef<RealtimeChannel | null>(null);
  const idleTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastActiveRef = useRef<number>(Date.now());

  console.log('[usePresence] Hook initialized for room:', roomId);

  // Debug: Reset idle timer and update lastActive
  const resetIdleTimer = useCallback(() => {
    console.log('[usePresence] Resetting idle timer');

    lastActiveRef.current = Date.now();

    // Clear existing timer
    if (idleTimerRef.current) {
      clearTimeout(idleTimerRef.current);
    }

    // Set user back to online if they were away
    if (currentStatus === 'away') {
      console.log('[usePresence] User is active again, setting to online');
      setCurrentStatus('online');

      // Update presence with new status
      if (channelRef.current && user) {
        channelRef.current.track({
          userId: user.id,
          userName: user.name || 'Unknown User',
          avatarUrl: user.image || undefined,
          status: 'online',
          lastActive: Date.now(),
        });
      }
    }

    // Set new timer to mark user as away
    idleTimerRef.current = setTimeout(() => {
      console.log('[usePresence] User idle for 5 minutes, setting to away');
      setCurrentStatus('away');

      // Update presence with away status
      if (channelRef.current && user) {
        channelRef.current.track({
          userId: user.id,
          userName: user.name || 'Unknown User',
          avatarUrl: user.image || undefined,
          status: 'away',
          lastActive: lastActiveRef.current,
        });
      }
    }, IDLE_TIMEOUT);
  }, [currentStatus, user]);

  // Debug: Manual status update
  const updateStatus = useCallback(
    (status: PresenceStatus) => {
      console.log('[usePresence] Manually updating status to:', status);
      setCurrentStatus(status);

      if (channelRef.current && user) {
        channelRef.current.track({
          userId: user.id,
          userName: user.name || 'Unknown User',
          avatarUrl: user.image || undefined,
          status,
          lastActive: Date.now(),
        });
      }
    },
    [user]
  );

  // Debug: Setup activity listeners
  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    console.log('[usePresence] Setting up activity listeners');

    // Track mouse movement
    const handleMouseMove = () => {
      resetIdleTimer();
    };

    // Track keyboard events
    const handleKeyPress = () => {
      resetIdleTimer();
    };

    // Track clicks
    const handleClick = () => {
      resetIdleTimer();
    };

    // Track visibility changes (tab focus)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        console.log('[usePresence] Tab became visible, resetting idle timer');
        resetIdleTimer();
      }
    };

    // Add event listeners
    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    window.addEventListener('keypress', handleKeyPress, { passive: true });
    window.addEventListener('click', handleClick, { passive: true });
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Initialize idle timer
    resetIdleTimer();

    // Cleanup
    return () => {
      console.log('[usePresence] Removing activity listeners');
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('keypress', handleKeyPress);
      window.removeEventListener('click', handleClick);
      document.removeEventListener('visibilitychange', handleVisibilityChange);

      if (idleTimerRef.current) {
        clearTimeout(idleTimerRef.current);
      }
    };
  }, [resetIdleTimer]);

  // Debug: Setup presence subscription
  useEffect(() => {
    if (!user) {
      console.log('[usePresence] No user session, skipping presence setup');
      return;
    }

    console.log('[usePresence] Setting up presence for room:', roomId);

    const supabase = supabaseRef.current;

    // Debug: Create channel with room-specific name
    const channel = supabase.channel(`presence:${roomId}`, {
      config: {
        presence: {
          key: user.id, // Use user ID as presence key
        },
      },
    });

    // Debug: Handle presence sync (initial state + updates)
    channel.on('presence', { event: 'sync' }, () => {
      console.log('[usePresence] Presence sync event');

      const state = channel.presenceState<PresenceUser>();
      console.log('[usePresence] Current presence state:', state);

      setPresenceState(state as PresenceState);
    });

    // Debug: Handle user joining
    channel.on('presence', { event: 'join' }, ({ key, newPresences }) => {
      console.log('[usePresence] User joined:', key, newPresences);

      // Get first presence (in case of multiple tabs)
      const presence = newPresences[0] as PresenceUser;

      if (presence && onUserJoin) {
        onUserJoin(presence);
      }
    });

    // Debug: Handle user leaving
    channel.on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
      console.log('[usePresence] User left:', key, leftPresences);

      // Get first presence (in case of multiple tabs)
      const presence = leftPresences[0] as PresenceUser;

      if (presence && onUserLeave) {
        onUserLeave(presence.userId);
      }
    });

    // Debug: Subscribe to channel and track presence
    channel.subscribe(async (status, err) => {
      console.log('[usePresence] Subscription status:', status, err);

      if (status === 'SUBSCRIBED') {
        console.log('[usePresence] Successfully subscribed, tracking presence');

        // Track current user's presence
        await channel.track({
          userId: user.id,
          userName: user.name || 'Unknown User',
          avatarUrl: user.image || undefined,
          status: currentStatus,
          lastActive: Date.now(),
        });

        setIsTracking(true);
      } else if (status === 'CHANNEL_ERROR') {
        console.error('[usePresence] Channel error:', err);
        setIsTracking(false);
      } else if (status === 'CLOSED') {
        console.log('[usePresence] Channel closed');
        setIsTracking(false);
      }
    });

    channelRef.current = channel;

    // Debug: Cleanup on unmount or room change
    return () => {
      console.log('[usePresence] Cleaning up presence for room:', roomId);

      if (channelRef.current) {
        // Untrack before unsubscribing
        channelRef.current.untrack();
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }

      setIsTracking(false);
      setPresenceState({});
    };
  }, [roomId, user, currentStatus, onUserJoin, onUserLeave]);

  // Debug: Update presence when status changes
  useEffect(() => {
    if (!channelRef.current || !user || !isTracking) {
      return;
    }

    console.log('[usePresence] Status changed, updating presence:', currentStatus);

    channelRef.current.track({
      userId: user.id,
      userName: user.name || 'Unknown User',
      avatarUrl: user.image || undefined,
      status: currentStatus,
      lastActive: lastActiveRef.current,
    });

    // Trigger callback if provided
    if (onUserStatusChange) {
      onUserStatusChange({
        userId: user.id!,
        userName: user.name || 'Unknown User',
        avatarUrl: user.image || undefined,
        status: currentStatus,
        lastActive: lastActiveRef.current,
      });
    }
  }, [currentStatus, user, isTracking, onUserStatusChange]);

  // Debug: Flatten presence state to array of online users
  const onlineUsers = Object.values(presenceState)
    .flat()
    .filter((user, index, self) => {
      // Deduplicate by userId (in case user has multiple tabs open)
      return index === self.findIndex((u) => u.userId === user.userId);
    });

  console.log('[usePresence] Online users:', onlineUsers.length);

  return {
    onlineUsers,
    presenceState,
    isTracking,
    updateStatus,
  };
}

/**
 * Example Usage:
 *
 * ```tsx
 * 'use client';
 *
 * import { usePresence } from '@/lib/hooks/usePresence';
 *
 * export function ChatRoom({ roomId }: { roomId: string }) {
 *   const {
 *     onlineUsers,
 *     presenceState,
 *     isTracking,
 *     updateStatus,
 *   } = usePresence({
 *     roomId,
 *     onUserJoin: (user) => {
 *       console.log(`${user.userName} joined the room`);
 *     },
 *     onUserLeave: (userId) => {
 *       console.log(`User ${userId} left the room`);
 *     },
 *     onUserStatusChange: (user) => {
 *       console.log(`${user.userName} is now ${user.status}`);
 *     },
 *   });
 *
 *   return (
 *     <div>
 *       <h2>Online Users ({onlineUsers.length})</h2>
 *       <ul>
 *         {onlineUsers.map((user) => (
 *           <li key={user.userId}>
 *             {user.userName}
 *             <span>{user.status === 'online' ? '🟢' : '⚫'}</span>
 *           </li>
 *         ))}
 *       </ul>
 *     </div>
 *   );
 * }
 * ```
 */
