'use client';

/**
 * InteractiveTypeCard Component
 *
 * Enhanced project type selection card with:
 * - Hover state with subtle scale and background change
 * - Selected state with animated checkmark
 * - Active (pressed) state with scale down
 * - Haptic feedback on selection
 * - Accessibility via role="radio"
 */

import { m as motion } from 'framer-motion';
import { Check, LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface InteractiveTypeCardProps {
  value: string;
  label: string;
  description: string;
  icon: LucideIcon;
  isSelected: boolean;
  onSelect: (value: string) => void;
  disabled?: boolean;
}

export function InteractiveTypeCard({
  value,
  label,
  description,
  icon: Icon,
  isSelected,
  onSelect,
  disabled = false,
}: InteractiveTypeCardProps) {
  const handleClick = () => {
    if (disabled) return;

    // Haptic feedback on mobile
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate(10);
    }

    onSelect(value);
  };

  return (
    <motion.button
      type="button"
      role="radio"
      aria-checked={isSelected}
      aria-label={`${label}: ${description}`}
      onClick={handleClick}
      disabled={disabled}
      className={cn(
        // Base styles
        'relative p-4 rounded-xl border-2 text-left',
        'min-h-[100px]',
        'touch-manipulation',
        'transition-all duration-200',

        // Hover state
        'hover:shadow-md',

        // Active (pressed) state
        'active:scale-[0.98]',

        // Selected state
        isSelected
          ? 'border-construction-blue dark:border-blue-500 bg-construction-blue/5 dark:bg-blue-500/10 shadow-md'
          : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800/50',

        // Disabled state
        disabled && 'opacity-50 cursor-not-allowed'
      )}
      whileTap={{ scale: disabled ? 1 : 0.98 }}
      whileHover={{ scale: disabled ? 1 : 1.01 }}
    >
      {/* Icon + Content */}
      <div className="flex items-start gap-3">
        <div
          className={cn(
            'shrink-0 w-10 h-10 rounded-lg flex items-center justify-center transition-all',
            isSelected
              ? 'bg-construction-blue dark:bg-blue-500 shadow-sm'
              : 'bg-gray-100 dark:bg-gray-800'
          )}
        >
          <Icon
            className={cn(
              'w-5 h-5 transition-colors',
              isSelected ? 'text-white' : 'text-gray-600 dark:text-gray-400'
            )}
          />
        </div>
        <div className="min-w-0 flex-1">
          <h3
            className={cn(
              'font-semibold text-sm leading-tight',
              isSelected
                ? 'text-construction-blue dark:text-blue-400'
                : 'text-gray-900 dark:text-gray-100'
            )}
          >
            {label}
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 leading-snug">
            {description}
          </p>
        </div>
      </div>

      {/* Selection indicator with animation */}
      {isSelected && (
        <motion.div
          className="absolute -top-1.5 -right-1.5 w-6 h-6 bg-construction-blue rounded-full flex items-center justify-center shadow-md"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{
            type: 'spring',
            stiffness: 400,
            damping: 20,
          }}
        >
          <Check
            className="w-3.5 h-3.5 text-white"
            strokeWidth={3}
          />
        </motion.div>
      )}
    </motion.button>
  );
}
