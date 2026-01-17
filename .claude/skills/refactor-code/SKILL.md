---
name: refactor-code
description: Intelligently Refactor and Improve Code Quality. Detects similar UI patterns (modals, cards, forms, tables) across modules, extracts shared base components, and systematically replaces duplicate implementations. Use when: (1) consolidating duplicate modal/dialog patterns into BaseModal, (2) extracting common UI patterns into shared components, (3) reducing code duplication across modules, (4) standardizing component APIs across a project. Triggers on "refactor similar components", "create shared component", "deduplicate UI", "extract base component", "consolidate patterns", or "DRY up components".
---

# Refactor Code Skill

Extract shared patterns from similar components and consolidate into reusable base components.

## Workflow Overview

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│  Discovery  │ -> │   Design    │ -> │ Implement   │ -> │  Migrate    │ -> │   Verify    │
│  (Analyze)  │    │   (Plan)    │    │  (Create)   │    │ (Replace)   │    │   (Test)    │
└─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘
```

## Phase 1: Discovery

### Step 1.1: Scan for Pattern Candidates

```bash
# Find all modal-like components
find . -name "*Modal*.tsx" -o -name "*Dialog*.tsx" | head -30

# Find all card-like components
find . -name "*Card*.tsx" | head -30

# Generic pattern search
grep -r "interface.*Props" --include="*.tsx" -l | head -50
```

### Step 1.2: Analyze Each Component

For each candidate, extract:

| Aspect | Analysis Question |
|--------|------------------|
| **Props** | What props does it accept? Required vs optional? |
| **Structure** | Header/body/footer sections? Nested components? |
| **Behavior** | Open/close logic? Form handling? Callbacks? |
| **Styling** | Tailwind classes? CSS modules? Inline styles? |
| **State** | Local state? External state management? |

### Step 1.3: Calculate Similarity Score

```
Similarity = (matched_props / total_props) × 0.4
           + (matched_structure / total_structure) × 0.3
           + (matched_behavior / total_behavior) × 0.3
```

**Thresholds:**
- **≥70%**: Auto-refactor candidate (proceed to Phase 2)
- **50-69%**: Review required (present options to user)
- **<50%**: Skip (too different to consolidate)

## Phase 2: Design Base Component

### Step 2.1: Identify Superset Props

Collect ALL props from ALL similar components:

```typescript
// Example: Analyzing 3 modal components found these props:
// Modal A: { isOpen, onClose, title, children }
// Modal B: { open, onDismiss, header, content, footer }
// Modal C: { visible, onHide, title, body, actions }

// Superset design:
interface BaseModalProps {
  // Core (required) - common across all
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;

  // Optional (extend) - varies by usage
  title?: string;
  footer?: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  closeOnOverlayClick?: boolean;
  closeOnEscape?: boolean;
  className?: string;
}
```

### Step 2.2: Design Composition Pattern

Choose the pattern that best fits the use case:

| Pattern | When to Use | Example |
|---------|-------------|---------|
| **Children** | Simple content injection | `<Modal>{content}</Modal>` |
| **Render Props** | Dynamic content with data | `<Modal render={(data) => ...}/>` |
| **Compound** | Complex multi-part UIs | `<Modal.Header/><Modal.Body/>` |
| **Slots** | Named content areas | `header={...} footer={...}` |

## Phase 3: Implementation

### Step 3.1: Create Base Component

Location: `components/ui/` or `components/shared/`

```typescript
// components/ui/BaseModal.tsx
'use client';

import { useEffect, useCallback } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  title?: string;
  footer?: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  closeOnOverlayClick?: boolean;
  closeOnEscape?: boolean;
  showCloseButton?: boolean;
  className?: string;
  contentClassName?: string;
}

const sizeClasses = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
  full: 'max-w-[95vw] max-h-[95vh]',
};

export function BaseModal({
  isOpen,
  onClose,
  children,
  title,
  footer,
  size = 'md',
  closeOnOverlayClick = true,
  closeOnEscape = true,
  showCloseButton = true,
  className,
  contentClassName,
}: BaseModalProps) {
  // Escape key handler
  const handleEscape = useCallback((e: KeyboardEvent) => {
    if (closeOnEscape && e.key === 'Escape') onClose();
  }, [closeOnEscape, onClose]);

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, handleEscape]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      onClick={closeOnOverlayClick ? onClose : undefined}
    >
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/50" />

      {/* Content */}
      <div
        className={cn(
          'relative bg-white rounded-lg shadow-xl w-full mx-4',
          sizeClasses[size],
          className
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        {(title || showCloseButton) && (
          <div className="flex items-center justify-between p-4 border-b">
            {title && <h2 className="text-lg font-semibold">{title}</h2>}
            {showCloseButton && (
              <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded">
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        )}

        {/* Body */}
        <div className={cn('p-4', contentClassName)}>
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div className="flex justify-end gap-2 p-4 border-t">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
```

### Step 3.2: Create Adapter Props (if needed)

For backwards compatibility with existing prop names:

```typescript
// Adapter for components using 'open' instead of 'isOpen'
interface LegacyModalProps extends Omit<BaseModalProps, 'isOpen'> {
  open?: boolean;  // Legacy prop
  isOpen?: boolean; // New prop
}

export function LegacyCompatibleModal({ open, isOpen, ...props }: LegacyModalProps) {
  return <BaseModal isOpen={open ?? isOpen ?? false} {...props} />;
}
```

## Phase 4: Migration

### Step 4.1: Migrate One Component First

1. Pick the simplest component as proof-of-concept
2. Replace implementation with BaseModal
3. Verify build passes: `npm run build`
4. Verify functionality in browser

### Step 4.2: Systematic Migration

For each remaining component:

```typescript
// BEFORE: Module-specific modal
export function ProjectModal({ isOpen, onClose, project }) {
  return (
    <div className={isOpen ? 'modal-open' : 'modal-closed'}>
      <div className="modal-header">
        <h2>Project Details</h2>
        <button onClick={onClose}>X</button>
      </div>
      <div className="modal-body">
        {/* project-specific content */}
      </div>
    </div>
  );
}

// AFTER: Using BaseModal
import { BaseModal } from '@/components/ui/BaseModal';

export function ProjectModal({ isOpen, onClose, project }) {
  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title="Project Details"
      size="lg"
    >
      {/* project-specific content - unchanged */}
    </BaseModal>
  );
}
```

### Step 4.3: Remove Deprecated Files

Only AFTER all migrations verified:
- Delete old component files
- Update barrel exports
- Remove unused imports

## Phase 5: Verification

### Step 5.1: Type Check

```bash
npx tsc --noEmit
```

### Step 5.2: Build

```bash
npm run build
```

### Step 5.3: Document Changes

Produce migration summary:

```markdown
## Refactoring Summary

### Base Component Created
- `components/ui/BaseModal.tsx` (new)

### Components Migrated (5)
| Original | Status | Notes |
|----------|--------|-------|
| ProjectModal.tsx | ✅ Migrated | - |
| TaskModal.tsx | ✅ Migrated | Added size="lg" |
| ExpenseModal.tsx | ✅ Migrated | - |
| MaterialModal.tsx | ✅ Migrated | Added footer slot |
| ConfirmDialog.tsx | ✅ Migrated | Renamed to ConfirmModal |

### Breaking Changes
None - all existing prop interfaces preserved

### Files Deleted
- components/modals/legacy/OldModal.tsx
```

## Safety Rules

| Rule | Rationale |
|------|-----------|
| NEVER delete originals until migration verified | Rollback safety |
| ALWAYS preserve existing prop interfaces | Backwards compatibility |
| CREATE adapter props when needed | Smooth transition |
| TEST each component individually | Catch regressions early |
| ROLLBACK if build fails | Don't break the project |

## Detection Heuristics

See `references/detection-heuristics.md` for detailed similarity scoring.

## Migration Patterns

See `references/migration-patterns.md` for complex refactoring scenarios.
