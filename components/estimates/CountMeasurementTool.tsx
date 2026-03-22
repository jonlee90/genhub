"use client";

/**
 * SVG-based count tool — tap to place numbered circle markers.
 * Task: EST-P3-001-E
 *
 * Skills: bundle-barrel-imports, rerender-memo, rerender-functional-setstate,
 *         rendering-conditional-render
 */

import { useState, useCallback, useEffect, memo } from "react";
import XIcon from "lucide-react/icons/x";

interface Marker {
  x: number;
  y: number;
  index: number;
}

interface CountMeasurementToolProps {
  onComplete: (
    markers: Array<{ x: number; y: number; index: number }>,
    count: number,
  ) => void;
  onCancel: () => void;
}

export const CountMeasurementTool = memo(function CountMeasurementTool({
  onComplete,
  onCancel,
}: CountMeasurementToolProps) {
  const [markers, setMarkers] = useState<Marker[]>([]);

  // Escape key cancels
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        onCancel();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onCancel]);

  const handleSvgClick = useCallback((e: React.MouseEvent<SVGSVGElement>) => {
    if (e.button !== 0) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setMarkers((prev) => {
      const nextIndex = prev.length + 1;
      return [...prev, { x, y, index: nextIndex }];
    });
  }, []);

  const handleTouchStart = useCallback((e: React.TouchEvent<SVGSVGElement>) => {
    // Only single-finger touch places a marker
    if (e.touches.length !== 1) return;
    const touch = e.touches[0];
    const rect = e.currentTarget.getBoundingClientRect();
    const x = touch.clientX - rect.left;
    const y = touch.clientY - rect.top;
    setMarkers((prev) => {
      const nextIndex = prev.length + 1;
      return [...prev, { x, y, index: nextIndex }];
    });
  }, []);

  // Remove a marker and re-number remaining
  const handleMarkerClick = useCallback(
    (e: React.MouseEvent, markerIndex: number) => {
      e.stopPropagation();
      setMarkers((prev) =>
        prev
          .filter((m) => m.index !== markerIndex)
          .map((m, i) => ({ ...m, index: i + 1 })),
      );
    },
    [],
  );

  const handleFinish = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      onComplete(markers, markers.length);
    },
    [markers, onComplete],
  );

  // Fix 3: Render SVG + HTML buttons in a relative container (no foreignObject)
  return (
    <div className="absolute inset-0 pointer-events-none">
      <svg
        className="absolute inset-0 w-full h-full pointer-events-auto"
        style={{ cursor: "crosshair", touchAction: "none" }}
        onClick={handleSvgClick}
        onTouchStart={handleTouchStart}
      >
        {/* Numbered markers */}
        {markers.map((marker) => (
          <g key={marker.index}>
            {/* 44px invisible hit area */}
            <circle
              cx={marker.x}
              cy={marker.y}
              r={22}
              fill="transparent"
              style={{ cursor: "pointer" }}
              onClick={(e) => handleMarkerClick(e, marker.index)}
            />
            {/* Visible marker circle */}
            <circle
              cx={marker.x}
              cy={marker.y}
              r={14}
              fill="#001B51"
              stroke="white"
              strokeWidth={2}
              style={{ pointerEvents: "none" }}
            />
            <text
              x={marker.x}
              y={marker.y + 5}
              textAnchor="middle"
              fontSize={12}
              fontWeight={700}
              fill="white"
              style={{ userSelect: "none", pointerEvents: "none" }}
            >
              {marker.index}
            </text>
          </g>
        ))}

        {/* Count badge (top-left) */}
        {markers.length > 0 ? (
          <g>
            <rect
              x="8"
              y="8"
              width="80"
              height="32"
              rx="6"
              fill="rgba(0,27,81,0.85)"
            />
            <text
              x="48"
              y="29"
              textAnchor="middle"
              fontSize={13}
              fontWeight={600}
              fill="white"
              style={{ userSelect: "none", pointerEvents: "none" }}
            >
              Count: {markers.length}
            </text>
          </g>
        ) : null}

        {/* Instruction hint when no markers placed yet */}
        {markers.length === 0 ? (
          <g>
            <rect
              x="50%"
              y="16"
              width="230"
              height="28"
              rx="6"
              fill="rgba(0,27,81,0.85)"
              transform="translate(-115, 0)"
            />
            <text
              x="50%"
              y="35"
              textAnchor="middle"
              fontSize={12}
              fill="white"
              style={{ userSelect: "none", pointerEvents: "none" }}
            >
              Tap to place markers. Tap marker to remove.
            </text>
          </g>
        ) : null}
      </svg>

      {/* Fix 3: HTML overlay buttons — no foreignObject */}
      <div className="absolute top-2 right-2 flex flex-col gap-2 pointer-events-auto">
        {/* Finish button */}
        <button
          className="flex items-center justify-center min-h-[44px] px-3 rounded-lg bg-[#001B51] text-white text-sm font-medium shadow-md active:scale-95 transition-transform"
          onClick={handleFinish}
          aria-label="Finish count"
        >
          Done ({markers.length})
        </button>

        {/* Cancel button */}
        <button
          className="flex items-center justify-center min-h-[44px] min-w-[44px] w-[44px] h-[44px] rounded-full bg-white dark:bg-gray-800 shadow-md active:scale-95 transition-transform"
          onClick={(e) => {
            e.stopPropagation();
            onCancel();
          }}
          aria-label="Cancel count"
        >
          <XIcon className="w-5 h-5 text-gray-700 dark:text-gray-200" />
        </button>
      </div>
    </div>
  );
});
