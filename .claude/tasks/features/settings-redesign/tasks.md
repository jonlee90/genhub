# Implementation Tasks: Settings Page Redesign

## Task 1: Redesign ProjectConfigurationSection.tsx

- **Agent**: frontend-engineer
- **Skills**:
  - `.claude/skills/vercel-react-best-practices/SKILL.md`
  - `.claude/skills/frontend/mobile-pwa-design/SKILL.md`
- **Files**:
  - `components/settings/ProjectConfigurationSection.tsx`
- **Depends on**: None
- **Complexity**: Medium
- **Acceptance Criteria**:
  - [ ] Replace custom tab implementation with `FilterTabs` component
  - [ ] Add `useIsMobile` hook with hydration-safe pattern
  - [ ] Add `BlueprintBackground` to both layouts
  - [ ] Add industrial header (`font-black tracking-tighter uppercase`)
  - [ ] Mobile layout: horizontal scroll tabs, `pb-32`, pull-to-refresh
  - [ ] Desktop layout: grid tabs, card container with `shadow-construction`
  - [ ] Use direct Lucide imports (not barrel)
  - [ ] Add `useCallback` for `handleTabChange` and `handleRefresh`
  - [ ] Builds without errors

### Implementation Notes

```tsx
// Key imports to add
import { FilterTabs, type FilterTab } from '@/components/ui/FilterTabs';
import { BlueprintBackground } from '@/components/shared';
import { PullToRefresh, type PullToRefreshHandle } from '@/components/mobile/PullToRefresh';
import { useIsMobile } from '@/lib/hooks/useMediaQuery';
import { useRouter } from 'next/navigation';

// Direct Lucide imports
import Wrench from 'lucide-react/icons/wrench';
import Tag from 'lucide-react/icons/tag';
import Route from 'lucide-react/icons/route';
import ListChecks from 'lucide-react/icons/list-checks';
```

---

## Task 2: Optimize ProjectTypeManager.tsx

- **Agent**: frontend-engineer
- **Skills**:
  - `.claude/skills/vercel-react-best-practices/SKILL.md`
  - `.claude/skills/frontend/mobile-pwa-design/SKILL.md`
- **Files**:
  - `components/settings/ProjectTypeManager.tsx`
- **Depends on**: None (can run in parallel with Task 1)
- **Complexity**: Medium
- **Acceptance Criteria**:
  - [ ] Wrap component export in `memo()`
  - [ ] Convert barrel imports to direct Lucide imports
  - [ ] Replace `motion.div` per-item animations with CSS stagger
  - [ ] Update loading skeleton to use CSS `animate-in`
  - [ ] Ensure all callbacks use `useCallback`
  - [ ] Empty state matches `ProjectsPageClient` pattern
  - [ ] Touch-friendly buttons (`min-h-[44px] min-w-[44px]`)
  - [ ] Builds without errors

### Implementation Notes

```tsx
// Wrap export
export const ProjectTypeManager = memo(function ProjectTypeManager() {
  // ... existing implementation
});

// Direct imports
import Plus from 'lucide-react/icons/plus';
import Edit from 'lucide-react/icons/edit';
import Trash2 from 'lucide-react/icons/trash-2';
// etc.

// CSS stagger pattern
<div
  className="animate-in fade-in slide-in-from-bottom-4"
  style={{
    animationDelay: `${Math.min(index * 50, 300)}ms`,
    animationDuration: '400ms',
    animationFillMode: 'both',
  }}
>
```

---

## Task 3: Optimize TaskTypeManager.tsx

- **Agent**: frontend-engineer
- **Skills**:
  - `.claude/skills/vercel-react-best-practices/SKILL.md`
  - `.claude/skills/frontend/mobile-pwa-design/SKILL.md`
- **Files**:
  - `components/settings/TaskTypeManager.tsx`
- **Depends on**: None (can run in parallel with Tasks 1-2)
- **Complexity**: Medium
- **Acceptance Criteria**:
  - [ ] Wrap component export in `memo()`
  - [ ] Convert barrel imports to direct Lucide imports
  - [ ] Replace `motion.div` per-item animations with CSS stagger
  - [ ] Update loading skeleton to use CSS `animate-in`
  - [ ] Ensure all callbacks use `useCallback`
  - [ ] Empty state matches `ProjectsPageClient` pattern
  - [ ] Grid cards with CSS animations
  - [ ] Touch-friendly buttons (`min-h-[44px] min-w-[44px]`)
  - [ ] Builds without errors

---

## Task 4: Optimize PhaseTemplateManager.tsx

- **Agent**: frontend-engineer
- **Skills**:
  - `.claude/skills/vercel-react-best-practices/SKILL.md`
  - `.claude/skills/frontend/mobile-pwa-design/SKILL.md`
- **Files**:
  - `components/settings/PhaseTemplateManager.tsx`
- **Depends on**: None (can run in parallel with Tasks 1-3)
- **Complexity**: Medium-High
- **Acceptance Criteria**:
  - [ ] Wrap component export in `memo()`
  - [ ] Wrap `SortablePhaseItem` in `React.memo` (already done, verify)
  - [ ] Convert barrel imports to direct Lucide imports
  - [ ] Replace `motion.div` per-item animations with CSS stagger (where possible)
  - [ ] Keep `AnimatePresence` for expand/collapse (necessary for animation)
  - [ ] Update loading skeleton to use CSS `animate-in`
  - [ ] Ensure all callbacks use `useCallback` (verify `handleDragEnd`, etc.)
  - [ ] Empty state matches `ProjectsPageClient` pattern
  - [ ] Touch-friendly drag handles (`p-3 md:p-2 touch-manipulation`)
  - [ ] Builds without errors

### Implementation Notes

- This component uses dnd-kit for drag-and-drop - preserve that functionality
- `SortablePhaseItem` already uses `React.memo` - good
- `AnimatePresence` is needed for expand/collapse animation - keep it

---

## Task 5: Optimize TaskTemplateManager.tsx

- **Agent**: frontend-engineer
- **Skills**:
  - `.claude/skills/vercel-react-best-practices/SKILL.md`
  - `.claude/skills/frontend/mobile-pwa-design/SKILL.md`
- **Files**:
  - `components/settings/TaskTemplateManager.tsx`
- **Depends on**: None (can run in parallel with Tasks 1-4)
- **Complexity**: Medium-High
- **Acceptance Criteria**:
  - [ ] Wrap component export in `memo()`
  - [ ] Wrap `SortableTaskItem` in `React.memo`
  - [ ] Convert barrel imports to direct Lucide imports
  - [ ] Replace `motion.div` per-item animations with CSS stagger
  - [ ] Update loading skeleton to use CSS `animate-in`
  - [ ] Ensure all callbacks use `useCallback`
  - [ ] Empty state matches `ProjectsPageClient` pattern
  - [ ] Mobile-responsive layout (already has stacked mobile layout)
  - [ ] Touch-friendly buttons (`h-11 sm:h-8`, `min-h-[44px]`)
  - [ ] Builds without errors

### Implementation Notes

- This component uses dnd-kit for drag-and-drop - preserve that functionality
- Already has responsive mobile/desktop layout patterns - verify they follow best practices

---

## Task 6: Integration Testing & Code Review

- **Agent**: code-reviewer
- **Skills**:
  - `.claude/skills/workflow/code-review.md`
- **Files**:
  - All modified files from Tasks 1-5
- **Depends on**: Tasks 1, 2, 3, 4, 5
- **Complexity**: Simple
- **Acceptance Criteria**:
  - [ ] All components render correctly on mobile (test with devtools)
  - [ ] All components render correctly on desktop
  - [ ] FilterTabs animation works smoothly
  - [ ] Pull-to-refresh works on mobile layout
  - [ ] CRUD operations work (create, edit, delete)
  - [ ] Drag-and-drop reordering works (PhaseTemplateManager, TaskTemplateManager)
  - [ ] No TypeScript errors
  - [ ] No ESLint warnings
  - [ ] Build passes (`npm run build`)
  - [ ] No console errors in browser
  - [ ] No Supabase imports in client components

---

## Task 7: Build Verification

- **Agent**: code-reviewer
- **Skills**: None (uses `/kc:build`)
- **Files**: None
- **Depends on**: Task 6
- **Complexity**: Simple
- **Acceptance Criteria**:
  - [ ] `npm run build` completes without errors
  - [ ] No type errors
  - [ ] Bundle size not significantly increased

---

## Execution Order

Tasks 1-5 can run **in parallel** (no dependencies between them).

```
[Task 1] ─┐
[Task 2] ─┼──→ [Task 6: Review] ──→ [Task 7: Build]
[Task 3] ─┤
[Task 4] ─┤
[Task 5] ─┘
```

## Orchestration Notes

When delegating to frontend-engineer:

```
ORCHESTRATED=true
SKIP_BUILD=true
SKIP_SYNC=true
```

For Task 6 (code-reviewer) and Task 7 (build):

```
# Run build verification
npm run build 2>&1 | grep -E "error|Error" -A 3
```

## Summary

| Task | Component | Agent | Complexity | Parallel? |
|------|-----------|-------|------------|-----------|
| 1 | ProjectConfigurationSection | frontend-engineer | Medium | Yes |
| 2 | ProjectTypeManager | frontend-engineer | Medium | Yes |
| 3 | TaskTypeManager | frontend-engineer | Medium | Yes |
| 4 | PhaseTemplateManager | frontend-engineer | Medium-High | Yes |
| 5 | TaskTemplateManager | frontend-engineer | Medium-High | Yes |
| 6 | Integration Testing | code-reviewer | Simple | No |
| 7 | Build Verification | code-reviewer | Simple | No |
