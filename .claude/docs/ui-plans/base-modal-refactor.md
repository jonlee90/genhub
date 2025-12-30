# BaseModal Component Refactoring Plan

## Overview

This plan outlines the extraction of common modal patterns from `TaskModal.tsx` into a reusable `BaseModal` component. The goal is to create a consistent, construction-themed modal system that can be used across the application while maintaining all existing functionality.

**Target Date:** TBD
**Complexity:** Medium
**Impact:** High (Affects all modal components)

---

## Current State Analysis

### TaskModal.tsx (Reference Implementation)
**Strengths:**
- Custom header with icon, title, subtitle
- Circular gray close button (h-10 w-10, bg-gray-100)
- Top accent gradient strip (h-1.5)
- Multi-step form support with step indicators
- Footer with left content (Back button) and right content (Submit)
- Construction theme (#001B51 navy blue)
- Mobile responsive: Bottom sheet on mobile, centered modal on desktop
- Framer Motion animations
- Priority-based dynamic theming (create vs edit mode)

**Key Visual Pattern:**
```
┌─────────────────────────────────────┐
│ ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓ │ ← Top accent gradient (1.5px)
├─────────────────────────────────────┤
│  [Icon] Title              [X]      │ ← Header: Icon + Title/Subtitle + Close
│        Subtitle                     │
│  Step Indicator (optional)          │
├─────────────────────────────────────┤
│                                     │
│         Modal Content               │
│                                     │
├─────────────────────────────────────┤
│ [Left Content]    [Right Buttons]   │ ← Footer: Flexible layout
└─────────────────────────────────────┘
```

### CreateExpenseModal.tsx
**Uses:**
- Radix UI Dialog from `dialog.tsx`
- Has custom header with icon/title
- Construction theme styling
- Footer with Back button (when in task context) + Submit
- Similar circular close button pattern

**Issues:**
- Duplicates header pattern from TaskModal
- Duplicates footer layout pattern
- Uses older `dialog.tsx` component instead of custom modal pattern

### ExpenseDetailModal.tsx
**Uses:**
- Radix UI Dialog from `dialog.tsx`
- Custom header with icon + status badge
- Footer with flexible button layout (Close + Delete on left, Review actions on right)
- Construction theme styling

**Issues:**
- Duplicates header pattern
- Duplicates footer pattern
- Uses older `dialog.tsx` component

### dialog.tsx (Current Base)
**Issues:**
- Generic shadcn/ui pattern (not construction-themed)
- Circular close button is hardcoded in DialogContent
- No support for custom header patterns
- No support for top accent gradient
- No built-in step indicator support
- No mobile bottom sheet behavior
- Will be replaced/deprecated after refactor

---

## Component Architecture

### BaseModal Component Structure

```tsx
components/ui/BaseModal.tsx
```

**Responsibilities:**
1. Handle modal open/close state and animations
2. Render backdrop with blur
3. Provide responsive behavior (bottom sheet mobile, centered desktop)
4. Render top accent gradient strip
5. Render header section with icon, title, subtitle, badges, close button
6. Render optional step indicator
7. Render scrollable content area
8. Render footer section with flexible left/right layout
9. Support theming (priority-based colors, construction blue default)

### Component Hierarchy

```
BaseModal (Container)
├── Backdrop (Framer Motion)
├── ModalContainer (Responsive: Bottom Sheet | Centered)
│   ├── TopAccent (Gradient Strip)
│   ├── BaseModalHeader
│   │   ├── IconContainer (Gradient background)
│   │   ├── TitleSection
│   │   │   ├── Title
│   │   │   ├── Badges (optional)
│   │   │   └── Subtitle
│   │   └── CloseButton (Circular)
│   ├── StepIndicator (Optional)
│   ├── Content (Scrollable)
│   └── BaseModalFooter
│       ├── LeftContent (slot)
│       └── RightContent (slot)
```

---

## API Design

### BaseModal Props Interface

```typescript
export interface BaseModalProps {
  // Core state
  isOpen: boolean;
  onClose: () => void;

  // Header configuration
  icon: LucideIcon;
  title: string;
  subtitle?: string;
  badges?: React.ReactNode; // Flexible badge slot

  // Theme configuration
  theme?: ModalTheme | 'default';

  // Step indicator (optional)
  steps?: {
    current: number;
    total: number;
  };

  // Content
  children: React.ReactNode;

  // Footer configuration
  footer?: {
    left?: React.ReactNode;  // e.g., CreatorBadge, Back button
    right?: React.ReactNode; // e.g., Submit, Cancel buttons
  };

  // Advanced options
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl';
  enableMobileBottomSheet?: boolean; // Default: true
  closeOnBackdropClick?: boolean;    // Default: true

  // Form integration
  formKey?: string; // Forces remount when key changes (for edit modals)
}

export interface ModalTheme {
  gradient: string;      // Top accent gradient classes
  iconBg: string;        // Icon container gradient
  button: string;        // Primary button styles
  focusRing: string;     // Input focus ring
  iconColor: string;     // Icon color
}
```

### Theme Presets

```typescript
// lib/config/modal-themes.ts

export const MODAL_THEMES = {
  default: {
    gradient: 'from-construction-blue via-blue-500 to-construction-blue',
    iconBg: 'bg-gradient-to-br from-construction-blue to-blue-600',
    button: 'bg-construction-blue hover:bg-construction-blue/90',
    focusRing: 'focus:ring-construction-blue/20 focus:border-construction-blue',
    iconColor: 'text-construction-blue',
  },
  low: {
    gradient: 'from-emerald-500 via-emerald-400 to-emerald-500',
    iconBg: 'bg-gradient-to-br from-emerald-500 to-emerald-600',
    button: 'bg-emerald-500 hover:bg-emerald-600',
    focusRing: 'focus:ring-emerald-500/20 focus:border-emerald-500',
    iconColor: 'text-emerald-500',
  },
  medium: {
    gradient: 'from-amber-500 via-amber-400 to-amber-500',
    iconBg: 'bg-gradient-to-br from-amber-500 to-amber-600',
    button: 'bg-amber-500 hover:bg-amber-600',
    focusRing: 'focus:ring-amber-500/20 focus:border-amber-500',
    iconColor: 'text-amber-500',
  },
  high: {
    gradient: 'from-red-500 via-red-400 to-red-500',
    iconBg: 'bg-gradient-to-br from-red-500 to-red-600',
    button: 'bg-red-500 hover:bg-red-600',
    focusRing: 'focus:ring-red-500/20 focus:border-red-500',
    iconColor: 'text-red-500',
  },
} as const;
```

### Sub-Components

```typescript
// components/ui/BaseModal/BaseModalHeader.tsx
interface BaseModalHeaderProps {
  icon: LucideIcon;
  title: string;
  subtitle?: string;
  badges?: React.ReactNode;
  onClose: () => void;
  theme: ModalTheme;
}

// components/ui/BaseModal/BaseModalFooter.tsx
interface BaseModalFooterProps {
  left?: React.ReactNode;
  right?: React.ReactNode;
}

// components/ui/BaseModal/StepIndicator.tsx
interface StepIndicatorProps {
  current: number;
  total: number;
  theme: ModalTheme;
}
```

---

## Usage Examples

### Example 1: Simple Modal (Expense Detail)

```tsx
import { BaseModal } from '@/components/ui/BaseModal';
import { Receipt } from 'lucide-react';

function ExpenseDetailModal({ expense, onClose }) {
  return (
    <BaseModal
      isOpen={true}
      onClose={onClose}
      icon={Receipt}
      title="Expense Details"
      badges={<StatusBadge status={expense.status} />}
      maxWidth="4xl"
      footer={{
        left: <Button variant="outline" onClick={onClose}>Close</Button>,
        right: canReview && (
          <>
            <Button variant="outline" onClick={() => handleReview('reject')}>
              Reject
            </Button>
            <Button onClick={() => handleReview('approve')}>
              Approve
            </Button>
          </>
        ),
      }}
    >
      {/* Expense detail content */}
      <div className="space-y-6">
        {/* Receipt image */}
        {/* Expense info */}
        {/* Timeline */}
      </div>
    </BaseModal>
  );
}
```

### Example 2: Multi-Step Modal (Task Create)

```tsx
import { BaseModal } from '@/components/ui/BaseModal';
import { ClipboardList, Pencil } from 'lucide-react';
import { TaskTypeBadge } from './TaskTypeSelector';

function TaskModal({ mode, task, onClose, ... }) {
  const [currentStep, setCurrentStep] = useState(mode === 'edit' ? 2 : 1);
  const [taskType, setTaskType] = useState(task?.task_type || null);

  const theme = mode === 'create'
    ? 'default'
    : MODAL_THEMES[task?.priority] || 'default';

  return (
    <BaseModal
      isOpen={true}
      onClose={onClose}
      icon={mode === 'create' ? ClipboardList : Pencil}
      title={mode === 'create'
        ? (currentStep === 1 ? 'Select Task Type' : 'Create New Task')
        : 'Edit Task'
      }
      subtitle={mode === 'create'
        ? (currentStep === 1
            ? 'Choose the type of task you want to create'
            : `Creating a ${taskType ? getTaskTypeInfo(taskType).label : ''} task`
          )
        : 'Update task details and assignments'
      }
      badges={mode === 'edit' && task?.task_type && (
        <TaskTypeBadge type={task.task_type} />
      )}
      steps={mode === 'create' ? { current: currentStep, total: 2 } : undefined}
      theme={theme}
      maxWidth="2xl"
      formKey={mode === 'edit' && task ? `edit-${task.id}` : 'create'}
      footer={{
        left: mode === 'edit' && task?.creator && (
          <CreatorBadge
            creatorName={task.creator.name}
            createdAt={task.created_at}
          />
        ),
        right: currentStep === 1 ? (
          <Button onClick={() => setCurrentStep(2)} disabled={!taskType}>
            Next <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        ) : (
          <>
            {mode === 'create' && (
              <Button variant="ghost" onClick={() => setCurrentStep(1)}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Button>
            )}
            <Button type="submit" disabled={isPending}>
              {isPending ? 'Saving...' : mode === 'create' ? 'Create Task' : 'Save Changes'}
            </Button>
          </>
        ),
      }}
    >
      <form onSubmit={handleSubmit}>
        {currentStep === 1 ? (
          <TaskTypeSelector selectedType={taskType} onSelect={setTaskType} />
        ) : (
          <TaskFormFields {...formProps} />
        )}
      </form>
    </BaseModal>
  );
}
```

### Example 3: Modal with Context Banner (Create Expense from Task)

```tsx
function CreateExpenseModal({ taskContext, onClose, ... }) {
  return (
    <BaseModal
      isOpen={true}
      onClose={onClose}
      icon={FileText}
      title="Submit Expense"
      subtitle={!taskContext && "Upload a receipt and let AI extract the details automatically"}
      maxWidth="3xl"
      footer={{
        left: taskContext && (
          <Button variant="ghost" onClick={onClose}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Task
          </Button>
        ),
        right: (
          <Button onClick={handleSubmit} disabled={isPending}>
            {isPending ? 'Submitting...' : 'Submit Expense'}
          </Button>
        ),
      }}
    >
      {/* Task context banner */}
      {taskContext && (
        <div className="bg-[#001B51]/10 border-l-4 border-[#001B51] p-4 rounded-r mb-6">
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-[#001B51] mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-medium text-[#001B51]">
                Adding expense for task: {taskContext.taskTitle}
              </p>
              {taskContext.projectName && (
                <p className="text-sm text-gray-600">
                  Project: {taskContext.projectName}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Expense form */}
      <div className="space-y-6">
        {/* Receipt upload */}
        {/* Form fields */}
      </div>
    </BaseModal>
  );
}
```

---

## Implementation Steps

### Phase 1: Create BaseModal Foundation (1-2 days)

#### Task 1.1: Create BaseModal Core
**File:** `components/ui/BaseModal/index.tsx`

- [ ] Create BaseModal component with props interface
- [ ] Implement backdrop with Framer Motion animations
- [ ] Implement responsive container (bottom sheet mobile, centered desktop)
- [ ] Add top accent gradient strip
- [ ] Add scrollable content area with max-height
- [ ] Add formKey support for remounting
- [ ] Add debug console.log statements
- [ ] Export as default component

**Dependencies:**
- `framer-motion`
- `lucide-react`
- `@/lib/hooks/useMediaQuery`
- `@/lib/utils` (cn)

#### Task 1.2: Create BaseModalHeader
**File:** `components/ui/BaseModal/BaseModalHeader.tsx`

- [ ] Create header component with icon, title, subtitle, badges
- [ ] Implement circular close button (h-10 w-10, bg-gray-100)
- [ ] Apply theme to icon container
- [ ] Add responsive layout (flex items-start justify-between)
- [ ] Add debug console.log statements

#### Task 1.3: Create StepIndicator
**File:** `components/ui/BaseModal/StepIndicator.tsx`

- [ ] Create step indicator with current/total steps
- [ ] Implement horizontal stepper with circles and connecting line
- [ ] Apply theme colors to active steps
- [ ] Add debug console.log statements

#### Task 1.4: Create BaseModalFooter
**File:** `components/ui/BaseModal/BaseModalFooter.tsx`

- [ ] Create footer with flexible left/right layout
- [ ] Implement responsive spacing (flex items-center justify-between)
- [ ] Add gray-50 background and top border
- [ ] Add debug console.log statements

#### Task 1.5: Create Theme Configuration
**File:** `lib/config/modal-themes.ts`

- [ ] Create MODAL_THEMES constant with all theme presets
- [ ] Export theme types
- [ ] Add JSDoc comments for each theme
- [ ] Add debug console.log for theme application

---

### Phase 2: Migrate Existing Modals (2-3 days)

#### Task 2.1: Migrate TaskModal
**File:** `components/tasks/TaskModal.tsx`

- [ ] Import BaseModal
- [ ] Refactor to use BaseModal for shell
- [ ] Move form content to children prop
- [ ] Configure header (icon, title, subtitle, badges)
- [ ] Configure footer (CreatorBadge left, buttons right)
- [ ] Configure steps for create mode
- [ ] Apply theme based on mode and priority
- [ ] Test create mode (both steps)
- [ ] Test edit mode
- [ ] Test mobile bottom sheet
- [ ] Verify all existing functionality works

**Breaking Changes:** None (internal refactor only)

#### Task 2.2: Migrate CreateExpenseModal
**File:** `components/expenses/CreateExpenseModal.tsx`

- [ ] Remove Dialog import from `dialog.tsx`
- [ ] Import BaseModal
- [ ] Refactor to use BaseModal
- [ ] Configure header (FileText icon, title, conditional subtitle)
- [ ] Configure footer (conditional Back button, Submit button)
- [ ] Move task context banner into children
- [ ] Test standalone mode
- [ ] Test task context mode
- [ ] Verify receipt upload works
- [ ] Verify form submission works

**Breaking Changes:** None (internal refactor only)

#### Task 2.3: Migrate ExpenseDetailModal
**File:** `components/expenses/ExpenseDetailModal.tsx`

- [ ] Remove Dialog import from `dialog.tsx`
- [ ] Import BaseModal
- [ ] Refactor to use BaseModal
- [ ] Configure header (Receipt icon, title, status badge)
- [ ] Configure footer (Close/Delete left, Review actions right)
- [ ] Test review workflow
- [ ] Test delete workflow
- [ ] Verify CreatorBadge displays correctly

**Breaking Changes:** None (internal refactor only)

#### Task 2.4: Find and Migrate Other Modals
**Files:** TBD (based on grep results)

- [ ] Run grep to find all Dialog/Modal usage
- [ ] Identify candidates for migration
- [ ] Migrate each modal individually
- [ ] Test each migration thoroughly

---

### Phase 3: Cleanup and Documentation (1 day)

#### Task 3.1: Deprecate dialog.tsx
**File:** `components/ui/dialog.tsx`

- [ ] Add deprecation comment at top of file
- [ ] Add JSDoc @deprecated tag
- [ ] Update imports to show deprecation warning
- [ ] Plan for eventual removal (after all modals migrated)

**Note:** Do NOT delete `dialog.tsx` yet - some components may still use it.

#### Task 3.2: Update UI_RULES.md
**File:** `.claude/docs/law/UI_RULES.md`

- [ ] Add BaseModal to Component Library section
- [ ] Add Modal/Dialog pattern documentation
- [ ] Add usage examples
- [ ] Add theme configuration examples
- [ ] Update Component Patterns section with new modal pattern

#### Task 3.3: Create Storybook/Documentation
**Optional:** Create visual documentation

- [ ] Create BaseModal usage guide
- [ ] Add examples for each theme
- [ ] Add examples for multi-step modals
- [ ] Add examples for footer layouts
- [ ] Document mobile bottom sheet behavior

#### Task 3.4: Add Tests
**Files:** `components/ui/BaseModal/__tests__/`

- [ ] Test modal open/close
- [ ] Test backdrop click behavior
- [ ] Test theme application
- [ ] Test step indicator
- [ ] Test responsive behavior
- [ ] Test footer layouts
- [ ] Test formKey remounting

---

## File Structure After Refactoring

```
components/ui/
├── BaseModal/
│   ├── index.tsx                # Main BaseModal component
│   ├── BaseModalHeader.tsx      # Header sub-component
│   ├── BaseModalFooter.tsx      # Footer sub-component
│   ├── StepIndicator.tsx        # Step indicator sub-component
│   ├── types.ts                 # TypeScript interfaces
│   └── __tests__/
│       ├── BaseModal.test.tsx
│       ├── BaseModalHeader.test.tsx
│       └── StepIndicator.test.tsx
├── dialog.tsx                   # @deprecated - to be removed
├── button.tsx
├── card.tsx
└── ...

lib/config/
├── modal-themes.ts              # Theme presets
└── task-type-fields.ts          # Existing

components/tasks/
├── TaskModal.tsx                # ✅ Migrated to BaseModal
└── ...

components/expenses/
├── CreateExpenseModal.tsx       # ✅ Migrated to BaseModal
├── ExpenseDetailModal.tsx       # ✅ Migrated to BaseModal
└── ...
```

---

## Code Snippets for Key Interfaces

### BaseModal Interface

```typescript
// components/ui/BaseModal/types.ts

import { LucideIcon } from 'lucide-react';

export interface ModalTheme {
  gradient: string;      // Top accent gradient classes (e.g., 'from-blue-500 to-blue-600')
  iconBg: string;        // Icon container background (e.g., 'bg-gradient-to-br from-blue-500 to-blue-600')
  button: string;        // Primary button styles (e.g., 'bg-blue-500 hover:bg-blue-600')
  focusRing: string;     // Input focus ring (e.g., 'focus:ring-blue-500/20 focus:border-blue-500')
  iconColor: string;     // Icon color (e.g., 'text-blue-500')
}

export interface BaseModalProps {
  // Core state
  isOpen: boolean;
  onClose: () => void;

  // Header configuration
  icon: LucideIcon;
  title: string;
  subtitle?: string;
  badges?: React.ReactNode;

  // Theme configuration
  theme?: ModalTheme | 'default' | 'low' | 'medium' | 'high';

  // Step indicator (optional, for multi-step forms)
  steps?: {
    current: number;
    total: number;
  };

  // Content
  children: React.ReactNode;

  // Footer configuration
  footer?: {
    left?: React.ReactNode;  // e.g., CreatorBadge, Back button, Delete button
    right?: React.ReactNode; // e.g., Submit, Cancel, action buttons
  };

  // Advanced options
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl';
  enableMobileBottomSheet?: boolean; // Default: true
  closeOnBackdropClick?: boolean;    // Default: true

  // Form integration (forces remount when key changes, for edit modals)
  formKey?: string;
}

export interface BaseModalHeaderProps {
  icon: LucideIcon;
  title: string;
  subtitle?: string;
  badges?: React.ReactNode;
  onClose: () => void;
  theme: ModalTheme;
}

export interface BaseModalFooterProps {
  left?: React.ReactNode;
  right?: React.ReactNode;
}

export interface StepIndicatorProps {
  current: number;
  total: number;
  theme: ModalTheme;
}
```

### BaseModal Skeleton Implementation

```typescript
// components/ui/BaseModal/index.tsx

'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useMediaQuery } from '@/lib/hooks/useMediaQuery';
import { MODAL_THEMES } from '@/lib/config/modal-themes';
import { BaseModalHeader } from './BaseModalHeader';
import { BaseModalFooter } from './BaseModalFooter';
import { StepIndicator } from './StepIndicator';
import type { BaseModalProps, ModalTheme } from './types';

export function BaseModal({
  isOpen,
  onClose,
  icon,
  title,
  subtitle,
  badges,
  theme = 'default',
  steps,
  children,
  footer,
  maxWidth = '2xl',
  enableMobileBottomSheet = true,
  closeOnBackdropClick = true,
  formKey,
}: BaseModalProps) {
  // Debug: Log modal state
  console.log('[BaseModal] Rendering', {
    isOpen,
    title,
    theme,
    steps,
    formKey,
  });

  // Get theme configuration
  const resolvedTheme: ModalTheme = typeof theme === 'string'
    ? MODAL_THEMES[theme] || MODAL_THEMES.default
    : theme;

  // Detect mobile for bottom sheet behavior
  const isMobile = useMediaQuery('(max-width: 767px)');
  const shouldUseBottomSheet = enableMobileBottomSheet && isMobile;

  const maxWidthClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
    '3xl': 'max-w-3xl',
    '4xl': 'max-w-4xl',
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
            onClick={closeOnBackdropClick ? onClose : undefined}
          />

          {/* Modal Container - Responsive */}
          {shouldUseBottomSheet ? (
            /* Mobile: Bottom Sheet */
            <motion.div
              className="fixed inset-x-0 bottom-0 z-50"
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              style={{
                paddingBottom: 'env(safe-area-inset-bottom, 0px)',
              }}
            >
              <ModalContent
                resolvedTheme={resolvedTheme}
                icon={icon}
                title={title}
                subtitle={subtitle}
                badges={badges}
                steps={steps}
                footer={footer}
                onClose={onClose}
                formKey={formKey}
                isBottomSheet={true}
              >
                {children}
              </ModalContent>
            </motion.div>
          ) : (
            /* Desktop: Centered Modal */
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                className={cn('relative w-full pointer-events-auto', maxWidthClasses[maxWidth])}
                onClick={(e) => e.stopPropagation()}
              >
                <ModalContent
                  resolvedTheme={resolvedTheme}
                  icon={icon}
                  title={title}
                  subtitle={subtitle}
                  badges={badges}
                  steps={steps}
                  footer={footer}
                  onClose={onClose}
                  formKey={formKey}
                  isBottomSheet={false}
                >
                  {children}
                </ModalContent>
              </motion.div>
            </div>
          )}
        </>
      )}
    </AnimatePresence>
  );
}

// Internal component for modal content structure
function ModalContent({
  resolvedTheme,
  icon,
  title,
  subtitle,
  badges,
  steps,
  footer,
  onClose,
  formKey,
  isBottomSheet,
  children,
}: {
  resolvedTheme: ModalTheme;
  icon: React.ComponentType<any>;
  title: string;
  subtitle?: string;
  badges?: React.ReactNode;
  steps?: { current: number; total: number };
  footer?: { left?: React.ReactNode; right?: React.ReactNode };
  onClose: () => void;
  formKey?: string;
  isBottomSheet: boolean;
  children: React.ReactNode;
}) {
  return (
    <div
      key={formKey} // Forces remount when key changes
      className={cn(
        'relative bg-white shadow-2xl overflow-hidden',
        isBottomSheet ? 'rounded-t-3xl max-h-[90vh] flex flex-col' : 'rounded-2xl'
      )}
    >
      {/* Drag handle for bottom sheet */}
      {isBottomSheet && (
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-gray-300" />
        </div>
      )}

      {/* Top accent gradient */}
      <div className={cn('h-1.5 bg-gradient-to-r', resolvedTheme.gradient)} />

      {/* Header */}
      <BaseModalHeader
        icon={icon}
        title={title}
        subtitle={subtitle}
        badges={badges}
        onClose={onClose}
        theme={resolvedTheme}
      />

      {/* Step indicator (if provided) */}
      {steps && <StepIndicator {...steps} theme={resolvedTheme} />}

      {/* Content - Scrollable */}
      <div className="px-6 py-5 max-h-[calc(100vh-280px)] overflow-y-auto space-y-5">
        {children}
      </div>

      {/* Footer (if provided) */}
      {footer && <BaseModalFooter {...footer} />}
    </div>
  );
}

// Export types and sub-components
export * from './types';
export { BaseModalHeader } from './BaseModalHeader';
export { BaseModalFooter } from './BaseModalFooter';
export { StepIndicator } from './StepIndicator';
```

---

## Migration Strategy

### Migration Order (Risk-Averse)

1. **Create BaseModal** (Phase 1) - No impact on existing code
2. **Migrate TaskModal** (Phase 2.1) - Highest complexity, most features, test thoroughly
3. **Migrate CreateExpenseModal** (Phase 2.2) - Medium complexity
4. **Migrate ExpenseDetailModal** (Phase 2.3) - Low complexity
5. **Find and migrate other modals** (Phase 2.4) - Case by case
6. **Deprecate dialog.tsx** (Phase 3.1) - Only after all critical modals migrated
7. **Update documentation** (Phase 3.2-3.4)

### Testing Checklist (Per Modal)

- [ ] Modal opens correctly
- [ ] Modal closes correctly (X button, backdrop click, ESC key)
- [ ] Header displays correctly (icon, title, subtitle, badges)
- [ ] Step indicator works (if applicable)
- [ ] Content scrolls correctly
- [ ] Footer layout is correct (left/right alignment)
- [ ] Mobile bottom sheet works on small screens
- [ ] Desktop centered modal works on large screens
- [ ] Theme colors apply correctly
- [ ] Form submission works (if applicable)
- [ ] formKey remounting works for edit modals
- [ ] Animations are smooth
- [ ] No console errors or warnings
- [ ] Accessibility: keyboard navigation works
- [ ] Accessibility: screen reader announces modal correctly

---

## Important Notes

### DO NOT Break Existing Functionality

- TaskModal is actively used for task creation/editing
- CreateExpenseModal is used in multiple contexts (standalone + task-embedded)
- ExpenseDetailModal is used for expense review workflow
- All migrations must be backward compatible

### Maintain Construction Theme

- All colors must use construction theme (#001B51 navy blue)
- Circular close button must be gray (bg-gray-100)
- Top accent gradient must use theme colors
- Icons must be from Lucide React
- Animations must use Framer Motion

### Debug Logging

Every component must have debug console.log statements:
```typescript
console.log('[BaseModal] Rendering', { isOpen, title, theme });
console.log('[BaseModalHeader] Theme applied', { theme });
console.log('[StepIndicator] Current step', { current, total });
```

### TypeScript Strictness

- All props must be typed
- No `any` types except for LucideIcon
- Use `React.ReactNode` for flexible slots
- Export all types from `types.ts`

---

## Success Criteria

- [ ] BaseModal component created and fully functional
- [ ] TaskModal migrated without breaking changes
- [ ] CreateExpenseModal migrated without breaking changes
- [ ] ExpenseDetailModal migrated without breaking changes
- [ ] All existing modal functionality preserved
- [ ] Mobile bottom sheet works correctly
- [ ] Desktop centered modal works correctly
- [ ] All themes apply correctly
- [ ] Step indicator works for multi-step modals
- [ ] Footer layouts are flexible and correct
- [ ] No regression in any modal behavior
- [ ] UI_RULES.md updated with new patterns
- [ ] All debug logging in place
- [ ] Code is production-ready

---

## Future Enhancements (Post-Refactor)

### Optional Features to Consider

1. **Modal Stacking** - Support for modals opening on top of modals
2. **Custom Animations** - Per-modal animation variants
3. **Keyboard Shortcuts** - ESC to close, arrow keys for steps
4. **Focus Trapping** - Keep focus within modal
5. **Scroll Locking** - Prevent body scroll when modal open
6. **Accessibility Improvements** - ARIA labels, focus management
7. **Dark Mode Support** - Construction theme dark variants
8. **Print Styles** - Hide backdrop, show modal content in print view

### Potential New Modal Types

- **ConfirmationModal** - Simple yes/no dialogs
- **AlertModal** - Single-button alerts
- **FormModal** - Pre-configured form wrapper
- **FullScreenModal** - Mobile-first full-screen modals
- **DrawerModal** - Side-sliding drawers

---

## Questions for Clarification

1. Should we support ESC key to close modals?
2. Should we add scroll locking on body when modal is open?
3. Should we add focus trapping for accessibility?
4. Do we want to support modal stacking (modal on top of modal)?
5. Should the close button be customizable (color, size)?
6. Do we need dark mode variants of the construction theme?
7. Should we add a loading state to BaseModal?
8. Do we want to support custom animations per modal instance?

---

## Timeline Estimate

| Phase | Tasks | Estimated Time |
|-------|-------|---------------|
| Phase 1: Create BaseModal | 5 tasks | 1-2 days |
| Phase 2: Migrate Modals | 4+ tasks | 2-3 days |
| Phase 3: Cleanup & Docs | 4 tasks | 1 day |
| **Total** | **13+ tasks** | **4-6 days** |

**Note:** Timeline assumes 1 developer working full-time. Adjust for team size and availability.

---

## Implementation Plan Ready

This plan is ready for handoff to `frontend-builder` for implementation.

**Next Steps:**
1. Review plan with team
2. Get approval for approach
3. Create GitHub issues from tasks
4. Assign to `frontend-builder` agent
5. Begin Phase 1: Create BaseModal Foundation

**Plan Location:** `.claude/docs/ui-plans/base-modal-refactor.md`
