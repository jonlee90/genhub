'use client';

import React from 'react';
import { Calendar, CalendarDays, CalendarRange } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { TimeScale } from './gantt-types';

interface GanttViewToggleProps {
  timeScale: TimeScale;
  onTimeScaleChange: (scale: TimeScale) => void;
  isMobile?: boolean;
}

const VIEW_OPTIONS = [
  { id: 'day' as TimeScale, label: 'Day', shortLabel: 'D', icon: Calendar },
  { id: 'week' as TimeScale, label: 'Week', shortLabel: 'W', icon: CalendarDays },
  { id: 'month' as TimeScale, label: 'Month', shortLabel: 'M', icon: CalendarRange },
] as const;

export const GanttViewToggle = React.memo(function GanttViewToggle({ timeScale, onTimeScaleChange, isMobile = false }: GanttViewToggleProps) {
  return (
    <div className={cn(
      'flex items-center rounded-lg border-2 border-gray-200 bg-white shadow-sm',
      isMobile ? 'gap-0.5 p-0.5 w-full' : 'gap-1 p-1'
    )}>
      {VIEW_OPTIONS.map((option) => {
        const Icon = option.icon;
        const isActive = timeScale === option.id;

        return (
          <Button
            key={option.id}
            variant={isActive ? 'secondary' : 'ghost'}
            size={isMobile ? 'sm' : 'sm'}
            onClick={() => onTimeScaleChange(option.id)}
            className={cn(
              'font-bold transition-all',
              isMobile ? 'gap-1 w-full' : 'gap-2',
              isActive &&
                'bg-construction-blue text-white hover:bg-construction-blue/90 shadow-construction'
            )}
          >
            <Icon className={cn(isMobile ? 'h-3.5 w-3.5' : 'h-4 w-4')} />
            {isMobile ? (
              <span className="text-xs">{option.label}</span>
            ) : (
              <span className="hidden sm:inline">{option.label}</span>
            )}
          </Button>
        );
      })}
    </div>
  );
});
