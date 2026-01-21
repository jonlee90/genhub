import { MarkerFAB } from "./MarkerFAB";
import { MarkerFilterSheet } from "./MarkerFilterSheet";
import { MarkerListSheet } from "./MarkerListSheet";
import { cn } from "@/lib/utils";
import type { MarkerListItem } from "./MarkerListSheet";

interface SpatialViewerMobileControlsProps {
  isModelReady: boolean;
  isMobile: boolean;
  canEditMarkers: boolean;
  visibleMarkersCount: number;
  activeSheet: "filter" | "markers" | null;
  selectedFilterCategories: Set<string>;
  markerListItems: MarkerListItem[];
  onOpenFilterSheet: () => void;
  onOpenMarkersSheet: () => void;
  onCloseSheet: () => void;
  onApplyFilters: (categories: Set<string>) => void;
  onMarkerSelect: (markerId: string) => void;
  onFabClick: () => void;
}

export function SpatialViewerMobileControls({
  isModelReady,
  isMobile,
  canEditMarkers,
  visibleMarkersCount,
  activeSheet,
  selectedFilterCategories,
  markerListItems,
  onOpenFilterSheet,
  onOpenMarkersSheet,
  onCloseSheet,
  onApplyFilters,
  onMarkerSelect,
  onFabClick,
}: SpatialViewerMobileControlsProps) {
  if (!isModelReady || !isMobile) return null;

  return (
    <>
      <div className="absolute bottom-4 left-4 z-30 flex flex-col gap-2">
        <button
          onClick={onOpenFilterSheet}
          className={cn(
            "w-12 h-12 rounded-xl",
            "bg-white/90 backdrop-blur-sm",
            "border-2 border-gray-200",
            "shadow-lg",
            "flex items-center justify-center",
            "active:scale-[0.98] active:bg-gray-100",
            "transition-all duration-150",
          )}
          aria-label="Open filter options"
        >
          <svg
            className="w-5 h-5 text-construction-blue"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
            />
          </svg>
        </button>
        <button
          onClick={onOpenMarkersSheet}
          className={cn(
            "w-12 h-12 rounded-xl",
            "bg-white/90 backdrop-blur-sm",
            "border-2 border-gray-200",
            "shadow-lg",
            "flex items-center justify-center",
            "active:scale-[0.98] active:bg-gray-100",
            "transition-all duration-150",
            "relative",
          )}
          aria-label="Open markers list"
        >
          <svg
            className="w-5 h-5 text-construction-blue"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
            />
          </svg>
          {visibleMarkersCount > 0 && (
            <span className="absolute -top-1 -right-1 min-w-[20px] h-5 px-1 rounded-full bg-construction-blue text-white text-xs font-bold flex items-center justify-center">
              {visibleMarkersCount > 99 ? "99+" : visibleMarkersCount}
            </span>
          )}
        </button>
      </div>

      <MarkerFAB onClick={onFabClick} disabled={!canEditMarkers} />

      <MarkerFilterSheet
        isOpen={activeSheet === "filter"}
        onClose={onCloseSheet}
        selectedCategories={selectedFilterCategories}
        onApplyFilters={onApplyFilters}
      />

      <MarkerListSheet
        isOpen={activeSheet === "markers"}
        onClose={onCloseSheet}
        markers={markerListItems}
        onMarkerSelect={onMarkerSelect}
      />
    </>
  );
}
