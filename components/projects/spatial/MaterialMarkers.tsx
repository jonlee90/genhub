'use client';

import { cn } from '@/lib/utils';
// Performance optimization: Direct imports instead of barrel file (saves 200-800ms per page)
import Package from 'lucide-react/icons/package';
import CheckCircle2 from 'lucide-react/icons/check-circle-2';
import Truck from 'lucide-react/icons/truck';
import Wrench from 'lucide-react/icons/wrench';
import MapPin from 'lucide-react/icons/map-pin';;
import type { SpatialMarker } from '@/types/db/spatial';

/**
 * P4.5 - Material marker rendering with status-based color coding
 * Statuses: ordered (blue), delivered (green), installed (gray)
 */

interface MaterialMarkerProps {
  marker: SpatialMarker;
  quantity?: number;
  materialName?: string;
  onClick?: () => void;
  className?: string;
}

// Debug: Material status configuration
const MATERIAL_STATUS_CONFIG = {
  ordered: {
    label: 'Ordered',
    icon: Package,
    color: 'bg-blue-500',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-300',
    textColor: 'text-blue-700',
  },
  delivered: {
    label: 'Delivered',
    icon: Truck,
    color: 'bg-green-500',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-300',
    textColor: 'text-green-700',
  },
  installed: {
    label: 'Installed',
    icon: CheckCircle2,
    color: 'bg-gray-500',
    bgColor: 'bg-gray-50',
    borderColor: 'border-gray-300',
    textColor: 'text-gray-700',
  },
  pending: {
    label: 'Pending',
    icon: Wrench,
    color: 'bg-amber-500',
    bgColor: 'bg-amber-50',
    borderColor: 'border-amber-300',
    textColor: 'text-amber-700',
  },
};

type MaterialStatus = keyof typeof MATERIAL_STATUS_CONFIG;

/**
 * Material marker badge for 3D viewer
 */
export function MaterialMarkerBadge({ marker, quantity, materialName, onClick, className }: MaterialMarkerProps) {
  const status = (marker.status as MaterialStatus) || 'pending';
  const config = MATERIAL_STATUS_CONFIG[status] || MATERIAL_STATUS_CONFIG.pending;
  const Icon = config.icon;

  console.log('[MaterialMarkerBadge] Rendering material marker:', marker.id, 'Status:', status);

  return (
    <div
      onClick={onClick}
      className={cn(
        'relative group cursor-pointer',
        className
      )}
    >
      {/* 3D Marker Pin */}
      <div className="relative">
        {/* Glow effect */}
        <div className={cn(
          'absolute inset-0 rounded-full blur-md opacity-60 animate-pulse',
          config.color
        )} />

        {/* Main pin */}
        <div className={cn(
          'relative w-10 h-10 rounded-full',
          'flex items-center justify-center',
          'border-4 border-white shadow-lg',
          config.color,
          'transform transition-transform group-hover:scale-110'
        )}>
          <Icon className="h-5 w-5 text-white" strokeWidth={2.5} />
        </div>

        {/* Quantity badge */}
        {quantity && quantity > 0 && (
          <div className={cn(
            'absolute -top-1 -right-1',
            'w-6 h-6 rounded-full',
            'bg-white border-2',
            config.borderColor,
            'flex items-center justify-center',
            'text-xs font-black',
            config.textColor
          )}>
            {quantity > 99 ? '99+' : quantity}
          </div>
        )}
      </div>

      {/* Hover tooltip */}
      <div className={cn(
        'absolute left-full ml-3 top-1/2 -translate-y-1/2',
        'opacity-0 group-hover:opacity-100',
        'pointer-events-none',
        'transition-opacity duration-200',
        'z-50'
      )}>
        <div className={cn(
          'px-3 py-2 rounded-lg shadow-xl border-2',
          'bg-white',
          config.borderColor,
          'min-w-[200px]'
        )}>
          <div className="flex items-center gap-2 mb-1">
            <div className={cn('p-1 rounded', config.bgColor)}>
              <Icon className={cn('h-3 w-3', config.textColor)} />
            </div>
            <div className={cn(
              'text-xs font-mono uppercase tracking-wider',
              config.textColor
            )}>
              {config.label}
            </div>
          </div>
          <div className="text-sm font-bold text-gray-900 mb-1">
            {materialName || marker.title}
          </div>
          {quantity && (
            <div className="text-xs text-gray-600">
              Quantity: {quantity}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Material marker list item for sidebar
 */
export function MaterialMarkerListItem({ marker, quantity, materialName, onClick }: MaterialMarkerProps) {
  const status = (marker.status as MaterialStatus) || 'pending';
  const config = MATERIAL_STATUS_CONFIG[status] || MATERIAL_STATUS_CONFIG.pending;
  const Icon = config.icon;

  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full p-4 rounded-lg border-2 transition-all',
        'hover:shadow-lg',
        config.bgColor,
        config.borderColor,
        'text-left'
      )}
    >
      <div className="flex items-start gap-3">
        {/* Icon */}
        <div className={cn(
          'p-2 rounded-lg',
          config.color,
          'flex items-center justify-center shrink-0'
        )}>
          <Icon className="h-5 w-5 text-white" />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <div className={cn(
              'text-xs font-mono uppercase tracking-wider',
              config.textColor
            )}>
              {config.label}
            </div>
            {quantity && quantity > 0 && (
              <div className={cn(
                'px-2 py-0.5 rounded',
                'text-xs font-black',
                'bg-white',
                config.textColor
              )}>
                ×{quantity}
              </div>
            )}
          </div>
          <div className="text-sm font-bold text-gray-900 mb-1 line-clamp-1">
            {materialName || marker.title}
          </div>
          {marker.description && (
            <div className="text-xs text-gray-600 line-clamp-1">
              {marker.description}
            </div>
          )}
        </div>

        {/* Location indicator */}
        <div className="flex items-center gap-1 text-xs text-gray-500">
          <MapPin className="h-3 w-3" />
        </div>
      </div>
    </button>
  );
}

/**
 * Material status legend for filters
 */
export function MaterialStatusLegend() {
  return (
    <div className="flex flex-wrap gap-2">
      {Object.entries(MATERIAL_STATUS_CONFIG).map(([status, config]) => {
        const Icon = config.icon;
        return (
          <div
            key={status}
            className={cn(
              'flex items-center gap-2 px-3 py-2 rounded-lg border-2',
              config.bgColor,
              config.borderColor
            )}
          >
            <div className={cn('p-1 rounded', config.color)}>
              <Icon className="h-3 w-3 text-white" />
            </div>
            <span className={cn('text-xs font-bold', config.textColor)}>
              {config.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}
