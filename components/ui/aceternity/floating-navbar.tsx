"use client";

import { useState, useEffect } from "react";
import { m as motion, AnimatePresence, useScroll, useMotionValueEvent } from "framer-motion";
import { cn } from "@/lib/utils";

export interface NavItem {
  name: string;
  link: string;
  icon?: React.ReactNode;
}

interface FloatingNavbarProps {
  navItems: NavItem[];
  className?: string;
  children?: React.ReactNode;
}

export function FloatingNavbar({
  navItems,
  className,
  children,
}: FloatingNavbarProps) {
  const { scrollY } = useScroll();
  const [visible, setVisible] = useState(true);
  const [isScrolled, setIsScrolled] = useState(false);

  useMotionValueEvent(scrollY, "change", (current) => {
    // Show/hide based on scroll direction
    if (typeof current === "number") {
      const direction = current - scrollY.getPrevious()!;

      if (current < 50) {
        setVisible(true);
        setIsScrolled(false);
      } else {
        setIsScrolled(true);
        if (direction < 0) {
          setVisible(true);
        } else {
          setVisible(false);
        }
      }
    }
  });

  return (
    <AnimatePresence mode="wait">
      <motion.div
        initial={{
          opacity: 1,
          y: 0,
        }}
        animate={{
          y: visible ? 0 : -100,
          opacity: visible ? 1 : 0,
        }}
        transition={{
          duration: 0.2,
        }}
        className={cn(
          "fixed top-0 inset-x-0 z-50",
          "backdrop-blur-construction bg-white/80",
          "border-b-2 transition-all duration-300",
          isScrolled
            ? "border-construction-blue/20 shadow-construction-lg"
            : "border-transparent",
          className
        )}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {children}
          </div>
        </div>

        {/* Construction accent border (appears on scroll) */}
        <motion.div
          className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-construction-blue via-construction-accent to-construction-blue"
          initial={{ opacity: 0 }}
          animate={{ opacity: isScrolled ? 1 : 0 }}
          transition={{ duration: 0.3 }}
        />
      </motion.div>
    </AnimatePresence>
  );
}

export function FloatingNav({
  navItems,
  className,
}: {
  navItems: {
    name: string;
    link: string;
    icon?: React.ReactNode;
  }[];
  className?: string;
}) {
  return (
    <FloatingNavbar navItems={navItems} className={className}>
      <div className="flex items-center gap-8">
        {navItems.map((navItem, idx) => (
          <a
            key={`link-${idx}`}
            href={navItem.link}
            className={cn(
              "relative flex items-center gap-2",
              "text-neutral-600 hover:text-construction-blue",
              "text-sm font-bold transition-colors"
            )}
          >
            {navItem.icon && <span className="block sm:hidden">{navItem.icon}</span>}
            <span className="hidden sm:block">{navItem.name}</span>
          </a>
        ))}
      </div>
    </FloatingNavbar>
  );
}
