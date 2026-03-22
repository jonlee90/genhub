"use client";

import { useState, useRef, useCallback, useMemo, useEffect } from "react";
import { Button } from "@/components/ui/button";
import ChevronLeft from "lucide-react/icons/chevron-left";
import ChevronRight from "lucide-react/icons/chevron-right";
import ZoomIn from "lucide-react/icons/zoom-in";
import ZoomOut from "lucide-react/icons/zoom-out";
import { cn } from "@/lib/utils";
import {
  PlanOverlayLayer,
  type OverlayItem,
} from "@/components/estimates/PlanOverlayLayer";
import { TradeFilterChips } from "@/components/estimates/TradeFilterChips";
import { AreaMeasurementTool } from "@/components/estimates/AreaMeasurementTool";
import { LinearMeasurementTool } from "@/components/estimates/LinearMeasurementTool";
import { CountMeasurementTool } from "@/components/estimates/CountMeasurementTool";
import { saveMeasurement, getMeasurements } from "@/app/actions/estimates";
import type { Point } from "@/lib/measurements/geometry";
import type { MeasurementMode } from "@/components/estimates/PlanMeasurementTools";

type SourceRegion = {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  trade?: string;
  constructionStatus?: "new" | "existing_to_remain" | "demolition" | null;
};

type MeasurementSavePayload = {
  type: "area" | "linear" | "count";
  points: Array<{ x: number; y: number }>;
  result: { value: number; unit: string };
};

type SavedMeasurement = {
  id: string;
  measurement_type: "area" | "linear" | "count";
  points: Array<{ x: number; y: number }>;
  result_value: number | null;
  result_unit: string | null;
};

type PlanViewerProps = {
  imageUrl: string;
  regions?: SourceRegion[];
  activeRegionId?: string;
  onRegionClick?: (id: string) => void;
  pages?: string[];
  currentPageIndex?: number;
  onPageChange?: (index: number) => void;
  showOverlays?: boolean;
  isMobile?: boolean;
  // Measurement tool props (EST-P3-001-F)
  measurementMode?: MeasurementMode;
  scaleRatio?: number;
  planUploadId?: string;
  pageNumber?: number;
  onMeasurementSave?: (measurement: MeasurementSavePayload) => void;
};

export function PlanViewer({
  imageUrl,
  regions = [],
  activeRegionId,
  onRegionClick,
  pages = [],
  currentPageIndex = 0,
  onPageChange,
  showOverlays = true,
  isMobile = false,
  measurementMode,
  scaleRatio = 0,
  planUploadId,
  pageNumber = 1,
  onMeasurementSave,
}: PlanViewerProps) {
  const [zoom, setZoom] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [visibleTrades, setVisibleTrades] = useState<Record<string, boolean>>(
    {},
  );
  const [savedMeasurements, setSavedMeasurements] = useState<
    SavedMeasurement[]
  >([]);
  const containerRef = useRef<HTMLDivElement>(null);

  // Fix 5: Load persisted measurements when planUploadId / pageNumber change
  useEffect(() => {
    if (!planUploadId || pageNumber === undefined) return;
    getMeasurements(planUploadId, pageNumber).then(({ data }) => {
      if (data) {
        setSavedMeasurements(
          data.map((m) => ({
            id: m.id,
            measurement_type: m.measurement_type,
            points: (m.points as Array<{ x: number; y: number }>) ?? [],
            result_value: m.result_value,
            result_unit: m.result_unit,
          })),
        );
      }
    });
  }, [planUploadId, pageNumber]);

  // Extract unique trades from regions
  const trades = useMemo(() => {
    const tradeSet = new Set<string>();
    regions.forEach((region) => {
      if (region.trade) {
        tradeSet.add(region.trade.toLowerCase());
      }
    });
    return Array.from(tradeSet).sort();
  }, [regions]);

  // Convert regions to overlay items
  const overlayItems = useMemo((): OverlayItem[] => {
    return regions
      .filter((region) => region.trade)
      .map((region) => ({
        id: region.id,
        trade: region.trade!.toLowerCase(),
        sourceRegion: {
          x: region.x,
          y: region.y,
          width: region.width,
          height: region.height,
        },
        constructionStatus: region.constructionStatus,
      }));
  }, [regions]);

  // Toggle trade visibility
  const handleToggleTrade = useCallback((trade: string) => {
    setVisibleTrades((prev) => ({
      ...prev,
      [trade]: prev[trade] === false ? true : false,
    }));
  }, []);

  const handleZoomIn = useCallback(() => {
    setZoom((prev) => Math.min(prev + 0.25, 5));
  }, []);

  const handleZoomOut = useCallback(() => {
    setZoom((prev) => Math.max(prev - 0.25, 1));
  }, []);

  // Only allow drag when in select/no mode — measurement tools handle their own events
  const isMeasuring =
    measurementMode !== undefined && measurementMode !== "select";

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (isMeasuring) return;
      setIsDragging(true);
      setDragStart({ x: e.clientX, y: e.clientY });
    },
    [isMeasuring],
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (isMeasuring || !isDragging) return;

      const deltaX = e.clientX - dragStart.x;
      const deltaY = e.clientY - dragStart.y;

      setPosition((prev) => ({
        x: prev.x + deltaX,
        y: prev.y + deltaY,
      }));

      setDragStart({ x: e.clientX, y: e.clientY });
    },
    [isMeasuring, isDragging, dragStart],
  );

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handlePrevPage = useCallback(() => {
    if (onPageChange && currentPageIndex > 0) {
      onPageChange(currentPageIndex - 1);
    }
  }, [currentPageIndex, onPageChange]);

  const handleNextPage = useCallback(() => {
    if (
      onPageChange &&
      pages.length > 0 &&
      currentPageIndex < pages.length - 1
    ) {
      onPageChange(currentPageIndex + 1);
    }
  }, [currentPageIndex, pages.length, onPageChange]);

  // Handler for area/linear tool completion
  const handleAreaLinearComplete = useCallback(
    async (
      type: "area" | "linear",
      points: Point[],
      result: { value: number; unit: string },
    ) => {
      const payload: MeasurementSavePayload = { type, points, result };

      if (planUploadId) {
        await saveMeasurement({
          planUploadId,
          pageNumber,
          type,
          points,
          scaleRatio: scaleRatio > 0 ? scaleRatio : undefined,
          resultValue: result.value,
          resultUnit: result.unit,
        });
      }

      onMeasurementSave?.(payload);
    },
    [planUploadId, pageNumber, scaleRatio, onMeasurementSave],
  );

  const handleAreaComplete = useCallback(
    (points: Point[], result: { value: number; unit: string }) =>
      handleAreaLinearComplete("area", points, result),
    [handleAreaLinearComplete],
  );

  const handleLinearComplete = useCallback(
    (points: Point[], result: { value: number; unit: string }) =>
      handleAreaLinearComplete("linear", points, result),
    [handleAreaLinearComplete],
  );

  // Handler for count tool completion
  const handleCountComplete = useCallback(
    async (
      markers: Array<{ x: number; y: number; index: number }>,
      count: number,
    ) => {
      const points = markers.map(({ x, y }) => ({ x, y }));
      const payload: MeasurementSavePayload = {
        type: "count",
        points,
        result: { value: count, unit: "count" },
      };

      if (planUploadId) {
        await saveMeasurement({
          planUploadId,
          pageNumber,
          type: "count",
          points,
          scaleRatio: scaleRatio > 0 ? scaleRatio : undefined,
          resultValue: count,
          resultUnit: "count",
        });
      }

      onMeasurementSave?.(payload);
    },
    [planUploadId, pageNumber, scaleRatio, onMeasurementSave],
  );

  // No-op cancel — mode switching is handled by parent via measurementMode prop
  const handleToolCancel = useCallback(() => {
    // Parent is responsible for clearing measurementMode via onModeChange
  }, []);

  const hasMultiplePages = pages.length > 1;

  return (
    <div
      className="relative w-full h-full bg-gray-100 dark:bg-gray-900 rounded-lg overflow-hidden flex flex-col"
      data-testid="plan-viewer"
    >
      {/* Trade filter chips */}
      {showOverlays && trades.length > 0 && (
        <div className="p-4 pb-2">
          <TradeFilterChips
            trades={trades}
            visibleTrades={visibleTrades}
            onToggleTrade={handleToggleTrade}
          />
        </div>
      )}

      {/* Zoom controls */}
      <div className="absolute top-4 right-4 z-10 flex gap-2">
        <Button
          size="sm"
          variant="outline"
          onClick={handleZoomOut}
          disabled={zoom <= 1}
          className="min-h-[44px] min-w-[44px] bg-white dark:bg-gray-800 active:scale-95"
          aria-label="Zoom out"
        >
          <ZoomOut className="w-4 h-4" />
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={handleZoomIn}
          disabled={zoom >= 5}
          className="min-h-[44px] min-w-[44px] bg-white dark:bg-gray-800 active:scale-95"
          aria-label="Zoom in"
        >
          <ZoomIn className="w-4 h-4" />
        </Button>
      </div>

      {/* Image container */}
      <div
        ref={containerRef}
        className={cn(
          "w-full h-full flex items-center justify-center overflow-hidden flex-1",
          isMeasuring ? "cursor-crosshair" : "cursor-move",
        )}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <div
          className="relative"
          style={{
            transform: `scale(${zoom}) translate(${position.x}px, ${position.y}px)`,
            transformOrigin: "center center",
            willChange: "transform",
            transition: isDragging ? "none" : "transform 0.2s ease-out",
          }}
        >
          <img
            src={imageUrl}
            alt="Construction plan"
            className="max-w-full h-auto"
            draggable={false}
          />

          {/* Overlay layer with trade colors and construction status */}
          {showOverlays && overlayItems.length > 0 && (
            <PlanOverlayLayer
              items={overlayItems}
              visibleTrades={visibleTrades}
              selectedItemId={activeRegionId}
              onItemClick={onRegionClick}
              isMobile={isMobile}
            />
          )}

          {/* Legacy region overlays (fallback for regions without trade) */}
          {regions
            .filter((region) => !region.trade)
            .map((region) => (
              <button
                key={region.id}
                onClick={() => onRegionClick?.(region.id)}
                className={cn(
                  "absolute border-2 rounded transition-all active:scale-95",
                  activeRegionId === region.id
                    ? "border-construction-blue bg-construction-blue/20"
                    : "border-yellow-500 bg-yellow-500/10 hover:bg-yellow-500/20 active:bg-yellow-500/30",
                )}
                style={{
                  left: `${region.x}%`,
                  top: `${region.y}%`,
                  width: `${region.width}%`,
                  height: `${region.height}%`,
                }}
              />
            ))}

          {/* Fix 5: Persisted measurements overlay (non-interactive) */}
          {savedMeasurements.length > 0 ? (
            <svg className="absolute inset-0 w-full h-full pointer-events-none">
              {savedMeasurements.map((m) =>
                m.measurement_type === "area" ? (
                  <polygon
                    key={m.id}
                    points={m.points.map((p) => `${p.x},${p.y}`).join(" ")}
                    fill="rgba(59,130,246,0.15)"
                    stroke="rgb(59,130,246)"
                    strokeWidth={2}
                  />
                ) : m.measurement_type === "linear" ? (
                  <polyline
                    key={m.id}
                    points={m.points.map((p) => `${p.x},${p.y}`).join(" ")}
                    stroke="rgb(16,185,129)"
                    strokeWidth={2}
                    fill="none"
                  />
                ) : (
                  // count: numbered circles
                  <g key={m.id}>
                    {m.points.map((pt, idx) => (
                      <g key={idx}>
                        <circle
                          cx={pt.x}
                          cy={pt.y}
                          r={14}
                          fill="rgb(99,102,241)"
                          stroke="white"
                          strokeWidth={2}
                        />
                        <text
                          x={pt.x}
                          y={pt.y + 5}
                          textAnchor="middle"
                          fontSize={12}
                          fontWeight={700}
                          fill="white"
                          style={{ userSelect: "none" }}
                        >
                          {idx + 1}
                        </text>
                      </g>
                    ))}
                  </g>
                ),
              )}
            </svg>
          ) : null}

          {/* Measurement tool overlays — controlled by measurementMode prop */}
          {measurementMode === "area" ? (
            <AreaMeasurementTool
              scaleRatio={scaleRatio}
              onComplete={handleAreaComplete}
              onCancel={handleToolCancel}
            />
          ) : measurementMode === "linear" ? (
            <LinearMeasurementTool
              scaleRatio={scaleRatio}
              onComplete={handleLinearComplete}
              onCancel={handleToolCancel}
            />
          ) : measurementMode === "count" ? (
            <CountMeasurementTool
              onComplete={handleCountComplete}
              onCancel={handleToolCancel}
            />
          ) : null}
        </div>
      </div>

      {/* Page navigation */}
      {hasMultiplePages ? (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 flex items-center gap-2 bg-white dark:bg-gray-800 rounded-lg shadow-lg px-4 py-2">
          <Button
            size="sm"
            variant="ghost"
            onClick={handlePrevPage}
            disabled={currentPageIndex === 0}
            className="min-h-[44px] min-w-[44px] active:scale-95"
            aria-label="Previous page"
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>

          <span className="text-sm font-medium text-gray-900 dark:text-gray-100 px-2">
            {currentPageIndex + 1} / {pages.length}
          </span>

          <Button
            size="sm"
            variant="ghost"
            onClick={handleNextPage}
            disabled={currentPageIndex === pages.length - 1}
            className="min-h-[44px] min-w-[44px] active:scale-95"
            aria-label="Next page"
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      ) : null}
    </div>
  );
}
