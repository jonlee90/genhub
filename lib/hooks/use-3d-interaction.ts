// Debug: Custom hook for 3D object interaction
// P2.7 - Click detection, highlighting, and hover tooltips

import { useState, useCallback, useRef, useEffect } from 'react';
import type { Viewer, PickResult } from '@xeokit/xeokit-sdk';

// Debug: Intersection result
export interface IntersectionResult {
  elementId: string;
  position: { x: number; y: number; z: number };
  normal: { x: number; y: number; z: number };
  surfaceType?: string;
  entityType?: string;
}

// Debug: Hover info
export interface HoverInfo {
  elementId: string;
  elementName: string;
  position: { x: number; y: number }; // Canvas position
}

// Debug: Hook options
export interface Use3DInteractionOptions {
  onElementClick?: (result: IntersectionResult) => void;
  onSurfaceClick?: (position: { x: number; y: number; z: number }, normal: { x: number; y: number; z: number }) => void;
  highlightDuration?: number; // ms
  touchHoldDuration?: number; // ms
}

// Debug: Hook return type
export interface Use3DInteractionReturn {
  hoveredElement: HoverInfo | null;
  highlightedElement: string | null;
  setupInteraction: (viewer: Viewer) => void;
  clearInteraction: () => void;
}

/**
 * use3DInteraction - Manage 3D object picking and interaction
 * Features:
 * - Click/tap detection on 3D elements
 * - Element highlighting with auto-fade
 * - Hover tooltips (desktop)
 * - Touch-hold for element info (mobile)
 * - Callbacks for element and surface clicks
 */
export function use3DInteraction(
  options: Use3DInteractionOptions = {}
): Use3DInteractionReturn {
  console.log('[use3DInteraction] Hook initialized', options);

  const {
    onElementClick,
    onSurfaceClick,
    highlightDuration = 2000,
    touchHoldDuration = 1000,
  } = options;

  // Debug: State
  const [hoveredElement, setHoveredElement] = useState<HoverInfo | null>(null);
  const [highlightedElement, setHighlightedElement] = useState<string | null>(null);

  // Debug: Refs
  const viewerRef = useRef<Viewer | null>(null);
  const highlightTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const touchStartRef = useRef<number>(0);
  const touchHoldTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastClickTimeRef = useRef<number>(0);

  // Debug: Clear highlight timeout
  const clearHighlightTimeout = useCallback(() => {
    if (highlightTimeoutRef.current) {
      clearTimeout(highlightTimeoutRef.current);
      highlightTimeoutRef.current = null;
    }
  }, []);

  // Debug: Highlight element with auto-fade
  const highlightElement = useCallback(
    (elementId: string) => {
      console.log('[use3DInteraction] Highlighting element', elementId);

      const viewer = viewerRef.current;
      if (!viewer || !viewer.scene) return;

      // Debug: Clear previous highlight
      if (highlightedElement) {
        viewer.scene.setObjectsHighlighted([highlightedElement], false);
      }

      // Debug: Highlight new element
      viewer.scene.setObjectsHighlighted([elementId], true);
      setHighlightedElement(elementId);

      // Debug: Auto-fade after duration
      clearHighlightTimeout();
      highlightTimeoutRef.current = setTimeout(() => {
        console.log('[use3DInteraction] Auto-fade highlight', elementId);
        viewer.scene.setObjectsHighlighted([elementId], false);
        setHighlightedElement(null);
      }, highlightDuration);
    },
    [highlightedElement, highlightDuration, clearHighlightTimeout]
  );

  // Debug: Pick object at canvas position
  const pickObject = useCallback(
    (canvasX: number, canvasY: number): PickResult | null => {
      const viewer = viewerRef.current;
      if (!viewer || !viewer.scene) {
        console.warn('[use3DInteraction] Viewer not ready');
        return null;
      }

      console.log('[use3DInteraction] Picking at', { canvasX, canvasY });

      const pickResult = viewer.scene.pick({
        canvasPos: [canvasX, canvasY],
        pickSurface: true, // Get surface normal
      });

      if (pickResult) {
        console.log('[use3DInteraction] Pick result', {
          entityId: pickResult.entity?.id,
          worldPos: pickResult.worldPos,
          worldNormal: pickResult.worldNormal,
        });
      } else {
        console.log('[use3DInteraction] No object picked (empty space)');
      }

      return pickResult;
    },
    []
  );

  // Debug: Handle click on canvas
  const handleClick = useCallback(
    (event: MouseEvent | TouchEvent) => {
      console.log('[use3DInteraction] Click event', event.type);

      // Debug: Debounce double-clicks
      const now = Date.now();
      if (now - lastClickTimeRef.current < 300) {
        console.log('[use3DInteraction] Double-click detected, ignoring');
        return;
      }
      lastClickTimeRef.current = now;

      // Debug: Get canvas position
      const canvas = viewerRef.current?.scene.canvas.canvas;
      if (!canvas) return;

      const rect = canvas.getBoundingClientRect();
      let canvasX: number, canvasY: number;

      if (event instanceof MouseEvent) {
        canvasX = event.clientX - rect.left;
        canvasY = event.clientY - rect.top;
      } else if (event instanceof TouchEvent && event.touches.length > 0) {
        canvasX = event.touches[0].clientX - rect.left;
        canvasY = event.touches[0].clientY - rect.top;
      } else {
        return;
      }

      // Debug: Pick object
      const pickResult = pickObject(canvasX, canvasY);

      if (pickResult && pickResult.entity) {
        // Debug: Element click
        const elementId = pickResult.entity.id;
        const position = {
          x: pickResult.worldPos[0],
          y: pickResult.worldPos[1],
          z: pickResult.worldPos[2],
        };
        const normal = {
          x: pickResult.worldNormal[0],
          y: pickResult.worldNormal[1],
          z: pickResult.worldNormal[2],
        };

        const result: IntersectionResult = {
          elementId,
          position,
          normal,
          entityType: pickResult.entity.type,
        };

        console.log('[use3DInteraction] Element clicked', result);

        // Debug: Highlight element
        highlightElement(elementId);

        // Debug: Callback
        if (onElementClick) {
          onElementClick(result);
        }
      } else if (pickResult && pickResult.worldPos) {
        // Debug: Surface click (no entity, but hit surface)
        const position = {
          x: pickResult.worldPos[0],
          y: pickResult.worldPos[1],
          z: pickResult.worldPos[2],
        };
        const normal = {
          x: pickResult.worldNormal[0],
          y: pickResult.worldNormal[1],
          z: pickResult.worldNormal[2],
        };

        console.log('[use3DInteraction] Surface clicked', { position, normal });

        // Debug: Callback
        if (onSurfaceClick) {
          onSurfaceClick(position, normal);
        }
      }
    },
    [pickObject, highlightElement, onElementClick, onSurfaceClick]
  );

  // Debug: Handle mouse move for hover (desktop only)
  const handleMouseMove = useCallback((event: MouseEvent) => {
    const canvas = viewerRef.current?.scene.canvas.canvas;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const canvasX = event.clientX - rect.left;
    const canvasY = event.clientY - rect.top;

    // Debug: Pick object for hover
    const pickResult = pickObject(canvasX, canvasY);

    if (pickResult && pickResult.entity) {
      const elementId = pickResult.entity.id;
      const elementName = elementId; // TODO: Map to actual IFC name from model_elements table

      setHoveredElement({
        elementId,
        elementName,
        position: { x: event.clientX, y: event.clientY },
      });
    } else {
      setHoveredElement(null);
    }
  }, [pickObject]);

  // Debug: Handle touch start (for touch-hold detection)
  const handleTouchStart = useCallback((event: TouchEvent) => {
    console.log('[use3DInteraction] Touch start');

    touchStartRef.current = Date.now();

    // Debug: Setup touch-hold timeout
    touchHoldTimeoutRef.current = setTimeout(() => {
      console.log('[use3DInteraction] Touch hold detected');

      // Debug: Show element info (similar to hover on desktop)
      const canvas = viewerRef.current?.scene.canvas.canvas;
      if (!canvas || event.touches.length === 0) return;

      const rect = canvas.getBoundingClientRect();
      const canvasX = event.touches[0].clientX - rect.left;
      const canvasY = event.touches[0].clientY - rect.top;

      const pickResult = pickObject(canvasX, canvasY);

      if (pickResult && pickResult.entity) {
        const elementId = pickResult.entity.id;
        const elementName = elementId;

        setHoveredElement({
          elementId,
          elementName,
          position: {
            x: event.touches[0].clientX,
            y: event.touches[0].clientY,
          },
        });

        // Debug: Auto-hide after 2s
        setTimeout(() => {
          setHoveredElement(null);
        }, 2000);
      }
    }, touchHoldDuration);
  }, [pickObject, touchHoldDuration]);

  // Debug: Handle touch end (clear touch-hold)
  const handleTouchEnd = useCallback(() => {
    console.log('[use3DInteraction] Touch end');

    if (touchHoldTimeoutRef.current) {
      clearTimeout(touchHoldTimeoutRef.current);
      touchHoldTimeoutRef.current = null;
    }

    // Debug: If short tap, treat as click
    const touchDuration = Date.now() - touchStartRef.current;
    if (touchDuration < touchHoldDuration) {
      console.log('[use3DInteraction] Short tap, treating as click');
    }
  }, [touchHoldDuration]);

  // Debug: Setup interaction listeners
  const setupInteraction = useCallback(
    (viewer: Viewer) => {
      console.log('[use3DInteraction] Setting up interaction listeners');

      viewerRef.current = viewer;
      const canvas = viewer.scene.canvas.canvas;

      // Debug: Click/tap
      canvas.addEventListener('click', handleClick as EventListener);
      canvas.addEventListener('touchend', handleClick as EventListener);

      // Debug: Hover (desktop only)
      if (!('ontouchstart' in window)) {
        canvas.addEventListener('mousemove', handleMouseMove);
      }

      // Debug: Touch-hold (mobile only)
      if ('ontouchstart' in window) {
        canvas.addEventListener('touchstart', handleTouchStart);
        canvas.addEventListener('touchend', handleTouchEnd);
      }

      console.log('[use3DInteraction] Interaction listeners attached');
    },
    [handleClick, handleMouseMove, handleTouchStart, handleTouchEnd]
  );

  // Debug: Clear interaction listeners
  const clearInteraction = useCallback(() => {
    console.log('[use3DInteraction] Clearing interaction listeners');

    const canvas = viewerRef.current?.scene.canvas.canvas;
    if (!canvas) return;

    canvas.removeEventListener('click', handleClick as EventListener);
    canvas.removeEventListener('touchend', handleClick as EventListener);
    canvas.removeEventListener('mousemove', handleMouseMove);
    canvas.removeEventListener('touchstart', handleTouchStart);
    canvas.removeEventListener('touchend', handleTouchEnd);

    clearHighlightTimeout();

    if (touchHoldTimeoutRef.current) {
      clearTimeout(touchHoldTimeoutRef.current);
      touchHoldTimeoutRef.current = null;
    }

    viewerRef.current = null;

    console.log('[use3DInteraction] Interaction listeners cleared');
  }, [handleClick, handleMouseMove, handleTouchStart, handleTouchEnd, clearHighlightTimeout]);

  return {
    hoveredElement,
    highlightedElement,
    setupInteraction,
    clearInteraction,
  };
}
