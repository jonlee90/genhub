/**
 * MarkerListSheet Component
 * Bottom sheet displaying filterable list of markers for mobile spatial viewer
 *
 * Features:
 * - Uses ResponsiveModal for adaptive sheet behavior
 * - Scrollable list with 44px minimum touch targets
 * - Category icons and badges per marker
 * - Tap to focus marker in 3D view
 * - Empty state for no matches
 * - Mobile PWA optimized
 */

"use client";

import { useCallback } from "react";
import { m as motion, AnimatePresence } from "framer-motion";
// Performance optimization: Direct imports instead of barrel file (saves 200-800ms per page)
import MapPin from "lucide-react/icons/map-pin";
import FileText from "lucide-react/icons/file-text";
import Image from "lucide-react/icons/image";
import AlertCircle from "lucide-react/icons/alert-circle";
import TrendingUp from "lucide-react/icons/trending-up";
import Package from "lucide-react/icons/package";
import ShieldAlert from "lucide-react/icons/shield-alert";
import ClipboardList from "lucide-react/icons/clipboard-list";
import ChevronRight from "lucide-react/icons/chevron-right";
import { cn } from "@/lib/utils";
import { ResponsiveModal } from "@/components/ui/ResponsiveModal";
import { Badge } from "@/components/ui/badge";

// Marker interface matching the task requirements
export interface MarkerListItem {
  id: string;
  title: string;
  category: string;
  position?: { x: number; y: number; z: number };
}

export interface MarkerListSheetProps {
  isOpen: boolean;
  onClose: () => void;
  markers: MarkerListItem[];
  onMarkerSelect: (markerId: string) => void;
}

// Category to Lucide icon mapping
const CATEGORY_ICONS: Record<string, typeof MapPin> = {
  note: FileText,
  photo: Image,
  issue: AlertCircle,
  safety: ShieldAlert,
  progress: TrendingUp,
  material: Package,
  inspection: ClipboardList,
  rfi: FileText,
};

// Category to color mapping (construction theme)
const CATEGORY_COLORS: Record<
  string,
  { bg: string; text: string; border: string }
> = {
  note: { bg: "bg-blue-500", text: "text-blue-700", border: "border-blue-200" },
  photo: {
    bg: "bg-green-500",
    text: "text-green-700",
    border: "border-green-200",
  },
  issue: { bg: "bg-red-500", text: "text-red-700", border: "border-red-200" },
  safety: {
    bg: "bg-orange-500",
    text: "text-orange-700",
    border: "border-orange-200",
  },
  progress: {
    bg: "bg-yellow-500",
    text: "text-yellow-700",
    border: "border-yellow-200",
  },
  material: {
    bg: "bg-cyan-500",
    text: "text-cyan-700",
    border: "border-cyan-200",
  },
  inspection: {
    bg: "bg-indigo-500",
    text: "text-indigo-700",
    border: "border-indigo-200",
  },
  rfi: { bg: "bg-pink-500", text: "text-pink-700", border: "border-pink-200" },
};

// Default colors for unknown categories
const DEFAULT_COLORS = {
  bg: "bg-gray-500",
  text: "text-gray-700",
  border: "border-gray-200",
};

/**
 * Individual marker list item component
 * 44px minimum height for touch targets
 */
function MarkerItem({
  marker,
  onSelect,
}: {
  marker: MarkerListItem;
  onSelect: (id: string) => void;
}) {
  const Icon = CATEGORY_ICONS[marker.category] || MapPin;
  const colors = CATEGORY_COLORS[marker.category] || DEFAULT_COLORS;

  const handleTap = useCallback(() => {
    onSelect(marker.id);
  }, [marker.id, onSelect]);

  return (
    <motion.button
      onClick={handleTap}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      whileTap={{ scale: 0.98 }}
      className={cn(
        // Touch-friendly sizing (44px min height)
        "w-full min-h-[56px] px-4 py-3",
        // Flexbox layout
        "flex items-center gap-3",
        // Styling
        "bg-white rounded-xl",
        "border-2 border-gray-100",
        // Touch feedback
        "active:bg-gray-50 active:border-gray-200",
        "transition-all duration-150",
        // Text alignment
        "text-left",
      )}
      aria-label={`View ${marker.title} marker`}
    >
      {/* Category icon with colored background */}
      <div
        className={cn(
          "flex-shrink-0",
          "w-10 h-10 rounded-lg",
          "flex items-center justify-center",
          "text-white",
          colors.bg,
        )}
      >
        <Icon className="w-5 h-5" strokeWidth={2} />
      </div>

      {/* Title and category */}
      <div className="flex-1 min-w-0">
        <h4 className="font-semibold text-construction-blue text-base truncate">
          {marker.title}
        </h4>
        <div className="flex items-center gap-2 mt-0.5">
          <Badge
            variant="outline"
            className={cn(
              "text-[10px] uppercase font-bold px-1.5 py-0.5",
              colors.text,
              colors.border,
              "bg-white/80",
            )}
          >
            {marker.category}
          </Badge>
          {marker.position && (
            <span className="text-xs text-gray-400">
              <MapPin className="w-3 h-3 inline mr-0.5" />
              Located
            </span>
          )}
        </div>
      </div>

      {/* Chevron indicator */}
      <ChevronRight className="flex-shrink-0 w-5 h-5 text-gray-400" />
    </motion.button>
  );
}

/**
 * Empty state when no markers available
 */
function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
      <div className="w-16 h-16 mb-4 rounded-full bg-gray-100 flex items-center justify-center">
        <MapPin className="w-8 h-8 text-gray-400" />
      </div>
      <h3 className="font-bold text-construction-blue mb-2 text-lg">
        No Markers Found
      </h3>
      <p className="text-sm text-gray-600 max-w-[240px]">
        There are no markers to display. Create a marker in the 3D viewer to get
        started.
      </p>
    </div>
  );
}

/**
 * MarkerListSheet - Bottom sheet for mobile marker list
 */
export function MarkerListSheet({
  isOpen,
  onClose,
  markers,
  onMarkerSelect,
}: MarkerListSheetProps) {
  // Handle marker selection - close sheet and notify parent
  const handleMarkerSelect = useCallback(
    (markerId: string) => {
      onMarkerSelect(markerId);
      onClose();
    },
    [onMarkerSelect, onClose],
  );

  // Count total markers for subtitle
  const markerCount = markers.length;

  return (
    <ResponsiveModal
      isOpen={isOpen}
      onClose={onClose}
      icon={MapPin}
      title="Markers"
      theme="default"
      enableDragToDismiss
      closeOnBackdropClick
      closeOnEscape
      ariaLabel="Marker list"
      contentClassName="p-0"
    >
      {markers.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="px-4 pb-4">
          <AnimatePresence mode="popLayout">
            <div className="space-y-2">
              {markers.map((marker) => (
                <MarkerItem
                  key={marker.id}
                  marker={marker}
                  onSelect={handleMarkerSelect}
                />
              ))}
            </div>
          </AnimatePresence>
        </div>
      )}
    </ResponsiveModal>
  );
}

export default MarkerListSheet;
