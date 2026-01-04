/**
 * Project Card Theme System
 * Defines color themes and configurations for different project types
 * Used by ProjectCard component to render type-specific styling
 *
 * Updated: All cards now use consistent construction-blue headers
 * Color differentiation moved to project type icons only
 */

import { Home, Factory, UtensilsCrossed, Coffee, Building2, type LucideIcon } from 'lucide-react';

export interface ProjectTypeTheme {
  icon: LucideIcon;
  label: string;
  labelFull: string;
  headerBg: string;        // All cards use same header background
  headerText: string;      // All cards use same header text color
  iconBg: string;          // Icon background with project-specific color
  iconColor: string;       // Icon color (project-specific)
  accentColor: string;     // Accent text color
  borderAccent: string;    // Border accent (subtle)
  placeholderGradient: string; // Placeholder gradient (neutral)
}

export const PROJECT_TYPE_THEMES: Record<string, ProjectTypeTheme> = {
  residential: {
    icon: Home,
    label: 'Residential',
    labelFull: 'Residential Home',
    headerBg: 'bg-[#001B51]',           // Construction blue (consistent)
    headerText: 'text-white',            // White text (consistent)
    iconBg: 'bg-[#001B51]/10',          // Blue tint background
    iconColor: 'text-[#001B51]',         // Blue icon
    accentColor: 'text-blue-200',
    borderAccent: 'border-t-[#001B51]',
    placeholderGradient: 'from-gray-100 to-gray-200',
  },
  industrial: {
    icon: Factory,
    label: 'Industrial',
    labelFull: 'Industrial Warehouse',
    headerBg: 'bg-[#001B51]',           // Construction blue (consistent)
    headerText: 'text-white',            // White text (consistent)
    iconBg: 'bg-[#001B51]/10',          // Blue tint background
    iconColor: 'text-[#001B51]',         // Blue icon
    accentColor: 'text-blue-200',
    borderAccent: 'border-t-[#001B51]',
    placeholderGradient: 'from-gray-100 to-gray-200',
  },
  restaurant: {
    icon: UtensilsCrossed,
    label: 'Restaurant',
    labelFull: 'Restaurant',
    headerBg: 'bg-[#001B51]',           // Construction blue (consistent)
    headerText: 'text-white',            // White text (consistent)
    iconBg: 'bg-[#001B51]/10',          // Blue tint background
    iconColor: 'text-[#001B51]',         // Blue icon
    accentColor: 'text-blue-200',
    borderAccent: 'border-t-[#001B51]',
    placeholderGradient: 'from-gray-100 to-gray-200',
  },
  cafe: {
    icon: Coffee,
    label: 'Cafe',
    labelFull: 'Cafe',
    headerBg: 'bg-[#001B51]',           // Construction blue (consistent)
    headerText: 'text-white',            // White text (consistent)
    iconBg: 'bg-[#001B51]/10',          // Blue tint background
    iconColor: 'text-[#001B51]',         // Blue icon
    accentColor: 'text-blue-200',
    borderAccent: 'border-t-[#001B51]',
    placeholderGradient: 'from-gray-100 to-gray-200',
  },
  commercial_office: {
    icon: Building2,
    label: 'Commercial',
    labelFull: 'Commercial Office',
    headerBg: 'bg-[#001B51]',           // Construction blue (consistent)
    headerText: 'text-white',            // White text (consistent)
    iconBg: 'bg-[#001B51]/10',          // Blue tint background
    iconColor: 'text-[#001B51]',         // Blue icon
    accentColor: 'text-blue-200',
    borderAccent: 'border-t-[#001B51]',
    placeholderGradient: 'from-gray-100 to-gray-200',
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
