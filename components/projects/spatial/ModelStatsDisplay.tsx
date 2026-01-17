'use client';

// Performance optimization: Direct imports instead of barrel file (saves 200-800ms per page)
import Box from 'lucide-react/icons/box';
import Triangle from 'lucide-react/icons/triangle';
import HardDrive from 'lucide-react/icons/hard-drive';
import Layers from 'lucide-react/icons/layers';
import CheckCircle2 from 'lucide-react/icons/check-circle-2';
import Clock from 'lucide-react/icons/clock';;
import { cn } from '@/lib/utils';
import { InfoCard, InfoCardField } from '../InfoCard';
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

  const getStatusBadge = (status: ModelStats['processingStatus']) => {
    if (!status) return null;
    return (
      <Badge className={cn('text-xs font-semibold px-2 py-1', getStatusColor(status))}>
        <CheckCircle2 className="w-3 h-3 mr-1" />
        {status}
      </Badge>
    );
  };

  // Build fields for InfoCard
  const fields: InfoCardField[] = [
    {
      label: 'Objects',
      value: formatNumber(stats.objectCount),
      icon: Box,
    },
    {
      label: 'Triangles',
      value: formatNumber(stats.triangleCount),
      icon: Triangle,
    },
    {
      label: 'Vertices',
      value: formatNumber(stats.vertexCount),
      icon: Layers,
    },
    {
      label: 'File Size',
      value: formatFileSize(stats.fileSize),
      icon: HardDrive,
    },
    {
      label: 'Load Time',
      value: formatLoadTime(stats.loadTime),
      icon: Clock,
    },
  ];

  // Footer with status badge and real-time indicator
  const footerContent = (
    <div className="col-span-full mt-4 pt-4 border-t-2 border-gray-100">
      <div className="flex items-center justify-between">
        <div className="text-[10px] font-mono text-gray-400 uppercase tracking-wider">
          Real-time metrics
        </div>
        <div className="flex items-center gap-3">
          {stats.processingStatus && getStatusBadge(stats.processingStatus)}
          <div className="flex items-center gap-1">
            <div className="w-1.5 h-1.5 rounded-full bg-[#059669] animate-pulse" />
            <span className="text-[10px] font-mono text-gray-400">LIVE</span>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <InfoCard
      headerIcon={Box}
      headerTitle="Model Stats"
      headerDescription="Real-time 3D model metrics"
      fields={fields}
      columns={3}
      footerContent={footerContent}
      className={className}
    />
  );
}
