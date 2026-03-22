"use client";

import Lock from "lucide-react/icons/lock";

// ============================================
// TYPES
// ============================================

interface TradeLockBannerProps {
  trade: string;
  lockedByName: string;
  lockedByColor: string;
}

// ============================================
// COMPONENT
// ============================================

export function TradeLockBanner({
  trade,
  lockedByName,
  lockedByColor,
}: TradeLockBannerProps) {
  return (
    <div
      role="status"
      aria-label={`${lockedByName} is editing the ${trade} section`}
      className="flex items-center gap-2 min-h-[44px] px-3 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/40"
    >
      {/* Colored dot */}
      <span
        className="w-2.5 h-2.5 rounded-full shrink-0"
        style={{ backgroundColor: lockedByColor }}
        aria-hidden="true"
      />

      {/* Lock icon */}
      <Lock
        className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0"
        aria-hidden="true"
      />

      {/* Message */}
      <p className="text-sm text-amber-800 dark:text-amber-300 font-medium">
        <span className="font-semibold">{lockedByName}</span> is editing this
        section &mdash; editing disabled
      </p>
    </div>
  );
}
