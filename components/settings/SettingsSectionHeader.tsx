import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * SettingsSectionHeader - Reusable section header for settings page
 * Follows the consistent design pattern from Projects/Tasks pages
 * Uses construction-themed styling with icon + title + description
 */

interface SettingsSectionHeaderProps {
  icon: LucideIcon;
  title: string;
  description: string;
  disabled?: boolean; // For "coming soon" sections
}

export function SettingsSectionHeader({
  icon: Icon,
  title,
  description,
  disabled = false,
}: SettingsSectionHeaderProps) {
  console.log('[SettingsSectionHeader] Rendering:', { title, disabled });

  return (
    <div
      className={cn(
        'flex items-center gap-2 md:gap-3 px-3 md:px-4 py-2 md:py-3',
        'bg-gradient-to-r from-construction-blue/5 to-transparent',
        'rounded-lg border-l-4 border-construction-blue',
        disabled && 'opacity-50'
      )}
    >
      {/* Icon Container */}
      <div className="p-2 md:p-2.5 bg-construction-blue rounded-lg shrink-0">
        <Icon className="h-5 w-5 md:h-6 md:w-6 text-white" />
      </div>

      {/* Text Content */}
      <div className="min-w-0">
        <h2 className="text-xl md:text-2xl font-black text-construction-blue uppercase tracking-tight leading-tight">
          {title}
        </h2>
        <p className="text-xs md:text-sm text-gray-500 leading-snug">
          {description}
        </p>
      </div>
    </div>
  );
}
