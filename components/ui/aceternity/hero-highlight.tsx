"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface HeroHighlightProps {
  children: React.ReactNode;
  className?: string;
  containerClassName?: string;
}

export function HeroHighlight({
  children,
  className,
  containerClassName,
}: HeroHighlightProps) {
  return (
    <div
      className={cn(
        "relative w-full",
        containerClassName
      )}
    >
      <motion.div
        initial={{
          opacity: 0,
        }}
        animate={{
          opacity: 1,
        }}
        transition={{
          duration: 0.5,
        }}
        className={cn("relative z-10", className)}
      >
        {children}
      </motion.div>
    </div>
  );
}

export function Highlight({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <motion.span
      initial={{
        backgroundSize: "0% 100%",
      }}
      animate={{
        backgroundSize: "100% 100%",
      }}
      transition={{
        duration: 0.5,
        ease: "linear",
        delay: 0.2,
      }}
      style={{
        backgroundRepeat: "no-repeat",
        backgroundPosition: "left center",
        display: "inline",
      }}
      className={cn(
        "relative inline-block pb-1 px-1 rounded-lg bg-gradient-to-r from-construction-blue/20 to-construction-accent/20",
        className
      )}
    >
      {children}
    </motion.span>
  );
}
