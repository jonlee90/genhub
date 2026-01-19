"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Home,
  FolderKanban,
  ClipboardList,
  Package,
  Receipt,
  Plus,
  LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { MoreMenu } from "./MoreMenu";
import { useBottomNav } from "@/lib/contexts/BottomNavContext";
import { CreateProjectModal } from "@/components/projects/CreateProjectModal";
import { TaskModal } from "@/components/tasks/TaskModal";
import { CreateExpenseModal } from "@/components/expenses/CreateExpenseModal";
import type { Session } from "next-auth";

// Navigation item configuration with create modal mapping
interface NavItem {
  name: string;
  href: string;
  icon?: LucideIcon;
  isMore?: boolean;
  createModalType?: "project" | "task" | "expense" | "material";
  logoImage?: boolean;
}

// Bottom navigation items for mobile - 6 core items
const navigationItems: NavItem[] = [
  { name: "Home", href: "/app", icon: Home },
  {
    name: "Projects",
    href: "/app/projects",
    icon: FolderKanban,
    createModalType: "project",
  },
  {
    name: "Tasks",
    href: "/app/tasks",
    icon: ClipboardList,
    createModalType: "task",
  },
  { name: "Materials", href: "/app/materials", icon: Package },
  {
    name: "Expenses",
    href: "/app/expenses",
    icon: Receipt,
    createModalType: "expense",
  },
  { name: "Menu", href: "#more", logoImage: true, isMore: true },
];

interface BottomNavigationProps {
  session: Session | null;
}

export function BottomNavigation({ session }: BottomNavigationProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);

  // Context for create modals
  const {
    hasCreateModal,
    getCreateModalData,
    openModal,
    openCreateModal,
    closeCreateModal,
    onCreateSuccess,
  } = useBottomNav();

  // Check if current path matches nav item
  const isActive = (href: string) => {
    if (href === "/app") {
      return pathname === "/app";
    }
    return pathname.startsWith(href);
  };

  // Check if "More" menu items are active
  const isMoreActive = () => {
    const moreRoutes = [
      "/app/chat",
      "/app/team",
      "/app/settings",
      "/app/notifications",
    ];
    return moreRoutes.some((route) => pathname.startsWith(route));
  };

  // Handle navigation item click
  const handleNavClick = (
    item: NavItem,
    active: boolean,
    e: React.MouseEvent,
  ) => {
    // If item is active and has a create modal type, open the modal instead of navigating
    if (active && item.createModalType && hasCreateModal(item.href)) {
      e.preventDefault();
      openCreateModal(item.createModalType);
    }
    // Otherwise, let the link navigate normally
  };

  // Handle More button click
  const handleMoreClick = () => {
    setIsMoreMenuOpen(true);
  };

  // Get modal data for each type
  const taskData = getCreateModalData("/app/tasks");
  const expenseData = getCreateModalData("/app/expenses");

  // Handle modal success
  const handleModalSuccess = () => {
    onCreateSuccess();
    router.refresh();
  };

  return (
    <>
      {/* Bottom Navigation Bar - Fixed at bottom, hidden on desktop */}
      <nav
        className={cn(
          "fixed bottom-0 left-0 right-0 z-40 md:hidden",
          "bg-white border-t border-gray-200 shadow-construction-lg",
        )}
        style={{
          paddingBottom: "env(safe-area-inset-bottom, 0px)",
        }}
      >
        {/* Top accent line - construction blue */}
        <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-construction-blue via-construction-accent to-construction-blue" />

        <div className="flex items-center justify-around h-14">
          {navigationItems.map((item) => {
            const active = item.isMore ? isMoreActive() : isActive(item.href);
            const Icon = item.icon;
            const hasCreate = item.createModalType && hasCreateModal(item.href);
            const isLogoItem = item.logoImage;

            const showPlusIcon = active && hasCreate;

            if (item.isMore) {
              // More button opens menu
              return (
                <button
                  key={item.name}
                  onClick={handleMoreClick}
                  className={cn(
                    "flex flex-col items-center justify-center flex-1 h-full min-w-[64px] transition-colors",
                    "active:bg-gray-100",
                  )}
                  aria-label="Open more menu"
                >
                  <motion.div
                    className="relative flex flex-col items-center"
                    whileTap={{ scale: 0.95 }}
                  >
                    <div
                      className={cn(
                        "flex items-center justify-center w-11 h-11 rounded-xl transition-all duration-200",
                        active
                          ? "bg-construction-blue text-white"
                          : "text-gray-500",
                      )}
                    >
                      {isLogoItem ? (
                        <Image
                          src="/icon-192.png"
                          alt="GenHub Logo"
                          width={20}
                          height={20}
                          className="object-contain"
                        />
                      ) : Icon ? (
                        <Icon className="w-5 h-5" />
                      ) : null}
                    </div>
                    <span
                      className={cn(
                        "text-[10px] font-bold transition-colors",
                        active
                          ? "mt-0.5 text-construction-blue"
                          : "-mt-1.5 text-gray-500",
                      )}
                    >
                      {item.name}
                    </span>
                    {/* Active indicator dot */}
                    {active && (
                      <motion.div
                        layoutId="bottomNavIndicator"
                        className="absolute -bottom-1 w-1 h-1 rounded-full bg-construction-blue"
                        transition={{
                          type: "spring",
                          stiffness: 500,
                          damping: 30,
                        }}
                      />
                    )}
                  </motion.div>
                </button>
              );
            }

            // Regular navigation link that can become a create button when active
            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={(e) => handleNavClick(item, active, e)}
                className={cn(
                  "flex flex-col items-center justify-center flex-1 h-full min-w-[64px] transition-colors",
                  "active:bg-gray-100",
                )}
              >
                <motion.div
                  className="relative flex flex-col items-center"
                  whileTap={{ scale: 0.95 }}
                >
                  {showPlusIcon ? (
                    /* 3D Plus Button - Elevated with depth effect */
                    <div
                      className={cn(
                        "flex items-center justify-center w-11 h-11 rounded-xl",
                        "bg-gradient-to-b from-[#0a2d6e] to-[#001B51]",
                        "text-white",
                        /* 3D depth effect - layered shadows */
                        "shadow-[0_4px_0_0_#000d2a,0_6px_8px_-2px_rgba(0,27,81,0.4),0_2px_4px_-1px_rgba(0,0,0,0.2)]",
                        /* Inner highlight for 3D illusion */
                        "border-t border-t-[#1a4080]/50",
                        /* Pressed state - moves down, shadow shrinks */
                        "active:translate-y-[2px]",
                        "active:shadow-[0_2px_0_0_#000d2a,0_3px_4px_-2px_rgba(0,27,81,0.3)]",
                        "active:from-[#001B51] active:to-[#00132e]",
                        "transition-all duration-100",
                      )}
                    >
                      <Plus
                        className="w-5 h-5 drop-shadow-[0_1px_1px_rgba(0,0,0,0.3)]"
                        strokeWidth={2.5}
                      />
                    </div>
                  ) : (
                    <div
                      className={cn(
                        "flex items-center justify-center w-11 h-11 rounded-xl transition-all duration-200",
                        active
                          ? "bg-construction-blue text-white"
                          : "text-gray-500",
                      )}
                    >
                      {isLogoItem ? (
                        <Image
                          src="/icon-192.png"
                          alt="GenHub Logo"
                          width={20}
                          height={20}
                          className="object-contain"
                        />
                      ) : Icon ? (
                        <Icon className="w-5 h-5" />
                      ) : null}
                    </div>
                  )}
                  <span
                    className={cn(
                      "text-[10px] font-bold transition-colors",
                      active
                        ? "mt-0.5 text-construction-blue"
                        : "-mt-1.5 text-gray-500",
                    )}
                  >
                    {active && showPlusIcon ? item.name : item.name}
                  </span>
                  {/* Active indicator dot */}
                  {active && (
                    <motion.div
                      layoutId="bottomNavIndicator"
                      className="absolute -bottom-1 w-1 h-1 rounded-full bg-construction-blue"
                      transition={{
                        type: "spring",
                        stiffness: 500,
                        damping: 30,
                      }}
                    />
                  )}
                </motion.div>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* More Menu Modal */}
      <MoreMenu
        isOpen={isMoreMenuOpen}
        onClose={() => setIsMoreMenuOpen(false)}
        session={session}
      />

      {/* Create Project Modal */}
      {openModal === "project" && (
        <CreateProjectModal
          isOpen={true}
          onClose={closeCreateModal}
          onSuccess={handleModalSuccess}
        />
      )}

      {/* Create Task Modal */}
      {openModal === "task" && taskData && (
        <TaskModal
          isOpen={true}
          onClose={closeCreateModal}
          mode="create"
          projects={taskData.projects || []}
          teamMembers={taskData.teamMembers || []}
          onSuccess={handleModalSuccess}
        />
      )}

      {/* Create Expense Modal */}
      {openModal === "expense" && expenseData && (
        <CreateExpenseModal
          projects={(expenseData.projects || []) as any}
          tasks={expenseData.tasks || []}
          onClose={() => {
            closeCreateModal();
            router.refresh();
          }}
        />
      )}
    </>
  );
}
