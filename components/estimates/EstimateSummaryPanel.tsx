"use client";

import { useState, useCallback, useEffect, memo } from "react";
import { getDeduplicatedEstimateSummary } from "@/app/actions/estimates";
import { cn } from "@/lib/utils";
import RefreshCw from "lucide-react/icons/refresh-cw";
import ChevronDown from "lucide-react/icons/chevron-down";
import ChevronRight from "lucide-react/icons/chevron-right";
import AlertCircle from "lucide-react/icons/alert-circle";
import CheckCircle2 from "lucide-react/icons/check-circle-2";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type DeduplicatedItemData = {
  description: string;
  quantity: number;
  unit: string;
  csiDivision: string;
  sourceSheets: string[];
  isDemo: boolean;
  confidence: number;
  needsReview: boolean;
  mergedItemIds: string[];
};

type DivisionData = {
  code: string;
  name: string;
  items: DeduplicatedItemData[];
  itemCount: number;
  needsReviewCount: number;
};

type SummaryData = {
  totalItems: number;
  rawItemCount: number;
  duplicatesRemoved: number;
  divisions: DivisionData[];
  allDeduped: DeduplicatedItemData[];
};

// ---------------------------------------------------------------------------
// Confidence dot
// ---------------------------------------------------------------------------

function ConfidenceDot({ confidence }: { confidence: number }) {
  const color =
    confidence >= 0.8
      ? "bg-green-500"
      : confidence >= 0.5
        ? "bg-yellow-400"
        : "bg-red-500";
  const label =
    confidence >= 0.8 ? "High" : confidence >= 0.5 ? "Medium" : "Low";
  return (
    <span
      className={cn("inline-block w-2 h-2 rounded-full flex-shrink-0", color)}
      title={`Confidence: ${label} (${Math.round(confidence * 100)}%)`}
    />
  );
}

// ---------------------------------------------------------------------------
// Item row (memoized — rerender-memo)
// ---------------------------------------------------------------------------

const ItemRow = memo(function ItemRow({
  item,
}: {
  item: DeduplicatedItemData;
}) {
  return (
    <div
      className={cn(
        "flex items-start gap-2 px-3 py-2 text-xs border-b border-border last:border-0",
        item.isDemo && "bg-red-50/50 dark:bg-red-950/20",
      )}
    >
      <ConfidenceDot confidence={item.confidence} />

      <div className="flex-1 min-w-0">
        <span
          className={cn(
            "block font-medium text-foreground truncate",
            item.isDemo && "line-through text-red-600 dark:text-red-400",
          )}
        >
          {item.description}
          {item.isDemo ? (
            <span className="ml-1.5 inline-block px-1 py-0.5 bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300 rounded text-[10px] font-semibold no-underline not-italic">
              DEMO
            </span>
          ) : null}
        </span>

        {/* Source sheets */}
        {item.sourceSheets.length > 0 ? (
          <div className="flex flex-wrap gap-1 mt-1">
            {item.sourceSheets.map((sheet) => (
              <span
                key={sheet}
                className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 rounded text-[10px]"
              >
                {sheet}
              </span>
            ))}
          </div>
        ) : null}
      </div>

      <div className="flex-shrink-0 text-right text-muted-foreground">
        <span className="font-medium text-foreground">
          {item.quantity.toLocaleString()}
        </span>{" "}
        {item.unit}
      </div>
    </div>
  );
});

// ---------------------------------------------------------------------------
// Division row (collapsible)
// ---------------------------------------------------------------------------

function DivisionRow({ division }: { division: DivisionData }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="border border-border rounded-lg overflow-hidden">
      <button
        onClick={() => setExpanded((prev) => !prev)}
        className="w-full flex items-center justify-between px-3 py-2.5 bg-muted/30 hover:bg-muted/50 active:bg-muted/70 dark:bg-muted/15 dark:hover:bg-muted/30 dark:active:bg-muted/50 transition-colors min-h-[44px]"
        aria-expanded={expanded}
      >
        <div className="flex items-center gap-2 min-w-0">
          {expanded ? (
            <ChevronDown className="w-4 h-4 flex-shrink-0 text-muted-foreground" />
          ) : (
            <ChevronRight className="w-4 h-4 flex-shrink-0 text-muted-foreground" />
          )}
          <span className="text-sm font-semibold text-foreground truncate">
            Div {division.code} – {division.name}
          </span>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0 ml-2">
          {division.needsReviewCount > 0 ? (
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 rounded text-[10px] font-medium">
              <AlertCircle className="w-3 h-3" />
              {division.needsReviewCount}
            </span>
          ) : null}
          <span className="px-2 py-0.5 bg-muted text-muted-foreground rounded-full text-xs">
            {division.itemCount}
          </span>
        </div>
      </button>

      {expanded ? (
        <div className="divide-y divide-border">
          {division.items.map((item, idx) => (
            <ItemRow key={`${item.description}-${idx}`} item={item} />
          ))}
        </div>
      ) : null}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Loading skeleton
// ---------------------------------------------------------------------------

function LoadingSkeleton() {
  return (
    <div className="space-y-2 animate-pulse">
      {[1, 2, 3].map((i) => (
        <div key={i} className="h-11 bg-muted/60 dark:bg-muted/30 rounded-lg" />
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export interface EstimateSummaryPanelProps {
  planUploadId: string;
}

export function EstimateSummaryPanel({
  planUploadId,
}: EstimateSummaryPanelProps) {
  const [data, setData] = useState<SummaryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const result = await getDeduplicatedEstimateSummary(planUploadId);
    if (result.success) {
      setData(result.data as SummaryData);
    } else {
      setError(result.error ?? "Failed to load summary");
    }
    setLoading(false);
  }, [planUploadId]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="rounded-lg border border-border bg-card dark:bg-card overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border min-h-[44px]">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-[#001B51] dark:text-blue-400" />
          <span className="text-sm font-semibold text-foreground">
            Estimate Summary
          </span>
          {data !== null ? (
            <span className="px-2 py-0.5 bg-[#001B51] text-white rounded-full text-xs font-medium">
              {data.totalItems}
            </span>
          ) : null}
        </div>

        <button
          onClick={load}
          disabled={loading}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs text-muted-foreground hover:text-foreground hover:bg-muted active:bg-muted/80 transition-colors min-h-[36px] min-w-[36px] disabled:opacity-50"
          aria-label="Refresh estimate summary"
        >
          <RefreshCw className={cn("w-3.5 h-3.5", loading && "animate-spin")} />
          <span className="hidden sm:inline">Refresh</span>
        </button>
      </div>

      {/* Body */}
      <div className="p-3 space-y-2">
        {/* Duplicates info */}
        {data !== null && data.duplicatesRemoved > 0 ? (
          <p className="text-xs text-muted-foreground flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-green-500 flex-shrink-0" />
            {data.duplicatesRemoved} duplicate
            {data.duplicatesRemoved !== 1 ? "s" : ""} merged across sheets
          </p>
        ) : null}

        {/* States */}
        {loading ? (
          <LoadingSkeleton />
        ) : error !== null ? (
          <div className="flex flex-col items-center gap-3 py-4 text-center">
            <AlertCircle className="w-8 h-8 text-red-500" />
            <p className="text-sm text-muted-foreground">{error}</p>
            <button
              onClick={load}
              className="px-4 py-2 bg-[#001B51] text-white rounded-lg text-sm font-medium hover:bg-[#001B51]/90 active:bg-[#001B51]/80 transition-colors min-h-[44px]"
            >
              Retry
            </button>
          </div>
        ) : data === null || data.divisions.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            No items to summarize yet.
          </p>
        ) : (
          <div className="space-y-1.5">
            {data.divisions.map((division) => (
              <DivisionRow key={division.code} division={division} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
