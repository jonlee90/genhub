'use client';

import { useState } from 'react';
// Performance optimization: Direct imports instead of barrel file (saves 200-800ms per page)
import Box from 'lucide-react/icons/box';
import Calendar from 'lucide-react/icons/calendar';
import HardDrive from 'lucide-react/icons/hard-drive';
import ChevronDown from 'lucide-react/icons/chevron-down';
import Upload from 'lucide-react/icons/upload';
import Trash2 from 'lucide-react/icons/trash2';
import Settings from 'lucide-react/icons/settings';
import CheckCircle2 from 'lucide-react/icons/check-circle-2';;
import { cn, formatDate } from '@/lib/utils';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { Project3DModel } from '@/types/db/spatial';

export interface ModelManagementPanelProps {
  model: Project3DModel;
  onReplace?: () => void;
  onDelete?: () => void;
  onQualityChange?: (quality: 'high' | 'medium' | 'low') => void;
  className?: string;
}

export function ModelManagementPanel({
  model,
  onReplace,
  onDelete,
  onQualityChange,
  className,
}: ModelManagementPanelProps) {
  console.log('[ModelManagementPanel] Rendering', { modelId: model.id });

  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedQuality, setSelectedQuality] = useState<'high' | 'medium' | 'low'>('high');

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024 * 1024) {
      return `${(bytes / 1024).toFixed(1)} KB`;
    }
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const handleQualityChange = (quality: 'high' | 'medium' | 'low') => {
    console.log('[ModelManagementPanel] Quality changed', { quality });
    setSelectedQuality(quality);
    onQualityChange?.(quality);
  };

  return (
    <Card
      className={cn(
        'border-2 border-gray-200 shadow-construction overflow-hidden',
        'bg-white',
        className
      )}
    >
      {/* Collapsible Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className={cn(
          'w-full flex items-center justify-between gap-4 p-4',
          'hover:bg-gray-50 transition-colors',
          'border-b-2 border-gray-200'
        )}
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className="p-2 bg-[#001B51] rounded-lg flex-shrink-0">
            <Box className="w-5 h-5 text-white" />
          </div>

          <div className="flex-1 min-w-0 text-left">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-bold text-gray-900 uppercase tracking-tight text-sm truncate">
                {model.file_name}
              </h3>
              {model.is_active && (
                <Badge className="bg-[#059669] text-white text-xs px-2 py-0.5 flex-shrink-0">
                  Active
                </Badge>
              )}
            </div>
            <p className="text-xs text-gray-500 font-mono">
              v{model.version} • {formatDate(model.created_at)}
            </p>
          </div>
        </div>

        <ChevronDown
          className={cn(
            'w-5 h-5 text-gray-400 transition-transform flex-shrink-0',
            isExpanded && 'rotate-180'
          )}
        />
      </button>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="p-4 space-y-6 border-t-2 border-gray-100">
          {/* Model Stats Grid */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 bg-gray-50 border-2 border-gray-200 rounded-lg">
              <div className="flex items-center gap-2 mb-1">
                <HardDrive className="w-4 h-4 text-gray-400" />
                <span className="text-xs text-gray-500 uppercase tracking-wide">Size</span>
              </div>
              <p className="font-bold text-gray-900 font-mono">
                {formatFileSize(model.file_size_bytes)}
              </p>
            </div>

            <div className="p-3 bg-gray-50 border-2 border-gray-200 rounded-lg">
              <div className="flex items-center gap-2 mb-1">
                <Box className="w-4 h-4 text-gray-400" />
                <span className="text-xs text-gray-500 uppercase tracking-wide">Elements</span>
              </div>
              <p className="font-bold text-gray-900 font-mono">
                {model.element_count?.toLocaleString() || '—'}
              </p>
            </div>

            <div className="p-3 bg-gray-50 border-2 border-gray-200 rounded-lg">
              <div className="flex items-center gap-2 mb-1">
                <Calendar className="w-4 h-4 text-gray-400" />
                <span className="text-xs text-gray-500 uppercase tracking-wide">Uploaded</span>
              </div>
              <p className="font-semibold text-gray-900 text-sm">{formatDate(model.created_at)}</p>
            </div>

            <div className="p-3 bg-gray-50 border-2 border-gray-200 rounded-lg">
              <div className="flex items-center gap-2 mb-1">
                <CheckCircle2 className="w-4 h-4 text-gray-400" />
                <span className="text-xs text-gray-500 uppercase tracking-wide">Status</span>
              </div>
              <Badge
                className={cn(
                  'text-xs font-semibold',
                  model.processing_status === 'ready' && 'bg-[#059669] text-white',
                  model.processing_status === 'processing' && 'bg-[#FBBF24] text-gray-900',
                  model.processing_status === 'failed' && 'bg-[#DC2626] text-white',
                  model.processing_status === 'pending' && 'bg-gray-400 text-white'
                )}
              >
                {model.processing_status}
              </Badge>
            </div>
          </div>

          {/* Quality Settings */}
          <div>
            <h4 className="text-sm font-bold text-gray-900 uppercase tracking-tight mb-3 flex items-center gap-2">
              <Settings className="w-4 h-4" />
              Display Quality
            </h4>

            <div className="grid grid-cols-3 gap-2">
              {(['high', 'medium', 'low'] as const).map((quality) => (
                <button
                  key={quality}
                  onClick={() => handleQualityChange(quality)}
                  disabled={
                    (quality === 'medium' && !model.lod_medium_url) ||
                    (quality === 'low' && !model.lod_low_url)
                  }
                  className={cn(
                    'py-2 px-3 rounded-lg font-semibold text-sm uppercase tracking-wide',
                    'border-2 transition-all',
                    'disabled:opacity-40 disabled:cursor-not-allowed',
                    selectedQuality === quality
                      ? 'bg-[#001B51] text-white border-[#001B51]'
                      : 'bg-white text-gray-700 border-gray-200 hover:border-[#001B51]'
                  )}
                >
                  {quality}
                </button>
              ))}
            </div>

            <p className="text-xs text-gray-500 mt-2">
              {selectedQuality === 'high' && 'Maximum detail, slower loading'}
              {selectedQuality === 'medium' && 'Balanced quality and performance'}
              {selectedQuality === 'low' && 'Fast loading, reduced detail'}
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-2 pt-4 border-t-2 border-gray-100">
            <button
              onClick={onReplace}
              className={cn(
                'flex-1 py-2.5 px-4 rounded-lg font-semibold text-sm uppercase tracking-wide',
                'bg-white text-[#001B51] border-2 border-[#001B51]',
                'hover:bg-[#001B51] hover:text-white transition-all',
                'flex items-center justify-center gap-2'
              )}
            >
              <Upload className="w-4 h-4" />
              Replace
            </button>

            <button
              onClick={onDelete}
              className={cn(
                'flex-1 sm:flex-initial py-2.5 px-4 rounded-lg font-semibold text-sm uppercase tracking-wide',
                'bg-white text-red-600 border-2 border-red-600',
                'hover:bg-red-600 hover:text-white transition-all',
                'flex items-center justify-center gap-2'
              )}
            >
              <Trash2 className="w-4 h-4" />
              Delete
            </button>
          </div>
        </div>
      )}
    </Card>
  );
}
