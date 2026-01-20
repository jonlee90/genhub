"use client";

import { m as motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { cn } from "@/lib/utils";

interface AnimatedTooltipProps {
  content: React.ReactNode;
  children: React.ReactNode;
  side?: "top" | "bottom" | "left" | "right";
  delay?: number;
}

export function AnimatedTooltip({
  content,
  children,
  side = "top",
  delay = 200,
}: AnimatedTooltipProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [timeoutId, setTimeoutId] = useState<NodeJS.Timeout | null>(null);

  const handleMouseEnter = () => {
    const id = setTimeout(() => {
      setIsVisible(true);
    }, delay);
    setTimeoutId(id);
  };

  const handleMouseLeave = () => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    setIsVisible(false);
  };

  const sideVariants = {
    top: { y: -10, x: "-50%" },
    bottom: { y: 10, x: "-50%" },
    left: { x: -10, y: "-50%" },
    right: { x: 10, y: "-50%" },
  };

  const positionClasses = {
    top: "bottom-full left-1/2 -translate-x-1/2 mb-2",
    bottom: "top-full left-1/2 -translate-x-1/2 mt-2",
    left: "right-full top-1/2 -translate-y-1/2 mr-2",
    right: "left-full top-1/2 -translate-y-1/2 ml-2",
  };

  return (
    <div
      className="relative inline-block"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {children}

      <AnimatePresence>
        {isVisible && (
          <motion.div
            className={cn(
              "absolute z-50 pointer-events-none",
              positionClasses[side]
            )}
            initial={{
              opacity: 0,
              scale: 0.95,
              ...sideVariants[side],
            }}
            animate={{
              opacity: 1,
              scale: 1,
              y: 0,
              x: side === "top" || side === "bottom" ? "-50%" : 0,
            }}
            exit={{
              opacity: 0,
              scale: 0.95,
              ...sideVariants[side],
            }}
            transition={{ duration: 0.2, ease: "easeOut" }}
          >
            <div className="bg-gray-900 text-white px-3 py-2.5 rounded-lg shadow-construction-lg text-sm">
              {content}

     
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
