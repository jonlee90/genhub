"use client";

import { useState, useMemo, useRef } from "react";
import dynamic from "next/dynamic";
import ChevronDown from "lucide-react/icons/chevron-down";
import ChevronUp from "lucide-react/icons/chevron-up";
import Package from "lucide-react/icons/package";
import { Button } from "@/components/ui/button";

// Lazy load recharts to reduce initial bundle size
const PieChart = dynamic(() => import("recharts").then((mod) => mod.PieChart), {
  ssr: false,
});
const Pie = dynamic(() => import("recharts").then((mod) => mod.Pie), {
  ssr: false,
});
const Cell = dynamic(() => import("recharts").then((mod) => mod.Cell), {
  ssr: false,
});
const ResponsiveContainer = dynamic(
  () => import("recharts").then((mod) => mod.ResponsiveContainer),
  { ssr: false },
);

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

type TradeDonutChartProps = {
  costLineItems: CostLineItem[];
  takeoffItems: TakeoffItem[];
};

type TradeData = {
  name: string;
  value: number;
  color: string;
};

const TRADE_COLORS: Record<string, string> = {
  Walls: "#3B82F6", // blue-500
  Electrical: "#F59E0B", // amber-500
  Plumbing: "#14B8A6", // teal-500
  HVAC: "#22C55E", // green-500
  Doors: "#A855F7", // purple-500
  Windows: "#06B6D4", // cyan-500
  Other: "#6B7280", // gray-500
};

export function TradeDonutChart({
  costLineItems,
  takeoffItems,
}: TradeDonutChartProps) {
  const [expandedTrades, setExpandedTrades] = useState<Set<string>>(new Set());
  const tradeRefs = useRef<Record<string, HTMLDivElement | null>>({});

  // Calculate trade totals and prepare chart data (memoized for performance)
  const { chartData, totalCost, itemsByTrade } = useMemo(() => {
    const tradeMap = new Map<string, number>();
    const itemsMap = new Map<string, CostLineItem[]>();

    let total = 0;
    costLineItems.forEach((item) => {
      const itemTotal = item.subtotal;
      total += itemTotal;

      const takeoffItem = takeoffItems.find((t) => t.id === item.takeoffItemId);
      const trade = takeoffItem?.trade || "Other";

      tradeMap.set(trade, (tradeMap.get(trade) || 0) + itemTotal);

      if (!itemsMap.has(trade)) {
        itemsMap.set(trade, []);
      }
      itemsMap.get(trade)!.push(item);
    });

    const data = Array.from(tradeMap.entries())
      .map(
        ([name, value]): TradeData => ({
          name,
          value,
          color: TRADE_COLORS[name] || TRADE_COLORS.Other,
        }),
      )
      .sort((a, b) => b.value - a.value);

    return {
      chartData: data,
      totalCost: total,
      itemsByTrade: Array.from(itemsMap.entries()).sort((a, b) =>
        a[0].localeCompare(b[0]),
      ),
    };
  }, [costLineItems, takeoffItems]);

  const handleSegmentClick = (trade: string) => {
    const element = tradeRefs.current[trade];
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
      // Expand the trade section
      setExpandedTrades((prev) => {
        const next = new Set(prev);
        next.add(trade);
        return next;
      });
    }
  };

  const toggleTradeExpansion = (trade: string) => {
    setExpandedTrades((prev) => {
      const next = new Set(prev);
      if (next.has(trade)) {
        next.delete(trade);
      } else {
        next.add(trade);
      }
      return next;
    });
  };

  // Empty state
  if (costLineItems.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <Package className="w-12 h-12 text-gray-400 dark:text-gray-600 mb-3" />
        <p className="text-sm text-gray-600 dark:text-gray-400">
          No items yet. Complete the Review step to see your cost breakdown.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Donut Chart */}
      <div className="flex flex-col items-center">
        <div className="relative w-full max-w-[200px] md:max-w-[280px] h-[200px] md:h-[280px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={2}
                dataKey="value"
                onClick={(data) => handleSegmentClick(data.name)}
                className="cursor-pointer focus:outline-none"
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>

          {/* Center total */}
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">
              Total Cost
            </p>
            <p className="text-2xl md:text-3xl font-bold text-construction-blue dark:text-construction-blue">
              ${totalCost.toLocaleString("en-US", { maximumFractionDigits: 0 })}
            </p>
          </div>
        </div>

        {/* Legend */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-6 w-full">
          {chartData.map((item) => (
            <button
              key={item.name}
              onClick={() => handleSegmentClick(item.name)}
              className="flex items-center gap-2 p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors active:scale-95 min-h-[44px]"
              aria-label={`Scroll to ${item.name} section`}
            >
              <div
                className="w-4 h-4 rounded-full flex-shrink-0"
                style={{ backgroundColor: item.color }}
              />
              <div className="text-left min-w-0 flex-1">
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                  {item.name}
                </p>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  $
                  {item.value.toLocaleString("en-US", {
                    maximumFractionDigits: 0,
                  })}
                </p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Trade sections */}
      <div className="space-y-4">
        <h3 className="text-sm font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
          Cost Breakdown by Trade
        </h3>

        {itemsByTrade.map(([trade, items]) => {
          const tradeTotal = items.reduce(
            (sum, item) => sum + item.subtotal,
            0,
          );
          const isExpanded = expandedTrades.has(trade);

          return (
            <div
              key={trade}
              ref={(el) => {
                tradeRefs.current[trade] = el;
              }}
              className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden"
            >
              <Button
                variant="ghost"
                onClick={() => toggleTradeExpansion(trade)}
                className="w-full justify-between p-4 min-h-[44px] hover:bg-gray-50 dark:hover:bg-gray-800 active:scale-[0.99]"
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div
                    className="w-4 h-4 rounded-full flex-shrink-0"
                    style={{
                      backgroundColor:
                        TRADE_COLORS[trade] || TRADE_COLORS.Other,
                    }}
                  />
                  <div className="text-left min-w-0 flex-1">
                    <p className="text-base font-bold text-gray-900 dark:text-gray-100">
                      {trade}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {items.length} {items.length === 1 ? "item" : "items"}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <p className="text-lg font-bold text-construction-blue dark:text-construction-blue tabular-nums">
                    $
                    {tradeTotal.toLocaleString("en-US", {
                      maximumFractionDigits: 0,
                    })}
                  </p>
                  {isExpanded ? (
                    <ChevronUp className="w-5 h-5 text-gray-500 dark:text-gray-400 flex-shrink-0" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-gray-500 dark:text-gray-400 flex-shrink-0" />
                  )}
                </div>
              </Button>

              {isExpanded ? (
                <div
                  className="border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50"
                  style={{ contentVisibility: "auto" }}
                >
                  <div className="p-4 space-y-3">
                    {items.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-start justify-between gap-4 pb-3 border-b border-gray-200 dark:border-gray-700 last:border-0 last:pb-0"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-1">
                            {item.description}
                          </p>
                          <p className="text-xs text-gray-600 dark:text-gray-400">
                            {item.quantity} {item.unit}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-bold text-gray-900 dark:text-gray-100 tabular-nums">
                            $
                            {item.subtotal.toLocaleString("en-US", {
                              maximumFractionDigits: 0,
                            })}
                          </p>
                          <p className="text-xs text-gray-600 dark:text-gray-400">
                            $
                            {(item.subtotal / item.quantity).toLocaleString(
                              "en-US",
                              {
                                maximumFractionDigits: 2,
                              },
                            )}
                            /{item.unit}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}
