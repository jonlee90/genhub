/**
 * BaseModal Component
 * Production-grade modal system with construction-themed design
 * Responsive: Bottom sheet on mobile, centered modal on desktop
 */

'use client';

import { useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useMediaQuery } from '@/lib/hooks/useMediaQuery';
import { getModalTheme } from '@/lib/config/modal-themes';

import { BaseModalHeader } from './BaseModalHeader';
import { BaseModalFooter } from './BaseModalFooter';
import { StepIndicator } from './StepIndicator';

import {
  BaseModalProps,
  MODAL_ANIMATIONS,
  MODAL_MAX_WIDTHS,
} from './types';

export function BaseModal({
  isOpen,
  onClose,
  children,
  icon,
  title,
  subtitle,
  badges,
  leftActions,
  rightActions,
  showFooter = true,
  steps,
  currentStep = 1,
  theme: themeName = 'default',
  customTheme,
  closeOnBackdropClick = true,
  closeOnEscape = true,
  formKey,
  maxWidth = 'xl',
  className,
  contentClassName,
  headerClassName,
  footerClassName,
  ariaLabel,
  ariaDescribedBy,
}: BaseModalProps) {
  console.log('[BaseModal] Rendering modal:', {
    isOpen,
    title,
    themeName,
    maxWidth,
    hasSteps: !!steps,
    currentStep,
  });

  // Get theme configuration
  const theme = customTheme || getModalTheme(themeName);

  // Detect mobile for bottom sheet behavior
  const isMobile = useMediaQuery('(max-width: 767px)');

  console.log('[BaseModal] Device detection:', { isMobile });

  // Handle escape key
  useEffect(() => {
    if (!isOpen || !closeOnEscape) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        console.log('[BaseModal] Escape key pressed, closing modal');
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, closeOnEscape, onClose]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      console.log('[BaseModal] Preventing body scroll');
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Handle backdrop click
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (closeOnBackdropClick && e.target === e.currentTarget) {
      console.log('[BaseModal] Backdrop clicked, closing modal');
      onClose();
    }
  };

  return (
    <AnimatePresence mode="wait">
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
            onClick={handleBackdropClick}
            {...MODAL_ANIMATIONS.backdrop}
            aria-hidden="true"
          />

          {/* Modal container */}
          <div
            className={cn(
              'fixed z-50',
              isMobile
                ? 'inset-x-0 bottom-0' // Bottom sheet positioning
                : 'inset-0 flex items-center justify-center p-4' // Centered modal
            )}
            role="dialog"
            aria-modal="true"
            aria-label={ariaLabel || title}
            aria-describedby={ariaDescribedBy}
          >
            <motion.div
              className={cn(
                'bg-white shadow-2xl relative',
                'flex flex-col',
                // Mobile: Bottom sheet styles
                isMobile && [
                  'rounded-t-3xl',
                  'max-h-[90vh]',
                  'w-full',
                ],
                // Desktop: Centered modal styles
                !isMobile && [
                  'rounded-2xl',
                  'max-h-[90vh]',
                  'w-full',
                  MODAL_MAX_WIDTHS[maxWidth],
                ],
                className
              )}
              {...(isMobile ? MODAL_ANIMATIONS.mobile : MODAL_ANIMATIONS.desktop)}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Top accent gradient strip */}
              <div
                className={cn(
                  'h-1.5 w-full',
                  isMobile ? 'rounded-t-3xl' : 'rounded-t-2xl'
                )}
                style={{
                  background: `linear-gradient(90deg, ${theme.gradientFrom} 0%, ${theme.gradientTo} 100%)`,
                }}
                aria-hidden="true"
              >
                {/* Animated shimmer effect */}
                <div
                  className="h-full w-full opacity-40"
                  style={{
                    background: `linear-gradient(90deg, transparent 0%, rgba(255, 255, 255, 0.4) 50%, transparent 100%)`,
                    backgroundSize: '200% 100%',
                    animation: 'shimmer 3s infinite',
                  }}
                />
              </div>

              {/* Mobile: Drag handle */}
              {isMobile && (
                <div className="flex justify-center pt-3 pb-2" aria-hidden="true">
                  <div className="h-1.5 w-12 bg-gray-300 rounded-full" />
                </div>
              )}

              {/* Header */}
              <BaseModalHeader
                icon={icon}
                title={title}
                subtitle={subtitle}
                badges={badges}
                onClose={onClose}
                theme={theme}
                className={headerClassName}
              />

              {/* Step indicator */}
              {steps && steps.length > 0 && (
                <StepIndicator
                  steps={steps}
                  currentStep={currentStep}
                  theme={theme}
                />
              )}

              {/* Scrollable content area */}
              <div
                className={cn(
                  'flex-1 overflow-y-auto overflow-x-hidden',
                  'px-6 py-4',
                  // Custom scrollbar styling
                  'scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100',
                  contentClassName
                )}
                style={{
                  maxHeight: isMobile ? 'calc(90vh - 280px)' : 'calc(90vh - 280px)',
                }}
              >
                {/* Key prop for form remounting */}
                <div key={formKey}>
                  {children}
                </div>
              </div>

              {/* Footer */}
              {showFooter && (leftActions || rightActions) && (
                <BaseModalFooter
                  leftActions={leftActions}
                  rightActions={rightActions}
                  className={footerClassName}
                />
              )}
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}

// Export sub-components and types
export { BaseModalHeader } from './BaseModalHeader';
export { BaseModalFooter } from './BaseModalFooter';
export { StepIndicator } from './StepIndicator';
export type {
  BaseModalProps,
  BaseModalHeaderProps,
  BaseModalFooterProps,
  StepIndicatorProps,
  ModalTheme,
  ModalSize,
} from './types';

// Add shimmer animation to global styles (if not already present)
if (typeof document !== 'undefined') {
  const styleId = 'basemodal-animations';
  if (!document.getElementById(styleId)) {
    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = `
      @keyframes shimmer {
        0% { background-position: -200% 0; }
        100% { background-position: 200% 0; }
      }
    `;
    document.head.appendChild(style);
  }
}
