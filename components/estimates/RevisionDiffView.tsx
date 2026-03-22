"use client";

import { useState, useEffect, memo } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import Plus from "lucide-react/icons/plus";
import Minus from "lucide-react/icons/minus";
import Edit from "lucide-react/icons/edit";
import Check from "lucide-react/icons/check";
import X from "lucide-react/icons/x";
import Loader2 from "lucide-react/icons/loader-2";
import {
  getRevisionDiff,
  applyRevisionChange,
  bulkApplyRevisionChanges,
} from "@/app/actions/revisions";

type ChangeType = "added" | "removed" | "modified";

interface DiffChange {
  id: string;
  type: ChangeType;
  item: {
    trade: string;
    description: string;
    quantity: number;
    unit: string;
    unitCost?: number;
  };
  oldQuantity?: number;
  newQuantity?: number;
  costDelta: number;
}

interface DiffSummary {
  added: number;
  removed: number;
  modified: number;
  totalCostDelta: number;
}

interface RevisionDiffViewProps {
  revisionId: string;
  onClose?: () => void;
}

// Memoized row component for performance
const DiffChangeRow = memo(function DiffChangeRow({
  change,
  isSelected,
  isApplied,
  onToggleSelect,
  onApply,
  onReject,
}: {
  change: DiffChange;
  isSelected: boolean;
  isApplied: boolean;
  onToggleSelect: (id: string) => void;
  onApply: (id: string) => void;
  onReject: (id: string) => void;
}) {
  const bgColor =
    change.type === "added"
      ? "bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-900/40"
      : change.type === "removed"
        ? "bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-900/40"
        : "bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/40";

  const icon =
    change.type === "added" ? (
      <Plus className="w-4 h-4 text-green-600 dark:text-green-400" />
    ) : change.type === "removed" ? (
      <Minus className="w-4 h-4 text-red-600 dark:text-red-400" />
    ) : (
      <Edit className="w-4 h-4 text-amber-600 dark:text-amber-400" />
    );

  return (
    <div
      className={`p-3 border rounded-lg ${bgColor}`}
      style={{ contentVisibility: "auto" }}
    >
      <div className="flex items-start gap-3">
        <Checkbox
          checked={isSelected}
          onCheckedChange={() => onToggleSelect(change.id)}
          aria-label={`Select change ${change.id}`}
          className="mt-1 min-h-[24px] min-w-[24px]"
        />

        <div className="flex-1 min-w-0">
          <div className="flex items-start gap-2 mb-2">
            {icon}
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                {change.item.trade} - {change.item.description}
              </p>
              {change.type === "modified" ? (
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  Quantity: {change.oldQuantity} {change.item.unit} →{" "}
                  {change.newQuantity} {change.item.unit}
                </p>
              ) : (
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  {change.item.quantity} {change.item.unit}
                </p>
              )}
            </div>
          </div>

          {change.costDelta !== 0 ? (
            <p
              className={`text-xs font-medium ${
                change.costDelta > 0
                  ? "text-red-600 dark:text-red-400"
                  : "text-green-600 dark:text-green-400"
              }`}
            >
              {change.costDelta > 0 ? "+" : ""}$
              {change.costDelta.toLocaleString()}
            </p>
          ) : null}
        </div>

        {!isApplied ? (
          <div className="flex gap-2 flex-shrink-0">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onApply(change.id)}
              className="min-h-[44px] min-w-[44px] p-2 active:scale-95"
              aria-label="Accept change"
            >
              <Check className="w-4 h-4 text-green-600 dark:text-green-400" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onReject(change.id)}
              className="min-h-[44px] min-w-[44px] p-2 active:scale-95"
              aria-label="Reject change"
            >
              <X className="w-4 h-4 text-red-600 dark:text-red-400" />
            </Button>
          </div>
        ) : (
          <div className="flex items-center gap-2 flex-shrink-0">
            <Check className="w-4 h-4 text-green-600 dark:text-green-400" />
            <span className="text-xs text-gray-600 dark:text-gray-400">
              Applied
            </span>
          </div>
        )}
      </div>
    </div>
  );
});

export function RevisionDiffView({
  revisionId,
  onClose,
}: RevisionDiffViewProps) {
  const [changes, setChanges] = useState<DiffChange[]>([]);
  const [summary, setSummary] = useState<DiffSummary | null>(null);
  const [appliedChanges, setAppliedChanges] = useState<string[]>([]);
  const [selectedChanges, setSelectedChanges] = useState<Set<string>>(
    new Set(),
  );
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [processingChanges, setProcessingChanges] = useState<Set<string>>(
    new Set(),
  );

  // Fetch revision diff
  useEffect(() => {
    setIsLoading(true);
    setError(null);

    getRevisionDiff(revisionId)
      .then((result) => {
        if (result.success && result.data) {
          const dataAny = result.data as any;
          const diffResults = dataAny.diff_results as {
            changes: DiffChange[];
            summary: DiffSummary;
          };
          setChanges(diffResults.changes || []);
          setSummary(diffResults.summary || null);
          setAppliedChanges((dataAny.changes_applied as string[]) || []);
        } else {
          setError(result.error || "Failed to load revision diff");
        }
      })
      .catch((err) => {
        setError(
          err instanceof Error ? err.message : "Failed to load revision diff",
        );
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [revisionId]);

  const handleToggleSelect = (id: string) => {
    setSelectedChanges((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleSelectAll = () => {
    const unappliedChanges = changes
      .filter((c) => !appliedChanges.includes(c.id))
      .map((c) => c.id);
    setSelectedChanges(new Set(unappliedChanges));
  };

  const handleDeselectAll = () => {
    setSelectedChanges(new Set());
  };

  const handleApplyChange = async (changeId: string) => {
    setProcessingChanges((prev) => new Set(prev).add(changeId));

    const result = await applyRevisionChange({
      revisionId,
      changeId,
      action: "accept",
    });

    setProcessingChanges((prev) => {
      const next = new Set(prev);
      next.delete(changeId);
      return next;
    });

    if (result.success) {
      setAppliedChanges((prev) => [...prev, changeId]);
      setSelectedChanges((prev) => {
        const next = new Set(prev);
        next.delete(changeId);
        return next;
      });
    } else {
      setError(result.error || "Failed to apply change");
    }
  };

  const handleRejectChange = async (changeId: string) => {
    setProcessingChanges((prev) => new Set(prev).add(changeId));

    const result = await applyRevisionChange({
      revisionId,
      changeId,
      action: "reject",
    });

    setProcessingChanges((prev) => {
      const next = new Set(prev);
      next.delete(changeId);
      return next;
    });

    if (result.success) {
      setAppliedChanges((prev) => prev.filter((id) => id !== changeId));
      setSelectedChanges((prev) => {
        const next = new Set(prev);
        next.delete(changeId);
        return next;
      });
    } else {
      setError(result.error || "Failed to reject change");
    }
  };

  const handleBulkAccept = async () => {
    if (selectedChanges.size === 0) return;

    setProcessingChanges(new Set(selectedChanges));

    const result = await bulkApplyRevisionChanges({
      revisionId,
      changeIds: Array.from(selectedChanges),
      action: "accept",
    });

    setProcessingChanges(new Set());

    if (result.success) {
      setAppliedChanges((prev) => [...prev, ...Array.from(selectedChanges)]);
      setSelectedChanges(new Set());
    } else {
      setError(result.error || "Failed to bulk accept changes");
    }
  };

  const handleBulkReject = async () => {
    if (selectedChanges.size === 0) return;

    setProcessingChanges(new Set(selectedChanges));

    const result = await bulkApplyRevisionChanges({
      revisionId,
      changeIds: Array.from(selectedChanges),
      action: "reject",
    });

    setProcessingChanges(new Set());

    if (result.success) {
      setAppliedChanges((prev) =>
        prev.filter((id) => !selectedChanges.has(id)),
      );
      setSelectedChanges(new Set());
    } else {
      setError(result.error || "Failed to bulk reject changes");
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-construction-blue" />
        <span className="ml-2 text-sm text-gray-500 dark:text-gray-400">
          Loading revision diff...
        </span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/40 rounded-lg">
        <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-[env(safe-area-inset-bottom)]">
      {/* Summary Section */}
      {summary ? (
        <div className="p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
          <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100 mb-3">
            Change Summary
          </h3>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <p className="text-xs text-gray-600 dark:text-gray-400">Added</p>
              <p className="text-lg font-bold text-green-600 dark:text-green-400">
                {summary.added}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                Removed
              </p>
              <p className="text-lg font-bold text-red-600 dark:text-red-400">
                {summary.removed}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                Modified
              </p>
              <p className="text-lg font-bold text-amber-600 dark:text-amber-400">
                {summary.modified}
              </p>
            </div>
          </div>
          {summary.totalCostDelta !== 0 ? (
            <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
              <p className="text-xs text-gray-600 dark:text-gray-400">
                Total Cost Impact
              </p>
              <p
                className={`text-lg font-bold ${
                  summary.totalCostDelta > 0
                    ? "text-red-600 dark:text-red-400"
                    : "text-green-600 dark:text-green-400"
                }`}
              >
                {summary.totalCostDelta > 0 ? "+" : ""}$
                {summary.totalCostDelta.toLocaleString()}
              </p>
            </div>
          ) : null}
        </div>
      ) : null}

      {/* Bulk Actions */}
      {changes.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleSelectAll}
            className="min-h-[44px] active:scale-95"
          >
            Select All
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleDeselectAll}
            className="min-h-[44px] active:scale-95"
          >
            Deselect All
          </Button>
          {selectedChanges.size > 0 ? (
            <>
              <Button
                variant="default"
                size="sm"
                onClick={handleBulkAccept}
                disabled={processingChanges.size > 0}
                className="min-h-[44px] active:scale-95 bg-green-600 hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-800"
              >
                Accept Selected ({selectedChanges.size})
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={handleBulkReject}
                disabled={processingChanges.size > 0}
                className="min-h-[44px] active:scale-95"
              >
                Reject Selected ({selectedChanges.size})
              </Button>
            </>
          ) : null}
        </div>
      ) : null}

      {/* Changes List */}
      <div className="space-y-2">
        {changes.length > 0 ? (
          changes.map((change) => (
            <DiffChangeRow
              key={change.id}
              change={change}
              isSelected={selectedChanges.has(change.id)}
              isApplied={appliedChanges.includes(change.id)}
              onToggleSelect={handleToggleSelect}
              onApply={handleApplyChange}
              onReject={handleRejectChange}
            />
          ))
        ) : (
          <div className="p-8 text-center">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              No changes detected between versions
            </p>
          </div>
        )}
      </div>

      {onClose ? (
        <Button
          variant="outline"
          onClick={onClose}
          className="w-full min-h-[44px] active:scale-95"
        >
          Close
        </Button>
      ) : null}
    </div>
  );
}
