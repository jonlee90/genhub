/**
 * StepIndicator Component
 * Horizontal stepper with construction-themed styling
 */

'use client';

import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { StepIndicatorProps } from './types';

export function StepIndicator({
  steps,
  currentStep,
  theme,
  className,
}: StepIndicatorProps) {
  console.log('[StepIndicator] Rendering stepper:', {
    totalSteps: steps.length,
    currentStep,
    steps,
  });

  if (!steps || steps.length === 0) {
    console.log('[StepIndicator] No steps provided, skipping render');
    return null;
  }

  return (
    <div className={cn('px-6 py-4 border-b border-gray-200', className)}>
      <div className="flex items-center justify-between relative">
        {steps.map((step, index) => {
          const stepNumber = index + 1;
          const isActive = stepNumber === currentStep;
          const isCompleted = stepNumber < currentStep;
          const isLast = index === steps.length - 1;

          console.log('[StepIndicator] Rendering step:', {
            stepNumber,
            step,
            isActive,
            isCompleted,
          });

          return (
            <div key={index} className="flex items-center flex-1 relative">
              {/* Step circle and label */}
              <div className="flex flex-col items-center gap-2 relative z-10">
                {/* Circle */}
                <div
                  className={cn(
                    'h-10 w-10 rounded-full flex items-center justify-center',
                    'font-semibold text-sm transition-all duration-300',
                    'relative overflow-hidden',
                    isCompleted && 'shadow-md',
                    isActive && 'shadow-lg ring-4 ring-opacity-20',
                    !isActive && !isCompleted && 'border-2 border-gray-300 bg-white text-gray-400'
                  )}
                  style={
                    isActive || isCompleted
                      ? {
                          background: `linear-gradient(135deg, ${theme.gradientFrom} 0%, ${theme.gradientTo} 100%)`,
                          color: 'white',
                          // @ts-ignore - CSS custom property
                          '--tw-ring-color': theme.ring,
                        }
                      : undefined
                  }
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
                        backgroundSize: '6px 6px',
                      }}
                    />
                  )}

                  {/* Content */}
                  <span className="relative z-10">
                    {isCompleted ? (
                      <Check className="h-5 w-5" strokeWidth={3} />
                    ) : (
                      stepNumber
                    )}
                  </span>
                </div>

                {/* Label */}
                <span
                  className={cn(
                    'text-xs font-medium text-center max-w-[80px] leading-tight',
                    'transition-colors duration-300',
                    isActive && 'font-semibold',
                    !isActive && !isCompleted && 'text-gray-400'
                  )}
                  style={
                    isActive || isCompleted
                      ? { color: theme.primary }
                      : undefined
                  }
                >
                  {step}
                </span>
              </div>

              {/* Connecting line */}
              {!isLast && (
                <div
                  className={cn(
                    'flex-1 h-1 mx-2 rounded-full transition-all duration-500',
                    'relative top-[-16px]', // Align with circle center
                    isCompleted ? 'bg-opacity-100' : 'bg-gray-200'
                  )}
                  style={
                    isCompleted
                      ? {
                          background: `linear-gradient(90deg, ${theme.gradientFrom} 0%, ${theme.gradientTo} 100%)`,
                        }
                      : undefined
                  }
                >
                  {/* Animated progress effect for active step */}
                  {isActive && (
                    <div
                      className="absolute inset-0 rounded-full animate-pulse"
                      style={{
                        background: `linear-gradient(90deg, transparent 0%, ${theme.primaryLight}40 50%, transparent 100%)`,
                      }}
                    />
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
