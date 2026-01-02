// P3.1 - State machine for marker placement mode
// Manages placement workflow: idle → placing → confirming → creating

'use client';

import { useState, useCallback } from 'react';
import type { SpatialMarkerType } from '@/types/spatial';

// Debug: Placement state machine
export type PlacementState = 'idle' | 'placing' | 'confirming' | 'creating';

// Debug: Marker preview data
export interface MarkerPreview {
  position: { x: number; y: number; z: number };
  normal: { x: number; y: number; z: number };
  elementId?: string;
  elementType?: string;
  floorId?: string;
  floorName?: string;
}

// Debug: Form data
export interface MarkerFormData {
  type: SpatialMarkerType;
  title: string;
  description?: string;
}

// Debug: Hook return type
export interface UseMarkerPlacementReturn {
  state: PlacementState;
  preview: MarkerPreview | null;
  formData: MarkerFormData;
  isPlacementMode: boolean;
  startPlacement: () => void;
  cancelPlacement: () => void;
  setPreview: (preview: MarkerPreview | null) => void;
  setFormData: (data: Partial<MarkerFormData>) => void;
  setState: (state: PlacementState) => void;
  reset: () => void;
}

// Debug: Default form data
const DEFAULT_FORM_DATA: MarkerFormData = {
  type: 'note',
  title: '',
  description: '',
};

/**
 * useMarkerPlacement - State machine for marker placement workflow
 * Features:
 * - State management: idle → placing → confirming → creating
 * - Preview data storage
 * - Form data management
 * - Placement mode toggle
 */
export function useMarkerPlacement(): UseMarkerPlacementReturn {
  console.log('[useMarkerPlacement] Hook initialized');

  // Debug: State
  const [state, setState] = useState<PlacementState>('idle');
  const [preview, setPreview] = useState<MarkerPreview | null>(null);
  const [formData, setFormDataState] = useState<MarkerFormData>(DEFAULT_FORM_DATA);

  // Debug: Computed
  const isPlacementMode = state === 'placing' || state === 'confirming' || state === 'creating';

  // Debug: Start placement mode
  const startPlacement = useCallback(() => {
    console.log('[useMarkerPlacement] Starting placement mode');
    setState('placing');
    setPreview(null);
    setFormDataState(DEFAULT_FORM_DATA);
  }, []);

  // Debug: Cancel placement
  const cancelPlacement = useCallback(() => {
    console.log('[useMarkerPlacement] Canceling placement');
    setState('idle');
    setPreview(null);
    setFormDataState(DEFAULT_FORM_DATA);
  }, []);

  // Debug: Update form data (partial)
  const setFormData = useCallback((data: Partial<MarkerFormData>) => {
    console.log('[useMarkerPlacement] Updating form data:', data);
    setFormDataState((prev) => ({ ...prev, ...data }));
  }, []);

  // Debug: Reset to idle
  const reset = useCallback(() => {
    console.log('[useMarkerPlacement] Resetting to idle');
    setState('idle');
    setPreview(null);
    setFormDataState(DEFAULT_FORM_DATA);
  }, []);

  return {
    state,
    preview,
    formData,
    isPlacementMode,
    startPlacement,
    cancelPlacement,
    setPreview,
    setFormData,
    setState,
    reset,
  };
}
