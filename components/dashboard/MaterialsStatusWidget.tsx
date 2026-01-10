'use client';

import { Package, Truck, CheckCircle, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import type { MaterialsStatusData } from '@/types/dashboard';

export interface MaterialsStatusWidgetProps {
  materials: MaterialsStatusData;
  isLoading?: boolean;
}

function MaterialsStatusWidgetSkeleton() {
  return (
    <div className="bg-white border-2 border-gray-200 rounded-lg p-4 md:p-5 animate-pulse">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 md:mb-6">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gray-200 rounded-lg" />
          <div className="h-4 w-32 bg-gray-200 rounded" />
        </div>
        <div className="h-4 w-16 bg-gray-200 rounded" />
      </div>

      {/* Pipeline */}
      <div className="flex items-center justify-between gap-2 md:gap-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex-1 flex flex-col items-center">
            <div className="w-10 h-10 md:w-12 md:h-12 bg-gray-200 rounded-full mb-2" />
            <div className="h-6 w-8 bg-gray-200 rounded mb-1" />
            <div className="h-3 w-16 bg-gray-200 rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}

interface PipelineStageProps {
  icon: typeof Package;
  label: string;
  count: number;
  variant: 'needed' | 'ordered' | 'delivered';
}

const stageStyles = {
  needed: {
    bg: 'bg-[#F59E0B]/10',
    border: 'border-[#F59E0B]/30',
    iconColor: 'text-[#F59E0B]',
    countColor: 'text-[#F59E0B]',
  },
  ordered: {
    bg: 'bg-[#001B51]/10',
    border: 'border-[#001B51]/30',
    iconColor: 'text-[#001B51]',
    countColor: 'text-[#001B51]',
  },
  delivered: {
    bg: 'bg-[#059669]/10',
    border: 'border-[#059669]/30',
    iconColor: 'text-[#059669]',
    countColor: 'text-[#059669]',
  },
} as const;

function PipelineStage({ icon: Icon, label, count, variant }: PipelineStageProps) {
  const styles = stageStyles[variant];

  return (
    <div className="flex flex-col items-center">
      <motion.div
        className={cn(
          'w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center',
          'border-2',
          styles.bg,
          styles.border
        )}
        whileHover={{ scale: 1.1 }}
        transition={{ type: 'spring', stiffness: 400, damping: 25 }}
      >
        <Icon className={cn('w-5 h-5 md:w-6 md:h-6', styles.iconColor)} />
      </motion.div>
      <div className={cn('text-xl md:text-2xl font-black mt-2', styles.countColor)}>
        {count}
      </div>
      <div className="text-[10px] md:text-xs text-gray-500 font-medium uppercase tracking-wide">
        {label}
      </div>
    </div>
  );
}

function PipelineArrow() {
  return (
    <div className="flex-shrink-0 flex items-center justify-center px-1 md:px-2">
      <ChevronRight className="w-5 h-5 md:w-6 md:h-6 text-gray-300" />
    </div>
  );
}

export function MaterialsStatusWidget({
  materials,
  isLoading = false,
}: MaterialsStatusWidgetProps) {
  console.log('[MaterialsStatusWidget] Rendering:', { materials, isLoading });

  if (isLoading) {
    return <MaterialsStatusWidgetSkeleton />;
  }

  return (
    <Link href="/app/materials" className="block">
      <motion.div
        className={cn(
          'bg-white border-2 border-gray-200 rounded-lg p-4 md:p-5',
          'hover:border-[#001B51]/30 transition-colors cursor-pointer'
        )}
        whileHover={{
          scale: 1.01,
          boxShadow: '0 4px 12px rgba(0, 27, 81, 0.1)',
        }}
        whileTap={{ scale: 0.99 }}
        transition={{ type: 'spring', stiffness: 400, damping: 25 }}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-4 md:mb-6">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-[#001B51]/10 rounded-lg border border-[#001B51]/20">
              <Package className="w-4 h-4 text-[#001B51]" />
            </div>
            <span className="text-sm md:text-base font-semibold text-gray-900">
              Materials Pipeline
            </span>
          </div>
          <span className="text-xs text-gray-500">
            {materials.total} total
          </span>
        </div>

        {/* Pipeline Visualization */}
        <div className="flex items-center justify-center">
          <PipelineStage
            icon={Package}
            label="Needed"
            count={materials.needed}
            variant="needed"
          />
          <PipelineArrow />
          <PipelineStage
            icon={Truck}
            label="Ordered"
            count={materials.ordered}
            variant="ordered"
          />
          <PipelineArrow />
          <PipelineStage
            icon={CheckCircle}
            label="Delivered"
            count={materials.delivered}
            variant="delivered"
          />
        </div>

        {/* View All indicator */}
        <div className="flex items-center justify-center mt-4 text-xs text-[#001B51] font-medium">
          <span>View all materials</span>
          <ChevronRight className="w-4 h-4 ml-1" />
        </div>
      </motion.div>
    </Link>
  );
}
