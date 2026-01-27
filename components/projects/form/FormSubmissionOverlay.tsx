'use client';

/**
 * FormSubmissionOverlay Component
 *
 * Multi-step loading overlay for form submission:
 * - Full modal overlay
 * - Sequential loading states
 * - Success state with checkmark
 * - Construction-blue theme
 */

import { m as motion, AnimatePresence } from 'framer-motion';
// Performance optimization: Direct imports instead of barrel file
import CheckCircle2 from 'lucide-react/icons/check-circle-2';
import Loader2 from 'lucide-react/icons/loader-2';
import { useState, useEffect } from 'react';

interface FormSubmissionOverlayProps {
  /** Is submission in progress? */
  isSubmitting: boolean;
  /** Is submission complete and successful? */
  isComplete: boolean;
  /** Project name for success message */
  projectName?: string;
}

const SUBMISSION_STATES = [
  { text: 'Validating project details...' },
  { text: 'Setting up project phases...' },
  { text: 'Configuring health tracking...' },
  { text: 'Creating your project...' },
];

export function FormSubmissionOverlay({
  isSubmitting,
  isComplete,
  projectName,
}: FormSubmissionOverlayProps) {
  const [currentStateIndex, setCurrentStateIndex] = useState(0);

  useEffect(() => {
    if (!isSubmitting) {
      setCurrentStateIndex(0);
      return;
    }

    // Cycle through states every 500ms
    const interval = setInterval(() => {
      setCurrentStateIndex((prev) => {
        if (prev < SUBMISSION_STATES.length - 1) {
          return prev + 1;
        }
        return prev;
      });
    }, 500);

    return () => clearInterval(interval);
  }, [isSubmitting]);

  return (
    <AnimatePresence>
      {isSubmitting && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            className="bg-white rounded-2xl shadow-2xl p-8 max-w-md mx-4"
          >
            {/* Loading state */}
            {!isComplete && (
              <div className="flex flex-col items-center text-center">
                {/* Spinner */}
                <div className="relative mb-6">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{
                      duration: 1,
                      repeat: Infinity,
                      ease: 'linear',
                    }}
                  >
                    <Loader2 className="w-16 h-16 text-construction-blue" />
                  </motion.div>
                </div>

                {/* Current state text */}
                <AnimatePresence mode="wait">
                  <motion.p
                    key={currentStateIndex}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.2 }}
                    className="text-base font-medium text-gray-900"
                  >
                    {SUBMISSION_STATES[currentStateIndex].text}
                  </motion.p>
                </AnimatePresence>

                {/* Progress dots */}
                <div className="flex gap-2 mt-4">
                  {SUBMISSION_STATES.map((_, index) => (
                    <motion.div
                      key={index}
                      initial={{ scale: 0.8 }}
                      animate={{
                        scale: index <= currentStateIndex ? 1 : 0.8,
                        backgroundColor:
                          index <= currentStateIndex ? 'var(--construction-blue)' : '#E5E7EB',
                      }}
                      transition={{ duration: 0.2 }}
                      className="w-2 h-2 rounded-full"
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Success state */}
            {isComplete && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{
                  type: 'spring',
                  stiffness: 400,
                  damping: 20,
                  delay: 0.1,
                }}
                className="flex flex-col items-center text-center"
              >
                {/* Success checkmark */}
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{
                    type: 'spring',
                    stiffness: 400,
                    damping: 15,
                    delay: 0.2,
                  }}
                  className="mb-4"
                >
                  <div className="w-16 h-16 bg-[#059669] rounded-full flex items-center justify-center">
                    <CheckCircle2 className="w-10 h-10 text-white" />
                  </div>
                </motion.div>

                {/* Success message */}
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Project Created!
                </h3>
                {projectName && (
                  <p className="text-sm text-gray-600">
                    {projectName} is ready to go
                  </p>
                )}
              </motion.div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
