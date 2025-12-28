# Task Materials Feature - UI Implementation Plan

## Overview
Add materials search and assignment capabilities directly within the Task Create/Edit modal, allowing users to add materials to tasks without leaving the task management workflow.

---

## Current State Analysis

### Existing Components
1. **TaskModal** (`/components/tasks/TaskModal.tsx`)
   - Combined create/edit modal with dynamic theming
   - Currently shows read-only materials in edit mode via `TaskMaterials` component (line 302-312)
   - Has scrollable content area with max height constraints
   - Uses construction-blue theme for create mode, priority-based themes for edit mode

2. **MaterialsSearch** (`/components/materials/MaterialsSearch.tsx`)
   - Full-featured search interface with filters (category, stock status)
   - Grid/list view toggle
   - Product comparison functionality
   - Integrates with Home Depot API

3. **ProductCard** (`/components/materials/ProductCard.tsx`)
   - Grid and list view modes
   - "Assign to Task" button triggers `AssignMaterialModal`
   - Shows product details, pricing, stock status

4. **AssignMaterialModal** (`/components/materials/AssignMaterialModal.tsx`)
   - Three-tier selection: Project → Phase → Task
   - Quantity input
   - Purchaser type selection
   - Cost calculation display
   - Stock warnings

### Database Schema
From `DB_SCHEMA.md`:
- **materials** table: Product catalog (Home Depot or manual entry)
- **material_assignments** table: Links materials to tasks with procurement tracking
- **task_materials** relationship: Existing read-only display in TaskModal

---

## Feature Requirements

### User Stories
1. **As a PM creating a task**, I want to search and add materials immediately, so I can complete task planning in one workflow
2. **As a PM editing a task**, I want to add/remove materials and adjust quantities, so I can keep task materials up-to-date
3. **As a field worker**, I want to see material costs impact task budget in real-time

### Functional Requirements
- ✅ Search Home Depot products within task modal
- ✅ Add materials with quantity (no need for project/phase selection - already in task context)
- ✅ Display list of assigned materials with ability to remove
- ✅ Show total material cost impact on task
- ✅ Reuse existing MaterialsSearch component logic
- ✅ Maintain responsive design (mobile-friendly)

---

## Component Architecture

### New Components

#### 1. `TaskMaterialsManager.tsx` (Main Component)
**Location**: `/components/tasks/TaskMaterialsManager.tsx`

**Purpose**: Wrapper component that handles materials search and assignment within task context

**Props**:
```typescript
interface TaskMaterialsManagerProps {
  taskId?: string;          // For edit mode (existing task)
  projectId: string;        // Required for material assignment
  onMaterialsChange?: () => void; // Callback when materials are added/removed
  mode: 'create' | 'edit';  // Determines UI behavior
}
```

**State Management**:
- Search query and filters (category, stock status)
- Search results (Home Depot products)
- Currently assigned materials
- Loading states

**Key Features**:
- Tabbed interface: "Search Products" + "Assigned Materials" (count badge)
- Simplified search (no view toggle, grid-only for space efficiency)
- Inline assignment (no separate modal needed)

---

#### 2. `TaskMaterialSearchResults.tsx` (Search Results)
**Location**: `/components/tasks/TaskMaterialSearchResults.tsx`

**Purpose**: Display search results in compact card grid within modal

**Props**:
```typescript
interface TaskMaterialSearchResultsProps {
  products: HomeDepotProduct[];
  projectId: string;
  taskId?: string;
  onAssign: (product: HomeDepotProduct, quantity: number) => Promise<void>;
  isPending: boolean;
}
```

**Design**:
- Compact product cards (smaller than full MaterialsSearch cards)
- Quick-add button with inline quantity input
- Stock status badge
- Price display

---

#### 3. `TaskMaterialsList.tsx` (Assigned Materials List)
**Location**: `/components/tasks/TaskMaterialsList.tsx`

**Purpose**: Display and manage materials already assigned to task

**Props**:
```typescript
interface TaskMaterialsListProps {
  taskId?: string;          // For edit mode
  materials: MaterialAssignment[];
  onRemove: (assignmentId: string) => Promise<void>;
  onUpdateQuantity: (assignmentId: string, quantity: number) => Promise<void>;
  isPending: boolean;
}
```

**Design**:
- List view with material details
- Editable quantity field
- Remove button
- Procurement status badge
- Total cost per line item
- Summary footer with total cost

---

## Integration into TaskModal

### Modified TaskModal Structure

```tsx
// TaskModal.tsx - Updated structure
<form onSubmit={handleSubmit}>
  <div className="px-6 py-5 max-h-[calc(100vh-280px)] overflow-y-auto space-y-5">

    {/* EXISTING FIELDS */}
    {/* Title */}
    {/* Description */}
    {/* Project & Phase */}
    {/* Assignee & Priority */}
    {/* Date Range */}
    {/* Costs */}

    {/* NEW: Materials Section */}
    <div className="space-y-3 pt-4 border-t-2 border-gray-200">
      <div className="flex items-center gap-2 pb-2">
        <Package className="h-4 w-4 text-construction-blue" />
        <h3 className="text-sm font-bold text-gray-900">Task Materials</h3>
        <Badge variant="outline" className="ml-auto">
          {assignedMaterialsCount} assigned
        </Badge>
      </div>

      <TaskMaterialsManager
        taskId={mode === 'edit' ? task?.id : undefined}
        projectId={selectedProjectId}
        mode={mode}
        onMaterialsChange={handleMaterialsChange}
      />
    </div>

  </div>

  {/* FOOTER - unchanged */}
</form>
```

### Layout Considerations
- Materials section appears **after** all other fields, before footer
- Collapsible/expandable section to save space (default: collapsed in create mode, expanded in edit mode)
- Max height constraint to prevent modal overflow
- Scrollable within the section if many materials assigned

---

## User Flow

### Create Task Flow
1. User fills out basic task details (title, project, assignee, etc.)
2. User scrolls to "Task Materials" section
3. User clicks "Add Materials" button → Expands materials search
4. User searches for products (simplified interface)
5. User clicks "Add" on product card → Inline quantity input appears
6. User enters quantity and confirms → Material added to "Assigned Materials" list
7. Repeat steps 4-6 as needed
8. User clicks "Create Task" → Task and materials saved together

### Edit Task Flow
1. User opens existing task → Materials section auto-expanded
2. "Assigned Materials" tab shows current materials
3. User can:
   - Update quantities inline
   - Remove materials (confirmation dialog)
   - Switch to "Search Products" tab to add more materials
4. User clicks "Save Changes" → Task and materials updated

---

## UI Design Specifications

### Color Scheme
- **Primary Actions**: `#001B51` (construction-blue) for add buttons
- **Secondary Actions**: Gray outline for remove/cancel
- **Success States**: `#059669` (construction-green) for added materials
- **Destructive Actions**: `#DC2626` (construction-red) for remove
- **Cost Display**: `#001B51` (construction-blue) for totals

### Typography
- **Section Header**: `text-sm font-bold text-gray-900`
- **Product Names**: `text-sm font-semibold text-construction-blue`
- **SKU/Details**: `text-xs text-gray-600`
- **Prices**: `text-lg font-black text-construction-blue`

### Spacing
- Section padding: `p-4`
- Card gaps: `gap-3`
- Item spacing: `space-y-2`

### Icons (Lucide React)
- `Package` - Materials section header
- `Search` - Search input
- `Plus` - Add material button
- `Trash2` - Remove material
- `AlertCircle` - Stock warnings
- `CheckCircle2` - Success states
- `DollarSign` - Cost indicators

---

## Data Flow

### State Management

#### TaskModal State
```typescript
// Add to TaskModal state
const [assignedMaterials, setAssignedMaterials] = useState<MaterialAssignment[]>([]);
const [materialsTotalCost, setMaterialsTotalCost] = useState<number>(0);
```

#### Server Actions (New/Modified)

**1. `assignMaterialToTask` (Existing - in `/app/actions/materials.ts`)**
- Already implemented
- Validates task, project, material IDs
- Creates material_assignment record
- Revalidates paths

**2. `removeMaterialFromTask` (New)**
```typescript
// Location: /app/actions/materials.ts
export async function removeMaterialFromTask(assignmentId: string) {
  // Validate user access
  // Delete material_assignment record
  // Revalidate task page
  // Return success/error
}
```

**3. `updateMaterialAssignmentQuantity` (New)**
```typescript
// Location: /app/actions/materials.ts
export async function updateMaterialAssignmentQuantity(
  assignmentId: string,
  quantity: number
) {
  // Validate user access
  // Update material_assignment.quantity (triggers total_cost recalc via GENERATED column)
  // Revalidate task page
  // Return success/error
}
```

**4. `getTaskMaterials` (New)**
```typescript
// Location: /app/actions/materials.ts
export async function getTaskMaterials(taskId: string) {
  // Get all material_assignments for task
  // Join with materials table for product details
  // Return enriched material list
}
```

### Data Loading Strategy

**Create Mode**:
- No materials loaded initially
- Search results fetched on-demand

**Edit Mode**:
- Load assigned materials when modal opens
- Use `useEffect` with `taskId` dependency

```typescript
useEffect(() => {
  if (mode === 'edit' && taskId) {
    loadTaskMaterials(taskId);
  }
}, [mode, taskId]);
```

---

## API Integration

### Home Depot Search
Reuse existing infrastructure:
- `searchProducts()` server action (already in `/app/actions/materials.ts`)
- `HomeDepotProduct` type from `/lib/services/home-depot-api.ts`
- Same search parameters: `query`, `category`, `stockStatus`

### Material Assignment Flow
1. Search Home Depot → Get `HomeDepotProduct`
2. Click "Add" → Call `createMaterialFromHomeDepot()` (creates material record)
3. Get `material_id` from result
4. Call `assignMaterialToTask()` with:
   - `material_id`
   - `task_id` (if edit mode) or temporary client-side ID (if create mode)
   - `project_id`
   - `quantity`
   - `unit_cost` (from product price)
   - `purchaser_type` (default: 'gc')

**Create Mode Special Handling**:
- Materials added before task exists need temporary client-side storage
- On task creation, iterate through temp materials and create assignments
- Use optimistic UI updates

---

## Responsive Design

### Breakpoints
- **Mobile** (`< 768px`): Single column, compact cards
- **Tablet** (`768px - 1024px`): Two-column grid
- **Desktop** (`> 1024px`): Three-column grid

### Mobile Optimizations
- Stack search filters vertically
- Full-width product cards
- Simplified material list (hide less critical details)
- Bottom sheet for quantity input on mobile

### Accessibility
- Keyboard navigation support
- Focus management (trap focus in modal)
- Screen reader labels for all interactive elements
- ARIA labels for icons
- Form validation with error announcements

---

## Performance Considerations

### Optimization Strategies
1. **Lazy Loading**: Load materials only when section is expanded
2. **Debounced Search**: Debounce search input (500ms) to reduce API calls
3. **Pagination**: Limit search results to 20 products, add "Load More" button
4. **Memoization**: Use `useMemo` for total cost calculations
5. **Optimistic Updates**: Update UI immediately, revalidate in background

### Error Handling
- Display inline error messages for failed operations
- Retry mechanism for network failures
- Rollback optimistic updates on error
- Toast notifications for background operations

---

## Implementation Steps

### Phase 1: Create New Components (frontend-builder)
1. Create `TaskMaterialsManager.tsx` with tab interface
2. Create `TaskMaterialSearchResults.tsx` with compact cards
3. Create `TaskMaterialsList.tsx` with editable list

### Phase 2: Server Actions (backend-engineer)
1. Add `removeMaterialFromTask()` to `/app/actions/materials.ts`
2. Add `updateMaterialAssignmentQuantity()` to `/app/actions/materials.ts`
3. Add `getTaskMaterials()` to `/app/actions/materials.ts`
4. Test all actions with RLS policies

### Phase 3: Integrate into TaskModal (frontend-builder)
1. Import `TaskMaterialsManager` into `TaskModal.tsx`
2. Add materials section after cost fields
3. Wire up state management for materials
4. Handle create vs. edit mode differences
5. Add total cost calculation

### Phase 4: Testing & Polish (code-reviewer)
1. Test create task with materials
2. Test edit task materials (add/remove/update)
3. Verify responsive design on mobile/tablet/desktop
4. Test error states and edge cases
5. Performance testing with many materials

---

## File Changes Summary

| File | Action | Description |
|------|--------|-------------|
| `/components/tasks/TaskMaterialsManager.tsx` | Create | Main materials manager component with search + list tabs |
| `/components/tasks/TaskMaterialSearchResults.tsx` | Create | Compact product cards for search results |
| `/components/tasks/TaskMaterialsList.tsx` | Create | Editable list of assigned materials |
| `/components/tasks/TaskModal.tsx` | Modify | Add materials section, integrate TaskMaterialsManager |
| `/app/actions/materials.ts` | Modify | Add new server actions for remove/update materials |
| `/lib/hooks/useTaskMaterials.ts` | Create | Custom hook for materials state management (optional) |

---

## Dependencies

### Existing (Already Installed)
- ✅ `framer-motion` - Animations
- ✅ `lucide-react` - Icons
- ✅ `@radix-ui/*` - UI primitives
- ✅ `zod` - Validation
- ✅ `tailwindcss` - Styling

### New (None Required)
All required dependencies are already in the project.

---

## Construction Theme Integration

### Visual Design
- **Border Accents**: Use 2px borders with construction-blue (`#001B51`)
- **Card Shadows**: Apply `shadow-construction` for elevated elements
- **Icons**: Construction-themed Lucide icons (Package, Truck, DollarSign)
- **Typography**: Bold, industrial font weights (`font-bold`, `font-black`)
- **Spacing**: Generous padding for touch targets (min 44px height)

### Color Applications
```css
/* Primary Actions */
.btn-add-material {
  background: #001B51;
  hover:bg: #00153d;
}

/* Success States */
.material-assigned {
  border-left: 4px solid #059669;
  background: #f0fdf4;
}

/* Cost Display */
.total-cost {
  color: #001B51;
  font-weight: 900;
}

/* Stock Warnings */
.stock-warning {
  background: #fff7ed;
  border: 2px solid #FBBF24;
}
```

---

## Important Notes

### Key Decisions
1. **Simplified Assignment**: No need for Project/Phase/Task selection dropdowns since we're already in task context
2. **Tab Interface**: Cleaner UX than accordion - clear separation between search and assigned materials
3. **Inline Quantity**: Faster workflow than separate modal for every addition
4. **Create Mode Handling**: Store materials client-side until task is saved (or disable materials in create mode initially)

### Gotchas
- ⚠️ **Create Mode Complexity**: Materials can't be assigned to a task that doesn't exist yet. Options:
  - **Option A** (Recommended): Disable materials in create mode, show message "Save task first to add materials"
  - **Option B**: Store materials in component state, assign all on task creation

- ⚠️ **Modal Height**: With materials section, modal may exceed viewport height on mobile
  - Solution: Implement collapsible sections, improve scrolling UX

- ⚠️ **Stock Status**: Home Depot stock info may be stale
  - Solution: Show last updated timestamp, add refresh button

### Performance Considerations
- Debounce search to avoid excessive API calls
- Limit initial results to 20 products
- Use virtualized list if >50 materials assigned to task (unlikely but possible)

---

## Testing Checklist

### Functional Testing
- [ ] Search products from Home Depot API
- [ ] Add material to task (create and edit modes)
- [ ] Update material quantity
- [ ] Remove material from task
- [ ] Calculate total material cost correctly
- [ ] Handle out-of-stock products
- [ ] Validate user permissions (RLS)

### UI/UX Testing
- [ ] Responsive design on mobile (375px width)
- [ ] Responsive design on tablet (768px width)
- [ ] Responsive design on desktop (1440px width)
- [ ] Keyboard navigation works
- [ ] Focus states are visible
- [ ] Loading states display correctly
- [ ] Error states display correctly

### Edge Cases
- [ ] Task with 0 materials
- [ ] Task with 100+ materials (performance)
- [ ] Network timeout during search
- [ ] Adding same material twice (should update quantity, not duplicate)
- [ ] Concurrent edits from multiple users

---

## Future Enhancements (Out of Scope)

### Phase 2 Features
1. **Bulk Import**: Upload CSV of materials
2. **Material Templates**: Save common material sets for reuse
3. **Price Alerts**: Notify when material prices change
4. **Procurement Workflow**: Full ordering and tracking system
5. **Material Substitutions**: Suggest alternatives for out-of-stock items
6. **Vendor Integration**: Direct ordering from Home Depot API

---

## Handoff Notes

**This plan is ready for frontend-builder to implement.**

### Implementation Order
1. Start with Phase 1 (create components)
2. Parallel: backend-engineer implements Phase 2 (server actions)
3. Phase 3: Integrate into TaskModal
4. Phase 4: code-reviewer tests and polishes

### Key Files to Reference
- Existing TaskModal: `/components/tasks/TaskModal.tsx`
- Materials actions: `/app/actions/materials.ts`
- DB schema: `.claude/docs/law/DB_SCHEMA.md`
- UI rules: `.claude/docs/law/UI_RULES.md`

### Questions for Product Owner
1. Should materials be addable in create mode, or only in edit mode?
2. What's the expected maximum number of materials per task?
3. Should we show Home Depot product images in the compact cards?
4. Do we need procurement status tracking in the task modal, or just show it read-only?

---

**Plan created**: 2025-12-28
**Plan status**: ✅ Ready for implementation
**Estimated effort**: 2-3 days (1 day frontend, 0.5 day backend, 0.5 day integration, 1 day testing)
