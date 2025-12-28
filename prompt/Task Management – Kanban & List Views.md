We are building a next js project based on an existing next js template that have auth, payment built already, below are rules you have to follow:

<frontend rules>
1. MUST Use 'use client' directive for client-side components; In Next.js, page components are server components by default, and React hooks like useEffect can only be used in client components.
2. The UI has to look great, using polished component from aceternity, tailwind when possible; Don't recreate aceternity components, make sure you use 'aceternity@latest add xxx' CLI to add components
3. MUST adding debugging log & comment for every single feature we implement
4. Make sure to concatenate strings correctly using backslash
7. Use stock photos from picsum.photos where appropriate, only valid URLs you know exist
8. Don't update aceternity components unless otherwise specified
9. Configure next.config.js image remotePatterns to enable stock photos from picsum.photos
11. MUST implement the navigation elements items in their rightful place i.e. Left sidebar, Top header
12. Accurately implement necessary grid layouts
13. Follow proper import practices:
   - Use @/ path aliases
   - Keep component imports organized
   - Update current src/app/page.tsx with new comprehensive code
   - Don't forget root route (page.tsx) handling
   - You MUST complete the entire prompt before stopping
</frontend rules>

<styling_requirements>
- You ALWAYS tries to use the aceternity/ui library.
- You MUST USE the builtin Tailwind CSS variable based colors as used in the examples, like bg-primary or text-primary-foreground.
- You DOES NOT use indigo or blue colors unless specified in the prompt.
- You MUST generate responsive designs.
- The React Code Block is rendered on top of a white background. If v0 needs to use a different background color, it uses a wrapper element with a background color Tailwind class.
</styling_requirements>

<frameworks_and_libraries>
- You prefers Lucide React for icons, and aceternity/ui for components.
- You MAY use other third-party libraries if necessary or requested by the user.
- You imports the aceternity/ui components from "@/components/ui"
- You DOES NOT use fetch or make other network requests in the code.
- You DOES NOT use dynamic imports or lazy loading for components or libraries. Ex: const Confetti = dynamic(...) is NOT allowed. Use import Confetti from 'react-confetti' instead.
- Prefer using native Web APIs and browser features when possible. For example, use the Intersection Observer API for scroll-based animations or lazy loading.
</frameworks_and_libraries>

# Task Management – Kanban & List Views  
**Implementation Guide for GenHub PWA (Next.js, aceternity/ui, Supabase, Lucide)**

---

## **Scope**

Implement `/app/tasks` with:
- Kanban board (drag & drop, columns by status)
- List/table view (sortable, filterable)
- Toggle between views
- Task detail page `/app/tasks/[id]`
- All UI with aceternity/ui, Lucide icons, Tailwind variable colors
- Responsive, beautiful, modern design
- Data from Supabase (auth/RLS enforced)
- Detailed debug logs for all data operations

---

## **1. Data Model & Types**

**Supabase Table: `task`**  
Already defined (see project schema).  
Key fields: `id`, `title`, `status`, `priority`, `due_date`, `assignee_id`, `project_id`, `user_id`, `created_at`

**TypeScript Types**  
Define in `types/tasks.d.ts`:
```typescript
export type TaskStatus = 'todo' | 'in_progress' | 'blocked' | 'done';

export interface Task {
  id: string;
  title: string;
  status: TaskStatus;
  priority?: 'low' | 'medium' | 'high';
  due_date?: string;
  assignee_id?: string;
  project_id: string;
  user_id: string;
  created_at: string;
}
```

---

## **2. Data Fetching (Supabase + Auth)**

### **A. Fetch Tasks (Browser Client, RLS enforced)**

- Use `/utils/supabase/client.ts` as per template.
- Always log the result and error for debugging.

**Example:**
```typescript
import { createSupabaseClient } from '@/utils/supabase/client';

export async function fetchTasks() {
  const supabase = await createSupabaseClient();
  const { data, error } = await supabase
    .from('task')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.log('[fetchTasks] Error:', error);
  } else {
    console.log('[fetchTasks] Loaded tasks:', data);
  }
  return { data, error };
}
```
- **Constraint:** Always log both success and error for all data operations.

### **B. Update Task (Drag & Drop, Status Change)**

- Use Supabase update, log before/after.
- Only allow if user has permission (RLS).

**Example:**
```typescript
export async function updateTaskStatus(taskId: string, newStatus: TaskStatus) {
  const supabase = await createSupabaseClient();
  console.log(`[updateTaskStatus] Updating task ${taskId} to status ${newStatus}`);
  const { data, error } = await supabase
    .from('task')
    .update({ status: newStatus })
    .eq('id', taskId)
    .select();

  if (error) {
    console.log('[updateTaskStatus] Error:', error);
  } else {
    console.log('[updateTaskStatus] Updated:', data);
  }
  return { data, error };
}
```

---

## **3. UI Components & Structure**

### **A. Page Structure: `/app/tasks/page.tsx`**

- **Header:** Title, view toggle (Kanban/List), filters
- **Main:** Kanban board or List table
- **Floating Action Button:** Add Task (bottom right, aceternity/ui Button with Lucide plus icon)
- **Responsive:**  
  - Kanban columns stack on mobile  
  - Table scrolls horizontally on small screens

### **B. Kanban Board**

- **Columns:** To Do, In Progress, Blocked, Done
- **Cards:** Task info (title, priority badge, due date, assignee avatar, material badge, chat icon)
- **Drag & Drop:** Use [dnd-kit](https://docs.dndkit.com/) (preferred with aceternity/ui)
- **Debug:** Log drag start, drop, and status update results

**Example Kanban Column:**
```tsx
<Sheet>
  <SheetHeader>To Do</SheetHeader>
  <div className="space-y-2">
    {tasks.filter(t => t.status === 'todo').map(task => (
      <TaskCard key={task.id} task={task} />
    ))}
  </div>
</Sheet>
```

**TaskCard Example:**
- Use aceternity/ui `Card`
- Priority: colored badge (`bg-destructive` for high, `bg-warning` for medium, `bg-muted` for low)
- Due date: Lucide calendar icon
- Assignee: Avatar (use aceternity/ui `Avatar`)
- Material badge: Lucide package icon if materials assigned
- Chat: Lucide message-circle icon (button to open chat)

### **C. List/Table View**

- Use aceternity/ui `Table`
- Columns: Title, Status, Priority, Due, Assignee, Materials, Chat
- Filters: Priority, Due date, Assignee (aceternity/ui `Select`/`Input`)
- Sortable by clicking column headers
- Debug: Log filter/sort actions

### **D. View Toggle**

- Use aceternity/ui `ToggleGroup` or `SegmentedControl`
- Lucide icons: LayoutKanban, List
- Log toggle action

### **E. Task Detail Page `/app/tasks/[id]/page.tsx`**

- Tabs: Details, Attachments, Chat, Materials
- Use aceternity/ui `Tabs`
- Show all task info, allow editing (if permitted)
- Debug: Log tab changes, data loads, and updates

---

## **4. State Management**

- Use React state/hooks for:
  - Current view (kanban/list)
  - Filters/sorts
  - Drag state (for Kanban)
- Use SWR or React Query if needed for caching (optional)
- All state changes should log to console for debugging

---

## **5. Styling & Responsiveness**

- All components use aceternity/ui and Tailwind variable colors (`bg-primary`, `text-primary-foreground`, etc.)
- No indigo/blue unless specified
- Kanban columns: `bg-muted` with `border`, cards with `bg-card`
- Table: `bg-background`, `text-foreground`
- Floating action button: `bg-primary`, `text-primary-foreground`, shadow, rounded-full
- Responsive:  
  - Kanban columns stack on mobile  
  - Table scrolls horizontally on small screens  
  - View toggle always visible at top

---

## **6. Debug Logging Requirements**

- **All data fetches, updates, and mutations must log:**
  - Action name
  - Input params
  - Result or error
- **All UI state changes must log:**
  - View toggles
  - Filter/sort changes
  - Drag start/drop events
  - Tab changes in detail view

**Example:**
```typescript
console.log('[Kanban] Drag start:', taskId, 'from', fromStatus);
console.log('[Kanban] Drop:', taskId, 'to', toStatus);
console.log('[ListView] Filter changed:', filterState);
console.log('[TaskDetail] Tab changed:', tabKey);
```

---

## **7. File/Component Structure**

- `app/app/tasks/page.tsx` – main page (view toggle, Kanban/List)
- `app/app/tasks/[id]/page.tsx` – task detail
- `components/tasks/TaskCard.tsx` – task card for Kanban/List
- `components/tasks/TaskTable.tsx` – table view
- `components/tasks/TaskKanban.tsx` – Kanban board
- `components/tasks/TaskDetailTabs.tsx` – detail tabs
- `components/tasks/AddTaskButton.tsx` – floating action button
- `components/tasks/TaskFilters.tsx` – filter controls

---

## **8. Constraints & Guidelines**

- **All UI must use aceternity/ui and Lucide icons**
- **No direct fetch calls; always use Supabase client with auth**
- **No dynamic imports**
- **All data operations must log for debugging**
- **All UI must be responsive and visually attractive**
- **No blue/indigo colors unless specified**
- **No code for testing, review, or unrelated boilerplate**

---

## **9. Example: Kanban Drag & Drop Logging**

```typescript
// In TaskKanban.tsx
const handleDragStart = (taskId, fromStatus) => {
  console.log('[Kanban] Drag start:', taskId, 'from', fromStatus);
};
const handleDrop = async (taskId, toStatus) => {
  console.log('[Kanban] Drop:', taskId, 'to', toStatus);
  const { data, error } = await updateTaskStatus(taskId, toStatus);
  if (error) {
    console.log('[Kanban] Status update failed:', error);
  } else {
    console.log('[Kanban] Status updated:', data);
  }
};
```

---

## **10. Example: View Toggle Logging**

```typescript
const handleViewToggle = (view) => {
  console.log('[Tasks] View toggled to:', view);
  setView(view);
};
```

---

## **Summary Table**

| Area                | Component/File                  | Key UI/Logic                | Debug Log Example                        |
|---------------------|---------------------------------|-----------------------------|------------------------------------------|
| Kanban Board        | TaskKanban.tsx                  | Drag/drop, columns/cards    | `[Kanban] Drag start/drop`               |
| List/Table View     | TaskTable.tsx                   | Table, filters, sorts       | `[ListView] Filter changed`              |
| View Toggle         | page.tsx                        | Toggle Kanban/List          | `[Tasks] View toggled to`                |
| Task Detail         | TaskDetailTabs.tsx, [id]/page   | Tabs, edit, info            | `[TaskDetail] Tab changed`               |
| Data Fetch/Update   | fetchTasks, updateTaskStatus    | Supabase RLS, auth          | `[fetchTasks]`, `[updateTaskStatus]`     |
| Add Task            | AddTaskButton.tsx               | Floating action button      | `[AddTask] Clicked`                      |

---

**Ready for implementation.**  
All steps above are required for a beautiful, robust, and debuggable Task Management feature in GenHub PWA.  
If you need code for a specific component, ask for that file directly.