"use client";

import { useState, useEffect } from "react";
import WifiOff from "lucide-react/icons/wifi-off";
import RefreshCw from "lucide-react/icons/refresh-cw";

interface OfflineBannerProps {
  onSyncNow: () => void;
  pendingCount: number;
}

export function OfflineBanner({ onSyncNow, pendingCount }: OfflineBannerProps) {
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    // Initialise from actual navigator state
    setIsOnline(navigator.onLine);

    function handleOnline() {
      setIsOnline(true);
    }

    function handleOffline() {
      setIsOnline(false);
    }

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // rendering-conditional-render: ternary not &&
  return isOnline ? null : (
    <div
      role="alert"
      aria-live="polite"
      className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between gap-3 px-4 py-2 bg-yellow-400 dark:bg-yellow-600"
    >
      <div className="flex items-center gap-2 min-h-[44px]">
        <WifiOff
          className="w-4 h-4 shrink-0 text-yellow-900 dark:text-yellow-100"
          aria-hidden="true"
        />
        <p className="text-sm font-medium text-yellow-900 dark:text-yellow-100">
          {"You're offline."}{" "}
          {pendingCount > 0
            ? `${pendingCount} ${pendingCount === 1 ? "change" : "changes"} will sync when connected.`
            : "Changes will sync when connected."}
        </p>
      </div>

      <button
        type="button"
        onClick={onSyncNow}
        aria-label="Sync now"
        className="flex items-center gap-1.5 px-3 min-h-[44px] min-w-[44px] rounded-md text-sm font-medium text-yellow-900 dark:text-yellow-100 bg-yellow-300 dark:bg-yellow-700 hover:bg-yellow-200 dark:hover:bg-yellow-800 active:scale-95 active:bg-yellow-200 dark:active:bg-yellow-800 transition-all"
      >
        <RefreshCw className="w-3.5 h-3.5" aria-hidden="true" />
        Sync Now
      </button>
    </div>
  );
}
