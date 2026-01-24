'use client';

/**
 * useFormSubmit Hook
 *
 * Standardized form submission behavior for all POST operations.
 * Handles loading states, success/error toasts (Sonner), and optional overlay for complex operations.
 *
 * @example Basic usage with Sonner toast feedback
 * ```tsx
 * const { submit, isPending, formAction } = useFormSubmit({
 *   action: createPhase,
 *   onSuccess: () => router.refresh(),
 *   successMessage: "Phase created successfully",
 *   errorMessage: "Failed to create phase"
 * });
 *
 * // Use with form action
 * <form action={formAction}>...</form>
 *
 * // Or use with manual submission
 * const handleSubmit = async (formData: FormData) => {
 *   await submit(formData);
 * };
 * ```
 *
 * @example With FormSubmissionOverlay for complex operations
 * ```tsx
 * const { submit, isPending, formAction, isComplete } = useFormSubmit({
 *   action: createProject,
 *   onSuccess: (project) => router.push(`/projects/${project.id}`),
 *   useOverlay: true
 * });
 *
 * // Render overlay
 * <FormSubmissionOverlay
 *   isSubmitting={isPending}
 *   isComplete={isComplete}
 *   projectName={formData.name}
 * />
 * ```
 */

import { useActionState, useCallback, useState, useEffect } from 'react';
import { toast } from 'sonner';
import type { FormActionResult } from '@/types/server-actions';

export interface UseFormSubmitOptions<TData> {
  /** Server action to execute */
  action: (formData: FormData) => Promise<FormActionResult<TData>>;

  /** Callback on successful submission */
  onSuccess?: (data: TData) => void;

  /** Callback on error */
  onError?: (error: string) => void;

  /** Success toast message (Sonner basic toast, if not using overlay) */
  successMessage?: string;

  /** Error toast message (Sonner basic toast, if not using overlay) */
  errorMessage?: string;

  /** Use FormSubmissionOverlay instead of Sonner toast */
  useOverlay?: boolean;
}

export interface UseFormSubmitReturn<TData> {
  /** Manual submit function (for non-form usage) */
  submit: (formData: FormData) => Promise<FormActionResult<TData>>;

  /** Is submission in progress? */
  isPending: boolean;

  /** Form action for use with <form action={formAction}> */
  formAction: (formData: FormData) => void;

  /** Is submission complete (for overlay) */
  isComplete: boolean;

  /** Latest submission result */
  result: FormActionResult<TData> | null;
}

/**
 * Standardized form submission hook
 *
 * Provides consistent loading states, error handling, and success feedback
 * across all form submissions in the application.
 */
export function useFormSubmit<TData = unknown>(
  options: UseFormSubmitOptions<TData>
): UseFormSubmitReturn<TData> {
  const {
    action,
    onSuccess,
    onError,
    successMessage = 'Operation completed successfully',
    errorMessage = 'Operation failed',
    useOverlay = false,
  } = options;

  const [isComplete, setIsComplete] = useState(false);

  // useActionState for form integration
  const [state, formAction, isPending] = useActionState<
    FormActionResult<TData> | null,
    FormData
  >(
    async (prevState, formData) => {
      // Reset complete state on new submission
      setIsComplete(false);

      const result = await action(formData);
      return result;
    },
    null
  );

  // Handle success/error when state changes
  useEffect(() => {
    if (!state) return;

    if (state.success) {
      setIsComplete(true);

      // Call success callback
      if (onSuccess) {
        onSuccess(state.data);
      }

      // Show toast ONLY if not using overlay (overlay handles success visually)
      if (!useOverlay) {
        toast.success(successMessage);
      }
    } else {
      setIsComplete(false);

      // Call error callback
      if (onError) {
        onError(state.error);
      }

      // Show error toast ONLY if not using overlay (overlay doesn't show errors)
      if (!useOverlay) {
        toast.error(state.error || errorMessage);
      }
    }
  }, [state, onSuccess, onError, successMessage, errorMessage, useOverlay]);

  // Manual submit function for imperative usage
  const submit = useCallback(
    async (formData: FormData): Promise<FormActionResult<TData>> => {
      setIsComplete(false);
      const result = await action(formData);

      if (result.success) {
        setIsComplete(true);

        if (onSuccess) {
          onSuccess(result.data);
        }

        // Show toast ONLY if not using overlay (overlay handles success visually)
        if (!useOverlay) {
          toast.success(successMessage);
        }
      } else {
        if (onError) {
          onError(result.error);
        }

        // Show error toast ONLY if not using overlay (overlay doesn't show errors)
        if (!useOverlay) {
          toast.error(result.error || errorMessage);
        }
      }

      return result;
    },
    [action, onSuccess, onError, successMessage, errorMessage, useOverlay]
  );

  return {
    submit,
    isPending,
    formAction,
    isComplete,
    result: state,
  };
}
