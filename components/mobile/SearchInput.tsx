'use client';

/**
 * SearchInput Component
 *
 * Mobile-optimized search input with icon and clear button.
 *
 * Features:
 * - 16px font size (prevents iOS zoom)
 * - Search icon prefix
 * - Clear button when value present
 * - Debounced onChange option
 * - Touch-friendly 56px height
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import { Search, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SearchInputProps {
  /** Current value */
  value?: string;
  /** Value change handler */
  onChange?: (value: string) => void;
  /** Placeholder text */
  placeholder?: string;
  /** Debounce delay in ms (0 = no debounce) */
  debounce?: number;
  /** Auto-focus on mount */
  autoFocus?: boolean;
  /** Disabled state */
  disabled?: boolean;
  /** Additional className */
  className?: string;
}

export function SearchInput({
  value: controlledValue,
  onChange,
  placeholder = 'Search...',
  debounce = 0,
  autoFocus = false,
  disabled = false,
  className,
}: SearchInputProps) {
  // Internal state for uncontrolled mode or debouncing
  const [internalValue, setInternalValue] = useState(controlledValue || '');
  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Sync with controlled value
  useEffect(() => {
    if (controlledValue !== undefined) {
      setInternalValue(controlledValue);
    }
  }, [controlledValue]);

  // Handle input change with optional debounce
  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = e.target.value;
      setInternalValue(newValue);

      if (debounce > 0) {
        // Clear existing timeout
        if (debounceRef.current) {
          clearTimeout(debounceRef.current);
        }
        // Set new timeout
        debounceRef.current = setTimeout(() => {
          onChange?.(newValue);
        }, debounce);
      } else {
        onChange?.(newValue);
      }
    },
    [onChange, debounce]
  );

  // Handle clear button
  const handleClear = useCallback(() => {
    setInternalValue('');
    onChange?.('');

    // Clear any pending debounce
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    // Focus input after clearing
    inputRef.current?.focus();
  }, [onChange]);

  // Cleanup debounce on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);

  const hasValue = internalValue.length > 0;

  return (
    <div className={cn('relative', className)}>
      {/* Search icon */}
      <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none">
        <Search className="w-5 h-5 text-gray-400" />
      </div>

      {/* Input */}
      <input
        ref={inputRef}
        type="search"
        inputMode="search"
        enterKeyHint="search"
        value={internalValue}
        onChange={handleChange}
        placeholder={placeholder}
        autoFocus={autoFocus}
        disabled={disabled}
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="off"
        spellCheck={false}
        className={cn(
          // Base styles
          'block w-full h-12 pl-12 pr-10',
          'text-base', // 16px - prevents iOS zoom
          'bg-gray-100 text-gray-900',
          'placeholder:text-gray-500',
          'border-0 rounded-xl',

          // Focus
          'focus:outline-none focus:ring-2 focus:ring-[#001B51]/20',
          'focus:bg-white',

          // Transition
          'transition-all duration-150',

          // Disabled
          'disabled:opacity-50 disabled:cursor-not-allowed',

          // Touch optimization
          'touch-manipulation',

          // Hide native search clear button
          '[&::-webkit-search-cancel-button]:hidden',
          '[&::-webkit-search-decoration]:hidden'
        )}
      />

      {/* Clear button */}
      {hasValue && !disabled && (
        <button
          type="button"
          onClick={handleClear}
          className={cn(
            'absolute right-3 top-1/2 -translate-y-1/2',
            'w-6 h-6 flex items-center justify-center',
            'rounded-full bg-gray-300 hover:bg-gray-400',
            'text-gray-600 hover:text-gray-700',
            'transition-colors duration-100',
            'active:scale-95'
          )}
          aria-label="Clear search"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
}
