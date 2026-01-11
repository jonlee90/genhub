# Tasks Components Organization

This directory contains all task-related components organized by feature and purpose.

## Directory Structure

### `/analytics` - Dashboard Analytics
Components for displaying task and project analytics:
- `TopProjectsCard.tsx` - Card showing top projects by task count
- `TopTeamMembersCard.tsx` - Card showing top team members by task completion

### `/detail` - Task Detail Views
Components for displaying and managing individual task details:
- `TaskDetail.tsx` - Main task detail page component
- `TaskDetailPanel.tsx` - Side panel for task details in spatial viewer
- `TaskDetailsTab.tsx` - Tab showing task basic information
- `ActivityTab.tsx` - Tab showing task activity history
- `MaterialTab.tsx` - Tab for managing task materials
- `ExpensesTab.tsx` - Tab for managing task expenses
- `AttachmentsTab.tsx` - Tab for managing task attachments

### `/expenses` - Expense Management
Components for managing task expenses and receipts:
- `TaskExpensesSection.tsx` - Section for displaying and adding expenses
- `TaskReceiptUpload.tsx` - Component for uploading receipt images

### `/forms` - Forms and Input Components
Form-related components for task creation and editing:
- `CreateTaskForm.tsx` - Main form for creating new tasks
- `TaskTypeSelector.tsx` - Component for selecting task type with badges
- `AssigneeMultiSelect.tsx` - Multi-select component for assigning team members

### `/gantt` - Gantt Chart (Already Organized)
Complete Gantt chart implementation:
- `GanttChart.tsx` - Main Gantt chart component
- `GanttHeader.tsx` - Gantt chart header with date cells
- `GanttTimeline.tsx` - Timeline overlay with today marker
- `GanttTaskRow.tsx` - Individual task row in Gantt view
- `GanttTaskBar.tsx` - Task bar visualization
- `GanttDependencyLines.tsx` - Dependency arrows between tasks
- `GanttViewToggle.tsx` - Toggle for switching time scales
- `gantt-types.ts` - TypeScript types for Gantt components
- `gantt-utils.ts` - Utility functions for Gantt calculations

### `/kanban` - Kanban Board
Components for Kanban board view:
- `KanbanBoard.tsx` - Main Kanban board with drag-and-drop
- `KanbanColumn.tsx` - Individual column in Kanban view

### `/list` - List and Card Views
Components for displaying tasks in list format:
- `TaskList.tsx` - Desktop list view with table layout
- `TaskListMobile.tsx` - Mobile-optimized list view
- `TaskListSkeleton.tsx` - Loading skeleton for task lists
- `TaskCard.tsx` - Desktop task card component
- `MobileTaskCard.tsx` - Mobile-optimized task card

### `/materials` - Material Management
Components for managing task materials:
- `TaskMaterials.tsx` - Main materials section component
- `TaskMaterialsManager.tsx` - Component for adding/editing materials
- `TaskMaterialsList.tsx` - List of materials with delivery tracking
- `TaskMaterialSearch.tsx` - Search and select materials from database
- `MaterialDeliveryPrompt.tsx` - Prompt for marking materials as delivered

### `/mia` - Missing In Action (Unused Components)
Components that are not currently used anywhere in the codebase:
- `DashboardStats.tsx` - Legacy dashboard stats component
- `TaskFormModal.tsx` - Legacy task form modal

**Note:** These components are preserved for potential future use or reference.

### `/modals` - Modal Components
Modal components for task operations:
- `TaskModal.tsx` - Main task creation/edit modal
- `TaskModalTrigger.tsx` - Trigger button that opens TaskModal
- `BlockedReasonModal.tsx` - Modal for entering blocked task reason

### `/shared` - Shared Utilities
Shared components used across multiple features:
- `TaskFilters.tsx` - Filter controls for task views
- `TaskActivityLog.tsx` - Activity log component
- `TaskDependencies.tsx` - Component for managing task dependencies

### `/views` - Main Page Views
High-level page components and layouts:
- `TasksPageClient.tsx` - Main tasks page client component
- `TaskBoard.tsx` - Task board with view switching (List/Kanban/Gantt)
- `ProjectFilterHeader.tsx` - Header with project filter dropdown

## Import Paths

When importing from outside the `components/tasks` directory:

```typescript
// Views
import { TasksPageClient } from '@/components/tasks/views/TasksPageClient';
import { TaskBoard } from '@/components/tasks/views/TaskBoard';

// Detail views
import { TaskDetail } from '@/components/tasks/detail/TaskDetail';
import { TaskDetailPanel } from '@/components/tasks/detail/TaskDetailPanel';

// Modals
import { TaskModal } from '@/components/tasks/modals/TaskModal';
import { TaskModalTrigger } from '@/components/tasks/modals/TaskModalTrigger';

// Forms
import { CreateTaskForm } from '@/components/tasks/forms/CreateTaskForm';

// List views
import { TaskList } from '@/components/tasks/list/TaskList';
import { TaskListSkeleton } from '@/components/tasks/list/TaskListSkeleton';

// Gantt
import { GanttChart } from '@/components/tasks/gantt/GanttChart';

// And so on...
```

## Component Dependencies

### Key Component Hierarchies

1. **TasksPageClient** (Entry point for tasks page)
   - TaskBoard
     - TaskFilters (shared)
     - KanbanBoard (kanban) → TaskCard (list)
     - TaskList (list) → TaskListMobile (list)
     - GanttChart (gantt)
   - TaskModal (modals)

2. **TaskDetail** (Entry point for task detail page)
   - TaskActivityLog (shared)
   - TaskDependencies (shared)
   - TaskMaterials (materials)
   - BlockedReasonModal (modals)

3. **TaskDetailPanel** (Used in spatial viewer)
   - TaskDetailsTab (detail)
   - MaterialTab (detail)
   - ExpensesTab (detail)
   - AttachmentsTab (detail)
   - ActivityTab (detail)

4. **TaskModal** (Task creation/editing)
   - TaskTypeSelector (forms)
   - AssigneeMultiSelect (forms)
   - TaskMaterialsManager (materials)
   - TaskExpensesSection (expenses)
   - TaskReceiptUpload (expenses)

## Refactoring Notes

- All external imports have been updated to use the new nested paths
- Internal imports use relative paths (`../folder/Component`)
- The refactoring maintains backward compatibility - no functionality was changed
- Build passes with no errors (only pre-existing warnings)
- All components maintain their original file structure and exports

## Migration Guide

If you need to move a component from `/mia` back into active use:

1. Move the file to the appropriate directory based on its purpose
2. Update its internal imports to use relative paths to other task components
3. Update any external files that import it to use the new path
4. Run `npx tsc --noEmit` to verify TypeScript is happy
5. Run `npm run build` to verify everything compiles

## Component Count

- **Total components**: 46 files
- **Active components**: 44 files
- **Unused (in mia)**: 2 files
- **Subdirectories**: 13 folders
