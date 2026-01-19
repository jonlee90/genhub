'use client';

/**
 * AnimatedFormField Component
 *
 * Wrapper for MobileInput with enhanced animations:
 * - Staggered mount animation (opacity + y)
 * - Error shake animation
 * - Success state with checkmark
 */

import { motion } from 'framer-motion';
import { CheckCircle2 } from 'lucide-react';
import { MobileInput } from '@/components/mobile/MobileInput';
import { cn } from '@/lib/utils';
import type { ComponentProps } from 'react';

interface AnimatedFormFieldProps extends ComponentProps<typeof MobileInput> {
  /** Animation delay for staggered entrance */
  animationDelay?: number;
  /** Show success checkmark on valid field */
  showSuccessState?: boolean;
  /** Is field valid? (for success state) */
  isValid?: boolean;
}

export function AnimatedFormField({
  animationDelay = 0,
  showSuccessState = false,
  isValid = false,
  error,
  className,
  containerClassName,
  ...props
}: AnimatedFormFieldProps) {
  const hasError = Boolean(error);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, delay: animationDelay }}
      className={cn('relative', containerClassName)}
    >
      {/* Shake animation on error */}
      <motion.div
        animate={
          hasError
            ? {
                x: [-4, 4, -4, 4, 0],
                transition: { duration: 0.3 },
              }
            : {}
        }
      >
        <MobileInput
          error={error}
          className={cn(
            // Success border
            !hasError &&
              isValid &&
              showSuccessState &&
              'border-[#059669] focus:border-[#059669] focus:ring-[#059669]/20',
            className
          )}
          {...props}
        />
      </motion.div>

      {/* Success checkmark (absolute positioned) */}
      {!hasError && isValid && showSuccessState && (
        <motion.div
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: 'spring', stiffness: 400, damping: 20 }}
          className="absolute right-3 top-[22px] pointer-events-none"
        >
          <CheckCircle2 className="w-5 h-5 text-[#059669]" />
        </motion.div>
      )}
    </motion.div>
  );
}
