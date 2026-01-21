import React from 'react';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * SettingsSectionHeader - Mobile-first section header for settings page
 * Touch-friendly design with 44px minimum tap targets
 * Uses construction-themed styling matching Projects/Tasks pages
 */

interface SettingsSectionHeaderProps {
  icon: LucideIcon;
  title: string;
  description: string;
  disabled?: boolean; // For "coming soon" sections
}

export const SettingsSectionHeader = React.memo(function SettingsSectionHeader({
  icon: Icon,
  title,
  description,
  disabled = false,
}: SettingsSectionHeaderProps) {
  const sectionId = `section-${title.toLowerCase().replace(/\s+/g, '-')}`;

  return (
    <div
      role="region"
      aria-labelledby={sectionId}
      className={cn(
        'flex items-center gap-3 md:gap-4',
        disabled && 'opacity-40'
      )}
    >
      {/* Icon Container - 44px minimum touch target, matching construction theme */}
      <div className={cn(
        'p-2.5 md:p-3 rounded-xl shrink-0',
        'min-w-[44px] min-h-[44px] flex items-center justify-center',
        'border-2 transition-all duration-300',
        disabled
          ? 'bg-gray-100 dark:bg-gray-800 border-gray-200 dark:border-gray-700'
          : 'bg-construction-blue/10 dark:bg-construction-blue/20 border-construction-blue/20 dark:border-construction-blue/40'
      )}>
        <Icon className={cn(
          'h-5 w-5 md:h-6 md:w-6',
          disabled ? 'text-gray-400 dark:text-gray-500' : 'text-construction-blue dark:text-blue-400'
        )} />
      </div>

      {/* Text Content */}
      <div className="min-w-0 flex-1">
        <h2
          id={sectionId}
          className={cn(
            'text-lg md:text-xl font-black uppercase tracking-tighter leading-tight',
            disabled ? 'text-gray-400 dark:text-gray-500' : 'text-construction-blue dark:text-blue-400'
          )}
        >
          {title}
        </h2>
        <p className={cn(
          'text-sm leading-snug mt-0.5',
          disabled ? 'text-gray-400 dark:text-gray-500' : 'text-gray-500 dark:text-gray-400'
        )}>
          {description}
        </p>
      </div>
    </div>
  );
});
