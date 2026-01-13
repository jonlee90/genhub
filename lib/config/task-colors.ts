/**
 * Task Status and Priority Color Configuration
 *
 * SINGLE SOURCE OF TRUTH for all task-related colors across the application.
 * This ensures consistency between:
 * - Task cards in project pages
 * - Edit Task modal dropdowns
 * - Task list views
 * - Task detail pages
 *
 * Design System Colors:
 * - Primary: #001B51 (construction-blue)
 * - Accent: #3C3C3C
 * - Success: #059669
 * - Error: #DC2626
 * - Warning: #F59E0B
 */

import type { TaskStatus, TaskPriority } from '@/types/db/enums';

// ============================================
// STATUS CONFIGURATION
// ============================================

export interface StatusConfig {
  label: string;
  /** Badge color classes for outlined/light badges */
  badgeColor: string;
  /** Solid background for filled badges */
  solidColor: string;
  /** Dot indicator color */
  dotColor: string;
  /** Icon tint color */
  iconColor: string;
}

export const TASK_STATUS_CONFIG: Record<TaskStatus, StatusConfig> = {
  todo: {
    label: 'To Do',
    badgeColor: 'bg-gray-100 text-gray-700 border-gray-300',
    solidColor: 'bg-gray-500 text-white',
    dotColor: 'bg-gray-400',
    iconColor: 'text-gray-500',
  },
  in_progress: {
    label: 'In Progress',
    badgeColor: 'bg-blue-100 text-blue-700 border-blue-300',
    solidColor: 'bg-[#001B51] text-white',
    dotColor: 'bg-blue-500',
    iconColor: 'text-blue-600',
  },
  review: {
    label: 'Review',
    badgeColor: 'bg-amber-100 text-amber-700 border-amber-300',
    solidColor: 'bg-amber-500 text-white',
    dotColor: 'bg-amber-500',
    iconColor: 'text-amber-600',
  },
  blocked: {
    label: 'Blocked',
    badgeColor: 'bg-red-100 text-red-700 border-red-300',
    solidColor: 'bg-[#DC2626] text-white',
    dotColor: 'bg-red-500',
    iconColor: 'text-red-600',
  },
  completed: {
    label: 'Completed',
    badgeColor: 'bg-emerald-100 text-emerald-700 border-emerald-300',
    solidColor: 'bg-[#059669] text-white',
    dotColor: 'bg-emerald-500',
    iconColor: 'text-emerald-600',
  },
};

// ============================================
// PRIORITY CONFIGURATION
// ============================================

export interface PriorityConfig {
  label: string;
  /** Badge color classes (light background with colored text) */
  badgeColor: string;
  /** Dot indicator color */
  dotColor: string;
  /** Icon/accent color */
  accentColor: string;
}

export const TASK_PRIORITY_CONFIG: Record<TaskPriority, PriorityConfig> = {
  low: {
    label: 'Low',
    badgeColor: 'bg-[#059669]/10 text-[#059669] border-[#059669]/30',
    dotColor: 'bg-[#059669]',
    accentColor: 'text-[#059669]',
  },
  medium: {
    label: 'Medium',
    badgeColor: 'bg-[#F59E0B]/10 text-[#B45309] border-[#F59E0B]/30',
    dotColor: 'bg-[#F59E0B]',
    accentColor: 'text-[#B45309]',
  },
  high: {
    label: 'High',
    badgeColor: 'bg-[#DC2626]/10 text-[#DC2626] border-[#DC2626]/30',
    dotColor: 'bg-[#DC2626]',
    accentColor: 'text-[#DC2626]',
  },
  critical: {
    label: 'Critical',
    badgeColor: 'bg-purple-100 text-purple-700 border-purple-300',
    dotColor: 'bg-purple-500',
    accentColor: 'text-purple-600',
  },
};

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Get status configuration with fallback
 */
export function getStatusConfig(status: string): StatusConfig {
  return TASK_STATUS_CONFIG[status as TaskStatus] || TASK_STATUS_CONFIG.todo;
}

/**
 * Get priority configuration with fallback
 */
export function getPriorityConfig(priority: string): PriorityConfig {
  return TASK_PRIORITY_CONFIG[priority as TaskPriority] || TASK_PRIORITY_CONFIG.medium;
}

/**
 * Get status label
 */
export function getStatusLabel(status: string): string {
  return getStatusConfig(status).label;
}

/**
 * Get priority label
 */
export function getPriorityLabel(priority: string): string {
  return getPriorityConfig(priority).label;
}
