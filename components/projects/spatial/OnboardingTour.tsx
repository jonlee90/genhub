'use client';

import { useState, useEffect, useCallback } from 'react';
import { X, ChevronRight, ChevronLeft, FolderKanban } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card } from '@/components/ui/card';
import {
  getTourSteps,
  hasTourCompleted,
  markTourCompleted,
  type TourStep,
} from '@/lib/onboarding/tour-steps';

export interface OnboardingTourProps {
  userId: string;
  onComplete?: () => void;
  onSkip?: () => void;
  autoStart?: boolean;
  isMobile?: boolean;
  className?: string;
}

/**
 * OnboardingTour - First-time user tutorial with spotlight effect
 * - Checks localStorage: genhub_spatial_viewer_tour_completed_{userId}
 * - 5 steps: Navigate → Inspect → Place marker → Attach photo → Filter
 * - Next/Back/Skip buttons, progress "Step X of 5"
 * - Spotlight effect on highlighted elements
 * - Mobile simplified (3 steps)
 */
export function OnboardingTour({
  userId,
  onComplete,
  onSkip,
  autoStart = true,
  isMobile = false,
  className,
}: OnboardingTourProps) {
  console.log('[OnboardingTour] Rendering', { userId, autoStart, isMobile });

  const [isActive, setIsActive] = useState(false);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [highlightPosition, setHighlightPosition] = useState<DOMRect | null>(null);

  const tourSteps = getTourSteps(isMobile);
  const currentStep = tourSteps[currentStepIndex];
  const totalSteps = tourSteps.length;

  // Check if tour should auto-start
  useEffect(() => {
    if (autoStart && !hasTourCompleted(userId)) {
      console.log('[OnboardingTour] Auto-starting tour');
      setIsActive(true);
    }
  }, [autoStart, userId]);

  // Update spotlight position when step changes
  useEffect(() => {
    if (!isActive || !currentStep) return;

    console.log('[OnboardingTour] Highlighting element:', currentStep.targetSelector);

    // Find target element
    const targetElement = document.querySelector(currentStep.targetSelector);
    if (targetElement) {
      const rect = targetElement.getBoundingClientRect();
      setHighlightPosition(rect);

      // Scroll element into view
      targetElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
    } else {
      console.warn('[OnboardingTour] Target element not found:', currentStep.targetSelector);
      setHighlightPosition(null);
    }
  }, [isActive, currentStep]);

  const handleNext = useCallback(() => {
    if (currentStepIndex < totalSteps - 1) {
      console.log('[OnboardingTour] Next step:', currentStepIndex + 1);
      setCurrentStepIndex((prev) => prev + 1);
    } else {
      console.log('[OnboardingTour] Tour completed');
      handleComplete();
    }
  }, [currentStepIndex, totalSteps]);

  const handleBack = useCallback(() => {
    if (currentStepIndex > 0) {
      console.log('[OnboardingTour] Previous step:', currentStepIndex - 1);
      setCurrentStepIndex((prev) => prev - 1);
    }
  }, [currentStepIndex]);

  const handleSkip = useCallback(() => {
    console.log('[OnboardingTour] Tour skipped');
    setIsActive(false);
    markTourCompleted(userId);
    onSkip?.();
  }, [userId, onSkip]);

  const handleComplete = useCallback(() => {
    console.log('[OnboardingTour] Tour completed');
    setIsActive(false);
    markTourCompleted(userId);
    onComplete?.();
  }, [userId, onComplete]);

  if (!isActive || !currentStep) {
    return null;
  }

  return (
    <>
      {/* Spotlight Overlay */}
      <div className="fixed inset-0 z-50 pointer-events-none">
        {/* Dark overlay with cutout */}
        <svg className="w-full h-full">
          <defs>
            <mask id="spotlight-mask">
              <rect x="0" y="0" width="100%" height="100%" fill="white" />
              {highlightPosition && (
                <rect
                  x={highlightPosition.x - 8}
                  y={highlightPosition.y - 8}
                  width={highlightPosition.width + 16}
                  height={highlightPosition.height + 16}
                  rx="8"
                  fill="black"
                />
              )}
            </mask>
          </defs>
          <rect
            x="0"
            y="0"
            width="100%"
            height="100%"
            fill="rgba(0, 0, 0, 0.7)"
            mask="url(#spotlight-mask)"
          />
        </svg>

        {/* Highlight border */}
        {highlightPosition && (
          <div
            className="absolute border-4 border-[#FFB627] rounded-lg animate-pulse pointer-events-none"
            style={{
              left: highlightPosition.x - 8,
              top: highlightPosition.y - 8,
              width: highlightPosition.width + 16,
              height: highlightPosition.height + 16,
            }}
          />
        )}
      </div>

      {/* Tour Tooltip */}
      <div
        className={cn(
          'fixed z-[60] pointer-events-auto',
          // Position based on placement
          currentStep.placement === 'center' && 'top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2',
          currentStep.placement === 'top' &&
            highlightPosition &&
            `left-[${highlightPosition.x}px] bottom-[calc(100%-${highlightPosition.y}px+24px)]`,
          currentStep.placement === 'bottom' &&
            highlightPosition &&
            `left-[${highlightPosition.x}px] top-[${highlightPosition.y + highlightPosition.height + 24}px]`,
          currentStep.placement === 'left' &&
            highlightPosition &&
            `right-[calc(100%-${highlightPosition.x}px+24px)] top-[${highlightPosition.y}px]`,
          currentStep.placement === 'right' &&
            highlightPosition &&
            `left-[${highlightPosition.x + highlightPosition.width + 24}px] top-[${highlightPosition.y}px]`,
          className
        )}
        style={{
          // Fallback for dynamic positioning
          ...(currentStep.placement !== 'center' &&
            highlightPosition && {
              maxWidth: isMobile ? '90vw' : '400px',
            }),
        }}
      >
        <Card className="border-2 border-[#001B51] shadow-2xl bg-white w-full max-w-md">
          {/* Header */}
          <div className="border-b-2 border-[#001B51] bg-gradient-to-r from-[#001B51] to-[#002666] p-4">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                  {currentStep.icon ? (
                    <span className="text-2xl">{currentStep.icon}</span>
                  ) : (
                    <FolderKanban className="w-6 h-6 text-white" />
                  )}
                </div>
                <div>
                  <h3 className="font-black text-white uppercase tracking-tight text-sm">
                    {currentStep.title}
                  </h3>
                  <p className="text-xs text-white/70 font-mono">
                    Step {currentStepIndex + 1} of {totalSteps}
                  </p>
                </div>
              </div>

              <button
                onClick={handleSkip}
                className="p-1 hover:bg-white/20 rounded transition-colors"
                title="Skip Tour"
              >
                <X className="w-5 h-5 text-white" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="p-4 space-y-4">
            <p className="text-sm text-gray-700 leading-relaxed">{currentStep.description}</p>

            {currentStep.action && (
              <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-3">
                <p className="text-xs font-semibold text-blue-900 uppercase tracking-wide mb-1">
                  Try It Out
                </p>
                <p className="text-sm text-blue-800">{currentStep.action.instruction}</p>
              </div>
            )}

            {/* Progress Bar */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs text-gray-500 font-mono">
                <span>Progress</span>
                <span>
                  {currentStepIndex + 1}/{totalSteps}
                </span>
              </div>
              <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#001B51] transition-all duration-300"
                  style={{ width: `${((currentStepIndex + 1) / totalSteps) * 100}%` }}
                />
              </div>
            </div>

            {/* Navigation Buttons */}
            <div className="flex gap-2">
              <button
                onClick={handleBack}
                disabled={currentStepIndex === 0}
                className={cn(
                  'px-4 py-2 rounded-lg font-semibold text-sm uppercase tracking-wide',
                  'border-2 transition-colors flex items-center gap-2',
                  'disabled:opacity-30 disabled:cursor-not-allowed',
                  currentStepIndex === 0
                    ? 'border-gray-200 text-gray-400'
                    : 'border-[#001B51] text-[#001B51] hover:bg-blue-50'
                )}
              >
                <ChevronLeft className="w-4 h-4" />
                Back
              </button>

              <button
                onClick={handleSkip}
                className={cn(
                  'flex-1 px-4 py-2 rounded-lg font-semibold text-sm uppercase tracking-wide',
                  'bg-gray-200 text-gray-700 hover:bg-gray-300 transition-colors'
                )}
              >
                Skip Tour
              </button>

              <button
                onClick={handleNext}
                className={cn(
                  'px-4 py-2 rounded-lg font-semibold text-sm uppercase tracking-wide',
                  'bg-[#001B51] text-white hover:bg-[#002666] transition-colors',
                  'flex items-center gap-2'
                )}
              >
                {currentStepIndex === totalSteps - 1 ? (
                  <>
                    Finish
                    <FolderKanban className="w-4 h-4" />
                  </>
                ) : (
                  <>
                    Next
                    <ChevronRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </div>
        </Card>
      </div>
    </>
  );
}
