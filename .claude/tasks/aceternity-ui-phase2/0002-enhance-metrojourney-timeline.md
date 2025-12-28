# Task 0002: Enhance MetroJourney with Aceternity Timeline

**Priority**: HIGH
**Estimated Time**: 3-4 hours
**Component**: `components/projects/MetroJourney.tsx`

## Objective
Transform MetroJourney into an animated timeline visualization with construction-themed phase icons, sticky scroll reveals, and smooth phase transitions.

## Current State
- Basic horizontal scrollable track
- Simple phase stations with completion rings
- Static track segments
- Phase detail panel below

## Target State (Aceternity UI)
- **Aceternity Timeline Component**: Horizontal timeline with animated connections
- **Construction Phase Icons**: Rocket → Blueprint → Cart → Hard Hat → Check
- **Sticky Scroll Reveal**: Phase details stick and reveal on scroll
- **Animated Transitions**: Smooth phase-to-phase animations
- **Shimmer Effects**: Active phase track segments shimmer
- **Spotlight**: Active phase highlighted with glow spotlight

## Implementation Steps

### 1. Create Aceternity Timeline Base Component

**File**: `components/ui/aceternity/timeline.tsx`

```typescript
"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import { cn } from "@/lib/utils";

interface TimelineItem {
  id: string;
  title: string;
  icon: React.ReactNode;
  status: "completed" | "in_progress" | "pending";
  content?: React.ReactNode;
}

export function Timeline({ items }: { items: TimelineItem[] }) {
  const containerRef = useRef<HTMLDivElement>(null);

  return (
    <div ref={containerRef} className="relative">
      {/* Horizontal timeline track */}
      <div className="flex items-center gap-8 overflow-x-auto pb-4">
        {items.map((item, index) => (
          <TimelineNode
            key={item.id}
            item={item}
            index={index}
            isLast={index === items.length - 1}
          />
        ))}
      </div>
    </div>
  );
}

function TimelineNode({ item, index, isLast }: {
  item: TimelineItem;
  index: number;
  isLast: boolean;
}) {
  return (
    <div className="flex items-center">
      {/* Node circle */}
      <motion.div
        className={cn(
          "relative flex items-center justify-center w-16 h-16 rounded-full border-4",
          item.status === "completed" && "bg-construction-blue border-construction-blue",
          item.status === "in_progress" && "bg-white border-construction-blue animate-glow-pulse",
          item.status === "pending" && "bg-white border-gray-300"
        )}
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: index * 0.1, type: "spring", stiffness: 300 }}
      >
        {item.icon}

        {/* Spotlight effect for active phase */}
        {item.status === "in_progress" && (
          <motion.div
            className="absolute inset-0 rounded-full bg-construction-blue/30 blur-xl"
            animate={{
              scale: [1, 1.5, 1],
              opacity: [0.5, 0.8, 0.5],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        )}
      </motion.div>

      {/* Connecting line */}
      {!isLast && (
        <div className="relative w-32 h-1 mx-2">
          <div className="absolute inset-0 bg-gray-200 rounded-full" />
          {item.status === "completed" && (
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-construction-blue to-construction-accent rounded-full"
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ delay: index * 0.1 + 0.2, duration: 0.5 }}
              style={{ transformOrigin: "left" }}
            />
          )}
        </div>
      )}
    </div>
  );
}
```

### 2. Update MetroJourney Component

**File**: `components/projects/MetroJourney.tsx`

**Replace current implementation with Aceternity Timeline**:

```typescript
import { Timeline } from "@/components/ui/aceternity/timeline";
import { Rocket, FileText, ShoppingCart, HardHat, CheckCircle2 } from "lucide-react";

const phaseIcons = {
  initiation: <Rocket className="w-8 h-8 text-white" />,
  pre_construction: <FileText className="w-8 h-8 text-white" />,
  procurement: <ShoppingCart className="w-8 h-8 text-white" />,
  construction: <HardHat className="w-8 h-8 text-white" />,
  post_construction: <CheckCircle2 className="w-8 h-8 text-white" />,
};

const timelineItems = phases.map((phase) => ({
  id: phase.id,
  title: phase.name,
  icon: phaseIcons[phase.name.toLowerCase().replace(/\s/g, "_")],
  status: phase.status,
  content: phase.description,
}));

return (
  <div className="space-y-6">
    {/* Title with construction accent */}
    <div className="flex items-center gap-3">
      <div className="h-1 w-12 bg-gradient-to-r from-construction-blue to-construction-accent rounded-full" />
      <h2 className="text-2xl font-bold text-gray-900">Metro Journey</h2>
      <p className="text-sm text-gray-500">Project Phase Timeline</p>
    </div>

    {/* Aceternity Timeline */}
    <Timeline items={timelineItems} />

    {/* Phase detail panel with sticky scroll */}
    {selectedPhase && (
      <motion.div
        layoutId="phaseDetail"
        className="sticky top-20 bg-white rounded-xl border-2 border-gray-200 p-6 shadow-construction-lg"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 20, opacity: 0 }}
      >
        <PhaseDetailPanel phase={selectedPhase} />
      </motion.div>
    )}
  </div>
);
```

### 3. Add Shimmer Effect on Active Track

**Enhance active phase track segment**:

```typescript
// In TimelineNode connecting line
{item.status === "in_progress" && (
  <motion.div
    className="absolute inset-0 bg-gradient-to-r from-construction-blue via-white to-construction-blue rounded-full opacity-50"
    animate={{
      backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"],
    }}
    transition={{
      duration: 2,
      repeat: Infinity,
      ease: "linear",
    }}
    style={{
      backgroundSize: "200% 100%",
    }}
  />
)}
```

### 4. Sticky Scroll Phase Details

**Add IntersectionObserver for sticky behavior**:

```typescript
const [stickyPhase, setStickyPhase] = useState<string | null>(null);

useEffect(() => {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          setStickyPhase(entry.target.id);
        }
      });
    },
    { threshold: 0.5 }
  );

  phases.forEach((phase) => {
    const el = document.getElementById(`phase-${phase.id}`);
    if (el) observer.observe(el);
  });

  return () => observer.disconnect();
}, [phases]);
```

### 5. Construction-Themed Phase Icons

**Define icon mapping with colors**:

```typescript
const getPhaseIcon = (phaseName: string, status: string) => {
  const iconColor = status === "completed"
    ? "text-white"
    : status === "in_progress"
    ? "text-construction-blue"
    : "text-gray-400";

  switch (phaseName.toLowerCase()) {
    case "initiation":
      return <Rocket className={`w-8 h-8 ${iconColor}`} />;
    case "pre-construction":
      return <FileText className={`w-8 h-8 ${iconColor}`} />;
    case "procurement":
      return <ShoppingCart className={`w-8 h-8 ${iconColor}`} />;
    case "construction":
      return <HardHat className={`w-8 h-8 ${iconColor}`} />;
    case "post-construction":
      return <CheckCircle2 className={`w-8 h-8 ${iconColor}`} />;
    default:
      return null;
  }
};
```

## Acceptance Criteria

- [ ] Timeline renders horizontally with proper spacing
- [ ] Phase icons animate in with staggered delays (0.1s)
- [ ] Completed phases show blue gradient connecting lines
- [ ] Active phase has pulsing spotlight glow effect
- [ ] Shimmer animation on active phase track segment
- [ ] Phase detail panel sticks on scroll
- [ ] Smooth transitions between phase selections
- [ ] Construction icons correctly mapped to each phase
- [ ] Mobile: Timeline scrolls horizontally without breaking
- [ ] Accessibility: Keyboard navigation works

## Testing Checklist

- [ ] All 5 phases render with correct icons
- [ ] Animations perform at 60fps
- [ ] Sticky scroll works on desktop and mobile
- [ ] Phase selection updates detail panel
- [ ] Spotlight effect visible on active phase
- [ ] Timeline scrollable on mobile (touch)
- [ ] Colors match construction theme
- [ ] Reduced motion preference respected

## Design Reference

**Aceternity UI Components**:
- [Timeline](https://ui.aceternity.com/components/timeline)
- [Sticky Scroll Reveal](https://ui.aceternity.com/components/sticky-scroll-reveal)
- [Spotlight](https://ui.aceternity.com/components/spotlight)

**Phase Icons (Lucide)**:
- Rocket (Initiation)
- FileText (Pre-Construction / Blueprint)
- ShoppingCart (Procurement)
- HardHat (Construction)
- CheckCircle2 (Post-Construction)

## Notes

- Timeline should support both 5 and 7 phase variations
- Consider adding progress percentage on hover
- Shimmer effect: 2s linear infinite loop
- Spotlight glow: 2s ease-in-out infinite pulse
- Mobile: Ensure horizontal scroll doesn't conflict with page scroll

---

**Status**: Pending
**Dependencies**: Task 0001 (ProjectCard), Phase 1 complete
**Next Task**: 0003 - PhaseStation Spotlight Enhancement
