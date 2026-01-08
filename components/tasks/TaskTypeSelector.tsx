'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {  Hammer, ShoppingCart, ClipboardCheck, FileText, Check, Loader2, Wrench, Package, Users, HardHat, Truck, AlertTriangle } from 'lucide-react';
import { getTaskTypes } from '@/app/actions/task-types';
import type { Database } from '@/types/database.types';

type TaskType = Database['public']['Enums']['task_type'];
type TaskTypeConfig = Database['public']['Tables']['task_type_configs']['Row'];

// Debug: Icon mapping helper (Task 0040)
const ICON_MAP: Record<string, typeof Hammer> = {
  Hammer,
  ShoppingCart,
  ClipboardCheck,
  FileText,
  Wrench,
  Package,
  Users,
  HardHat,
  Truck,
  AlertTriangle,
};

// Debug: Default fallback task types (Task 0040)
const DEFAULT_TASK_TYPES: Array<{
  type: TaskType;
  label: string;
  description: string;
  icon: typeof Hammer;
  color: string;
  bgColor: string;
  borderColor: string;
}> = [
  {
    type: 'work',
    label: 'Work',
    description: 'Standard labor and construction tasks',
    icon: Hammer,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50 hover:bg-blue-100',
    borderColor: 'border-blue-200 data-[selected=true]:border-blue-500',
  },
  {
    type: 'purchase',
    label: 'Purchase',
    description: 'Materials, equipment, and supplies',
    icon: ShoppingCart,
    color: 'text-emerald-600',
    bgColor: 'bg-emerald-50 hover:bg-emerald-100',
    borderColor: 'border-emerald-200 data-[selected=true]:border-emerald-500',
  },
  {
    type: 'approval',
    label: 'Approval',
    description: 'Permits, sign-offs, and inspections',
    icon: ClipboardCheck,
    color: 'text-amber-600',
    bgColor: 'bg-amber-50 hover:bg-amber-100',
    borderColor: 'border-amber-200 data-[selected=true]:border-amber-500',
  },
  {
    type: 'admin',
    label: 'Admin',
    description: 'Administrative and overhead tasks',
    icon: FileText,
    color: 'text-slate-600',
    bgColor: 'bg-slate-50 hover:bg-slate-100',
    borderColor: 'border-slate-200 data-[selected=true]:border-slate-500',
  },
];

// Debug: Convert database config to display format (Task 0040)
function convertTaskTypeConfig(config: TaskTypeConfig) {
  const IconComponent = config.icon_name ? (ICON_MAP[config.icon_name] || Hammer) : Hammer;
  const color = config.color || '#001B51';

  return {
    type: 'general' as TaskType, // Placeholder - adjust based on your enum
    label: config.name,
    description: config.description || '',
    icon: IconComponent,
    color: `text-[${color}]`,
    bgColor: `bg-[${color}]/10 hover:bg-[${color}]/20`,
    borderColor: `border-[${color}]/30 data-[selected=true]:border-[${color}]`,
    hexColor: color,
  };
}

interface TaskTypeSelectorProps {
  selectedType: TaskType | null;
  onSelect: (type: TaskType) => void;
  disabled?: boolean;
}

export function TaskTypeSelector({
  selectedType,
  onSelect,
  disabled = false,
}: TaskTypeSelectorProps) {
  console.log('[TaskTypeSelector] Rendering with selectedType:', selectedType);

  // Debug: Fetch task types from database (Task 0040)
  const [taskTypes, setTaskTypes] = useState(DEFAULT_TASK_TYPES);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchTaskTypes = async () => {
      console.log('[TaskTypeSelector] Fetching task types from database...');
      setIsLoading(true);

      try {
        const result = await getTaskTypes();

        if (result.success && result.taskTypes && result.taskTypes.length > 0) {
          console.log('[TaskTypeSelector] Loaded', result.taskTypes.length, 'task types from database');
          // TODO: Map database types to display format - for now use defaults
          // const mappedTypes = result.taskTypes.map(convertTaskTypeConfig);
          // setTaskTypes(mappedTypes);
          setTaskTypes(DEFAULT_TASK_TYPES);
        } else {
          console.warn('[TaskTypeSelector] Using default task types - no database types found');
          setTaskTypes(DEFAULT_TASK_TYPES);
        }
      } catch (error) {
        console.error('[TaskTypeSelector] Error fetching task types, using defaults:', error);
        setTaskTypes(DEFAULT_TASK_TYPES);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTaskTypes();
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-construction-blue" />
        <span className="ml-2 text-sm text-gray-600">Loading task types...</span>
      </div>
    );
  }

  return (
    <div className="space-y-4">

      {/* Task Type Cards Grid */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4">
        {taskTypes.map((taskType, index) => {
          const Icon = taskType.icon;
          const isSelected = selectedType === taskType.type;

          return (
            <motion.button
              key={taskType.type}
              type="button"
              onClick={() => {
                console.log('[TaskTypeSelector] Selected type:', taskType.type);
                onSelect(taskType.type);
              }}
              disabled={disabled}
              data-selected={isSelected}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
              whileHover={{ scale: disabled ? 1 : 1.02 }}
              whileTap={{ scale: disabled ? 1 : 0.98 }}
              className={`
                relative flex flex-col items-center p-4 sm:p-5 rounded-xl border-2
                transition-all duration-200 cursor-pointer
                ${taskType.bgColor} ${taskType.borderColor}
                ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
                ${isSelected ? 'ring-2 ring-offset-2 shadow-md' : 'shadow-sm'}
                focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary
              `}
              style={{
                '--tw-ring-color': isSelected ?
                  taskType.type === 'work' ? '#3b82f6' :
                  taskType.type === 'purchase' ? '#10b981' :
                  taskType.type === 'approval' ? '#f59e0b' :
                  '#64748b' : undefined,
              } as React.CSSProperties}
            >
              {/* Selected Checkmark */}
              {isSelected && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className={`
                    absolute -top-2 -right-2 w-6 h-6 rounded-full
                    flex items-center justify-center shadow-md
                    ${taskType.type === 'work' ? 'bg-blue-500' :
                      taskType.type === 'purchase' ? 'bg-emerald-500' :
                      taskType.type === 'approval' ? 'bg-amber-500' :
                      'bg-slate-500'}
                  `}
                >
                  <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />
                </motion.div>
              )}

              {/* Icon Container */}
              <div className={`
                w-12 h-12 sm:w-14 sm:h-14 rounded-xl flex items-center justify-center mb-3
                ${taskType.type === 'work' ? 'bg-blue-100' :
                  taskType.type === 'purchase' ? 'bg-emerald-100' :
                  taskType.type === 'approval' ? 'bg-amber-100' :
                  'bg-slate-100'}
              `}>
                <Icon className={`w-6 h-6 sm:w-7 sm:h-7 ${taskType.color}`} />
              </div>

              {/* Label */}
              <span className={`
                font-semibold text-sm sm:text-base mb-1
                ${taskType.type === 'work' ? 'text-blue-700' :
                  taskType.type === 'purchase' ? 'text-emerald-700' :
                  taskType.type === 'approval' ? 'text-amber-700' :
                  'text-slate-700'}
              `}>
                {taskType.label}
              </span>

              {/* Description */}
              <span className="text-xs text-muted-foreground text-center leading-tight">
                {taskType.description}
              </span>
            </motion.button>
          );
        })}
      </div>

      {/* Hidden input for form submission */}
      <input
        type="hidden"
        name="task_type"
        value={selectedType || 'work'}
      />
    </div>
  );
}

// Helper function to get task type display info
export function getTaskTypeInfo(type: TaskType) {
  return DEFAULT_TASK_TYPES.find((t) => t.type === type) || DEFAULT_TASK_TYPES[0];
}

// Task Type Badge component for displaying type in lists/details
export function TaskTypeBadge({ type }: { type: TaskType }) {
  const info = getTaskTypeInfo(type);
  const Icon = info.icon;

  return (
    <span className={`
      inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium
      ${type === 'work' ? 'bg-blue-100 text-blue-700' :
        type === 'purchase' ? 'bg-emerald-100 text-emerald-700' :
        type === 'approval' ? 'bg-amber-100 text-amber-700' :
        'bg-slate-100 text-slate-700'}
    `}>
      <Icon className="w-3.5 h-3.5" />
      {info.label}
    </span>
  );
}
