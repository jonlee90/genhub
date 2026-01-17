"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { WifiOff, Wifi, Loader2 } from "lucide-react";

/**
 * OfflineBanner Component - Network Status Indicator
 *
 * Monitors online/offline status and displays a banner notification
 * for construction workers in the field with potentially unreliable connections.
 *
 * Features:
 * - Real-time network status monitoring
 * - Immediate offline detection
 * - Auto-hide after reconnection (3 second delay)
 * - Progressive warning states (offline → critical)
 * - Construction-themed warning colors
 * - Slide-down animation from top
 *
 * States:
 * - Online: Hidden
 * - Offline: Yellow/orange warning banner
 * - Reconnecting: Loading spinner with transition message
 * - Critical: Red banner after extended offline (30+ seconds)
 */

type NetworkStatus = "online" | "offline" | "reconnecting" | "critical";

export function OfflineBanner() {
  // Network status state
  const [status, setStatus] = useState<NetworkStatus>("online");
  const [showBanner, setShowBanner] = useState(false);
  const [offlineDuration, setOfflineDuration] = useState(0);
  const hideTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const resetTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Only run in browser
    if (typeof window === "undefined") {
      return;
    }

    // Set initial status based on navigator.onLine
    if (!navigator.onLine) {
      setStatus("offline");
      setShowBanner(true);
    }

    /**
     * Handle offline event
     * Immediately show banner when connection is lost
     */
    const handleOffline = () => {
      if (hideTimeoutRef.current) {
        clearTimeout(hideTimeoutRef.current);
      }
      if (resetTimeoutRef.current) {
        clearTimeout(resetTimeoutRef.current);
      }
      setStatus("offline");
      setShowBanner(true);
      setOfflineDuration(0);
    };

    /**
     * Handle online event
     * Show reconnecting state, then auto-hide after delay
     */
    const handleOnline = () => {
      if (hideTimeoutRef.current) {
        clearTimeout(hideTimeoutRef.current);
      }
      if (resetTimeoutRef.current) {
        clearTimeout(resetTimeoutRef.current);
      }
      setStatus("reconnecting");
      setShowBanner(true);

      hideTimeoutRef.current = setTimeout(() => {
        setShowBanner(false);
        setOfflineDuration(0);

        resetTimeoutRef.current = setTimeout(() => {
          setStatus("online");
        }, 300);
      }, 3000);
    };

    // Add event listeners
    window.addEventListener("offline", handleOffline);
    window.addEventListener("online", handleOnline);

    // Cleanup
    return () => {
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("online", handleOnline);
      if (hideTimeoutRef.current) {
        clearTimeout(hideTimeoutRef.current);
      }
      if (resetTimeoutRef.current) {
        clearTimeout(resetTimeoutRef.current);
      }
    };
  }, []);

  /**
   * Track offline duration for critical state
   * Update every second when offline
   */
  useEffect(() => {
    if (status !== "offline") {
      return;
    }

    const interval = setInterval(() => {
      setOfflineDuration((prev) => {
        const newDuration = prev + 1;

        // Switch to critical state after 30 seconds
        if (newDuration === 30) {
          setStatus("critical");
        }

        return newDuration;
      });
    }, 1000);

    return () => {
      clearInterval(interval);
    };
  }, [status]);

  /**
   * Get banner styling based on current status
   */
  const bannerStyle = useMemo(() => {
    switch (status) {
      case "offline":
        return {
          bg: "bg-amber-500",
          text: "text-white",
          icon: WifiOff,
          message: "You're offline. Some features may be limited.",
        };
      case "critical":
        return {
          bg: "bg-red-600",
          text: "text-white",
          icon: WifiOff,
          message: "Extended offline period. Data sync paused.",
        };
      case "reconnecting":
        return {
          bg: "bg-construction-green",
          text: "text-white",
          icon: Wifi,
          message: "Connection restored. Syncing data...",
        };
      default:
        return {
          bg: "bg-gray-500",
          text: "text-white",
          icon: Wifi,
          message: "Online",
        };
    }
  }, [status]);
  const Icon = bannerStyle.icon;

  // Don't render if banner is hidden
  if (!showBanner) {
    return null;
  }

  return (
    <AnimatePresence>
      {showBanner && (
        <motion.div
          initial={{ y: -100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -100, opacity: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className="fixed top-0 left-0 right-0 z-50"
        >
          {/* Banner */}
          <div
            className={`${bannerStyle.bg} ${bannerStyle.text} shadow-construction-lg relative overflow-hidden`}
          >
            {/* Animated stripe pattern - construction warning tape */}
            <motion.div
              className="absolute inset-0 opacity-10"
              style={{
                backgroundImage: `repeating-linear-gradient(
                  45deg,
                  transparent,
                  transparent 20px,
                  rgba(255, 255, 255, 0.3) 20px,
                  rgba(255, 255, 255, 0.3) 40px
                )`,
              }}
              animate={{
                backgroundPosition: ["0px 0px", "40px 40px"],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "linear",
              }}
            />

            {/* Content */}
            <div className="relative px-4 py-3 flex items-center justify-center gap-3">
              {/* Icon or loading spinner */}
              {status === "reconnecting" ? (
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{
                    duration: 1,
                    repeat: Infinity,
                    ease: "linear",
                  }}
                >
                  <Loader2 className="w-5 h-5" strokeWidth={2.5} />
                </motion.div>
              ) : (
                <motion.div
                  animate={
                    status === "critical"
                      ? {
                          scale: [1, 1.1, 1],
                        }
                      : {}
                  }
                  transition={{
                    duration: 1,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                >
                  <Icon className="w-5 h-5" strokeWidth={2.5} />
                </motion.div>
              )}

              {/* Message */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:gap-2">
                <span className="font-bold text-sm uppercase tracking-wide">
                  {status === "offline" && "Offline"}
                  {status === "critical" && "Critical"}
                  {status === "reconnecting" && "Reconnecting"}
                </span>
                <span className="hidden sm:inline text-white/80">•</span>
                <span className="text-sm font-medium">
                  {bannerStyle.message}
                </span>

                {/* Offline duration indicator for critical state */}
                {status === "critical" && offlineDuration > 0 && (
                  <>
                    <span className="hidden sm:inline text-white/80">•</span>
                    <span className="text-xs font-medium opacity-80">
                      {Math.floor(offlineDuration / 60)}m {offlineDuration % 60}
                      s
                    </span>
                  </>
                )}
              </div>
            </div>

            {/* Bottom accent bar - industrial edge */}
            <div className="h-0.5 bg-black/20" />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
