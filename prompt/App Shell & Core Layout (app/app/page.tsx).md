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

# GenHub PWA – App Shell & Core Layout Implementation Guide  
**Scope:** Implement the main dashboard shell at `app/app/page.tsx` with sidebar navigation, responsive layout, and dashboard widgets.  
**Goal:** Authenticated users land on a beautiful, modern dashboard with sidebar navigation and key stats.

---

## 1. **Sidebar Navigation**

### 1.1. **Component Structure**
- Place sidebar in `components/app/Sidebar.tsx`.
- Use aceternity/ui `Sheet` for mobile, and a fixed sidebar for desktop.
- Use Lucide React icons for each nav item.
- Navigation items (in order):
  - Dashboard (Home)
  - Projects
  - Tasks
  - Bids
  - Materials
  - Expenses
  - Reports
  - Analytics
  - Team
  - Client Portal
  - Settings

### 1.2. **Sidebar UI/UX**
- **Desktop:**  
  - Sidebar is always visible, 64px wide (icon-only) on small screens, 220px (icon + label) on md+.
  - Use Tailwind: `bg-background border-r border-border text-muted-foreground`.
  - Active nav item: `bg-primary text-primary-foreground rounded-md`.
- **Mobile:**  
  - Use aceternity/ui `Sheet` (slide-in drawer) for sidebar.
  - Hamburger menu in header toggles sidebar.
- **Accessibility:**  
  - Use `aria-current="page"` for active nav.
  - All nav items must be keyboard accessible.

### 1.3. **Sidebar Navigation State**
- Store current section in state (e.g., `navSection`).
- Highlight active section based on current route.
- Example nav item:
  ```tsx
  <NavLink
    href="/app/projects"
    className={cn(
      "flex items-center gap-3 px-4 py-2 rounded-md transition-colors",
      isActive ? "bg-primary text-primary-foreground" : "hover:bg-accent"
    )}
    aria-current={isActive ? "page" : undefined}
  >
    <FolderKanban className="w-5 h-5" />
    <span className="hidden md:inline">Projects</span>
  </NavLink>
  ```

### 1.4. **Debug Logging**
- On nav click, log:  
  `console.debug('[Sidebar] Navigating to:', section)`
- On sidebar mount, log:  
  `console.debug('[Sidebar] Sidebar mounted, current section:', navSection)`

---

## 2. **Header (Update)**

- Update `components/app/Header.tsx` to match sidebar style:
  - Use `bg-background border-b border-border h-16 flex items-center px-6`.
  - Add hamburger menu button (mobile only) to open sidebar.
  - Show user avatar (use aceternity/ui `Avatar`), notification bell (Lucide), and quick actions.
  - If updating, log:  
    `console.debug('[Header] Rendered, user:', user?.email)`

---

## 3. **Main Content Area (Dashboard Widgets)**

### 3.1. **Layout**
- Use a responsive grid:  
  - 1 column on mobile, 2 on sm, 3 on md+.
  - Tailwind: `grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6`
- Place in `app/app/page.tsx`.

### 3.2. **Widgets**
- Each widget is a aceternity/ui `Card`:
  - **Active Projects:** Count of active projects.
  - **Tasks Due Today:** Count of tasks due today.
  - **Bids Awaiting Review:** Count of open bids.
  - **Expenses Pending:** Count of expenses needing approval.
  - **Team Members:** Count of team members.
  - **Client Portals:** Count of active client portals.
- Use Lucide icons in each card.
- Example:
  ```tsx
  <Card className="flex items-center gap-4 p-6 bg-card">
    <FolderKanban className="w-8 h-8 text-primary" />
    <div>
      <div className="text-2xl font-bold">{activeProjects}</div>
      <div className="text-sm text-muted-foreground">Active Projects</div>
    </div>
  </Card>
  ```

### 3.3. **Data Fetching**
- Use Supabase browser client (`utils/supabase/client.ts`) to fetch:
  - Projects: `select count(*) where status = 'active'`
  - Tasks: `select count(*) where due_date = today and status != 'done'`
  - Bids, Expenses, Team, Clients: similar queries.
- On fetch success/failure, log:
  - `console.debug('[Dashboard] Fetched projects:', data)`
  - `console.error('[Dashboard] Error fetching projects:', error)`

---

## 4. **Responsiveness & Theming**

- All layouts must be fully responsive (sidebar collapses, grid stacks).
- Use only Tailwind variable-based colors (`bg-primary`, `text-primary-foreground`, etc.).
- No hardcoded colors or indigo/blue unless specified.
- All icons from Lucide React.
- All UI from aceternity/ui.

---

## 5. **File/Component Organization**

- `app/app/page.tsx`: Main dashboard page (imports Sidebar, renders widgets).
- `components/app/Sidebar.tsx`: Sidebar navigation.
- `components/app/Header.tsx`: Header (update as needed).
- `components/app/DashboardWidget.tsx`: (Optional) Widget card abstraction.
- All debug logs as specified.

---

## 6. **Example Directory Structure**

```
app/
  app/
    page.tsx
components/
  app/
    Sidebar.tsx
    Header.tsx
    DashboardWidget.tsx
utils/
  supabase/
    client.ts
```

---

## 7. **Constraints & Guidelines**

- **Do not** fetch data in layout.tsx; only in page.tsx or components.
- **Do not** use dynamic imports or fetch.
- **Do not** use hardcoded colors.
- **Do not** add new dependencies unless required.
- **Do not** break existing auth/payment flows.
- **Do** use aceternity/ui and Lucide everywhere.
- **Do** add debug logs for all navigation and data fetch actions.

---

## 8. **Sample Widget Data Fetch (Supabase Client)**

```typescript
import { createSupabaseClient } from '@/utils/supabase/client';

export async function getActiveProjectsCount() {
  const supabase = await createSupabaseClient();
  const { count, error } = await supabase
    .from('project')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'active');
  if (error) {
    console.error('[Dashboard] Error fetching active projects:', error);
    return 0;
  }
  console.debug('[Dashboard] Active projects count:', count);
  return count || 0;
}
```

---

## 9. **Accessibility & UX**

- All nav and widget elements must be keyboard accessible.
- Use `aria-current` and `aria-label` as appropriate.
- Sidebar and header must be visually consistent and beautiful.

---

## 10. **Summary Table of Tasks**

| Step | Task                                      | File/Component                  | Debug Log Example                                 |
|------|-------------------------------------------|---------------------------------|---------------------------------------------------|
| 1    | Implement Sidebar navigation              | components/app/Sidebar.tsx      | `[Sidebar] Navigating to: projects`               |
| 2    | Update Header for style & mobile menu     | components/app/Header.tsx       | `[Header] Rendered, user: user@email.com`         |
| 3    | Build dashboard widgets grid              | app/app/page.tsx                | `[Dashboard] Fetched projects: ...`               |
| 4    | Fetch data for widgets (Supabase client)  | utils/supabase/client.ts        | `[Dashboard] Error fetching active projects: ...` |
| 5    | Ensure full responsiveness & theming      | All                             |                                                   |
| 6    | Add accessibility attributes              | All                             |                                                   |

---

**Follow these steps to implement a beautiful, robust, and debuggable GenHub App Shell & Core Layout.**  
**All UI must be aceternity/ui, Tailwind variable colors, and Lucide icons.**  
**Add debug logs for all navigation and data fetch actions.**