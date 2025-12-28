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

# GenHub – Change Orders Feature Implementation Guide

## Task
Implement the **Change Orders** feature in GenHub, enabling PM/GCs to create, track, and route change orders for client approval, with AI-predicted cost/schedule impact.

---

## Implementation Guide

### 1. Database Schema

**Create the following tables in Supabase:**

```sql
-- Change Orders Table
create table change_order (
  id identity primary key,
  project_id integer not null references project(id),
  title text not null,
  description text,
  status text not null default 'draft', -- 'draft', 'pending_approval', 'approved', 'rejected'
  ai_cost_impact numeric,               -- AI-predicted cost delta
  ai_schedule_impact integer,           -- AI-predicted days delta
  created_by uuid not null references user(id),
  approved_by uuid references user(id),
  approved_at timestamp with time zone,
  created_at timestamp with time zone default now()
);

-- Change Order Comments (for approval/rejection notes)
create table change_order_comment (
  id identity primary key,
  change_order_id integer not null references change_order(id),
  user_id uuid not null references user(id),
  comment text not null,
  created_at timestamp with time zone default now()
);
```

**Constraints:**
- Only users with PM/GC role can create/change orders.
- Only client users can approve/reject.
- Enforce RLS so users can only see change orders for projects they have access to.

---

### 2. API & Server Actions

**Create API routes and server actions:**

- `app/api/change-orders/`  
  - `POST /` – Create new change order  
  - `GET /` – List change orders (by project/user)  
  - `PATCH /[id]` – Update status (approve/reject), add AI impact  
  - `POST /[id]/comments` – Add comment

- `app/actions/changeOrders.ts`  
  - `createChangeOrder({ projectId, title, description, createdBy })`
  - `getChangeOrders({ projectId, userId })`
  - `updateChangeOrderStatus({ id, status, approvedBy })`
  - `addChangeOrderComment({ changeOrderId, userId, comment })`
  - `runAIPrediction({ description, projectId })` (calls AI helper)

**Debug Logging:**  
- Log all API requests and responses with user ID, project ID, and payload.
- On error, log error object and input params.
- On AI prediction, log input and output.

**Example:**
```typescript
console.log('[ChangeOrder] Creating:', { projectId, title, userId });
if (error) console.error('[ChangeOrder] Create Error:', error, { projectId, userId });
```

---

### 3. Supabase Client Usage

**Browser Client Example (with RLS):**
```typescript
import { getSupabaseClient } from '@/utils/supabase/client';
const supabase = await getSupabaseClient();
const { data, error } = await supabase
  .from('change_order')
  .select('*')
  .eq('project_id', projectId);
if (error) {
  console.error('[ChangeOrder] Fetch Error:', error, { projectId });
}
```

**Server Admin Client Example (for webhooks/AI):**
```typescript
import { createSupabaseAdminClient } from '@/utils/supabase/server';
const supabaseAdmin = await createSupabaseAdminClient();
const { data, error } = await supabaseAdmin
  .from('change_order')
  .update({ status: 'approved', approved_by: userId, approved_at: new Date() })
  .eq('id', changeOrderId);
if (error) {
  console.error('[ChangeOrder] Admin Update Error:', error, { changeOrderId, userId });
}
```

---

### 4. UI Components & Pages

**Location:**  
- `app/app/change-orders/page.tsx` – List & create change orders  
- `app/app/change-orders/[id]/page.tsx` – Change order detail/approval

**Components (in `components/change-orders/`):**
- `ChangeOrderTable.tsx` – Table of change orders (aceternity/ui Table)
- `ChangeOrderForm.tsx` – Create/edit form (aceternity/ui Form)
- `ChangeOrderDetail.tsx` – Detail view with AI impact, status, comments
- `ChangeOrderApproval.tsx` – Approve/Reject UI (aceternity/ui Button)
- `ChangeOrderCommentList.tsx` – List of comments

**UI Guidelines:**
- Use aceternity/ui Table for list, Form for create/edit, Card for detail.
- Use Lucide icons for status (e.g., CheckCircle for approved, XCircle for rejected).
- Use Tailwind variable colors:  
  - Status:  
    - Draft: `bg-muted`  
    - Pending: `bg-warning`  
    - Approved: `bg-success`  
    - Rejected: `bg-destructive`
- Responsive: Table collapses to cards on mobile.
- Approval: Show Approve/Reject buttons only for client users.
- AI Impact: Show cost/schedule impact in a Card with Lucide AlertCircle icon if high.

**Example Table Row:**
| Title | Status | AI Cost Impact | AI Schedule Impact | Created By | Actions |
|-------|--------|---------------|-------------------|------------|---------|
| ...   | ...    | $1,200        | +3 days           | ...        | View    |

---

### 5. AI Prediction Integration

**Helper:**  
- `utils/ai.ts` – Add `predictChangeOrderImpact(description, projectId)`  
  - Input: change order description, project context  
  - Output: `{ costDelta: number, scheduleDelta: number }`

**Usage:**  
- On form submit, call AI helper, show loading spinner.
- Display AI results in the form before final submit.
- Log AI input/output for debugging.

---

### 6. Notifications

- On create, pending, approved, or rejected, trigger notification (in-app, email, or client portal).
- Use `app/actions/notifications.ts` to send.
- Log notification events with change order ID and user ID.

---

### 7. Permissions & RLS

- Only PM/GC can create/edit.
- Only client can approve/reject.
- Enforce in API and Supabase RLS.
- Log all permission denials with user ID and attempted action.

---

### 8. Styling & UX

- All UI must use aceternity/ui components.
- Use Tailwind variable colors (`bg-primary`, `text-primary-foreground`, etc.).
- Use Lucide icons for all status/actions.
- Responsive: All views must work on mobile and desktop.
- Empty states: Show aceternity/ui Empty placeholder with icon and CTA to create new.

---

### 9. Debug Logging

- All server actions and API routes must log:
  - User ID, project ID, change order ID (if present)
  - Action (create, update, approve, reject)
  - Input params and result (success/error)
  - AI prediction input/output
- Use `console.log` and `console.error` with clear prefixes.

---

## Summary Table

| Step | Scope                        | File/Component Location                | Key Constraints/Guidelines                |
|------|------------------------------|----------------------------------------|-------------------------------------------|
| 1    | DB Schema                    | Supabase SQL                           | See above, enforce RLS                    |
| 2    | API & Actions                | `app/api/change-orders/`, `app/actions/changeOrders.ts` | Log all actions, enforce permissions      |
| 3    | Supabase Client Usage        | `utils/supabase/client.ts`, `server.ts`| Use correct client for RLS/bypass         |
| 4    | UI Components & Pages        | `app/app/change-orders/`, `components/change-orders/` | aceternity/ui, Lucide, Tailwind vars, responsive |
| 5    | AI Prediction                | `utils/ai.ts`                          | Log input/output, show in UI              |
| 6    | Notifications                | `app/actions/notifications.ts`         | Log events, trigger on status change      |
| 7    | Permissions & RLS            | Supabase, API, Actions                 | Enforce, log denials                      |
| 8    | Styling & UX                 | All UI                                 | aceternity/ui, Tailwind, Lucide, responsive   |
| 9    | Debug Logging                | All server/client actions              | Log all key events and errors             |

---

**Ready for implementation.**  
Follow the above steps, constraints, and logging requirements for a robust, beautiful, and debuggable Change Orders feature.  
If you need a breakdown for a specific sub-task (e.g., just the AI integration or just the approval flow), ask for that next!