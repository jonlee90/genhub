"use client";

import { memo, useMemo } from "react";
import { cn } from "@/lib/utils";

type ConstructionStatus = "new" | "existing_to_remain" | "demolition";

type SourceRegion = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export type OverlayItem = {
  id: string;
  trade: string;
  sourceRegion: SourceRegion;
  constructionStatus?: ConstructionStatus | null;
};

type PlanOverlayLayerProps = {
  items: OverlayItem[];
  visibleTrades: Record<string, boolean>;
  selectedItemId?: string | null;
  onItemClick?: (itemId: string) => void;
  isMobile?: boolean;
};

// Trade color mapping
const TRADE_COLORS: Record<string, string> = {
  walls: "#3B82F6", // blue
  framing: "#3B82F6", // blue
  electrical: "#F59E0B", // amber
  plumbing: "#14B8A6", // teal
  hvac: "#10B981", // green
  doors: "#A855F7", // purple
  windows: "#06B6D4", // cyan
  drywall: "#3B82F6", // blue
  default: "#6B7280", // gray
};

// SVG hatch pattern for demolition (hoisted outside component)
const DEMOLITION_HATCH_PATTERN = (
  <pattern
    id="demolition-hatch"
    patternUnits="userSpaceOnUse"
    width="8"
    height="8"
  >
    <path d="M0,8 l8,-8" stroke="#DC2626" strokeWidth="1" opacity="0.5" />
  </pattern>
);

// Memoized overlay path component
const OverlayRect = memo(function OverlayRect({
  item,
  tradeColor,
  isSelected,
  isMobile,
  onClick,
}: {
  item: OverlayItem;
  tradeColor: string;
  isSelected: boolean;
  isMobile: boolean;
  onClick: () => void;
}) {
  const baseOpacity = isMobile ? 0.2 : 0.3;
  const selectedOpacity = 0.5;

  // Determine rendering style based on construction status
  const renderProps = useMemo(() => {
    const status = item.constructionStatus;

    if (status === "existing_to_remain") {
      return {
        fill: "none",
        stroke: "#6B7280",
        strokeWidth: "2",
        strokeDasharray: "4,4",
        opacity: "0.25",
      };
    }

    if (status === "demolition") {
      return {
        fill: "url(#demolition-hatch)",
        stroke: "#DC2626",
        strokeWidth: "2",
        opacity: "0.35",
      };
    }

    // Default: new construction (solid overlay)
    return {
      fill: tradeColor,
      stroke: isSelected ? tradeColor : "none",
      strokeWidth: isSelected ? "2" : "0",
      opacity: isSelected ? selectedOpacity : baseOpacity,
    };
  }, [
    item.constructionStatus,
    tradeColor,
    isSelected,
    baseOpacity,
    selectedOpacity,
  ]);

  return (
    <rect
      x={`${item.sourceRegion.x}%`}
      y={`${item.sourceRegion.y}%`}
      width={`${item.sourceRegion.width}%`}
      height={`${item.sourceRegion.height}%`}
      className={cn(
        "transition-all duration-200 cursor-pointer",
        isSelected && "animate-pulse-overlay",
      )}
      style={{
        fill: renderProps.fill,
        stroke: renderProps.stroke,
        strokeWidth: renderProps.strokeWidth,
        strokeDasharray: renderProps.strokeDasharray,
        opacity: renderProps.opacity,
      }}
      onClick={onClick}
      aria-label={`${item.trade} overlay`}
    />
  );
});

export const PlanOverlayLayer = memo(function PlanOverlayLayer({
  items,
  visibleTrades,
  selectedItemId,
  onItemClick,
  isMobile = false,
}: PlanOverlayLayerProps) {
  // Group items by trade for efficient rendering
  const itemsByTrade = useMemo(() => {
    const grouped: Record<string, OverlayItem[]> = {};
    items.forEach((item) => {
      const trade = item.trade.toLowerCase();
      if (!grouped[trade]) {
        grouped[trade] = [];
      }
      grouped[trade].push(item);
    });
    return grouped;
  }, [items]);

  return (
    <svg
      className="absolute inset-0 w-full h-full pointer-events-none"
      style={{ zIndex: 1 }}
      preserveAspectRatio="none"
      viewBox="0 0 100 100"
    >
      <defs>{DEMOLITION_HATCH_PATTERN}</defs>

      {Object.entries(itemsByTrade).map(([trade, tradeItems]) => {
        const isVisible = visibleTrades[trade] !== false;
        const tradeColor = TRADE_COLORS[trade] || TRADE_COLORS.default;

        return (
          <g
            key={trade}
            style={{
              contentVisibility: isVisible ? "visible" : "hidden",
              display: isVisible ? "block" : "none",
            }}
            className="pointer-events-auto"
          >
            {tradeItems.map((item) => (
              <OverlayRect
                key={item.id}
                item={item}
                tradeColor={tradeColor}
                isSelected={selectedItemId === item.id}
                isMobile={isMobile}
                onClick={() => onItemClick?.(item.id)}
              />
            ))}
          </g>
        );
      })}
    </svg>
  );
});
