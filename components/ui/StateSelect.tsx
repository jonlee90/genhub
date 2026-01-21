'use client';

import * as React from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';

// US States with abbreviations
export const US_STATES = [
  { value: 'AL', label: 'Alabama' },
  { value: 'AK', label: 'Alaska' },
  { value: 'AZ', label: 'Arizona' },
  { value: 'AR', label: 'Arkansas' },
  { value: 'CA', label: 'California' },
  { value: 'CO', label: 'Colorado' },
  { value: 'CT', label: 'Connecticut' },
  { value: 'DE', label: 'Delaware' },
  { value: 'FL', label: 'Florida' },
  { value: 'GA', label: 'Georgia' },
  { value: 'HI', label: 'Hawaii' },
  { value: 'ID', label: 'Idaho' },
  { value: 'IL', label: 'Illinois' },
  { value: 'IN', label: 'Indiana' },
  { value: 'IA', label: 'Iowa' },
  { value: 'KS', label: 'Kansas' },
  { value: 'KY', label: 'Kentucky' },
  { value: 'LA', label: 'Louisiana' },
  { value: 'ME', label: 'Maine' },
  { value: 'MD', label: 'Maryland' },
  { value: 'MA', label: 'Massachusetts' },
  { value: 'MI', label: 'Michigan' },
  { value: 'MN', label: 'Minnesota' },
  { value: 'MS', label: 'Mississippi' },
  { value: 'MO', label: 'Missouri' },
  { value: 'MT', label: 'Montana' },
  { value: 'NE', label: 'Nebraska' },
  { value: 'NV', label: 'Nevada' },
  { value: 'NH', label: 'New Hampshire' },
  { value: 'NJ', label: 'New Jersey' },
  { value: 'NM', label: 'New Mexico' },
  { value: 'NY', label: 'New York' },
  { value: 'NC', label: 'North Carolina' },
  { value: 'ND', label: 'North Dakota' },
  { value: 'OH', label: 'Ohio' },
  { value: 'OK', label: 'Oklahoma' },
  { value: 'OR', label: 'Oregon' },
  { value: 'PA', label: 'Pennsylvania' },
  { value: 'RI', label: 'Rhode Island' },
  { value: 'SC', label: 'South Carolina' },
  { value: 'SD', label: 'South Dakota' },
  { value: 'TN', label: 'Tennessee' },
  { value: 'TX', label: 'Texas' },
  { value: 'UT', label: 'Utah' },
  { value: 'VT', label: 'Vermont' },
  { value: 'VA', label: 'Virginia' },
  { value: 'WA', label: 'Washington' },
  { value: 'WV', label: 'West Virginia' },
  { value: 'WI', label: 'Wisconsin' },
  { value: 'WY', label: 'Wyoming' },
] as const;

export type StateValue = typeof US_STATES[number]['value'];

export interface StateSelectProps {
  /** Current value (controlled) */
  value?: string;
  /** Default value (uncontrolled) */
  defaultValue?: string;
  /** Change handler */
  onValueChange?: (value: string) => void;
  /** Disabled state */
  disabled?: boolean;
  /** Error state (adds red border) */
  error?: boolean;
  /** Placeholder text */
  placeholder?: string;
  /** Additional className for trigger */
  className?: string;
  /** Name attribute for form submission */
  name?: string;
  /** Required field */
  required?: boolean;
  /** ID for label association */
  id?: string;
}

/**
 * US States Dropdown Select Component
 *
 * A reusable dropdown for selecting US states with full state names and abbreviations.
 * Integrates with the construction theme using var(--construction-blue) primary color.
 *
 * @example
 * // Controlled
 * <StateSelect value={state} onValueChange={setState} />
 *
 * @example
 * // Uncontrolled with form
 * <StateSelect name="state" defaultValue="CA" />
 *
 * @example
 * // With error state
 * <StateSelect error={!!errors.state} />
 */
export function StateSelect({
  value,
  defaultValue,
  onValueChange,
  disabled = false,
  error = false,
  placeholder = 'Select state',
  className,
  name,
  required = false,
  id,
}: StateSelectProps) {
  console.log('[StateSelect] Rendering:', { value, defaultValue, disabled, error });

  // Track internal value for form submission
  const [internalValue, setInternalValue] = React.useState(defaultValue || value || '');

  // Update internal value when controlled value changes
  React.useEffect(() => {
    if (value !== undefined) {
      setInternalValue(value);
    }
  }, [value]);

  const handleValueChange = (newValue: string) => {
    setInternalValue(newValue);
    onValueChange?.(newValue);
  };

  return (
    <>
      <Select
        value={value}
        defaultValue={defaultValue}
        onValueChange={handleValueChange}
        disabled={disabled}
        required={required}
      >
        <SelectTrigger
          id={id}
          className={cn(
            'h-11 border-gray-200 dark:border-gray-700',
            error && 'border-red-500 focus:ring-red-500/20 focus:border-red-500',
            className
          )}
        >
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {US_STATES.map((state) => (
            <SelectItem key={state.value} value={state.value}>
              {state.label} ({state.value})
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {/* Hidden input for form submission */}
      {name && internalValue && (
        <input type="hidden" name={name} value={internalValue} />
      )}
    </>
  );
}

/**
 * Get full state name from abbreviation
 */
export function getStateName(abbreviation: string): string | undefined {
  return US_STATES.find((s) => s.value === abbreviation)?.label;
}

/**
 * Get state abbreviation from full name
 */
export function getStateAbbreviation(name: string): string | undefined {
  return US_STATES.find((s) => s.label.toLowerCase() === name.toLowerCase())?.value;
}
