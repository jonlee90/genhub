# Task 9: Integrate MaterialDeliveryPrompt into TaskMaterialsList

## Status
✅ Completed

## Dependencies
- Task 7: Material-Expense Server Action (✅ Completed)
- Task 8: MaterialDeliveryPrompt Component (✅ Completed)

## Overview
Integrate the MaterialDeliveryPrompt into the materials management UI to automatically prompt users to create expenses when materials are marked as delivered.

## Subtasks

### 9.1 Add State for Delivery Prompt Trigger ✅
**File:** `/components/tasks/TaskMaterialsList.tsx`

- ✅ Added state: `const [deliveredMaterial, setDeliveredMaterial] = useState<MaterialAssignment | null>(null)`
- ✅ Added state: `const [showDeliveryPrompt, setShowDeliveryPrompt] = useState(false)`
- ✅ Imported MaterialDeliveryPrompt component
- ✅ Imported `getMaterialExpenseLink` helper
- ✅ Added `expenseLinks` state for tracking linked expenses

**Reference:** Req 7.1

---

### 9.2 Detect procurement_status Change to "delivered" ✅
- ✅ Created `handleStatusUpdate` function with status dropdown UI
- ✅ Added DropdownMenu component for status selection
- ✅ After successful status update to "delivered", checks if expense already linked
- ✅ Calls `getMaterialExpenseLink(materialAssignmentId)`
- ✅ If no linked expense, triggers prompt with `setDeliveredMaterial` and `setShowDeliveryPrompt(true)`
- ✅ If expense already linked, logs and skips prompt (prevents duplicate)
- ✅ Added comprehensive debug logging for all status changes

**Implementation:**
```tsx
const handleStatusUpdate = async (
  assignment: MaterialAssignment,
  newStatus: 'needed' | 'ordered' | 'delivered' | 'installed'
) => {
  // ... status update logic
  if (newStatus === 'delivered') {
    const expenseLink = await getMaterialExpenseLink(assignment.id);
    if (expenseLink.success && !expenseLink.expenseId) {
      setDeliveredMaterial(assignment);
      setShowDeliveryPrompt(true);
    }
  }
};
```

**Reference:** Req 7.1, Req 7.4

---

### 9.3 Render MaterialDeliveryPrompt Conditionally ✅
- ✅ Rendered MaterialDeliveryPrompt at end of component
- ✅ Passed `isOpen={showDeliveryPrompt}`
- ✅ Passed `materialAssignment={deliveredMaterial}`
- ✅ Passed `taskId` and `projectId` props
- ✅ Implemented `onClose` callback to reset state
- ✅ Implemented `onExpenseCreated` callback to refresh data and update expense link indicator
- ✅ Updated MaterialDeliveryPrompt component props interface to match usage
- ✅ Fixed MaterialDeliveryPrompt to use correct `createExpenseFromMaterial` signature

**Implementation:**
```tsx
<MaterialDeliveryPrompt
  isOpen={showDeliveryPrompt}
  onClose={() => {
    setShowDeliveryPrompt(false);
    setDeliveredMaterial(null);
  }}
  materialAssignment={deliveredMaterial}
  taskId={taskId}
  projectId={projectId}
  onExpenseCreated={async () => {
    setShowDeliveryPrompt(false);
    setDeliveredMaterial(null);
    // Update expense links state
    if (deliveredMaterial) {
      setExpenseLinks(prev => ({ ...prev, [deliveredMaterial.id]: true }));
    }
    onStatusUpdate?.();
  }}
/>
```

**Reference:** Req 7.1

---

### 9.4 Add "Expense Linked" Indicator ✅
- ✅ Added `expenseLinks` state to track which materials have linked expenses
- ✅ Created `useEffect` to check expense links on mount and when materials change
- ✅ Calls `getMaterialExpenseLink(materialAssignment.id)` for each material
- ✅ Displays emerald-colored indicator with Receipt and Check icons if expense exists
- ✅ Positioned indicator next to material status badge
- ✅ Added tooltip: "Expense created for this material"
- ✅ Uses emerald/green color (construction theme success color)
- ✅ Updates indicator immediately after expense creation via state update

**Implementation:**
```tsx
{expenseLinks[assignment.id] && (
  <div
    className="flex items-center gap-0.5 text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200"
    title="Expense created for this material"
  >
    <Receipt className="w-3 h-3" />
    <Check className="w-2.5 h-2.5" />
  </div>
)}
```

**Reference:** Req 7.5, Req 11.2

---

## Testing Checklist
- [ ] Changing material status to "delivered" triggers prompt (if no expense)
- [ ] Prompt does not appear if expense already linked
- [ ] Creating expense via prompt closes dialog and shows success
- [ ] Skipping expense closes prompt without creating
- [ ] Expense linked indicator appears after expense creation
- [ ] Prompt doesn't appear again for same material

## Files Modified
- ✅ `/components/tasks/MaterialDeliveryPrompt.tsx` - Updated props interface and implementation
- ✅ `/components/tasks/TaskMaterialsList.tsx` - Added delivery prompt integration and expense indicators
- ✅ `/components/tasks/TaskMaterialsManager.tsx` - Updated to pass taskId and projectId props

## Implementation Summary

### Key Features Implemented:
1. **Status Dropdown**: Added interactive dropdown menu to change material procurement status (Need to Order → Ordered → Delivered → Installed)
2. **Auto-Prompt on Delivery**: Automatically detects when material status changes to "delivered" and checks for existing expense link
3. **Material Delivery Prompt**: Shows dialog prompting user to create expense for delivered material
4. **Expense Link Tracking**: Tracks which materials have linked expenses and displays visual indicator
5. **Construction Theme**: All UI elements use construction theme colors (#001B51 primary, emerald success indicators)
6. **Debug Logging**: Comprehensive console logging for all delivery prompt events

### User Flow:
1. User opens task with materials
2. User clicks status badge to open dropdown
3. User selects "Delivered" status
4. System checks for existing expense link
5. If no expense exists, prompt appears
6. User can create expense or skip
7. If expense created, indicator appears next to material
8. Future status changes to "delivered" for same material skip prompt (expense already exists)

### Technical Implementation:
- Uses `updateMaterialAssignment` action for status updates
- Uses `getMaterialExpenseLink` to check for existing expense links
- Uses `createExpenseFromMaterial` to create linked expenses
- Manages state for delivery prompt visibility and material tracking
- Uses `useEffect` to check expense links on component mount and material changes
- Updates expense links state immediately after expense creation for instant feedback

## Estimated Complexity
🟡 Medium - Event detection and state coordination (Completed)
