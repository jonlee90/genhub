'use client';

/**
 * useRealtimeConnection - Connection recovery hook with exponential backoff
 *
 * Features:
 * - Detect connection drops (CHANNEL_ERROR status)
 * - Implement exponential backoff reconnection (max 5 retries)
 * - Track connection state for UI indicators
 * - Queue messages locally during disconnection
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { getBrowserClient } from '@/utils/supabase/browser';
import type { RealtimeChannel } from '@supabase/supabase-js';

// Debug: Connection states
export type ConnectionState = 'connecting' | 'connected' | 'disconnected' | 'reconnecting';

// Debug: Queued message for offline support
export interface QueuedMessage {
  id: string;
  roomId: string;
  content: string;
  replyToId?: string;
  timestamp: number;
}

interface UseRealtimeConnectionOptions {
  channelName: string;
  maxRetries?: number;
  baseDelay?: number;
  maxDelay?: number;
  onConnect?: () => void;
  onDisconnect?: () => void;
  onReconnect?: (attempt: number) => void;
}

interface UseRealtimeConnectionReturn {
  connectionState: ConnectionState;
  retryCount: number;
  maxRetries: number;
  channel: RealtimeChannel | null;
  queuedMessages: QueuedMessage[];
  queueMessage: (message: Omit<QueuedMessage, 'id' | 'timestamp'>) => string;
  removeFromQueue: (messageId: string) => void;
  clearQueue: () => void;
  manualReconnect: () => void;
}

export function useRealtimeConnection({
  channelName,
  maxRetries = 5,
  baseDelay = 1000,
  maxDelay = 30000,
  onConnect,
  onDisconnect,
  onReconnect,
}: UseRealtimeConnectionOptions): UseRealtimeConnectionReturn {
  // Debug: State
  const [connectionState, setConnectionState] = useState<ConnectionState>('connecting');
  const [retryCount, setRetryCount] = useState(0);
  const [channel, setChannel] = useState<RealtimeChannel | null>(null);
  const [queuedMessages, setQueuedMessages] = useState<QueuedMessage[]>([]);

  // Debug: Refs
  const supabaseRef = useRef(getBrowserClient());
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const channelRef = useRef<RealtimeChannel | null>(null);

  console.log('[useRealtimeConnection] Hook initialized for channel:', channelName);

  // Debug: Calculate delay with exponential backoff
  const getBackoffDelay = useCallback(
    (attempt: number) => {
      const delay = Math.min(baseDelay * Math.pow(2, attempt), maxDelay);
      // Debug: Add jitter (0-25% of delay)
      const jitter = delay * 0.25 * Math.random();
      return Math.floor(delay + jitter);
    },
    [baseDelay, maxDelay]
  );

  // Debug: Subscribe to channel
  const subscribe = useCallback(() => {
    console.log('[useRealtimeConnection] Subscribing to channel:', channelName);
    const supabase = supabaseRef.current;

    // Debug: Clean up existing channel
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }

    setConnectionState('connecting');

    const newChannel = supabase.channel(channelName);

    newChannel.subscribe((status, err) => {
      console.log('[useRealtimeConnection] Subscription status:', status, err);

      if (status === 'SUBSCRIBED') {
        console.log('[useRealtimeConnection] Successfully connected');
        setConnectionState('connected');
        setRetryCount(0);
        setChannel(newChannel);
        onConnect?.();
      } else if (status === 'CHANNEL_ERROR') {
        console.error('[useRealtimeConnection] Connection error:', err);
        setConnectionState('disconnected');
        setChannel(null);
        onDisconnect?.();

        // Debug: Attempt reconnection with exponential backoff
        if (retryCount < maxRetries) {
          const delay = getBackoffDelay(retryCount);
          console.log(
            `[useRealtimeConnection] Will retry in ${delay}ms (attempt ${retryCount + 1}/${maxRetries})`
          );

          setConnectionState('reconnecting');
          onReconnect?.(retryCount + 1);

          retryTimeoutRef.current = setTimeout(() => {
            setRetryCount((prev) => prev + 1);
            subscribe(); // Recursive retry
          }, delay);
        } else {
          console.error('[useRealtimeConnection] Max retries reached, giving up');
        }
      } else if (status === 'CLOSED') {
        console.log('[useRealtimeConnection] Channel closed');
        setConnectionState('disconnected');
        setChannel(null);
      }
    });

    channelRef.current = newChannel;
  }, [channelName, retryCount, maxRetries, getBackoffDelay, onConnect, onDisconnect, onReconnect]);

  // Debug: Initialize connection on mount
  useEffect(() => {
    // Capture ref value to avoid stale closure in cleanup
    const supabase = supabaseRef.current;

    subscribe();

    return () => {
      console.log('[useRealtimeConnection] Cleaning up channel:', channelName);
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [channelName]); // eslint-disable-line react-hooks/exhaustive-deps

  // Debug: Manual reconnect function
  const manualReconnect = useCallback(() => {
    console.log('[useRealtimeConnection] Manual reconnect requested');
    setRetryCount(0);
    subscribe();
  }, [subscribe]);

  // Debug: Queue message for offline support
  const queueMessage = useCallback(
    (message: Omit<QueuedMessage, 'id' | 'timestamp'>): string => {
      const id = `queued-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
      const queuedMessage: QueuedMessage = {
        ...message,
        id,
        timestamp: Date.now(),
      };

      console.log('[useRealtimeConnection] Queuing message:', id);
      setQueuedMessages((prev) => [...prev, queuedMessage]);

      return id;
    },
    []
  );

  // Debug: Remove message from queue
  const removeFromQueue = useCallback((messageId: string) => {
    console.log('[useRealtimeConnection] Removing from queue:', messageId);
    setQueuedMessages((prev) => prev.filter((m) => m.id !== messageId));
  }, []);

  // Debug: Clear entire queue
  const clearQueue = useCallback(() => {
    console.log('[useRealtimeConnection] Clearing queue');
    setQueuedMessages([]);
  }, []);

  return {
    connectionState,
    retryCount,
    maxRetries,
    channel,
    queuedMessages,
    queueMessage,
    removeFromQueue,
    clearQueue,
    manualReconnect,
  };
}
