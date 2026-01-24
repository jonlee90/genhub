"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { AnimatePresence } from "framer-motion";
import { MessageSquare, Users, HardHat, Bell, Settings } from "lucide-react";
import { SlideMenuBackdrop } from "./SlideMenuBackdrop";
import { SlideMenuPanel } from "./SlideMenuPanel";
import { SlideMenuUserSection } from "./SlideMenuUserSection";
import { SlideMenuList } from "./SlideMenuList";
import type { SlideMenuProps, SlideMenuNavItem } from "./types";

// Navigation items - clean industrial style
const SLIDE_MENU_NAV_ITEMS: SlideMenuNavItem[] = [
  {
    id: "chat",
    name: "Chat",
    href: "/app/chat",
    icon: MessageSquare,
    iconBg: "bg-blue-50",
    iconColor: "#2563EB",
  },
  {
    id: "team",
    name: "Team",
    href: "/app/team",
    icon: Users,
    iconBg: "bg-violet-50",
    iconColor: "#7C3AED",
  },
  {
    id: "subs",
    name: "Subcontractors",
    href: "/app/team/subcontractors",
    icon: HardHat,
    iconBg: "bg-amber-50",
    iconColor: "#F59E0B",
  },
  {
    id: "alerts",
    name: "Alerts",
    href: "/app/notifications",
    icon: Bell,
    iconBg: "bg-red-50",
    iconColor: "#EF4444",
  },
  {
    id: "settings",
    name: "Settings",
    href: "/app/settings",
    icon: Settings,
    iconBg: "bg-slate-50",
    iconColor: "#64748B",
  },
];

export function SlideMenu({ isOpen, onClose, session }: SlideMenuProps) {
  const pathname = usePathname();

  // Lock body scroll when menu is open
  useEffect(() => {
    if (isOpen) {
      // Store current scroll position
      const scrollY = window.scrollY;
      document.body.style.position = "fixed";
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = "100%";
      document.body.style.overflowY = "scroll"; // Prevent layout shift
    } else {
      // Restore scroll position
      const scrollY = document.body.style.top;
      document.body.style.position = "";
      document.body.style.top = "";
      document.body.style.width = "";
      document.body.style.overflowY = "";
      if (scrollY) {
        window.scrollTo(0, parseInt(scrollY || "0") * -1);
      }
    }

    return () => {
      document.body.style.position = "";
      document.body.style.top = "";
      document.body.style.width = "";
      document.body.style.overflowY = "";
    };
  }, [isOpen]);

  // Close on ESC key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen, onClose]);

  // Focus trap - trap Tab key within menu when open
  useEffect(() => {
    if (!isOpen) return;

    const handleTabKey = (e: KeyboardEvent) => {
      if (e.key !== "Tab") return;

      const focusableElements = document.querySelectorAll(
        'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])'
      );
      const menuElements = Array.from(focusableElements).filter((el) =>
        el.closest('[role="dialog"]')
      );

      if (menuElements.length === 0) return;

      const firstElement = menuElements[0] as HTMLElement;
      const lastElement = menuElements[menuElements.length - 1] as HTMLElement;

      // Shift+Tab on first element → focus last
      if (e.shiftKey && document.activeElement === firstElement) {
        e.preventDefault();
        lastElement.focus();
      }
      // Tab on last element → focus first
      else if (!e.shiftKey && document.activeElement === lastElement) {
        e.preventDefault();
        firstElement.focus();
      }
    };

    document.addEventListener("keydown", handleTabKey);
    return () => {
      document.removeEventListener("keydown", handleTabKey);
    };
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <SlideMenuBackdrop onClick={onClose} />
          <SlideMenuPanel onClose={onClose}>
            {session?.user && (
              <SlideMenuUserSection user={session.user} onClose={onClose} />
            )}
            <SlideMenuList
              items={SLIDE_MENU_NAV_ITEMS}
              onClose={onClose}
              currentPath={pathname}
            />
          </SlideMenuPanel>
        </>
      )}
    </AnimatePresence>
  );
}
