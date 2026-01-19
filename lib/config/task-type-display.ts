/**
 * Task Type Display Configuration
 *
 * Static icon mapping for task types.
 * Actual display configuration (colors, labels) comes from database task_type_configs.
 *
 * IMPORTANT: Components should fetch task types from the database using getTaskTypes()
 * action and use convertTaskTypeConfig() from TaskTypeSelector for display format.
 */

import {
  Hammer,
  ShoppingCart,
  ClipboardCheck,
  FileText,
  Wrench,
  HardHat,
  Ruler,
  Package,
  Clipboard,
  Pencil,
  CheckCircle2,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { TaskTypeConfigsRow } from '@/types/db/tables/tasks';

/**
 * Icon mapping for all available task type icons
 * Maps icon_name string from database to Lucide component
 */
export const TASK_TYPE_ICON_MAP: Record<string, LucideIcon> = {
  Hammer,
  ShoppingCart,
  ClipboardCheck,
  FileText,
  Wrench,
  HardHat,
  Ruler,
  Package,
  Clipboard,
  Pencil,
  CheckCircle2,
};

/**
 * Task type display configuration built from database config
 */
export interface TaskTypeDisplayConfig {
  label: string;
  icon: LucideIcon;
  color: string;
  description: string;
}

/**
 * Build task type display config from database row
 * Use this when you need display info from a database config
 */
export function buildTaskTypeDisplay(config: TaskTypeConfigsRow): TaskTypeDisplayConfig {
  return {
    label: config.name,
    icon: config.icon_name ? (TASK_TYPE_ICON_MAP[config.icon_name] || Hammer) : Hammer,
    color: config.color || '#3b82f6',
    description: config.description || '',
  };
}

/**
 * Get icon component from icon name
 */
export function getTaskTypeIcon(iconName: string | null | undefined): LucideIcon {
  if (!iconName) return Hammer;
  return TASK_TYPE_ICON_MAP[iconName] || Hammer;
}

/**
 * Fallback display config for task types based on enum value
 * Used when database configs are not available
 */
const TASK_TYPE_FALLBACK_CONFIG: Record<string, TaskTypeDisplayConfig> = {
  work: {
    label: 'Work',
    icon: Hammer,
    color: '#3b82f6',
    description: 'Labor/Work Task',
  },
  purchase: {
    label: 'Purchase',
    icon: ShoppingCart,
    color: '#10b981',
    description: 'Material Purchase',
  },
  approval: {
    label: 'Approval',
    icon: ClipboardCheck,
    color: '#f59e0b',
    description: 'Permit/Inspection',
  },
  admin: {
    label: 'Admin',
    icon: FileText,
    color: '#64748b',
    description: 'Administrative Task',
  },
};

/**
 * Get task type display config with fallback to 'work'
 * Uses static fallback values - does not require database configs
 */
export function getTaskTypeDisplayConfig(type: string | null | undefined): TaskTypeDisplayConfig {
  if (!type) return TASK_TYPE_FALLBACK_CONFIG.work;
  return TASK_TYPE_FALLBACK_CONFIG[type] || TASK_TYPE_FALLBACK_CONFIG.work;
}
