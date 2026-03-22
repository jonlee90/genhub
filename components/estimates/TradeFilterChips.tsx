"use client";

import { memo } from "react";
import { cn } from "@/lib/utils";

type TradeFilterChipsProps = {
  trades: string[];
  visibleTrades: Record<string, boolean>;
  onToggleTrade: (trade: string) => void;
};

const TRADE_COLORS: Record<
  string,
  { bg: string; text: string; activeBg: string }
> = {
  walls: {
    bg: "bg-blue-100 dark:bg-blue-900/30",
    text: "text-blue-700 dark:text-blue-300",
    activeBg: "bg-blue-500 dark:bg-blue-600",
  },
  framing: {
    bg: "bg-blue-100 dark:bg-blue-900/30",
    text: "text-blue-700 dark:text-blue-300",
    activeBg: "bg-blue-500 dark:bg-blue-600",
  },
  electrical: {
    bg: "bg-amber-100 dark:bg-amber-900/30",
    text: "text-amber-700 dark:text-amber-300",
    activeBg: "bg-amber-500 dark:bg-amber-600",
  },
  plumbing: {
    bg: "bg-teal-100 dark:bg-teal-900/30",
    text: "text-teal-700 dark:text-teal-300",
    activeBg: "bg-teal-500 dark:bg-teal-600",
  },
  hvac: {
    bg: "bg-green-100 dark:bg-green-900/30",
    text: "text-green-700 dark:text-green-300",
    activeBg: "bg-green-500 dark:bg-green-600",
  },
  doors: {
    bg: "bg-purple-100 dark:bg-purple-900/30",
    text: "text-purple-700 dark:text-purple-300",
    activeBg: "bg-purple-500 dark:bg-purple-600",
  },
  windows: {
    bg: "bg-cyan-100 dark:bg-cyan-900/30",
    text: "text-cyan-700 dark:text-cyan-300",
    activeBg: "bg-cyan-500 dark:bg-cyan-600",
  },
  drywall: {
    bg: "bg-blue-100 dark:bg-blue-900/30",
    text: "text-blue-700 dark:text-blue-300",
    activeBg: "bg-blue-500 dark:bg-blue-600",
  },
};

const DEFAULT_COLORS = {
  bg: "bg-gray-100 dark:bg-gray-900/30",
  text: "text-gray-700 dark:text-gray-300",
  activeBg: "bg-gray-500 dark:bg-gray-600",
};

export const TradeFilterChips = memo(function TradeFilterChips({
  trades,
  visibleTrades,
  onToggleTrade,
}: TradeFilterChipsProps) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
      {trades.map((trade) => {
        const isVisible = visibleTrades[trade] !== false;
        const colors = TRADE_COLORS[trade.toLowerCase()] || DEFAULT_COLORS;

        return (
          <button
            key={trade}
            onClick={() => onToggleTrade(trade)}
            className={cn(
              "inline-flex items-center justify-center min-h-[44px] px-4 rounded-full text-sm font-medium transition-all whitespace-nowrap shrink-0",
              "active:scale-95",
              isVisible
                ? cn(colors.activeBg, "text-white")
                : cn(colors.bg, colors.text, "hover:opacity-80"),
            )}
            aria-label={`Toggle ${trade} overlay`}
            aria-pressed={isVisible}
          >
            {trade.charAt(0).toUpperCase() + trade.slice(1)}
          </button>
        );
      })}
    </div>
  );
});
