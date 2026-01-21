"use client";

import { m as motion } from "framer-motion";
import { LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import { SlideMenuListItem } from "./SlideMenuListItem";
import {
  listItemVariants,
  prefersReducedMotion,
  reducedMotionVariants,
} from "./animations";
import type { SlideMenuListProps } from "./types";

export function SlideMenuList({
  items,
  onClose,
  currentPath,
}: SlideMenuListProps) {
  // Check if current path matches nav item
  const isActive = (href: string) => {
    return currentPath.startsWith(href);
  };

  const handleSignOut = async () => {
    const { signOut } = await import("next-auth/react");
    onClose();
    await signOut({ callbackUrl: "/" });
  };

  const variants = (
    prefersReducedMotion ? reducedMotionVariants.listItem : listItemVariants
  ) as any;

  return (
    <nav className="flex-1 overflow-y-auto flex flex-col">
      {/* Navigation items */}
      <div className="flex-1">
        {items.map((item, index) => (
          <SlideMenuListItem
            key={item.id}
            item={item}
            isActive={isActive(item.href)}
            onClose={onClose}
            index={index}
          />
        ))}
      </div>

      {/* Sign out button */}
      <motion.button
        onClick={handleSignOut}
        custom={items.length}
        variants={variants}
        initial="initial"
        animate="animate"
        className={cn(
          "flex items-center h-16 px-5 gap-4 w-full",
          "border-t border-gray-200 dark:border-gray-800",
          "transition-colors duration-150",
          "hover:bg-red-50 dark:hover:bg-red-950 active:bg-red-100 dark:active:bg-red-900"
        )}
        style={{
          paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 1.25rem)",
        }}
      >
        {/* Icon container - red theme */}
        <div className="w-10 h-10 rounded-xl bg-red-50 dark:bg-red-950 flex items-center justify-center shrink-0">
          <LogOut className="w-5 h-5 text-red-500 dark:text-red-400" />
        </div>

        {/* Label - red text */}
        <span className="flex-1 text-base font-semibold text-red-600 dark:text-red-400">
          Sign Out
        </span>
      </motion.button>
    </nav>
  );
}
