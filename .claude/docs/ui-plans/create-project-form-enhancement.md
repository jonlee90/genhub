# CreateProjectForm UI Enhancement Plan

> **Created**: 2026-01-19
> **Component**: `components/projects/CreateProjectForm.tsx`
> **Status**: Ready for Implementation
> **Estimated Effort**: Medium (4-6 hours)

---

## Overview

This plan outlines UI/UX improvements for the CreateProjectForm multi-step wizard. The form is used to create new construction projects and includes 4 steps: Type Selection, Project Details, Location, and Timeline/Budget.

### Current State Assessment

**Strengths:**
- Already uses ResponsiveModal (auto-switches between BaseModal desktop and BottomSheetModal mobile)
- MobileInput components with 56px height (touch-friendly)
- Framer Motion animations between steps
- Client-side validation with touched field tracking
- Phase template preview (collapsible)

**Areas for Improvement:**
1. Progress indicator could be more prominent and visually engaging
2. Project type selection cards lack interactive depth/feedback
3. Form field experience could have smoother animations
4. Loading/submission states need more visual feedback
5. Validation UX could be more immediate and contextual

---

## Component Architecture

```
CreateProjectForm
├── ResponsiveModal (wrapper - already exists)
│   ├── Desktop: BaseModal (centered dialog)
│   └── Mobile: BottomSheetModal (92vh fixed height)
│
├── FormProgressHeader (NEW - enhanced stepper)
│   └── AnimatedStepIndicator (existing StepIndicator enhanced)
│
├── Step 0: ProjectTypeSelector (ENHANCED)
│   └── InteractiveTypeCard[] (5 cards with 3D hover effects)
│       └── PhaseTemplatePreview (collapsible)
│
├── Step 1: ProjectDetailsStep (REFACTORED)
│   └── AnimatedFormField[] (enhanced MobileInput wrapper)
│
├── Step 2: LocationStep (REFACTORED)
│   └── AnimatedFormField[]
│
├── Step 3: TimelineStep (REFACTORED)
│   └── AnimatedFormField[]
│   └── ReadyToCreateBanner (enhanced)
│
└── FormSubmissionOverlay (NEW - multi-step loader)
```

---

## Aceternity UI Components

### Recommended Components

| Component | Purpose | Installation |
|-----------|---------|--------------|
| **Multi-Step Loader** | Submission feedback with sequential states | `npx shadcn@latest add @aceternity/multi-step-loader` |
| **Hover Border Gradient** | Enhanced project type card selection | `npx shadcn@latest add @aceternity/hover-border-gradient` |

### Components Already Available in Project

| Component | Location | Use Case |
|-----------|----------|----------|
| PlaceholdersVanishInput | `components/ui/aceternity/placeholders-vanish-input.tsx` | Could enhance search-style inputs |
| Stepper | `components/ui/aceternity/stepper.tsx` | Reference for step animations |

### Components Considered but NOT Recommended

| Component | Reason |
|-----------|--------|
| Wobble Card | Too playful for professional construction app |
| 3D Card Effect | Performance overhead on mobile; unnecessary complexity |
| Focus Cards | Image-centric; not suitable for icon-based type selection |
| Animated Modal | Already have superior ResponsiveModal system |

---

## Detailed Improvements

### 1. Enhanced Progress Indicator

**Current**: StepIndicator with circles, labels, connecting lines
**Proposed**: Enhanced version with better mobile visibility and micro-interactions

**Specifications:**
```typescript
// Animation timing
const STEP_TRANSITION = { duration: 0.3, ease: [0.4, 0, 0.2, 1] };
const STEP_COMPLETE_SPRING = { type: 'spring', stiffness: 400, damping: 20 };

// Visual changes
- Mobile: Compact horizontal dots with current step label only
- Desktop: Full stepper with all labels visible
- Active step: Pulsing glow animation (subtle, 2s cycle)
- Completed step: Checkmark with scale-in animation
- Connecting line: Animated fill from left to right on completion
```

**Mobile Compact Mode:**
```
[ 1 ] ─── [ 2 ] ─── [ 3 ] ─── [ 4 ]
          Details
        "Step 2 of 4"
```

### 2. Project Type Selection Enhancement

**Current**: 5 cards in grid, selected card has blue border + checkmark
**Proposed**: Interactive cards with hover border gradient and improved feedback

**Specifications:**

```typescript
// Card interaction states
interface TypeCardStates {
  default: {
    border: '2px solid #E5E7EB',      // gray-200
    background: 'white',
    transform: 'scale(1)',
  },
  hover: {
    border: 'gradient border animation',  // rotating gradient
    background: 'rgba(0, 27, 81, 0.02)',  // construction-blue/2
    transform: 'scale(1.02)',
  },
  selected: {
    border: '2px solid #001B51',
    background: 'rgba(0, 27, 81, 0.05)',
    transform: 'scale(1)',
    checkmark: 'animated scale-in top-right',
  },
  pressed: {
    transform: 'scale(0.98)',
    transition: '100ms',
  }
}

// Hover Border Gradient integration
<HoverBorderGradient
  containerClassName="rounded-xl"
  className="bg-white"
  duration={2}
  clockwise={true}
>
  <TypeCardContent />
</HoverBorderGradient>
```

**Layout Optimization:**
- Desktop: 3 cards top row, 2 cards centered bottom row (current)
- Mobile: 2x2 grid + 1 centered, or vertical stack if space constrained
- Minimum card height: 100px (current) - keep as is

### 3. Form Field Animation System

**Current**: MobileInput with basic focus ring
**Proposed**: Animated form field wrapper with enhanced states

**AnimatedFormField Component:**

```typescript
interface AnimatedFormFieldProps {
  // Existing MobileInput props
  label: string;
  name: string;
  error?: string;
  // New animation props
  animateOnMount?: boolean;
  showSuccessState?: boolean;
  focusHighlight?: 'ring' | 'glow' | 'border';
}

// Animation specifications
const fieldAnimations = {
  mount: {
    initial: { opacity: 0, y: 8 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.2, delay: index * 0.05 }
  },
  focus: {
    ring: 'ring-2 ring-[#001B51]/20',
    border: 'border-[#001B51]',
    labelFloat: { y: -24, scale: 0.85 }
  },
  error: {
    shake: { x: [-4, 4, -4, 4, 0], transition: { duration: 0.3 } },
    border: 'border-[#DC2626] border-2',
    message: { opacity: 1, y: 0, height: 'auto' }
  },
  success: {
    border: 'border-[#059669]',
    icon: 'checkmark fade-in right side of input'
  }
};
```

**Inline Validation Feedback:**
- Show validation on blur (current behavior - keep)
- Animate error message appearance (slide down + fade)
- Shake animation on submit attempt with errors
- Success checkmark for valid fields (optional, enabled on final step)

### 4. Loading/Submission States

**Current**: Button shows "Creating..." with spinner
**Proposed**: Multi-step loader overlay for form submission

**FormSubmissionOverlay Component:**

```typescript
const submissionStates = [
  { text: 'Validating project details...' },
  { text: 'Setting up project phases...' },
  { text: 'Configuring health tracking...' },
  { text: 'Creating your project...' },
];

// Visual specification
- Full modal overlay (semi-transparent)
- Centered loader with construction-blue theme
- Sequential state progression (500ms each)
- Success state with project name confirmation
- Auto-dismiss after 500ms on success
```

**Integration:**
```tsx
{isPending && (
  <FormSubmissionOverlay
    states={submissionStates}
    isComplete={state.success}
    projectName={formValues.name}
  />
)}
```

### 5. Mobile-Specific Adaptations

**Bottom Sheet Optimizations:**
- Already using 92vh fixed height via BottomSheetModal
- Content scrolls within container (good)
- Footer is fixed at bottom (good)

**Additional Mobile Enhancements:**

```typescript
// Keyboard handling
- Auto-scroll to focused field when keyboard opens
- inputMode optimization (already using: text, email, tel, numeric, decimal)
- enterKeyHint for form flow (already using: next, done)

// Touch feedback
- All interactive elements have active:scale-[0.98]
- Haptic feedback on button press (via TouchButton)

// Date inputs
- Use native date picker (current)
- Style to match MobileInput height (56px)
```

**Responsive Step Content:**

| Step | Mobile | Desktop |
|------|--------|---------|
| Type | 2 columns, vertical scroll | 3+2 grid |
| Details | Single column stack | 2-column for email/phone |
| Location | Single column | 2-column for city/state |
| Timeline | Single column | 2-column for dates |

### 6. Accessibility Requirements (WCAG 2.1 AA)

**Required Implementations:**

| Requirement | Current | Action |
|-------------|---------|--------|
| Focus management | Partial | Auto-focus first field on step change |
| Keyboard navigation | Good | Ensure all cards are keyboard accessible |
| Screen reader | Good | Add step announcements via aria-live |
| Error announcements | Partial | Add role="alert" to error messages |
| Color contrast | Good | All text meets 4.5:1 ratio |
| Touch targets | Good | 56px input height, 44px+ buttons |

**New ARIA Additions:**

```tsx
// Step navigation announcements
<div aria-live="polite" aria-atomic="true" className="sr-only">
  {`Step ${currentStep + 1} of ${FORM_STEPS.length}: ${FORM_STEPS[currentStep]}`}
</div>

// Project type selection
<div role="radiogroup" aria-label="Select project type">
  {PROJECT_TYPES.map(type => (
    <button
      role="radio"
      aria-checked={projectType === type.value}
      aria-label={`${type.label}: ${type.description}`}
    >
      ...
    </button>
  ))}
</div>

// Form validation
<MobileInput
  aria-invalid={!!error}
  aria-describedby={error ? `${name}-error` : undefined}
/>
```

---

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `components/projects/CreateProjectForm.tsx` | Modify | Refactor into sub-components, add animations |
| `components/projects/form/ProjectTypeSelector.tsx` | Create | Extract type selection step |
| `components/projects/form/InteractiveTypeCard.tsx` | Create | Enhanced card with hover gradient |
| `components/projects/form/AnimatedFormField.tsx` | Create | Wrapper for animated inputs |
| `components/projects/form/FormProgressHeader.tsx` | Create | Enhanced mobile-aware stepper |
| `components/projects/form/FormSubmissionOverlay.tsx` | Create | Multi-step loader overlay |
| `components/ui/BaseModal/StepIndicator.tsx` | Modify | Add mobile compact mode |

---

## Implementation Steps

### Phase 1: Component Extraction (1-2 hours)

1. Create `components/projects/form/` directory
2. Extract ProjectTypeSelector from CreateProjectForm
3. Extract step content into separate components
4. Ensure no functionality regression

### Phase 2: Progress Indicator Enhancement (1 hour)

1. Add mobile compact mode to StepIndicator
2. Implement aria-live announcements
3. Add completion animation for connecting lines

### Phase 3: Type Card Enhancement (1 hour)

1. Install Hover Border Gradient: `npx shadcn@latest add @aceternity/hover-border-gradient`
2. Create InteractiveTypeCard component
3. Apply gradient effect to hover state only (not selected)
4. Ensure keyboard accessibility

### Phase 4: Form Field Animations (1 hour)

1. Create AnimatedFormField wrapper
2. Add mount animations with staggered delay
3. Implement error shake animation
4. Add success state checkmark (optional)

### Phase 5: Submission Overlay (1 hour)

1. Install Multi-Step Loader: `npx shadcn@latest add @aceternity/multi-step-loader`
2. Create FormSubmissionOverlay component
3. Integrate with form submission flow
4. Test with slow network simulation

### Phase 6: Testing & Polish (1 hour)

1. Test on mobile devices (iOS Safari, Android Chrome)
2. Verify all animations run at 60fps
3. Test keyboard navigation
4. Verify screen reader announcements
5. Test with slow 3G network

---

## Dependencies

| Package | Version | Required For | Already Installed |
|---------|---------|--------------|-------------------|
| framer-motion | ^11.x | All animations | Yes |
| clsx | ^2.x | Class merging | Yes |
| tailwind-merge | ^2.x | Tailwind class merging | Yes |
| lucide-react | ^0.x | Icons | Yes |
| @radix-ui/react-dialog | ^1.x | Modal primitives | Yes |

**New Dependencies (via Aceternity CLI):**
- None required - both recommended components use existing dependencies

---

## Construction Theme Integration

### Colors (from DESIGN_SYSTEM.md)

```css
--construction-blue: #001B51    /* Primary actions, selected states */
--construction-accent: #3C3C3C  /* Secondary text */
--construction-green: #059669   /* Success states, completed steps */
--construction-red: #DC2626     /* Error states, validation */
--construction-yellow: #FBBF24  /* Warning states */
```

### Icons (Lucide)

| Use Case | Icon | Notes |
|----------|------|-------|
| Residential | Home | Current |
| Restaurant | UtensilsCrossed | Current |
| Cafe | Coffee | Current |
| Commercial | Building2 | Current |
| Industrial | Factory | Current |
| Step complete | Check | Animated on completion |
| Error | AlertCircle | Shake animation |
| Loading | Loader2 | Spin animation |

### Design Patterns

- Border radius: `rounded-xl` (12px) for cards, `rounded-2xl` (16px) for modal
- Shadow: `shadow-sm` for cards, `shadow-2xl` for modal
- Spacing: 16px padding (p-4) standard, 24px (p-6) for sections
- Transitions: 200ms default, spring physics for interactions

---

## Important Notes

### Performance Considerations

1. **Lazy Load Steps**: Only render current step content (already implemented via conditional rendering)
2. **Memoize Handlers**: Continue using useCallback for event handlers
3. **Avoid Layout Thrashing**: Use transform for animations, not layout properties
4. **Image Optimization**: None needed (icons only)

### Mobile PWA Checklist

- [x] 44px minimum tap targets (56px inputs, 44px+ buttons)
- [x] 16px font size prevents iOS zoom
- [x] Safe area handling via BottomSheetModal
- [x] Touch feedback (active:scale)
- [x] Native keyboard optimizations (inputMode, enterKeyHint)
- [ ] Add haptic feedback to type card selection (implement in Phase 3)

### Testing Requirements

1. **Devices**: iPhone SE, iPhone 14, Pixel 5, Galaxy S21
2. **Browsers**: Safari iOS, Chrome Android, Chrome Desktop, Firefox
3. **Network**: Test on 3G throttling
4. **Accessibility**: VoiceOver (iOS), TalkBack (Android), NVDA (Windows)

### Known Gotchas

1. **Date Inputs**: Native date picker styling varies by browser - keep minimal custom styling
2. **State Select**: Uses custom component - ensure focus states match
3. **Form Submission**: Hidden inputs persist values across steps - do not remove
4. **Phase Templates**: API calls happen on step 0 - ensure loading states

---

## Success Metrics

| Metric | Current | Target |
|--------|---------|--------|
| Time to complete form | ~2 min | ~1.5 min |
| Mobile form abandonment | Unknown | Reduce by 20% |
| Lighthouse Accessibility | ~90 | 100 |
| Animation frame rate | 60fps | 60fps (maintain) |

---

## Handoff Notes

This plan is ready for the **frontend-builder** agent to implement.

**Key Decisions Made:**
1. Use Hover Border Gradient for type cards (subtle, professional)
2. Use Multi-Step Loader for submission feedback
3. Keep existing ResponsiveModal system (superior to Aceternity modal)
4. Enhance rather than replace StepIndicator
5. Mobile compact mode for stepper (dots + current label only)

**Questions for Implementation:**
- None - all decisions documented above

**Files to Reference:**
- `/Users/jonathanlee/Desktop/genhub/components/projects/CreateProjectForm.tsx` (current implementation)
- `/Users/jonathanlee/Desktop/genhub/components/ui/BaseModal/StepIndicator.tsx` (stepper to enhance)
- `/Users/jonathanlee/Desktop/genhub/components/mobile/MobileInput.tsx` (input pattern reference)
- `/Users/jonathanlee/Desktop/genhub/.claude/docs/frontend/DESIGN_SYSTEM.md` (design tokens)
- `/Users/jonathanlee/Desktop/genhub/.claude/skills/frontend/mobile-pwa-design/SKILL.md` (mobile patterns)
