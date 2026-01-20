# Design: Template Manager Optimization & Fixes

## Architecture Overview

This optimization focuses on two client components that manage templates:
1. **PhaseTemplateManager**: Manages project phase templates with nested task counts
2. **TaskTemplateManager**: Manages task templates within phases

Both components are used in the Settings page and need to communicate for the "Add Task" button functionality.

```
Settings Page (Parent)
├── PhaseTemplateManager
│   ├── TemplateCard (for each phase)
│   │   └── Task Templates List (expandable)
│   │       └── "Add Task" button ← FIX THIS
│   └── Modals (Create/Edit/Delete)
└── TaskTemplateManager
    ├── TemplateCard (for each task)
    └── Modals (Create/Edit/Delete)
```

## Critical Bug Fix: "Add Task" Button

### Problem Analysis

**Location**: `PhaseTemplateManager.tsx` lines 143-150 (empty state) and 159-166 (with tasks)

```tsx
// ❌ Current: Button with NO onClick handler
<Button
  size="sm"
  variant="outline"
  className="border-2 border-construction-blue..."
>
  <Plus className="h-3 w-3 mr-1.5" />
  Add Task Template
</Button>
```

**Why it doesn't work**: The button is rendered inside `TemplateCard`'s children (expandable content), but has no event handler wired up.

### Solution Design

**Approach**: Parent component coordination pattern

1. **Settings Page (Parent)** holds shared state:
   ```tsx
   const [activeTab, setActiveTab] = useState<'phases' | 'tasks'>('phases');
   const [selectedProjectTypeId, setSelectedProjectTypeId] = useState('');
   const [selectedPhaseTemplateId, setSelectedPhaseTemplateId] = useState('');
   ```

2. **PhaseTemplateManager** receives callback prop:
   ```tsx
   interface PhaseTemplateManagerProps {
     // ... existing props ...
     onAddTaskToPhase?: (phaseTemplateId: string) => void;
   }
   ```

3. **Callback implementation** in Settings page:
   ```tsx
   const handleAddTaskToPhase = useCallback((phaseId: string) => {
     setSelectedPhaseTemplateId(phaseId);
     setActiveTab('tasks');
     // Optionally scroll to top of TaskTemplateManager
   }, []);
   ```

4. **Wire up buttons** in PhaseTemplateManager:
   ```tsx
   // Empty state button
   <Button onClick={() => onAddTaskToPhase?.(phase.id)}>
     <Plus /> Add Task Template
   </Button>

   // Button in task list header
   <Button onClick={() => onAddTaskToPhase?.(phase.id)}>
     <Plus /> Add Task
   </Button>
   ```

### Alternative Considered: URL-based navigation

**Rejected because**:
- Settings page doesn't use URL params currently
- Would require Next.js router integration
- More complex than state coordination
- Parent already manages tab state

## Vercel React Best Practices Application

### Priority 5: Re-render Optimization (MEDIUM)

#### Rule: `rerender-functional-setstate`

**Issue**: Callbacks include state in dependencies, causing re-creation on every render.

**Current Pattern** (problematic):
```tsx
const handleDragEnd = useCallback(async (event: DragEndEvent) => {
  // ... logic using phaseTemplates, selectedProjectTypeId ...
}, [phaseTemplates, selectedProjectTypeId, onRefreshPhases]);
// ❌ Recreated whenever phaseTemplates changes (every render)
```

**Fixed Pattern**:
```tsx
const handleDragEnd = useCallback(async (event: DragEndEvent) => {
  const { active, over } = event;
  if (!over || active.id === over.id) return;

  // Use functional form to access latest state without dependency
  setPhaseTemplates(current => {
    const oldIndex = current.findIndex((p) => p.id === active.id);
    const newIndex = current.findIndex((p) => p.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return current;

    const newOrder = arrayMove(current, oldIndex, newIndex);
    const orderedIds = newOrder.map((p) => p.id);

    // Persist async (can't await in setState, so use side effect)
    reorderPhaseTemplates(selectedProjectTypeId, orderedIds)
      .then(result => {
        if (result.error) {
          toast.error("Failed to reorder phases");
          onRefreshPhases(); // Revert
        } else {
          toast.success("Phase order updated");
        }
      });

    return newOrder;
  });
}, [selectedProjectTypeId, onRefreshPhases]);
// ✅ Only recreated when selectedProjectTypeId or callback changes
```

**Apply to**:
- `handleDragEnd` in PhaseTemplateManager (line 277)
- `handleDragEnd` in TaskTemplateManager (line 270)
- `handleCreate`, `handleUpdate`, `handleDelete` callbacks

#### Rule: `rerender-dependencies`

**Issue**: Complex objects in dependency arrays cause unnecessary re-renders.

**Current Pattern**:
```tsx
useEffect(() => {
  if (selectedPhaseTemplateId) {
    loadTaskTemplates(selectedPhaseTemplateId);
  }
}, [selectedPhaseTemplateId, loadTaskTemplates]);
// ❌ loadTaskTemplates recreated on every render
```

**Fixed Pattern**:
```tsx
const loadTaskTemplates = useCallback(async (phaseTemplateId: string) => {
  // ... implementation ...
}, []); // ✅ Stable reference

useEffect(() => {
  if (selectedPhaseTemplateId) {
    loadTaskTemplates(selectedPhaseTemplateId);
  }
}, [selectedPhaseTemplateId, loadTaskTemplates]);
// ✅ Only runs when phase changes
```

**Audit**:
- PhaseTemplateManager: `handleDragEnd` (line 277) - check dependencies
- TaskTemplateManager: `loadTaskTemplates` (line 248) - already stable ✓
- TaskTemplateManager: `taskTypeConfigs` useMemo (line 238) - already optimal ✓

### Priority 6: Rendering Performance (MEDIUM)

#### Rule: `rendering-hoist-jsx`

**Issue**: Static JSX recreated on every render.

**Current Pattern**:
```tsx
return (
  <div>
    {/* Empty state - recreated on every render */}
    {phaseTemplates.length === 0 ? (
      <div className="flex flex-col...">
        <div className="p-6 bg-gradient...">
          <Layers className="h-16 w-16..." />
        </div>
        <h3>No Phase Templates Defined</h3>
        {/* ... */}
      </div>
    ) : (
      /* ... */
    )}
  </div>
);
```

**Fixed Pattern**:
```tsx
// Hoist static JSX outside component
const EmptyPhaseState = React.memo(({ onCreate }: { onCreate: () => void }) => (
  <div className="flex flex-col items-center justify-center py-16...">
    <div className="relative mb-6">
      <div className="absolute inset-0 bg-construction-blue/10 rounded-full blur-2xl" />
      <div className="relative p-6 bg-gradient...">
        <Layers className="h-16 w-16 text-construction-blue" />
      </div>
    </div>
    <h3 className="text-xl font-black...">No Phase Templates Defined</h3>
    <p className="text-gray-500 max-w-md mb-6">
      Create your first phase template to organize tasks...
    </p>
    <Button onClick={onCreate} className="bg-construction-blue...">
      <Plus className="h-4 w-4 mr-2" />
      Create First Phase
    </Button>
  </div>
));

// In component
return phaseTemplates.length === 0 ? (
  <EmptyPhaseState onCreate={() => setShowCreateModal(true)} />
) : (
  /* ... */
);
```

**Apply to**:
- Empty state in PhaseTemplateManager (lines 439-460)
- Empty state in TaskTemplateManager (lines 507-527)
- "No project type selected" state (lines 400-411, 453-464)
- Loading skeleton (lines 413-436, 481-504)

#### Rule: `rendering-conditional-render`

**Issue**: Using `&&` operator can cause layout shifts with falsy values.

**Current Pattern**:
```tsx
{description && (
  <p className="text-xs text-gray-600 line-clamp-1">
    {description}
  </p>
)}
```

**Fixed Pattern**:
```tsx
{description ? (
  <p className="text-xs text-gray-600 line-clamp-1">
    {description}
  </p>
) : null}
```

**Apply to**:
- All conditional renders in both components
- Especially important for UI elements that affect layout

### Priority 7: JavaScript Performance (LOW-MEDIUM)

#### Rule: `js-early-exit`

**Issue**: Unnecessary nesting and condition checks.

**Current Pattern**:
```tsx
const handleDragEnd = useCallback(async (event: DragEndEvent) => {
  const { active, over } = event;

  if (!over || active.id === over.id) return;

  const oldIndex = phaseTemplates.findIndex((p) => p.id === active.id);
  const newIndex = phaseTemplates.findIndex((p) => p.id === over.id);

  if (oldIndex === -1 || newIndex === -1) return;

  // ... continue with logic
}, [/* deps */]);
```

**Already optimal** ✓ - Uses early returns

**Apply to**:
- Validation in form submission handlers
- Event handler guards

## Component Updates

### PhaseTemplateManager.tsx

**Changes Required**:

1. **Add prop for callback**:
   ```tsx
   interface PhaseTemplateManagerProps {
     projectTypes: ProjectTypeWithCount[];
     selectedProjectTypeId: string;
     onProjectTypeChange: (id: string) => void;
     phaseTemplates: PhaseTemplateWithTasks[];
     isLoadingProjectTypes: boolean;
     isLoadingPhases: boolean;
     onRefreshPhases: () => void;
     onAddTaskToPhase?: (phaseTemplateId: string) => void; // ← NEW
   }
   ```

2. **Wire up "Add Task" buttons** (2 locations):
   ```tsx
   // Empty state (line 143)
   <Button
     onClick={() => onAddTaskToPhase?.(phase.id)}
     size="sm"
     variant="outline"
     className="..."
   >
     <Plus className="h-3 w-3 mr-1.5" />
     Add Task Template
   </Button>

   // Task list header (line 159)
   <Button
     onClick={() => onAddTaskToPhase?.(phase.id)}
     size="sm"
     variant="ghost"
     className="..."
   >
     <Plus className="h-3 w-3 mr-1" />
     Add Task
   </Button>
   ```

3. **Apply functional setState**:
   - Not applicable - PhaseTemplateManager receives `phaseTemplates` as prop, doesn't manage it locally
   - Parent handles state, so this component is already optimal in this regard

4. **Hoist empty states**:
   - Extract 3 empty state components outside main component
   - Memoize with `React.memo`

5. **Fix conditional renders**:
   - Replace `&&` with ternary in ~8 locations

### TaskTemplateManager.tsx

**Changes Required**:

1. **No interface changes needed** - already receives `selectedPhaseTemplateId` prop

2. **Apply functional setState**:
   ```tsx
   const handleDragEnd = useCallback(async (event: DragEndEvent) => {
     const { active, over } = event;
     if (!over || active.id === over.id) return;

     setTaskTemplates(current => {
       const oldIndex = current.findIndex((t) => t.id === active.id);
       const newIndex = current.findIndex((t) => t.id === over.id);
       if (oldIndex === -1 || newIndex === -1) return current;

       const newOrder = arrayMove(current, oldIndex, newIndex);
       const orderedIds = newOrder.map((t) => t.id);

       // Async persist (side effect)
       reorderTaskTemplates(selectedPhaseTemplateId, orderedIds)
         .then(result => {
           if (result.error) {
             toast.error("Failed to reorder tasks");
             // Reload from server to revert
             loadTaskTemplates(selectedPhaseTemplateId);
           } else {
             toast.success("Task order updated");
           }
         });

       return newOrder;
     });
   }, [selectedPhaseTemplateId, loadTaskTemplates]);
   ```

3. **Hoist empty states**:
   - Extract 3 empty state components
   - Memoize with `React.memo`

4. **Fix conditional renders**:
   - Replace `&&` with ternary in ~6 locations

## Server Actions

### No Changes Needed

Both `app/actions/phase-templates.ts` and `app/actions/task-templates.ts` are already well-structured and follow best practices:

✓ Proper authentication/authorization
✓ Input validation with Zod schemas
✓ Error handling with try-catch
✓ Revalidation with `revalidatePath`
✓ Type-safe return objects

## Integration Points

### Settings Page Updates

**Required Changes**:
```tsx
// In Settings page component
const [activeTab, setActiveTab] = useState<'phases' | 'tasks' | 'types'>('phases');
const [selectedPhaseForTask, setSelectedPhaseForTask] = useState<string>('');

const handleAddTaskToPhase = useCallback((phaseId: string) => {
  setSelectedPhaseForTask(phaseId);
  setActiveTab('tasks');
  // Optional: Scroll to top
  window.scrollTo({ top: 0, behavior: 'smooth' });
}, []);

// Pass to PhaseTemplateManager
<PhaseTemplateManager
  // ... existing props ...
  onAddTaskToPhase={handleAddTaskToPhase}
/>

// Pass to TaskTemplateManager (when activeTab === 'tasks')
<TaskTemplateManager
  // ... existing props ...
  selectedPhaseTemplateId={selectedPhaseForTask || selectedPhaseTemplateId}
  // Ensure phase is selected when navigating from phase card
/>
```

### Data Flow

```
User clicks "Add Task" button in PhaseTemplateManager
  ↓
onAddTaskToPhase(phaseId) called
  ↓
Settings page updates state:
  - setSelectedPhaseForTask(phaseId)
  - setActiveTab('tasks')
  ↓
TaskTemplateManager renders with selectedPhaseTemplateId={phaseId}
  ↓
Phase filter dropdown shows selected phase
  ↓
User clicks "Add Task Template" button
  ↓
Create modal opens with phase_template_id pre-filled
```

## Performance Metrics

### Before Optimization (Estimated)

- **PhaseTemplateManager**:
  - Re-renders per interaction: ~3-5 (parent, component, cards)
  - Callback recreation: Every render
  - JSX recreation: Empty states on every render

- **TaskTemplateManager**:
  - Re-renders per interaction: ~4-6 (parent, component, cards, filters)
  - Callback recreation: Every render
  - JSX recreation: Empty states on every render

### After Optimization (Target)

- **PhaseTemplateManager**:
  - Re-renders per interaction: ~1-2 (only affected components)
  - Callback recreation: Only when dependencies change
  - JSX recreation: Never (hoisted and memoized)

- **TaskTemplateManager**:
  - Re-renders per interaction: ~1-2 (only affected components)
  - Callback recreation: Only when dependencies change
  - JSX recreation: Never (hoisted and memoized)

### Measuring Performance

Use React DevTools Profiler:
1. Record interaction (e.g., click "Add Task")
2. Check "Committed" components count
3. Verify callbacks don't recreate unnecessarily
4. Confirm empty states don't re-render when data present

## Testing Strategy

### Unit Testing (if applicable)

- Mock parent callback `onAddTaskToPhase`
- Verify button click triggers callback with correct phase ID
- Verify no re-renders when phase data doesn't change

### Integration Testing

1. **Test "Add Task" Flow**:
   - Navigate to Settings > Phase Templates
   - Create a phase template
   - Click "Add Task" button in empty state
   - Verify: TaskTemplateManager opens with phase selected
   - Click "Add Task" button in task list
   - Verify: TaskTemplateManager opens with phase selected

2. **Test All CRUD Operations**:
   - Create phase → Verify toast + data refresh
   - Edit phase → Verify toast + data update
   - Delete phase → Verify toast + cascade warning
   - Reorder phases → Verify optimistic update + persist
   - Create task → Verify toast + data refresh
   - Edit task → Verify toast + data update
   - Delete task → Verify toast
   - Reorder tasks → Verify optimistic update + persist

3. **Test Performance**:
   - Open React DevTools Profiler
   - Perform interactions
   - Verify minimal re-renders
   - Check callback stability

### Manual Testing Checklist

- [ ] "Add Task" button works in empty phase card
- [ ] "Add Task" button works in phase card with tasks
- [ ] Tab switches to TaskTemplateManager
- [ ] Phase is pre-selected in TaskTemplateManager
- [ ] All phase CRUD operations work
- [ ] All task CRUD operations work
- [ ] Drag-and-drop works for phases
- [ ] Drag-and-drop works for tasks
- [ ] Mobile responsive layout intact
- [ ] Toasts appear for all operations
- [ ] No console errors
- [ ] No React warnings (DevTools console)

## Rollback Plan

If issues occur:
1. Revert changes to PhaseTemplateManager.tsx
2. Revert changes to TaskTemplateManager.tsx
3. Revert changes to Settings page
4. All server actions remain unchanged (no rollback needed)

Git tags for rollback:
- Before: `template-manager-before-optimization`
- After: `template-manager-after-optimization`

## Documentation Updates

After implementation, update:
1. `.claude/docs/frontend/DESIGN_SYSTEM.md` - Add section on template manager patterns
2. `.claude/docs/indexes/components.md` - Update PhaseTemplateManager and TaskTemplateManager entries
3. Inline comments - Document why specific patterns are used (e.g., functional setState)

## Future Improvements (Out of Scope)

- Keyboard shortcuts for creating templates
- Bulk operations (select multiple, delete multiple)
- Template duplication feature
- Template import/export
- Template versioning
- Undo/redo for reordering
