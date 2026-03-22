"use client";

/**
 * FAB toolbar for plan measurement mode selection.
 * Task: EST-P3-001-F
 *
 * Skills: bundle-barrel-imports, rerender-memo, rerender-functional-setstate,
 *         rendering-conditional-render
 */

import { useState, useCallback, memo } from "react";
import { ScaleCalibrationWizard } from "@/components/estimates/ScaleCalibrationWizard";
import { cn } from "@/lib/utils";
import MoveIcon from "lucide-react/icons/move";
import PenSquareIcon from "lucide-react/icons/pen-square";
import MinusIcon from "lucide-react/icons/minus";
import HashIcon from "lucide-react/icons/hash";
import RulerIcon from "lucide-react/icons/ruler";
import SlidersIcon from "lucide-react/icons/sliders";

export type MeasurementMode = "select" | "area" | "linear" | "count";

interface PlanMeasurementToolsProps {
  planUploadId: string;
  scaleRatio?: number;
  onModeChange?: (mode: MeasurementMode) => void;
}

interface ModeButton {
  mode: MeasurementMode;
  label: string;
  Icon: React.ComponentType<{ className?: string }>;
}

// Static mode buttons config — hoisted outside render (rendering-hoist-jsx)
const MODE_BUTTONS: ModeButton[] = [
  { mode: "select", label: "Select / Pan", Icon: MoveIcon },
  { mode: "area", label: "Area", Icon: PenSquareIcon },
  { mode: "linear", label: "Linear", Icon: MinusIcon },
  { mode: "count", label: "Count", Icon: HashIcon },
];

export const PlanMeasurementTools = memo(function PlanMeasurementTools({
  planUploadId,
  scaleRatio,
  onModeChange,
}: PlanMeasurementToolsProps) {
  const [isPaletteOpen, setIsPaletteOpen] = useState(false);
  const [activeMode, setActiveMode] = useState<MeasurementMode>("select");
  const [isCalibrationOpen, setIsCalibrationOpen] = useState(false);

  const handleFabClick = useCallback(() => {
    setIsPaletteOpen((prev) => !prev);
  }, []);

  const handleModeSelect = useCallback(
    (mode: MeasurementMode) => {
      setActiveMode(mode);
      setIsPaletteOpen(false);
      onModeChange?.(mode);
    },
    [onModeChange],
  );

  const handleOpenCalibration = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setIsPaletteOpen(false);
    setIsCalibrationOpen(true);
  }, []);

  const handleCalibrationComplete = useCallback((_scaleRatio: number) => {
    setIsCalibrationOpen(false);
  }, []);

  const handleCalibrationCancel = useCallback(() => {
    setIsCalibrationOpen(false);
  }, []);

  return (
    <>
      {/* FAB container — bottom-left, safe area inset */}
      <div
        className="absolute bottom-4 left-4 z-20 flex flex-col items-start gap-2 pb-[env(safe-area-inset-bottom)]"
        style={{ pointerEvents: "none" }}
      >
        {/* Tool palette (opens above FAB) */}
        {isPaletteOpen ? (
          <div
            className="flex flex-col gap-1 mb-2 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 p-2"
            style={{ pointerEvents: "auto" }}
          >
            {/* Mode buttons */}
            {MODE_BUTTONS.map(({ mode, label, Icon }) => (
              <button
                key={mode}
                onClick={() => handleModeSelect(mode)}
                aria-label={label}
                className={cn(
                  "flex items-center gap-2 min-h-[44px] px-3 rounded-lg text-sm font-medium transition-colors active:scale-95",
                  activeMode === mode
                    ? "bg-[#001B51] text-white"
                    : "text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 active:bg-gray-200 dark:active:bg-gray-600",
                )}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span>{label}</span>
              </button>
            ))}

            {/* Divider */}
            <div className="h-px bg-gray-200 dark:bg-gray-700 my-1" />

            {/* Scale calibration button */}
            <button
              onClick={handleOpenCalibration}
              aria-label="Calibrate scale"
              className="flex items-center gap-2 min-h-[44px] px-3 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 active:bg-gray-200 dark:active:bg-gray-600 active:scale-95 transition-colors"
            >
              <RulerIcon className="w-4 h-4 shrink-0" />
              <span>Calibrate Scale</span>
              {scaleRatio !== undefined && scaleRatio > 0 ? (
                <span className="ml-auto text-xs text-green-600 dark:text-green-400">
                  Set
                </span>
              ) : null}
            </button>
          </div>
        ) : null}

        {/* FAB button */}
        <button
          onClick={handleFabClick}
          aria-label={
            isPaletteOpen ? "Close measurement tools" : "Open measurement tools"
          }
          style={{ pointerEvents: "auto" }}
          className={cn(
            "flex items-center justify-center min-h-[44px] min-w-[44px] w-[44px] h-[44px] rounded-full shadow-lg transition-all active:scale-95",
            isPaletteOpen
              ? "bg-gray-700 dark:bg-gray-600 text-white"
              : "bg-[#001B51] text-white hover:bg-[#002470] active:bg-[#001540]",
          )}
        >
          <SlidersIcon className="w-5 h-5" />
        </button>
      </div>

      {/* Active mode indicator badge */}
      {activeMode !== "select" ? (
        <div className="absolute bottom-4 left-[68px] z-20 flex items-center gap-1 px-2 h-[32px] rounded-full bg-[#001B51] text-white text-xs font-medium shadow-md pointer-events-none">
          {activeMode === "area" ? (
            <PenSquareIcon className="w-3 h-3" />
          ) : activeMode === "linear" ? (
            <MinusIcon className="w-3 h-3" />
          ) : (
            <HashIcon className="w-3 h-3" />
          )}
          <span className="capitalize">{activeMode}</span>
        </div>
      ) : null}

      {/* Scale Calibration Wizard */}
      <ScaleCalibrationWizard
        planUploadId={planUploadId}
        isOpen={isCalibrationOpen}
        onComplete={handleCalibrationComplete}
        onCancel={handleCalibrationCancel}
      />
    </>
  );
});
