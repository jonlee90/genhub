/**
 * Task Type Display Configuration
 *
 * UI display settings for task types (icons, colors, labels).
 * Separate from task-type-fields.ts which handles form field visibility.
 *
 * IMPORTANT: Components should prefer fetching task types from the database
 * using getTaskTypes() action and mapping via convertTaskTypeConfig().
 * These constants are used as fallbacks and for backward compatibility.
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
import type { TaskType } from '@/types/db/enums';

/**
 * Icon mapping for all available task type icons
 * Used when converting database task type configs to display format
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
 * Task type display configuration
 */
export interface TaskTypeDisplayConfig {
  label: string;
  icon: LucideIcon;
  color: string;
  description: string;
}

/**
 * Task type display configuration for UI components
 * Used in TaskCard, TaskTypeBadge, and other display components
 */
export const TASK_TYPE_DISPLAY_CONFIG: Record<TaskType, TaskTypeDisplayConfig> = {
  work: {
    label: 'Work',
    icon: Hammer,
    color: 'bg-construction-blue text-white',
    description: 'Labor/Work Task',
  },
  purchase: {
    label: 'Purchase',
    icon: ShoppingCart,
    color: 'bg-[#059669] text-white',
    description: 'Material Purchase',
  },
  approval: {
    label: 'Approval',
    icon: ClipboardCheck,
    color: 'bg-[#FFB627] text-white',
    description: 'Permit/Inspection',
  },
  admin: {
    label: 'Admin',
    icon: FileText,
    color: 'bg-construction-accent text-white',
    description: 'Administrative Task',
  },
};

/**
 * Get task type display config with fallback to 'work'
 */
export function getTaskTypeDisplayConfig(type: TaskType | null | undefined): TaskTypeDisplayConfig {
  return type && TASK_TYPE_DISPLAY_CONFIG[type]
    ? TASK_TYPE_DISPLAY_CONFIG[type]
    : TASK_TYPE_DISPLAY_CONFIG.work;
}
