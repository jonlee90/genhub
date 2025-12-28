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

# Analytics & Dashboards Implementation Guide

## Task
Implement the Analytics & Dashboards feature at `/app/analytics` for GenHub PWA, providing users with a beautiful, responsive dashboard of project progress, budget vs actual, material usage, subcontractor performance, and days remaining.  
All UI must use aceternity/ui, Tailwind variable colors, and Lucide icons.  
**Debug logs must be included at every data fetch and processing step.**

---

## Implementation Steps

### 1. **Route & Page Setup**

- Create the analytics page at `app/app/analytics/page.tsx`.
- The page must be protected (auth required, already handled by middleware).
- Use the existing app layout (sidebar, header).

---

### 2. **Data Fetching (Supabase Integration)**

- Fetch the following data for the current authenticated user:
  - Project summaries (name, health, status, budget, days remaining)
  - Task completion stats (per project)
  - Material usage (per project)
  - Subcontractor performance (per project)
- Use the browser Supabase client (`utils/supabase/client.ts`) to ensure RLS/auth is respected.

**Example: Fetching project stats with debug logs**
```typescript
import { createSupabaseClient } from '@/utils/supabase/client';

export async function fetchAnalyticsData(userId: string) {
  const supabase = await createSupabaseClient();

  // Fetch projects
  const { data: projects, error: projectsError } = await supabase
    .from('project')
    .select('id, name, status, health, budget, current_phase, created_at')
    .eq('user_id', userId);

  console.log('[Analytics] Projects fetch:', { projects, projectsError });

  // Fetch tasks
  const { data: tasks, error: tasksError } = await supabase
    .from('task')
    .select('id, status, project_id')
    .eq('user_id', userId);

  console.log('[Analytics] Tasks fetch:', { tasks, tasksError });

  // Fetch materials
  const { data: materials, error: materialsError } = await supabase
    .from('material')
    .select('id, project_id, status, cost')
    .eq('user_id', userId);

  console.log('[Analytics] Materials fetch:', { materials, materialsError });

  // Fetch subcontractors
  const { data: subs, error: subsError } = await supabase
    .from('subcontractor')
    .select('id, name, performance, project_id')
    .eq('user_id', userId);

  console.log('[Analytics] Subcontractors fetch:', { subs, subsError });

  return { projects, tasks, materials, subs, errors: { projectsError, tasksError, materialsError, subsError } };
}
```
- **Constraint:** Always log both data and error for each fetch.  
- **Constraint:** If any error occurs, display a aceternity/ui `Alert` in the UI with the error message.

---

### 3. **Analytics Widgets & Layout**

- Use a responsive grid layout (aceternity/ui `Card` components) for dashboard widgets.
- Each widget must have:
  - Lucide icon (relevant to the metric)
  - Title (e.g., "Active Projects", "Budget vs Actual")
  - Main value (number, percent, or chart)
  - Subtext (trend, last updated, etc.)

**Widgets to include:**
- Active Projects (count)
- Tasks Due This Week (count)
- Budget vs Actual (bar or progress chart)
- Material Usage (progress or pie chart)
- Subcontractor Performance (top 3, with rating)
- Days Remaining (per project, show as badge or progress)

**Example widget layout:**
```tsx
<Card className="flex flex-col items-start bg-background shadow-md p-6">
  <div className="flex items-center gap-2">
    <IconProject className="text-primary" />
    <span className="text-lg font-semibold">Active Projects</span>
  </div>
  <div className="text-3xl font-bold mt-2">{activeProjectsCount}</div>
  <div className="text-muted-foreground text-sm mt-1">as of {lastUpdated}</div>
</Card>
```
- **Constraint:** Use only aceternity/ui `Card`, `Badge`, `Progress`, `Table`, and `Tabs` for layout.
- **Constraint:** Use Tailwind variable colors (`bg-primary`, `text-primary-foreground`, etc.).
- **Constraint:** All widgets must be responsive (stack on mobile, grid on desktop).

---

### 4. **Charts Integration**

- Use a chart library compatible with Next.js and aceternity/ui (e.g., [recharts](https://recharts.org/)).
- Import charts directly (no dynamic imports).
- Use charts for:
  - Budget vs Actual (bar or progress)
  - Material Usage (pie or bar)
  - Task Completion (progress)
- **Constraint:** Chart colors must use Tailwind variable colors (e.g., `var(--primary)`, `var(--secondary)`).

**Example:**
```tsx
<ResponsiveContainer width="100%" height={200}>
  <BarChart data={budgetData}>
    <XAxis dataKey="project" />
    <YAxis />
    <Bar dataKey="budget" fill="var(--primary)" />
    <Bar dataKey="actual" fill="var(--secondary)" />
  </BarChart>
</ResponsiveContainer>
```

---

### 5. **Drilldown & Navigation**

- Each widget should be clickable (use aceternity/ui `Button` or `Card` with `onClick`) to navigate to the relevant detail page:
  - Projects → `/app/projects`
  - Tasks → `/app/tasks`
  - Materials → `/app/materials`
  - Subs → `/app/team`
- Use Next.js router for navigation.

---

### 6. **Error & Loading States**

- Show a aceternity/ui `Skeleton` for each widget while loading.
- If any fetch error, show a aceternity/ui `Alert` with the error message and a retry button.
- Log all errors to the console with `[Analytics]` prefix.

---

### 7. **Accessibility & Responsiveness**

- All widgets and charts must be keyboard accessible.
- Use semantic HTML and ARIA labels where appropriate.
- Layout must be fully responsive (test on mobile and desktop).

---

### 8. **Debug Logging**

- At every data fetch, processing, and render step, add `console.log` with a clear `[Analytics]` prefix and context.
- Example:
  - `[Analytics] Fetched 5 projects`
  - `[Analytics] Error fetching materials: ...`
  - `[Analytics] Rendering Budget vs Actual widget with data: ...`

---

## File/Component Structure

- `app/app/analytics/page.tsx` – Main analytics page, fetches data, renders widgets.
- `components/analytics/AnalyticsWidgets.tsx` – Widget grid, receives data as props.
- `components/analytics/Charts.tsx` – Chart components (BudgetChart, MaterialChart, etc.).
- `components/ui/` – Use aceternity/ui components for all UI elements.

---

## Example Directory Tree

```
app/
  app/
    analytics/
      page.tsx
components/
  analytics/
    AnalyticsWidgets.tsx
    BudgetChart.tsx
    MaterialChart.tsx
```

---

## Constraints & Guidelines

- **UI:** All UI must use aceternity/ui, Tailwind variable colors, and Lucide icons.
- **Data:** Use Supabase browser client for all data fetches, with debug logs.
- **Charts:** Use recharts or similar, with Tailwind variable colors.
- **Responsiveness:** Must be fully responsive and accessible.
- **Debug:** Log all fetches, errors, and key render steps with `[Analytics]` prefix.
- **Navigation:** All widgets must be clickable and route to detail pages.

---

## Example Widget Data Flow

1. On page load, fetch all analytics data for the user.
2. Log each fetch and error.
3. Pass data to `AnalyticsWidgets`.
4. Each widget renders with data, logs render step.
5. On error, show `Alert` and log error.
6. On widget click, navigate to detail page.

---

**Ready for development.**  
Follow these steps and constraints to implement a beautiful, robust Analytics & Dashboards page for GenHub.  
If you need detailed code for any part, specify the widget or chart.