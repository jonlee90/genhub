'use client';

/**
 * MobileInput Component
 *
 * Standardized form input optimized for mobile.
 *
 * Features:
 * - Height: 56px (h-14) for easy touch
 * - Font size: 16px (text-base) to prevent iOS zoom
 * - inputMode prop for keyboard type
 * - enterKeyHint prop for return key label
 * - Label, error, hint support
 * - Focus ring with construction-blue
 */

import { forwardRef, memo, useId } from 'react';
import { cn } from '@/lib/utils';

interface MobileInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  /** Input label */
  label?: string;
  /** Error message (shows red border + message) */
  error?: string;
  /** Hint text below input */
  hint?: string;
  /** Input mode for virtual keyboard */
  inputMode?: 'text' | 'decimal' | 'numeric' | 'tel' | 'email' | 'url' | 'search' | 'none';
  /** Enter key hint for virtual keyboard */
  enterKeyHint?: 'enter' | 'done' | 'go' | 'next' | 'search' | 'send' | 'previous';
  /** Full width (default: true) */
  fullWidth?: boolean;
  /** Container className */
  containerClassName?: string;
}

export const MobileInput = memo(
  forwardRef<HTMLInputElement, MobileInputProps>(
    (
      {
        label,
        error,
        hint,
        inputMode = 'text',
        enterKeyHint,
        fullWidth = true,
        className,
        containerClassName,
        id,
        disabled,
        ...props
      },
      ref
    ) => {
    // Generate unique ID for accessibility
    const generatedId = useId();
    const inputId = id || generatedId;
    const errorId = `${inputId}-error`;
    const hintId = `${inputId}-hint`;

    const hasError = Boolean(error);

    return (
      <div
        className={cn(
          'space-y-1.5',
          fullWidth && 'w-full',
          containerClassName
        )}
      >
        {/* Label */}
        {label && (
          <label
            htmlFor={inputId}
            className={cn(
              'block text-sm font-medium',
              hasError ? 'text-[#DC2626]' : 'text-gray-700 dark:text-gray-300',
              disabled && 'opacity-50'
            )}
          >
            {label}
          </label>
        )}

        {/* Input */}
        <input
          ref={ref}
          id={inputId}
          inputMode={inputMode}
          enterKeyHint={enterKeyHint}
          disabled={disabled}
          aria-invalid={hasError}
          aria-describedby={
            hasError ? errorId : hint ? hintId : undefined
          }
          className={cn(
            // Base styles
            'block h-14 px-4',
            'text-base', // 16px - prevents iOS zoom
            'bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100',
            'placeholder:text-gray-400 dark:placeholder:text-gray-500',
            'select-text',

            // Border
            'border rounded-xl',
            hasError
              ? 'border-[#DC2626] border-2'
              : 'border-gray-200 dark:border-gray-700',

            // Focus
            'focus:outline-none focus:ring-2 focus:ring-offset-0',
            hasError
              ? 'focus:ring-[#DC2626]/30 focus:border-[#DC2626]'
              : 'focus:ring-[var(--construction-blue)]/20 dark:focus:ring-blue-500/30 focus:border-construction-blue dark:focus:border-blue-500',

            // Disabled
            'disabled:bg-gray-50 dark:disabled:bg-gray-700 disabled:text-gray-500 dark:disabled:text-gray-400 disabled:cursor-not-allowed',

            // Width
            fullWidth && 'w-full',

            // Touch optimization
            'touch-manipulation',

            className
          )}
          {...props}
        />

        {/* Error message */}
        {hasError && (
          <p
            id={errorId}
            role="alert"
            className="text-sm text-[#DC2626] font-medium"
          >
            {error}
          </p>
        )}

        {/* Hint text */}
        {hint && !hasError && (
          <p
            id={hintId}
            className="text-sm text-gray-500 dark:text-gray-400"
          >
            {hint}
          </p>
        )}
      </div>
    );
  })
);

MobileInput.displayName = 'MobileInput';
