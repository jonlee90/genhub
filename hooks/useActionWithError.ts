/**
 * useActionWithError - Shared error state management hook
 * Eliminates duplicate error handling patterns across components
 *
 * Used by: TaskDetail, TaskModal, MaterialTab, ExpensesTab, etc.
 */
'use client';

import { useState, useCallback } from 'react';

interface UseActionWithErrorReturn {
  error: string | null;
  setError: (error: string | null) => void;
  clearError: () => void;
  successMessage: string | null;
  setSuccessMessage: (message: string | null) => void;
  showSuccess: (message: string, duration?: number) => void;
}

export function useActionWithError(): UseActionWithErrorReturn {
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const showSuccess = useCallback((message: string, duration: number = 3000) => {
    setSuccessMessage(message);
    setTimeout(() => setSuccessMessage(null), duration);
  }, []);

  return {
    error,
    setError,
    clearError,
    successMessage,
    setSuccessMessage,
    showSuccess,
  };
}
