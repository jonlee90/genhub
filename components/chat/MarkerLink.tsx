'use client';

import { useState, useEffect } from 'react';
import { MapPin, ExternalLink, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { getMarkerById } from '@/app/actions/spatial';
import type { SpatialMarker } from '@/types/spatial.d';

interface MarkerLinkProps {
  markerId: string;
  projectId?: string;
  className?: string;
}

/**
 * P4.4 - Clickable marker link in chat messages
 * Renders as: 📍 [Marker Title]
 * Links to: /app/projects/{projectId}/spatial?marker={markerId}
 */
export function MarkerLink({ markerId, projectId, className }: MarkerLinkProps) {
  const [marker, setMarker] = useState<SpatialMarker | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  console.log('[MarkerLink] Rendering for marker:', markerId);

  // Debug: Fetch marker details
  useEffect(() => {
    async function fetchMarker() {
      try {
        const result = await getMarkerById(markerId);

        if (result.success && result.data) {
          console.log('[MarkerLink] Marker loaded:', result.data.title);
          setMarker(result.data);
        } else {
          console.error('[MarkerLink] Failed to load marker:', result.error);
          setError(result.error || 'Marker not found');
        }
      } catch (err) {
        console.error('[MarkerLink] Error loading marker:', err);
        setError('Failed to load marker');
      } finally {
        setIsLoading(false);
      }
    }

    fetchMarker();
  }, [markerId]);

  // Debug: Loading state
  if (isLoading) {
    return (
      <span
        className={cn(
          'inline-flex items-center gap-1.5 px-2 py-1 rounded',
          'bg-gray-100 text-gray-600',
          'text-xs font-mono',
          className
        )}
      >
        <Loader2 className="h-3 w-3 animate-spin" />
        <span>Loading...</span>
      </span>
    );
  }

  // Debug: Error state
  if (error || !marker) {
    return (
      <span
        className={cn(
          'inline-flex items-center gap-1.5 px-2 py-1 rounded',
          'bg-red-50 text-red-700',
          'text-xs font-mono',
          className
        )}
        title={error || 'Marker not found'}
      >
        <MapPin className="h-3 w-3" />
        <span>Unknown Location</span>
      </span>
    );
  }

  // Debug: Build link URL
  const effectiveProjectId = projectId || marker.project_id;
  const href = `/app/projects/${effectiveProjectId}/spatial?marker=${markerId}`;

  return (
    <Link
      href={href}
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg',
        'bg-construction-blue/10 text-construction-blue',
        'hover:bg-construction-blue/20',
        'border border-construction-blue/30',
        'transition-all duration-200',
        'text-xs font-bold',
        'group',
        className
      )}
      onClick={() => console.log('[MarkerLink] Navigating to marker:', markerId)}
    >
      <MapPin className="h-3.5 w-3.5" />
      <span>{marker.title}</span>
      <ExternalLink className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
    </Link>
  );
}

/**
 * Tooltip preview for marker link hover
 */
interface MarkerPreviewProps {
  marker: SpatialMarker;
}

export function MarkerPreview({ marker }: MarkerPreviewProps) {
  const typeLabels: Record<string, string> = {
    general: 'General',
    issue: 'Issue',
    photo: 'Photo',
    measurement: 'Measurement',
    material: 'Material',
    equipment: 'Equipment',
    safety: 'Safety',
  };

  const typeLabel = typeLabels[marker.type] || marker.type;

  return (
    <div className="p-3 bg-white rounded-lg shadow-lg border-2 border-construction-blue/20 min-w-[200px]">
      <div className="flex items-start gap-2 mb-2">
        <div className="p-1.5 bg-construction-blue/10 rounded border border-construction-blue/20">
          <MapPin className="h-4 w-4 text-construction-blue" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-xs font-mono uppercase tracking-wider text-construction-blue/70">
            3D Marker
          </div>
          <div className="text-sm font-bold text-gray-900">
            {marker.title}
          </div>
        </div>
      </div>

      {marker.description && (
        <div className="text-xs text-gray-600 mb-2 line-clamp-2">
          {marker.description}
        </div>
      )}

      <div className="flex items-center gap-2">
        <div className="px-2 py-0.5 bg-gray-100 rounded text-[10px] font-mono font-bold text-gray-700">
          {typeLabel}
        </div>
        {marker.status && (
          <div className="px-2 py-0.5 bg-construction-blue/10 rounded text-[10px] font-mono font-bold text-construction-blue">
            {marker.status}
          </div>
        )}
      </div>

      {marker.position_x != null && marker.position_y != null && marker.position_z != null && (
        <div className="mt-2 pt-2 border-t border-gray-100">
          <div className="text-[10px] font-mono text-gray-500">
            X: {marker.position_x.toFixed(2)} • Y: {marker.position_y.toFixed(2)} • Z: {marker.position_z.toFixed(2)}
          </div>
        </div>
      )}
    </div>
  );
}
