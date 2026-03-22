"use client";

/**
 * 3-step scale calibration wizard using ResponsiveModal.
 * Task: EST-P3-001-E
 *
 * Skills: bundle-barrel-imports, rerender-memo, rerender-functional-setstate,
 *         rendering-conditional-render
 */

import { useState, useCallback, useRef, useMemo, memo } from "react";
import { ResponsiveModal } from "@/components/ui/ResponsiveModal/index";
import { calibratePlanScale } from "@/app/actions/estimates";
import { pointDistance } from "@/lib/measurements/geometry";
import { deriveScaleRatio } from "@/lib/measurements/plan-scale";
import RulerIcon from "lucide-react/icons/ruler";

interface ScaleCalibrationWizardProps {
  planUploadId: string;
  isOpen: boolean;
  onComplete: (scaleRatio: number) => void;
  onCancel: () => void;
}

type Step = "draw" | "enter" | "confirm";
type Unit = "feet" | "inches";

interface DrawnLine {
  start: { x: number; y: number };
  end: { x: number; y: number };
}

function toFeet(value: number, unit: Unit): number {
  return unit === "inches" ? value / 12 : value;
}

export const ScaleCalibrationWizard = memo(function ScaleCalibrationWizard({
  planUploadId,
  isOpen,
  onComplete,
  onCancel,
}: ScaleCalibrationWizardProps) {
  const [step, setStep] = useState<Step>("draw");
  const [drawnLine, setDrawnLine] = useState<DrawnLine | null>(null);
  const [drawingStart, setDrawingStart] = useState<{
    x: number;
    y: number;
  } | null>(null);
  const [previewEnd, setPreviewEnd] = useState<{ x: number; y: number } | null>(
    null,
  );
  const [realWorldValue, setRealWorldValue] = useState<string>("");
  const [unit, setUnit] = useState<Unit>("feet");
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  const drawnPixels = useMemo(() => {
    if (!drawnLine) return 0;
    return pointDistance(drawnLine.start, drawnLine.end);
  }, [drawnLine]);

  const scaleRatio = useMemo(() => {
    const realFeet = parseFloat(realWorldValue);
    if (!realFeet || realFeet <= 0 || drawnPixels <= 0) return 0;
    return deriveScaleRatio(drawnPixels, toFeet(realFeet, unit));
  }, [drawnPixels, realWorldValue, unit]);

  const handleSvgMouseDown = useCallback(
    (e: React.MouseEvent<SVGSVGElement>) => {
      if (e.button !== 0) return;
      const rect = e.currentTarget.getBoundingClientRect();
      const start = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      };
      setDrawingStart(start);
      setPreviewEnd(null);
      setDrawnLine(null);
    },
    [],
  );

  const handleSvgMouseMove = useCallback(
    (e: React.MouseEvent<SVGSVGElement>) => {
      if (!drawingStart) return;
      const rect = e.currentTarget.getBoundingClientRect();
      setPreviewEnd({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      });
    },
    [drawingStart],
  );

  const handleSvgMouseUp = useCallback(
    (e: React.MouseEvent<SVGSVGElement>) => {
      if (!drawingStart) return;
      const rect = e.currentTarget.getBoundingClientRect();
      const end = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      };
      const dist = pointDistance(drawingStart, end);
      if (dist > 10) {
        setDrawnLine({ start: drawingStart, end });
      }
      setDrawingStart(null);
      setPreviewEnd(null);
    },
    [drawingStart],
  );

  const handleTouchStart = useCallback((e: React.TouchEvent<SVGSVGElement>) => {
    if (e.touches.length !== 1) return;
    const touch = e.touches[0];
    const rect = e.currentTarget.getBoundingClientRect();
    setDrawingStart({
      x: touch.clientX - rect.left,
      y: touch.clientY - rect.top,
    });
  }, []);

  const handleTouchMove = useCallback(
    (e: React.TouchEvent<SVGSVGElement>) => {
      if (!drawingStart || e.touches.length !== 1) return;
      const touch = e.touches[0];
      const rect = e.currentTarget.getBoundingClientRect();
      setPreviewEnd({
        x: touch.clientX - rect.left,
        y: touch.clientY - rect.top,
      });
    },
    [drawingStart],
  );

  const handleTouchEnd = useCallback(
    (e: React.TouchEvent<SVGSVGElement>) => {
      if (!drawingStart) return;
      const touch = e.changedTouches[0];
      const rect = e.currentTarget.getBoundingClientRect();
      const end = {
        x: touch.clientX - rect.left,
        y: touch.clientY - rect.top,
      };
      const dist = pointDistance(drawingStart, end);
      if (dist > 10) {
        setDrawnLine({ start: drawingStart, end });
      }
      setDrawingStart(null);
      setPreviewEnd(null);
    },
    [drawingStart],
  );

  const handleSaveScale = useCallback(async () => {
    if (scaleRatio <= 0) return;
    setIsSaving(true);
    setSaveError(null);
    const result = await calibratePlanScale(planUploadId, scaleRatio);
    setIsSaving(false);
    if (result.error) {
      setSaveError(result.error);
      return;
    }
    onComplete(scaleRatio);
  }, [scaleRatio, planUploadId, onComplete]);

  const handleBack = useCallback(() => {
    if (step === "enter") setStep("draw");
    else if (step === "confirm") setStep("enter");
    else onCancel();
  }, [step, onCancel]);

  const handleContinue = useCallback(() => {
    if (step === "draw" && drawnLine) setStep("enter");
    else if (step === "enter" && scaleRatio > 0) setStep("confirm");
    else if (step === "confirm") {
      handleSaveScale();
    }
  }, [step, drawnLine, scaleRatio, handleSaveScale]);

  const stepIndex = step === "draw" ? 0 : step === "enter" ? 1 : 2;
  const canContinue =
    (step === "draw" && drawnLine !== null) ||
    (step === "enter" && scaleRatio > 0) ||
    (step === "confirm" && !isSaving);

  const drawStep = (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-gray-600 dark:text-gray-400">
        Click and drag on the canvas below to draw a line over a known dimension
        on the plan.
      </p>
      <div className="relative w-full h-48 bg-gray-50 dark:bg-gray-800 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600 overflow-hidden">
        <svg
          ref={svgRef}
          className="absolute inset-0 w-full h-full"
          style={{ cursor: "crosshair", touchAction: "none" }}
          onMouseDown={handleSvgMouseDown}
          onMouseMove={handleSvgMouseMove}
          onMouseUp={handleSvgMouseUp}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          {/* Confirmed line */}
          {drawnLine !== null ? (
            <g>
              <line
                x1={drawnLine.start.x}
                y1={drawnLine.start.y}
                x2={drawnLine.end.x}
                y2={drawnLine.end.y}
                stroke="#001B51"
                strokeWidth={2.5}
                strokeLinecap="round"
              />
              <circle
                cx={drawnLine.start.x}
                cy={drawnLine.start.y}
                r={5}
                fill="#001B51"
              />
              <circle
                cx={drawnLine.end.x}
                cy={drawnLine.end.y}
                r={5}
                fill="#001B51"
              />
            </g>
          ) : null}

          {/* Preview line while dragging */}
          {drawingStart !== null && previewEnd !== null ? (
            <line
              x1={drawingStart.x}
              y1={drawingStart.y}
              x2={previewEnd.x}
              y2={previewEnd.y}
              stroke="#001B51"
              strokeWidth={2}
              strokeDasharray="6 3"
              opacity={0.7}
            />
          ) : null}

          {/* Placeholder text */}
          {drawnLine === null && drawingStart === null ? (
            <text
              x="50%"
              y="50%"
              dominantBaseline="middle"
              textAnchor="middle"
              fontSize={13}
              fill="#9CA3AF"
              style={{ userSelect: "none", pointerEvents: "none" }}
            >
              Click and drag to draw a calibration line
            </text>
          ) : null}
        </svg>
      </div>
      {drawnLine !== null ? (
        <p className="text-xs text-green-600 dark:text-green-400">
          Line drawn: {Math.round(drawnPixels)} pixels. Click &quot;Next&quot;
          to enter real-world length.
        </p>
      ) : null}
    </div>
  );

  const enterStep = (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-gray-600 dark:text-gray-400">
        Enter the real-world length of the line you drew.
      </p>
      <div className="flex gap-3">
        <div className="flex-1">
          <label
            htmlFor="real-world-value"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
          >
            Length
          </label>
          <input
            id="real-world-value"
            type="number"
            min="0.01"
            step="any"
            value={realWorldValue}
            onChange={(e) => setRealWorldValue(e.target.value)}
            className="w-full min-h-[44px] rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-[#001B51]"
            placeholder="e.g. 20"
          />
        </div>
        <div>
          <label
            htmlFor="unit-select"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
          >
            Unit
          </label>
          <select
            id="unit-select"
            value={unit}
            onChange={(e) => setUnit(e.target.value as Unit)}
            className="min-h-[44px] rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-[#001B51]"
          >
            <option value="feet">Feet</option>
            <option value="inches">Inches</option>
          </select>
        </div>
      </div>
    </div>
  );

  const confirmStep = (
    <div className="flex flex-col gap-4">
      <div className="rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-4">
        <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Scale Summary
        </p>
        <div className="flex items-center gap-2">
          <span className="text-2xl font-bold text-[#001B51] dark:text-blue-400">
            1 ft
          </span>
          <span className="text-gray-500">=</span>
          <span className="text-2xl font-bold text-[#001B51] dark:text-blue-400">
            {Math.round(scaleRatio)} px
          </span>
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
          Drawn: {Math.round(drawnPixels)} pixels &mdash; Real: {realWorldValue}{" "}
          {unit}
        </p>
      </div>
      {saveError !== null ? (
        <p className="text-sm text-red-600 dark:text-red-400">{saveError}</p>
      ) : null}
    </div>
  );

  const stepContent =
    step === "draw" ? drawStep : step === "enter" ? enterStep : confirmStep;

  return (
    <ResponsiveModal
      isOpen={isOpen}
      onClose={onCancel}
      icon={RulerIcon}
      title="Calibrate Plan Scale"
      steps={["Draw Line", "Enter Length", "Confirm"]}
      currentStep={stepIndex}
      totalSteps={3}
      showNavigation
      onBack={handleBack}
      onContinue={handleContinue}
      backLabel={step === "draw" ? "Cancel" : "Back"}
      continueLabel={
        step === "confirm" ? (isSaving ? "Saving..." : "Save Scale") : "Next"
      }
      continueDisabled={!canContinue || isSaving}
      maxWidth="md"
    >
      <div className="p-4">{stepContent}</div>
    </ResponsiveModal>
  );
});
