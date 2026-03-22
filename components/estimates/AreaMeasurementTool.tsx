"use client";

/**
 * SVG-based polygon drawing tool for area measurements.
 * Task: EST-P3-001-D
 *
 * Skills: bundle-barrel-imports, rerender-memo, rerender-functional-setstate,
 *         rendering-conditional-render, rendering-hoist-jsx
 */

import { useState, useCallback, useMemo, useEffect, useRef, memo } from "react";
import {
  calculatePolygonArea,
  scalePixelsToFeet,
  type Point,
} from "@/lib/measurements/geometry";
import { formatMeasurement } from "@/lib/measurements/plan-scale";
import XIcon from "lucide-react/icons/x";

// Static SVG defs hoisted outside render cycle (rendering-hoist-jsx)
const SVG_DEFS = (
  <defs>
    <filter id="area-label-shadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="1" stdDeviation="1" floodOpacity="0.3" />
    </filter>
  </defs>
);

interface MeasurementToolProps {
  scaleRatio: number; // pixels per foot
  onComplete: (
    points: Point[],
    result: { value: number; unit: string },
  ) => void;
  onCancel: () => void;
}

export const AreaMeasurementTool = memo(function AreaMeasurementTool({
  scaleRatio,
  onComplete,
  onCancel,
}: MeasurementToolProps) {
  const [points, setPoints] = useState<Point[]>([]);
  const [cursorPos, setCursorPos] = useState<Point | null>(null);
  const clickTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Keyboard handler: Backspace removes last point, Escape cancels
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Backspace") {
        setPoints((prev) => prev.slice(0, -1));
      } else if (e.key === "Escape") {
        onCancel();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onCancel]);

  // Cleanup click timer on unmount
  useEffect(() => {
    return () => {
      if (clickTimerRef.current) clearTimeout(clickTimerRef.current);
    };
  }, []);

  // Fix 1: Delay point placement to cancel on double-click
  const handleSvgClick = useCallback((e: React.MouseEvent<SVGSVGElement>) => {
    if (e.button !== 0) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const pt = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    if (clickTimerRef.current) clearTimeout(clickTimerRef.current);
    clickTimerRef.current = setTimeout(() => {
      setPoints((prev) => [...prev, pt]);
    }, 220);
  }, []);

  // Fix 1: Clear timer first to prevent phantom point on double-click
  const handleSvgDoubleClick = useCallback(
    (e: React.MouseEvent<SVGSVGElement>) => {
      e.preventDefault();
      if (clickTimerRef.current) {
        clearTimeout(clickTimerRef.current);
        clickTimerRef.current = null;
      }
      if (points.length < 3) return;
      const areaPixels = calculatePolygonArea(points);
      const areaFeet =
        scaleRatio > 0
          ? scalePixelsToFeet(areaPixels, scaleRatio * scaleRatio)
          : areaPixels;
      onComplete(points, { value: areaFeet, unit: "sq ft" });
    },
    [points, scaleRatio, onComplete],
  );

  // Fix 2: Done button handler (same logic as double-click)
  const handleDone = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      if (points.length < 3) return;
      const areaPixels = calculatePolygonArea(points);
      const areaFeet =
        scaleRatio > 0
          ? scalePixelsToFeet(areaPixels, scaleRatio * scaleRatio)
          : areaPixels;
      onComplete(points, { value: areaFeet, unit: "sq ft" });
    },
    [points, scaleRatio, onComplete],
  );

  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setPoints((prev) => prev.slice(0, -1));
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent<SVGSVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setCursorPos({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  }, []);

  const handleTouchStart = useCallback((e: React.TouchEvent<SVGSVGElement>) => {
    // Only single-finger touch places a point
    if (e.touches.length !== 1) return;
    const touch = e.touches[0];
    const rect = e.currentTarget.getBoundingClientRect();
    const x = touch.clientX - rect.left;
    const y = touch.clientY - rect.top;
    setPoints((prev) => [...prev, { x, y }]);
  }, []);

  // Memoize the polygon points string (rerender-memo)
  const polygonPoints = useMemo(
    () => points.map((p) => `${p.x},${p.y}`).join(" "),
    [points],
  );

  // Live area calculation for label
  const liveArea = useMemo(() => {
    if (points.length < 3) return null;
    const areaPixels = calculatePolygonArea(points);
    const areaFeet =
      scaleRatio > 0
        ? scalePixelsToFeet(areaPixels, scaleRatio * scaleRatio)
        : areaPixels;
    return formatMeasurement(areaFeet, "sq ft");
  }, [points, scaleRatio]);

  const lastPoint = points[points.length - 1] ?? null;
  const canComplete = points.length >= 3;

  // Fix 3: Render SVG + HTML buttons in a relative container (no foreignObject)
  return (
    <div className="absolute inset-0 pointer-events-none">
      <svg
        className="absolute inset-0 w-full h-full pointer-events-auto"
        style={{ cursor: "crosshair", touchAction: "none" }}
        onClick={handleSvgClick}
        onDoubleClick={handleSvgDoubleClick}
        onContextMenu={handleContextMenu}
        onMouseMove={handleMouseMove}
        onTouchStart={handleTouchStart}
      >
        {SVG_DEFS}

        {/* Guide line from last placed point to cursor */}
        {lastPoint !== null && cursorPos !== null ? (
          <line
            x1={lastPoint.x}
            y1={lastPoint.y}
            x2={cursorPos.x}
            y2={cursorPos.y}
            stroke="#001B51"
            strokeWidth={1.5}
            strokeDasharray="6 3"
            opacity={0.7}
          />
        ) : null}

        {/* Filled polygon (in-progress) */}
        {points.length > 1 ? (
          <polygon
            points={polygonPoints}
            fill="#001B51"
            fillOpacity={0.15}
            stroke="#001B51"
            strokeWidth={2}
            strokeLinejoin="round"
          />
        ) : null}

        {/* Point circles with 44px hit areas */}
        {points.map((pt, idx) => (
          <g key={idx}>
            {/* Invisible large hit area (44px) */}
            <circle
              cx={pt.x}
              cy={pt.y}
              r={22}
              fill="transparent"
              style={{ cursor: "pointer" }}
            />
            {/* Visible dot */}
            <circle
              cx={pt.x}
              cy={pt.y}
              r={8}
              fill={idx === 0 ? "#001B51" : "white"}
              stroke="#001B51"
              strokeWidth={2}
            />
            {idx === 0 ? (
              <text
                x={pt.x}
                y={pt.y + 4}
                textAnchor="middle"
                fontSize={9}
                fill="white"
                style={{ userSelect: "none", pointerEvents: "none" }}
              >
                ●
              </text>
            ) : null}
          </g>
        ))}

        {/* Live area label near last point */}
        {liveArea !== null && lastPoint !== null ? (
          <g filter="url(#area-label-shadow)">
            <rect
              x={lastPoint.x + 12}
              y={lastPoint.y - 18}
              width={liveArea.length * 7 + 12}
              height={22}
              rx={4}
              fill="white"
            />
            <text
              x={lastPoint.x + 18}
              y={lastPoint.y - 2}
              fontSize={12}
              fontWeight={500}
              fill="#001B51"
              style={{ userSelect: "none", pointerEvents: "none" }}
            >
              {liveArea}
            </text>
          </g>
        ) : null}

        {/* Instruction hint */}
        {points.length === 0 ? (
          <g>
            <rect
              x="50%"
              y="16"
              width="260"
              height="28"
              rx="6"
              fill="rgba(0,27,81,0.85)"
              transform="translate(-130, 0)"
            />
            <text
              x="50%"
              y="35"
              textAnchor="middle"
              fontSize={12}
              fill="white"
              style={{ userSelect: "none", pointerEvents: "none" }}
            >
              Click to place points. Double-click to close polygon.
            </text>
          </g>
        ) : null}
      </svg>

      {/* Fix 3: HTML overlay buttons — no foreignObject */}
      <div className="absolute top-2 right-2 flex flex-col gap-2 pointer-events-auto">
        {/* Fix 2: Done button — visible when >= 3 points */}
        {canComplete ? (
          <button
            className="flex items-center justify-center min-h-[44px] px-3 rounded-lg bg-[#001B51] text-white text-sm font-medium shadow-md active:scale-95 transition-transform"
            onClick={handleDone}
            aria-label="Complete area measurement"
          >
            Done
          </button>
        ) : null}

        {/* Cancel button */}
        <button
          className="flex items-center justify-center min-h-[44px] min-w-[44px] w-[44px] h-[44px] rounded-full bg-white dark:bg-gray-800 shadow-md active:scale-95 transition-transform"
          onClick={(e) => {
            e.stopPropagation();
            onCancel();
          }}
          aria-label="Cancel measurement"
        >
          <XIcon className="w-5 h-5 text-gray-700 dark:text-gray-200" />
        </button>
      </div>
    </div>
  );
});
