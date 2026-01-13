"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import Image from "next/image";
import {
  LayoutDashboard,
  FolderKanban,
  ClipboardList,
  Package,
  Receipt,
  Users,
  Settings,
  Bell,
  Menu,
  X,
  ChevronDown,
  HardHat,
  MessageSquare,
  Building2,
  UserPlus,
  Crown
} from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import UserMenu from "@/components/user/UserMenu";

// Debug: Aceternity UI enhanced sidebar with construction theme
interface NavigationItem {
  name: string;
  href: string;
  icon: any;
  children?: NavigationItem[];
}

const navigation: NavigationItem[] = [
  { name: "Dashboard", href: "/app", icon: LayoutDashboard },
  { name: "Projects", href: "/app/projects", icon: FolderKanban },
  { name: "Tasks", href: "/app/tasks", icon: ClipboardList },
  { name: "Materials", href: "/app/materials", icon: Package },
  { name: "Expenses", href: "/app/expenses", icon: Receipt },
  { name: "Chat", href: "/app/chat", icon: MessageSquare },
  { name: "Team", href: "/app/team", icon: Users },
  { name: "Subcontractors", href: "/app/team/subcontractors", icon: HardHat },
  { name: "Settings", href: "/app/settings", icon: Settings },
];

// Owner-only navigation
const ownerNavigation: NavigationItem[] = [
  { name: "Companies", href: "/app/owner/companies", icon: Building2 },
  { name: "Users", href: "/app/owner/users", icon: Users },
  { name: "Invitations", href: "/app/owner/invites", icon: UserPlus },
];

interface SidebarProps {
  isOwner?: boolean;
}

export function Sidebar({ isOwner = false }: SidebarProps) {
  const pathname = usePathname();
  const notificationCount = 3; // Mock notification count
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>({});

  // Combine navigation with owner navigation if applicable
  const allNavigation = isOwner ? [...navigation, ...ownerNavigation] : navigation;

  // Auto-expand parent items when child routes are active
  useEffect(() => {
    const newExpanded: Record<string, boolean> = {};
    allNavigation.forEach((item) => {
      if (item.children) {
        const isChildActive = item.children.some(
          (child) => pathname === child.href || pathname.startsWith(child.href + "/")
        );
        if (isChildActive) {
          newExpanded[item.name] = true;
        }
      }
    });
    setExpandedItems((prev) => ({ ...prev, ...newExpanded }));
  }, [pathname, isOwner]);

  const toggleExpanded = (itemName: string) => {
    setExpandedItems((prev) => ({
      ...prev,
      [itemName]: !prev[itemName],
    }));
  };

  // Debug: Close mobile menu on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  // Debug: Close mobile menu on ESC key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsMobileMenuOpen(false);
      }
    };

    if (isMobileMenuOpen) {
      document.addEventListener("keydown", handleEscape);
      // Debug: Prevent body scroll when menu is open
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "unset";
    };
  }, [isMobileMenuOpen]);

  return (
    <>

      {/* Debug: Mobile Drawer with AnimatePresence for smooth transitions */}
      <AnimatePresence mode="wait">
        {isMobileMenuOpen && (
          <>
            {/* Debug: Semi-transparent backdrop overlay */}
            <motion.div
              className="md:hidden fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              onClick={() => setIsMobileMenuOpen(false)}
              aria-hidden="true"
            />

            {/* Debug: Sliding drawer from left with construction theme */}
            <motion.aside
              className="md:hidden fixed top-0 left-0 bottom-0 w-[280px] bg-white z-50 shadow-construction-xl overflow-hidden"
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
            >
              {/* Debug: Drawer content - same as desktop sidebar */}
              <div className="relative flex flex-col h-full bg-white/95 backdrop-blur-construction">
                {/* Construction border accent */}
                <div className="absolute top-0 left-0 right-0 h-1 bg-construction-blue" />

                {/* Debug: Top Section - Close button, Logo, Notifications, User Menu */}
                <div className="px-4 py-4 border-b border-gray-200">
                  {/* Debug: Close button - Touch-optimized */}
                  <div className="flex items-center justify-between mb-4">
                    <motion.button
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="flex items-center justify-center w-11 h-11 rounded-lg hover:bg-gray-100 active:bg-gray-200 transition-colors"
                      whileTap={{ scale: 0.95 }}
                      aria-label="Close navigation menu"
                    >
                      <X className="w-6 h-6 text-gray-700" />
                    </motion.button>
                  </div>

                  {/* Logo/Brand */}
                  <div className="flex items-center gap-3">
                    <motion.div
                      className="relative flex items-center justify-center w-10 h-10 rounded-lg overflow-hidden"
                      whileHover={{ scale: 1.1, rotate: 5 }}
                      transition={{ type: "spring", stiffness: 400, damping: 10 }}
                    >
                      <Image
                        src="/icon-192.png"
                        alt="GenHub Logo"
                        width={40}
                        height={40}
                        className="object-contain"
                      />
                      <div className="absolute inset-0 rounded-lg bg-construction-blue/10 animate-glow-pulse" />
                    </motion.div>
                    <div>
                      <h1 className="text-xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                        GenHub
                      </h1>
                      <p className="text-xs text-gray-500 font-medium">Construction Management</p>
                    </div>
                  </div>
                </div>

                {/* Debug: Navigation with touch-optimized spacing */}
                <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
                  {/* Main Navigation */}
                  {navigation.map((item, index) => {
                    // Only active if exact match OR starts with href/ AND no other nav item exactly matches
                    const isActive = pathname === item.href ||
                      (item.href !== "/app" &&
                       pathname.startsWith(item.href + "/") &&
                       !navigation.some(other => other.href !== item.href && pathname === other.href));
                    const hasChildren = item.children && item.children.length > 0;
                    const isExpanded = expandedItems[item.name];
                    const isChildActive = hasChildren && item.children!.some(
                      (child) => pathname === child.href || pathname.startsWith(child.href + "/")
                    );

                    return (
                      <motion.div
                        key={item.name}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05, duration: 0.3 }}
                      >
                        {/* Parent Item */}
                        {hasChildren ? (
                          <button
                            onClick={() => toggleExpanded(item.name)}
                            className={cn(
                              "group relative flex items-center gap-3 px-3 py-3.5 rounded-lg text-base font-medium transition-all duration-300 w-full",
                              isActive || isChildActive
                                ? "bg-gradient-to-r from-construction-blue/10 to-construction-blue/5 text-construction-blue shadow-inner-glow"
                                : "text-gray-700 hover:bg-gradient-to-r hover:to-gray-100 active:bg-gray-200 hover:text-gray-900 hover:shadow-construction"
                            )}
                          >
                            {/* Debug: Active indicator with glow */}
                            {(isActive || isChildActive) && (
                              <motion.div
                                layoutId="activeNavMobile"
                                className="absolute left-0 w-1 h-8 bg-gradient-to-b from-construction-blue to-construction-blue rounded-r-full"
                                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                              />
                            )}

                            {/* Debug: Icon with construction theme - larger for mobile */}
                            <motion.div
                              className={cn(
                                "relative",
                                isActive || isChildActive
                                  ? "text-construction-blue"
                                  : "text-gray-700 group-hover:text-construction-blue"
                              )}
                              whileHover={{ scale: 1.1, rotate: isActive || isChildActive ? 0 : 5 }}
                              transition={{ type: "spring", stiffness: 400, damping: 10 }}
                            >
                              <item.icon className="w-6 h-6 flex-shrink-0" />
                              {(isActive || isChildActive) && (
                                <div className="absolute inset-0 rounded-full bg-construction-blue/20 blur-sm animate-glow-pulse" />
                              )}
                            </motion.div>

                            <span className="relative z-10 flex-1 text-left">{item.name}</span>

                            {/* Chevron Icon */}
                            <motion.div
                              animate={{ rotate: isExpanded ? 180 : 0 }}
                              transition={{ duration: 0.3, ease: "easeInOut" }}
                            >
                              <ChevronDown className="w-5 h-5" />
                            </motion.div>

                            {/* Debug: Hover indicator */}
                            <div className={cn(
                              "absolute inset-0 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300",
                              "bg-gradient-to-r from-construction-blue/5 to-transparent"
                            )} />
                          </button>
                        ) : (
                          <Link
                            href={item.href}
                            className={cn(
                              "group relative flex items-center gap-3 px-3 py-3.5 rounded-lg text-base font-medium transition-all duration-300",
                              isActive
                                ? "bg-gradient-to-r from-construction-blue/10 to-construction-blue/5 text-construction-blue shadow-inner-glow"
                                : "text-gray-700 hover:bg-gradient-to-r hover:to-gray-100 active:bg-gray-200 hover:text-gray-900 hover:shadow-construction"
                            )}
                          >
                            {/* Debug: Active indicator with glow */}
                            {isActive && (
                              <motion.div
                                layoutId="activeNavMobile"
                                className="absolute left-0 w-1 h-8 bg-gradient-to-b from-construction-blue to-construction-blue rounded-r-full"
                                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                              />
                            )}

                            {/* Debug: Icon with construction theme - larger for mobile */}
                            <motion.div
                              className={cn(
                                "relative",
                                isActive
                                  ? "text-construction-blue"
                                  : "text-gray-700 group-hover:text-construction-blue"
                              )}
                              whileHover={{ scale: 1.1, rotate: isActive ? 0 : 5 }}
                              transition={{ type: "spring", stiffness: 400, damping: 10 }}
                            >
                              <item.icon className="w-6 h-6 flex-shrink-0" />
                              {isActive && (
                                <div className="absolute inset-0 rounded-full bg-construction-blue/20 blur-sm animate-glow-pulse" />
                              )}
                            </motion.div>

                            <span className="relative z-10">{item.name}</span>

                            {/* Debug: Hover indicator */}
                            <div className={cn(
                              "absolute inset-0 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300",
                              "bg-gradient-to-r from-construction-blue/5 to-transparent"
                            )} />
                          </Link>
                        )}

                        {/* Child Items - Collapsible */}
                        {hasChildren && (
                          <AnimatePresence>
                            {isExpanded && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: "auto", opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.3, ease: "easeInOut" }}
                                className="overflow-hidden"
                              >
                                <div className="mt-1 space-y-1 pl-4">
                                  {item.children!.map((child, childIndex) => {
                                    const isChildItemActive = pathname === child.href ||
                                      pathname.startsWith(child.href + "/");

                                    return (
                                      <motion.div
                                        key={child.name}
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: childIndex * 0.05, duration: 0.2 }}
                                      >
                                        <Link
                                          href={child.href}
                                          className={cn(
                                            "group relative flex items-center gap-3 px-3 py-3 rounded-lg text-base font-medium transition-all duration-300",
                                            isChildItemActive
                                              ? "bg-gradient-to-r from-construction-blue/10 to-construction-blue/5 text-construction-blue shadow-inner-glow"
                                              : "text-gray-600 hover:bg-gradient-to-r hover:to-gray-100 active:bg-gray-200 hover:text-gray-900 hover:shadow-construction"
                                          )}
                                        >
                                          {/* Child active indicator - smaller */}
                                          {isChildItemActive && (
                                            <motion.div
                                              className="absolute left-0 w-0.5 h-6 bg-gradient-to-b from-construction-blue to-construction-blue rounded-r-full"
                                              transition={{ type: "spring", stiffness: 300, damping: 30 }}
                                            />
                                          )}

                                          {/* Child icon */}
                                          <motion.div
                                            className={cn(
                                              "relative",
                                              isChildItemActive
                                                ? "text-construction-blue"
                                                : "text-gray-600 group-hover:text-construction-blue"
                                            )}
                                            whileHover={{ scale: 1.1, rotate: isChildItemActive ? 0 : 5 }}
                                            transition={{ type: "spring", stiffness: 400, damping: 10 }}
                                          >
                                            <child.icon className="w-5 h-5 flex-shrink-0" />
                                            {isChildItemActive && (
                                              <div className="absolute inset-0 rounded-full bg-construction-blue/20 blur-sm animate-glow-pulse" />
                                            )}
                                          </motion.div>

                                          <span className="relative z-10">{child.name}</span>

                                          {/* Hover indicator */}
                                          <div className={cn(
                                            "absolute inset-0 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300",
                                            "bg-gradient-to-r from-construction-blue/5 to-transparent"
                                          )} />
                                        </Link>
                                      </motion.div>
                                    );
                                  })}
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        )}
                      </motion.div>
                    );
                  })}

                  {/* Owner Navigation Section */}
                  {isOwner && (
                    <>
                      <div className="pt-4 mt-4 border-t border-gray-200">
                        <div className="flex items-center gap-2 px-3 py-2">
                          <Crown className="w-4 h-4 text-yellow-600" />
                          <span className="text-xs font-bold text-yellow-700 uppercase tracking-wider">
                            Platform Admin
                          </span>
                        </div>
                      </div>
                      {ownerNavigation.map((item, index) => {
                        const isActive = pathname === item.href ||
                          pathname.startsWith(item.href + "/");

                        return (
                          <motion.div
                            key={item.name}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: (navigation.length + index) * 0.05, duration: 0.3 }}
                          >
                            <Link
                              href={item.href}
                              className={cn(
                                "group relative flex items-center gap-3 px-3 py-3.5 rounded-lg text-base font-medium transition-all duration-300",
                                isActive
                                  ? "bg-gradient-to-r from-yellow-500/10 to-yellow-500/5 text-yellow-700 shadow-inner-glow"
                                  : "text-gray-700 hover:bg-gradient-to-r hover:to-gray-100 active:bg-gray-200 hover:text-gray-900 hover:shadow-construction"
                              )}
                            >
                              {isActive && (
                                <motion.div
                                  layoutId="activeNavMobileOwner"
                                  className="absolute left-0 w-1 h-8 bg-gradient-to-b from-yellow-500 to-yellow-600 rounded-r-full"
                                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                                />
                              )}
                              <motion.div
                                className={cn(
                                  "relative",
                                  isActive
                                    ? "text-yellow-600"
                                    : "text-gray-700 group-hover:text-yellow-600"
                                )}
                                whileHover={{ scale: 1.1, rotate: isActive ? 0 : 5 }}
                                transition={{ type: "spring", stiffness: 400, damping: 10 }}
                              >
                                <item.icon className="w-6 h-6 flex-shrink-0" />
                                {isActive && (
                                  <div className="absolute inset-0 rounded-full bg-yellow-500/20 blur-sm animate-glow-pulse" />
                                )}
                              </motion.div>
                              <span className="relative z-10">{item.name}</span>
                              <div className={cn(
                                "absolute inset-0 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300",
                                "bg-gradient-to-r from-yellow-500/5 to-transparent"
                              )} />
                            </Link>
                          </motion.div>
                        );
                      })}
                    </>
                  )}
                </nav>

                {/* Modern Footer - Glass Morphism with Notifications & User Menu */}
                <div className="p-3">
                  <motion.div
                    className="relative rounded-2xl bg-gradient-to-br from-white/80 via-gray-50/60 to-white/40 backdrop-blur-xl border border-gray-200/50 shadow-lg overflow-hidden"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3, type: "spring", stiffness: 300, damping: 30 }}
                  >
                    {/* Ambient glow effect */}
                    <div className="absolute -top-20 -right-20 w-40 h-40 bg-construction-blue/10 rounded-full blur-3xl" />
                    <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-blue-400/10 rounded-full blur-3xl" />

                    {/* Content */}
                    <div className="relative p-3 space-y-3">
                      {/* Notifications & User Menu Row */}
                      <div className="flex items-center gap-2.5">
                        {/* Notification Bell - Modern floating button */}
                        <motion.div
                          whileHover={{ scale: 1.05, y: -2 }}
                          whileTap={{ scale: 0.95 }}
                          className="relative p-1"
                        >
                          <Link
                            href="/app/notifications"
                            className="relative flex items-center justify-center w-11 h-11 rounded-xl bg-gradient-to-br from-construction-blue via-construction-blue to-blue-800 text-white shadow-lg hover:shadow-xl transition-all duration-300 group"
                            aria-label={`Notifications (${notificationCount} unread)`}
                          >
                            {/* Animated gradient overlay */}
                            <motion.div
                              className="absolute inset-0 rounded-xl bg-gradient-to-tr from-white/0 via-white/30 to-white/0"
                              animate={{
                                backgroundPosition: ['0% 0%', '100% 100%'],
                              }}
                              transition={{
                                duration: 3,
                                repeat: Infinity,
                                ease: "linear"
                              }}
                              style={{ backgroundSize: '200% 200%' }}
                            />

                            {/* Glow effect on hover */}
                            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                              <div className="absolute inset-0 bg-construction-blue/50 blur-md rounded-xl" />
                            </div>

                            <Bell size={20} className="relative z-10 drop-shadow-sm" />
                          </Link>

                          {/* Notification Badge - Outside button to prevent clipping */}
                          {notificationCount > 0 && (
                            <motion.span
                              className="absolute top-0 right-0 flex items-center justify-center min-w-[20px] h-[20px] px-1.5 text-[10px] font-bold text-white bg-gradient-to-br from-red-500 to-red-600 rounded-full border-2 border-white shadow-lg"
                              initial={{ scale: 0, rotate: -180 }}
                              animate={{ scale: 1, rotate: 0 }}
                              transition={{
                                type: "spring",
                                stiffness: 500,
                                damping: 15,
                                delay: 0.2
                              }}
                            >
                              {notificationCount}
                            </motion.span>
                          )}
                        </motion.div>

                        {/* User Menu - Modern glass card */}
                        <motion.div
                          className="flex-1 min-w-0 relative group"
                          whileHover={{ scale: 1.02 }}
                          transition={{ type: "spring", stiffness: 400, damping: 25 }}
                        >
                          <div className="relative rounded-xl bg-white/60 backdrop-blur-sm border border-gray-200/60 shadow-sm hover:shadow-md hover:bg-white/80 transition-all duration-300 px-2.5 py-1.5">
                            {/* Subtle glow on hover */}
                            <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-construction-blue/0 via-construction-blue/5 to-construction-blue/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                            <UserMenu />
                          </div>
                        </motion.div>
                      </div>

                      {/* Bottom accent line with gradient */}
                      <motion.div
                        className="h-0.5 rounded-full bg-gradient-to-r from-transparent via-construction-blue/30 to-transparent"
                        initial={{ scaleX: 0 }}
                        animate={{ scaleX: 1 }}
                        transition={{ delay: 0.5, duration: 0.8, ease: "easeOut" }}
                      />
                    </div>
                  </motion.div>
                </div>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Debug: Desktop sidebar - hidden on mobile */}
      <aside className="hidden md:flex md:flex-shrink-0">
        {/* Debug: Aceternity UI Sidebar with glass morphism and construction theme */}
        <div className="relative flex flex-col w-64 bg-white/95 backdrop-blur-construction border-r border-gray-200 shadow-construction">
          {/* Construction border */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-construction-blue" />

          {/* Debug: Top Section - Logo Only */}
          <div className="px-4 py-4 border-b border-gray-200">
            {/* Logo/Brand */}
            <div className="flex items-center gap-3">
              <motion.div
                className="relative flex items-center justify-center w-10 h-10 rounded-lg overflow-hidden"
                whileHover={{ scale: 1.1, rotate: 5 }}
                transition={{ type: "spring", stiffness: 400, damping: 10 }}
              >
                <Image
                  src="/icon-192.png"
                  alt="GenHub Logo"
                  width={40}
                  height={40}
                  className="object-contain"
                />
                <div className="absolute inset-0 rounded-lg bg-construction-blue/10 animate-glow-pulse" />
              </motion.div>
              <div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                  GenHub
                </h1>
                <p className="text-xs text-gray-500 font-medium">Construction Management</p>
              </div>
            </div>
          </div>

          {/* Debug: Navigation with Aceternity UI hover effects and animations */}
          <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
            {/* Main Navigation */}
            {navigation.map((item, index) => {
              // Only active if exact match OR starts with href/ AND no other nav item exactly matches
              const isActive = pathname === item.href ||
                (item.href !== "/app" &&
                 pathname.startsWith(item.href + "/") &&
                 !navigation.some(other => other.href !== item.href && pathname === other.href));
              const hasChildren = item.children && item.children.length > 0;
              const isExpanded = expandedItems[item.name];
              const isChildActive = hasChildren && item.children!.some(
                (child) => pathname === child.href || pathname.startsWith(child.href + "/")
              );

              return (
                <motion.div
                  key={item.name}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05, duration: 0.3 }}
                >
                  {/* Parent Item */}
                  {hasChildren ? (
                    <button
                      onClick={() => toggleExpanded(item.name)}
                      className={cn(
                        "group relative flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-300 w-full",
                        isActive || isChildActive
                          ? "bg-gradient-to-r from-construction-blue/10 to-construction-blue/5 text-construction-blue shadow-inner-glow"
                          : "text-gray-700 hover:bg-gradient-to-r hover:to-gray-100 hover:text-gray-900 hover:shadow-construction"
                      )}
                    >
                      {/* Debug: Active indicator with glow */}
                      {(isActive || isChildActive) && (
                        <motion.div
                          layoutId="activeNav"
                          className="absolute left-0 w-1 h-8 bg-gradient-to-b from-construction-blue to-construction-blue rounded-r-full"
                          transition={{ type: "spring", stiffness: 300, damping: 30 }}
                        />
                      )}

                      {/* Debug: Icon with construction theme animation */}
                      <motion.div
                        className={cn(
                          "relative",
                          isActive || isChildActive
                            ? "text-construction-blue"
                            : "text-gray-700 group-hover:text-construction-blue"
                        )}
                        whileHover={{ scale: 1.1, rotate: isActive || isChildActive ? 0 : 5 }}
                        transition={{ type: "spring", stiffness: 400, damping: 10 }}
                      >
                        <item.icon className="w-5 h-5 flex-shrink-0" />
                        {(isActive || isChildActive) && (
                          <div className="absolute inset-0 rounded-full bg-construction-blue/20 blur-sm animate-glow-pulse" />
                        )}
                      </motion.div>

                      <span className="relative z-10 flex-1 text-left">{item.name}</span>

                      {/* Chevron Icon */}
                      <motion.div
                        animate={{ rotate: isExpanded ? 180 : 0 }}
                        transition={{ duration: 0.3, ease: "easeInOut" }}
                      >
                        <ChevronDown className="w-4 h-4" />
                      </motion.div>

                      {/* Debug: Hover indicator */}
                      <div className={cn(
                        "absolute inset-0 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300",
                        "bg-gradient-to-r from-construction-blue/5 to-transparent"
                      )} />
                    </button>
                  ) : (
                    <Link
                      href={item.href}
                      className={cn(
                        "group relative flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-300",
                        isActive
                          ? "bg-gradient-to-r from-construction-blue/10 to-construction-blue/5 text-construction-blue shadow-inner-glow"
                          : "text-gray-700 hover:bg-gradient-to-r hover:to-gray-100 hover:text-gray-900 hover:shadow-construction"
                      )}
                    >
                      {/* Debug: Active indicator with glow */}
                      {isActive && (
                        <motion.div
                          layoutId="activeNav"
                          className="absolute left-0 w-1 h-8 bg-gradient-to-b from-construction-blue to-construction-blue rounded-r-full"
                          transition={{ type: "spring", stiffness: 300, damping: 30 }}
                        />
                      )}

                      {/* Debug: Icon with construction theme animation */}
                      <motion.div
                        className={cn(
                          "relative",
                          isActive
                            ? "text-construction-blue"
                            : "text-gray-700 group-hover:text-construction-blue"
                        )}
                        whileHover={{ scale: 1.1, rotate: isActive ? 0 : 5 }}
                        transition={{ type: "spring", stiffness: 400, damping: 10 }}
                      >
                        <item.icon className="w-5 h-5 flex-shrink-0" />
                        {isActive && (
                          <div className="absolute inset-0 rounded-full bg-construction-blue/20 blur-sm animate-glow-pulse" />
                        )}
                      </motion.div>

                      <span className="relative z-10">{item.name}</span>

                      {/* Debug: Hover indicator */}
                      <div className={cn(
                        "absolute inset-0 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300",
                        "bg-gradient-to-r from-construction-blue/5 to-transparent"
                      )} />
                    </Link>
                  )}

                  {/* Child Items - Collapsible */}
                  {hasChildren && (
                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.3, ease: "easeInOut" }}
                          className="overflow-hidden"
                        >
                          <div className="mt-1 space-y-1 pl-4">
                            {item.children!.map((child, childIndex) => {
                              const isChildItemActive = pathname === child.href ||
                                pathname.startsWith(child.href + "/");

                              return (
                                <motion.div
                                  key={child.name}
                                  initial={{ opacity: 0, x: -10 }}
                                  animate={{ opacity: 1, x: 0 }}
                                  transition={{ delay: childIndex * 0.05, duration: 0.2 }}
                                >
                                  <Link
                                    href={child.href}
                                    className={cn(
                                      "group relative flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-300",
                                      isChildItemActive
                                        ? "bg-gradient-to-r from-construction-blue/10 to-construction-blue/5 text-construction-blue shadow-inner-glow"
                                        : "text-gray-600 hover:bg-gradient-to-r hover:to-gray-100 hover:text-gray-900 hover:shadow-construction"
                                    )}
                                  >
                                    {/* Child active indicator - smaller */}
                                    {isChildItemActive && (
                                      <motion.div
                                        className="absolute left-0 w-0.5 h-6 bg-gradient-to-b from-construction-blue to-construction-blue rounded-r-full"
                                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                                      />
                                    )}

                                    {/* Child icon */}
                                    <motion.div
                                      className={cn(
                                        "relative",
                                        isChildItemActive
                                          ? "text-construction-blue"
                                          : "text-gray-600 group-hover:text-construction-blue"
                                      )}
                                      whileHover={{ scale: 1.1, rotate: isChildItemActive ? 0 : 5 }}
                                      transition={{ type: "spring", stiffness: 400, damping: 10 }}
                                    >
                                      <child.icon className="w-4 h-4 flex-shrink-0" />
                                      {isChildItemActive && (
                                        <div className="absolute inset-0 rounded-full bg-construction-blue/20 blur-sm animate-glow-pulse" />
                                      )}
                                    </motion.div>

                                    <span className="relative z-10">{child.name}</span>

                                    {/* Hover indicator */}
                                    <div className={cn(
                                      "absolute inset-0 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300",
                                      "bg-gradient-to-r from-construction-blue/5 to-transparent"
                                    )} />
                                  </Link>
                                </motion.div>
                              );
                            })}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  )}
                </motion.div>
              );
            })}

            {/* Owner Navigation Section */}
            {isOwner && (
              <>
                <div className="pt-4 mt-4 border-t border-gray-200">
                  <div className="flex items-center gap-2 px-3 py-2">
                    <Crown className="w-4 h-4 text-yellow-600" />
                    <span className="text-xs font-bold text-yellow-700 uppercase tracking-wider">
                      Platform Admin
                    </span>
                  </div>
                </div>
                {ownerNavigation.map((item, index) => {
                  const isActive = pathname === item.href ||
                    pathname.startsWith(item.href + "/");

                  return (
                    <motion.div
                      key={item.name}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: (navigation.length + index) * 0.05, duration: 0.3 }}
                    >
                      <Link
                        href={item.href}
                        className={cn(
                          "group relative flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-300",
                          isActive
                            ? "bg-gradient-to-r from-yellow-500/10 to-yellow-500/5 text-yellow-700 shadow-inner-glow"
                            : "text-gray-700 hover:bg-gradient-to-r hover:to-gray-100 hover:text-gray-900 hover:shadow-construction"
                        )}
                      >
                        {isActive && (
                          <motion.div
                            layoutId="activeNavOwner"
                            className="absolute left-0 w-1 h-8 bg-gradient-to-b from-yellow-500 to-yellow-600 rounded-r-full"
                            transition={{ type: "spring", stiffness: 300, damping: 30 }}
                          />
                        )}
                        <motion.div
                          className={cn(
                            "relative",
                            isActive
                              ? "text-yellow-600"
                              : "text-gray-700 group-hover:text-yellow-600"
                          )}
                          whileHover={{ scale: 1.1, rotate: isActive ? 0 : 5 }}
                          transition={{ type: "spring", stiffness: 400, damping: 10 }}
                        >
                          <item.icon className="w-5 h-5 flex-shrink-0" />
                          {isActive && (
                            <div className="absolute inset-0 rounded-full bg-yellow-500/20 blur-sm animate-glow-pulse" />
                          )}
                        </motion.div>
                        <span className="relative z-10">{item.name}</span>
                        <div className={cn(
                          "absolute inset-0 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300",
                          "bg-gradient-to-r from-yellow-500/5 to-transparent"
                        )} />
                      </Link>
                    </motion.div>
                  );
                })}
              </>
            )}
          </nav>

          {/* Modern Footer - Glass Morphism with Notifications & User Menu */}
          <div className="p-3">
            <motion.div
              className="relative rounded-2xl bg-gradient-to-br from-white/80 via-gray-50/60 to-white/40 backdrop-blur-xl border border-gray-200/50 shadow-lg overflow-hidden"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, type: "spring", stiffness: 300, damping: 30 }}
            >
              {/* Ambient glow effect */}
              <div className="absolute -top-20 -right-20 w-40 h-40 bg-construction-blue/10 rounded-full blur-3xl" />
              <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-blue-400/10 rounded-full blur-3xl" />

              {/* Content */}
              <div className="relative p-3 space-y-3">
                {/* Notifications & User Menu Row */}
                <div className="flex items-center gap-2.5">
                  {/* Notification Bell - Modern floating button */}
                  <motion.div
                    whileHover={{ scale: 1.05, y: -2 }}
                    whileTap={{ scale: 0.95 }}
                    className="relative p-1"
                  >
                    <Link
                      href="/app/notifications"
                      className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-construction-blue via-construction-blue to-blue-800 text-white shadow-lg hover:shadow-xl transition-all duration-300 group"
                      aria-label={`Notifications (${notificationCount} unread)`}
                    >
                      {/* Animated gradient overlay */}
                      <motion.div
                        className="absolute inset-0 rounded-xl bg-gradient-to-tr from-white/0 via-white/30 to-white/0"
                        animate={{
                          backgroundPosition: ['0% 0%', '100% 100%'],
                        }}
                        transition={{
                          duration: 3,
                          repeat: Infinity,
                          ease: "linear"
                        }}
                        style={{ backgroundSize: '200% 200%' }}
                      />

                      {/* Glow effect on hover */}
                      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <div className="absolute inset-0 bg-construction-blue/50 blur-md rounded-xl" />
                      </div>

                      <Bell size={18} className="relative z-10 drop-shadow-sm" />
                    </Link>

                    {/* Notification Badge - Outside button to prevent clipping */}
                    {notificationCount > 0 && (
                      <motion.span
                        className="absolute top-0 right-0 flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[9px] font-bold text-white bg-gradient-to-br from-red-500 to-red-600 rounded-full border-2 border-white shadow-lg"
                        initial={{ scale: 0, rotate: -180 }}
                        animate={{ scale: 1, rotate: 0 }}
                        transition={{
                          type: "spring",
                          stiffness: 500,
                          damping: 15,
                          delay: 0.2
                        }}
                      >
                        {notificationCount}
                      </motion.span>
                    )}
                  </motion.div>

                  {/* User Menu - Modern glass card */}
                  <motion.div
                    className="flex-1 min-w-0 relative group"
                    whileHover={{ scale: 1.02 }}
                    transition={{ type: "spring", stiffness: 400, damping: 25 }}
                  >
                    <div className="relative rounded-xl bg-white/60 backdrop-blur-sm border border-gray-200/60 shadow-sm hover:shadow-md hover:bg-white/80 transition-all duration-300 px-2.5 py-1.5">
                      {/* Subtle glow on hover */}
                      <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-construction-blue/0 via-construction-blue/5 to-construction-blue/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                      <UserMenu />
                    </div>
                  </motion.div>
                </div>

                {/* Bottom accent line with gradient */}
                <motion.div
                  className="h-0.5 rounded-full bg-gradient-to-r from-transparent via-construction-blue/30 to-transparent"
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ delay: 0.5, duration: 0.8, ease: "easeOut" }}
                />
              </div>
            </motion.div>
          </div>
        </div>
      </aside>
    </>
  );
}
