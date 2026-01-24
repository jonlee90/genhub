"use client";

import { useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { m as motion, AnimatePresence, useReducedMotion } from "framer-motion";
import {
  X,
  Receipt,
  Users,
  Settings,
  Bell,
  LogOut,
  HardHat,
  MessageSquare,
  Zap,
  Shield,
} from "lucide-react";
import { cn, getInitials } from "@/lib/utils";
import { signOut } from "next-auth/react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ThemeSegmentToggle } from "@/components/app/MoreMenu/ThemeSegmentToggle";
import type { Session } from "next-auth";

// Navigation grid items - designed for quick access
const navGridItems = [
  {
    name: "Expenses",
    href: "/app/expenses",
    icon: Receipt,
    color: "from-emerald-500 to-emerald-600",
    iconBg: "bg-emerald-500/20",
    description: "Expenses",
  },
  {
    name: "Chat",
    href: "/app/chat",
    icon: MessageSquare,
    color: "from-blue-500 to-blue-600",
    iconBg: "bg-blue-500/20",
    description: "Messages",
  },
  {
    name: "Team",
    href: "/app/team",
    icon: Users,
    color: "from-violet-500 to-violet-600",
    iconBg: "bg-violet-500/20",
    description: "Crew",
  },
  {
    name: "Subs",
    href: "/app/team/subcontractors",
    icon: HardHat,
    color: "from-amber-500 to-amber-600",
    iconBg: "bg-amber-500/20",
    description: "Contractors",
  },
  {
    name: "Alerts",
    href: "/app/notifications",
    icon: Bell,
    color: "from-rose-500 to-rose-600",
    iconBg: "bg-rose-500/20",
    description: "Notifications",
  },
  {
    name: "Settings",
    href: "/app/settings",
    icon: Settings,
    color: "from-slate-500 to-slate-600",
    iconBg: "bg-slate-500/20",
    description: "Preferences",
  },
];

interface MoreMenuProps {
  isOpen: boolean;
  onClose: () => void;
  session: Session | null;
}

export function MoreMenu({ isOpen, onClose, session }: MoreMenuProps) {
  const pathname = usePathname();
  const shouldReduceMotion = useReducedMotion();

  // Lock body scroll when menu is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  // Close on ESC key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen, onClose]);

  // Check if current path matches nav item
  const isActive = (href: string) => {
    return pathname.startsWith(href);
  };

  const handleSignOut = async () => {
    onClose();
    await signOut({ callbackUrl: "/" });
  };

  // Animation variants with reduced motion support
  const backdropVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
  } as const;

  const panelVariants = {
    hidden: { y: "100%", opacity: 0.5 },
    visible: {
      y: 0,
      opacity: 1,
      transition: shouldReduceMotion
        ? { duration: 0.1 }
        : {
            type: "spring" as const,
            damping: 28,
            stiffness: 350,
            mass: 0.8,
          },
    },
    exit: {
      y: "100%",
      opacity: 0,
      transition: shouldReduceMotion
        ? { duration: 0.1 }
        : {
            type: "spring" as const,
            damping: 35,
            stiffness: 400,
          },
    },
  };

  const gridItemVariants = {
    hidden: { opacity: 0, scale: 0.8, y: 20 },
    visible: (i: number) => ({
      opacity: 1,
      scale: 1,
      y: 0,
      transition: shouldReduceMotion
        ? { duration: 0 }
        : {
            type: "spring" as const,
            damping: 20,
            stiffness: 300,
            delay: i * 0.04,
          },
    }),
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop with blur */}
          <motion.div
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm md:hidden"
            variants={backdropVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
            transition={{ duration: 0.2 }}
            onClick={onClose}
            role="presentation"
          />

          {/* Control Panel Menu - Glassmorphism Design */}
          <motion.div
            className="fixed inset-x-0 bottom-0 z-50 md:hidden"
            variants={panelVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            role="dialog"
            aria-modal="true"
            aria-label="More menu"
            style={{
              paddingBottom: "env(safe-area-inset-bottom, 0px)",
            }}
          >
            <div className="relative bg-white/80 dark:bg-gray-900/90 backdrop-blur-xl rounded-t-[32px] shadow-2xl overflow-hidden max-h-[85vh] flex flex-col">
              {/* Industrial top edge - gradient accent */}
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-construction-blue via-[#0a3a8a] to-construction-blue" />

              {/* Drag handle */}
              <div className="flex justify-center pt-3 pb-1">
                <div className="w-10 h-1 rounded-full bg-gray-300/80 dark:bg-gray-600/80" />
              </div>

              {/* Header - Glassmorphism Card */}
              <div className="px-4 pt-2 pb-4">
                <div className="relative overflow-hidden rounded-2xl bg-white/60 dark:bg-gray-800/70 backdrop-blur-lg border border-white/30 dark:border-white/5 shadow-lg">
                  {/* Subtle gradient overlay */}
                  <div className="absolute inset-0 bg-gradient-to-br from-construction-blue/5 via-transparent to-construction-blue/10 dark:from-construction-blue/10 dark:to-construction-blue/5" />

                  <div className="relative p-4">
                    {/* Header row: Logo, Theme Toggle, Close */}
                    <div className="flex items-center justify-between mb-4">
                      {/* Logo and branding */}
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-construction-blue to-[#002d7a] flex items-center justify-center shadow-md">
                            <Image
                              src="/icon-192.png"
                              alt="GenHub"
                              width={28}
                              height={28}
                              className="object-contain"
                            />
                          </div>
                          {/* Status indicator */}
                          <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-white dark:border-gray-800 flex items-center justify-center">
                            <Zap className="w-2 h-2 text-white" />
                          </div>
                        </div>
                        <div>
                          <h2 className="text-lg font-black text-gray-900 dark:text-white tracking-tight">
                            GenHub
                          </h2>
                          <div className="flex items-center gap-1.5">
                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            <span className="text-[11px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                              System Active
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Theme Toggle & Close Button */}
                      <div className="flex items-center gap-2">
                        <ThemeSegmentToggle size="sm" />
                        <button
                          onClick={onClose}
                          className="p-2.5 rounded-xl bg-gray-100/80 dark:bg-gray-700/80 hover:bg-gray-200 dark:hover:bg-gray-600 active:bg-gray-300 dark:active:bg-gray-500 active:scale-[0.92] transition-all"
                          aria-label="Close menu"
                        >
                          <X className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                        </button>
                      </div>
                    </div>

                    {/* User profile card */}
                    {session?.user && (
                      <motion.div
                        className="flex items-center gap-3 p-3 bg-gray-50/80 dark:bg-gray-700/50 backdrop-blur-sm rounded-xl border border-gray-200/50 dark:border-gray-600/30"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={
                          shouldReduceMotion
                            ? { duration: 0 }
                            : {
                                delay: 0.15,
                                type: "spring",
                                damping: 20,
                              }
                        }
                      >
                        <div className="relative">
                          <Avatar className="h-11 w-11 ring-2 ring-gray-200 dark:ring-gray-600">
                            <AvatarImage
                              src={session.user.image || undefined}
                            />
                            <AvatarFallback className="bg-gradient-to-br from-amber-400 to-orange-500 text-white font-black text-sm">
                              {session.user.name
                                ? getInitials(session.user.name)
                                : "U"}
                            </AvatarFallback>
                          </Avatar>
                          <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-emerald-500 border-2 border-white dark:border-gray-700 flex items-center justify-center">
                            <Shield className="w-2 h-2 text-white" />
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-gray-900 dark:text-white truncate">
                            {session.user.name || "User"}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 truncate font-medium">
                            {session.user.email}
                          </p>
                        </div>
                        <div className="flex flex-col items-end gap-0.5">
                          <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
                            Online
                          </span>
                          <span className="text-[10px] text-gray-400 dark:text-gray-500 font-medium">
                            Contractor
                          </span>
                        </div>
                      </motion.div>
                    )}
                  </div>
                </div>
              </div>

              {/* Navigation Grid - Refined glassmorphism */}
              <nav className="flex-1 overflow-y-auto px-4 pb-3">
                <div className="grid grid-cols-3 gap-3">
                  {navGridItems.map((item, index) => {
                    const active = isActive(item.href);
                    const Icon = item.icon;

                    return (
                      <motion.div
                        key={item.name}
                        custom={index}
                        variants={gridItemVariants}
                        initial="hidden"
                        animate="visible"
                      >
                        <Link
                          href={item.href}
                          onClick={onClose}
                          className={cn(
                            "relative flex flex-col items-center justify-center",
                            "aspect-square rounded-2xl",
                            "transition-all duration-150",
                            "active:scale-[0.96]",
                            active
                              ? "bg-construction-blue shadow-lg shadow-construction-blue/25"
                              : "bg-gray-50/80 dark:bg-gray-800/60 backdrop-blur-sm hover:bg-gray-100 dark:hover:bg-gray-700/70 active:bg-gray-200 dark:active:bg-gray-600 border border-gray-200/50 dark:border-gray-700/50"
                          )}
                        >
                          {/* Active indicator glow */}
                          {active && (
                            <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-white/20 to-transparent" />
                          )}

                          {/* Icon container */}
                          <div
                            className={cn(
                              "flex items-center justify-center w-11 h-11 rounded-xl mb-1.5",
                              "transition-all duration-150",
                              active
                                ? "bg-white/20 text-white"
                                : `${item.iconBg} text-gray-700 dark:text-gray-300`
                            )}
                          >
                            <Icon
                              className={cn(
                                "w-6 h-6",
                                active && "text-white drop-shadow-sm"
                              )}
                              strokeWidth={active ? 2.5 : 2}
                            />
                          </div>

                          {/* Label */}
                          <span
                            className={cn(
                              "text-[11px] font-bold tracking-wide",
                              active
                                ? "text-white"
                                : "text-gray-700 dark:text-gray-300"
                            )}
                          >
                            {item.name}
                          </span>

                          {/* Active corner badge */}
                          {active && (
                            <motion.div
                              className="absolute top-2 right-2 w-2 h-2 rounded-full bg-white shadow-sm"
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              transition={
                                shouldReduceMotion
                                  ? { duration: 0 }
                                  : { type: "spring", delay: 0.2 }
                              }
                            />
                          )}
                        </Link>
                      </motion.div>
                    );
                  })}
                </div>
              </nav>

              {/* Footer - Sign Out */}
              <div className="px-4 pt-3 pb-5 border-t border-gray-200/50 dark:border-gray-700/50">
                <button
                  onClick={handleSignOut}
                  className={cn(
                    "flex items-center justify-center gap-2.5 w-full",
                    "h-14 rounded-xl",
                    "bg-gray-50/80 dark:bg-gray-800/60 backdrop-blur-sm",
                    "hover:bg-gray-100 dark:hover:bg-gray-700/70",
                    "active:bg-gray-200 dark:active:bg-gray-600",
                    "border border-gray-200/50 dark:border-gray-700/50",
                    "text-gray-700 dark:text-gray-300 font-bold",
                    "active:scale-[0.98] transition-all duration-150"
                  )}
                >
                  <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-gray-200/80 dark:bg-gray-700/80">
                    <LogOut className="w-5 h-5" />
                  </div>
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
