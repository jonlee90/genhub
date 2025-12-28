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

# Implementation Guide: Daily Site Reports (AI Summaries)

## Task
Implement the **Daily Site Reports** feature at `/app/reports`:
- Users can submit daily site reports (weather, crew, work, photos, safety notes).
- AI generates summaries for internal/client use.
- Reports are listed in a table with status, date, and summary preview.
- All UI must use aceternity/ui, Tailwind variable colors, and Lucide icons.
- Responsive, beautiful, and matches GenHub’s design system.

---

## Implementation Steps

### 1. **Database Integration**

#### a. **Table Structure**
Ensure the following table exists in Supabase (adjust as needed):

```sql
create table report (
  id identity primary key,
  user_id uuid not null references user(id),
  project_id integer not null references project(id),
  date date not null,
  weather text,
  crew text,
  work text,
  safety text,
  photos jsonb, -- array of photo URLs/metadata
  ai_summary_internal text,
  ai_summary_client text,
  status text default 'draft', -- 'draft', 'submitted', 'reviewed'
  created_at timestamp with time zone default now()
);
```

#### b. **Type Definitions**
Add to `types/database.types.ts`:

```typescript
export interface Report {
  id: number;
  user_id: string;
  project_id: number;
  date: string;
  weather?: string;
  crew?: string;
  work?: string;
  safety?: string;
  photos?: { url: string; name?: string }[];
  ai_summary_internal?: string;
  ai_summary_client?: string;
  status: 'draft' | 'submitted' | 'reviewed';
  created_at: string;
}
```

---

### 2. **Server Actions**

#### a. **Create/Update Report**
In `app/actions/reports.ts`:

```typescript
import { getSupabaseClient } from '@/utils/supabase/server';
import { Report } from '@/types/database.types';

// Create a new report
export async function createReport(data: Partial<Report>) {
  const supabase = await getSupabaseClient();
  const { data: report, error } = await supabase
    .from('report')
    .insert([data])
    .select()
    .single();
  if (error) {
    console.log('[REPORT][CREATE][ERROR]', error);
    throw error;
  }
  console.log('[REPORT][CREATE][SUCCESS]', report);
  return report;
}

// Update report (e.g., after AI summary)
export async function updateReport(id: number, updates: Partial<Report>) {
  const supabase = await getSupabaseClient();
  const { data: report, error } = await supabase
    .from('report')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  if (error) {
    console.log('[REPORT][UPDATE][ERROR]', error);
    throw error;
  }
  console.log('[REPORT][UPDATE][SUCCESS]', report);
  return report;
}
```

#### b. **Fetch Reports**
```typescript
export async function fetchReports(projectId?: number) {
  const supabase = await getSupabaseClient();
  let query = supabase.from('report').select('*').order('date', { ascending: false });
  if (projectId) query = query.eq('project_id', projectId);
  const { data, error } = await query;
  if (error) {
    console.log('[REPORT][FETCH][ERROR]', error);
    throw error;
  }
  console.log('[REPORT][FETCH][SUCCESS]', data);
  return data as Report[];
}
```

---

### 3. **AI Summary Integration**

- Use `utils/ai.ts` to call your AI summary function.
- After report submission, trigger AI summary generation and update the report.
- Log all AI calls and results for debugging.

**Example:**
```typescript
import { generateReportSummary } from '@/utils/ai';

export async function handleAISummary(report: Report) {
  try {
    const { internal, client } = await generateReportSummary(report);
    await updateReport(report.id, {
      ai_summary_internal: internal,
      ai_summary_client: client,
    });
    console.log('[REPORT][AI][SUMMARY][SUCCESS]', { internal, client });
  } catch (e) {
    console.log('[REPORT][AI][SUMMARY][ERROR]', e);
  }
}
```

---

### 4. **Frontend: `/app/reports/page.tsx`**

#### a. **Report List Table**
- Use `components/reports/ReportTable.tsx`
- Columns: Date, Project, Status, AI Summary Preview, Actions (View/Edit)
- Use aceternity/ui `Table`, Lucide icons for status.

#### b. **Report Submission Form**
- Use `components/reports/ReportForm.tsx`
- Fields: Date (default today), Project (dropdown), Weather, Crew, Work, Safety, Photo upload (aceternity/ui Dropzone).
- Submit triggers `createReport`, then AI summary.
- Show loading state and success/error toasts.

#### c. **Report Detail/Summary**
- Use `components/reports/ReportSummary.tsx`
- Show all fields, photos (gallery), AI summaries (internal/client) in aceternity/ui `Card`.
- Download/share buttons (aceternity/ui `Button`).

#### d. **Responsive Design**
- Table collapses to cards on mobile.
- Form and summary use grid/flex for mobile stacking.

---

### 5. **UI/UX & Styling**

- All components use aceternity/ui, Tailwind variable colors (e.g., `bg-primary`, `text-primary-foreground`).
- Use Lucide icons for status, actions, and photo previews.
- Use aceternity/ui `Alert` for errors, `Toast` for success.
- Ensure all forms, tables, and cards are visually consistent and beautiful.
- Add skeleton loaders for data fetching.

---

### 6. **Debug Logging**

- All server actions and AI calls must log:
  - `[REPORT][CREATE][SUCCESS/ERROR]`
  - `[REPORT][UPDATE][SUCCESS/ERROR]`
  - `[REPORT][FETCH][SUCCESS/ERROR]`
  - `[REPORT][AI][SUMMARY][SUCCESS/ERROR]`
- Log input data and returned data for each action.
- On the frontend, log form submission, errors, and AI summary status.

---

### 7. **File Structure**

```
app/
  app/
    reports/
      page.tsx
components/
  reports/
    ReportTable.tsx
    ReportForm.tsx
    ReportSummary.tsx
    [other UI as needed]
app/
  actions/
    reports.ts
utils/
  ai.ts
types/
  database.types.ts
```

---

## Example UI Flow

1. **User visits `/app/reports`**  
   → Sees table of reports (date, project, status, summary preview).

2. **Clicks "New Report"**  
   → Modal/form opens. User fills in fields, uploads photos.

3. **Submits report**  
   → Shows loading, calls `createReport`, logs result.  
   → Triggers AI summary, logs AI call/result.  
   → Table updates with new report and summary.

4. **Clicks a report**  
   → Opens detail view: all fields, photo gallery, AI summaries, download/share.

---

## Constraints & Guidelines

- **All UI must use aceternity/ui and Tailwind variable colors.**
- **No direct fetch calls in components; use server actions.**
- **All data access must use Supabase client with auth.**
- **All actions must have detailed debug logs.**
- **Responsive and beautiful UI is required.**
- **No blue/indigo colors unless specified.**
- **No dynamic imports.**
- **No testing or code review steps in this doc.**

---

## Example: Report Table Row

| Date       | Project      | Status    | AI Summary Preview         | Actions      |
|------------|--------------|-----------|---------------------------|--------------|
| 2024-06-01 | HQ Remodel   | Submitted | "Crew poured slab..."     | [View][Edit] |
| 2024-05-31 | HQ Remodel   | Reviewed  | "Inspected rebar, passed" | [View]       |

- Status uses Lucide icon (e.g., CheckCircle for reviewed).
- Actions use aceternity/ui `Button` with icon.

---

**Ready for development.**  
If you need code examples for any component or action, specify which one!