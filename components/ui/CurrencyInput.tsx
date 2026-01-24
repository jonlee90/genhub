'use client';

import { forwardRef, memo, useId } from 'react';
import CurrencyInputField, { CurrencyInputProps as BaseCurrencyInputProps } from 'react-currency-input-field';
import { cn } from '@/lib/utils';

interface CurrencyInputProps extends Omit<BaseCurrencyInputProps, never> {
  label?: string;
  error?: string;
  hint?: string;
  containerClassName?: string;
}

export const CurrencyInput = memo(
  forwardRef<HTMLInputElement, CurrencyInputProps>(
    (
      {
        label,
        error,
        hint,
        className,
        containerClassName,
        id,
        disabled,
        ...props
      },
      ref
    ) => {
      const generatedId = useId();
      const inputId = id || generatedId;
      const errorId = `${inputId}-error`;
      const hintId = `${inputId}-hint`;

      const hasError = Boolean(error);

      return (
        <div className={cn('space-y-1.5 w-full', containerClassName)}>
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

          <CurrencyInputField
            ref={ref}
            id={inputId}
            disabled={disabled}
            prefix="$"
            decimalsLimit={2}
            decimalScale={2}
            allowNegativeValue={false}
            className={cn(
              // Base styles
              'block h-14 px-4 w-full',
              'text-base', // 16px - prevents iOS zoom
              'bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100',
              'placeholder:text-gray-400 dark:placeholder:text-gray-500',

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

              // Touch optimization
              'touch-manipulation',

              className
            )}
            aria-invalid={hasError}
            aria-describedby={
              hasError ? errorId : hint ? hintId : undefined
            }
            {...props}
          />

          {hasError && (
            <p
              id={errorId}
              role="alert"
              className="text-sm text-[#DC2626] font-medium"
            >
              {error}
            </p>
          )}

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
    }
  )
);

CurrencyInput.displayName = 'CurrencyInput';
