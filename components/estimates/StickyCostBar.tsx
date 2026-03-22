"use client";

import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import ChevronDown from "lucide-react/icons/chevron-down";
import ChevronUp from "lucide-react/icons/chevron-up";

type CostLineItem = {
  id: string;
  takeoffItemId: string;
  description: string;
  quantity: number;
  unit: string;
  materialCost: number;
  laborCost: number;
  equipmentCost: number;
  subtotal: number;
};

type TakeoffItem = {
  id: string;
  trade: string;
  [key: string]: unknown;
};

type StickyCostBarProps = {
  costLineItems: CostLineItem[];
  takeoffItems: TakeoffItem[];
  overheadPct?: number;
  markupPct?: number;
};

type TradeTotal = {
  trade: string;
  total: number;
};

const TRADE_COLORS: Record<string, string> = {
  Walls: "bg-blue-500 dark:bg-blue-600",
  Electrical: "bg-amber-500 dark:bg-amber-600",
  Plumbing: "bg-teal-500 dark:bg-teal-600",
  HVAC: "bg-green-500 dark:bg-green-600",
  Doors: "bg-purple-500 dark:bg-purple-600",
  Windows: "bg-cyan-500 dark:bg-cyan-600",
  Other: "bg-gray-500 dark:bg-gray-600",
};

export function StickyCostBar({
  costLineItems,
  takeoffItems,
  overheadPct = 0,
  markupPct = 0,
}: StickyCostBarProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  // Calculate totals using useMemo for real-time updates
  const { subtotal, tradeTotals, itemCount, tradeCount } = useMemo(() => {
    const tradeMap = new Map<string, number>();

    let total = 0;
    costLineItems.forEach((item) => {
      const itemTotal = item.subtotal;
      total += itemTotal;

      const takeoffItem = takeoffItems.find((t) => t.id === item.takeoffItemId);
      const trade = takeoffItem?.trade || "Other";

      tradeMap.set(trade, (tradeMap.get(trade) || 0) + itemTotal);
    });

    const sortedTrades = Array.from(tradeMap.entries())
      .map(([trade, total]): TradeTotal => ({ trade, total }))
      .sort((a, b) => b.total - a.total);

    return {
      subtotal: total,
      tradeTotals: sortedTrades,
      itemCount: costLineItems.length,
      tradeCount: tradeMap.size,
    };
  }, [costLineItems, takeoffItems]);

  // Calculate overhead and markup
  const overhead = subtotal * (overheadPct / 100);
  const subtotalWithOverhead = subtotal + overhead;
  const markup = subtotalWithOverhead * (markupPct / 100);
  const grandTotal = subtotalWithOverhead + markup;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 backdrop-blur-md bg-[#001B51]/95 dark:bg-[#001B51]/98 border-t border-white/10 pb-[env(safe-area-inset-bottom)]">
      {/* Main bar - always visible */}
      <div className="px-4 py-3">
        <div className="flex items-center justify-between gap-4">
          <div className="flex-1 min-w-0">
            <p className="text-xs text-white/70 mb-0.5">Total Estimate</p>
            <div className="flex items-baseline gap-2">
              <p className="text-2xl font-bold text-white">
                $
                {grandTotal.toLocaleString("en-US", {
                  maximumFractionDigits: 0,
                })}
              </p>
              <p className="text-sm text-white/60">
                {itemCount} {itemCount === 1 ? "item" : "items"}
              </p>
            </div>
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="min-h-[44px] min-w-[44px] text-white hover:bg-white/10 active:scale-95 active:bg-white/20"
            aria-label={isExpanded ? "Collapse breakdown" : "Expand breakdown"}
          >
            {isExpanded ? (
              <ChevronDown className="w-5 h-5" />
            ) : (
              <ChevronUp className="w-5 h-5" />
            )}
          </Button>
        </div>
      </div>

      {/* Expanded breakdown */}
      {isExpanded ? (
        <div
          className="max-h-[40dvh] overflow-y-auto border-t border-white/10"
          style={{ contentVisibility: "auto" }}
        >
          <div className="px-4 py-3 space-y-3">
            {/* Trade breakdown */}
            {tradeTotals.length > 0 ? (
              <div className="space-y-2">
                <p className="text-xs font-bold text-white/70 uppercase tracking-wider">
                  By Trade ({tradeCount})
                </p>
                {tradeTotals.map(({ trade, total }) => (
                  <div
                    key={trade}
                    className="flex items-center justify-between gap-4"
                  >
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <div
                        className={`w-3 h-3 rounded-full ${TRADE_COLORS[trade] || TRADE_COLORS.Other}`}
                      />
                      <p className="text-sm text-white truncate">{trade}</p>
                    </div>
                    <p className="text-sm font-bold text-white tabular-nums">
                      $
                      {total.toLocaleString("en-US", {
                        maximumFractionDigits: 0,
                      })}
                    </p>
                  </div>
                ))}
              </div>
            ) : null}

            {/* Cost breakdown */}
            <div className="pt-3 border-t border-white/10 space-y-2">
              <div className="flex items-center justify-between gap-4">
                <p className="text-sm text-white/70">Subtotal</p>
                <p className="text-sm font-bold text-white tabular-nums">
                  $
                  {subtotal.toLocaleString("en-US", {
                    maximumFractionDigits: 0,
                  })}
                </p>
              </div>

              {overheadPct > 0 ? (
                <div className="flex items-center justify-between gap-4">
                  <p className="text-sm text-white/70">
                    Overhead ({overheadPct}%)
                  </p>
                  <p className="text-sm font-bold text-white tabular-nums">
                    $
                    {overhead.toLocaleString("en-US", {
                      maximumFractionDigits: 0,
                    })}
                  </p>
                </div>
              ) : null}

              {markupPct > 0 ? (
                <div className="flex items-center justify-between gap-4">
                  <p className="text-sm text-white/70">Markup ({markupPct}%)</p>
                  <p className="text-sm font-bold text-white tabular-nums">
                    $
                    {markup.toLocaleString("en-US", {
                      maximumFractionDigits: 0,
                    })}
                  </p>
                </div>
              ) : null}

              <div className="flex items-center justify-between gap-4 pt-2 border-t border-white/20">
                <p className="text-base font-bold text-white">Grand Total</p>
                <p className="text-xl font-bold text-white tabular-nums">
                  $
                  {grandTotal.toLocaleString("en-US", {
                    maximumFractionDigits: 0,
                  })}
                </p>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
