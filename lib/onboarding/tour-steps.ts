/**
 * Tour Steps for Spatial Viewer Onboarding
 * 5 steps: Navigate → Inspect → Place marker → Attach photo → Filter
 */

export interface TourStep {
  id: string;
  title: string;
  description: string;
  targetSelector: string; // CSS selector for element to highlight
  placement: 'top' | 'bottom' | 'left' | 'right' | 'center';
  icon?: string;
  action?: {
    type: 'click' | 'hover' | 'input';
    instruction: string;
  };
}

export const SPATIAL_VIEWER_TOUR_STEPS: TourStep[] = [
  {
    id: 'navigate',
    title: 'Navigate the 3D Model',
    description:
      'Use your mouse to rotate, pan, and zoom the 3D model. Left-click and drag to rotate. Right-click and drag to pan. Scroll to zoom in and out.',
    targetSelector: 'canvas',
    placement: 'center',
    icon: '🧭',
    action: {
      type: 'click',
      instruction: 'Try rotating the model by dragging',
    },
  },
  {
    id: 'inspect',
    title: 'Inspect Building Elements',
    description:
      'Click on any building element to highlight it and view its properties. Double-click to focus the camera on a specific element.',
    targetSelector: 'canvas',
    placement: 'center',
    icon: '🔍',
    action: {
      type: 'click',
      instruction: 'Click on a wall or element to select it',
    },
  },
  {
    id: 'place-marker',
    title: 'Place Markers',
    description:
      'Click the "Add Marker" button to enter placement mode. Then click anywhere on the model to place a marker for issues, notes, tasks, or approvals.',
    targetSelector: '[data-tour="add-marker-button"]',
    placement: 'left',
    icon: '📍',
    action: {
      type: 'click',
      instruction: 'Click the "Add Marker" button',
    },
  },
  {
    id: 'attach-photo',
    title: 'Attach Photos',
    description:
      'Once a marker is placed, you can attach photos, files, and notes. Photos with GPS data will automatically link to nearby markers.',
    targetSelector: '[data-tour="marker-panel"]',
    placement: 'right',
    icon: '📸',
    action: {
      type: 'click',
      instruction: 'Click on a marker to view attachment options',
    },
  },
  {
    id: 'filter',
    title: 'Filter Markers',
    description:
      'Use the filter buttons to show only specific types of markers (issues, tasks, notes, approvals). You can also filter by phase, status, or assignee.',
    targetSelector: '[data-tour="marker-filter"]',
    placement: 'right',
    icon: '🔧',
    action: {
      type: 'click',
      instruction: 'Try filtering markers by category',
    },
  },
];

export const MOBILE_SPATIAL_VIEWER_TOUR_STEPS: TourStep[] = [
  {
    id: 'navigate-mobile',
    title: 'Navigate (Touch)',
    description: 'Use one finger to rotate, two fingers to pan, and pinch to zoom the 3D model.',
    targetSelector: 'canvas',
    placement: 'center',
    icon: '👆',
  },
  {
    id: 'tap-marker',
    title: 'Tap Markers',
    description: 'Tap on a marker to view details and attach photos.',
    targetSelector: '[data-tour="marker-panel"]',
    placement: 'top',
    icon: '📍',
  },
  {
    id: 'filter-mobile',
    title: 'Filter Markers',
    description: 'Use the filter buttons at the bottom to show specific marker types.',
    targetSelector: '[data-tour="marker-filter"]',
    placement: 'top',
    icon: '🔧',
  },
];

/**
 * Get tour steps based on device type
 */
export function getTourSteps(isMobile: boolean): TourStep[] {
  return isMobile ? MOBILE_SPATIAL_VIEWER_TOUR_STEPS : SPATIAL_VIEWER_TOUR_STEPS;
}

/**
 * Check if user has completed the tour
 */
export function hasTourCompleted(userId: string): boolean {
  if (typeof window === 'undefined') return false;
  const key = `genhub_spatial_viewer_tour_completed_${userId}`;
  return localStorage.getItem(key) === 'true';
}

/**
 * Mark tour as completed
 */
export function markTourCompleted(userId: string): void {
  if (typeof window === 'undefined') return;
  const key = `genhub_spatial_viewer_tour_completed_${userId}`;
  localStorage.setItem(key, 'true');
  console.log('[TourSteps] Tour marked as completed for user:', userId);
}

/**
 * Reset tour (for testing or user preference)
 */
export function resetTour(userId: string): void {
  if (typeof window === 'undefined') return;
  const key = `genhub_spatial_viewer_tour_completed_${userId}`;
  localStorage.removeItem(key);
  console.log('[TourSteps] Tour reset for user:', userId);
}
