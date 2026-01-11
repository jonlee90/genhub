/**
 * ResponsiveModal Component
 * Automatically switches between BaseModal (desktop) and BottomSheetModal (mobile)
 *
 * Purpose:
 * - Provides a unified API for modals that adapts to screen size
 * - Desktop (768px+): Uses BaseModal with centered dialog
 * - Mobile (<768px): Uses BottomSheetModal with native bottom sheet UX
 *
 * Usage:
 * ```tsx
 * <ResponsiveModal
 *   isOpen={isOpen}
 *   onClose={() => setIsOpen(false)}
 *   icon={CheckSquare}
 *   title="Edit Task"
 *   rightActions={<Button>Save</Button>}
 * >
 *   <div>Modal content</div>
 * </ResponsiveModal>
 * ```
 */

'use client';

import { useIsMobile } from '@/lib/hooks/useMediaQuery';
import { BaseModal } from '@/components/ui/BaseModal';
import { BottomSheetModal } from '@/components/mobile/BottomSheetModal';
import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import type { ModalThemeName } from '@/lib/config/modal-themes';
import type { ModalSize } from '@/components/ui/BaseModal/types';
import type { SnapPoint } from '@/components/mobile/BottomSheetModal/types';

export interface ResponsiveModalProps {
  // Core props
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;

  // Header props
  icon?: LucideIcon;
  title?: string;
  subtitle?: string;
  badges?: ReactNode;

  // Footer props
  leftActions?: ReactNode;
  rightActions?: ReactNode;
  showFooter?: boolean;

  // Theming
  theme?: ModalThemeName;

  // Behavior
  closeOnBackdropClick?: boolean;
  closeOnEscape?: boolean;
  enableDragToDismiss?: boolean;

  // Desktop-specific
  maxWidth?: ModalSize;
  formKey?: string;

  // Mobile-specific
  snapPoints?: SnapPoint[];
  initialSnapPoint?: SnapPoint;

  // Styling
  className?: string;
  contentClassName?: string;
  headerClassName?: string;
  footerClassName?: string;

  // Accessibility
  ariaLabel?: string;
  ariaDescribedBy?: string;
}

export function ResponsiveModal({
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
  theme = 'default',
  closeOnBackdropClick = true,
  closeOnEscape = true,
  enableDragToDismiss = true,
  maxWidth = 'xl',
  formKey,
  snapPoints = ['half', 'full'],
  initialSnapPoint,
  className,
  contentClassName,
  headerClassName,
  footerClassName,
  ariaLabel,
  ariaDescribedBy,
}: ResponsiveModalProps) {
  const isMobile = useIsMobile();

  // On mobile, use BottomSheetModal for native feel
  if (isMobile) {
    return (
      <BottomSheetModal
        isOpen={isOpen}
        onClose={onClose}
        icon={icon}
        title={title}
        subtitle={subtitle}
        badges={badges}
        leftActions={leftActions}
        rightActions={rightActions}
        showFooter={showFooter}
        theme={theme}
        closeOnBackdropClick={closeOnBackdropClick}
        closeOnEscape={closeOnEscape}
        enableDragToDismiss={enableDragToDismiss}
        snapPoints={snapPoints}
        initialSnapPoint={initialSnapPoint}
        className={className}
        contentClassName={contentClassName}
        headerClassName={headerClassName}
        footerClassName={footerClassName}
        ariaLabel={ariaLabel}
        ariaDescribedBy={ariaDescribedBy}
      >
        {children}
      </BottomSheetModal>
    );
  }

  // On desktop, use BaseModal for centered dialog
  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      icon={icon}
      title={title || ''}
      subtitle={subtitle}
      badges={badges}
      leftActions={leftActions}
      rightActions={rightActions}
      showFooter={showFooter}
      theme={theme}
      closeOnBackdropClick={closeOnBackdropClick}
      closeOnEscape={closeOnEscape}
      enableDragToDismiss={enableDragToDismiss}
      maxWidth={maxWidth}
      formKey={formKey}
      className={className}
      contentClassName={contentClassName}
      headerClassName={headerClassName}
      footerClassName={footerClassName}
      ariaLabel={ariaLabel}
      ariaDescribedBy={ariaDescribedBy}
    >
      {children}
    </BaseModal>
  );
}
