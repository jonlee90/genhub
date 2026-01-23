---
name: refactor-to-shared-ui-component
description: "Extract shared UI patterns into reusable components. Detects similar modals, cards, forms, and tables across modules. Creates base components and migrates existing code."
---

# Refactor to Shared UI Component

Extract common UI patterns into reusable base components.

## Trigger

- "refactor similar components"
- "create shared component"
- "deduplicate UI"
- "extract base component"
- "consolidate {pattern}"
- "DRY up components"

## Supported Patterns

| Pattern | Detection | Base Component |
|---------|-----------|----------------|
| Modals | `*Modal*.tsx`, `*Dialog*.tsx` | `ResponsiveModal` |
| Cards | `*Card*.tsx` | `BaseCard` |
| Forms | `*Form*.tsx` | `BaseForm` |
| Lists | `*List*.tsx` | `BaseList` |
| Tables | `*Table*.tsx` | `BaseTable` |

## Workflow

### Phase 1: Discovery

```bash
# Find pattern candidates
find components/ -name "*{Pattern}*.tsx" | head -20

# Analyze each for similarity
```

For each candidate, extract:
- Props interface
- Structure (header/body/footer)
- Behavior (callbacks, state)
- Styling patterns

### Phase 2: Similarity Analysis

```
Similarity Score =
  (matched_props / total_props) × 0.4 +
  (matched_structure / total_structure) × 0.3 +
  (matched_behavior / total_behavior) × 0.3
```

| Score | Action |
|-------|--------|
| ≥70% | Auto-refactor candidate |
| 50-69% | Review required |
| <50% | Skip (too different) |

### Phase 3: Design Base Component

**Superset Props Pattern:**
```typescript
// Collect ALL props from similar components
// Modal A: { isOpen, onClose, title, children }
// Modal B: { open, onDismiss, header, content }
// Modal C: { visible, onHide, title, body }

// Design superset:
interface BaseModalProps {
  // Core (required)
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;

  // Optional (varies)
  title?: string;
  footer?: React.ReactNode;
  size?: 'sm' | 'md' | 'lg';
}
```

### Phase 4: Implementation

**Location:** `components/ui/{BaseComponent}.tsx`

**Requirements:**
- Use GenHub design system colors
- Include 44px touch targets
- Add active states
- Support all discovered use cases

### Phase 5: Migration

```
FOR each similar component:
  1. Replace implementation with base component
  2. Map old props to new props
  3. Verify build passes
  4. Test functionality
```

**Migration Pattern:**
```tsx
// BEFORE
export function ProjectModal({ isOpen, onClose, project }) {
  return (
    <div className={isOpen ? 'modal-open' : 'modal-closed'}>
      {/* custom implementation */}
    </div>
  );
}

// AFTER
import { ResponsiveModal } from '@/components/ui/ResponsiveModal';

export function ProjectModal({ isOpen, onClose, project }) {
  return (
    <ResponsiveModal isOpen={isOpen} onClose={onClose} title="Project">
      {/* same content, base handles chrome */}
    </ResponsiveModal>
  );
}
```

### Phase 6: Cleanup

Only after all migrations verified:
- Delete old component files
- Update barrel exports
- Remove unused imports

## Output Format

```
## Refactoring Summary

### Pattern Detected
- Type: Modal
- Candidates: 5 components
- Similarity: 78% average

### Base Component Created
- `components/ui/BaseModal.tsx`

### Components Migrated
| Component | Status | Notes |
|-----------|--------|-------|
| ProjectModal | ✓ | - |
| TaskModal | ✓ | Added size="lg" |
| ExpenseModal | ✓ | - |
| MaterialModal | ✓ | Added footer |
| ConfirmDialog | ✓ | Renamed |

### Breaking Changes
- None (existing interfaces preserved)

### Files Deleted
- `components/modals/OldModal.tsx`

### Build Verification
✓ TypeScript: No errors
✓ Build: Passed
```

## Safety Rules

| Rule | Reason |
|------|--------|
| Never delete until migration verified | Rollback safety |
| Preserve existing prop interfaces | Backwards compatibility |
| Create adapter props when needed | Smooth transition |
| Test each component individually | Catch regressions |
| Rollback if build fails | Don't break project |

## GenHub-Specific Rules

- All modals → `ResponsiveModal` (not Radix Dialog)
- Colors → Design system only (`#001B51`, `#3C3C3C`)
- Icons → Lucide only
- Touch → 44px minimum
- Active states → `active:scale-[0.98]`
