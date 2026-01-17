"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { X, Download } from "lucide-react";

/**
 * InstallPrompt Component - Construction-Themed PWA Install Banner
 *
 * Detects beforeinstallprompt event and shows a professional install prompt
 * with construction industry branding.
 *
 * Features:
 * - Chrome/Edge beforeinstallprompt event detection
 * - LocalStorage persistence for dismiss state
 * - "Don't show again" functionality
 * - Graceful degradation for unsupported browsers
 * - Construction-themed industrial design
 * - Slide-up animation from bottom
 *
 * Browser Support:
 * - Chrome/Edge: Full support with native install
 * - Safari/Firefox: Gracefully hidden (no beforeinstallprompt)
 */

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export function InstallPrompt() {
  // State management
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [installSource, setInstallSource] = useState<"browser" | "ios" | null>(
    null,
  );
  const promptTimerRef = useRef<NodeJS.Timeout | null>(null);

  const showPromptWithDelay = useCallback(() => {
    if (promptTimerRef.current) {
      clearTimeout(promptTimerRef.current);
    }
    promptTimerRef.current = setTimeout(() => {
      setShowPrompt(true);
    }, 1500);
  }, []);

  useEffect(() => {
    // Only run in browser
    if (typeof window === "undefined") {
      return;
    }

    // Check if user dismissed permanently
    const dismissed = localStorage.getItem("genhub-install-dismissed");
    if (dismissed === "true") {
      return;
    }

    // Check if already installed (standalone mode or installed PWA)
    const isStandalone = window.matchMedia(
      "(display-mode: standalone)",
    ).matches;
    const isInstalledPWA = (window.navigator as any).standalone === true;

    if (isStandalone || isInstalledPWA) {
      setIsInstalled(true);
      return;
    }

    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIOS = /iphone|ipad|ipod/.test(userAgent);

    if (isIOS) {
      setInstallSource("ios");
      showPromptWithDelay();
      return () => {
        if (promptTimerRef.current) {
          clearTimeout(promptTimerRef.current);
        }
      };
    }

    // Listen for beforeinstallprompt event (Chrome/Edge only)
    const handleBeforeInstallPrompt = (e: Event) => {
      // Prevent default mini-infobar
      e.preventDefault();

      // Store event for later use
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setInstallSource("browser");

      // Show custom install prompt after a brief delay (better UX)
      showPromptWithDelay();
    };

    // Listen for successful installation
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setShowPrompt(false);
      setDeferredPrompt(null);
      setInstallSource(null);
    };

    // Add event listeners
    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);

    // Cleanup
    return () => {
      window.removeEventListener(
        "beforeinstallprompt",
        handleBeforeInstallPrompt,
      );
      window.removeEventListener("appinstalled", handleAppInstalled);
      if (promptTimerRef.current) {
        clearTimeout(promptTimerRef.current);
      }
    };
  }, [showPromptWithDelay]);

  const isIOSPrompt = installSource === "ios";

  const installDescription = useMemo(() => {
    if (isIOSPrompt) {
      return "Install GenHub on your iPhone or iPad: tap Share, then Add to Home Screen.";
    }
    return "Access your construction projects offline. Install GenHub for faster performance and desktop access.";
  }, [isIOSPrompt]);

  /**
   * Handle install button click
   * Triggers native browser install prompt
   */
  const handleInstallClick = useCallback(async () => {
    if (!deferredPrompt) {
      return;
    }

    // Show native install prompt
    await deferredPrompt.prompt();

    // Wait for user choice
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === "accepted") {
      setIsInstalled(true);
    }

    // Clear the deferred prompt
    setDeferredPrompt(null);
    setShowPrompt(false);
  }, [deferredPrompt]);

  /**
   * Handle dismiss button click
   * Hides prompt for current session only
   */
  const handleDismiss = useCallback(() => {
    setShowPrompt(false);
  }, []);

  /**
   * Handle "Don't show again" click
   * Permanently dismisses prompt using localStorage
   */
  const handleDontShowAgain = useCallback(() => {
    localStorage.setItem("genhub-install-dismissed", "true");
    setShowPrompt(false);
  }, []);

  // Don't render if prompt shouldn't be shown
  if (!showPrompt || isInstalled) {
    return null;
  }

  return (
    <AnimatePresence>
      {showPrompt && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: "spring", stiffness: 260, damping: 25 }}
          className="fixed bottom-20 left-0 right-0 z-40 px-4 pb-4 sm:bottom-6 sm:left-auto sm:right-6 sm:max-w-md"
        >
          {/* Install prompt card */}
          <div className="relative bg-white rounded-none sm:rounded-lg shadow-construction-xl border-l-8 border-construction-blue overflow-hidden">
            {/* Diagonal stripe accent - construction tape style */}
            <div className="absolute top-0 right-0 w-32 h-32 overflow-hidden opacity-5">
              <div className="absolute transform rotate-45 bg-construction-accent w-4 h-64 -top-16 left-8" />
              <div className="absolute transform rotate-45 bg-construction-accent w-4 h-64 -top-16 left-16" />
              <div className="absolute transform rotate-45 bg-construction-accent w-4 h-64 -top-16 left-24" />
            </div>

            {/* Close button */}
            <button
              onClick={handleDismiss}
              className="absolute top-3 right-3 p-1.5 rounded-md hover:bg-gray-100 transition-colors z-10"
              aria-label="Dismiss install prompt"
            >
              <X className="w-4 h-4 text-gray-500" />
            </button>

            {/* Content */}
            <div className="p-6 pr-12">
              {/* Icon with pulsing indicator */}
              <div className="relative inline-flex items-center justify-center mb-4">
                <div className="relative w-14 h-14 rounded-full bg-white flex items-center justify-center overflow-hidden">
                  <Image
                    src="/icon-192.png"
                    alt="GenHub Logo"
                    width={56}
                    height={56}
                    className="object-contain"
                  />
                </div>
              </div>

              {/* Title - Industrial signage style */}
              <h3 className="text-xl font-black text-construction-blue mb-2 uppercase tracking-tight leading-tight">
                Install GenHub
              </h3>

              {/* Description */}
              <p className="text-sm text-gray-600 font-medium mb-5 leading-relaxed">
                {installDescription}
              </p>

              {/* Action buttons */}
              <div className="flex flex-col gap-2.5">
                {!isIOSPrompt ? (
                  <motion.button
                    onClick={handleInstallClick}
                    className="w-full flex items-center justify-center gap-2.5 px-5 py-3.5 bg-construction-blue hover:bg-construction-blue/90 text-white rounded-md font-bold text-sm uppercase tracking-wide transition-colors shadow-construction relative overflow-hidden group"
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                  >
                    <motion.div
                      className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"
                      initial={{ x: "-100%" }}
                      whileHover={{ x: "100%" }}
                      transition={{ duration: 0.6 }}
                    />
                    <Download className="w-4 h-4 relative z-10" />
                    <span className="relative z-10">Install Now</span>
                  </motion.button>
                ) : (
                  <button
                    onClick={handleDismiss}
                    className="w-full px-5 py-3.5 bg-construction-blue hover:bg-construction-blue/90 text-white rounded-md font-bold text-sm uppercase tracking-wide transition-colors shadow-construction"
                  >
                    Got it
                  </button>
                )}

                <div className="flex gap-2.5">
                  <button
                    onClick={handleDismiss}
                    className="flex-1 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md font-semibold text-xs uppercase tracking-wide transition-colors"
                  >
                    Later
                  </button>
                  <button
                    onClick={handleDontShowAgain}
                    className="flex-1 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md font-semibold text-xs uppercase tracking-wide transition-colors"
                  >
                    Don't Show Again
                  </button>
                </div>
              </div>

              {/* Browser compatibility note */}
              <p className="text-xs text-gray-400 mt-3 font-medium">
                {isIOSPrompt
                  ? "iOS: use Add to Home Screen"
                  : "Chrome and Edge only"}
              </p>

              {/* Action buttons */}
              <div className="flex flex-col gap-2.5">
                {/* Primary install button */}
                <motion.button
                  onClick={handleInstallClick}
                  className="w-full flex items-center justify-center gap-2.5 px-5 py-3.5 bg-construction-blue hover:bg-construction-blue/90 text-white rounded-md font-bold text-sm uppercase tracking-wide transition-colors shadow-construction relative overflow-hidden group"
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                >
                  {/* Animated background shimmer */}
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"
                    initial={{ x: "-100%" }}
                    whileHover={{ x: "100%" }}
                    transition={{ duration: 0.6 }}
                  />
                  <Download className="w-4 h-4 relative z-10" />
                  <span className="relative z-10">Install Now</span>
                </motion.button>

                {/* Secondary actions */}
                <div className="flex gap-2.5">
                  <button
                    onClick={handleDismiss}
                    className="flex-1 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md font-semibold text-xs uppercase tracking-wide transition-colors"
                  >
                    Later
                  </button>
                  <button
                    onClick={handleDontShowAgain}
                    className="flex-1 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md font-semibold text-xs uppercase tracking-wide transition-colors"
                  >
                    Don't Show Again
                  </button>
                </div>
              </div>

              {/* Browser compatibility note */}
              <p className="text-xs text-gray-400 mt-3 font-medium">
                Chrome and Edge only
              </p>
            </div>

            {/* Bottom accent bar */}
            <div className="h-1 bg-gradient-to-r from-construction-blue via-construction-accent to-construction-blue" />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
