"use client";

import { useState } from "react";
import { m as motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { ChevronLeft, LucideIcon } from "lucide-react";

export interface SidebarLink {
  label: string;
  href: string;
  icon: LucideIcon;
  description?: string;
  badge?: number | string;
}

interface SidebarProps {
  links: SidebarLink[];
  className?: string;
  open?: boolean;
  setOpen?: (open: boolean) => void;
  animate?: boolean;
}

export function Sidebar({
  links,
  className,
  open: controlledOpen,
  setOpen: setControlledOpen,
  animate = true,
}: SidebarProps) {
  const [internalOpen, setInternalOpen] = useState(true);
  const pathname = usePathname();

  // Use controlled state if provided, otherwise use internal state
  const isOpen = controlledOpen !== undefined ? controlledOpen : internalOpen;
  const setIsOpen = setControlledOpen !== undefined ? setControlledOpen : setInternalOpen;

  return (
    <motion.div
      animate={{
        width: animate ? (isOpen ? "280px" : "80px") : "280px",
      }}
      transition={{
        duration: 0.3,
        type: "spring",
        stiffness: 300,
        damping: 30,
      }}
      className={cn(
        "relative flex flex-col h-full bg-white dark:bg-gray-900 border-r-2 border-gray-200 dark:border-gray-800 shadow-construction-lg",
        className
      )}
    >
      {/* Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "absolute -right-3 top-6 z-50",
          "w-6 h-6 rounded-full",
          "bg-construction-blue dark:bg-blue-600 text-white dark:text-white",
          "flex items-center justify-center",
          "shadow-glow hover:shadow-glow-active",
          "transition-all duration-200",
          "hover:scale-110"
        )}
        aria-label={isOpen ? "Collapse sidebar" : "Expand sidebar"}
      >
        <motion.div
          animate={{ rotate: isOpen ? 0 : 180 }}
          transition={{ duration: 0.3 }}
        >
          <ChevronLeft className="w-4 h-4" />
        </motion.div>
      </button>

      {/* Navigation Links */}
      <nav className="flex-1 p-4 space-y-2">
        {links.map((link) => {
          const isActive =
            pathname === link.href ||
            (link.href !== "/" && pathname.startsWith(link.href));

          return (
            <Link key={link.href} href={link.href}>
              <motion.div
                className={cn(
                  "relative flex items-center gap-3 px-4 py-3 rounded-lg",
                  "transition-all cursor-pointer",
                  "group",
                  isActive
                    ? "bg-construction-blue/10 dark:bg-construction-blue/20 shadow-glow-active"
                    : "hover:bg-gray-100 dark:hover:bg-gray-800"
                )}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                {/* Active Indicator */}
                {isActive && (
                  <motion.div
                    layoutId="activeIndicator"
                    className="absolute left-0 top-0 bottom-0 w-1 bg-construction-blue rounded-r-full"
                    transition={{
                      type: "spring",
                      stiffness: 300,
                      damping: 30,
                    }}
                  />
                )}

                {/* Icon */}
                <link.icon
                  className={cn(
                    "h-5 w-5 flex-shrink-0 transition-colors",
                    isActive
                      ? "text-construction-blue dark:text-blue-400"
                      : "text-gray-600 dark:text-gray-400 group-hover:text-construction-blue dark:group-hover:text-blue-400"
                  )}
                />

                {/* Label & Description */}
                <AnimatePresence mode="wait">
                  {isOpen && (
                    <motion.div
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -10 }}
                      transition={{ duration: 0.2 }}
                      className="flex-1 min-w-0"
                    >
                      <div
                        className={cn(
                          "font-bold text-sm truncate",
                          isActive
                            ? "text-construction-blue dark:text-blue-400"
                            : "text-gray-700 dark:text-gray-300 group-hover:text-construction-blue dark:group-hover:text-blue-400"
                        )}
                      >
                        {link.label}
                      </div>
                      {link.description && (
                        <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                          {link.description}
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Badge */}
                {link.badge && isOpen && (
                  <AnimatePresence>
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      exit={{ scale: 0 }}
                      className="px-2 py-0.5 bg-construction-accent dark:bg-amber-600 text-white dark:text-white text-xs font-bold rounded-full"
                    >
                      {link.badge}
                    </motion.div>
                  </AnimatePresence>
                )}
              </motion.div>
            </Link>
          );
        })}
      </nav>
    </motion.div>
  );
}

export function SidebarLink({
  link,
  isOpen,
  isActive,
}: {
  link: SidebarLink;
  isOpen: boolean;
  isActive: boolean;
}) {
  return (
    <Link href={link.href}>
      <motion.div
        className={cn(
          "relative flex items-center gap-3 px-4 py-3 rounded-lg",
          "transition-all cursor-pointer group",
          isActive
            ? "bg-construction-blue/10 dark:bg-construction-blue/20 shadow-glow-active"
            : "hover:bg-gray-100 dark:hover:bg-gray-800"
        )}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        {isActive && (
          <motion.div
            layoutId="activeIndicator"
            className="absolute left-0 top-0 bottom-0 w-1 bg-construction-blue rounded-r-full"
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
          />
        )}

        <link.icon
          className={cn(
            "h-5 w-5 flex-shrink-0 transition-colors",
            isActive ? "text-construction-blue" : "text-gray-600 group-hover:text-construction-blue"
          )}
        />

        <AnimatePresence mode="wait">
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.2 }}
              className="flex-1 min-w-0"
            >
              <div
                className={cn(
                  "font-bold text-sm truncate",
                  isActive ? "text-construction-blue" : "text-gray-700 group-hover:text-construction-blue"
                )}
              >
                {link.label}
              </div>
              {link.description && (
                <div className="text-xs text-gray-500 truncate">
                  {link.description}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {link.badge && isOpen && (
          <AnimatePresence>
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              className="px-2 py-0.5 bg-construction-accent text-white text-xs font-bold rounded-full"
            >
              {link.badge}
            </motion.div>
          </AnimatePresence>
        )}
      </motion.div>
    </Link>
  );
}
