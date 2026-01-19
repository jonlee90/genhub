import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  getMessageReplyCounts,
  getMessagesAttachments,
  getMessagesReactions,
} from "@/app/actions/chat";
import type { MessageReactionGroup } from "@/components/chat/MessageReactions";
import type { MessageAttachment } from "@/components/chat/FilePreview";

interface UseMessageMetadataOptions {
  roomId: string;
  messageIds: string[];
}

interface MessageMetadataState {
  reactionsMap: Record<string, MessageReactionGroup[]>;
  replyCountsMap: Record<string, number>;
  attachmentsMap: Record<string, MessageAttachment[]>;
  isLoading: boolean;
  error: string | null;
  refreshMetadata: (ids: string[]) => Promise<void>;
}

export function useMessageMetadata({
  roomId,
  messageIds,
}: UseMessageMetadataOptions): MessageMetadataState {
  const [reactionsMap, setReactionsMap] = useState<
    Record<string, MessageReactionGroup[]>
  >({});
  const [replyCountsMap, setReplyCountsMap] = useState<Record<string, number>>(
    {},
  );
  const [attachmentsMap, setAttachmentsMap] = useState<
    Record<string, MessageAttachment[]>
  >({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fetchedIdsRef = useRef<Set<string>>(new Set());
  const prevRoomIdRef = useRef(roomId);

  const uniqueMessageIds = useMemo(
    () => Array.from(new Set(messageIds)).filter(Boolean),
    [messageIds],
  );

  const fetchMetadata = useCallback(async (ids: string[]) => {
    if (ids.length === 0) return;

    setIsLoading(true);
    setError(null);

    try {
      const [reactionsResult, replyCountResult, attachmentsResult] =
        await Promise.all([
          getMessagesReactions(ids),
          getMessageReplyCounts(ids),
          getMessagesAttachments(ids),
        ]);

      if (reactionsResult.success && reactionsResult.reactionsMap) {
        setReactionsMap((prev) => ({
          ...prev,
          ...reactionsResult.reactionsMap,
        }));
      } else if (reactionsResult.error) {
        setError(reactionsResult.error);
      }

      if (replyCountResult.success && replyCountResult.counts) {
        setReplyCountsMap((prev) => ({ ...prev, ...replyCountResult.counts }));
      } else if (replyCountResult.error) {
        setError(replyCountResult.error);
      }

      if (attachmentsResult.success && attachmentsResult.attachmentsMap) {
        setAttachmentsMap((prev) => ({
          ...prev,
          ...attachmentsResult.attachmentsMap,
        }));
      } else if (attachmentsResult.error) {
        setError(attachmentsResult.error);
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  const refreshMetadata = useCallback(
    async (ids: string[]) => {
      const refreshedIds = Array.from(new Set(ids)).filter(Boolean);
      if (refreshedIds.length === 0) return;
      refreshedIds.forEach((id) => fetchedIdsRef.current.add(id));
      await fetchMetadata(refreshedIds);
    },
    [fetchMetadata],
  );

  useEffect(() => {
    if (prevRoomIdRef.current !== roomId) {
      prevRoomIdRef.current = roomId;
      fetchedIdsRef.current = new Set();
      setReactionsMap({});
      setReplyCountsMap({});
      setAttachmentsMap({});
    }
  }, [roomId]);

  useEffect(() => {
    const idsToFetch = uniqueMessageIds.filter(
      (id) => !fetchedIdsRef.current.has(id),
    );

    if (idsToFetch.length === 0) return;

    idsToFetch.forEach((id) => fetchedIdsRef.current.add(id));
    fetchMetadata(idsToFetch);
  }, [uniqueMessageIds, fetchMetadata]);

  return {
    reactionsMap,
    replyCountsMap,
    attachmentsMap,
    isLoading,
    error,
    refreshMetadata,
  };
}
