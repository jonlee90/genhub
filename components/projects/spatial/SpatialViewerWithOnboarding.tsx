'use client';

/**
 * Example integration: SpatialViewer with Onboarding Tour
 * Shows how to integrate the OnboardingTour with the main SpatialViewer
 */

import { useState } from 'react';
import { SpatialViewer, type SpatialViewerProps } from './SpatialViewer';
import { OnboardingTour } from './OnboardingTour';
import { MarkerAnnotationPanel } from './MarkerAnnotationPanel';
// Performance optimization: Direct imports instead of barrel file (saves 200-800ms per page)
import RotateCcw from 'lucide-react/icons/rotate-ccw';;
import { cn } from '@/lib/utils';
import { resetTour } from '@/lib/onboarding/tour-steps';

export interface SpatialViewerWithOnboardingProps extends SpatialViewerProps {
  userId: string;
  markers?: any[];
  onAddMarker?: () => void;
  showTourRestart?: boolean;
}

export function SpatialViewerWithOnboarding({
  userId,
  markers = [],
  onAddMarker,
  showTourRestart = true,
  ...spatialViewerProps
}: SpatialViewerWithOnboardingProps) {
  console.log('[SpatialViewerWithOnboarding] Rendering', { userId });

  const [tourKey, setTourKey] = useState(0);

  const handleRestartTour = () => {
    console.log('[SpatialViewerWithOnboarding] Restarting tour');
    resetTour(userId);
    setTourKey((prev) => prev + 1);
  };

  return (
    <div className="relative w-full h-full">
      {/* Main Spatial Viewer */}
      <SpatialViewer {...spatialViewerProps} />

      {/* Marker Panel (with tour data attributes) */}
      <div
        className="absolute right-4 top-4 w-96 max-h-[calc(100vh-8rem)] z-20"
        data-tour="marker-panel"
      >
        <MarkerAnnotationPanel
          markers={markers}
          onAddMarker={onAddMarker}
          onFilterChange={(category) => {
            console.log('[SpatialViewerWithOnboarding] Filter changed:', category);
          }}
        />
      </div>

      {/* Add Marker Button (with tour data attribute) */}
      {onAddMarker && (
        <button
          onClick={onAddMarker}
          data-tour="add-marker-button"
          className={cn(
            'absolute bottom-4 right-4 z-20',
            'px-6 py-3 rounded-lg font-bold text-sm uppercase tracking-wide',
            'bg-construction-blue text-white hover:bg-[#002666] transition-colors shadow-construction',
            'flex items-center gap-2'
          )}
        >
          <span className="text-xl">📍</span>
          Add Marker
        </button>
      )}

      {/* Filter Buttons (with tour data attribute) */}
      <div className="absolute bottom-4 left-4 z-20" data-tour="marker-filter">
        <div className="flex gap-2">
          <button className="px-3 py-2 bg-white border-2 border-gray-200 rounded-lg text-xs font-semibold hover:border-construction-blue transition-colors">
            Issues
          </button>
          <button className="px-3 py-2 bg-white border-2 border-gray-200 rounded-lg text-xs font-semibold hover:border-construction-blue transition-colors">
            Tasks
          </button>
          <button className="px-3 py-2 bg-white border-2 border-gray-200 rounded-lg text-xs font-semibold hover:border-construction-blue transition-colors">
            Notes
          </button>
        </div>
      </div>

      {/* Restart Tour Button (Settings) */}
      {showTourRestart && (
        <button
          onClick={handleRestartTour}
          className="absolute top-4 left-4 z-20 px-3 py-2 bg-white border-2 border-gray-200 rounded-lg text-xs font-semibold hover:border-construction-blue transition-colors flex items-center gap-2"
          title="Restart Tour"
        >
          <RotateCcw className="w-4 h-4" />
          Restart Tour
        </button>
      )}

      {/* Onboarding Tour */}
      <OnboardingTour
        key={tourKey}
        userId={userId}
        autoStart={true}
        onComplete={() => {
          console.log('[SpatialViewerWithOnboarding] Tour completed');
        }}
        onSkip={() => {
          console.log('[SpatialViewerWithOnboarding] Tour skipped');
        }}
      />
    </div>
  );
}
