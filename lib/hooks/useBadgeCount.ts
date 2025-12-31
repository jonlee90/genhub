'use client';

import { useEffect } from 'react';
import { getBrowserClient } from '@/utils/supabase/browser';

/**
 * React hook for managing PWA app badge count
 * Updates badge to show total unread messages across all chat rooms
 * @param userId - Current user's ID
 */
export function useBadgeCount(userId: string | undefined | null) {
  useEffect(() => {
    // Debug: Check if running on client
    if (typeof window === 'undefined') {
      console.log('[useBadgeCount] Running on server, skipping');
      return;
    }

    // Debug: Check if userId is available
    if (!userId) {
      console.log('[useBadgeCount] No user ID provided, skipping');
      return;
    }

    // Debug: Check badge API support
    if (!('setAppBadge' in navigator)) {
      console.log('[useBadgeCount] Badge API not supported in this browser');
      return;
    }

    console.log('[useBadgeCount] Initializing badge count for user:', userId);

    /**
     * Calculate and update badge count
     * Counts total unread messages across all chat rooms
     */
    const updateBadge = async () => {
      console.log('[useBadgeCount] Updating badge count...');

      try {
        const supabase = getBrowserClient();

        // Get all chat participants for the user with unread counts
        const { data: participants, error } = await supabase
          .from('chat_participants')
          .select(`
            id,
            chat_room_id,
            last_read_at,
            chat_room:chat_rooms!chat_participants_chat_room_id_fkey (
              id,
              messages:messages(count)
            )
          `)
          .eq('user_id', userId);

        if (error) {
          console.error('[useBadgeCount] Error fetching participants:', error);
          return;
        }

        // Calculate total unread count
        let totalUnread = 0;

        for (const participant of participants || []) {
          // Count messages created after user's last_read_at
          const { count: unreadCount, error: countError } = await supabase
            .from('messages')
            .select('id', { count: 'exact', head: true })
            .eq('chat_room_id', participant.chat_room_id)
            .gt('created_at', participant.last_read_at || '1970-01-01')
            .neq('sender_id', userId) // Don't count own messages
            .is('deleted_at', null);

          if (!countError && unreadCount) {
            totalUnread += unreadCount;
          }
        }

        console.log('[useBadgeCount] Total unread messages:', totalUnread);

        // Update badge
        if (totalUnread > 0) {
          await navigator.setAppBadge(totalUnread);
          console.log('[useBadgeCount] Badge set to:', totalUnread);
        } else {
          await navigator.clearAppBadge();
          console.log('[useBadgeCount] Badge cleared');
        }
      } catch (error) {
        console.error('[useBadgeCount] Error updating badge:', error);
      }
    };

    // Update badge immediately
    updateBadge();

    // Subscribe to real-time updates
    console.log('[useBadgeCount] Subscribing to real-time updates...');

    const supabase = getBrowserClient();

    const channel = supabase
      .channel('badge-count')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'chat_participants',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          console.log('[useBadgeCount] Chat participants changed:', payload);
          updateBadge();
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
        },
        (payload) => {
          console.log('[useBadgeCount] New message received:', payload);
          updateBadge();
        }
      )
      .subscribe();

    // Cleanup on unmount
    return () => {
      console.log('[useBadgeCount] Cleaning up badge count subscription');
      supabase.removeChannel(channel);
    };
  }, [userId]);
}
