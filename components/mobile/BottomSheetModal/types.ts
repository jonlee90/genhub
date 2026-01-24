/**
 * BottomSheetModal TypeScript Interfaces
 * Type definitions for the mobile-optimized bottom sheet modal system
 */

import { ReactNode } from 'react';
import { LucideIcon } from 'lucide-react';

export type SnapPoint = 'content' | 'half' | 'full';

export interface BottomSheetModalProps {
  // Core
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;

  // Header
  icon?: LucideIcon;
  title?: string;
  badges?: ReactNode;

  // Navigation
  /** Callback for back button. If provided, shows back button (hidden on step 1) */
  onBack?: () => void;
  /** Callback for continue button. If provided, shows continue button */
  onContinue?: () => void;
  /** Label for back button. Default: "Back" */
  backLabel?: string;
  /** Label for continue button. Default: "Continue" */
  continueLabel?: string;
  /** Current step number (for showing/hiding back button) */
  currentStep?: number;
  /** Total number of steps (for display) */
  totalSteps?: number;
  /** Show navigation bar. Default: true */
  showNavigation?: boolean;
  /** Disable continue button. Default: false */
  continueDisabled?: boolean;

  // Theming
  /** Theme name from modal-themes.ts (default, low, medium, high, info, success) */
  theme?: string;
  /** Custom theme object overrides theme name */
  customTheme?: import('@/lib/config/modal-themes').ModalTheme;
  /** Custom color for icon background only */
  iconColor?: string;

  // Behavior
  /** Enable drag-to-dismiss gesture. Default: true */
  enableDragToDismiss?: boolean;
  /** Close on backdrop tap. Default: true */
  closeOnBackdropClick?: boolean;
  /** Close on ESC key. Default: true */
  closeOnEscape?: boolean;
  /** Snap points for the sheet. Default: ['full'] (92vh) */
  snapPoints?: SnapPoint[];
  /** Initial snap point. Default: first in snapPoints */
  initialSnapPoint?: SnapPoint;

  // Styling
  className?: string;
  contentClassName?: string;
  headerClassName?: string;

  // Accessibility
  ariaLabel?: string;
  ariaDescribedBy?: string;
}

export interface BottomSheetModalHeaderProps {
  icon?: LucideIcon;
  title?: string;
  badges?: ReactNode;
  onClose: () => void;
  themePrimary: string;
  themeGradientFrom: string;
  themeGradientTo: string;
  iconColor?: string; // Custom color for icon background only
  className?: string;
}

/**
 * Snap point height percentages (of viewport)
 */
export const SNAP_POINT_HEIGHTS: Record<SnapPoint, number> = {
  content: 0.4,  // 40% - for minimal content
  half: 0.55,    // 55% - comfortable height for simple dialogs
  full: 0.92,    // 92% - default full screen height
} as const;

/**
 * Animation configuration
 */
export const ANIMATION_CONFIG = {
  // Spring physics for native feel
  spring: {
    type: 'spring' as const,
    stiffness: 400,
    damping: 35,
  },
  // Drag-to-dismiss thresholds
  dismissVelocity: 500,      // px/s - fast swipe dismisses
  dismissThreshold: 0.25,    // 25% of current height
} as const;
