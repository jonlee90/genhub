"use client";

import { m as motion } from "framer-motion";
import { X } from "lucide-react";
import { getInitials } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  userSectionVariants,
  userSectionTransition,
  prefersReducedMotion,
  reducedMotionVariants,
  reducedMotionTransition,
} from "./animations";
import type { SlideMenuUserSectionProps } from "./types";

export function SlideMenuUserSection({
  user,
  onClose,
}: SlideMenuUserSectionProps) {
  const variants = prefersReducedMotion
    ? reducedMotionVariants.userSection
    : userSectionVariants;
  const transition = prefersReducedMotion
    ? reducedMotionTransition
    : userSectionTransition;

  return (
    <motion.div
      className="relative flex items-center gap-4 px-5 py-5 border-b border-gray-200 dark:border-gray-800"
      variants={variants}
      initial="initial"
      animate="animate"
      transition={transition}
    >
      {/* Close button - top right */}
      <button
        onClick={onClose}
        className="absolute top-5 right-5 p-2.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 active:bg-gray-200 dark:active:bg-gray-700 transition-colors"
        aria-label="Close menu"
      >
        <X className="w-5 h-5 text-gray-600 dark:text-gray-400" />
      </button>

      {/* Avatar */}
      <Avatar className="h-12 w-12 border-2 border-gray-200 dark:border-gray-700 shrink-0">
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
        <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
          Contractor
        </p>
      </div>
    </motion.div>
  );
}
