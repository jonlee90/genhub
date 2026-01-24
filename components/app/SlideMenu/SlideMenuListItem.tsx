"use client";

import Link from "next/link";
import { m as motion } from "framer-motion";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import {
  listItemVariants,
  reducedMotionVariants,
  activeIndicatorTransition,
} from "./animations";
import type { SlideMenuListItemProps } from "./types";

export function SlideMenuListItem({
  item,
  isActive,
  onClose,
  index = 0,
}: SlideMenuListItemProps) {
  const Icon = item.icon;
  const shouldReduceMotion = useReducedMotion();

  const variants = (
    shouldReduceMotion ? reducedMotionVariants.listItem : listItemVariants
  ) as any;

  return (
    <motion.div
      custom={index}
      variants={variants}
      initial="initial"
      animate="animate"
      className="relative"
    >
      {/* Active accent bar (left edge, 4px) */}
      {isActive && (
        <motion.div
          layoutId="activeIndicator"
          className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-12 bg-[#001B51] rounded-r-full"
          transition={activeIndicatorTransition}
        />
      )}

      <Link
        href={item.href}
        onClick={onClose}
        className={cn(
          "flex items-center h-14 min-h-[56px] px-5 gap-4",
          "transition-colors duration-150",
          "hover:bg-gray-50 dark:hover:bg-gray-900 active:bg-gray-100 dark:active:bg-gray-800",
          isActive && "bg-gray-50 dark:bg-gray-900"
        )}
        aria-current={isActive ? "page" : undefined}
      >
        {/* Icon container - 44px with gradient background */}
        <div
          className={cn(
            "w-11 h-11 rounded-xl flex items-center justify-center shrink-0",
            item.iconBg,
            "shadow-sm"
          )}
        >
          <Icon
            className="w-5 h-5"
            style={{ color: item.iconColor }}
          />
        </div>

        {/* Label */}
        <span className="flex-1 text-base font-semibold text-gray-900 dark:text-gray-100">
          {item.name}
        </span>

        {/* Chevron */}
        <ChevronRight className="w-5 h-5 text-gray-400 dark:text-gray-600 shrink-0" />
      </Link>
    </motion.div>
  );
}
