"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  getPlanUploads,
  getEstimates,
  syncOfflineChanges,
} from "@/app/actions/estimates";
import { EstimatesTabContent } from "@/components/estimates/EstimatesTabContent";
import { EstimatesSkeleton } from "@/components/estimates/EstimatesSkeleton";
import { PlanChatSidebar } from "@/components/estimates/PlanChatSidebar";
import { CollaborationPresence } from "@/components/estimates/CollaborationPresence";
import { SessionProviderWrapper } from "@/components/providers/SessionProviderWrapper";
import { OfflineBanner } from "@/components/estimates/OfflineBanner";
import { SyncStatus } from "@/components/estimates/SyncStatus";
import {
  getPendingChanges,
  markSynced,
  clearSynced,
} from "@/lib/offline/estimates-sync";
import type { UserRole } from "@/types/db/enums";
import type { PlanUpload, Estimate } from "@/types/db/tables/estimates";

type EstimatesTabClientProps = {
  projectId: string;
  userRole: UserRole | null;
};

export function EstimatesTabClient({
  projectId,
  userRole,
}: EstimatesTabClientProps) {
  const [planUploads, setPlanUploads] = useState<PlanUpload[]>([]);
  const [estimates, setEstimates] = useState<Estimate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [selectedEstimateId, setSelectedEstimateId] = useState<string | null>(
    null,
  );

  // Offline / sync state
  const [syncState, setSyncState] = useState<
    "idle" | "syncing" | "error" | "synced"
  >("idle");
  const [pendingCount, setPendingCount] = useState(0);

  // Ref so runSync can call fetchData without circular deps
  const fetchDataRef = useRef<(() => void) | null>(null);

  // Void-returning wrapper so useCallback deps are stable
  const runSync = useCallback(async function runSync() {
    setSyncState("syncing");
    try {
      const pending = await getPendingChanges();
      if (pending.edits.length === 0 && pending.deletions.length === 0) {
        setSyncState("synced");
        setTimeout(() => setSyncState("idle"), 3000);
        return;
      }
      const result = await syncOfflineChanges({
        edits: pending.edits.map((e) => ({
          itemId: e.itemId,
          estimateId: e.estimateId,
          field: e.field,
          value: e.value,
          timestamp: e.timestamp,
        })),
        deletions: pending.deletions.map((d) => ({
          itemId: d.itemId,
          estimateId: d.estimateId,
          timestamp: d.timestamp,
        })),
      });
      if (result.conflicts.length > 0) {
        console.warn("[EstimatesTabClient] Sync conflicts:", result.conflicts);
      }
      // Mark applied edits as synced in IndexedDB
      await Promise.all(
        result.applied.flatMap((itemId) => {
          const appliedEdits = pending.edits.filter((e) => e.itemId === itemId);
          return appliedEdits.map((e) =>
            markSynced("edit", `${e.estimateId}:${e.itemId}:${e.field}`),
          );
        }),
      );
      // Mark applied deletions as synced in IndexedDB
      await Promise.all(
        result.applied.flatMap((itemId) => {
          const appliedDeletions = pending.deletions.filter(
            (d) => d.itemId === itemId,
          );
          return appliedDeletions.map((d) => markSynced("deletion", d.itemId));
        }),
      );
      // Remove all synced records to keep IndexedDB clean
      await clearSynced();
      setSyncState("synced");
      setTimeout(() => setSyncState("idle"), 3000);
      // Refresh data after sync
      fetchDataRef.current?.();
    } catch {
      setSyncState("error");
    }
  }, []);

  useEffect(() => {
    let isMounted = true;

    async function fetchData() {
      try {
        setIsLoading(true);
        setError(null);

        // Parallel fetch for independent data (async-parallel skill)
        const [planUploadsResult, estimatesResult, pending] = await Promise.all(
          [
            getPlanUploads(projectId),
            getEstimates(projectId),
            getPendingChanges(),
          ],
        );

        if (!isMounted) return;

        // Error handling for plan uploads
        if (!planUploadsResult.success) {
          setError(`Failed to load plan uploads: ${planUploadsResult.error}`);
          return;
        }

        // Error handling for estimates
        if (!estimatesResult.success) {
          setError(`Failed to load estimates: ${estimatesResult.error}`);
          return;
        }

        setPlanUploads(planUploadsResult.data || []);
        setEstimates(estimatesResult.data || []);
        setPendingCount(
          pending.edits.length +
            pending.uploads.length +
            pending.deletions.length,
        );
      } catch (err) {
        if (!isMounted) return;
        console.error("[EstimatesTabClient] Unexpected error:", err);
        setError("An unexpected error occurred. Please try again.");
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    fetchDataRef.current = fetchData;
    fetchData();

    return () => {
      isMounted = false;
    };
  }, [projectId]);

  // Online / offline event listeners — trigger sync when connectivity restores
  useEffect(() => {
    function handleOnline() {
      runSync();
    }

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", () => {
      // No local state needed; OfflineBanner tracks its own isOnline state
    });

    return () => {
      window.removeEventListener("online", handleOnline);
    };
  }, [runSync]);

  if (isLoading) {
    return <EstimatesSkeleton />;
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/40 rounded-lg">
        <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
      </div>
    );
  }

  const handleOpenChat = (estimateId: string) => {
    setSelectedEstimateId(estimateId);
    setIsChatOpen(true);
  };

  return (
    <div className="relative" data-testid="estimates-tab-content">
      <OfflineBanner onSyncNow={runSync} pendingCount={pendingCount} />
      <SyncStatus state={syncState} onRetry={runSync} />

      {estimates.length > 0 && estimates[0]?.id ? (
        <div className="flex items-center justify-end px-1 mb-2">
          <SessionProviderWrapper>
            <CollaborationPresence
              estimateId={selectedEstimateId ?? estimates[0].id}
            />
          </SessionProviderWrapper>
        </div>
      ) : null}

      <EstimatesTabContent
        planUploads={planUploads}
        estimates={estimates}
        projectId={projectId}
        userRole={userRole}
        onOpenChat={handleOpenChat}
      />

      {selectedEstimateId ? (
        <PlanChatSidebar
          estimateId={selectedEstimateId}
          isOpen={isChatOpen}
          onClose={() => setIsChatOpen(false)}
        />
      ) : null}
    </div>
  );
}
