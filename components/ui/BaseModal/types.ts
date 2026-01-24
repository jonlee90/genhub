/**
 * BaseModal TypeScript Interfaces
 * Type definitions for the construction-themed modal system
 */

import { ReactNode } from 'react';
import { LucideIcon } from 'lucide-react';

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

export type ModalSize = 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl' | '6xl' | '7xl';

export interface BaseModalProps {
  // Core
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;

  // Header
  icon?: LucideIcon;
  title: string;
  badges?: ReactNode;

  // Navigation
  onBack?: () => void;
  onContinue?: () => void;
  backLabel?: string;
  continueLabel?: string;
  showNavigation?: boolean;
  continueDisabled?: boolean;

  // Stepper
  steps?: string[];
  currentStep?: number;

  // Theming
  theme?: string;
  customTheme?: ModalTheme;
  iconColor?: string; // Custom color for icon background only

  // Behavior
  closeOnBackdropClick?: boolean;
  closeOnEscape?: boolean;
  formKey?: string | number;
  maxWidth?: ModalSize;

  // Mobile gestures
  /** Enable drag-to-dismiss on mobile bottom sheet. Default: true */
  enableDragToDismiss?: boolean;
  /** Snap points for bottom sheet as fractions (e.g., [0.5, 0.9]). Default: undefined */
  snapPoints?: number[];

  // Styling
  className?: string;
  contentClassName?: string;
  headerClassName?: string;
  footerClassName?: string;

  // Accessibility
  ariaLabel?: string;
  ariaDescribedBy?: string;
}

export interface BaseModalHeaderProps {
  icon?: LucideIcon;
  title: string;
  badges?: ReactNode;
  onClose: () => void;
  theme: ModalTheme;
  iconColor?: string; // Custom color for icon background only
  className?: string;
  steps?: string[];
  currentStep?: number;
}

export interface StepIndicatorProps {
  steps: string[];
  currentStep: number;
  theme: ModalTheme;
  className?: string;
}

/**
 * Animation variants for Framer Motion
 */
export const MODAL_ANIMATIONS = {
  backdrop: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
    transition: { duration: 0.2, ease: 'easeOut' },
  },

  // Desktop: Scale + Fade
  desktop: {
    initial: { opacity: 0, scale: 0.95, y: -20 },
    animate: {
      opacity: 1,
      scale: 1,
      y: 0,
      transition: {
        duration: 0.3,
        ease: [0.4, 0, 0.2, 1], // Tailwind's default easing
      },
    },
    exit: {
      opacity: 0,
      scale: 0.95,
      y: -20,
      transition: { duration: 0.2, ease: 'easeIn' },
    },
  },

  // Mobile: Bottom sheet slide
  mobile: {
    initial: { opacity: 0, y: '100%' },
    animate: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.3,
        ease: [0.4, 0, 0.2, 1],
      },
    },
    exit: {
      opacity: 0,
      y: '100%',
      transition: { duration: 0.25, ease: 'easeIn' },
    },
  },
} as const;

/**
 * Max width mappings for modal sizes
 */
export const MODAL_MAX_WIDTHS: Record<ModalSize, string> = {
  sm: 'max-w-sm', // 384px
  md: 'max-w-md', // 448px
  lg: 'max-w-lg', // 512px
  xl: 'max-w-xl', // 576px
  '2xl': 'max-w-2xl', // 672px
  '3xl': 'max-w-3xl', // 768px
  '4xl': 'max-w-4xl', // 896px
  '5xl': 'max-w-5xl', // 1024px
  '6xl': 'max-w-6xl', // 1152px
  '7xl': 'max-w-7xl', // 1280px
} as const;
