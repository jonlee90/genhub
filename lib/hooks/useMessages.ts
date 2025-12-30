'use client';

/**
 * useMessages - Real-time message subscription hook
 *
 * Features:
 * - Subscribe to postgres_changes INSERT events filtered by chat_room_id
 * - Subscribe to UPDATE events for edit/delete handling
 * - Fetch full message with sender info on new message
 * - Optimistic UI support for immediate message display
 * - Clean up subscription on unmount
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { getBrowserClient } from '@/utils/supabase/browser';
import { getMessageById } from '@/app/actions/chat-queries';
import type { MessageWithSender } from '@/types/chat.types';
import type { RealtimeChannel, RealtimePostgresChangesPayload } from '@supabase/supabase-js';

// Debug: Message status for optimistic UI
export type MessageStatus = 'sending' | 'sent' | 'error';

// Debug: Optimistic message type
export interface OptimisticMessage extends MessageWithSender {
  _optimistic?: boolean;
  _status?: MessageStatus;
  _tempId?: string;
  _error?: string;
}

interface UseMessagesOptions {
  roomId: string;
  initialMessages?: MessageWithSender[];
  onNewMessage?: (message: MessageWithSender) => void;
  onMessageUpdate?: (message: MessageWithSender) => void;
}

interface UseMessagesReturn {
  messages: OptimisticMessage[];
  isConnected: boolean;
  connectionError: string | null;
  addOptimisticMessage: (tempMessage: OptimisticMessage) => void;
  confirmMessage: (tempId: string, realMessage: MessageWithSender) => void;
  failMessage: (tempId: string, error: string) => void;
  retryMessage: (tempId: string) => OptimisticMessage | null;
  setMessages: React.Dispatch<React.SetStateAction<OptimisticMessage[]>>;
}

export function useMessages({
  roomId,
  initialMessages = [],
  onNewMessage,
  onMessageUpdate,
}: UseMessagesOptions): UseMessagesReturn {
  // Debug: State
  const [messages, setMessages] = useState<OptimisticMessage[]>(initialMessages);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);

  // Debug: Refs for cleanup
  const channelRef = useRef<RealtimeChannel | null>(null);
  const supabaseRef = useRef(getBrowserClient());

  console.log('[useMessages] Hook initialized for room:', roomId);

  // Debug: Ref to track current messages to avoid stale closure
  const messagesRef = useRef<OptimisticMessage[]>(messages);
  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  // Debug: Handle INSERT event - new message arrived
  const handleInsert = useCallback(
    async (payload: RealtimePostgresChangesPayload<{ [key: string]: unknown }>) => {
      console.log('[useMessages] INSERT event received:', payload);

      const newRecord = payload.new as { id: string; chat_room_id: string; sender_id: string };

      if (!newRecord || !newRecord.id) {
        console.warn('[useMessages] Invalid INSERT payload');
        return;
      }

      // Debug: Check if message is from current room
      if (newRecord.chat_room_id !== roomId) {
        console.log('[useMessages] Message from different room, ignoring');
        return;
      }

      // Debug: Check if we already have this message (could be our optimistic update)
      // Use ref to access current messages without stale closure
      const alreadyExists = messagesRef.current.some((m) => m.id === newRecord.id);
      if (alreadyExists) {
        console.log('[useMessages] Message already exists, skipping fetch');
        return;
      }

      // Debug: Fetch full message with sender info
      console.log('[useMessages] Fetching full message:', newRecord.id);
      const result = await getMessageById(newRecord.id);

      if (result.message) {
        console.log('[useMessages] Got full message, adding to state');

        setMessages((prev) => {
          // Double-check it doesn't exist (race condition protection)
          const exists = prev.some((m) => m.id === result.message!.id);
          if (exists) {
            return prev;
          }
          return [...prev, result.message!];
        });

        // Debug: Trigger callback
        onNewMessage?.(result.message);
      } else {
        console.error('[useMessages] Failed to fetch message:', result.error);
      }
    },
    [roomId, onNewMessage]
  );

  // Debug: Handle UPDATE event - message edited or deleted
  const handleUpdate = useCallback(
    (payload: RealtimePostgresChangesPayload<{ [key: string]: unknown }>) => {
      console.log('[useMessages] UPDATE event received:', payload);

      const updatedRecord = payload.new as {
        id: string;
        content: string;
        edited_at: string | null;
        deleted_at: string | null;
      };

      if (!updatedRecord || !updatedRecord.id) {
        console.warn('[useMessages] Invalid UPDATE payload');
        return;
      }

      // Debug: Update message in state
      setMessages((prev) =>
        prev.map((msg) => {
          if (msg.id === updatedRecord.id) {
            console.log('[useMessages] Updating message:', updatedRecord.id);
            const updated = {
              ...msg,
              content: updatedRecord.content,
              edited_at: updatedRecord.edited_at,
              deleted_at: updatedRecord.deleted_at,
            };
            onMessageUpdate?.(updated);
            return updated;
          }
          return msg;
        })
      );
    },
    [onMessageUpdate]
  );

  // Debug: Setup realtime subscription
  useEffect(() => {
    console.log('[useMessages] Setting up realtime subscription for room:', roomId);

    const supabase = supabaseRef.current;

    // Debug: Create channel with room-specific name
    const channel = supabase
      .channel(`messages:${roomId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `chat_room_id=eq.${roomId}`,
        },
        handleInsert
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'messages',
          filter: `chat_room_id=eq.${roomId}`,
        },
        handleUpdate
      )
      .subscribe((status, err) => {
        console.log('[useMessages] Subscription status:', status, err);

        if (status === 'SUBSCRIBED') {
          setIsConnected(true);
          setConnectionError(null);
          console.log('[useMessages] Successfully subscribed to room:', roomId);
        } else if (status === 'CHANNEL_ERROR') {
          setIsConnected(false);
          setConnectionError(err?.message || 'Connection error');
          console.error('[useMessages] Channel error:', err);
        } else if (status === 'CLOSED') {
          setIsConnected(false);
          console.log('[useMessages] Channel closed');
        }
      });

    channelRef.current = channel;

    // Debug: Cleanup on unmount or room change
    return () => {
      console.log('[useMessages] Cleaning up subscription for room:', roomId);
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [roomId, handleInsert, handleUpdate]);

  // Debug: Reset messages when room changes
  useEffect(() => {
    console.log('[useMessages] Room changed, resetting messages');
    setMessages(initialMessages);
  }, [roomId]); // eslint-disable-line react-hooks/exhaustive-deps

  // Debug: Optimistic UI - Add message immediately
  const addOptimisticMessage = useCallback((tempMessage: OptimisticMessage) => {
    console.log('[useMessages] Adding optimistic message:', tempMessage._tempId);
    setMessages((prev) => [...prev, { ...tempMessage, _optimistic: true, _status: 'sending' }]);
  }, []);

  // Debug: Optimistic UI - Confirm message was sent
  const confirmMessage = useCallback((tempId: string, realMessage: MessageWithSender) => {
    console.log('[useMessages] Confirming message:', tempId, '->', realMessage.id);
    setMessages((prev) =>
      prev.map((msg) => {
        if (msg._tempId === tempId) {
          return { ...realMessage, _optimistic: false, _status: 'sent' as const };
        }
        return msg;
      })
    );
  }, []);

  // Debug: Optimistic UI - Mark message as failed
  const failMessage = useCallback((tempId: string, error: string) => {
    console.log('[useMessages] Message failed:', tempId, error);
    setMessages((prev) =>
      prev.map((msg) => {
        if (msg._tempId === tempId) {
          return { ...msg, _status: 'error' as const, _error: error };
        }
        return msg;
      })
    );
  }, []);

  // Debug: Optimistic UI - Get failed message for retry
  const retryMessage = useCallback(
    (tempId: string): OptimisticMessage | null => {
      const msg = messages.find((m) => m._tempId === tempId && m._status === 'error');
      if (msg) {
        console.log('[useMessages] Getting message for retry:', tempId);
        // Reset status to sending
        setMessages((prev) =>
          prev.map((m) => {
            if (m._tempId === tempId) {
              return { ...m, _status: 'sending' as const, _error: undefined };
            }
            return m;
          })
        );
        return msg;
      }
      return null;
    },
    [messages]
  );

  return {
    messages,
    isConnected,
    connectionError,
    addOptimisticMessage,
    confirmMessage,
    failMessage,
    retryMessage,
    setMessages,
  };
}
