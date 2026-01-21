/**
 * MarkerFilterSheet - Spatial Viewer Redesign Task 2.1
 * Bottom sheet for filtering markers by category on mobile
 * Uses ResponsiveModal for native PWA feel
 */

"use client";

import { useState, useEffect, useCallback } from "react";
// Performance optimization: Direct imports instead of barrel file (saves 200-800ms per page)
import Filter from "lucide-react/icons/filter";
import AlertCircle from "lucide-react/icons/alert-circle";
import Camera from "lucide-react/icons/camera";
import FileText from "lucide-react/icons/file-text";
import Ruler from "lucide-react/icons/ruler";
import { cn } from "@/lib/utils";
import { ResponsiveModal } from "@/components/ui/ResponsiveModal";

// Marker category configuration
const MARKER_CATEGORIES = [
  {
    id: "issue",
    label: "Issues",
    icon: AlertCircle,
    color: "text-red-600",
    bgColor: "bg-red-50",
  },
  {
    id: "photo",
    label: "Photos",
    icon: Camera,
    color: "text-blue-600",
    bgColor: "bg-blue-50",
  },
  {
    id: "note",
    label: "Notes",
    icon: FileText,
    color: "text-yellow-600",
    bgColor: "bg-yellow-50",
  },
  {
    id: "measurement",
    label: "Measurements",
    icon: Ruler,
    color: "text-purple-600",
    bgColor: "bg-purple-50",
  },
] as const;

export interface MarkerFilterSheetProps {
  /** Whether the sheet is open */
  isOpen: boolean;
  /** Close handler */
  onClose: () => void;
  /** Currently selected categories */
  selectedCategories: Set<string>;
  /** Apply filters handler - called with new category selection */
  onApplyFilters: (categories: Set<string>) => void;
}

export function MarkerFilterSheet({
  isOpen,
  onClose,
  selectedCategories,
  onApplyFilters,
}: MarkerFilterSheetProps) {
  // Local state for pending changes (not applied until user taps Apply)
  const [localSelection, setLocalSelection] = useState<Set<string>>(
    new Set(selectedCategories),
  );

  // Sync local state when sheet opens with current selection
  useEffect(() => {
    if (isOpen) {
      setLocalSelection(new Set(selectedCategories));
    }
  }, [isOpen, selectedCategories]);

  // Toggle a category in local selection
  const toggleCategory = useCallback((categoryId: string) => {
    setLocalSelection((prev) => {
      const next = new Set(prev);
      if (next.has(categoryId)) {
        next.delete(categoryId);
      } else {
        next.add(categoryId);
      }
      return next;
    });
  }, []);

  // Clear all selections
  const handleClearAll = useCallback(() => {
    setLocalSelection(new Set());
  }, []);

  // Apply filters and close
  const handleApply = useCallback(() => {
    onApplyFilters(localSelection);
    onClose();
  }, [localSelection, onApplyFilters, onClose]);

  // Check if all categories are selected
  const allSelected = localSelection.size === MARKER_CATEGORIES.length;
  const noneSelected = localSelection.size === 0;

  // Footer actions
  const leftActions = (
    <button
      onClick={handleClearAll}
      disabled={noneSelected}
      className={cn(
        "min-h-[44px] px-4 rounded-xl",
        "text-sm font-semibold",
        "transition-all duration-150",
        "active:scale-[0.98]",
        noneSelected
          ? "text-gray-400 cursor-not-allowed"
          : "text-gray-700 hover:bg-gray-100 active:bg-gray-200",
      )}
      aria-label="Clear all filter selections"
    >
      Clear All
    </button>
  );

  const rightActions = (
    <button
      onClick={handleApply}
      className={cn(
        "min-h-[44px] px-6 rounded-xl",
        "bg-construction-blue text-white",
        "text-sm font-semibold",
        "transition-all duration-150",
        "active:scale-[0.98] active:bg-construction-blue/90",
        "disabled:opacity-50 disabled:cursor-not-allowed",
      )}
      aria-label="Apply selected filters"
    >
      Apply
    </button>
  );

  return (
    <ResponsiveModal
      isOpen={isOpen}
      onClose={onClose}
      icon={Filter}
      title="Filter Markers"
      subtitle="Select marker types to display"
      leftActions={leftActions}
      rightActions={rightActions}
      showFooter
      snapPoints={["half"]}
      initialSnapPoint="half"
      ariaLabel="Filter markers by category"
      contentClassName="px-4"
    >
      <div className="space-y-3">
        {/* Category checkboxes */}
        {MARKER_CATEGORIES.map((category) => {
          const Icon = category.icon;
          const isSelected = localSelection.has(category.id);

          return (
            <button
              key={category.id}
              onClick={() => toggleCategory(category.id)}
              className={cn(
                "w-full flex items-center gap-4 p-4 rounded-xl",
                "min-h-[56px]", // 44px min + padding for comfortable touch
                "border-2 transition-all duration-150",
                "active:scale-[0.99]",
                isSelected
                  ? "border-construction-blue bg-construction-blue/5"
                  : "border-gray-200 hover:border-gray-300 active:bg-gray-50",
              )}
              role="checkbox"
              aria-checked={isSelected}
              aria-label={`${category.label} filter ${isSelected ? "selected" : "not selected"}`}
            >
              {/* Checkbox indicator */}
              <div
                className={cn(
                  "flex-shrink-0 w-6 h-6 rounded-md border-2",
                  "flex items-center justify-center",
                  "transition-all duration-150",
                  isSelected
                    ? "border-construction-blue bg-construction-blue"
                    : "border-gray-300 bg-white",
                )}
              >
                {isSelected && (
                  <svg
                    className="w-4 h-4 text-white"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={3}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                )}
              </div>

              {/* Icon with category color */}
              <div
                className={cn(
                  "flex-shrink-0 w-10 h-10 rounded-lg",
                  "flex items-center justify-center",
                  category.bgColor,
                )}
              >
                <Icon className={cn("w-5 h-5", category.color)} />
              </div>

              {/* Label */}
              <span className="flex-1 text-left text-base font-medium text-gray-900">
                {category.label}
              </span>
            </button>
          );
        })}

        {/* Quick action: Select All */}
        {!allSelected && (
          <button
            onClick={() => {
              const all = new Set(MARKER_CATEGORIES.map((c) => c.id));
              setLocalSelection(all);
            }}
            className={cn(
              "w-full min-h-[44px] py-3",
              "text-sm font-medium text-construction-blue",
              "rounded-xl border-2 border-dashed border-gray-200",
              "hover:border-construction-blue/30 hover:bg-construction-blue/5",
              "transition-all duration-150",
              "active:scale-[0.99]",
            )}
          >
            Select All Categories
          </button>
        )}
      </div>
    </ResponsiveModal>
  );
}
