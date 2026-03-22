"use client";

import {
  useState,
  useMemo,
  useCallback,
  lazy,
  Suspense,
  useEffect,
  useRef,
  startTransition,
} from "react";
import { m, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { PlanViewer } from "@/components/estimates/PlanViewer";
import { TakeoffItemRow } from "@/components/estimates/TakeoffItemRow";
import { TakeoffItemEditModal } from "@/components/estimates/TakeoffItemEditModal";
import { ConfidenceSummary } from "@/components/estimates/ConfidenceSummary";
import { ConstructionStatusFilter } from "@/components/estimates/ConstructionStatusFilter";
import { EstimateSummaryPanel } from "@/components/estimates/EstimateSummaryPanel";
import { getBrowserClient } from "@/utils/supabase/browser";
import type { Database } from "@/types/database.types";
import Search from "lucide-react/icons/search";
import Check from "lucide-react/icons/check";
import X from "lucide-react/icons/x";
import Filter from "lucide-react/icons/filter";
import Loader2 from "lucide-react/icons/loader-2";
import MessageCircle from "lucide-react/icons/message-circle";
import ChevronDown from "lucide-react/icons/chevron-down";
import LayoutList from "lucide-react/icons/layout-list";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { CSI_DIVISIONS } from "@/lib/extraction/csi-mapper";
import {
  bulkAcceptTakeoffItems,
  bulkRejectTakeoffItems,
} from "@/app/actions/estimates";
import type { TakeoffItem } from "@/types/db/tables/estimates";

// Lazy load SwipeReviewStack (bundle-dynamic-imports)
const SwipeReviewStack = lazy(() =>
  import("@/components/estimates/SwipeReviewStack").then((mod) => ({
    default: mod.SwipeReviewStack,
  })),
);

type TakeoffReviewScreenContentProps = {
  takeoffItems: TakeoffItem[];
  planUploadId: string;
  projectId: string;
  planImageUrl?: string | null;
  onOpenChat?: (estimateId: string) => void;
  estimates?: Array<{ id: string; plan_upload_id: string | null }>;
};

type FilterStatus = "all" | "pending" | "accepted" | "rejected" | "edited";
type ConstructionStatus = "new" | "existing_to_remain" | "demolition";

export function TakeoffReviewScreenContent({
  takeoffItems,
  planUploadId,
  projectId,
  planImageUrl: planImageUrlProp,
  onOpenChat,
  estimates,
}: TakeoffReviewScreenContentProps) {
  // Local state for items to enable optimistic updates
  const [items, setItems] = useState<TakeoffItem[]>(takeoffItems);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<FilterStatus>("all");
  const [selectedConstructionStatuses, setSelectedConstructionStatuses] =
    useState<Set<ConstructionStatus>>(
      new Set(["new", "existing_to_remain", "demolition"]),
    );
  const [selectedItemIds, setSelectedItemIds] = useState<Set<string>>(
    new Set(),
  );
  const [editingItem, setEditingItem] = useState<TakeoffItem | null>(null);
  const [activeRegionId, setActiveRegionId] = useState<string | null>(null);
  const [isExtractionComplete, setIsExtractionComplete] = useState(false);
  const [showSummary, setShowSummary] = useState(true);
  const [newItemIds, setNewItemIds] = useState<Set<string>>(new Set());
  const [itemCountAtMount] = useState(takeoffItems.length);
  const [groupByCsi, setGroupByCsi] = useState(true);
  const [collapsedDivisions, setCollapsedDivisions] = useState<Set<string>>(
    new Set(),
  );
  const [summaryExpanded, setSummaryExpanded] = useState(false);
  const supabaseRef = useRef(getBrowserClient());
  const channelRef = useRef<ReturnType<
    ReturnType<typeof getBrowserClient>["channel"]
  > | null>(null);
  const statusChannelRef = useRef<ReturnType<
    ReturnType<typeof getBrowserClient>["channel"]
  > | null>(null);

  // Progressive loading: Subscribe to new takeoff items (P1.11)
  useEffect(() => {
    const supabase = supabaseRef.current;

    // Set up Realtime subscription for INSERT events
    const channel = supabase
      .channel(`takeoff_items:${planUploadId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "takeoff_items",
          filter: `plan_upload_id=eq.${planUploadId}`,
        },
        (payload: { new: TakeoffItem }) => {
          const newItem = payload.new;

          // Use startTransition for non-urgent updates (rerender-transitions)
          startTransition(() => {
            setItems((prev) => {
              // Avoid duplicates
              if (prev.some((item) => item.id === newItem.id)) {
                return prev;
              }
              return [...prev, newItem];
            });

            // Track new item for animation
            setNewItemIds((prev) => new Set(prev).add(newItem.id));

            // Remove animation marker after animation completes (250ms)
            setTimeout(() => {
              setNewItemIds((prev) => {
                const next = new Set(prev);
                next.delete(newItem.id);
                return next;
              });
            }, 300);
          });
        },
      )
      .subscribe();

    channelRef.current = channel;

    // Cleanup
    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [planUploadId]);

  // Monitor plan_upload status for extraction completion (P1.11)
  useEffect(() => {
    const supabase = supabaseRef.current;

    // Check initial status
    const checkStatus = async () => {
      const { data } = await supabase
        .from("plan_uploads")
        .select("status")
        .eq("id", planUploadId)
        .single();

      if (data?.status === "ready" || data?.status === "failed") {
        setIsExtractionComplete(true);
      }
    };

    checkStatus();

    // Subscribe to status changes
    const statusChannel = supabase
      .channel(`plan_upload_status:${planUploadId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "plan_uploads",
          filter: `id=eq.${planUploadId}`,
        },
        (payload: {
          new: { status: "uploading" | "processing" | "ready" | "failed" };
        }) => {
          if (
            payload.new.status === "ready" ||
            payload.new.status === "failed"
          ) {
            setIsExtractionComplete(true);
          }
        },
      )
      .subscribe();

    statusChannelRef.current = statusChannel;

    // Cleanup
    return () => {
      if (statusChannelRef.current) {
        supabase.removeChannel(statusChannelRef.current);
        statusChannelRef.current = null;
      }
    };
  }, [planUploadId]);

  // Filter and search items
  const filteredItems = useMemo(() => {
    let filteredList = items;

    // Apply review status filter
    if (filterStatus !== "all") {
      filteredList = filteredList.filter(
        (item) => item.review_status === filterStatus,
      );
    }

    // Apply construction status filter
    if (selectedConstructionStatuses.size < 3) {
      filteredList = filteredList.filter((item) => {
        const itemStatus = (
          item as typeof item & {
            construction_status?:
              | "new"
              | "existing_to_remain"
              | "demolition"
              | null;
          }
        ).construction_status;

        // If item has no construction_status, show it (default to "new")
        const status = itemStatus || "new";
        return selectedConstructionStatuses.has(status);
      });
    }

    // Apply search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filteredList = filteredList.filter(
        (item) =>
          item.sub_type.toLowerCase().includes(query) ||
          item.trade?.toLowerCase().includes(query) ||
          item.unit.toLowerCase().includes(query),
      );
    }

    return filteredList;
  }, [items, filterStatus, selectedConstructionStatuses, searchQuery]);

  // Count by status
  const statusCounts = useMemo(() => {
    return {
      all: items.length,
      pending: items.filter((i) => i.review_status === "pending").length,
      accepted: items.filter((i) => i.review_status === "accepted").length,
      rejected: items.filter((i) => i.review_status === "rejected").length,
      edited: items.filter((i) => i.review_status === "edited").length,
    };
  }, [items]);

  // Group filtered items by CSI division
  const groupedItems = useMemo(() => {
    if (!groupByCsi) return null;
    const groups = new Map<string, typeof filteredItems>();
    for (const item of filteredItems) {
      const div =
        (item as typeof item & { csiDivision?: string }).csiDivision ?? "01";
      const group = groups.get(div) ?? [];
      group.push(item);
      groups.set(div, group);
    }
    return Array.from(groups.entries()).sort(([a], [b]) => a.localeCompare(b));
  }, [filteredItems, groupByCsi]);

  // Extract regions for PlanViewer
  const regions = useMemo(() => {
    return items
      .filter((item) => item.source_region !== null)
      .map((item) => {
        const region = item.source_region as {
          x: number;
          y: number;
          width: number;
          height: number;
        } | null;

        return {
          id: item.id,
          x: region?.x || 0,
          y: region?.y || 0,
          width: region?.width || 0,
          height: region?.height || 0,
        };
      });
  }, [items]);

  // Handlers
  const handleAccept = useCallback(async (itemId: string) => {
    // Optimistically update the UI
    setItems((prevItems) =>
      prevItems.map((item) =>
        item.id === itemId
          ? { ...item, review_status: "accepted" as const }
          : item,
      ),
    );

    try {
      const response = await fetch("/api/estimates/takeoff-items/accept", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itemId }),
      });

      if (!response.ok) throw new Error("Failed to accept item");

      toast.success("Item accepted");
    } catch (error) {
      console.error("[TakeoffReviewScreen] Accept error:", error);
      toast.error("Failed to accept item");

      // Revert optimistic update on error
      setItems((prevItems) =>
        prevItems.map((item) =>
          item.id === itemId
            ? { ...item, review_status: "pending" as const }
            : item,
        ),
      );
    }
  }, []);

  const handleReject = useCallback(async (itemId: string) => {
    // Optimistically update the UI
    setItems((prevItems) =>
      prevItems.map((item) =>
        item.id === itemId
          ? { ...item, review_status: "rejected" as const }
          : item,
      ),
    );

    try {
      const response = await fetch("/api/estimates/takeoff-items/reject", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itemId }),
      });

      if (!response.ok) throw new Error("Failed to reject item");

      toast.success("Item rejected");
    } catch (error) {
      console.error("[TakeoffReviewScreen] Reject error:", error);
      toast.error("Failed to reject item");

      // Revert optimistic update on error
      setItems((prevItems) =>
        prevItems.map((item) =>
          item.id === itemId
            ? { ...item, review_status: "pending" as const }
            : item,
        ),
      );
    }
  }, []);

  const handleEdit = useCallback((item: TakeoffItem) => {
    setEditingItem(item);
  }, []);

  const handleTap = useCallback((item: TakeoffItem) => {
    setActiveRegionId(item.id);
  }, []);

  const handleBulkAccept = useCallback(
    async (itemIds?: string[]) => {
      const idsToAccept = itemIds || Array.from(selectedItemIds);

      if (idsToAccept.length === 0) {
        toast.error("No items selected");
        return;
      }

      // Optimistically update the UI
      setItems((prevItems) =>
        prevItems.map((item) =>
          idsToAccept.includes(item.id)
            ? { ...item, review_status: "accepted" as const }
            : item,
        ),
      );
      setSelectedItemIds(new Set());

      try {
        const response = await fetch(
          "/api/estimates/takeoff-items/bulk-accept",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ itemIds: idsToAccept }),
          },
        );

        if (!response.ok) throw new Error("Failed to accept items");

        toast.success(`Accepted ${idsToAccept.length} items`);
      } catch (error) {
        console.error("[TakeoffReviewScreen] Bulk accept error:", error);
        toast.error("Failed to accept items");

        // Revert optimistic update on error
        setItems((prevItems) =>
          prevItems.map((item) =>
            idsToAccept.includes(item.id)
              ? { ...item, review_status: "pending" as const }
              : item,
          ),
        );
      }
    },
    [selectedItemIds],
  );

  const handleBulkReject = useCallback(async () => {
    if (selectedItemIds.size === 0) {
      toast.error("No items selected");
      return;
    }

    const itemIds = Array.from(selectedItemIds);

    // Optimistically update the UI
    setItems((prevItems) =>
      prevItems.map((item) =>
        itemIds.includes(item.id)
          ? { ...item, review_status: "rejected" as const }
          : item,
      ),
    );
    setSelectedItemIds(new Set());

    try {
      const response = await fetch("/api/estimates/takeoff-items/bulk-reject", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itemIds }),
      });

      if (!response.ok) throw new Error("Failed to reject items");

      toast.success(`Rejected ${itemIds.length} items`);
    } catch (error) {
      console.error("[TakeoffReviewScreen] Bulk reject error:", error);
      toast.error("Failed to reject items");

      // Revert optimistic update on error
      setItems((prevItems) =>
        prevItems.map((item) =>
          itemIds.includes(item.id)
            ? { ...item, review_status: "pending" as const }
            : item,
        ),
      );
    }
  }, [selectedItemIds]);

  const toggleSelection = useCallback((itemId: string) => {
    setSelectedItemIds((prev) => {
      const next = new Set(prev);
      if (next.has(itemId)) {
        next.delete(itemId);
      } else {
        next.add(itemId);
      }
      return next;
    });
  }, []);

  const toggleConstructionStatus = useCallback((status: ConstructionStatus) => {
    setSelectedConstructionStatuses((prev) => {
      const next = new Set(prev);
      if (next.has(status)) {
        next.delete(status);
      } else {
        next.add(status);
      }
      return next;
    });
  }, []);

  const planImageUrl = planImageUrlProp || null;

  // Show confidence summary first if there are pending items
  const hasPendingItems = items.some(
    (item) => item.review_status === "pending",
  );

  // Filter medium/low confidence items for swipe review (must be before any early returns)
  const swipeReviewItems = useMemo(() => {
    return items.filter(
      (item) => item.review_status === "pending" && item.confidence < 0.8,
    );
  }, [items]);

  if (showSummary && hasPendingItems && items.length > 0) {
    return (
      <ConfidenceSummary
        items={items}
        onBulkAccept={async (itemIds) => {
          await handleBulkAccept(itemIds);
        }}
        onContinue={() => setShowSummary(false)}
      />
    );
  }

  return (
    <>
      {/* Desktop: Plan viewer + List (md:flex) */}
      <div
        className="hidden md:flex h-[calc(100dvh-200px)] gap-4"
        data-testid="takeoff-review-screen"
      >
        {/* Left: Plan viewer */}
        <div className="flex-1 min-w-0">
          {planImageUrl ? (
            <PlanViewer
              imageUrl={planImageUrl}
              regions={regions}
              activeRegionId={activeRegionId || undefined}
              onRegionClick={setActiveRegionId}
            />
          ) : (
            <div className="h-full flex items-center justify-center bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Plan image not available
              </p>
            </div>
          )}
        </div>

        {/* Right: Takeoff items list */}
        <div className="w-[400px] flex flex-col gap-4 overflow-hidden">
          {/* Progressive loading counter (P1.11) */}
          <AnimatePresence mode="wait">
            {!isExtractionComplete && items.length > 0 ? (
              <m.div
                key="loading"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="flex items-center justify-between px-4 py-2 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/40 rounded-lg"
              >
                <m.p
                  key={items.length}
                  initial={{ scale: 1.05 }}
                  animate={{ scale: 1 }}
                  transition={{ duration: 0.2 }}
                  className="text-sm font-medium text-blue-900 dark:text-blue-100"
                >
                  {items.length} item{items.length !== 1 ? "s" : ""} found so
                  far...
                </m.p>
                <Loader2 className="w-4 h-4 text-construction-blue dark:text-construction-blue animate-spin" />
              </m.div>
            ) : items.length > 0 ? (
              <m.div
                key="complete"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="px-4 py-2 bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-900/40 rounded-lg"
              >
                <p className="text-sm font-medium text-green-900 dark:text-green-100">
                  {items.length} item{items.length !== 1 ? "s" : ""} found
                </p>
              </m.div>
            ) : null}
          </AnimatePresence>

          {/* Search and filter */}
          <div className="space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500" />
              <Input
                type="text"
                placeholder="Search items..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 min-h-[44px]"
              />
            </div>

            {/* AI Chat Button */}
            {onOpenChat && estimates ? (
              <Button
                onClick={() => {
                  const estimate = estimates.find(
                    (e) => e.plan_upload_id === planUploadId,
                  );
                  if (estimate) {
                    onOpenChat(estimate.id);
                  } else {
                    toast.error("Create an estimate first to use AI plan chat");
                  }
                }}
                className="w-full min-h-[44px] gap-2 active:scale-95"
                variant="outline"
              >
                <MessageCircle className="w-4 h-4" />
                Ask AI about this plan
              </Button>
            ) : null}

            {/* Review status filter chips */}
            <div className="space-y-2">
              <p className="text-xs font-medium text-gray-600 dark:text-gray-400">
                Review Status
              </p>
              <div className="flex gap-2 flex-wrap">
                {(
                  [
                    "all",
                    "pending",
                    "accepted",
                    "rejected",
                    "edited",
                  ] as FilterStatus[]
                ).map((status) => (
                  <button
                    key={status}
                    onClick={() => setFilterStatus(status)}
                    className={cn(
                      "px-3 py-1.5 rounded-full text-xs font-medium transition-all min-h-[32px] active:scale-95",
                      filterStatus === status
                        ? "bg-construction-blue text-white dark:bg-construction-blue"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200 active:bg-gray-300 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700 dark:active:bg-gray-600",
                    )}
                  >
                    {status.charAt(0).toUpperCase() + status.slice(1)} (
                    {statusCounts[status]})
                  </button>
                ))}
              </div>
            </div>

            {/* Construction status filter */}
            <div className="space-y-2">
              <p className="text-xs font-medium text-gray-600 dark:text-gray-400">
                Construction Type
              </p>
              <ConstructionStatusFilter
                selectedStatuses={selectedConstructionStatuses}
                onToggleStatus={toggleConstructionStatus}
              />
            </div>

            {/* Estimate Summary Panel (collapsed by default) */}
            <div className="border border-border rounded-lg overflow-hidden">
              <button
                onClick={() => setSummaryExpanded((prev) => !prev)}
                className="w-full flex items-center justify-between px-3 py-2.5 bg-muted/30 hover:bg-muted/50 active:bg-muted/70 dark:bg-muted/15 dark:hover:bg-muted/30 dark:active:bg-muted/50 transition-colors min-h-[44px]"
                aria-expanded={summaryExpanded}
              >
                <span className="text-xs font-semibold text-foreground">
                  Estimate Summary
                </span>
                <ChevronDown
                  className={cn(
                    "w-4 h-4 text-muted-foreground transition-transform",
                    !summaryExpanded && "-rotate-90",
                  )}
                />
              </button>
              {summaryExpanded ? (
                <div className="p-2">
                  <EstimateSummaryPanel planUploadId={planUploadId} />
                </div>
              ) : null}
            </div>

            {/* CSI grouping toggle */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setGroupByCsi((prev) => !prev)}
                className={cn(
                  "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all min-h-[32px] active:scale-95",
                  groupByCsi
                    ? "bg-construction-blue text-white dark:bg-construction-blue"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200 active:bg-gray-300 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700 dark:active:bg-gray-600",
                )}
              >
                <LayoutList className="w-3.5 h-3.5" />
                Group by CSI
              </button>
            </div>
          </div>

          {/* Bulk actions */}
          {selectedItemIds.size > 0 ? (
            <div className="flex items-center gap-2 p-3 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/40 rounded-lg">
              <span className="text-sm font-medium text-blue-900 dark:text-blue-100 flex-1">
                {selectedItemIds.size} selected
              </span>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => handleBulkAccept()}
                className="min-h-[36px] min-w-[36px] text-green-600 hover:text-green-700 hover:bg-green-50 active:bg-green-100 dark:text-green-400 dark:hover:bg-green-950/30 dark:active:bg-green-950/50"
                aria-label="Accept selected items"
              >
                <Check className="w-4 h-4" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={handleBulkReject}
                className="min-h-[36px] min-w-[36px] text-red-600 hover:text-red-700 hover:bg-red-50 active:bg-red-100 dark:text-red-400 dark:hover:bg-red-950/30 dark:active:bg-red-950/50"
                aria-label="Reject selected items"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          ) : null}

          {/* Items list with progressive loading animations (P1.11) */}
          <div
            className="flex-1 overflow-y-auto pb-[env(safe-area-inset-bottom)]"
            style={{ contentVisibility: "auto" }}
          >
            {filteredItems.length > 0 ? (
              groupByCsi && groupedItems !== null ? (
                <div className="space-y-1">
                  {groupedItems.map(([divCode, divItems]) => {
                    const divInfo = CSI_DIVISIONS[divCode];
                    const divName = divInfo
                      ? `Div ${divCode} – ${divInfo.name}`
                      : `Div ${divCode}`;
                    const isCollapsed = collapsedDivisions.has(divCode);

                    return (
                      <div
                        key={divCode}
                        className="border border-border rounded-lg overflow-hidden"
                      >
                        {/* Section header */}
                        <button
                          onClick={() =>
                            setCollapsedDivisions((prev) => {
                              const next = new Set(prev);
                              if (next.has(divCode)) {
                                next.delete(divCode);
                              } else {
                                next.add(divCode);
                              }
                              return next;
                            })
                          }
                          className="w-full flex items-center justify-between px-3 py-2.5 bg-muted/40 hover:bg-muted/60 active:bg-muted/80 dark:bg-muted/20 dark:hover:bg-muted/40 dark:active:bg-muted/60 transition-colors min-h-[44px]"
                        >
                          <div className="flex items-center gap-2">
                            <ChevronDown
                              className={cn(
                                "h-4 w-4 text-muted-foreground transition-transform",
                                isCollapsed && "-rotate-90",
                              )}
                            />
                            <span className="text-sm font-semibold text-foreground">
                              {divName}
                            </span>
                            <span className="text-xs text-muted-foreground bg-muted rounded-full px-2 py-0.5">
                              {divItems.length}
                            </span>
                          </div>
                        </button>

                        {/* Items */}
                        {isCollapsed ? null : (
                          <div className="divide-y divide-border space-y-0">
                            {divItems.map((item, index) => {
                              const isInitialItem = index < itemCountAtMount;
                              return (
                                <m.div
                                  key={item.id}
                                  initial={
                                    isInitialItem
                                      ? false
                                      : { y: 20, opacity: 0 }
                                  }
                                  animate={{ y: 0, opacity: 1 }}
                                  transition={{ duration: 0.25 }}
                                  className="relative"
                                >
                                  <input
                                    type="checkbox"
                                    checked={selectedItemIds.has(item.id)}
                                    onChange={() => toggleSelection(item.id)}
                                    className="absolute top-2 left-2 z-10 w-5 h-5 rounded border-gray-300 dark:border-gray-600"
                                    aria-label={`Select ${item.sub_type}`}
                                  />
                                  <div className="pl-8">
                                    <TakeoffItemRow
                                      item={item}
                                      onAccept={handleAccept}
                                      onReject={handleReject}
                                      onEdit={handleEdit}
                                      onTap={handleTap}
                                    />
                                  </div>
                                </m.div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredItems.map((item, index) => {
                    const isInitialItem = index < itemCountAtMount;
                    return (
                      <m.div
                        key={item.id}
                        initial={isInitialItem ? false : { y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ duration: 0.25 }}
                        className="relative"
                      >
                        <input
                          type="checkbox"
                          checked={selectedItemIds.has(item.id)}
                          onChange={() => toggleSelection(item.id)}
                          className="absolute top-2 left-2 z-10 w-5 h-5 rounded border-gray-300 dark:border-gray-600"
                          aria-label={`Select ${item.sub_type}`}
                        />
                        <div className="pl-8">
                          <TakeoffItemRow
                            item={item}
                            onAccept={handleAccept}
                            onReject={handleReject}
                            onEdit={handleEdit}
                            onTap={handleTap}
                          />
                        </div>
                      </m.div>
                    );
                  })}
                </div>
              )
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Filter className="w-12 h-12 text-gray-400 dark:text-gray-600 mb-3" />
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  No items found
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile: Swipe cards (<768px) */}
      <div className="md:hidden min-h-[calc(100dvh-200px)] p-4 pb-[env(safe-area-inset-bottom)]">
        {swipeReviewItems.length > 0 ? (
          <Suspense
            fallback={
              <div className="flex items-center justify-center min-h-[calc(70dvh-120px)]">
                <div className="flex flex-col items-center gap-3">
                  <Loader2 className="w-8 h-8 text-construction-blue dark:text-construction-blue animate-spin" />
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Loading swipe cards...
                  </p>
                </div>
              </div>
            }
          >
            <SwipeReviewStack
              items={swipeReviewItems}
              onAccept={handleAccept}
              onReject={handleReject}
              onFlag={(itemId) => {
                // Flag items remain pending but are tracked in completion stats
                toast.info("Item flagged for review");
              }}
              onComplete={(stats) => {
                toast.success(
                  `Review complete: ${stats.accepted} accepted, ${stats.rejected} rejected, ${stats.flagged} flagged`,
                );
                // Refresh to show list view after swipe completion
                setShowSummary(false);
              }}
            />
          </Suspense>
        ) : (
          <div className="flex flex-col items-center justify-center min-h-[calc(70dvh-120px)] text-center">
            <Filter className="w-12 h-12 text-gray-400 dark:text-gray-600 mb-3" />
            <p className="text-sm text-gray-600 dark:text-gray-400">
              No items to review
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
              All medium/low confidence items have been reviewed
            </p>
          </div>
        )}
      </div>

      {/* Edit modal */}
      {editingItem ? (
        <TakeoffItemEditModal
          isOpen={true}
          item={editingItem}
          onClose={() => setEditingItem(null)}
          onSave={async (updates) => {
            const itemId = editingItem.id;
            const previousItem = items.find((i) => i.id === itemId);

            // Optimistically update the UI
            setItems((prevItems) =>
              prevItems.map((item) =>
                item.id === itemId
                  ? {
                      ...item,
                      ...updates,
                      review_status: "edited" as const,
                    }
                  : item,
              ),
            );
            setEditingItem(null);

            try {
              const response = await fetch(
                "/api/estimates/takeoff-items/update",
                {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    itemId,
                    ...updates,
                  }),
                },
              );

              if (!response.ok) throw new Error("Failed to update item");

              toast.success("Item updated");
            } catch (error) {
              console.error("[TakeoffReviewScreen] Update error:", error);
              toast.error("Failed to update item");

              // Revert optimistic update on error
              if (previousItem) {
                setItems((prevItems) =>
                  prevItems.map((item) =>
                    item.id === itemId ? previousItem : item,
                  ),
                );
              }
            }
          }}
        />
      ) : null}
    </>
  );
}
