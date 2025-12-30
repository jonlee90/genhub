'use client';

import { User } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CreatorBadgeProps {
  creatorName: string;
  createdAt: string; // ISO date string or formatted date
  variant?: 'default' | 'compact';
  className?: string;
}

export function CreatorBadge({
  creatorName,
  createdAt,
  variant = 'default',
  className
}: CreatorBadgeProps) {
  // DEBUG: Log component rendering
  console.log('[CreatorBadge] Rendering with props:', {
    creatorName,
    createdAt,
    variant
  });

  const isCompact = variant === 'compact';

  // Format date to readable string
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      });
    } catch (error) {
      console.error('[CreatorBadge] Error formatting date:', error);
      return 'Unknown date';
    }
  };

  const formattedDate = formatDate(createdAt);

  if (isCompact) {
    // Compact variant: inline layout
    return (
      <div
        className={cn(
          "inline-flex items-center gap-1.5",
          "text-xs text-gray-600",
          className
        )}
        role="status"
        aria-label={`Created by ${creatorName} on ${formattedDate}`}
      >
        <User className="h-3.5 w-3.5 text-construction-blue" aria-hidden="true" />
        <span className="font-medium">{creatorName}</span>
        <span className="text-gray-400">•</span>
        <span className="text-gray-500">{formattedDate}</span>
      </div>
    );
  }

  // Default variant: stacked layout with subtle background
  return (
    <div
      className={cn(
        "inline-flex items-start gap-2.5",
        "bg-gray-50 border border-gray-200 rounded-md px-3 py-2",
        className
      )}
      role="status"
      aria-label={`Created by ${creatorName} on ${formattedDate}`}
    >
      <div className="flex flex-col min-w-0">
        <span className="text-xs font-semibold text-gray-900">
          By {creatorName}
        </span>
        <span className="text-xs text-gray-500">
          {formattedDate}
        </span>
      </div>
    </div>
  );
}
