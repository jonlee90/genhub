'use client';

import { Box, Triangle, HardDrive, Layers, CheckCircle2, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export interface ModelStats {
  objectCount?: number;
  triangleCount?: number;
  vertexCount?: number;
  fileSize?: number;
  processingStatus?: 'pending' | 'processing' | 'ready' | 'failed';
  loadTime?: number;
}

export interface ModelStatsDisplayProps {
  stats: ModelStats;
  className?: string;
}

export function ModelStatsDisplay({ stats, className }: ModelStatsDisplayProps) {
  console.log('[ModelStatsDisplay] Rendering', { stats });

  const formatNumber = (num: number | undefined): string => {
    if (!num) return '—';
    if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`;
    if (num >= 1_000) return `${(num / 1_000).toFixed(1)}K`;
    return num.toString();
  };

  const formatFileSize = (bytes: number | undefined): string => {
    if (!bytes) return '—';
    if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    return `${(bytes / 1024).toFixed(1)} KB`;
  };

  const formatLoadTime = (ms: number | undefined): string => {
    if (!ms) return '—';
    if (ms >= 1000) return `${(ms / 1000).toFixed(1)}s`;
    return `${ms}ms`;
  };

  const getStatusColor = (status: ModelStats['processingStatus']) => {
    switch (status) {
      case 'ready':
        return 'bg-[#059669] text-white';
      case 'processing':
        return 'bg-[#FBBF24] text-gray-900';
      case 'failed':
        return 'bg-[#DC2626] text-white';
      case 'pending':
        return 'bg-gray-400 text-white';
      default:
        return 'bg-gray-300 text-gray-700';
    }
  };

  const statItems = [
    {
      icon: Box,
      label: 'Objects',
      value: formatNumber(stats.objectCount),
      color: 'text-blue-600',
    },
    {
      icon: Triangle,
      label: 'Triangles',
      value: formatNumber(stats.triangleCount),
      color: 'text-purple-600',
    },
    {
      icon: Layers,
      label: 'Vertices',
      value: formatNumber(stats.vertexCount),
      color: 'text-green-600',
    },
    {
      icon: HardDrive,
      label: 'File Size',
      value: formatFileSize(stats.fileSize),
      color: 'text-orange-600',
    },
    {
      icon: Clock,
      label: 'Load Time',
      value: formatLoadTime(stats.loadTime),
      color: 'text-teal-600',
    },
  ];

  return (
    <Card
      className={cn(
        'border-2 border-gray-200 shadow-construction overflow-hidden',
        'bg-white',
        className
      )}
    >
      {/* Technical header strip */}
      <div className="h-1 bg-gradient-to-r from-[#001B51] via-[#3C3C3C] to-[#001B51]" />

      <div className="p-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-[#001B51] rounded">
              <Box className="w-4 h-4 text-white" />
            </div>
            <h3 className="font-bold text-gray-900 uppercase tracking-tight text-sm">
              Model Stats
            </h3>
          </div>

          {stats.processingStatus && (
            <Badge className={cn('text-xs font-semibold px-2 py-1', getStatusColor(stats.processingStatus))}>
              <CheckCircle2 className="w-3 h-3 mr-1" />
              {stats.processingStatus}
            </Badge>
          )}
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {statItems.map(({ icon: Icon, label, value, color }) => (
            <div
              key={label}
              className={cn(
                'relative p-3 rounded-lg border-2 border-gray-200',
                'bg-gray-50/50 hover:bg-gray-100/50 transition-colors',
                'group'
              )}
            >
              {/* Technical corner accent */}
              <div className="absolute top-0 right-0 w-6 h-6">
                <div className="absolute top-0 right-0 w-2 h-2 border-t-2 border-r-2 border-[#001B51] opacity-20" />
              </div>

              <div className="flex items-start gap-2 mb-2">
                <Icon className={cn('w-4 h-4 flex-shrink-0 mt-0.5', color)} />
                <span className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold">
                  {label}
                </span>
              </div>

              <p className={cn('font-bold text-lg font-mono text-gray-900 group-hover:text-[#001B51] transition-colors')}>
                {value}
              </p>
            </div>
          ))}
        </div>

        {/* Technical annotation footer */}
        <div className="mt-4 pt-4 border-t-2 border-gray-100 flex items-center justify-between">
          <div className="text-[10px] font-mono text-gray-400 uppercase tracking-wider">
            Real-time metrics
          </div>
          <div className="flex items-center gap-1">
            <div className="w-1.5 h-1.5 rounded-full bg-[#059669] animate-pulse" />
            <span className="text-[10px] font-mono text-gray-400">LIVE</span>
          </div>
        </div>
      </div>
    </Card>
  );
}
