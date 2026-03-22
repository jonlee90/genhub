"use client";

import { useEffect, useState } from "react";
import CloudOff from "lucide-react/icons/cloud-off";
import Loader2 from "lucide-react/icons/loader-2";
import CloudUpload from "lucide-react/icons/cloud-upload";
import CheckCircle from "lucide-react/icons/check-circle";
import AlertCircle from "lucide-react/icons/alert-circle";

type SyncState = "idle" | "syncing" | "error" | "synced";

interface SyncStatusProps {
  state: SyncState;
  onRetry?: () => void;
}

export function SyncStatus({ state, onRetry }: SyncStatusProps) {
  // Track internal display state to handle the "synced" auto-fade
  const [displayState, setDisplayState] = useState<SyncState>(state);

  useEffect(() => {
    setDisplayState(state);
  }, [state]);

  // rendering-conditional-render: ternary not &&
  return displayState === "idle" ? null : (
    <div className="flex items-center gap-2 text-sm px-1">
      {displayState === "syncing" ? (
        <span className="flex items-center gap-1.5 text-blue-600 dark:text-blue-400">
          <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
          <span>Syncing...</span>
        </span>
      ) : displayState === "error" ? (
        <span className="flex items-center gap-1.5 text-red-600 dark:text-red-400">
          <AlertCircle className="w-4 h-4" aria-hidden="true" />
          <span>Sync failed</span>
          {onRetry !== undefined ? (
            <button
              type="button"
              onClick={onRetry}
              aria-label="Retry sync"
              className="ml-1 px-2 min-h-[44px] min-w-[44px] rounded text-xs font-medium underline underline-offset-2 text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-200 active:scale-95 active:opacity-70 transition-all"
            >
              Retry
            </button>
          ) : null}
        </span>
      ) : displayState === "synced" ? (
        <span className="flex items-center gap-1.5 text-green-600 dark:text-green-400">
          <CheckCircle className="w-4 h-4" aria-hidden="true" />
          <span>Synced</span>
        </span>
      ) : (
        // idle — hidden via outer ternary, but TypeScript exhaustiveness
        <span className="flex items-center gap-1.5 text-gray-400 dark:text-gray-500">
          <CloudOff className="w-4 h-4" aria-hidden="true" />
          <span>Offline</span>
        </span>
      )}

      {/* CloudUpload shown alongside synced indicator */}
      {displayState === "synced" ? (
        <CloudUpload
          className="w-4 h-4 text-green-600 dark:text-green-400"
          aria-hidden="true"
        />
      ) : null}
    </div>
  );
}
