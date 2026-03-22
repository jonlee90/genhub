"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import { useSession } from "next-auth/react";
import { getBrowserClient } from "@/utils/supabase/browser";
import type { SupabaseClient } from "@supabase/supabase-js";

// ============================================
// TYPES
// ============================================

export interface PresenceUser {
  userId: string;
  name: string;
  avatarUrl?: string;
  color: string; // HSL derived from userId hash
  cursor?: { x: number; y: number };
  section?: string; // trade section being edited
  lastSeen: number; // timestamp
}

interface PresencePayload {
  userId: string;
  name: string;
  avatarUrl?: string;
  cursor?: { x: number; y: number };
  section?: string | null;
}

// ============================================
// COLOR DERIVATION
// ============================================

function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash);
}

export function deriveUserColor(userId: string): string {
  const hue = hashString(userId) % 360;
  return `hsl(${hue}, 70%, 45%)`;
}

// ============================================
// HOOK
// ============================================

export function useEstimatePresence(estimateId: string): {
  users: PresenceUser[];
  updateCursor: (x: number, y: number) => void;
  updateSection: (section: string | null) => void;
} {
  const [users, setUsers] = useState<PresenceUser[]>([]);
  const { data: session } = useSession();

  // Refs to hold mutable values without causing re-subscriptions (rerender-memo, rerender-defer-reads)
  const channelRef = useRef<ReturnType<SupabaseClient["channel"]> | null>(null);
  const currentUserRef = useRef<PresencePayload | null>(null);
  const throttleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastCursorUpdateRef = useRef<number>(0);

  // Initialize presence channel once session is available
  useEffect(() => {
    if (!session?.user?.id) return;

    const userId = session.user.id;
    const name = session.user.name || session.user.email || "Unknown";
    const avatarUrl = session.user.image ?? undefined;

    const supabase = getBrowserClient();
    let isMounted = true;

    const initialPayload: PresencePayload = {
      userId,
      name,
      avatarUrl,
      cursor: undefined,
      section: null,
    };

    currentUserRef.current = initialPayload;

    const channel = supabase.channel(`estimate-presence:${estimateId}`, {
      config: { presence: { key: userId } },
    });

    channelRef.current = channel;

    channel
      .on("presence", { event: "sync" }, () => {
        if (!isMounted) return;
        const state = channel.presenceState<PresencePayload>();
        const now = Date.now();

        const presenceUsers: PresenceUser[] = Object.entries(state)
          .map(([key, presences]) => {
            // Each key may have multiple presence entries — take the latest
            const presence = presences[presences.length - 1];
            return {
              userId: presence.userId || key,
              name: presence.name || "Unknown",
              avatarUrl: presence.avatarUrl,
              color: deriveUserColor(presence.userId || key),
              cursor: presence.cursor,
              section: presence.section ?? undefined,
              lastSeen: now,
            };
          })
          // Exclude the current user from displayed presence
          .filter((u) => u.userId !== userId);

        setUsers(presenceUsers);
      })
      .on("presence", { event: "join" }, ({ key, newPresences }) => {
        if (!isMounted) return;
        // Handled by sync — join event fires before sync, so sync re-derives the full list
        void key;
        void newPresences;
      })
      .on("presence", { event: "leave" }, ({ key }) => {
        if (!isMounted) return;
        // Remove user immediately on leave, before next sync
        setUsers((prev) => prev.filter((u) => u.userId !== key));
      })
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          await channel.track(initialPayload);
        }
      });

    return () => {
      isMounted = false;
      if (channelRef.current) {
        channelRef.current.untrack().then(() => {
          channelRef.current?.unsubscribe();
        });
        channelRef.current = null;
      }
      if (throttleTimerRef.current) {
        clearTimeout(throttleTimerRef.current);
        throttleTimerRef.current = null;
      }
    };
  }, [estimateId, session?.user?.id]);

  // Stable updateCursor — throttled to 200ms max
  const updateCursor = useCallback((x: number, y: number) => {
    const now = Date.now();
    const timeSinceLastUpdate = now - lastCursorUpdateRef.current;

    const doUpdate = () => {
      lastCursorUpdateRef.current = Date.now();
      if (currentUserRef.current && channelRef.current) {
        const updated = { ...currentUserRef.current, cursor: { x, y } };
        currentUserRef.current = updated;
        channelRef.current.track(updated);
      }
    };

    if (timeSinceLastUpdate >= 200) {
      // Enough time has passed — update immediately
      doUpdate();
    } else {
      // Schedule an update after the remainder of the 200ms window
      if (throttleTimerRef.current) {
        clearTimeout(throttleTimerRef.current);
      }
      throttleTimerRef.current = setTimeout(() => {
        doUpdate();
        throttleTimerRef.current = null;
      }, 200 - timeSinceLastUpdate);
    }
  }, []);

  // Stable updateSection
  const updateSection = useCallback((section: string | null) => {
    if (currentUserRef.current && channelRef.current) {
      const updated = { ...currentUserRef.current, section };
      currentUserRef.current = updated;
      channelRef.current.track(updated);
    }
  }, []);

  return { users, updateCursor, updateSection };
}
