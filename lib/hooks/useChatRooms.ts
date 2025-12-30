'use client';

/**
 * useChatRooms - Real-time room updates hook
 *
 * Features:
 * - Subscribe to changes in chat_participants for current user
 * - Update unread counts when new messages arrive
 * - Re-sort rooms by last message activity
 * - Handle room additions/removals in real-time
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { getBrowserClient } from '@/utils/supabase/browser';
import { getChatRooms } from '@/app/actions/chat-queries';
import type { ChatRoomWithUnread } from '@/types/chat.types';
import type { RealtimeChannel, RealtimePostgresChangesPayload } from '@supabase/supabase-js';

interface UseChatRoomsOptions {
  userId: string;
  companyId: string;
  initialRooms?: ChatRoomWithUnread[];
  onUnreadChange?: (roomId: string, count: number) => void;
  onNewRoom?: (room: ChatRoomWithUnread) => void;
}

interface UseChatRoomsReturn {
  rooms: ChatRoomWithUnread[];
  totalUnread: number;
  isConnected: boolean;
  connectionError: string | null;
  refreshRooms: () => Promise<void>;
  updateRoomUnread: (roomId: string, unreadCount: number) => void;
  updateRoomLastMessage: (
    roomId: string,
    lastMessage: ChatRoomWithUnread['last_message']
  ) => void;
  setRooms: React.Dispatch<React.SetStateAction<ChatRoomWithUnread[]>>;
}

export function useChatRooms({
  userId,
  companyId,
  initialRooms = [],
  onUnreadChange,
  onNewRoom,
}: UseChatRoomsOptions): UseChatRoomsReturn {
  // Debug: State
  const [rooms, setRooms] = useState<ChatRoomWithUnread[]>(initialRooms);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);

  // Debug: Refs for cleanup
  const participantsChannelRef = useRef<RealtimeChannel | null>(null);
  const messagesChannelRef = useRef<RealtimeChannel | null>(null);
  const supabaseRef = useRef(getBrowserClient());

  console.log('[useChatRooms] Hook initialized for user:', userId);

  // Debug: Calculate total unread count
  const totalUnread = rooms.reduce((sum, room) => sum + (room.unread_count || 0), 0);

  // Debug: Handle participant changes (room joined/left)
  const handleParticipantChange = useCallback(
    async (payload: RealtimePostgresChangesPayload<{ [key: string]: unknown }>) => {
      console.log('[useChatRooms] Participant change event:', payload);

      // Refresh rooms list when participant data changes
      const result = await getChatRooms();
      if (result.rooms) {
        console.log('[useChatRooms] Refreshed rooms after participant change');
        setRooms(result.rooms);

        // Debug: Notify about new rooms
        if (payload.eventType === 'INSERT') {
          const newRecord = payload.new as { chat_room_id: string };
          const newRoom = result.rooms.find((r) => r.id === newRecord.chat_room_id);
          if (newRoom) {
            onNewRoom?.(newRoom);
          }
        }
      }
    },
    [onNewRoom]
  );

  // Debug: Handle new message - update unread count and last message
  const handleNewMessage = useCallback(
    async (payload: RealtimePostgresChangesPayload<{ [key: string]: unknown }>) => {
      console.log('[useChatRooms] New message event:', payload);

      const newMessage = payload.new as {
        id: string;
        chat_room_id: string;
        content: string;
        sender_id: string;
        created_at: string;
      };

      if (!newMessage || !newMessage.chat_room_id) {
        return;
      }

      // Debug: Update room state with new message info
      setRooms((prev) => {
        const updatedRooms = prev.map((room) => {
          if (room.id === newMessage.chat_room_id) {
            // Debug: Increment unread if message is from someone else
            const incrementUnread = newMessage.sender_id !== userId;
            const newUnread = incrementUnread
              ? (room.unread_count || 0) + 1
              : room.unread_count;

            if (incrementUnread) {
              onUnreadChange?.(room.id, newUnread);
            }

            // Debug: Update last message preview (we don't have sender name here)
            // This will be properly populated on next refresh
            return {
              ...room,
              unread_count: newUnread,
              updated_at: newMessage.created_at,
            };
          }
          return room;
        });

        // Debug: Re-sort by most recent activity
        return updatedRooms.sort((a, b) => {
          const aTime = a.last_message?.created_at || a.updated_at || a.created_at;
          const bTime = b.last_message?.created_at || b.updated_at || b.created_at;
          return new Date(bTime).getTime() - new Date(aTime).getTime();
        });
      });
    },
    [userId, onUnreadChange]
  );

  // Debug: Ref to track current rooms for message filtering
  // This avoids including rooms in useEffect dependencies which would cause subscription churn
  const roomsRef = useRef<ChatRoomWithUnread[]>(rooms);
  useEffect(() => {
    roomsRef.current = rooms;
  }, [rooms]);

  // Debug: Setup realtime subscriptions
  useEffect(() => {
    if (!userId || !companyId) {
      console.log('[useChatRooms] Missing userId or companyId, skipping subscription');
      return;
    }

    console.log('[useChatRooms] Setting up realtime subscriptions');

    const supabase = supabaseRef.current;

    // Debug: Subscribe to participant changes for current user
    const participantsChannel = supabase
      .channel(`participants:${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*', // INSERT, UPDATE, DELETE
          schema: 'public',
          table: 'chat_participants',
          filter: `user_id=eq.${userId}`,
        },
        handleParticipantChange
      )
      .subscribe((status, err) => {
        console.log('[useChatRooms] Participants subscription status:', status);
        if (status === 'CHANNEL_ERROR') {
          console.error('[useChatRooms] Participants channel error:', err);
        }
      });

    participantsChannelRef.current = participantsChannel;

    // Debug: Subscribe to all messages in user's rooms
    // Using ref to access current rooms without causing subscription churn
    const messagesChannel = supabase
      .channel(`room-messages:${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
        },
        (payload) => {
          // Debug: Filter to only rooms user is in (using ref to avoid stale closure)
          const newMessage = payload.new as { chat_room_id: string };
          const isUserRoom = roomsRef.current.some((r) => r.id === newMessage.chat_room_id);
          if (isUserRoom) {
            handleNewMessage(payload);
          }
        }
      )
      .subscribe((status, err) => {
        console.log('[useChatRooms] Messages subscription status:', status);

        if (status === 'SUBSCRIBED') {
          setIsConnected(true);
          setConnectionError(null);
        } else if (status === 'CHANNEL_ERROR') {
          setIsConnected(false);
          setConnectionError(err?.message || 'Connection error');
          console.error('[useChatRooms] Messages channel error:', err);
        } else if (status === 'CLOSED') {
          setIsConnected(false);
        }
      });

    messagesChannelRef.current = messagesChannel;

    // Debug: Cleanup on unmount
    return () => {
      console.log('[useChatRooms] Cleaning up subscriptions');
      if (participantsChannelRef.current) {
        supabase.removeChannel(participantsChannelRef.current);
        participantsChannelRef.current = null;
      }
      if (messagesChannelRef.current) {
        supabase.removeChannel(messagesChannelRef.current);
        messagesChannelRef.current = null;
      }
    };
  }, [userId, companyId, handleParticipantChange, handleNewMessage]); // Removed rooms from deps

  // Debug: Refresh rooms from server
  const refreshRooms = useCallback(async () => {
    console.log('[useChatRooms] Refreshing rooms');
    const result = await getChatRooms();
    if (result.rooms) {
      setRooms(result.rooms);
    }
  }, []);

  // Debug: Update unread count for specific room
  const updateRoomUnread = useCallback((roomId: string, unreadCount: number) => {
    console.log('[useChatRooms] Updating unread for room:', roomId, 'to:', unreadCount);
    setRooms((prev) =>
      prev.map((room) => {
        if (room.id === roomId) {
          return { ...room, unread_count: unreadCount };
        }
        return room;
      })
    );
  }, []);

  // Debug: Update last message for specific room
  const updateRoomLastMessage = useCallback(
    (roomId: string, lastMessage: ChatRoomWithUnread['last_message']) => {
      console.log('[useChatRooms] Updating last message for room:', roomId);
      setRooms((prev) => {
        const updatedRooms = prev.map((room) => {
          if (room.id === roomId) {
            return { ...room, last_message: lastMessage };
          }
          return room;
        });

        // Re-sort by activity
        return updatedRooms.sort((a, b) => {
          const aTime = a.last_message?.created_at || a.updated_at || a.created_at;
          const bTime = b.last_message?.created_at || b.updated_at || b.created_at;
          return new Date(bTime).getTime() - new Date(aTime).getTime();
        });
      });
    },
    []
  );

  return {
    rooms,
    totalUnread,
    isConnected,
    connectionError,
    refreshRooms,
    updateRoomUnread,
    updateRoomLastMessage,
    setRooms,
  };
}
