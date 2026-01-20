'use client';

import { useEffect, useState } from 'react';
import { m as motion, AnimatePresence } from 'framer-motion';
// Performance optimization: Direct imports instead of barrel file (saves 200-800ms per page)
import MapPin from 'lucide-react/icons/map-pin';
import Plus from 'lucide-react/icons/plus';
import X from 'lucide-react/icons/x';
import Navigation from 'lucide-react/icons/navigation';;
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface GPSCoordinates {
  latitude: number;
  longitude: number;
  altitude?: number;
}

interface NearestMarker {
  id: string;
  title: string;
  distance: number; // in meters
  position: {
    x: number;
    y: number;
    z: number;
  };
}

interface PhotoLocationSuggesterProps {
  photoGPS: GPSCoordinates;
  nearestMarker: NearestMarker | null;
  onAttachToMarker: (markerId: string) => void;
  onCreateNewMarker: (gps: GPSCoordinates) => void;
  onDismiss: () => void;
}

// Debug: Calculate human-readable distance
function formatDistance(meters: number): string {
  if (meters < 1) {
    return `${Math.round(meters * 100)} cm`;
  } else if (meters < 1000) {
    return `${Math.round(meters)} m`;
  } else {
    return `${(meters / 1000).toFixed(1)} km`;
  }
}

export function PhotoLocationSuggester({
  photoGPS,
  nearestMarker,
  onAttachToMarker,
  onCreateNewMarker,
  onDismiss,
}: PhotoLocationSuggesterProps) {
  const [isVisible, setIsVisible] = useState(true);

  console.log('[PhotoLocationSuggester] Photo GPS:', photoGPS, 'Nearest marker:', nearestMarker);

  // Debug: Auto-dismiss after 20 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      console.log('[PhotoLocationSuggester] Auto-dismissing after timeout');
      handleDismiss();
    }, 20000);

    return () => clearTimeout(timer);
  }, []);

  const handleDismiss = () => {
    setIsVisible(false);
    setTimeout(onDismiss, 300); // Wait for animation
  };

  const handleAttach = () => {
    if (!nearestMarker) return;
    console.log('[PhotoLocationSuggester] Attaching to marker:', nearestMarker.id);
    onAttachToMarker(nearestMarker.id);
    handleDismiss();
  };

  const handleCreate = () => {
    console.log('[PhotoLocationSuggester] Creating new marker at GPS:', photoGPS);
    onCreateNewMarker(photoGPS);
    handleDismiss();
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.95 }}
          transition={{ type: 'spring', stiffness: 400, damping: 25 }}
          className="fixed bottom-4 right-4 z-50 w-full max-w-md px-4 sm:px-0"
        >
          <div className="bg-white rounded-xl shadow-2xl border-2 border-construction-blue overflow-hidden">
            {/* Header */}
            <div className="relative bg-gradient-to-r from-construction-blue to-blue-700 px-4 py-3">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white/20 backdrop-blur-sm rounded-lg">
                    <Navigation className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <div className="text-xs font-mono uppercase tracking-wider text-white/80">
                      GPS Location Detected
                    </div>
                    <div className="text-sm font-bold text-white">
                      Photo has location data
                    </div>
                  </div>
                </div>
                <button
                  onClick={handleDismiss}
                  className="p-1 hover:bg-white/20 rounded transition-colors"
                  aria-label="Dismiss"
                >
                  <X className="h-4 w-4 text-white" />
                </button>
              </div>

              {/* GPS Coordinates Badge */}
              <div className="mt-3 flex items-center gap-2 text-xs font-mono text-white/80">
                <div className="flex items-center gap-1">
                  <span className="text-white/60">LAT:</span>
                  <span>{photoGPS.latitude.toFixed(6)}</span>
                </div>
                <span className="text-white/40">•</span>
                <div className="flex items-center gap-1">
                  <span className="text-white/60">LON:</span>
                  <span>{photoGPS.longitude.toFixed(6)}</span>
                </div>
                {photoGPS.altitude && (
                  <>
                    <span className="text-white/40">•</span>
                    <div className="flex items-center gap-1">
                      <span className="text-white/60">ALT:</span>
                      <span>{Math.round(photoGPS.altitude)}m</span>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Content */}
            <div className="p-4 space-y-3">
              {nearestMarker ? (
                <>
                  {/* Nearest Marker Info */}
                  <div className="p-3 bg-construction-blue/5 rounded-lg border-2 border-construction-blue/20">
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-construction-blue/10 rounded-lg border border-construction-blue/20">
                        <MapPin className="h-4 w-4 text-construction-blue" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-mono uppercase tracking-wider text-construction-blue/70 mb-1">
                          Nearest Marker
                        </div>
                        <div className="text-sm font-bold text-gray-900 mb-1">
                          {nearestMarker.title}
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="px-2 py-0.5 bg-construction-blue/10 rounded text-xs font-mono font-bold text-construction-blue">
                            {formatDistance(nearestMarker.distance)} away
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={handleAttach}
                      className={cn(
                        'px-4 py-3 rounded-lg',
                        'bg-construction-blue text-white',
                        'hover:bg-blue-700',
                        'font-bold text-sm',
                        'flex flex-col items-center gap-2',
                        'transition-all duration-200',
                        'border-2 border-construction-blue',
                        'shadow-lg hover:shadow-xl'
                      )}
                    >
                      <MapPin className="h-5 w-5" />
                      <span>Attach Here</span>
                    </button>

                    <button
                      onClick={handleCreate}
                      className={cn(
                        'px-4 py-3 rounded-lg',
                        'bg-white text-construction-blue',
                        'hover:bg-gray-50',
                        'font-bold text-sm',
                        'flex flex-col items-center gap-2',
                        'transition-all duration-200',
                        'border-2 border-construction-blue'
                      )}
                    >
                      <Plus className="h-5 w-5" />
                      <span>Create New</span>
                    </button>
                  </div>

                  {/* Helper Text */}
                  <div className="text-xs text-gray-500 text-center font-mono">
                    Attach to existing marker or create a new one at GPS location
                  </div>
                </>
              ) : (
                <>
                  {/* No Nearby Markers */}
                  <div className="text-center py-4">
                    <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-gray-100 mb-3">
                      <MapPin className="h-6 w-6 text-gray-400" />
                    </div>
                    <div className="text-sm font-bold text-gray-900 mb-1">
                      No nearby markers
                    </div>
                    <div className="text-xs text-gray-500 mb-4">
                      Create a new marker at this location
                    </div>
                  </div>

                  {/* Create Button */}
                  <button
                    onClick={handleCreate}
                    className={cn(
                      'w-full px-4 py-3 rounded-lg',
                      'bg-construction-blue text-white',
                      'hover:bg-blue-700',
                      'font-bold text-sm',
                      'flex items-center justify-center gap-2',
                      'transition-all duration-200',
                      'border-2 border-construction-blue',
                      'shadow-lg hover:shadow-xl'
                    )}
                  >
                    <Plus className="h-5 w-5" />
                    <span>Create New Marker</span>
                  </button>
                </>
              )}
            </div>

            {/* Footer */}
            <div className="px-4 py-2 bg-gray-50 border-t border-gray-100">
              <div className="text-[10px] font-mono text-gray-500 text-center">
                Auto-dismisses in 20s
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
