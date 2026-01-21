"use client";

import Link from "next/link";
import { m as motion } from "framer-motion";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  listItemVariants,
  prefersReducedMotion,
  reducedMotionVariants,
} from "./animations";
import type { SlideMenuListItemProps } from "./types";

export function SlideMenuListItem({
  item,
  isActive,
  onClose,
  index = 0,
}: SlideMenuListItemProps) {
  const Icon = item.icon;
  const variants = (
    prefersReducedMotion ? reducedMotionVariants.listItem : listItemVariants
  ) as any;

  return (
    <motion.div
      custom={index}
      variants={variants}
      initial="initial"
      animate="animate"
    >
      <Link
        href={item.href}
        onClick={onClose}
        className={cn(
          "flex items-center h-16 px-5 gap-4",
          "transition-colors duration-150",
          "hover:bg-gray-50 dark:hover:bg-gray-900 active:bg-gray-100 dark:active:bg-gray-800",
          isActive && "bg-gray-50 dark:bg-gray-900"
        )}
        aria-current={isActive ? "page" : undefined}
      >
        {/* Icon container */}
        <div
          className={cn("w-10 h-10 rounded-xl flex items-center justify-center shrink-0", item.iconBg)}
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
