/**
 * Project Card Theme System
 * Defines color themes and configurations for different project types
 * Used by ProjectCard component to render type-specific styling
 */

import { Home, Factory, UtensilsCrossed, Building2, type LucideIcon } from 'lucide-react';

export interface ProjectTypeTheme {
  icon: LucideIcon;
  label: string;
  labelFull: string;
  headerBg: string;
  headerText: string;
  iconBg: string;
  accentColor: string;
  borderAccent: string;
  placeholderGradient: string;
}

export const PROJECT_TYPE_THEMES: Record<string, ProjectTypeTheme> = {
  residential: {
    icon: Home,
    label: 'Residential',
    labelFull: 'Residential Home',
    headerBg: 'bg-construction-blue',
    headerText: 'text-white',
    iconBg: 'bg-white/10',
    accentColor: 'text-blue-200',
    borderAccent: 'border-t-construction-blue',
    placeholderGradient: 'from-blue-600 to-blue-800',
  },
  industrial: {
    icon: Factory,
    label: 'Industrial',
    labelFull: 'Industrial Warehouse',
    headerBg: 'bg-construction-accent',
    headerText: 'text-white',
    iconBg: 'bg-yellow-400/20',
    accentColor: 'text-yellow-400',
    borderAccent: 'border-t-construction-accent',
    placeholderGradient: 'from-gray-600 to-gray-800',
  },
  restaurant_cafe: {
    icon: UtensilsCrossed,
    label: 'Cafe',
    labelFull: 'Restaurant / Cafe',
    headerBg: 'bg-teal-600',
    headerText: 'text-white',
    iconBg: 'bg-white/10',
    accentColor: 'text-teal-200',
    borderAccent: 'border-t-teal-600',
    placeholderGradient: 'from-teal-600 to-teal-800',
  },
  commercial_office: {
    icon: Building2,
    label: 'Commercial',
    labelFull: 'Commercial Office',
    headerBg: 'bg-slate-800',
    headerText: 'text-white',
    iconBg: 'bg-cyan-400/20',
    accentColor: 'text-cyan-400',
    borderAccent: 'border-t-slate-800',
    placeholderGradient: 'from-slate-700 to-slate-900',
  },
} as const;

/**
 * Get theme for a project type, with fallback to residential
 */
export function getProjectTheme(projectType: string): ProjectTypeTheme {
  return PROJECT_TYPE_THEMES[projectType] || PROJECT_TYPE_THEMES.residential;
}

/**
 * Status configuration for project status badges
 */
export const PROJECT_STATUS_CONFIG = {
  active: {
    label: 'Active',
    bgColor: 'bg-construction-green/10',
    dotColor: 'bg-construction-green',
    textColor: 'text-construction-green',
    borderColor: 'border-construction-green',
  },
  on_hold: {
    label: 'On Hold',
    bgColor: 'bg-yellow-100',
    dotColor: 'bg-yellow-500',
    textColor: 'text-yellow-700',
    borderColor: 'border-yellow-400',
  },
  completed: {
    label: 'Completed',
    bgColor: 'bg-construction-blue/10',
    dotColor: 'bg-construction-blue',
    textColor: 'text-construction-blue',
    borderColor: 'border-construction-blue',
  },
  archived: {
    label: 'Archived',
    bgColor: 'bg-gray-100',
    dotColor: 'bg-gray-400',
    textColor: 'text-gray-500',
    borderColor: 'border-gray-400',
  },
} as const;

export type ProjectStatus = keyof typeof PROJECT_STATUS_CONFIG;
