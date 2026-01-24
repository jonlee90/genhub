/**
 * BaseModalHeader Component
 * Construction-themed modal header with icon, title, badges, step dots, and close button
 * Single-row layout: Icon + Title + Badges + Step Dots + Close Button
 */

"use client";

import { memo } from "react";
import { X, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { BaseModalHeaderProps } from "./types";

export const BaseModalHeader = memo(function BaseModalHeader({
  icon: Icon,
  title,
  badges,
  onClose,
  theme,
  iconColor,
  className,
  steps,
  currentStep = 1,
}: BaseModalHeaderProps) {
  // Use iconColor if provided, otherwise use theme gradient
  const iconBackground = iconColor
    ? iconColor
    : `linear-gradient(135deg, ${theme.iconGradientFrom} 0%, ${theme.iconGradientTo} 100%)`;

  return (
    <div
      className={cn(
        "flex items-center justify-between gap-4 px-6 py-4",
        className,
      )}
    >
      {/* Left: Icon + Title + Badges */}
      <div className="flex items-center gap-3 flex-1 min-w-0">
        {/* Icon container with gradient background */}
        {Icon && (
          <div
            className="flex-shrink-0 h-11 w-11 min-h-[44px] min-w-[44px] rounded-xl flex items-center justify-center shadow-lg relative overflow-hidden"
            style={{
              background: iconBackground,
            }}
          >
            {/* Blueprint grid overlay */}
            <div
              className="absolute inset-0 opacity-10"
              style={{
                backgroundImage: `
                  linear-gradient(0deg, transparent 24%, rgba(255, 255, 255, 0.3) 25%, rgba(255, 255, 255, 0.3) 26%, transparent 27%, transparent 74%, rgba(255, 255, 255, 0.3) 75%, rgba(255, 255, 255, 0.3) 76%, transparent 77%, transparent),
                  linear-gradient(90deg, transparent 24%, rgba(255, 255, 255, 0.3) 25%, rgba(255, 255, 255, 0.3) 26%, transparent 27%, transparent 74%, rgba(255, 255, 255, 0.3) 75%, rgba(255, 255, 255, 0.3) 76%, transparent 77%, transparent)
                `,
                backgroundSize: "8px 8px",
              }}
            />
            <Icon
              className="h-6 w-6 text-white relative z-10"
              strokeWidth={2.5}
            />
          </div>
        )}

        {/* Title */}
        <h2
          className="text-xl font-bold tracking-tight leading-tight truncate"
          style={{ color: theme.primary }}
        >
          {title}
        </h2>

        {/* Badges */}
        {badges && (
          <div className="flex items-center gap-2 shrink-0">{badges}</div>
        )}
      </div>

      {/* Center: Compact Step Dots (if steps provided) */}
      {steps && steps.length > 0 && (
        <div
          className="flex items-center gap-1.5 shrink-0"
          aria-label={`Step ${currentStep} of ${steps.length}`}
        >
          {steps.map((_, index) => {
            const stepNumber = index + 1;
            const isActive = stepNumber === currentStep;
            const isCompleted = stepNumber < currentStep;

            return (
              <div
                key={index}
                className={cn(
                  "transition-all duration-300 flex items-center justify-center",
                  "relative overflow-hidden",
                  // Inactive: Small dot
                  !isActive &&
                    !isCompleted &&
                    "h-2 w-2 rounded-full bg-gray-300 dark:bg-gray-600",
                  // Active: Elongated pill with number
                  isActive && "h-6 w-6 rounded-full shadow-md",
                  // Completed: Small dot with checkmark
                  isCompleted && "h-5 w-5 rounded-full shadow-sm",
                )}
                style={
                  isActive || isCompleted
                    ? {
                        background: `linear-gradient(135deg, ${theme.gradientFrom} 0%, ${theme.gradientTo} 100%)`,
                      }
                    : undefined
                }
                title={`${isCompleted ? "Completed" : isActive ? "Current" : "Upcoming"}: ${steps[index]}`}
              >
                {/* Blueprint grid overlay for active/completed */}
                {(isActive || isCompleted) && (
                  <div
                    className="absolute inset-0 opacity-10"
                    style={{
                      backgroundImage: `
                        linear-gradient(0deg, transparent 24%, rgba(255, 255, 255, 0.3) 25%, rgba(255, 255, 255, 0.3) 26%, transparent 27%, transparent 74%, rgba(255, 255, 255, 0.3) 75%, rgba(255, 255, 255, 0.3) 76%, transparent 77%, transparent),
                        linear-gradient(90deg, transparent 24%, rgba(255, 255, 255, 0.3) 25%, rgba(255, 255, 255, 0.3) 26%, transparent 27%, transparent 74%, rgba(255, 255, 255, 0.3) 75%, rgba(255, 255, 255, 0.3) 76%, transparent 77%, transparent)
                      `,
                      backgroundSize: "4px 4px",
                    }}
                  />
                )}

                {/* Content */}
                {isActive && (
                  <span className="relative z-10 text-[10px] font-bold text-white">
                    {stepNumber}
                  </span>
                )}
                {isCompleted && (
                  <Check
                    className="h-3 w-3 text-white relative z-10"
                    strokeWidth={3}
                  />
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Right: Close Button */}
      <button
        onClick={onClose}
        className={cn(
          "flex-shrink-0 h-11 w-11 min-h-[44px] min-w-[44px] rounded-full",
          "bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600",
          "flex items-center justify-center",
          "transition-all duration-200",
          "hover:scale-105 active:scale-95",
          "focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-gray-900",
          "group relative overflow-hidden",
        )}
        style={{
          // @ts-ignore - CSS custom property
          "--tw-ring-color": theme.ring,
        }}
        aria-label="Close modal"
      >
        {/* Hover background effect */}
        <div
          className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
          style={{
            background: `radial-gradient(circle at center, ${theme.primaryLight}10 0%, transparent 70%)`,
          }}
        />

        <X className="h-5 w-5 text-gray-500 dark:text-gray-400 group-hover:text-gray-700 dark:group-hover:text-gray-300 transition-colors relative z-10" />
      </button>
    </div>
  );
});
