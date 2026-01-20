"use client";

import { useCallback, useEffect, useState } from "react";
import { registerServiceWorker, skipWaiting } from "@/lib/service-worker";
import type { ServiceWorkerStatus } from "@/lib/service-worker";
import { m as motion, AnimatePresence } from "framer-motion";
import { RefreshCw, X, Download } from "lucide-react";

/**
 * Service Worker Registration Component
 *
 * Handles service worker registration and update notifications.
 * Displays a toast notification when an update is available.
 *
 * Features:
 * - Auto-registration on mount
 * - Update detection and prompts
 * - Manual update trigger
 * - GenHub construction-themed UI
 */
export function ServiceWorkerRegistration() {
  const [registration, setRegistration] =
    useState<ServiceWorkerRegistration | null>(null);
  const [showUpdatePrompt, setShowUpdatePrompt] = useState(false);

  useEffect(() => {
    // Only run in browser
    if (typeof window === "undefined") {
      return;
    }

    // Register service worker
    registerServiceWorker((state) => {
      if (state.registration) {
        setRegistration(state.registration);
      }

      // Show update prompt when new version is available
      if (state.status === "updated") {
        setShowUpdatePrompt(true);
      }
    });
  }, []);

  // Handle update acceptance
  const handleUpdate = useCallback(() => {
    if (registration) {
      skipWaiting(registration);
      setShowUpdatePrompt(false);
    }
  }, [registration]);

  // Handle update dismissal
  const handleDismiss = useCallback(() => {
    setShowUpdatePrompt(false);
  }, []);

  // Don't render anything if no update is available
  if (!showUpdatePrompt) {
    return null;
  }

  return (
    <AnimatePresence>
      {showUpdatePrompt && (
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 50 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className="fixed bottom-6 right-6 z-50 max-w-md"
        >
          {/* Update notification card */}
          <div className="bg-white rounded-xl shadow-construction-lg border-2 border-construction-blue/20 p-6 overflow-hidden relative">
            {/* Decorative accent bar */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-construction-blue to-construction-accent" />

            {/* Close button */}
            <button
              onClick={handleDismiss}
              className="absolute top-4 right-4 p-1 rounded-lg hover:bg-gray-100 transition-colors"
              aria-label="Dismiss update"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>

            {/* Icon */}
            <motion.div
              className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-construction-blue/10 border-2 border-construction-blue/20 mb-4"
              animate={{ rotate: [0, 360] }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "linear",
              }}
            >
              <Download className="w-6 h-6 text-construction-blue" />
            </motion.div>

            {/* Title */}
            <h3 className="text-lg font-black text-construction-blue mb-2 uppercase">
              Update Available
            </h3>

            {/* Description */}
            <p className="text-sm text-gray-600 font-medium mb-6">
              A new version of GenHub is ready. Update now to get the latest
              features and improvements.
            </p>

            {/* Actions */}
            <div className="flex gap-3">
              <motion.button
                onClick={handleUpdate}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-construction-blue hover:bg-construction-blue/90 text-white rounded-lg font-bold text-sm uppercase tracking-wide transition-colors shadow-construction"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <RefreshCw className="w-4 h-4" />
                Update Now
              </motion.button>

              <motion.button
                onClick={handleDismiss}
                className="px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-bold text-sm uppercase tracking-wide transition-colors"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                Later
              </motion.button>
            </div>

            {/* Pulsing indicator */}
            <motion.div
              className="absolute -bottom-1 -left-1 w-3 h-3 bg-construction-accent rounded-full"
              animate={{
                scale: [1, 1.5, 1],
                opacity: [1, 0.5, 1],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/**
 * Lightweight Service Worker Registration Hook
 *
 * For use in components where you just need status info
 */
export function useServiceWorkerStatus() {
  const [status, setStatus] = useState<ServiceWorkerStatus>("registering");

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    registerServiceWorker((state) => {
      setStatus(state.status);
    });
  }, []);

  return status;
}
