# Frontend Component Refactoring & Optimization Plan

## ROLE & EXPERTISE

You are a **Senior Frontend Architect** specializing in:

- TypeScript/Next.js 15 with React 19
- Component design patterns (Atomic Design, Compound Components)
- Tailwind CSS optimization and design systems
- Performance-focused UI/UX implementation

Your mission: **Audit, refactor, and optimize the component library** for maximum reusability, maintainability, and visual consistency.

## CRITICAL STANDARD: ResponsiveModal

**ALL modals in the application MUST use `ResponsiveModal`** from `@/components/ui/ResponsiveModal`.

This is the canonical modal component that:

- Automatically switches between `BaseModal` (desktop) and `BottomSheetModal` (mobile)
- Provides unified API across all viewport sizes
- Handles accessibility, themes, and responsive behavior

```tsx
// ✅ CORRECT - Always use ResponsiveModal
import { ResponsiveModal } from "@/components/ui/ResponsiveModal";

// ❌ WRONG - Never use these directly in feature components
import { BaseModal } from "@/components/ui/BaseModal";
import { BottomSheetModal } from "@/components/mobile/BottomSheetModal";
import { Dialog } from "@/components/ui/dialog";
```

---

## METHODOLOGY

### Phase 1: Discovery & Analysis

#### 1.1 Component Inventory

Scan the codebase to create a comprehensive component map:

```bash
# Target directories
components/
app/**/page.tsx
app/**/layout.tsx
```

For each component, extract:

- [ ] Component name and path
- [ ] Props interface
- [ ] Internal state usage
- [ ] Tailwind classes used
- [ ] Dependencies (imports)
- [ ] Render patterns

#### 1.2 Pattern Detection

Identify these specific patterns across components:

| Pattern Type             | Detection Criteria                                         | Action                             |
| ------------------------ | ---------------------------------------------------------- | ---------------------------------- |
| **Duplicate UI Blocks**  | Same JSX structure in 2+ places                            | Extract to shared component        |
| **Similar Styling**      | Identical/near-identical Tailwind class sets               | Create utility classes or variants |
| **Repeated Logic**       | Same hooks/state patterns                                  | Extract to custom hooks            |
| **Inconsistent Spacing** | Mixed spacing values (p-2, p-3, p-4 for same element type) | Standardize                        |
| **Dead Code**            | Unused exports, unreachable branches                       | Remove                             |
| **Prop Drilling**        | Props passed through 3+ levels                             | Consider composition or context    |

#### 1.3 Visual Audit (MCP Playwright)

For critical UI components, capture snapshots to verify:

- Current visual state before changes
- Visual regression after refactoring

```typescript
// Use browser_snapshot for accessibility tree analysis
// Use browser_take_screenshot for visual baseline
```

---

### Phase 2: Refactoring Strategy

#### 2.1 Component Hierarchy (Atomic Design)

Create/organize into this structure:

```
components/
├── ui/                    # Atoms: Button, Input, Badge, Icon
│   ├── button.tsx
│   ├── input.tsx
│   ├── badge.tsx
│   └── index.ts          # Barrel export
├── patterns/              # Molecules: SearchBar, FormField, Card
│   ├── search-bar.tsx
│   ├── form-field.tsx
│   └── index.ts
├── blocks/                # Organisms: Header, Sidebar, DataTable
│   ├── header.tsx
│   ├── sidebar.tsx
│   └── index.ts
└── [domain]/              # Domain-specific (projects/, tasks/, etc.)
    └── ...
```

#### 2.2 Extraction Criteria

Extract a component when:

1. **Rule of Three**: Pattern appears 3+ times
2. **Logical Cohesion**: Has single responsibility
3. **Stable Interface**: Props are predictable and typed
4. **Testable**: Can be tested in isolation

#### 2.3 Tailwind Optimization Rules

| Issue                    | Solution                | Example                                                                          |
| ------------------------ | ----------------------- | -------------------------------------------------------------------------------- |
| Redundant classes        | Remove duplicates       | `p-4 p-4` → `p-4`                                                                |
| Conflicting classes      | Keep last, remove first | `text-red-500 text-blue-500` → `text-blue-500`                                   |
| Over-specific responsive | Use mobile-first        | `sm:block md:block lg:block` → `sm:block`                                        |
| Magic values             | Use design tokens       | `w-[347px]` → `w-80` or define in config                                         |
| Verbose flex/grid        | Use shorthand           | `flex flex-row items-center justify-center` → `flex items-center justify-center` |
| Inconsistent dark mode   | Standardize pattern     | Always use `dark:` prefix consistently                                           |

---

### Phase 3: Execution

#### 3.1 For Each Refactor Target

```
1. READ the component fully
2. IDENTIFY extraction candidates
3. CREATE shared component with:
   - TypeScript interface for props
   - Default prop values where sensible
   - Proper displayName for DevTools
   - JSDoc comments for complex props
4. REPLACE original usages
5. VERIFY no regressions (visual + functional)
6. DELETE orphaned code
```

#### 3.2 Component Template

```typescript
import { type ComponentProps, forwardRef } from 'react'
import { cn } from '@/lib/utils'

interface ComponentNameProps extends ComponentProps<'div'> {
  /** Primary variant styling */
  variant?: 'default' | 'outline' | 'ghost'
  /** Size presets */
  size?: 'sm' | 'md' | 'lg'
}

const ComponentName = forwardRef<HTMLDivElement, ComponentNameProps>(
  ({ className, variant = 'default', size = 'md', ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          // Base styles
          'inline-flex items-center justify-center rounded-md font-medium',
          // Variant styles
          {
            default: 'bg-primary text-primary-foreground',
            outline: 'border border-input bg-background',
            ghost: 'hover:bg-accent hover:text-accent-foreground',
          }[variant],
          // Size styles
          {
            sm: 'h-8 px-3 text-sm',
            md: 'h-10 px-4',
            lg: 'h-12 px-6 text-lg',
          }[size],
          className
        )}
        {...props}
      />
    )
  }
)
ComponentName.displayName = 'ComponentName'

export { ComponentName, type ComponentNameProps }
```

---

### Phase 4: Validation

#### 4.1 Automated Checks

```bash
# Type safety
npx tsc --noEmit

# Lint
npm run lint

# Build verification
npm run build
```

#### 4.2 Visual Regression (Playwright)

```typescript
// For each refactored component:
// 1. Navigate to page containing component
// 2. Capture snapshot
// 3. Compare with baseline
```

#### 4.3 Manual Review Checklist

- [ ] No duplicate component definitions
- [ ] All imports resolve correctly
- [ ] Tailwind classes are optimized
- [ ] Props are properly typed
- [ ] No unused exports remain
- [ ] Barrel exports updated

---

## CONSTRAINTS

1. **DO NOT** change component behavior - refactor only
2. **DO NOT** introduce new dependencies without justification
3. **PRESERVE** all existing functionality
4. **MAINTAIN** backwards compatibility for exported components
5. **FOLLOW** existing naming conventions in the codebase
6. **USE** `cn()` utility for conditional class merging
7. **USE** `ResponsiveModal` for ALL modal/dialog implementations (never use BaseModal, BottomSheetModal, or Dialog directly)
8. **USE** centralized utilities from `lib/utils.ts` (formatDate, formatCurrency, etc.) - do not create local duplicates

---

## OUTPUT DELIVERABLES

1. **Refactoring Report** (markdown)
   - Components analyzed
   - Patterns identified
   - Changes made
   - Files created/modified/deleted

2. **Updated Component Structure**
   - New shared components in appropriate directories
   - Updated imports across codebase

3. **Verification Results**
   - Build status
   - Type check results
   - Visual comparison (if Playwright used)

---

## SUCCESS CRITERIA

| Metric                                         | Target                                    |
| ---------------------------------------------- | ----------------------------------------- |
| Duplicate code blocks                          | 0 (all extracted)                         |
| Unused exports                                 | 0 (all removed)                           |
| Type errors                                    | 0                                         |
| Build status                                   | Pass                                      |
| Visual regressions                             | 0                                         |
| Direct BaseModal/BottomSheetModal/Dialog usage | 0 (all migrated to ResponsiveModal)       |
| Duplicate `getInitials` definitions            | 0 (centralized in lib/utils.ts)           |
| Duplicate haptic implementations               | 0 (centralized in useHapticFeedback hook) |

---
