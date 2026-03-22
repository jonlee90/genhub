"use client";

import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import { useSession } from "next-auth/react";
import { getBrowserClient } from "@/utils/supabase/browser";
import type { SupabaseClient } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CostLineItemRow } from "@/components/estimates/CostLineItemRow";
import { AddManualItemModal } from "@/components/estimates/AddManualItemModal";
import { PricingTemplateModal } from "@/components/estimates/PricingTemplateModal";
import { SaveTemplateModal } from "@/components/estimates/SaveTemplateModal";
import { StickyCostBar } from "@/components/estimates/StickyCostBar";
import { AssemblyPicker } from "@/components/estimates/AssemblyPicker";
import { AssemblyEditor } from "@/components/estimates/AssemblyEditor";
import { TradeLockBanner } from "@/components/estimates/TradeLockBanner";
import {
  getActiveLocks,
  claimTradeLock,
  releaseTradeLock,
} from "@/app/actions/estimates";
import { deriveUserColor } from "@/lib/collaboration/presence-tracker";
import Plus from "lucide-react/icons/plus";
import Save from "lucide-react/icons/save";
import FolderOpen from "lucide-react/icons/folder-open";
import Calculator from "lucide-react/icons/calculator";
import Package from "lucide-react/icons/package";
import type {
  TakeoffItem,
  EstimateAssemblyWithItems,
} from "@/types/db/tables/estimates";
import type { TradeLock } from "@/app/actions/estimates";

export type CostLineItem = {
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

type CostEditorProps = {
  estimateId: string;
  takeoffItems: TakeoffItem[];
  projectId: string;
  overheadPct?: number;
  markupPct?: number;
  onItemsChange?: (items: CostLineItem[]) => void;
};

export function CostEditor({
  estimateId,
  takeoffItems,
  projectId,
  overheadPct = 0,
  markupPct = 0,
  onItemsChange,
}: CostEditorProps) {
  const [costLineItems, setCostLineItems] = useState<CostLineItem[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showLoadTemplateModal, setShowLoadTemplateModal] = useState(false);
  const [showSaveTemplateModal, setShowSaveTemplateModal] = useState(false);
  const [showAssemblyPicker, setShowAssemblyPicker] = useState(false);
  const [showAssemblyEditor, setShowAssemblyEditor] = useState(false);

  // ============================================
  // TRADE LOCK STATE (EST-P3-002-G)
  // ============================================

  // Auto-populate from accepted takeoff items (runs when takeoffItems first become available)
  const initializedRef = useRef(false);
  useEffect(() => {
    if (initializedRef.current) return; // already initialized — don't overwrite user edits
    if (takeoffItems.length === 0) return; // wait for items to arrive

    const acceptedItems = takeoffItems.filter(
      (item) =>
        item.review_status === "accepted" || item.review_status === "edited",
    );
    if (acceptedItems.length > 0) {
      initializedRef.current = true;
      setCostLineItems(
        acceptedItems.map((item) => ({
          id: crypto.randomUUID(),
          takeoffItemId: item.id,
          description: item.sub_type || item.trade || "Item",
          quantity: item.quantity ?? 1,
          unit: item.unit || "unit",
          materialCost: 0,
          laborCost: 0,
          equipmentCost: 0,
          subtotal: 0,
        })),
      );
    }
  }, [takeoffItems]); // re-runs whenever takeoffItems changes until initialized

  // Notify parent of current items whenever they change
  useEffect(() => {
    onItemsChange?.(costLineItems);
  }, [costLineItems, onItemsChange]);

  const [activeLocks, setActiveLocks] = useState<TradeLock[]>([]);
  const { data: session } = useSession();
  const currentUserId = session?.user?.id ?? null;
  const blurTimerRef = useRef<Record<string, ReturnType<typeof setTimeout>>>(
    {},
  );
  const lockChannelRef = useRef<ReturnType<SupabaseClient["channel"]> | null>(
    null,
  );

  // Load initial locks and subscribe to realtime lock changes
  useEffect(() => {
    let isMounted = true;

    async function loadLocks() {
      const { data } = await getActiveLocks(estimateId);
      if (isMounted && data) {
        setActiveLocks(data);
      }
    }

    loadLocks();

    const supabase = getBrowserClient();
    const channel = supabase
      .channel(`estimate_locks:${estimateId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "estimate_locks",
          filter: `estimate_id=eq.${estimateId}`,
        },
        async () => {
          // Re-fetch locks on any change
          const { data } = await getActiveLocks(estimateId);
          if (isMounted && data) {
            setActiveLocks(data);
          }
        },
      )
      .subscribe();

    lockChannelRef.current = channel;

    return () => {
      isMounted = false;
      channel.unsubscribe();
      lockChannelRef.current = null;
      // Clear all pending blur timers
      Object.values(blurTimerRef.current).forEach(clearTimeout);
      blurTimerRef.current = {};
    };
  }, [estimateId]);

  // Focus handler — claim lock on trade section focus
  const handleTradeFocus = useCallback(
    async (trade: string) => {
      if (blurTimerRef.current[trade]) {
        clearTimeout(blurTimerRef.current[trade]);
        delete blurTimerRef.current[trade];
      }
      const result = await claimTradeLock(estimateId, trade);
      if (!result.success && result.lockedBy) {
        console.warn(`[CostEditor] Trade "${trade}" locked by another user`);
      }
    },
    [estimateId],
  );

  // Blur handler — release lock after 500ms delay
  const handleTradeBlur = useCallback(
    (trade: string) => {
      if (blurTimerRef.current[trade]) {
        clearTimeout(blurTimerRef.current[trade]);
      }
      blurTimerRef.current[trade] = setTimeout(() => {
        releaseTradeLock(estimateId, trade);
        delete blurTimerRef.current[trade];
      }, 500);
    },
    [estimateId],
  );

  // Helper: get lock for a trade (only if locked by another user)
  const getLockForTrade = useCallback(
    (trade: string): TradeLock | null => {
      const lock = activeLocks.find((l) => l.trade === trade);
      if (!lock) return null;
      if (lock.locked_by === currentUserId) return null;
      return lock;
    },
    [activeLocks, currentUserId],
  );

  // Calculate totals
  const totals = useMemo(() => {
    const materialTotal = costLineItems.reduce(
      (sum, item) => sum + item.materialCost * item.quantity,
      0,
    );
    const laborTotal = costLineItems.reduce(
      (sum, item) => sum + item.laborCost * item.quantity,
      0,
    );
    const equipmentTotal = costLineItems.reduce(
      (sum, item) => sum + item.equipmentCost * item.quantity,
      0,
    );
    const grandTotal = materialTotal + laborTotal + equipmentTotal;

    return {
      material: materialTotal,
      labor: laborTotal,
      equipment: equipmentTotal,
      grand: grandTotal,
    };
  }, [costLineItems]);

  // Group by trade
  const itemsByTrade = useMemo(() => {
    const groups = new Map<string, CostLineItem[]>();

    costLineItems.forEach((item) => {
      const takeoffItem = takeoffItems.find((t) => t.id === item.takeoffItemId);
      const trade = takeoffItem?.trade || "Other";

      if (!groups.has(trade)) {
        groups.set(trade, []);
      }
      groups.get(trade)!.push(item);
    });

    return Array.from(groups.entries()).sort((a, b) =>
      a[0].localeCompare(b[0]),
    );
  }, [costLineItems, takeoffItems]);

  const handleUpdateLineItem = (
    itemId: string,
    updates: Partial<CostLineItem>,
  ) => {
    setCostLineItems((prev) =>
      prev.map((item) => {
        if (item.id !== itemId) return item;

        const updated = { ...item, ...updates };
        updated.subtotal =
          (updated.materialCost + updated.laborCost + updated.equipmentCost) *
          updated.quantity;

        return updated;
      }),
    );
  };

  const handleDeleteLineItem = (itemId: string) => {
    setCostLineItems((prev) => prev.filter((item) => item.id !== itemId));
  };

  const handleAddManualItem = (
    newItem: Omit<CostLineItem, "id" | "subtotal">,
  ) => {
    const id = crypto.randomUUID();
    const subtotal =
      (newItem.materialCost + newItem.laborCost + newItem.equipmentCost) *
      newItem.quantity;

    setCostLineItems((prev) => [...prev, { ...newItem, id, subtotal }]);
    setShowAddModal(false);
  };

  const handleLoadTemplate = (
    templateItems: Omit<CostLineItem, "id" | "subtotal">[],
  ) => {
    const newItems = templateItems.map((item) => ({
      ...item,
      id: crypto.randomUUID(),
      subtotal:
        (item.materialCost + item.laborCost + item.equipmentCost) *
        item.quantity,
    }));

    setCostLineItems((prev) => [...prev, ...newItems]);
    setShowLoadTemplateModal(false);
  };

  return (
    <div
      className="flex flex-col h-[calc(100dvh-200px)] gap-4"
      data-testid="cost-editor"
    >
      {/* Header with actions */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-construction-blue/10 dark:bg-construction-blue/20 flex items-center justify-center">
            <Calculator className="w-5 h-5 text-construction-blue dark:text-construction-blue" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">
              Cost Breakdown
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {costLineItems.length} line items
            </p>
          </div>
        </div>

        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => setShowLoadTemplateModal(true)}
            className="min-h-[44px] min-w-[44px] active:scale-95"
          >
            <FolderOpen className="w-4 h-4 mr-2" />
            Load Template
          </Button>

          <Button
            size="sm"
            variant="outline"
            onClick={() => setShowSaveTemplateModal(true)}
            disabled={costLineItems.length === 0}
            className="min-h-[44px] min-w-[44px] active:scale-95"
          >
            <Save className="w-4 h-4 mr-2" />
            Save Template
          </Button>

          <Button
            size="sm"
            onClick={() => setShowAddModal(true)}
            className="min-h-[44px] min-w-[44px] active:scale-95"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Item
          </Button>
        </div>
      </div>

      {/* Totals summary */}
      <div className="grid grid-cols-4 gap-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
        <div>
          <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">
            Material
          </p>
          <p className="text-lg font-bold text-gray-900 dark:text-gray-100">
            ${totals.material.toLocaleString()}
          </p>
        </div>
        <div>
          <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Labor</p>
          <p className="text-lg font-bold text-gray-900 dark:text-gray-100">
            ${totals.labor.toLocaleString()}
          </p>
        </div>
        <div>
          <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">
            Equipment
          </p>
          <p className="text-lg font-bold text-gray-900 dark:text-gray-100">
            ${totals.equipment.toLocaleString()}
          </p>
        </div>
        <div>
          <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Total</p>
          <p className="text-xl font-bold text-construction-blue dark:text-construction-blue">
            ${totals.grand.toLocaleString()}
          </p>
        </div>
      </div>

      {/* Cost line items by trade */}
      <div className="flex-1 overflow-y-auto space-y-6 pb-[180px]">
        {itemsByTrade.length > 0 ? (
          itemsByTrade.map(([trade, items]) => {
            const tradeLock = getLockForTrade(trade);
            const isLockedByOther = tradeLock !== null;

            return (
              <div
                key={trade}
                className="space-y-2"
                onFocus={() => handleTradeFocus(trade)}
                onBlur={() => handleTradeBlur(trade)}
              >
                <div className="flex items-center gap-2">
                  <Badge
                    variant="outline"
                    className="text-xs dark:border-gray-600 dark:text-gray-300"
                  >
                    {trade}
                  </Badge>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {items.length} items
                  </span>
                </div>

                {isLockedByOther ? (
                  <TradeLockBanner
                    trade={trade}
                    lockedByName={tradeLock.locked_by_name ?? "Another user"}
                    lockedByColor={deriveUserColor(tradeLock.locked_by)}
                  />
                ) : null}

                <div
                  className={
                    isLockedByOther ? "pointer-events-none opacity-70" : ""
                  }
                >
                  {items.map((item) => (
                    <CostLineItemRow
                      key={item.id}
                      item={item}
                      onUpdate={(updates) =>
                        handleUpdateLineItem(item.id, updates)
                      }
                      onDelete={() => handleDeleteLineItem(item.id)}
                    />
                  ))}
                </div>
              </div>
            );
          })
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Calculator className="w-12 h-12 text-gray-400 dark:text-gray-600 mb-3" />
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              No cost items yet. Add items manually or load a pricing template.
            </p>
            <Button
              onClick={() => setShowAddModal(true)}
              className="min-h-[44px] min-w-[44px] active:scale-95"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add First Item
            </Button>
          </div>
        )}
      </div>

      {/* Modals */}
      {showAddModal ? (
        <AddManualItemModal
          onClose={() => setShowAddModal(false)}
          onSave={handleAddManualItem}
        />
      ) : null}

      {showLoadTemplateModal ? (
        <PricingTemplateModal
          projectId={projectId}
          onClose={() => setShowLoadTemplateModal(false)}
          onSelect={handleLoadTemplate}
        />
      ) : null}

      {showSaveTemplateModal ? (
        <SaveTemplateModal
          projectId={projectId}
          costLineItems={costLineItems}
          onClose={() => setShowSaveTemplateModal(false)}
          onSave={() => setShowSaveTemplateModal(false)}
        />
      ) : null}

      {/* Sticky Cost Bar */}
      <StickyCostBar
        costLineItems={costLineItems}
        takeoffItems={takeoffItems}
        overheadPct={overheadPct}
        markupPct={markupPct}
      />
    </div>
  );
}
