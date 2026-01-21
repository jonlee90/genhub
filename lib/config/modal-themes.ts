/**
 * Modal Theme Configuration
 * Construction-themed color palettes for BaseModal components
 * Inspired by industrial safety colors and construction site aesthetics
 */

export interface ModalTheme {
  primary: string;
  primaryHover: string;
  primaryLight: string;
  accent: string;
  accentHover: string;
  accentLight: string;
  ring: string;
  badge: string;
  badgeText: string;
  gradientFrom: string;
  gradientTo: string;
  iconBg: string;
  iconGradientFrom: string;
  iconGradientTo: string;
}

// Type for theme names available in MODAL_THEMES
export type ModalThemeName = 'default' | 'low' | 'medium' | 'high' | 'danger' | 'warning' | 'success' | 'info' | 'purchase' | string;

export const MODAL_THEMES: Record<string, ModalTheme> = {
  // Default: Construction Navy Blue - Professional, trustworthy
  default: {
    primary: 'var(--construction-blue)',
    primaryHover: '#002163',
    primaryLight: '#003087',
    accent: '#3C3C3C',
    accentHover: '#525252',
    accentLight: '#7A7A7A',
    ring: 'rgba(0, 27, 81, 0.5)',
    badge: '#E8EEF7',
    badgeText: 'var(--construction-blue)',
    gradientFrom: 'var(--construction-blue)',
    gradientTo: '#003087',
    iconBg: '#F0F4FC',
    iconGradientFrom: 'var(--construction-blue)',
    iconGradientTo: '#003D99',
  },

  // Low Priority: Safety Green - All clear, go ahead
  low: {
    primary: '#059669',
    primaryHover: '#047857',
    primaryLight: '#10B981',
    accent: '#065F46',
    accentHover: '#047857',
    accentLight: '#059669',
    ring: 'rgba(5, 150, 105, 0.5)',
    badge: '#D1FAE5',
    badgeText: '#065F46',
    gradientFrom: '#059669',
    gradientTo: '#10B981',
    iconBg: '#ECFDF5',
    iconGradientFrom: '#059669',
    iconGradientTo: '#10B981',
  },

  // Medium Priority: Caution Amber - Warning, attention needed
  medium: {
    primary: '#D97706',
    primaryHover: '#B45309',
    primaryLight: '#F59E0B',
    accent: '#92400E',
    accentHover: '#B45309',
    accentLight: '#D97706',
    ring: 'rgba(217, 119, 6, 0.5)',
    badge: '#FEF3C7',
    badgeText: '#92400E',
    gradientFrom: '#D97706',
    gradientTo: '#F59E0B',
    iconBg: '#FFFBEB',
    iconGradientFrom: '#D97706',
    iconGradientTo: '#FBBF24',
  },

  // High Priority: Danger Red - Stop, critical
  high: {
    primary: '#DC2626',
    primaryHover: '#B91C1C',
    primaryLight: '#EF4444',
    accent: '#991B1B',
    accentHover: '#B91C1C',
    accentLight: '#DC2626',
    ring: 'rgba(220, 38, 38, 0.5)',
    badge: '#FEE2E2',
    badgeText: '#991B1B',
    gradientFrom: '#DC2626',
    gradientTo: '#EF4444',
    iconBg: '#FEF2F2',
    iconGradientFrom: '#DC2626',
    iconGradientTo: '#F87171',
  },

  // Info: Construction Yellow - Information, guidance
  info: {
    primary: '#FFB627',
    primaryHover: '#F59E0B',
    primaryLight: '#FCD34D',
    accent: '#D97706',
    accentHover: '#F59E0B',
    accentLight: '#FFB627',
    ring: 'rgba(255, 182, 39, 0.5)',
    badge: '#FEF3C7',
    badgeText: '#92400E',
    gradientFrom: '#FFB627',
    gradientTo: '#FCD34D',
    iconBg: '#FFFBEB',
    iconGradientFrom: '#FFB627',
    iconGradientTo: '#FDE68A',
  },

  // Success: Emerald Green - Completed, approved
  success: {
    primary: '#059669',
    primaryHover: '#047857',
    primaryLight: '#10B981',
    accent: '#065F46',
    accentHover: '#047857',
    accentLight: '#059669',
    ring: 'rgba(5, 150, 105, 0.5)',
    badge: '#D1FAE5',
    badgeText: '#065F46',
    gradientFrom: '#059669',
    gradientTo: '#10B981',
    iconBg: '#ECFDF5',
    iconGradientFrom: '#059669',
    iconGradientTo: '#34D399',
  },
} as const;

/**
 * Get theme configuration by name
 * Falls back to default theme if not found
 */
export function getModalTheme(themeName: string = 'default'): ModalTheme {
  console.log('[modal-themes] Getting theme:', themeName);
  return MODAL_THEMES[themeName] || MODAL_THEMES.default;
}

/**
 * Priority-based theme selector
 * Maps priority levels to theme names
 */
export function getThemeForPriority(
  priority?: 'low' | 'medium' | 'high' | null
): string {
  console.log('[modal-themes] Getting theme for priority:', priority);

  if (!priority) return 'default';

  const priorityMap: Record<string, string> = {
    low: 'low',
    medium: 'medium',
    high: 'high',
  };

  return priorityMap[priority] || 'default';
}

/**
 * Generate CSS custom properties for a theme
 * Useful for dynamic theming
 */
export function generateThemeCSSVars(theme: ModalTheme): Record<string, string> {
  return {
    '--modal-primary': theme.primary,
    '--modal-primary-hover': theme.primaryHover,
    '--modal-primary-light': theme.primaryLight,
    '--modal-accent': theme.accent,
    '--modal-accent-hover': theme.accentHover,
    '--modal-accent-light': theme.accentLight,
    '--modal-ring': theme.ring,
    '--modal-badge': theme.badge,
    '--modal-badge-text': theme.badgeText,
    '--modal-gradient-from': theme.gradientFrom,
    '--modal-gradient-to': theme.gradientTo,
    '--modal-icon-bg': theme.iconBg,
    '--modal-icon-gradient-from': theme.iconGradientFrom,
    '--modal-icon-gradient-to': theme.iconGradientTo,
  };
}
