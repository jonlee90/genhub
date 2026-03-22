"use client";

import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";

type ConfidenceThresholdSliderProps = {
  defaultValue?: number;
  onChange?: (value: number) => void;
};

const STORAGE_KEY = "genhub-confidence-threshold";

export function ConfidenceThresholdSlider({
  defaultValue = 85,
  onChange,
}: ConfidenceThresholdSliderProps) {
  const [threshold, setThreshold] = useState(defaultValue);

  // Load from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = parseInt(stored, 10);
      if (!isNaN(parsed) && parsed >= 0 && parsed <= 100) {
        setThreshold(parsed);
        onChange?.(parsed);
      }
    }
  }, [onChange]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value, 10);
    setThreshold(value);
    localStorage.setItem(STORAGE_KEY, value.toString());
    onChange?.(value);
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label
          htmlFor="confidence-threshold"
          className="text-sm font-medium text-gray-700 dark:text-gray-300"
        >
          High Confidence Threshold
        </label>
        <span className="text-sm font-bold text-construction-blue dark:text-construction-blue">
          {threshold}%
        </span>
      </div>

      <input
        id="confidence-threshold"
        type="range"
        min="60"
        max="100"
        step="5"
        value={threshold}
        onChange={handleChange}
        className={cn(
          "w-full h-2 rounded-lg appearance-none cursor-pointer",
          "bg-gray-200 dark:bg-gray-700",
          "min-h-[44px]", // Touch target height
          "[&::-webkit-slider-thumb]:appearance-none",
          "[&::-webkit-slider-thumb]:w-5",
          "[&::-webkit-slider-thumb]:h-5",
          "[&::-webkit-slider-thumb]:rounded-full",
          "[&::-webkit-slider-thumb]:bg-construction-blue",
          "[&::-webkit-slider-thumb]:cursor-pointer",
          "[&::-webkit-slider-thumb]:active:scale-110",
          "[&::-moz-range-thumb]:w-5",
          "[&::-moz-range-thumb]:h-5",
          "[&::-moz-range-thumb]:rounded-full",
          "[&::-moz-range-thumb]:bg-construction-blue",
          "[&::-moz-range-thumb]:border-0",
          "[&::-moz-range-thumb]:cursor-pointer",
          "[&::-moz-range-thumb]:active:scale-110",
        )}
        aria-label="Confidence threshold percentage"
      />

      <p className="text-xs text-gray-500 dark:text-gray-400">
        Items with {threshold}% or higher confidence will be considered
        high-confidence
      </p>
    </div>
  );
}
