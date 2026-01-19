# Design: Settings Page Optimization & Improvements

## Architecture Overview

The optimization follows a layered approach:
1. **Performance Layer** - Remove debug logs, add memoization, optimize imports
2. **Code Quality Layer** - Extract shared patterns, fix types, consolidate utilities
3. **Accessibility Layer** - Add ARIA labels, improve focus management
4. **Consistency Layer** - Use design system variables, standardize patterns

```
app/app/settings/
├── page.tsx (Server Component - fetches admin status)
├── default-models/
│   └── page.tsx (Server Component - admin only)
│
components/settings/
├── shared/
│   └── SettingsCard.tsx (NEW - shared card pattern)
│   └── SettingsLoadingSkeleton.tsx (NEW - shared loading)
│   └── ManagerHeader.tsx (NEW - shared header with add button)
├── SettingsSectionHeader.tsx (optimize)
├── ProjectConfigurationSection.tsx (optimize)
├── ChatNotificationPreferences.tsx (optimize)
├── KakaoTalkSettings.tsx (optimize)
├── ProjectTypeManager.tsx (major refactor)
├── TaskTypeManager.tsx (major refactor)
├── PhaseTemplateManager.tsx (optimize)
├── TaskTemplateManager.tsx (optimize)
├── DefaultModelCard.tsx (fix types)
├── ModelUploadModal.tsx (optimize)
└── ModelPreviewModal.tsx (optimize)
```

## Detailed Changes

### 1. Remove Console.log Statements

**Files affected**: All 11 components + 1 page

**Pattern**: Remove all `console.log('[ComponentName]` statements

```typescript
// BEFORE
export function SettingsSectionHeader({ ... }) {
  console.log('[SettingsSectionHeader] Rendering:', { title, disabled });
  // ...
}

// AFTER
export function SettingsSectionHeader({ ... }) {
  // Debug logging removed for production
  // ...
}
```

### 2. Extract Shared Utilities

**New file**: `lib/format-utils.ts`

```typescript
/**
 * Format bytes to human-readable file size
 */
export function formatFileSize(bytes: number): string {
  const mb = bytes / (1024 * 1024);
  return mb > 1 ? `${mb.toFixed(1)} MB` : `${(bytes / 1024).toFixed(1)} KB`;
}
```

**Update**: Remove duplicate `formatFileSize` from:
- `DefaultModelCard.tsx`
- `ModelUploadModal.tsx`

### 3. Fix TypeScript Types

**DefaultModelCard.tsx**: Replace `any` types

```typescript
// BEFORE
const ICON_MAP: Record<string, any> = { ... };

// AFTER
import { LucideIcon } from 'lucide-react';
const ICON_MAP: Record<string, LucideIcon> = { ... };
```

**TaskTemplateManager.tsx**: Clean up type assertions

```typescript
// BEFORE
const taskTypeColor = dbTaskType?.color || defaultTaskType.color;

// AFTER - Ensure consistent type handling
const taskTypeColor = dbTaskType?.color ?? '#001B51';
```

### 4. Memoize Callbacks in DnD Components

**PhaseTemplateManager.tsx** and **TaskTemplateManager.tsx**:

```typescript
// BEFORE
function handleDragEnd(event: DragEndEvent) { ... }

// AFTER
const handleDragEnd = useCallback(async (event: DragEndEvent) => {
  // ... same logic
}, [phaseTemplates, selectedProjectTypeId]);
```

### 5. Memoize Child Components

**SortablePhaseItem** and **SortableTaskItem**:

```typescript
// Wrap with React.memo to prevent unnecessary re-renders
export const SortablePhaseItem = React.memo(function SortablePhaseItem({
  phase,
  isExpanded,
  onToggleExpand,
  onEdit,
  onDelete,
}: SortablePhaseItemProps) {
  // ... component logic
});
```

### 6. Replace Hardcoded Colors with CSS Variables

**Multiple files**: Replace inline hex colors

```typescript
// BEFORE
className="bg-[#001B51]"
className="text-[#059669]"
className="border-[#DC2626]"

// AFTER
className="bg-construction-blue"
className="text-success"  // or keep semantic color
className="border-error"  // or keep semantic color
```

### 7. Accessibility Improvements

**SettingsSectionHeader.tsx**: Add semantic heading level prop

```typescript
interface SettingsSectionHeaderProps {
  icon: LucideIcon;
  title: string;
  description: string;
  disabled?: boolean;
  headingLevel?: 2 | 3 | 4; // NEW
}

export function SettingsSectionHeader({
  headingLevel = 2, // default to h2
  // ...
}: SettingsSectionHeaderProps) {
  const HeadingTag = `h${headingLevel}` as keyof JSX.IntrinsicElements;

  return (
    <div role="region" aria-labelledby={`section-${title.toLowerCase().replace(/\s+/g, '-')}`}>
      <HeadingTag id={`section-${title.toLowerCase().replace(/\s+/g, '-')}`}>
        {title}
      </HeadingTag>
      // ...
    </div>
  );
}
```

**DnD Components**: Add ARIA live regions

```typescript
// PhaseTemplateManager.tsx
<DndContext
  sensors={sensors}
  collisionDetection={closestCenter}
  onDragEnd={handleDragEnd}
  announcements={{
    onDragStart: ({ active }) => `Picked up phase ${active.id}`,
    onDragOver: ({ over }) => over ? `Over phase ${over.id}` : 'Not over a droppable area',
    onDragEnd: ({ active, over }) => over
      ? `Phase ${active.id} was dropped on ${over.id}`
      : `Phase ${active.id} was dropped`,
    onDragCancel: ({ active }) => `Dragging was cancelled. Phase ${active.id} was dropped.`,
  }}
>
```

### 8. Optimize Framer Motion Imports

**KakaoTalkSettings.tsx**, **TaskTypeManager.tsx**, etc.:

```typescript
// BEFORE
import { motion, AnimatePresence } from 'framer-motion';

// AFTER - Use dynamic import for non-critical animations
import dynamic from 'next/dynamic';

const MotionDiv = dynamic(
  () => import('framer-motion').then((mod) => mod.motion.div),
  { ssr: false }
);

// Or for critical animations, keep static import but use simpler animations
```

### 9. Extract Shared Manager Header Pattern

**New component**: `components/settings/shared/ManagerHeader.tsx`

```typescript
interface ManagerHeaderProps {
  title: string;
  description: string;
  onAdd: () => void;
  addButtonLabel: string;
  addDisabled?: boolean;
}

export function ManagerHeader({
  title,
  description,
  onAdd,
  addButtonLabel,
  addDisabled = false,
}: ManagerHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <h3 className="text-lg md:text-xl font-bold text-gray-900">{title}</h3>
        <p className="text-sm text-gray-600">{description}</p>
      </div>
      <Button
        onClick={onAdd}
        disabled={addDisabled}
        className="bg-construction-blue hover:bg-blue-700 text-white transition-all duration-300 shadow-construction min-h-[44px]"
      >
        <Plus className="h-4 w-4 mr-2" />
        {addButtonLabel}
      </Button>
    </div>
  );
}
```

### 10. Consolidate Loading Skeleton Pattern

**New component**: `components/settings/shared/SettingsLoadingSkeleton.tsx`

```typescript
interface SettingsLoadingSkeletonProps {
  rows?: number;
  variant: 'table' | 'card' | 'list';
}

export function SettingsLoadingSkeleton({
  rows = 4,
  variant
}: SettingsLoadingSkeletonProps) {
  // Return appropriate skeleton based on variant
}
```

## Integration Points

### Settings Page → Components

The main settings page passes minimal props:
- `isAdmin` determines if ProjectConfigurationSection shows

### Components → Server Actions

All manager components call server actions directly:
- `getProjectTypes`, `createProjectType`, etc.
- `getTaskTypes`, `createTaskType`, etc.
- `getPhaseTemplates`, `createPhaseTemplate`, etc.
- `getTaskTemplates`, `createTaskTemplate`, etc.

No changes needed to these integrations.

### Mobile Responsiveness

All components maintain:
- 44px minimum touch targets
- Responsive layouts (mobile-first)
- Safe area padding for iPhone notch

## Files Changed Summary

| File | Change Type | Priority |
|------|-------------|----------|
| lib/format-utils.ts | NEW | Medium |
| SettingsSectionHeader.tsx | Optimize | High |
| ProjectConfigurationSection.tsx | Optimize | High |
| ChatNotificationPreferences.tsx | Optimize | High |
| KakaoTalkSettings.tsx | Optimize | Medium |
| ProjectTypeManager.tsx | Major refactor | High |
| TaskTypeManager.tsx | Optimize | High |
| PhaseTemplateManager.tsx | Optimize | High |
| TaskTemplateManager.tsx | Optimize | High |
| DefaultModelCard.tsx | Fix types | Medium |
| ModelUploadModal.tsx | Optimize | Low |
| ModelPreviewModal.tsx | Optimize | Low |

## Performance Targets

| Metric | Current | Target |
|--------|---------|--------|
| Initial render | ~400ms | <200ms |
| Re-render on tab switch | ~150ms | <50ms |
| Bundle size impact | Baseline | No increase |
| Console logs | 30+ | 0 |

## Risk Assessment

| Risk | Impact | Mitigation |
|------|--------|------------|
| Breaking existing functionality | High | Comprehensive testing |
| Bundle size increase | Medium | Tree-shaking, dynamic imports |
| Accessibility regression | Medium | Screen reader testing |
| Type errors | Low | Incremental strict mode |
