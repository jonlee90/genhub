# Task 0003: Enhance PhaseStation with Spotlight & Animated Tooltip

**Priority**: MEDIUM
**Estimated Time**: 2 hours
**Component**: `components/projects/PhaseStation.tsx`

## Objective
Add Aceternity UI spotlight effect to phase stations, animated tooltips on hover, and enhanced visual indicators for active/blocked states.

## Current State
- Circular phase stations with completion rings
- Basic hover scale (110%)
- Status badges
- Warning indicators for blocked/overdue

## Target State (Aceternity UI)
- **Spotlight Effect**: Active phase highlighted with radial gradient glow
- **Animated Tooltip**: Shows task count, dates, and progress on hover
- **Enhanced Pulsing**: Current phase pulses with construction-blue glow
- **Hover Effects**: Smooth scale + glow transition
- **Status Indicators**: Visual badges with animations

## Implementation Steps

### 1. Create Aceternity Animated Tooltip Component

**File**: `components/ui/aceternity/animated-tooltip.tsx`

```typescript
"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { cn } from "@/lib/utils";

interface AnimatedTooltipProps {
  content: React.ReactNode;
  children: React.ReactNode;
  side?: "top" | "bottom" | "left" | "right";
}

export function AnimatedTooltip({
  content,
  children,
  side = "top",
}: AnimatedTooltipProps) {
  const [isVisible, setIsVisible] = useState(false);

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
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
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
            transition={{ duration: 0.2 }}
          >
            <div className="bg-gray-900 text-white px-3 py-2 rounded-lg shadow-construction-lg text-sm">
              {content}

              {/* Tooltip arrow */}
              <div
                className={cn(
                  "absolute w-2 h-2 bg-gray-900 rotate-45",
                  side === "top" && "bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2",
                  side === "bottom" && "top-0 left-1/2 -translate-x-1/2 -translate-y-1/2",
                  side === "left" && "right-0 top-1/2 -translate-y-1/2 translate-x-1/2",
                  side === "right" && "left-0 top-1/2 -translate-y-1/2 -translate-x-1/2"
                )}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
```

### 2. Update PhaseStation with Spotlight

**File**: `components/projects/PhaseStation.tsx`

**Add spotlight effect for active phase**:

```typescript
import { AnimatedTooltip } from "@/components/ui/aceternity/animated-tooltip";
import { motion } from "framer-motion";

// Tooltip content
const TooltipContent = ({ phase }: { phase: Phase }) => (
  <div className="space-y-1 min-w-[200px]">
    <div className="flex items-center justify-between">
      <span className="font-semibold">{phase.name}</span>
      <span className="text-construction-blue">{phase.completion_percentage}%</span>
    </div>
    <div className="text-xs text-gray-300 space-y-0.5">
      <div>Tasks: {phase.completedTasks}/{phase.totalTasks}</div>
      {phase.startDate && <div>Started: {formatDate(phase.startDate)}</div>}
      {phase.dueDate && <div>Due: {formatDate(phase.dueDate)}</div>}
    </div>
  </div>
);

return (
  <AnimatedTooltip
    content={<TooltipContent phase={phase} />}
    side="top"
  >
    <motion.div
      className="relative flex items-center justify-center w-20 h-20"
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.95 }}
    >
      {/* Spotlight glow for active phase */}
      {isActive && (
        <motion.div
          className="absolute inset-0 rounded-full bg-construction-blue/20 blur-2xl"
          animate={{
            scale: [1, 1.3, 1],
            opacity: [0.5, 0.8, 0.5],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      )}

      {/* Phase circle */}
      <div className={cn(
        "relative w-full h-full rounded-full border-4 flex items-center justify-center",
        "bg-white shadow-construction transition-all duration-300",
        isActive && "border-construction-blue shadow-glow",
        isCompleted && "border-construction-green bg-construction-green",
        isPending && "border-gray-300"
      )}>
        {/* Phase icon */}
        {getPhaseIcon(phase.name, phase.status)}

        {/* Completion ring */}
        <svg className="absolute inset-0 w-full h-full transform -rotate-90">
          <circle
            cx="40"
            cy="40"
            r="36"
            stroke="currentColor"
            strokeWidth="4"
            fill="none"
            className="text-gray-200"
          />
          <motion.circle
            cx="40"
            cy="40"
            r="36"
            stroke="url(#progressGradient)"
            strokeWidth="4"
            fill="none"
            strokeLinecap="round"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: phase.completion_percentage / 100 }}
            transition={{ duration: 1.5, ease: "easeOut" }}
            strokeDasharray={`${2 * Math.PI * 36}`}
          />
          <defs>
            <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#001B51" />
              <stop offset="100%" stopColor="#F59E0B" />
            </linearGradient>
          </defs>
        </svg>

        {/* Pulsing animation for active phase */}
        {isActive && (
          <div className="absolute inset-0 rounded-full bg-construction-blue/20 animate-glow-pulse" />
        )}
      </div>

      {/* Status badge */}
      {isActive && (
        <motion.div
          className="absolute -bottom-2 bg-gradient-to-r from-construction-blue to-blue-700 text-white text-xs font-bold px-2 py-0.5 rounded-full shadow-glow"
          initial={{ y: -10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          Active
        </motion.div>
      )}

      {/* Completion checkmark */}
      {isCompleted && (
        <motion.div
          className="absolute -bottom-2 -right-2 w-8 h-8 bg-construction-green rounded-full flex items-center justify-center shadow-construction"
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 15 }}
        >
          <CheckCircle2 className="w-5 h-5 text-white" />
        </motion.div>
      )}

      {/* Warning indicators (blockers/overdue) */}
      {hasBlockers && (
        <motion.div
          className="absolute -top-2 -right-2 w-6 h-6 bg-construction-red rounded-full flex items-center justify-center shadow-construction"
          animate={{
            scale: [1, 1.2, 1],
          }}
          transition={{
            duration: 1,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        >
          <AlertCircle className="w-4 h-4 text-white" />
        </motion.div>
      )}
    </motion.div>
  </AnimatedTooltip>
);
```

### 3. Add Spotlight Gradient

**Create spotlight CSS utility**:

```css
/* In globals.css */
.spotlight-effect {
  position: absolute;
  inset: 0;
  background: radial-gradient(
    circle at center,
    rgba(0, 27, 81, 0.3) 0%,
    rgba(0, 27, 81, 0.1) 50%,
    transparent 70%
  );
  border-radius: 9999px;
  filter: blur(20px);
  animation: spotlight-pulse 2s ease-in-out infinite;
}

@keyframes spotlight-pulse {
  0%, 100% {
    opacity: 0.5;
    transform: scale(1);
  }
  50% {
    opacity: 0.8;
    transform: scale(1.2);
  }
}
```

## Acceptance Criteria

- [ ] Animated tooltip appears on hover (200ms delay)
- [ ] Tooltip shows task count, dates, progress
- [ ] Spotlight effect visible on active phase
- [ ] Pulsing glow animation on active phase (2s loop)
- [ ] Completion ring animates smoothly (1.5s)
- [ ] Warning indicators pulse on blocked phases
- [ ] Hover scale works smoothly (1.1x)
- [ ] Status badges appear with animation
- [ ] All animations respect reduced motion preference

## Testing Checklist

- [ ] Tooltip renders correctly on all sides (top, bottom, left, right)
- [ ] Spotlight doesn't cause layout shift
- [ ] Multiple phase stations don't overlap
- [ ] Animations perform at 60fps
- [ ] Mobile: Tap to show tooltip (no hover)
- [ ] Keyboard navigation: Focus shows tooltip
- [ ] Screen reader: Tooltip content announced

## Design Reference

**Aceternity UI Components**:
- [Animated Tooltip](https://ui.aceternity.com/components/animated-tooltip)
- [Spotlight](https://ui.aceternity.com/components/spotlight)

**Animation Specs**:
- Tooltip: 200ms fade + scale
- Spotlight: 2s pulse (scale 1 → 1.2 → 1)
- Glow: 2s pulse (opacity 0.5 → 0.8 → 0.5)
- Hover: 300ms scale to 1.1x

## Notes

- Spotlight blur: 20px radial gradient
- Tooltip background: gray-900 with white text
- Construction color: #001B51 for active states
- Warning color: #EF4444 for blockers
- Success color: #10B981 for completed

---

**Status**: Pending
**Dependencies**: Task 0002 (MetroJourney)
**Next Task**: 0004 - ProjectFilters Tabs Enhancement
