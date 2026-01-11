'use client';

/**
 * StickySubmitButton Component
 *
 * Fixed-bottom submit button for mobile forms.
 *
 * Features:
 * - Fixed position: bottom-20 (above bottom nav), left-4, right-4
 * - Gradient fade overlay above button
 * - Safe area inset padding for notched devices
 * - Uses TouchButton internally for consistency
 * - Loading state support
 */

import { cn } from '@/lib/utils';
import { TouchButton } from './TouchButton';
import type { LucideIcon } from 'lucide-react';

interface StickySubmitButtonProps {
  /** Button text */
  children: React.ReactNode;
  /** Click handler (use for type="button") */
  onClick?: () => void;
  /** Button type */
  type?: 'submit' | 'button';
  /** Disabled state */
  disabled?: boolean;
  /** Loading state with spinner */
  loading?: boolean;
  /** Button variant */
  variant?: 'primary' | 'danger';
  /** Icon (Lucide) */
  icon?: LucideIcon;
  /** Additional className for wrapper */
  className?: string;
  /** Additional className for button */
  buttonClassName?: string;
}

export function StickySubmitButton({
  children,
  onClick,
  type = 'submit',
  disabled = false,
  loading = false,
  variant = 'primary',
  icon,
  className,
  buttonClassName,
}: StickySubmitButtonProps) {
  return (
    <div
      className={cn(
        // Fixed positioning - above bottom nav (h-16 + pb-safe)
        'fixed bottom-20 left-4 right-4',
        // Safe area for home indicator
        'pb-[env(safe-area-inset-bottom)]',
        // Z-index below modals but above content
        'z-30',
        // Mobile only (hide on desktop)
        'md:hidden',
        className
      )}
    >
      {/* Gradient fade overlay */}
      <div
        className={cn(
          'absolute -top-8 left-0 right-0 h-8',
          'bg-gradient-to-t from-gray-50 to-transparent',
          'pointer-events-none'
        )}
      />

      {/* Submit button */}
      <TouchButton
        type={type}
        onClick={onClick}
        disabled={disabled}
        loading={loading}
        variant={variant}
        size="lg"
        fullWidth
        icon={icon}
        iconPosition="left"
        className={buttonClassName}
      >
        {children}
      </TouchButton>
    </div>
  );
}
