'use client';

import { useEffect, ReactNode } from 'react';
import { m as motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useMediaQuery } from '@/lib/hooks/useMediaQuery';

// Debug: Bottom Sheet component - slides up on mobile, centered modal on desktop
interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
  title?: string;
  description?: string;
  showHandle?: boolean;
  maxHeight?: string;
  className?: string;
}

export function BottomSheet({
  isOpen,
  onClose,
  children,
  title,
  description,
  showHandle = true,
  maxHeight = '85vh',
  className,
}: BottomSheetProps) {
  const isMobile = useMediaQuery('(max-width: 767px)');

  // Debug: Lock body scroll when sheet is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  // Debug: Close on ESC key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Debug: Backdrop overlay */}
          <motion.div
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
          />

          {/* Debug: Sheet content - different behavior on mobile vs desktop */}
          {isMobile ? (
            // Mobile: Slides up from bottom
            <motion.div
              className="fixed inset-x-0 bottom-0 z-50"
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              style={{
                paddingBottom: 'env(safe-area-inset-bottom, 0px)',
              }}
            >
              <div
                className={cn(
                  'relative bg-white rounded-t-3xl shadow-2xl overflow-hidden flex flex-col',
                  className
                )}
                style={{ maxHeight }}
                onClick={(e) => e.stopPropagation()}
              >
                {/* Debug: Top accent line - construction blue */}
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-construction-blue via-construction-accent to-construction-blue" />

                {/* Debug: Drag handle indicator */}
                {showHandle && (
                  <div className="flex justify-center pt-3 pb-2">
                    <div className="w-10 h-1 rounded-full bg-gray-300" />
                  </div>
                )}

                {/* Debug: Header with title and close button */}
                {(title || description) && (
                  <div className="flex items-start justify-between px-5 py-3 border-b border-gray-100">
                    <div>
                      {title && (
                        <h2 className="text-lg font-bold text-gray-900">{title}</h2>
                      )}
                      {description && (
                        <p className="text-sm text-gray-500 mt-0.5">{description}</p>
                      )}
                    </div>
                    <motion.button
                      onClick={onClose}
                      className="p-2 rounded-lg hover:bg-gray-100 transition-colors -mr-2"
                      whileTap={{ scale: 0.95 }}
                      aria-label="Close"
                    >
                      <X className="w-5 h-5 text-gray-500" />
                    </motion.button>
                  </div>
                )}

                {/* Debug: Sheet content - scrollable */}
                <div className="flex-1 overflow-y-auto">{children}</div>
              </div>
            </motion.div>
          ) : (
            // Desktop: Centered modal
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
              <motion.div
                className={cn(
                  'relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden pointer-events-auto',
                  className
                )}
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                onClick={(e) => e.stopPropagation()}
                style={{ maxHeight }}
              >
                {/* Debug: Top accent line */}
                <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-construction-blue via-construction-accent to-construction-blue" />

                {/* Debug: Header with title and close button */}
                {(title || description) && (
                  <div className="flex items-start justify-between px-6 py-4 border-b border-gray-100">
                    <div>
                      {title && (
                        <h2 className="text-xl font-bold text-gray-900">{title}</h2>
                      )}
                      {description && (
                        <p className="text-sm text-gray-500 mt-0.5">{description}</p>
                      )}
                    </div>
                    <motion.button
                      onClick={onClose}
                      className="p-2 rounded-lg hover:bg-gray-100 transition-colors -mr-2"
                      whileTap={{ scale: 0.95 }}
                      aria-label="Close"
                    >
                      <X className="w-5 h-5 text-gray-500" />
                    </motion.button>
                  </div>
                )}

                {/* Debug: Modal content */}
                <div className="overflow-y-auto" style={{ maxHeight: `calc(${maxHeight} - 80px)` }}>
                  {children}
                </div>
              </motion.div>
            </div>
          )}
        </>
      )}
    </AnimatePresence>
  );
}
