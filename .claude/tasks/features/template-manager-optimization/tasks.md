# Implementation Tasks: Template Manager Optimization & Fixes

## Task Overview

This feature requires frontend-only changes to fix the "Add Task" button and optimize performance following Vercel React Best Practices.

---

## Task 1: Fix "Add Task" Button - Parent Coordination

**Agent**: frontend-engineer
**Skills**: `skills/frontend/component-patterns.md`, `skills/frontend/state-management.md`
**Files**:
- `app/(company)/[companyId]/settings/page.tsx` (Settings page - parent component)

**Dependencies**: None

**Description**:
Add state management and callback to Settings page to coordinate tab switching between PhaseTemplateManager and TaskTemplateManager.

**Implementation**:
1. Add state for selected phase when "Add Task" is clicked:
   ```tsx
   const [selectedPhaseForTask, setSelectedPhaseForTask] = useState<string>('');
   ```

2. Create callback to handle "Add Task" click:
   ```tsx
   const handleAddTaskToPhase = useCallback((phaseId: string) => {
     setSelectedPhaseForTask(phaseId);
     setActiveTab('tasks'); // Switch to Task Templates tab
     // Optional: scroll to top for better UX
     window.scrollTo({ top: 0, behavior: 'smooth' });
   }, []);
   ```

3. Pass callback to PhaseTemplateManager:
   ```tsx
   <PhaseTemplateManager
     // ... existing props
     onAddTaskToPhase={handleAddTaskToPhase}
   />
   ```

4. Update TaskTemplateManager to use selectedPhaseForTask:
   ```tsx
   <TaskTemplateManager
     // ... existing props
     selectedPhaseTemplateId={selectedPhaseForTask || selectedPhaseTemplateId}
   />
   ```

**Acceptance**:
- Settings page compiles without errors
- Callback is passed to PhaseTemplateManager
- TaskTemplateManager receives phase selection
- No console errors

**Estimated Complexity**: Simple

---

## Task 2: Wire Up "Add Task" Buttons in PhaseTemplateManager

**Agent**: frontend-engineer
**Skills**: `skills/frontend/component-patterns.md`, `skills/vercel-react-best-practices.md`
**Files**:
- `components/settings/PhaseTemplateManager.tsx`

**Dependencies**: Task 1

**Description**:
Add onClick handlers to both "Add Task" buttons (empty state and task list header) and update component interface to accept callback prop.

**Implementation**:
1. Update interface:
   ```tsx
   interface PhaseTemplateManagerProps {
     // ... existing props
     onAddTaskToPhase?: (phaseTemplateId: string) => void;
   }
   ```

2. Wire up empty state button (line 143):
   ```tsx
   <Button
     size="sm"
     variant="outline"
     onClick={() => onAddTaskToPhase?.(phase.id)}
     className="border-2 border-construction-blue..."
   >
     <Plus className="h-3 w-3 mr-1.5" />
     Add Task Template
   </Button>
   ```

3. Wire up task list header button (line 159):
   ```tsx
   <Button
     size="sm"
     variant="ghost"
     onClick={() => onAddTaskToPhase?.(phase.id)}
     className="h-7 text-xs..."
   >
     <Plus className="h-3 w-3 mr-1" />
     Add Task
   </Button>
   ```

**Acceptance**:
- Component compiles without errors
- Clicking "Add Task" in empty state triggers callback
- Clicking "Add Task" in task list triggers callback
- Correct phase ID is passed to callback
- No console errors

**Estimated Complexity**: Simple

---

## Task 3: Apply `rerender-functional-setstate` to PhaseTemplateManager

**Agent**: frontend-engineer
**Skills**: `skills/vercel-react-best-practices.md`
**Files**:
- `components/settings/PhaseTemplateManager.tsx`

**Dependencies**: Task 2

**Description**:
Optimize `handleDragEnd` to use stable callback reference and prevent unnecessary re-renders when `phaseTemplates` prop changes.

**Implementation**:

Current code (lines 277-306) has `phaseTemplates` in dependencies:
```tsx
const handleDragEnd = useCallback(async (event: DragEndEvent) => {
  // Uses phaseTemplates in closure
}, [phaseTemplates, selectedProjectTypeId, onRefreshPhases]);
```

Update to remove dependency by using functional pattern:
```tsx
const handleDragEnd = useCallback(async (event: DragEndEvent) => {
  const { active, over } = event;
  if (!over || active.id === over.id) return;

  // Get latest phaseTemplates from prop without dependency
  // Since phaseTemplates is a prop, we need to keep it in deps
  // BUT we can extract the reorder logic to avoid recreation

  const oldIndex = phaseTemplates.findIndex((p) => p.id === active.id);
  const newIndex = phaseTemplates.findIndex((p) => p.id === over.id);
  if (oldIndex === -1 || newIndex === -1) return;

  const newOrder = arrayMove(phaseTemplates, oldIndex, newIndex);
  const orderedIds = newOrder.map((p) => p.id);

  const result = await reorderPhaseTemplates(
    selectedProjectTypeId,
    orderedIds,
  );

  if (result.error) {
    toast.error("Failed to reorder phases");
  } else {
    toast.success("Phase order updated");
  }

  onRefreshPhases();
}, [phaseTemplates, selectedProjectTypeId, onRefreshPhases]);
```

**Note**: Since `phaseTemplates` is a prop (not local state), we can't use functional setState. The callback IS already optimized as much as possible. Document this in comments.

**Acceptance**:
- Code compiles without errors
- Drag-and-drop still works correctly
- Add comment explaining why phaseTemplates is in deps
- No console warnings about dependencies

**Estimated Complexity**: Simple

---

## Task 4: Apply `rerender-functional-setstate` to TaskTemplateManager

**Agent**: frontend-engineer
**Skills**: `skills/vercel-react-best-practices.md`
**Files**:
- `components/settings/TaskTemplateManager.tsx`

**Dependencies**: None (independent)

**Description**:
Optimize `handleDragEnd` to use functional setState, removing `taskTemplates` from dependencies and preventing callback recreation.

**Implementation**:

Current code (lines 270-298):
```tsx
const handleDragEnd = useCallback(async (event: DragEndEvent) => {
  // ... guards ...

  // Optimistic update
  const newOrder = arrayMove(taskTemplates, oldIndex, newIndex);
  setTaskTemplates(newOrder);

  // Persist to backend
  const orderedIds = newOrder.map((t) => t.id);
  const result = await reorderTaskTemplates(
    selectedPhaseTemplateId,
    orderedIds,
  );

  if (result.error) {
    toast.error("Failed to reorder tasks");
    loadTaskTemplates(selectedPhaseTemplateId);
  } else {
    toast.success("Task order updated");
  }
}, [taskTemplates, selectedPhaseTemplateId, loadTaskTemplates]);
```

Update to use functional setState:
```tsx
const handleDragEnd = useCallback(async (event: DragEndEvent) => {
  const { active, over } = event;
  if (!over || active.id === over.id || !selectedPhaseTemplateId) return;

  let orderedIds: string[] = [];

  // Optimistic update using functional setState
  setTaskTemplates(current => {
    const oldIndex = current.findIndex((t) => t.id === active.id);
    const newIndex = current.findIndex((t) => t.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return current;

    const newOrder = arrayMove(current, oldIndex, newIndex);
    orderedIds = newOrder.map((t) => t.id);
    return newOrder;
  });

  // Persist to backend (async, outside setState)
  const result = await reorderTaskTemplates(
    selectedPhaseTemplateId,
    orderedIds,
  );

  if (result.error) {
    toast.error("Failed to reorder tasks");
    loadTaskTemplates(selectedPhaseTemplateId);
  } else {
    toast.success("Task order updated");
  }
}, [selectedPhaseTemplateId, loadTaskTemplates]);
// ✅ taskTemplates removed from deps - callback is stable
```

**Acceptance**:
- Drag-and-drop works correctly
- Optimistic update still happens
- Backend persist works
- Callback doesn't recreate unnecessarily
- No console warnings

**Estimated Complexity**: Simple

---

## Task 5: Hoist Empty State Components

**Agent**: frontend-engineer
**Skills**: `skills/vercel-react-best-practices.md`
**Files**:
- `components/settings/PhaseTemplateManager.tsx`
- `components/settings/TaskTemplateManager.tsx`

**Dependencies**: Tasks 3, 4

**Description**:
Extract static JSX for empty states into memoized components outside main components to prevent recreation on every render (`rendering-hoist-jsx` rule).

**Implementation**:

**PhaseTemplateManager.tsx** - Extract 3 empty states:

1. No project type selected (lines 400-411):
```tsx
const NoProjectTypeSelected = React.memo(() => (
  <div className="flex flex-col items-center justify-center py-16 text-center">
    <div className="p-6 bg-gradient-to-br from-construction-blue/5 to-construction-blue/10 rounded-full border-2 border-construction-blue/20 mb-4">
      <Layers className="h-16 w-16 text-construction-blue" />
    </div>
    <h3 className="text-xl font-black text-gray-900 mb-2 uppercase tracking-tight">
      Select a Project Type
    </h3>
    <p className="text-gray-500 max-w-md">
      Choose a project type from the dropdown above to view and manage its
      phase templates
    </p>
  </div>
));
NoProjectTypeSelected.displayName = 'NoProjectTypeSelected';
```

2. Empty phases (lines 439-460):
```tsx
const EmptyPhaseState = React.memo(({ onCreate }: { onCreate: () => void }) => (
  <div className="flex flex-col items-center justify-center py-16 text-center animate-in fade-in zoom-in-95 duration-500">
    <div className="relative mb-6">
      <div className="absolute inset-0 bg-construction-blue/10 rounded-full blur-2xl" />
      <div className="relative p-6 bg-gradient-to-br from-construction-blue/5 to-construction-blue/10 rounded-full border-2 border-construction-blue/20">
        <Layers className="h-16 w-16 text-construction-blue" />
      </div>
    </div>
    <h3 className="text-xl font-black text-gray-900 mb-2 uppercase tracking-tight">
      No Phase Templates Defined
    </h3>
    <p className="text-gray-500 max-w-md mb-6">
      Create your first phase template to organize tasks across project
      stages
    </p>
    <Button
      onClick={onCreate}
      className="bg-construction-blue hover:bg-blue-700 text-white font-bold"
    >
      <Plus className="h-4 w-4 mr-2" />
      Create First Phase
    </Button>
  </div>
));
EmptyPhaseState.displayName = 'EmptyPhaseState';
```

3. Loading skeleton - keep inline (uses Array.from with dynamic animation delays)

**TaskTemplateManager.tsx** - Extract 3 empty states:

1. No project type (lines 453-464) - similar pattern
2. No phase selected (lines 467-479) - similar pattern
3. Empty tasks (lines 507-527) - similar pattern
4. Loading skeleton - keep inline

**Acceptance**:
- Empty states render correctly
- No visual changes
- Components are memoized
- displayName set for React DevTools
- Props typed correctly

**Estimated Complexity**: Medium

---

## Task 6: Fix Conditional Rendering with Ternaries

**Agent**: frontend-engineer
**Skills**: `skills/vercel-react-best-practices.md`
**Files**:
- `components/settings/PhaseTemplateManager.tsx`
- `components/settings/TaskTemplateManager.tsx`

**Dependencies**: Task 5

**Description**:
Replace all `&&` conditional operators with ternary operators to prevent potential layout shifts from falsy values (`rendering-conditional-render` rule).

**Implementation**:

Find and replace pattern:
```tsx
// ❌ Before
{condition && <Element />}

// ✅ After
{condition ? <Element /> : null}
```

**Locations in PhaseTemplateManager.tsx**:
- Line 201: `{task.description && ...}`
- Modal render conditions (already using ternary ✓)
- Any other `&&` operators

**Locations in TaskTemplateManager.tsx**:
- Similar patterns
- Modal render conditions (already using ternary ✓)

**Acceptance**:
- All `&&` operators replaced with ternaries
- No visual changes
- No console errors
- Code passes linting

**Estimated Complexity**: Simple

---

## Task 7: Code Cleanup and Documentation

**Agent**: frontend-engineer
**Skills**: `skills/workflow/code-quality.md`
**Files**:
- `components/settings/PhaseTemplateManager.tsx`
- `components/settings/TaskTemplateManager.tsx`

**Dependencies**: Tasks 1-6

**Description**:
Clean up code, remove "Debug:" comments, add meaningful comments explaining optimizations, and ensure consistent formatting.

**Implementation**:

1. **Remove "Debug:" comments** - replace with meaningful ones:
   ```tsx
   // ❌ Before
   // Debug: Handle drag end event

   // ✅ After
   // Handle drag-and-drop reordering with optimistic update and server persistence
   ```

2. **Document optimizations**:
   ```tsx
   // Vercel React Best Practice: rerender-functional-setstate
   // Using functional setState to avoid including taskTemplates in dependencies,
   // which keeps this callback stable and prevents unnecessary re-renders
   const handleDragEnd = useCallback(async (event: DragEndEvent) => {
     // ...
   }, [selectedPhaseTemplateId, loadTaskTemplates]);
   ```

3. **Add JSDoc comments** for complex functions:
   ```tsx
   /**
    * Handles drag-and-drop reordering of phase templates
    * Optimistically updates UI, then persists to backend
    * Reverts on error by refreshing from server
    */
   const handleDragEnd = useCallback(/* ... */);
   ```

4. **Consistent formatting**:
   - Remove extra blank lines
   - Consistent spacing in JSX
   - Align similar code blocks

5. **Remove unused imports** (if any)

**Acceptance**:
- No "Debug:" comments remain
- Meaningful comments explain WHY, not WHAT
- Optimizations documented with rule names
- Code is consistently formatted
- No unused imports
- Passes ESLint

**Estimated Complexity**: Simple

---

## Task 8: Manual Testing & Verification

**Agent**: frontend-engineer
**Skills**: `skills/workflow/testing.md`
**Files**: All modified files

**Dependencies**: Tasks 1-7

**Description**:
Manually test all functionality to ensure everything works correctly after optimization.

**Testing Checklist**:

**Phase Template Manager**:
- [ ] Select project type → Phases load
- [ ] Create phase → Success toast + refresh
- [ ] Edit phase → Success toast + update
- [ ] Delete phase → Warning modal + cascade info → Success
- [ ] Drag-and-drop phase → Optimistic update + success toast
- [ ] Click "Add Task" in empty phase → Tab switches + phase selected
- [ ] Click "Add Task" in phase header → Tab switches + phase selected
- [ ] Expand/collapse phase cards → Task templates show/hide

**Task Template Manager**:
- [ ] Select project type → Phase filter populates
- [ ] Select phase → Tasks load
- [ ] Create task → Success toast + refresh
- [ ] Edit task → Success toast + update
- [ ] Delete task → Success toast + refresh
- [ ] Drag-and-drop task → Optimistic update + success toast
- [ ] All filters work correctly

**Cross-component**:
- [ ] "Add Task" from phase → Correct phase selected in TaskTemplateManager
- [ ] Tab switching works smoothly
- [ ] No console errors
- [ ] No React warnings in DevTools

**Performance (React DevTools Profiler)**:
- [ ] Record "Add Task" interaction → Verify minimal re-renders
- [ ] Record drag-and-drop → Verify optimistic update
- [ ] Check callback stability → Verify handleDragEnd doesn't recreate

**Mobile Responsive**:
- [ ] Test on 375px viewport
- [ ] Buttons are tappable (44px min)
- [ ] Layout doesn't break
- [ ] Scrolling works correctly

**Acceptance**:
- All checklist items pass
- No console errors or warnings
- Performance metrics improved
- Mobile responsive intact

**Estimated Complexity**: Medium

---

## Task 9: Update Documentation

**Agent**: frontend-engineer
**Skills**: `skills/workflow/documentation.md`
**Files**:
- `.claude/docs/indexes/components.md`
- `.claude/docs/frontend/DESIGN_SYSTEM.md` (if applicable)

**Dependencies**: Task 8

**Description**:
Update component documentation to reflect changes and optimizations.

**Implementation**:

1. Update `.claude/docs/indexes/components.md`:
   ```markdown
   ### PhaseTemplateManager
   - **Path**: `components/settings/PhaseTemplateManager.tsx`
   - **Purpose**: Manages project phase templates with CRUD operations
   - **Props**:
     - `onAddTaskToPhase?: (phaseId: string) => void` - Callback to switch to task tab
   - **Features**:
     - Drag-and-drop reordering
     - Expandable cards with nested task counts
     - "Add Task" button to switch to TaskTemplateManager
   - **Optimizations**:
     - Functional setState for stable callbacks
     - Hoisted empty states
     - Memoized components
   ```

2. Add to `.claude/docs/frontend/DESIGN_SYSTEM.md` (Template Manager Patterns section):
   ```markdown
   ## Template Manager Patterns

   ### Parent-Child Coordination
   When template managers need to coordinate (e.g., "Add Task" from Phase):
   1. Parent holds shared state
   2. Parent provides callback to child
   3. Child triggers callback with relevant ID
   4. Parent updates state and switches view

   ### Performance Optimizations
   - Use functional setState to keep callbacks stable
   - Hoist static empty states outside components
   - Memoize empty state components
   - Use ternary operators for conditionals
   ```

**Acceptance**:
- Component index updated with new prop
- Design system includes pattern documentation
- Examples are clear and accurate

**Estimated Complexity**: Simple

---

## Task 10: Create Token Report

**Agent**: frontend-engineer
**Skills**: N/A
**Files**:
- `.claude/reports/token/template-manager-optimization-2026-01-19.md`

**Dependencies**: Task 9

**Description**:
Create comprehensive token usage report following CLAUDE.md requirements.

**Report Template**:
```markdown
# Token Report: Template Manager Optimization

## Overview
- **Task**: Fix "Add Task" button + Vercel React Best Practices optimization
- **Date**: 2026-01-19
- **Status**: ✅ Complete
- **Build**: ✅ Passing

## Files Referenced
- Files read: X (Y lines)
- Files modified: 3 (Z lines changed)
- Files created: 1 (token report)

## Agents & Skills Used
- frontend-engineer | Component optimization | ~50k tokens
- vercel-react-best-practices skill | ~5k tokens

## Token Usage Summary
| Category | Tokens |
|----------|--------|
| File reads | X |
| Code generation | Y |
| Documentation | Z |
| **Total** | **~XX,XXX** |

## Optimizations Applied
- ✅ Searched before reading files
- ✅ Used targeted reads with offset/limit
- ✅ Batched related file reads
- ✅ Used Serena for code navigation
- ❌ Did not use parallel tool calls (sequential dependencies)

## Token Efficiency Metrics
- Files modified: 3
- Build errors: 0
- Token per line ratio: X

## Recommendations
1. Future similar tasks: Use spec-writer agent for planning phase
2. Component refactors: Always check Vercel React Best Practices first
3. Testing: Allocate tokens for manual testing verification
```

**Acceptance**:
- Report created in correct location
- All sections filled out
- Metrics calculated
- Recommendations provided

**Estimated Complexity**: Simple

---

## Summary

**Total Tasks**: 10
**Estimated Timeline**: 2-3 hours for experienced developer
**Primary Agent**: frontend-engineer
**Token Budget**: ~50-60k tokens (within frontend-engineer 80k budget)

**Critical Path**: Tasks 1 → 2 → 8 (Fix "Add Task" button + verify)
**Parallel Work**: Tasks 3-7 can be done independently after Task 2

**Success Criteria**:
- ✅ "Add Task" button works
- ✅ All Vercel React Best Practices applied
- ✅ All existing functionality preserved
- ✅ Performance improved (fewer re-renders)
- ✅ Code is cleaner and well-documented
