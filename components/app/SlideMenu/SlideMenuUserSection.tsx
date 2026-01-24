"use client";

import { useCallback } from "react";
import { m as motion } from "framer-motion";
import { X } from "lucide-react";
import { getInitials } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useTheme, type ThemePreference } from "@/lib/context/ThemeContext";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { SlideMenuThemeToggle } from "./SlideMenuThemeToggle";
import {
  userSectionVariants,
  userSectionTransition,
  reducedMotionVariants,
  reducedMotionTransition,
} from "./animations";
import type { SlideMenuUserSectionProps } from "./types";

export function SlideMenuUserSection({
  user,
  onClose,
}: SlideMenuUserSectionProps) {
  const shouldReduceMotion = useReducedMotion();
  const { preference, setPreference } = useTheme();

  const variants = shouldReduceMotion
    ? reducedMotionVariants.userSection
    : userSectionVariants;
  const transition = shouldReduceMotion
    ? reducedMotionTransition
    : userSectionTransition;

  // Toggle between light and dark only
  const handleThemeToggle = useCallback(() => {
    setPreference(preference === "light" ? "dark" : "light");
  }, [preference, setPreference]);

  return (
    <motion.div
      className="relative flex flex-col gap-4 px-5 py-5 border-b border-gray-200 dark:border-gray-800"
      variants={variants}
      initial="initial"
      animate="animate"
      transition={transition}
    >
      {/* Top row: Avatar, User info, Close button */}
      <div className="flex items-center gap-4">
        {/* Avatar */}
        <Avatar className="h-14 w-14 ring-2 ring-[#001B51]/20 dark:ring-white/20 shrink-0">
          <AvatarImage src={user?.image || undefined} />
          <AvatarFallback className="bg-blue-600 text-white font-bold">
            {user?.name ? getInitials(user.name) : "U"}
          </AvatarFallback>
        </Avatar>

        {/* User info */}
        <div className="flex-1 min-w-0 pr-8">
          <h3 className="text-base font-bold text-gray-900 dark:text-gray-100 truncate">
            {user?.name || "User"}
          </h3>
          {/* Role badge - pill-shaped */}
          <span className="inline-block mt-1 px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wide bg-[#001B51]/10 dark:bg-white/10 text-[#001B51] dark:text-white">
            Contractor
          </span>
        </div>

        {/* Close button - glassmorphic circular (44px touch target) */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 w-11 h-11 rounded-full flex items-center justify-center bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm border border-white/30 dark:border-white/10 active:scale-[0.96] active:bg-white/50 dark:active:bg-gray-800/50 transition-all duration-150"
          aria-label="Close menu"
        >
          <X className="w-5 h-5 text-gray-600 dark:text-gray-400" />
        </button>
      </div>

      {/* Theme toggle - below user info */}
      <div className="flex items-center justify-center pt-1">
        <SlideMenuThemeToggle preference={preference} onToggle={handleThemeToggle} />
      </div>
    </motion.div>
  );
}
