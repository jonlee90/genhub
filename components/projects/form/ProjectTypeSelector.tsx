'use client';

/**
 * ProjectTypeSelector Component
 *
 * Project type selection step with:
 * - Grid layout (responsive)
 * - Interactive type cards
 * - Phase template preview (collapsible)
 * - Accessibility via role="radiogroup"
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronRight, Layers, Check, Home, UtensilsCrossed, Coffee, Building2, Factory } from 'lucide-react';
import { InteractiveTypeCard } from './InteractiveTypeCard';
import { cn } from '@/lib/utils';
import type { PhaseTemplatesRow } from '@/types/db/tables/projects';

type PhaseTemplate = PhaseTemplatesRow;

interface ProjectTypeSelectorProps {
  projectType: string;
  onProjectTypeChange: (value: string) => void;
  phaseTemplates: PhaseTemplate[];
  phaseTemplatesLoading: boolean;
  disabled?: boolean;
}

const PROJECT_TYPES = [
  {
    value: 'residential',
    label: 'Residential',
    icon: Home,
    description: 'Homes & apartments',
  },
  {
    value: 'restaurant',
    label: 'Restaurant',
    icon: UtensilsCrossed,
    description: 'Full-service dining',
  },
  {
    value: 'cafe',
    label: 'Cafe',
    icon: Coffee,
    description: 'Coffee & eateries',
  },
  {
    value: 'commercial_office',
    label: 'Commercial',
    icon: Building2,
    description: 'Office & retail',
  },
  {
    value: 'industrial',
    label: 'Industrial',
    icon: Factory,
    description: 'Warehouse & factory',
  },
];

export function ProjectTypeSelector({
  projectType,
  onProjectTypeChange,
  phaseTemplates,
  phaseTemplatesLoading: _phaseTemplatesLoading,
  disabled = false,
}: ProjectTypeSelectorProps) {
  const [showPhasePreview, setShowPhasePreview] = useState(false);

  return (
    <motion.div
      role="radiogroup"
      aria-label="Select project type"
      initial={{ opacity: 0, x: 16 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -16 }}
      transition={{ duration: 0.2 }}
    >
      {/* 5-card grid: 3 on top, 2 centered below on desktop; stacked on mobile */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {PROJECT_TYPES.map((type, index) => {
          return (
            <div
              key={type.value}
              className={cn(
                // Last 2 items centered when on 3-column grid
                index === 3 && 'sm:col-start-1',
                index === 4 && 'sm:col-start-2'
              )}
            >
              <InteractiveTypeCard
                value={type.value}
                label={type.label}
                description={type.description}
                icon={type.icon}
                isSelected={projectType === type.value}
                onSelect={onProjectTypeChange}
                disabled={disabled}
              />
            </div>
          );
        })}
      </div>

      {/* Phase Preview - Collapsible */}
      {phaseTemplates.length > 0 && (
        <div className="mt-5 pt-4 border-t border-gray-200">
          <button
            type="button"
            onClick={() => setShowPhasePreview(!showPhasePreview)}
            className="w-full flex items-center justify-between p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors active:scale-[0.99]"
          >
            <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
              <Layers className="w-4 h-4 text-[#001B51]" />
              <span>Project Phases</span>
              <span className="px-2 py-0.5 bg-[#001B51]/10 text-[#001B51] text-xs font-semibold rounded-full">
                {phaseTemplates.length}
              </span>
            </div>
            {showPhasePreview ? (
              <ChevronDown className="w-4 h-4 text-gray-500" />
            ) : (
              <ChevronRight className="w-4 h-4 text-gray-500" />
            )}
          </button>

          <AnimatePresence>
            {showPhasePreview && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <div className="pt-3 space-y-1.5">
                  {phaseTemplates.map((template, index) => (
                    <motion.div
                      key={template.id}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.03 }}
                      className="flex items-center gap-2.5 p-2.5 bg-white border border-gray-100 rounded-lg"
                    >
                      <div className="w-6 h-6 rounded bg-[#001B51]/10 text-[#001B51] flex items-center justify-center text-xs font-bold">
                        {index + 1}
                      </div>
                      <span className="text-sm font-medium text-gray-800 flex-1">
                        {template.name}
                      </span>
                      <Check className="w-4 h-4 text-[#059669]" />
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </motion.div>
  );
}
