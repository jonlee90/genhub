# Implementation Tasks: Settings Page Optimization & Improvements

## Task Overview

Total tasks: 12
Estimated complexity: Medium
Agent coordination: frontend-engineer (primary), code-reviewer (validation)

---

## Task 1: Create Shared Utility Functions

**Agent**: frontend-engineer
**Priority**: High (blocking dependency)
**Complexity**: Simple

### Description
Create a shared utility file for format functions used across settings components.

### Files
- **Create**: `lib/format-utils.ts`

### Implementation Details
```typescript
// lib/format-utils.ts
/**
 * Format bytes to human-readable file size
 * @param bytes - File size in bytes
 * @returns Formatted string (e.g., "1.5 MB" or "500 KB")
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const mb = bytes / (1024 * 1024);
  return mb >= 1 ? `${mb.toFixed(1)} MB` : `${(bytes / 1024).toFixed(1)} KB`;
}
```

### Acceptance Criteria
- [ ] File created with proper TypeScript types
- [ ] JSDoc comments included
- [ ] Exported from lib/index or usable via direct import

---

## Task 2: Optimize SettingsSectionHeader

**Agent**: frontend-engineer
**Priority**: High
**Complexity**: Simple
**Depends on**: None

### Description
Remove console.log, add memoization, improve accessibility.

### Files
- **Modify**: `components/settings/SettingsSectionHeader.tsx`

### Changes
1. Remove `console.log('[SettingsSectionHeader]` line
2. Wrap component with `React.memo`
3. Add `role="region"` and proper `aria-labelledby`
4. Add optional `headingLevel` prop for semantic HTML

### Acceptance Criteria
- [ ] No console.log statements
- [ ] Component memoized
- [ ] Proper ARIA attributes
- [ ] TypeScript compiles without errors

---

## Task 3: Optimize ProjectConfigurationSection

**Agent**: frontend-engineer
**Priority**: High
**Complexity**: Simple
**Depends on**: None

### Description
Remove console.log, extract tab configuration to const, add memoization.

### Files
- **Modify**: `components/settings/ProjectConfigurationSection.tsx`

### Changes
1. Remove `console.log('[ProjectConfigurationSection]` line
2. Move `tabs` array outside component (it's static)
3. Memoize tab button click handlers with `useCallback`

### Acceptance Criteria
- [ ] No console.log statements
- [ ] Tabs array defined outside component
- [ ] Click handlers memoized
- [ ] TypeScript compiles without errors

---

## Task 4: Optimize ChatNotificationPreferences

**Agent**: frontend-engineer
**Priority**: High
**Complexity**: Medium
**Depends on**: None

### Description
Remove console.logs, consolidate switch styling, improve type safety.

### Files
- **Modify**: `components/settings/ChatNotificationPreferences.tsx`

### Changes
1. Remove all `console.log('[ChatNotificationPreferences]` statements (5 total)
2. Extract repeated switch className to a constant
3. Memoize `handlePushToggle` and `handleEmailToggle` with `useCallback`
4. Replace hardcoded colors with CSS variables where appropriate

### Acceptance Criteria
- [ ] No console.log statements (5 removed)
- [ ] Handlers memoized
- [ ] Switch styling consolidated
- [ ] TypeScript compiles without errors

---

## Task 5: Optimize KakaoTalkSettings

**Agent**: frontend-engineer
**Priority**: Medium
**Complexity**: Medium
**Depends on**: None

### Description
Remove console.logs, memoize handlers, optimize framer-motion usage.

### Files
- **Modify**: `components/settings/KakaoTalkSettings.tsx`

### Changes
1. Remove all `console.log('[KakaoTalkSettings]` statements (8 total)
2. Memoize `fetchConnectionStatus`, `handleConnect`, `handleDisconnect`, `handleSyncToggle` with `useCallback`
3. Extract connection status fetching to a custom hook or useEffect cleanup
4. Consider using CSS transitions instead of framer-motion for simple fade animations

### Acceptance Criteria
- [ ] No console.log statements (8 removed)
- [ ] Handlers memoized with proper dependencies
- [ ] Animations optimized or simplified
- [ ] TypeScript compiles without errors

---

## Task 6: Major Refactor - ProjectTypeManager

**Agent**: frontend-engineer
**Priority**: High
**Complexity**: Medium
**Depends on**: Task 1

### Description
Remove console.logs, fix duplicate patterns, improve accessibility.

### Files
- **Modify**: `components/settings/ProjectTypeManager.tsx`

### Changes
1. Remove all `console.log('[ProjectTypeManager]` statements (7 total)
2. Memoize `loadProjectTypes`, `handleCreate`, `handleUpdate`, `handleDelete` with `useCallback`
3. Move `AVAILABLE_ICONS` constant outside component
4. Add `aria-busy` to table during loading
5. Update duplicate formatFileSize usage (if any) to use shared utility

### Acceptance Criteria
- [ ] No console.log statements (7 removed)
- [ ] Handlers memoized
- [ ] AVAILABLE_ICONS outside component
- [ ] Proper ARIA attributes on table
- [ ] TypeScript compiles without errors

---

## Task 7: Optimize TaskTypeManager

**Agent**: frontend-engineer
**Priority**: High
**Complexity**: Medium
**Depends on**: Task 1

### Description
Remove console.logs, memoize handlers, align patterns with ProjectTypeManager.

### Files
- **Modify**: `components/settings/TaskTypeManager.tsx`

### Changes
1. Remove all `console.log('[TaskTypeManager]` statements (5 total)
2. Memoize `loadTaskTypes`, `handleCreate`, `handleUpdate`, `handleDelete` with `useCallback`
3. Move `AVAILABLE_ICONS` constant outside component
4. Ensure consistent patterns with ProjectTypeManager

### Acceptance Criteria
- [ ] No console.log statements (5 removed)
- [ ] Handlers memoized
- [ ] AVAILABLE_ICONS outside component
- [ ] Patterns consistent with ProjectTypeManager
- [ ] TypeScript compiles without errors

---

## Task 8: Optimize PhaseTemplateManager

**Agent**: frontend-engineer
**Priority**: High
**Complexity**: Complex
**Depends on**: Task 1

### Description
Remove console.logs, memoize DnD handlers, wrap SortablePhaseItem with memo.

### Files
- **Modify**: `components/settings/PhaseTemplateManager.tsx`

### Changes
1. Remove all `console.log('[PhaseTemplateManager]` statements (6 total)
2. Wrap `SortablePhaseItem` with `React.memo`
3. Memoize `handleDragEnd` with `useCallback` and proper dependencies
4. Memoize `togglePhaseExpansion` with `useCallback`
5. Add ARIA announcements to DndContext for screen readers
6. Move `TASK_TYPE_CONFIG` constant outside component

### Acceptance Criteria
- [ ] No console.log statements (6 removed)
- [ ] SortablePhaseItem wrapped with React.memo
- [ ] DnD handlers memoized
- [ ] ARIA announcements added
- [ ] TASK_TYPE_CONFIG outside component
- [ ] TypeScript compiles without errors

---

## Task 9: Optimize TaskTemplateManager

**Agent**: frontend-engineer
**Priority**: High
**Complexity**: Complex
**Depends on**: Task 1

### Description
Remove console.logs, memoize DnD handlers, fix type handling, wrap SortableTaskItem with memo.

### Files
- **Modify**: `components/settings/TaskTemplateManager.tsx`

### Changes
1. Remove all `console.log('[TaskTemplateManager]` statements (7 total)
2. Wrap `SortableTaskItem` with `React.memo`
3. Memoize `handleDragEnd` with `useCallback` and proper dependencies
4. Move `DEFAULT_TASK_TYPE_CONFIG` and `PRIORITY_CONFIG` constants outside component
5. Fix type handling for task type color (ensure no undefined)
6. Add ARIA announcements to DndContext for screen readers

### Acceptance Criteria
- [ ] No console.log statements (7 removed)
- [ ] SortableTaskItem wrapped with React.memo
- [ ] DnD handlers memoized
- [ ] Constants outside component
- [ ] Type handling fixed
- [ ] ARIA announcements added
- [ ] TypeScript compiles without errors

---

## Task 10: Fix Types in DefaultModelCard

**Agent**: frontend-engineer
**Priority**: Medium
**Complexity**: Simple
**Depends on**: Task 1

### Description
Replace `any` types, use shared formatFileSize, remove console.log.

### Files
- **Modify**: `components/settings/DefaultModelCard.tsx`

### Changes
1. Remove `console.log('[DefaultModelCard]` statement
2. Replace `Record<string, any>` with `Record<string, LucideIcon>`
3. Import and use `formatFileSize` from `lib/format-utils.ts`
4. Remove local `formatFileSize` function

### Acceptance Criteria
- [ ] No console.log statements
- [ ] No `any` types
- [ ] Uses shared formatFileSize utility
- [ ] TypeScript compiles without errors

---

## Task 11: Optimize ModelUploadModal

**Agent**: frontend-engineer
**Priority**: Low
**Complexity**: Simple
**Depends on**: Task 1

### Description
Remove console.log, use shared formatFileSize.

### Files
- **Modify**: `components/settings/ModelUploadModal.tsx`

### Changes
1. Remove all `console.log('[ModelUploadModal]` statements (3 total)
2. Import and use `formatFileSize` from `lib/format-utils.ts`
3. Remove local `formatFileSize` function
4. Memoize `handleFileSelect` and `handleUpload` with `useCallback`

### Acceptance Criteria
- [ ] No console.log statements (3 removed)
- [ ] Uses shared formatFileSize utility
- [ ] Handlers memoized
- [ ] TypeScript compiles without errors

---

## Task 12: Optimize ModelPreviewModal

**Agent**: frontend-engineer
**Priority**: Low
**Complexity**: Simple
**Depends on**: None

### Description
Remove console.log.

### Files
- **Modify**: `components/settings/ModelPreviewModal.tsx`

### Changes
1. Remove `console.log('[ModelPreviewModal]` statement

### Acceptance Criteria
- [ ] No console.log statements
- [ ] TypeScript compiles without errors

---

## Task 13: Build Verification & Code Review

**Agent**: code-reviewer
**Priority**: High
**Complexity**: Medium
**Depends on**: Tasks 1-12

### Description
Run build, verify no TypeScript errors, test all settings functionality.

### Commands
```bash
npm run build 2>&1 | grep -E "error|Error" -A 3
npm run lint
```

### Verification Checklist
- [ ] Build completes successfully
- [ ] No TypeScript errors
- [ ] No ESLint errors
- [ ] Settings page loads correctly
- [ ] All tabs in ProjectConfigurationSection work
- [ ] All CRUD operations in managers work
- [ ] Drag-and-drop reordering works
- [ ] Modals open and close correctly
- [ ] Keyboard navigation works
- [ ] No console.log output in browser

### Acceptance Criteria
- [ ] Build passes
- [ ] All manual tests pass
- [ ] No regressions

---

## Execution Order

```
Phase 1 (Foundation):
├── Task 1: Create Shared Utility Functions

Phase 2 (Simple Components - Parallel):
├── Task 2: SettingsSectionHeader
├── Task 3: ProjectConfigurationSection
├── Task 4: ChatNotificationPreferences
├── Task 12: ModelPreviewModal

Phase 3 (Medium Components - Parallel):
├── Task 5: KakaoTalkSettings
├── Task 10: DefaultModelCard
├── Task 11: ModelUploadModal

Phase 4 (Manager Components - Parallel):
├── Task 6: ProjectTypeManager
├── Task 7: TaskTypeManager

Phase 5 (Complex DnD Components - Parallel):
├── Task 8: PhaseTemplateManager
├── Task 9: TaskTemplateManager

Phase 6 (Validation):
└── Task 13: Build Verification & Code Review
```

## Summary

| Phase | Tasks | Complexity | Agent |
|-------|-------|------------|-------|
| 1 | 1 | Simple | frontend-engineer |
| 2 | 4 | Simple | frontend-engineer |
| 3 | 3 | Medium | frontend-engineer |
| 4 | 2 | Medium | frontend-engineer |
| 5 | 2 | Complex | frontend-engineer |
| 6 | 1 | Medium | code-reviewer |

Total console.log statements to remove: **45+**
Total files modified: **12**
New files created: **1**
