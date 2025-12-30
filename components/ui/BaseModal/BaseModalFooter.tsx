/**
 * BaseModalFooter Component
 * Flexible footer with left/right action slots
 */

'use client';

import { cn } from '@/lib/utils';
import { BaseModalFooterProps } from './types';

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

      {/* Right actions */}
      <div className="flex items-center gap-2 flex-shrink-0">
        {rightActions}
      </div>
    </div>
  );
}
