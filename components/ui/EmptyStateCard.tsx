'use client';

/**
 * EmptyStateCard - Reusable Empty State Component
 *
 * Construction-themed empty state card used across Projects, Tasks, and Expenses pages
 * when no data exists. Features industrial design with optional process steps.
 */

import { memo } from 'react';
import { m as motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { LucideIcon } from 'lucide-react';

interface ProcessStep {
  num: string;
  label: string;
  icon: LucideIcon;
}

interface EmptyStateCardProps {
  /** Icon component to display */
  icon: LucideIcon;

  /** Main heading text (e.g., "BUILD YOUR FIRST PROJECT") */
  title: string;

  /** Descriptive subtitle text */
  description: string;

  /** Button text (e.g., "START PROJECT") */
  buttonText?: string;

  /** Button click handler */
  onButtonClick?: () => void;

  /** Optional process steps to display below the button */
  steps?: ProcessStep[];

  /** Whether to show the action button (based on user permissions) */
  showButton?: boolean;
}

export const EmptyStateCard = memo(function EmptyStateCard({
  icon: Icon,
  title,
  description,
  buttonText,
  onButtonClick,
  steps,
  showButton = true,
}: EmptyStateCardProps) {
  return (
    <div className="flex-1 p-4 md:p-8">
      <div className="relative">
        {/* Decorative rotated borders (desktop only) */}
        <div className="hidden md:block absolute inset-0 border-4 border-construction-blue/10 rounded-2xl transform rotate-1" />
        <div className="hidden md:block absolute inset-0 border-4 border-construction-accent/10 rounded-2xl transform -rotate-1" />

        {/* Main content card */}
        <div className="relative flex flex-col items-center justify-center py-12 md:py-24 px-4 md:px-8 bg-gradient-to-br from-gray-50 via-white to-gray-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 rounded-xl md:rounded-2xl border-2 border-gray-200 dark:border-gray-700 shadow-construction-lg">

          {/* Icon */}
          <motion.div
            className="relative z-10"
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.6, type: 'spring', stiffness: 200 }}
          >
            <div className="relative p-5 md:p-8 bg-gradient-to-br from-construction-blue to-blue-700 rounded-2xl md:rounded-3xl shadow-construction-xl">
              <Icon className="h-12 w-12 md:h-20 md:w-20 text-white" />
              <div className="absolute -top-1 -right-1 md:-top-2 md:-right-2 w-4 h-4 md:w-6 md:h-6 bg-construction-accent dark:bg-construction-accent rounded-full animate-pulse" />
            </div>
          </motion.div>

          {/* Title */}
          <motion.h2
            className="text-2xl sm:text-3xl md:text-5xl font-black text-center mb-3 md:mb-4 mt-6 bg-gradient-to-r from-construction-blue via-construction-blue to-blue-700 dark:from-construction-blue dark:via-construction-blue dark:to-construction-blue bg-clip-text text-transparent leading-tight whitespace-pre-line"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.6 }}
          >
            {title}
          </motion.h2>

          {/* Description */}
          <motion.p
            className="text-sm md:text-lg text-gray-600 dark:text-gray-400 font-medium mb-6 md:mb-10 max-w-xl text-center leading-relaxed px-4"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.6 }}
          >
            {description}
          </motion.p>

          {/* Action Button */}
          {showButton && buttonText && onButtonClick && (
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.6, duration: 0.6 }}
            >
              <Button
                size="lg"
                onClick={onButtonClick}
                className="relative h-12 md:h-16 px-6 md:px-10 bg-gradient-to-r from-construction-blue to-blue-700 hover:from-construction-blue/90 hover:to-blue-700/90 shadow-construction-xl hover:shadow-2xl transition-all group overflow-hidden text-sm md:text-lg font-black text-white"
              >
                <div className="absolute inset-0 bg-construction-accent opacity-0 group-hover:opacity-20 transition-opacity" />
                <Icon className="mr-2 md:mr-3 h-5 w-5 md:h-6 md:w-6 group-hover:rotate-12 transition-transform" />
                {buttonText}
              </Button>
            </motion.div>
          )}

          {/* Optional Process Steps */}
          {steps && steps.length > 0 && (
            <div className="mt-8 md:mt-12 grid grid-cols-3 gap-2 md:gap-6 max-w-2xl w-full">
              {steps.map((step, index) => (
                <motion.div
                  key={step.num}
                  className="relative group"
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.7 + index * 0.1, duration: 0.6 }}
                >
                  <div className="flex flex-col items-center p-2 md:p-4 bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-lg md:rounded-xl hover:border-construction-blue dark:hover:border-construction-blue transition-all shadow-construction hover:shadow-construction-lg">
                    <div className="flex items-center justify-center w-8 h-8 md:w-12 md:h-12 rounded-lg bg-construction-blue/10 dark:bg-construction-blue/20 border-2 border-construction-blue/20 dark:border-construction-blue/40 mb-2 md:mb-3 group-hover:scale-110 transition-transform">
                      <step.icon className="h-4 w-4 md:h-6 md:w-6 text-construction-blue dark:text-construction-blue" />
                    </div>
                    <div className="text-lg md:text-2xl font-black text-construction-blue dark:text-construction-blue mb-0.5 md:mb-1">
                      {step.num}
                    </div>
                    <p className="text-[10px] md:text-sm font-bold text-gray-600 dark:text-gray-400 text-center">
                      {step.label}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
});
