# Requirement: Template Manager Optimization & Fixes

## Problem Statement

The PhaseTemplateManager and TaskTemplateManager components have multiple issues:

1. **Critical Bug**: The "Add Task" button in PhaseTemplateManager (lines 143-150, 159-166) does not work - clicking it does nothing
2. **Performance Issues**: Components violate Vercel React Best Practices
3. **Code Quality**: Inconsistent patterns, unnecessary re-renders, and potential optimizations missed
4. **Missing Functionality**: "Add Task" button should open TaskTemplateManager with pre-filtered phase

## User Stories

### As a Project Admin
- I want to click "Add Task" button in a phase template card and have it open the Task Templates tab with that phase pre-selected, so I can quickly add tasks to that phase
- I want both managers to follow React best practices, so the UI is fast and responsive
- I want consistent, clean code that follows the project's patterns

### As a Developer
- I want components that follow Vercel React Best Practices, so performance is optimal
- I want to fix all violations identified in the best practices guide
- I want refactored, maintainable code that other developers can easily understand

## Acceptance Criteria

### MUST HAVE (Critical)

**WHEN** user clicks "Add Task" button in PhaseTemplateManager
**THE SYSTEM SHALL** open/navigate to TaskTemplateManager tab with the phase pre-selected
**WHILE** maintaining all existing phase and task template functionality

**WHEN** PhaseTemplateManager or TaskTemplateManager renders
**THE SYSTEM SHALL** follow all Vercel React Best Practices rules
**WHILE** maintaining existing UI/UX behavior

**WHEN** any CTA (Create, Edit, Delete, Reorder) is triggered
**THE SYSTEM SHALL** properly execute the corresponding database action
**WHILE** providing user feedback via toasts

### SHOULD HAVE (High Priority)

**WHEN** components re-render
**THE SYSTEM SHALL** minimize unnecessary re-renders using proper memoization
**WHILE** keeping dependencies arrays correct (rerender-dependencies rule)

**WHEN** callbacks are created
**THE SYSTEM SHALL** use stable callback references
**WHILE** preventing parent re-renders from recreating child callbacks

**WHEN** state updates occur
**THE SYSTEM SHALL** use functional setState for stable callbacks (rerender-functional-setstate)
**WHILE** ensuring dependencies don't need to include state setters

### COULD HAVE (Medium Priority)

**WHEN** expensive computations occur
**THE SYSTEM SHALL** memoize them with useMemo
**WHILE** using primitive dependencies (rerender-dependencies)

**WHEN** task template lists are long
**THE SYSTEM SHALL** consider content-visibility CSS for performance
**WHILE** maintaining scroll behavior

## Scope

### In Scope

1. **Fix Critical Bug**:
   - Wire up "Add Task" button in PhaseTemplateManager
   - Implement tab switching to TaskTemplateManager
   - Pre-select the clicked phase in TaskTemplateManager

2. **Apply Vercel React Best Practices**:
   - **Priority 5: Re-render Optimization (MEDIUM)**
     - `rerender-defer-reads`: Don't subscribe to state only used in callbacks
     - `rerender-memo`: Extract expensive work into memoized components (already done with TemplateCard)
     - `rerender-dependencies`: Use primitive dependencies in effects
     - `rerender-functional-setstate`: Use functional setState for stable callbacks
   - **Priority 6: Rendering Performance (MEDIUM)**
     - `rendering-hoist-jsx`: Extract static JSX outside components
     - `rendering-conditional-render`: Use ternary, not && for conditionals
   - **Priority 7: JavaScript Performance (LOW-MEDIUM)**
     - `js-early-exit`: Return early from functions
     - `js-set-map-lookups`: Use Set/Map for O(1) lookups (taskTypeConfigs already done)

3. **Code Cleanup & Refactoring**:
   - Remove duplicate code patterns
   - Ensure all event handlers properly call server actions
   - Consistent error handling
   - Remove debug comments (replace with meaningful ones)
   - Ensure responsive design consistency

4. **Verify All CTAs Work**:
   - Create phase template ✓
   - Edit phase template ✓
   - Delete phase template ✓
   - Reorder phase templates ✓
   - **Create task template** (verify after fix)
   - Edit task template ✓
   - Delete task template ✓
   - Reorder task templates ✓
   - **Add task from phase card** ❌ BROKEN - PRIMARY FOCUS

### Out of Scope

- Changing the overall UI/UX design
- Modifying TemplateCard component (already optimized)
- Changing database schema or server actions (unless bugs found)
- Adding new features beyond the "Add Task" button fix
- Modifying TypesCard or other unrelated components
- Performance improvements beyond Vercel React Best Practices rules

## Constraints

### Technical Constraints

1. **Must NOT violate CLAUDE.md rules**:
   - NO Supabase SDK in client components
   - MUST use Server Actions for all DB operations
   - MUST follow existing component patterns

2. **Must maintain existing functionality**:
   - All working features must continue working
   - No breaking changes to props/interfaces
   - Existing tests must pass (if any)

3. **Must follow Vercel React Best Practices**:
   - Apply all applicable rules from the guide
   - Document why any rules are not applicable

### Business Constraints

1. **Admin-only access**: Only Admin role can manage templates (already enforced in server actions)
2. **Company isolation**: Templates are scoped to company (already enforced)
3. **Active filtering**: Only show active templates in UI (already implemented)

## Dependencies

### Component Dependencies

- `PhaseTemplateManager` depends on:
  - `TemplateCard` (already optimized)
  - `ResponsiveModal`
  - Server action: `app/actions/phase-templates.ts`

- `TaskTemplateManager` depends on:
  - `TemplateCard` (already optimized)
  - `ResponsiveModal`
  - Server action: `app/actions/task-templates.ts`

### Data Dependencies

- Both managers need to share selected project type state
- TaskTemplateManager needs to receive phase selection from PhaseTemplateManager
- Parent component (likely Settings page) needs to coordinate tab switching

### External Dependencies

- Next.js 16 App Router
- React 19
- @dnd-kit for drag-and-drop
- Framer Motion (used in TemplateCard)
- Sonner for toasts

## Implementation Notes

### "Add Task" Button Fix

The button is rendered but has no onClick handler:
```tsx
// Lines 143-150, 159-166 in PhaseTemplateManager.tsx
<Button
  size="sm"
  variant="outline"
  // ❌ NO onClick handler!
>
  <Plus className="h-3 w-3 mr-1.5" />
  Add Task Template
</Button>
```

**Solution**:
1. Add onClick handler that calls parent callback
2. Parent component passes callback to switch tabs and set phase
3. TaskTemplateManager receives initial phase selection via prop

### Vercel React Best Practices Focus

Given the MEDIUM priority and current state:
- **Critical**: `rerender-functional-setstate` for all setters in useCallbacks
- **Critical**: `rerender-dependencies` check all dependency arrays
- **High**: `rendering-conditional-render` replace && with ternary
- **Medium**: `js-early-exit` in validation functions
- **Low**: Comment cleanup and code organization

### Testing Checklist

After implementation, verify:
- [ ] Click "Add Task" in empty phase card → TaskTemplateManager opens with phase selected
- [ ] Click "Add Task" in phase card with tasks → TaskTemplateManager opens with phase selected
- [ ] All existing phase CRUD operations work
- [ ] All existing task CRUD operations work
- [ ] Drag-and-drop reordering works for both
- [ ] No console errors or warnings
- [ ] Toasts appear for all operations
- [ ] Mobile responsive behavior intact

## Success Metrics

1. **Functional**: "Add Task" button works 100% of the time
2. **Performance**: No unnecessary re-renders (verify with React DevTools Profiler)
3. **Code Quality**: All Vercel React Best Practices rules applied where applicable
4. **Maintainability**: Code is cleaner, more consistent, and well-documented
