'use client';

/**
 * ProjectTypeSelector Component
 *
 * Matches TaskTypeSelector design with:
 * - Color and styling from database settings
 * - Interactive selection cards with animations
 * - Phase template preview (collapsible)
 * - Accessibility via role="radiogroup"
 */

import { useMemo, useState, memo } from 'react';
import { m as motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronRight, Layers, Check, Building2 } from 'lucide-react';
import { PROJECT_TYPE_ICON_MAP } from '@/lib/config/project-type-display';
import { cn } from '@/lib/utils';
import { AlertTriangle } from 'lucide-react';
import type { PhaseTemplatesRow } from '@/types/db/tables/projects';
import type { ProjectTypeConfigsRow } from '@/types/db/tables/projects';

type PhaseTemplate = PhaseTemplatesRow;
type ProjectTypeConfig = ProjectTypeConfigsRow;

// Color to Tailwind mapping for hex colors (similar to TaskTypeSelector)
const COLOR_CLASSES: Record<string, { text: string; bg: string; border: string; ring: string; bgLight: string }> = {
  '#3b82f6': { text: 'text-blue-600', bg: 'bg-blue-50 hover:bg-blue-100', border: 'border-blue-200 data-[selected=true]:border-blue-500', ring: '#3b82f6', bgLight: 'bg-blue-100' },
  '#10b981': { text: 'text-emerald-600', bg: 'bg-emerald-50 hover:bg-emerald-100', border: 'border-emerald-200 data-[selected=true]:border-emerald-500', ring: '#10b981', bgLight: 'bg-emerald-100' },
  '#f59e0b': { text: 'text-amber-600', bg: 'bg-amber-50 hover:bg-amber-100', border: 'border-amber-200 data-[selected=true]:border-amber-500', ring: '#f59e0b', bgLight: 'bg-amber-100' },
  '#64748b': { text: 'text-slate-600', bg: 'bg-slate-50 hover:bg-slate-100', border: 'border-slate-200 data-[selected=true]:border-slate-500', ring: '#64748b', bgLight: 'bg-slate-100' },
  '#8b5cf6': { text: 'text-violet-600', bg: 'bg-violet-50 hover:bg-violet-100', border: 'border-violet-200 data-[selected=true]:border-violet-500', ring: '#8b5cf6', bgLight: 'bg-violet-100' },
  '#ec4899': { text: 'text-pink-600', bg: 'bg-pink-50 hover:bg-pink-100', border: 'border-pink-200 data-[selected=true]:border-pink-500', ring: '#ec4899', bgLight: 'bg-pink-100' },
  '#001B51': { text: 'text-blue-900', bg: 'bg-blue-900/5 hover:bg-blue-900/10', border: 'border-blue-200 data-[selected=true]:border-blue-600', ring: '#001B51', bgLight: 'bg-blue-900/10' },
};

// Default color when hex color not found
const DEFAULT_COLOR = '#001B51';
const DEFAULT_COLOR_CLASS = COLOR_CLASSES[DEFAULT_COLOR];

// Get Tailwind classes for a hex color, or mark as custom if not found
function getColorClasses(hexColor: string | null) {
  if (!hexColor) return DEFAULT_COLOR_CLASS;
  return COLOR_CLASSES[hexColor] || null;
}

// Get icon from icon map
function getIconComponent(iconName: string | null) {
  if (!iconName) return Building2;
  return PROJECT_TYPE_ICON_MAP[iconName] || Building2;
}

interface ProjectTypeSelectorProps {
  projectType: string;
  onProjectTypeChange: (value: string) => void;
  phaseTemplates: PhaseTemplate[];
  phaseTemplatesLoading: boolean;
  disabled?: boolean;
  /** Project types from database - required, no hardcoded fallback */
  projectTypes: ProjectTypeConfig[];
}

function ProjectTypeSelectorInner({
  projectType,
  onProjectTypeChange,
  phaseTemplates,
  phaseTemplatesLoading: _phaseTemplatesLoading,
  disabled = false,
  projectTypes,
}: ProjectTypeSelectorProps) {
  const [showPhasePreview, setShowPhasePreview] = useState(false);

  // Memoize the project types to display (database-driven, no fallback)
  const displayProjectTypes = useMemo(() => {
    if (!projectTypes || projectTypes.length === 0) {
      return [];
    }
    // Use fetched project types from database
    return projectTypes
      .filter(pt => pt.is_active)
      .sort((a, b) => (a.order_index || 0) - (b.order_index || 0))
      .map(pt => ({
        id: pt.id,
        name: pt.name,
        description: pt.description || '',
        icon_name: pt.icon_name,
        color: pt.color || DEFAULT_COLOR,
      }));
  }, [projectTypes]);

  // Show error state if no project types configured
  if (displayProjectTypes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center">
        <AlertTriangle className="h-8 w-8 text-amber-500 mb-2" />
        <p className="text-muted-foreground font-medium">No project types configured</p>
        <p className="text-sm text-muted-foreground">
          Contact your administrator to set up project types in Settings.
        </p>
      </div>
    );
  }

  return (
    <motion.div
      role="radiogroup"
      aria-label="Select project type"
      initial={{ opacity: 0, x: 16 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -16 }}
      transition={{ duration: 0.2 }}
    >
      {/* 2-column grid on mobile, 3 on desktop */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {displayProjectTypes.map((type, index) => {
          const Icon = getIconComponent(type.icon_name);
          const colorClasses = getColorClasses(type.color);
          const isCustomColor = !colorClasses;
          const isSelected = projectType === type.id;

          return (
            <motion.button
              key={type.id}
              type="button"
              onClick={() => onProjectTypeChange(type.id)}
              disabled={disabled}
              data-selected={isSelected}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
              whileHover={{ scale: disabled ? 1 : 1.02 }}
              whileTap={{ scale: disabled ? 1 : 0.98 }}
              className={cn(
                'relative flex flex-col items-center p-4 sm:p-5 rounded-xl border-2',
                'transition-all duration-200 cursor-pointer',
                !isCustomColor && colorClasses.bg,
                !isCustomColor && colorClasses.border,
                disabled ? 'opacity-50 cursor-not-allowed' : '',
                isSelected ? 'ring-2 ring-offset-2 shadow-md' : 'shadow-sm',
                'focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary'
              )}
              style={
                isCustomColor
                  ? ({
                      backgroundColor: `${type.color}15`,
                      borderColor: type.color,
                      '--tw-ring-color': type.color,
                    } as React.CSSProperties)
                  : ({
                      '--tw-ring-color': isSelected ? colorClasses.ring : undefined,
                    } as React.CSSProperties)
              }
            >
              {/* Selected Checkmark */}
              {isSelected && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  style={{ backgroundColor: type.color || DEFAULT_COLOR }}
                  className="absolute -top-2 -right-2 w-6 h-6 rounded-full flex items-center justify-center shadow-md"
                >
                  <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />
                </motion.div>
              )}

              {/* Icon Container */}
              <div
                className={cn('w-12 h-12 sm:w-14 sm:h-14 rounded-xl flex items-center justify-center mb-3', !isCustomColor && colorClasses.bgLight)}
                style={isCustomColor ? { backgroundColor: `${type.color}25` } : undefined}
              >
                <Icon
                  className={cn('w-6 h-6 sm:w-7 sm:h-7', !isCustomColor && colorClasses.text)}
                  style={isCustomColor ? { color: type.color } : undefined}
                />
              </div>

              {/* Label */}
              <span
                className={cn('font-semibold text-sm sm:text-base mb-1', !isCustomColor && colorClasses.text)}
                style={isCustomColor ? { color: type.color } : undefined}
              >
                {type.name}
              </span>

              {/* Description */}
              <span className="text-xs text-muted-foreground text-center leading-tight">
                {type.description}
              </span>
            </motion.button>
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

// Memoized ProjectTypeSelector to prevent unnecessary re-renders
export const ProjectTypeSelector = memo(ProjectTypeSelectorInner);
