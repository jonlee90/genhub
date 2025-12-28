"use client";

import { Menu, X, Bell, LayoutDashboard, FolderKanban, CheckSquare, Users, FileText, BarChart3, Settings } from "lucide-react";
import UserMenu from "@/components/user/UserMenu";
import Link from "next/link";
import Image from "next/image";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { usePathname } from "next/navigation";

// Mobile Navigation with Construction Theme
const mobileNavigation = [
  { name: "Dashboard", href: "/app", icon: LayoutDashboard },
  { name: "Projects", href: "/app/projects", icon: FolderKanban },
  { name: "Tasks", href: "/app/tasks", icon: CheckSquare },
  { name: "Team", href: "/app/team", icon: Users },
  { name: "Reports", href: "/app/reports", icon: FileText },
  { name: "Analytics", href: "/app/analytics", icon: BarChart3 },
  { name: "Settings", href: "/app/settings", icon: Settings },
];

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();
  const notificationCount = 3;

  // Lock body scroll when menu is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [mobileMenuOpen]);

  return (
    <>
      {/* Mobile Header Bar - Clean Construction Theme */}
      <motion.header
        className="relative bg-white border-b border-gray-200 shadow-sm"
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
      >
        {/* Top accent border */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-construction-blue via-construction-accent to-construction-blue" />

        <div className="flex items-center justify-between px-4 py-3 pt-4">
          {/* Menu Button */}
          <motion.button
            className="relative p-2 rounded-lg hover:bg-gray-100 transition-colors"
            aria-label="Toggle menu"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            whileTap={{ scale: 0.95 }}
          >
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={mobileMenuOpen ? "close" : "open"}
                initial={{ rotate: -90, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                exit={{ rotate: 90, opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                {mobileMenuOpen ? (
                  <X size={24} className="text-gray-700" />
                ) : (
                  <Menu size={24} className="text-gray-700" />
                )}
              </motion.div>
            </AnimatePresence>
          </motion.button>

          {/* Center Logo */}
          <Link href="/app/" className="flex items-center gap-2 group">
            <motion.div
              className="flex items-center justify-center w-8 h-8 rounded-lg overflow-hidden"
              whileTap={{ scale: 0.95 }}
            >
              <Image
                src="/icon-192.png"
                alt="GenHub Logo"
                width={32}
                height={32}
                className="object-contain"
              />
            </motion.div>
            <div>
              <h1 className="text-lg font-bold text-gray-900">
                GenHub
              </h1>
            </div>
          </Link>

          {/* Notifications Bell */}
          <motion.div whileTap={{ scale: 0.95 }}>
            <Link
              href="/app/notifications"
              className="relative p-2 rounded-lg hover:bg-gray-100 transition-colors"
              aria-label={`Notifications (${notificationCount} unread)`}
            >
              <Bell size={20} className="text-gray-700" />

              {notificationCount > 0 && (
                <motion.span
                  className="absolute -top-1 -right-1 flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-bold text-white bg-construction-accent rounded-full"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 500, damping: 15 }}
                >
                  {notificationCount}
                </motion.span>
              )}
            </Link>
          </motion.div>
        </div>
      </motion.header>

      {/* Full-Screen Mobile Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            className="fixed inset-0 z-50 md:hidden bg-white"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            {/* Menu Content Container */}
            <motion.div
              className="relative h-full overflow-y-auto"
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
            >
              {/* Header Section */}
              <div className="relative p-6 bg-gradient-to-br from-construction-blue to-blue-700 border-b border-gray-200">
                {/* Top accent border */}
                <div className="absolute top-0 left-0 right-0 h-1 bg-construction-accent" />

                {/* Logo Badge */}
                <motion.div
                  className="mt-4 p-4 bg-white/10 backdrop-blur-sm rounded-xl border border-white/20"
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.1 }}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-lg bg-white/20 flex items-center justify-center overflow-hidden">
                      <Image
                        src="/icon-192.png"
                        alt="GenHub Logo"
                        width={48}
                        height={48}
                        className="object-contain"
                      />
                    </div>
                    <div className="flex-1">
                      <h2 className="text-xl font-bold text-white">
                        GenHub
                      </h2>
                      <p className="text-sm text-white/80">Construction Management</p>
                    </div>
                  </div>
                </motion.div>

                {/* User Profile Section */}
                <motion.div
                  className="mt-4"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  <UserMenu />
                </motion.div>
              </div>

              {/* Navigation Links */}
              <nav className="p-4 space-y-2">
                {mobileNavigation.map((item, index) => {
                  const isActive = pathname === item.href || (item.href !== "/app" && pathname.startsWith(item.href));

                  return (
                    <motion.div
                      key={item.name}
                      initial={{ x: -20, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      transition={{ delay: 0.3 + index * 0.05 }}
                    >
                      <Link
                        href={item.href}
                        className={cn(
                          "relative group flex items-center gap-3 px-4 py-3 rounded-lg transition-all",
                          isActive
                            ? "bg-construction-blue/10 text-construction-blue"
                            : "text-gray-700 hover:bg-gray-100"
                        )}
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        {/* Active indicator */}
                        {isActive && (
                          <motion.div
                            layoutId="activeMobileNav"
                            className="absolute left-0 w-1 h-8 bg-construction-blue rounded-r-full"
                            transition={{ type: "spring", stiffness: 300, damping: 30 }}
                          />
                        )}

                        {/* Icon */}
                        <div className={cn(
                          "flex items-center justify-center w-10 h-10 rounded-lg",
                          isActive
                            ? "bg-construction-blue/10 text-construction-blue"
                            : "bg-gray-100 text-gray-700 group-hover:bg-gray-200"
                        )}>
                          <item.icon className="w-5 h-5" />
                        </div>

                        {/* Label */}
                        <div className="flex-1">
                          <span className={cn(
                            "font-semibold",
                            isActive ? "text-construction-blue" : "text-gray-900"
                          )}>
                            {item.name}
                          </span>
                        </div>
                      </Link>
                    </motion.div>
                  );
                })}
              </nav>

              {/* Footer */}
              <div className="p-6 mt-auto">
                <div className="p-4 bg-gray-50 rounded-lg border border-gray-200 text-center">
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-2 h-2 bg-construction-green rounded-full animate-pulse" />
                    <p className="text-sm font-semibold text-gray-700">
                      System Active
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
