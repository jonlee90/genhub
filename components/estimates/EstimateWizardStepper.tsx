"use client";

import { memo } from "react";
import CircleCheck from "lucide-react/icons/circle-check";
import Circle from "lucide-react/icons/circle";
import { cn } from "@/lib/utils";

type EstimateWizardStepperProps = {
  currentStep: number; // 1-5
  onStepClick?: (step: number) => void;
};

const STEPS = [
  { id: 1, label: "Upload" },
  { id: 2, label: "Parse" },
  { id: 3, label: "Review" },
  { id: 4, label: "Cost" },
  { id: 5, label: "Summary" },
] as const;

// Memoized step circle component (rerender-memo)
const StepCircle = memo(function StepCircle({
  step,
  currentStep,
  onClick,
}: {
  step: number;
  currentStep: number;
  onClick?: () => void;
}) {
  const isCompleted = step < currentStep;
  const isActive = step === currentStep;
  const canClick = step <= currentStep && onClick;

  return (
    <button
      onClick={canClick ? onClick : undefined}
      disabled={!canClick}
      className={cn(
        "flex items-center justify-center transition-all min-h-[44px] min-w-[44px] rounded-full",
        canClick && "active:scale-95",
        !canClick && "cursor-default",
      )}
      aria-label={`Step ${step}: ${STEPS[step - 1].label}`}
      aria-current={isActive ? "step" : undefined}
    >
      {isCompleted ? (
        <CircleCheck
          className={cn(
            "w-6 h-6 text-construction-blue dark:text-construction-blue",
          )}
        />
      ) : isActive ? (
        <div className="relative">
          <Circle
            className={cn(
              "w-6 h-6 text-construction-blue dark:text-construction-blue",
              "animate-pulse",
            )}
            strokeWidth={2.5}
          />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-2 h-2 rounded-full bg-construction-blue dark:bg-construction-blue" />
          </div>
        </div>
      ) : (
        <Circle
          className={cn("w-6 h-6 text-gray-300 dark:text-gray-600")}
          strokeWidth={1.5}
        />
      )}
    </button>
  );
});

export function EstimateWizardStepper({
  currentStep,
  onStepClick,
}: EstimateWizardStepperProps) {
  const handleStepClick = (step: number) => {
    // Only allow clicking back, not forward
    if (step <= currentStep && onStepClick) {
      onStepClick(step);
    }
  };

  return (
    <div className="w-full py-4">
      {/* Horizontal stepper — shown at all sizes (sm:flex not generated in Tailwind JIT) */}
      <div className="flex items-center justify-between gap-2">
        {STEPS.map((step, index) => {
          const isLast = index === STEPS.length - 1;

          return (
            <div key={step.id} className="flex items-center flex-1">
              <div className="flex flex-col items-center gap-2">
                <StepCircle
                  step={step.id}
                  currentStep={currentStep}
                  onClick={() => handleStepClick(step.id)}
                />
                <span
                  className={cn(
                    "text-xs font-medium whitespace-nowrap",
                    step.id === currentStep
                      ? "text-construction-blue dark:text-construction-blue"
                      : step.id < currentStep
                        ? "text-gray-700 dark:text-gray-300"
                        : "text-gray-400 dark:text-gray-500",
                  )}
                >
                  {step.label}
                </span>
              </div>

              {!isLast ? (
                <div
                  className={cn(
                    "flex-1 h-0.5 mx-2 transition-colors",
                    step.id < currentStep
                      ? "bg-construction-blue dark:bg-construction-blue"
                      : "bg-gray-200 dark:bg-gray-700",
                  )}
                />
              ) : null}
            </div>
          );
        })}
      </div>

      {/* Mobile: Compact mode with dots — hidden since horizontal stepper works at all sizes */}
      <div className="hidden flex-col items-center gap-3">
        <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
          Step {currentStep} of {STEPS.length}: {STEPS[currentStep - 1].label}
        </p>

        <div className="flex items-center gap-2">
          {STEPS.map((step) => (
            <button
              key={step.id}
              onClick={() => handleStepClick(step.id)}
              disabled={step.id > currentStep}
              className={cn(
                "rounded-full transition-all min-h-[12px] min-w-[12px]",
                step.id <= currentStep && "active:scale-95",
              )}
              aria-label={`Go to step ${step.id}: ${step.label}`}
            >
              <div
                className={cn(
                  "rounded-full transition-all",
                  step.id === currentStep
                    ? "w-3 h-3 bg-construction-blue dark:bg-construction-blue animate-pulse"
                    : step.id < currentStep
                      ? "w-2 h-2 bg-construction-blue dark:bg-construction-blue"
                      : "w-2 h-2 bg-gray-300 dark:bg-gray-600",
                )}
              />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
