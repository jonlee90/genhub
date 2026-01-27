/**
 * useValidatedForm Hook
 *
 * Custom hook that wraps React Hook Form with native validation.
 * Provides a type-safe form state with computed properties.
 *
 * Features:
 * - Native React Hook Form validation (no Zod on client)
 * - Type-safe with TypeScript
 * - Computed properties: isValid, isSubmitting, canSubmit
 * - Default validation mode: onBlur (better UX than onChange)
 *
 * Usage:
 * ```tsx
 * const { register, handleSubmit, canSubmit, formState: { errors } } = useValidatedForm();
 *
 * <input {...register('email', emailValidation)} />
 * {errors.email && <p>{errors.email.message}</p>}
 * ```
 */

'use client';

import { useForm, UseFormProps, UseFormReturn, FieldValues } from 'react-hook-form';

// ============================================================================
// TYPES
// ============================================================================

/**
 * Options for useValidatedForm hook
 * Standard React Hook Form options
 */
interface UseValidatedFormOptions<TFieldValues extends FieldValues>
  extends UseFormProps<TFieldValues> {
  // All standard RHF options are available
}

/**
 * Return type for useValidatedForm hook
 * Extends React Hook Form return type with computed properties
 */
interface UseValidatedFormReturn<TFieldValues extends FieldValues>
  extends UseFormReturn<TFieldValues> {
  /**
   * Computed property: Is the form currently valid?
   * Checks if all fields pass validation
   */
  isValid: boolean;

  /**
   * Computed property: Is the form currently submitting?
   * True when handleSubmit is in progress
   */
  isSubmitting: boolean;

  /**
   * Computed property: Can the form be submitted?
   * True when form is valid AND not submitting
   * Use this for submit button disabled state
   */
  canSubmit: boolean;
}

// ============================================================================
// HOOK
// ============================================================================

/**
 * Custom hook for validated forms using React Hook Form
 *
 * @template TFieldValues - Form field values type
 * @param options - Form options (standard React Hook Form options)
 * @returns Form methods and computed properties
 *
 * @example
 * ```tsx
 * import { emailValidation, requiredStringValidation } from '@/lib/validation/client-validation';
 *
 * const { register, handleSubmit, canSubmit, formState: { errors } } = useValidatedForm({
 *   defaultValues: { email: '', name: '' },
 * });
 *
 * <input {...register('email', emailValidation)} />
 * {errors.email && <p>{errors.email.message}</p>}
 *
 * <input {...register('name', requiredStringValidation)} />
 * {errors.name && <p>{errors.name.message}</p>}
 * ```
 */
export function useValidatedForm<TFieldValues extends FieldValues = FieldValues>({
  mode = 'onBlur', // Default to onBlur for better UX
  ...options
}: UseValidatedFormOptions<TFieldValues> = {}): UseValidatedFormReturn<TFieldValues> {
  // Initialize React Hook Form with native validation
  const form = useForm<TFieldValues>({
    ...options,
    mode, // Validation timing (onBlur, onChange, onSubmit, etc.)
    reValidateMode: 'onChange', // Revalidate on change for edit mode responsiveness
    shouldFocusError: true, // Auto-focus first error field
    criteriaMode: 'all', // Show all validation errors
  });

  // Extract form state for computed properties
  const { formState } = form;

  // Access errors and other state (required for Proxy tracking)
  const { errors, touchedFields, isSubmitting, isDirty, isValid: rhfIsValid } = formState;

  // Computed properties
  const hasTouchedFields = Object.keys(touchedFields).length > 0;
  const hasErrors = Object.keys(errors).length > 0;

  // Form is valid if: React Hook Form says it's valid (checks all validation rules)
  // This works for both create mode (empty form) and edit mode (pre-filled form)
  const isValid = rhfIsValid;

  // Can submit if: form is valid AND not currently submitting
  // Note: In edit mode with pre-filled valid data, this allows immediate submission
  // In create mode, required fields must be filled first (validated on blur)
  const canSubmit = isValid && !isSubmitting;

  return {
    ...form,
    isValid,
    isSubmitting,
    canSubmit,
  };
}

// ============================================================================
// UTILITY TYPES
// ============================================================================

/**
 * Extract field names from form data type
 * Useful for field arrays and dynamic forms
 */
export type FieldNamesFromData<T extends FieldValues> = keyof T;
