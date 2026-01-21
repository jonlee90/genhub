"use client";

import { WifiOff, RefreshCw, HardHat, Wifi } from "lucide-react";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { BackgroundBoxes } from "@/components/ui/aceternity/background-boxes";
import { cn } from "@/lib/utils";

/**
 * GenHub Offline Fallback Page
 *
 * Displays when the user is offline and no cached content is available.
 * Features:
 * - Construction-themed offline indicator
 * - Network status monitoring
 * - Retry connection button
 * - Industrial design matching GenHub branding
 */
export default function OfflinePage() {
  const [isOnline, setIsOnline] = useState(false);
  const [isRetrying, setIsRetrying] = useState(false);
  const [lastChecked, setLastChecked] = useState<Date | null>(null);

  // Monitor network status
  useEffect(() => {
    // Check initial status
    setIsOnline(navigator.onLine);

    // Add event listeners
    const handleOnline = () => {
      setIsOnline(true);
      // Auto-reload when connection restored
      setTimeout(() => {
        window.location.reload();
      }, 500);
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // Handle retry connection
  const handleRetry = () => {
    setIsRetrying(true);
    setLastChecked(new Date());

    // Try to fetch a small resource to test connection
    fetch("/manifest.json", { cache: "no-store" })
      .then(() => {
        // Connection successful, reload page
        window.location.reload();
      })
      .catch(() => {
        // Still offline
        setIsRetrying(false);
      });
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-white">
      {/* Industrial Grid Background */}
      <div className="fixed inset-0 pointer-events-none opacity-[0.02] z-0">
        <BackgroundBoxes boxSize={40} className="text-construction-blue" />
      </div>

      {/* Blueprint pattern overlay */}
      <div className="absolute top-0 right-0 w-full h-full opacity-[0.02] pointer-events-none">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `
              linear-gradient(to right, currentColor 1px, transparent 1px),
              linear-gradient(to bottom, currentColor 1px, transparent 1px)
            `,
            backgroundSize: "40px 40px",
            color: "var(--construction-blue)",
          }}
        />
      </div>

      {/* Main Content */}
      <div className="relative z-10 flex items-center justify-center min-h-screen p-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="max-w-2xl w-full"
        >
          {/* Card Container */}
          <div className="bg-white rounded-2xl shadow-construction-lg border-2 border-gray-200 p-12 text-center overflow-hidden relative">
            {/* Decorative corner accent */}
            <div className="absolute top-0 left-0 w-32 h-32 bg-construction-blue/5 rounded-br-full" />
            <div className="absolute bottom-0 right-0 w-32 h-32 bg-construction-accent/5 rounded-tl-full" />

            {/* Status indicator bar */}
            <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-construction-blue via-construction-accent to-construction-blue bg-[length:200%_100%] animate-shimmer" />

            <div className="relative z-10">
              {/* Icon with animation */}
              <motion.div
                className="inline-flex items-center justify-center w-32 h-32 rounded-3xl bg-construction-blue/10 border-4 border-construction-blue/20 mb-8"
                animate={{
                  y: [0, -10, 0],
                  rotate: [0, 5, -5, 0],
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              >
                <div className="relative">
                  {/* Hard hat with WiFi off overlay */}
                  <HardHat className="w-16 h-16 text-construction-blue" />
                  <motion.div
                    className="absolute -top-2 -right-2 bg-white rounded-full p-2 border-2 border-construction-blue/20"
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: "easeInOut",
                    }}
                  >
                    <WifiOff className="w-6 h-6 text-construction-accent" />
                  </motion.div>
                </div>
              </motion.div>

              {/* Title */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
              >
                <h1 className="text-4xl font-black text-construction-blue mb-4 uppercase tracking-tight">
                  Connection Lost
                </h1>

                <div className="h-1 w-24 bg-gradient-to-r from-construction-blue to-construction-accent rounded-full mx-auto mb-6" />
              </motion.div>

              {/* Description */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="mb-8"
              >
                <p className="text-lg text-gray-700 font-semibold mb-3">
                  Unable to connect to GenHub
                </p>
                <p className="text-gray-600 font-medium max-w-md mx-auto">
                  Your device is currently offline. Check your network connection and try again.
                  Your work is safe and will sync when you're back online.
                </p>
              </motion.div>

              {/* Network Status */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="mb-8"
              >
                <div
                  className={cn(
                    "inline-flex items-center gap-3 px-6 py-3 rounded-full border-2 font-bold text-sm uppercase tracking-wider transition-all",
                    isOnline
                      ? "bg-construction-green/10 border-construction-green/30 text-construction-green"
                      : "bg-gray-100 border-gray-300 text-gray-600"
                  )}
                >
                  {isOnline ? (
                    <>
                      <Wifi className="w-5 h-5" />
                      <span>Connection Restored</span>
                    </>
                  ) : (
                    <>
                      <WifiOff className="w-5 h-5" />
                      <span>No Connection</span>
                    </>
                  )}
                </div>

                {lastChecked && (
                  <p className="text-xs text-gray-500 mt-3 font-medium">
                    Last checked: {lastChecked.toLocaleTimeString()}
                  </p>
                )}
              </motion.div>

              {/* Retry Button */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
              >
                <motion.button
                  onClick={handleRetry}
                  disabled={isRetrying}
                  className={cn(
                    "group relative inline-flex items-center gap-3 px-8 py-4 rounded-xl font-black text-white uppercase tracking-wide transition-all overflow-hidden",
                    "bg-construction-blue hover:bg-construction-blue/90",
                    "shadow-construction hover:shadow-construction-lg",
                    "disabled:opacity-50 disabled:cursor-not-allowed",
                    "border-2 border-construction-blue/20"
                  )}
                  whileHover={{ scale: isRetrying ? 1 : 1.05 }}
                  whileTap={{ scale: isRetrying ? 1 : 0.95 }}
                >
                  {/* Button background animation */}
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-construction-blue to-construction-accent"
                    initial={{ x: "-100%" }}
                    whileHover={{ x: 0 }}
                    transition={{ duration: 0.3 }}
                  />

                  <span className="relative z-10 flex items-center gap-3">
                    <RefreshCw
                      className={cn("w-5 h-5", isRetrying && "animate-spin")}
                    />
                    {isRetrying ? "Connecting..." : "Retry Connection"}
                  </span>
                </motion.button>
              </motion.div>

              {/* Helpful tips */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
                className="mt-12 pt-8 border-t-2 border-gray-200"
              >
                <p className="text-xs uppercase font-black text-gray-500 tracking-wider mb-4">
                  Troubleshooting Tips
                </p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-left">
                  <div className="flex gap-3">
                    <div className="w-8 h-8 rounded-lg bg-construction-blue/10 border-2 border-construction-blue/20 flex items-center justify-center flex-shrink-0">
                      <span className="text-construction-blue font-black">1</span>
                    </div>
                    <div>
                      <p className="text-sm font-bold text-gray-700">Check WiFi</p>
                      <p className="text-xs text-gray-600">Ensure WiFi is enabled</p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <div className="w-8 h-8 rounded-lg bg-construction-blue/10 border-2 border-construction-blue/20 flex items-center justify-center flex-shrink-0">
                      <span className="text-construction-blue font-black">2</span>
                    </div>
                    <div>
                      <p className="text-sm font-bold text-gray-700">Airplane Mode</p>
                      <p className="text-xs text-gray-600">Turn off airplane mode</p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <div className="w-8 h-8 rounded-lg bg-construction-blue/10 border-2 border-construction-blue/20 flex items-center justify-center flex-shrink-0">
                      <span className="text-construction-blue font-black">3</span>
                    </div>
                    <div>
                      <p className="text-sm font-bold text-gray-700">Mobile Data</p>
                      <p className="text-xs text-gray-600">Switch to mobile network</p>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>

          {/* Footer branding */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="text-center mt-8 text-sm font-bold text-gray-500"
          >
            <span className="inline-flex items-center gap-2">
              <HardHat className="w-4 h-4 text-construction-blue" />
              GenHub - Always Ready for Work
            </span>
          </motion.p>
        </motion.div>
      </div>

      {/* Global styles for animations */}
      <style jsx global>{`
        @keyframes shimmer {
          0% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
          100% {
            background-position: 0% 50%;
          }
        }

        .animate-shimmer {
          animation: shimmer 3s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
