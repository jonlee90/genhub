/**
 * BaseModalFooter Component
 * Flexible footer with left/right action slots
 * Automatically applies construction-themed styling to primary action buttons
 */

'use client';

import { Children, cloneElement, isValidElement, ReactElement } from 'react';
import { cn } from '@/lib/utils';
import { BaseModalFooterProps } from './types';

/**
 * Helper function to apply construction theme styling to button elements
 * Adds: text-white bg-construction-blue hover:bg-construction-blue/90
 */
function applyButtonStyling(children: React.ReactNode): React.ReactNode {
  return Children.map(children, (child) => {
    // Only process valid React elements
    if (!isValidElement(child)) {
      return child;
    }

    // Check if it's a Button component by checking:
    // 1. Native button element
    // 2. Has displayName or name containing 'Button'
    // 3. Has button-like props (onClick, type, disabled)
    const childType = child.type as any;
    const isButton =
      child.type === 'button' ||
      childType?.displayName?.includes('Button') ||
      childType?.name?.includes('Button') ||
      (child.props && typeof child.props === 'object' && child.props !== null && ('onClick' in child.props || 'type' in child.props));

    if (isButton) {
      // Clone the element and merge the construction theme className
      // The construction theme classes are added FIRST so they can be overridden by component-specific classes
      return cloneElement(child as ReactElement, {
        className: cn(
          'text-white bg-construction-blue hover:bg-construction-blue/90',
          (child.props as any).className
        ),
      } as any);
    }

    return child;
  });
}

export function BaseModalFooter({
  leftActions,
  rightActions,
  className,
}: BaseModalFooterProps) {
  console.log('[BaseModalFooter] Rendering footer:', {
    hasLeftActions: !!leftActions,
    hasRightActions: !!rightActions,
  });

  // Don't render if no actions provided
  if (!leftActions && !rightActions) {
    console.log('[BaseModalFooter] No actions provided, skipping render');
    return null;
  }

  return (
    <div
      className={cn(
        'border-t border-gray-200 bg-gray-50/80 backdrop-blur-sm',
        'px-6 py-4',
        'flex items-center justify-between gap-4',
        'relative',
        className
      )}
    >
      {/* Construction accent line - subtle industrial detail */}
      <div
        className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent opacity-60"
        aria-hidden="true"
      />

      {/* Left actions */}
      <div className="flex items-center gap-2 flex-1">
        {leftActions}
      </div>

      {/* Right actions - apply construction theme styling to buttons */}
      <div className="flex items-center gap-2 flex-shrink-0">
        {applyButtonStyling(rightActions)}
      </div>
    </div>
  );
}
