/**
 * BottomSheetModalFooter Component
 * Mobile-optimized footer with action buttons
 * Handles safe area insets for notched devices
 */

'use client';

import { cn } from '@/lib/utils';
import { BottomSheetModalFooterProps } from './types';

export function BottomSheetModalFooter({
  leftActions,
  rightActions,
  className,
}: BottomSheetModalFooterProps) {
  // Don't render if no actions
  if (!leftActions && !rightActions) {
    return null;
  }

  return (
    <div
      className={cn(
        'border-t border-gray-200 bg-gray-50/95 backdrop-blur-sm',
        'px-5 py-4',
        'flex items-center justify-between gap-3',
        // Safe area padding for notched devices
        'pb-[max(1rem,env(safe-area-inset-bottom))]',
        className
      )}
    >
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
