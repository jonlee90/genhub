'use client';

import { useState, useEffect } from 'react';
import { usePushNotifications } from '@/lib/hooks/usePushNotifications';
import { Bell, X, HardHat } from 'lucide-react';
import { m as motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

/**
 * PushPermissionPrompt - Construction-themed push notification opt-in banner
 * Design: Safety signage with diagonal stripes and high-visibility styling
 */
export function PushPermissionPrompt() {
  const { permission, requestPermission } = usePushNotifications();
  const [isVisible, setIsVisible] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  console.log('[PushPermissionPrompt] Current state:', { permission, isVisible, isDismissed });

  useEffect(() => {
    // Show prompt if permission is not granted and not dismissed
    const dismissed = localStorage.getItem('push-prompt-dismissed');
    console.log('[PushPermissionPrompt] Checking visibility:', {
      permission,
      dismissed,
      shouldShow: permission === 'default' && !dismissed
    });

    if (permission === 'default' && !dismissed) {
      // Delay showing the prompt slightly for better UX
      const timer = setTimeout(() => {
        console.log('[PushPermissionPrompt] Showing prompt');
        setIsVisible(true);
      }, 1000);

      return () => clearTimeout(timer);
    } else {
      setIsVisible(false);
    }
  }, [permission]);

  const handleAllow = async () => {
    console.log('[PushPermissionPrompt] Allow clicked');
    await requestPermission();
    setIsVisible(false);
  };

  const handleDismiss = () => {
    console.log('[PushPermissionPrompt] Dismiss clicked');
    setIsVisible(false);
    setIsDismissed(true);
    localStorage.setItem('push-prompt-dismissed', 'true');
  };

  const handleLater = () => {
    console.log('[PushPermissionPrompt] Maybe later clicked');
    setIsVisible(false);
    // Don't set dismissed flag so it can show again later
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: -100 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -100 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 max-w-lg w-full mx-4"
        >
          <div className="relative overflow-hidden rounded-lg border-4 border-[#FFB627] bg-white shadow-2xl">
            {/* Diagonal hazard stripes border */}
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                backgroundImage: `repeating-linear-gradient(
                  -45deg,
                  #FFB627,
                  #FFB627 10px,
                  #001B51 10px,
                  #001B51 20px
                )`,
                WebkitMask: 'linear-gradient(white 0 0) content-box, linear-gradient(white 0 0)',
                WebkitMaskComposite: 'xor',
                maskComposite: 'exclude',
                padding: '4px'
              }}
            />

            {/* Close button */}
            <button
              onClick={handleDismiss}
              className={cn(
                "absolute top-3 right-3 z-10",
                "p-1.5 bg-gray-100 hover:bg-gray-200 rounded-full",
                "transition-colors duration-150"
              )}
              aria-label="Dismiss notification prompt"
            >
              <X className="h-4 w-4 text-[#3C3C3C]" />
            </button>

            <div className="relative p-6">
              <div className="flex items-start gap-4">
                {/* Icon with safety helmet theme */}
                <div className="relative flex-shrink-0">
                  {/* Rotating gear background */}
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
                    className="absolute inset-0 bg-gradient-to-br from-[#FFB627] to-[#FF8C00] rounded-full"
                  />

                  <div className="relative p-4 bg-gradient-to-br from-[#FFB627] to-[#FF8C00] rounded-full shadow-lg">
                    <Bell className="h-8 w-8 text-[#001B51]" />
                    {/* Pulsing indicator */}
                    <motion.div
                      animate={{ scale: [1, 1.2, 1], opacity: [0.7, 0, 0.7] }}
                      transition={{ duration: 2, repeat: Infinity }}
                      className="absolute -top-1 -right-1 w-3 h-3 bg-[#DC2626] rounded-full"
                    />
                  </div>
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  {/* Header with construction badge */}
                  <div className="flex items-center gap-2 mb-2">
                    <HardHat className="h-5 w-5 text-[#001B51]" />
                    <h3 className="text-xl font-black text-[#001B51] uppercase tracking-wide font-['Work_Sans']">
                      Stay Connected On-Site
                    </h3>
                  </div>

                  <p className="text-sm text-[#3C3C3C] mb-4 leading-relaxed font-['IBM_Plex_Mono']">
                    Enable instant push notifications to receive critical job site updates,
                    @mentions, and urgent messages—even when the app is closed.
                    Never miss important communications.
                  </p>

                  {/* Action buttons */}
                  <div className="flex gap-3">
                    <button
                      onClick={handleAllow}
                      className={cn(
                        "flex-1 px-4 py-3 rounded-lg font-bold uppercase text-sm tracking-wide",
                        "bg-gradient-to-r from-[#001B51] to-[#003080]",
                        "text-white shadow-lg",
                        "hover:shadow-xl hover:scale-105",
                        "active:scale-95",
                        "transition-all duration-150",
                        "font-['Work_Sans']",
                        "relative overflow-hidden group"
                      )}
                    >
                      {/* Shimmer effect */}
                      <motion.div
                        animate={{ x: ['-200%', '200%'] }}
                        transition={{ duration: 2, repeat: Infinity, repeatDelay: 1 }}
                        className="absolute inset-0 w-1/2 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                      />
                      <span className="relative z-10 flex items-center justify-center gap-2">
                        <Bell className="h-4 w-4" />
                        Enable Alerts
                      </span>
                    </button>

                    <button
                      onClick={handleLater}
                      className={cn(
                        "px-4 py-3 rounded-lg font-bold text-sm",
                        "text-[#3C3C3C] bg-gray-100 hover:bg-gray-200",
                        "transition-colors duration-150",
                        "font-['IBM_Plex_Mono']"
                      )}
                    >
                      Later
                    </button>
                  </div>

                  {/* Additional info */}
                  <div className="mt-3 pt-3 border-t-2 border-[#001B51]/10">
                    <p className="text-xs text-[#7A7A7A] font-['IBM_Plex_Mono']">
                      ✓ Works offline • ✓ Secure & encrypted • ✓ Control in settings
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom safety stripe */}
            <div
              className="h-2 w-full"
              style={{
                backgroundImage: `repeating-linear-gradient(
                  90deg,
                  #FFB627 0px,
                  #FFB627 20px,
                  #001B51 20px,
                  #001B51 40px
                )`
              }}
            />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
