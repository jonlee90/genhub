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

# Implementation Guide: Project Management – Metro Journey View

## Task
Implement the **Project Management** feature with a Metro Journey View:
- `/app/projects`: List all projects (card/list view)
- `/app/projects/[id]`: Project detail page with a horizontal "Metro Journey" stepper showing project phases, each clickable to show phase details and tasks

---

## Implementation Steps

### 1. **Project List Page (`/app/projects/page.tsx`)**

#### 1.1. Fetch Project Data
- Use Supabase browser client to fetch all projects for the authenticated user.
- Log all fetch attempts and errors for debugging.

**Example:**
```typescript
import { getSupabaseClient } from '@/utils/supabase/client';

const supabase = await getSupabaseClient();
console.log('[ProjectList] Fetching projects for dashboard');
const { data: projects, error } = await supabase.from('project').select('*').order('created_at', { ascending: false });
if (error) {
  console.error('[ProjectList] Error fetching projects:', error);
}
```

#### 1.2. Render Project Cards
- Use aceternity/ui `Card` for each project.
- Display: name, status, health (as progress bar), current phase, quick actions (view, edit).
- Use Lucide icons for status/phase.
- Responsive grid: 1 column on mobile, 2-3 on desktop.
- Add a "New Project" button (aceternity/ui `Button` with Lucide "Plus" icon).

#### 1.3. Debug Logging
- Log when cards are rendered and if any project data is missing/invalid.

---

### 2. **Project Detail Page (`/app/projects/[id]/page.tsx`)**

#### 2.1. Fetch Project & Phase Data
- Use Supabase browser client to fetch:
  - Project by `id` (from URL param)
  - All phases for this project (if phases are a separate table, else use static phase list)
  - All tasks for this project, grouped by phase
- Log all fetches and errors.

**Example:**
```typescript
const { data: project, error: projectError } = await supabase.from('project').select('*').eq('id', projectId).single();
if (projectError) {
  console.error('[ProjectDetail] Error fetching project:', projectError);
}
console.log('[ProjectDetail] Loaded project:', project);

const { data: tasks, error: tasksError } = await supabase.from('task').select('*').eq('project_id', projectId);
if (tasksError) {
  console.error('[ProjectDetail] Error fetching tasks:', tasksError);
}
```

#### 2.2. Metro Journey Stepper UI
- Use aceternity/ui `Stepper` if available, or build a custom horizontal stepper.
- Each phase is a step: Initiation → Planning → Execution → Closeout → Post-Construction.
- Use Lucide icons for each phase.
- Highlight current phase (from project data).
- Clicking a phase updates the detail section below.

#### 2.3. Phase Details Section
- Show phase name, description, % complete (progress bar), and key tasks for that phase.
- Use aceternity/ui `Card` for phase details.
- List tasks (title, status, assignee, due date) in a aceternity/ui `Table` or list.
- Add "Add Task" button (aceternity/ui `Button` with Lucide "Plus" icon).

#### 2.4. Responsive Design
- Stepper scrolls horizontally on mobile.
- Details/cards stack vertically on mobile.

#### 2.5. Debug Logging
- Log which phase is selected, and if any phase/task data is missing.
- Log user interactions (phase click, add task).

---

### 3. **Component Structure**

- `components/projects/ProjectCard.tsx`: Card for project list
- `components/projects/MetroStepper.tsx`: Metro Journey stepper
- `components/projects/PhaseDetail.tsx`: Phase details and tasks
- `components/projects/TaskList.tsx`: List of tasks for a phase

**All components:**
- Use aceternity/ui for all UI elements
- Use Tailwind variable colors (e.g., `bg-primary`, `text-primary-foreground`)
- Use Lucide icons for all icons
- Add debug logs in useEffect or event handlers

---

### 4. **Navigation & Routing**

- Clicking a project card navigates to `/app/projects/[id]`
- Clicking a phase in the stepper updates the phase detail section (client-side state)
- Clicking a task navigates to `/app/tasks/[id]`

---

### 5. **State Management**

- Use React state/hooks for:
  - Selected phase in detail view
  - Loading/error states for fetches
- Log all state changes for debugging

---

### 6. **Error & Empty States**

- If no projects: show aceternity/ui `Empty` state with illustration and "Create Project" button
- If fetch fails: show aceternity/ui `Alert` with error message and log error

---

### 7. **Accessibility & Responsiveness**

- All interactive elements must be keyboard accessible
- Stepper and cards must be fully responsive (test on mobile/desktop)

---

## Constraints & Guidelines

- **UI:** All UI must use aceternity/ui, Tailwind variable colors, and Lucide icons
- **Data:** Fetch only the current user's projects/tasks (use Supabase browser client with auth)
- **Debug:** Add detailed debug logs for all data fetches, state changes, and user actions
- **No demo code:** Do not use example/demo folders or code
- **No network requests outside Supabase:** All data via Supabase client
- **No dynamic imports:** All components imported statically

---

## Example Debug Log Points

- `[ProjectList] Fetching projects for dashboard`
- `[ProjectList] Error fetching projects: ...`
- `[ProjectDetail] Loaded project: ...`
- `[ProjectDetail] Selected phase: Planning`
- `[PhaseDetail] Tasks loaded for phase: ...`
- `[TaskList] User clicked task: ...`

---

## Summary Table

| Step | File/Component                                 | Purpose/Action                                  | Debug Log Example                        |
|------|-----------------------------------------------|-------------------------------------------------|------------------------------------------|
| 1    | `/app/projects/page.tsx`                      | Fetch & render project list                     | `[ProjectList] Fetching projects...`     |
| 2    | `components/projects/ProjectCard.tsx`         | Project card UI                                 | `[ProjectCard] Rendered project: ...`    |
| 3    | `/app/projects/[id]/page.tsx`                 | Fetch project, render Metro stepper & details   | `[ProjectDetail] Loaded project: ...`    |
| 4    | `components/projects/MetroStepper.tsx`        | Metro journey stepper UI                        | `[MetroStepper] Selected phase: ...`     |
| 5    | `components/projects/PhaseDetail.tsx`         | Show phase details, tasks, progress             | `[PhaseDetail] Tasks loaded for phase...`|
| 6    | `components/projects/TaskList.tsx`            | List tasks for phase                            | `[TaskList] User clicked task: ...`      |

---

**Ready for development.**  
All steps above are unambiguous, with clear debug log points and UI/UX constraints.  
Let me know if you need detailed code for any component or further breakdown!