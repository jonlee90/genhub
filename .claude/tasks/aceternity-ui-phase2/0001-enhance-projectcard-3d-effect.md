# Task 0001: Enhance ProjectCard with 3D Card Effect

**Priority**: HIGH
**Estimated Time**: 2-3 hours
**Component**: `components/projects/ProjectCard.tsx`

## Objective
Transform ProjectCard into an interactive 3D card with Aceternity UI effects, tilt animation, and enhanced depth perception.

## Current State
- Basic card with gradient top border
- Static health score display
- Simple hover effects (scale + shadow)

## Target State (Aceternity UI)
- **3D Tilt Effect**: Card tilts on mouse move following cursor position
- **Depth Shadows**: Multi-layered shadows for material elevation
- **Enhanced Health Score**: Circular progress ring with animated gradient glow
- **Gradient Enhancements**: Dynamic gradient based on project health status
- **Hover State**: Smooth 3D transformation with spring physics

## Implementation Steps

### 1. Install Dependencies (if needed)
```bash
# Framer Motion already installed
# May need additional utilities for 3D transforms
```

### 2. Update ProjectCard Component

**File**: `components/projects/ProjectCard.tsx`

**Add 3D Tilt Logic**:
```typescript
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { useState, useRef } from "react";

// Mouse tracking for 3D tilt
const x = useMotionValue(0);
const y = useMotionValue(0);

const rotateX = useSpring(useTransform(y, [-0.5, 0.5], [7.5, -7.5]));
const rotateY = useSpring(useTransform(x, [-0.5, 0.5], [-7.5, 7.5]));

const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
  const rect = e.currentTarget.getBoundingClientRect();
  const centerX = rect.left + rect.width / 2;
  const centerY = rect.top + rect.height / 2;
  x.set((e.clientX - centerX) / (rect.width / 2));
  y.set((e.clientY - centerY) / (rect.height / 2));
};

const handleMouseLeave = () => {
  x.set(0);
  y.set(0);
};
```

**3D Transform Styles**:
```typescript
<motion.div
  style={{
    rotateX,
    rotateY,
    transformStyle: "preserve-3d",
  }}
  onMouseMove={handleMouseMove}
  onMouseLeave={handleMouseLeave}
  className="relative rounded-xl bg-white border-2 shadow-construction-xl transition-shadow duration-300 hover:shadow-construction-xl"
>
  {/* Card content */}
</motion.div>
```

### 3. Enhanced Health Score with Circular Progress

**Add Circular Progress Component**:
```typescript
// Health score ring with gradient
<div className="relative w-16 h-16">
  <svg className="w-full h-full transform -rotate-90">
    <circle
      cx="32"
      cy="32"
      r="28"
      stroke="currentColor"
      strokeWidth="4"
      fill="none"
      className="text-gray-200"
    />
    <motion.circle
      cx="32"
      cy="32"
      r="28"
      stroke="url(#healthGradient)"
      strokeWidth="4"
      fill="none"
      strokeLinecap="round"
      initial={{ pathLength: 0 }}
      animate={{ pathLength: health / 100 }}
      transition={{ duration: 1.5, ease: "easeOut" }}
      strokeDasharray={`${2 * Math.PI * 28}`}
      style={{
        filter: "drop-shadow(0 0 8px rgba(0, 27, 81, 0.6))",
      }}
    />
    <defs>
      <linearGradient id="healthGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor={health >= 70 ? "#10B981" : health >= 50 ? "#FFB627" : "#EF4444"} />
        <stop offset="100%" stopColor={health >= 70 ? "#10B981" : health >= 50 ? "#F59E0B" : "#DC2626"} />
      </linearGradient>
    </defs>
  </svg>
  <div className="absolute inset-0 flex items-center justify-center">
    <span className="text-lg font-bold">{health}%</span>
  </div>
</div>
```

### 4. Multi-Layer Depth Shadows

**Update Tailwind classes**:
```typescript
className={cn(
  "relative group cursor-pointer",
  "bg-white rounded-xl border-2 border-gray-200",
  "shadow-construction-lg hover:shadow-construction-xl",
  "transition-all duration-300",
  // Add construction-themed shadow based on project type
  projectType === "residential" && "hover:shadow-blue-500/20",
  projectType === "commercial" && "hover:shadow-purple-500/20",
  projectType === "industrial" && "hover:shadow-slate-500/20",
)}
```

### 5. Animated Gradient Top Border

**Enhance gradient animation**:
```typescript
<div className="absolute top-0 left-0 right-0 h-1 overflow-hidden rounded-t-xl">
  <motion.div
    className={cn(
      "h-full bg-gradient-to-r",
      getProjectTypeGradient(projectType)
    )}
    animate={{
      backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"],
    }}
    transition={{
      duration: 3,
      repeat: Infinity,
      ease: "linear",
    }}
    style={{
      backgroundSize: "200% 100%",
    }}
  />
</div>
```

## Acceptance Criteria

- [ ] Card tilts smoothly on mouse move (3D perspective)
- [ ] Depth shadows create clear elevation hierarchy
- [ ] Health score animates with circular progress ring
- [ ] Gradient health indicator (green → yellow → red based on score)
- [ ] Hover state triggers smooth 3D transformation
- [ ] Spring physics feel natural (no jarring movements)
- [ ] Performance: 60fps animations on desktop, 30fps on mobile
- [ ] Accessibility: Card remains functional without JavaScript
- [ ] Reduced motion: Respects `prefers-reduced-motion` setting

## Testing Checklist

- [ ] Test on desktop (Chrome, Firefox, Safari)
- [ ] Test on mobile (iOS Safari, Chrome Android)
- [ ] Test with keyboard navigation
- [ ] Test with screen reader
- [ ] Test performance with 20+ cards on screen
- [ ] Verify colors match construction theme (#001B51)
- [ ] Check hover state doesn't break layout

## Design Reference

**Aceternity UI Components**:
- [3D Card Effect](https://ui.aceternity.com/components/3d-card-effect)
- [Card Hover Effect](https://ui.aceternity.com/components/card-hover-effect)

**Construction Theme**:
- Primary: #001B51 (blue)
- Health: Green (#10B981) → Yellow (#FFB627) → Red (#EF4444)
- Shadow: Multi-layer with blue tint

## Notes

- Use `transform: preserve-3d` for proper 3D rendering
- Spring physics: stiffness 400, damping 10
- Circular progress animation: 1.5s ease-out on mount
- Consider lazy loading for cards below fold

---

**Status**: Pending
**Dependencies**: Phase 1 complete (Tailwind config, Framer Motion installed)
**Next Task**: 0002 - MetroJourney Timeline Enhancement
