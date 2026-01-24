'use client';

/**
 * CustomToast Component
 *
 * Custom toast notifications matching the FormSubmissionOverlay design language.
 * Uses green/red circular backgrounds with icons, bold titles, and optional descriptions.
 *
 * Design consistency:
 * - Success: Green (#059669) circle with CheckCircle2 icon
 * - Error: Red circle with X icon
 * - Spring animations for entrance
 * - Bold title with optional subtitle
 *
 * Usage:
 * ```tsx
 * import { showSuccessToast, showErrorToast } from '@/components/ui/CustomToast';
 *
 * showSuccessToast('Phase created!', 'Foundation is ready to go');
 * showErrorToast('Failed to create phase', 'Please try again');
 * ```
 */

import { m as motion } from 'framer-motion';
import { CheckCircle2, X } from 'lucide-react';
import { toast } from 'sonner';

interface CustomToastProps {
  title: string;
  description?: string;
  variant: 'success' | 'error';
}

/**
 * Custom toast component with consistent design
 */
export function CustomToast({ title, description, variant }: CustomToastProps) {
  const isSuccess = variant === 'success';

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9, y: -10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{
        type: 'spring',
        stiffness: 400,
        damping: 25,
      }}
      className="flex items-start gap-3 bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4 min-w-[280px] max-w-[400px]"
    >
      {/* Icon Circle */}
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{
          type: 'spring',
          stiffness: 400,
          damping: 15,
          delay: 0.1,
        }}
        className={`
          flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center
          ${isSuccess ? 'bg-[#059669]' : 'bg-red-500'}
        `}
      >
        {isSuccess ? (
          <CheckCircle2 className="w-6 h-6 text-white" />
        ) : (
          <X className="w-6 h-6 text-white" />
        )}
      </motion.div>

      {/* Content */}
      <div className="flex-1 pt-0.5">
        <h4 className="text-sm font-semibold text-gray-900 dark:text-white">
          {title}
        </h4>
        {description && (
          <p className="text-xs text-gray-600 dark:text-gray-300 mt-1">
            {description}
          </p>
        )}
      </div>
    </motion.div>
  );
}

/**
 * Show success toast notification
 *
 * @param title - Main message (bold)
 * @param description - Optional subtitle
 */
export function showSuccessToast(title: string, description?: string) {
  toast.custom(
    (t) => <CustomToast title={title} description={description} variant="success" />,
    {
      duration: 3000,
    }
  );
}

/**
 * Show error toast notification
 *
 * @param title - Main error message (bold)
 * @param description - Optional error details
 */
export function showErrorToast(title: string, description?: string) {
  toast.custom(
    (t) => <CustomToast title={title} description={description} variant="error" />,
    {
      duration: 4000,
    }
  );
}
