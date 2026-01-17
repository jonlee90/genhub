'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
// Performance optimization: Direct imports instead of barrel file (saves 200-800ms per page)
import ChevronDown from 'lucide-react/icons/chevron-down';
import Layers from 'lucide-react/icons/layers';
import Check from 'lucide-react/icons/check';;
import { cn } from '@/lib/utils';

interface Phase {
  id: string;
  name: string;
  order_index?: number;
  status?: string;
  color?: string;
}

interface PhaseFilterProps {
  phases: Phase[];
  selectedPhaseId: string | null;
  onPhaseChange: (phaseId: string | null) => void;
  markerCountsByPhase?: Record<string, number>;
  className?: string;
}

// Debug: Phase color mapping for visual distinction
const PHASE_COLORS: Record<string, string> = {
  'initiation': 'bg-blue-500',
  'planning': 'bg-purple-500',
  'execution': 'bg-orange-500',
  'monitoring': 'bg-green-500',
  'closeout': 'bg-gray-500',
};

const getPhaseColor = (phaseName: string, index: number): string => {
  const nameLower = phaseName.toLowerCase();
  for (const [key, color] of Object.entries(PHASE_COLORS)) {
    if (nameLower.includes(key)) return color;
  }

  // Fallback: Cycle through construction theme colors
  const colors = [
    'bg-[#001B51]', // Navy
    'bg-[#3C3C3C]', // Dark gray
    'bg-[#059669]', // Green
    'bg-[#FFB627]', // Amber
    'bg-[#DC2626]', // Red
  ];
  return colors[index % colors.length];
};

export function PhaseFilter({
  phases,
  selectedPhaseId,
  onPhaseChange,
  markerCountsByPhase = {},
  className,
}: PhaseFilterProps) {
  const [isOpen, setIsOpen] = useState(false);

  console.log('[PhaseFilter] Rendering with phases:', phases.length, 'Selected:', selectedPhaseId);

  // Debug: Sort phases by order_index
  const sortedPhases = [...phases].sort((a, b) => {
    const orderA = a.order_index ?? Number.MAX_SAFE_INTEGER;
    const orderB = b.order_index ?? Number.MAX_SAFE_INTEGER;
    return orderA - orderB;
  });

  // Debug: Calculate total markers
  const totalMarkers = Object.values(markerCountsByPhase).reduce((sum, count) => sum + count, 0);
  const unassignedMarkers = markerCountsByPhase['unassigned'] || 0;

  // Debug: Get selected phase
  const selectedPhase = selectedPhaseId ? sortedPhases.find(p => p.id === selectedPhaseId) : null;

  const handleSelect = (phaseId: string | null) => {
    console.log('[PhaseFilter] Phase selected:', phaseId);
    onPhaseChange(phaseId);
    setIsOpen(false);
  };

  return (
    <div className={cn('relative', className)}>
      {/* Debug: Trigger button with industrial design */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'w-full sm:w-auto min-w-[240px]',
          'flex items-center justify-between gap-3',
          'px-4 py-2.5 rounded-lg',
          'bg-white border-2 border-gray-200',
          'hover:border-construction-blue hover:shadow-construction',
          'transition-all duration-200',
          'group'
        )}
      >
        <div className="flex items-center gap-2.5 flex-1 min-w-0">
          <div className="p-1.5 bg-construction-blue/10 rounded border border-construction-blue/20">
            <Layers className="h-4 w-4 text-construction-blue" />
          </div>
          <div className="flex-1 min-w-0 text-left">
            <div className="text-[10px] font-mono uppercase tracking-wider text-gray-500">
              Filter by Phase
            </div>
            <div className="text-sm font-bold text-gray-900 truncate">
              {selectedPhase ? selectedPhase.name : 'All Phases'}
            </div>
          </div>
          {selectedPhaseId && (
            <div className="px-2 py-0.5 bg-construction-blue/10 rounded text-xs font-mono font-bold text-construction-blue">
              {markerCountsByPhase[selectedPhaseId] || 0}
            </div>
          )}
        </div>
        <ChevronDown
          className={cn(
            'h-4 w-4 text-gray-500 transition-transform duration-200',
            isOpen && 'rotate-180'
          )}
        />
      </button>

      {/* Debug: Dropdown menu with blueprint-inspired design */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <div
              className="fixed inset-0 z-40"
              onClick={() => setIsOpen(false)}
            />

            {/* Dropdown */}
            <motion.div
              initial={{ opacity: 0, y: -8, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.96 }}
              transition={{ duration: 0.15 }}
              className={cn(
                'absolute top-full left-0 right-0 mt-2 z-50',
                'w-full sm:min-w-[320px]',
                'bg-white rounded-lg shadow-2xl',
                'border-2 border-gray-200',
                'overflow-hidden'
              )}
            >
              {/* Header */}
              <div className="px-4 py-3 bg-gradient-to-r from-gray-50 to-white border-b-2 border-gray-100">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-mono uppercase tracking-wider text-gray-600">
                    Phase Filter
                  </div>
                  <div className="text-xs font-mono text-gray-500">
                    {totalMarkers} markers
                  </div>
                </div>
              </div>

              {/* Options */}
              <div className="max-h-[360px] overflow-y-auto">
                {/* All Phases Option */}
                <button
                  onClick={() => handleSelect(null)}
                  className={cn(
                    'w-full px-4 py-3 flex items-center gap-3',
                    'hover:bg-construction-blue/5 transition-colors',
                    'border-b border-gray-100',
                    'group'
                  )}
                >
                  <div className="flex-1 flex items-center gap-3">
                    <div className={cn(
                      'w-1 h-8 rounded-full',
                      'bg-gradient-to-b from-construction-blue to-construction-blue/60'
                    )} />
                    <div className="flex-1 text-left">
                      <div className="text-sm font-bold text-gray-900">
                        All Phases
                      </div>
                      <div className="text-xs text-gray-500 font-mono">
                        Show all markers
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="px-2 py-0.5 bg-gray-100 rounded text-xs font-mono font-bold text-gray-600">
                      {totalMarkers}
                    </div>
                    {selectedPhaseId === null && (
                      <div className="w-5 h-5 rounded-full bg-construction-blue flex items-center justify-center">
                        <Check className="h-3 w-3 text-white" strokeWidth={3} />
                      </div>
                    )}
                  </div>
                </button>

                {/* Unassigned Option */}
                {unassignedMarkers > 0 && (
                  <button
                    onClick={() => handleSelect('unassigned')}
                    className={cn(
                      'w-full px-4 py-3 flex items-center gap-3',
                      'hover:bg-construction-blue/5 transition-colors',
                      'border-b border-gray-100',
                      'group'
                    )}
                  >
                    <div className="flex-1 flex items-center gap-3">
                      <div className="w-1 h-8 rounded-full bg-gray-300" />
                      <div className="flex-1 text-left">
                        <div className="text-sm font-bold text-gray-900">
                          Unassigned
                        </div>
                        <div className="text-xs text-gray-500 font-mono">
                          No phase assigned
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="px-2 py-0.5 bg-gray-100 rounded text-xs font-mono font-bold text-gray-600">
                        {unassignedMarkers}
                      </div>
                      {selectedPhaseId === 'unassigned' && (
                        <div className="w-5 h-5 rounded-full bg-construction-blue flex items-center justify-center">
                          <Check className="h-3 w-3 text-white" strokeWidth={3} />
                        </div>
                      )}
                    </div>
                  </button>
                )}

                {/* Phase Options */}
                {sortedPhases.map((phase, index) => {
                  const markerCount = markerCountsByPhase[phase.id] || 0;
                  const phaseColor = getPhaseColor(phase.name, index);
                  const isSelected = selectedPhaseId === phase.id;

                  return (
                    <button
                      key={phase.id}
                      onClick={() => handleSelect(phase.id)}
                      className={cn(
                        'w-full px-4 py-3 flex items-center gap-3',
                        'hover:bg-construction-blue/5 transition-colors',
                        'border-b border-gray-100 last:border-b-0',
                        'group'
                      )}
                    >
                      <div className="flex-1 flex items-center gap-3">
                        {/* Color indicator */}
                        <div className={cn('w-1 h-8 rounded-full', phaseColor)} />

                        {/* Phase info */}
                        <div className="flex-1 text-left">
                          <div className="text-sm font-bold text-gray-900">
                            {phase.name}
                          </div>
                          <div className="text-xs text-gray-500 font-mono">
                            Phase {(phase.order_index || 0) + 1}
                            {phase.status && ` • ${phase.status}`}
                          </div>
                        </div>
                      </div>

                      {/* Marker count and selected indicator */}
                      <div className="flex items-center gap-2">
                        <div className="px-2 py-0.5 bg-gray-100 rounded text-xs font-mono font-bold text-gray-600">
                          {markerCount}
                        </div>
                        {isSelected && (
                          <div className="w-5 h-5 rounded-full bg-construction-blue flex items-center justify-center">
                            <Check className="h-3 w-3 text-white" strokeWidth={3} />
                          </div>
                        )}
                      </div>
                    </button>
                  );
                })}

                {/* Empty state */}
                {sortedPhases.length === 0 && (
                  <div className="px-4 py-8 text-center text-sm text-gray-500">
                    No phases defined for this project
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
