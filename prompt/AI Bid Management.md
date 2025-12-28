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

# AI Bid Management – Implementation Guide

## Task
Implement the **AI Bid Management** feature for GenHub PWA, including bid package creation, AI-powered bid comparison, subcontractor invitations, and awarding bids.  
All UI must use aceternity/ui, Tailwind variable colors, and Lucide icons.  
Integrate with existing auth, payment, and Supabase setup.

---

## Implementation Steps

### 1. **Database Preparation**

**Tables Required:**
- `bids` – Bid packages (one per scope/project/phase)
- `bid_subs` – Subcontractors invited to each bid
- `bid_responses` – Submitted bids from subs
- `bid_analysis` – AI-generated normalization/comparison (optional, can be a JSON column in `bids`)

**Example Schema:**
```sql
create table bids (
  id identity primary key,
  project_id integer not null references project(id),
  phase text not null,
  scope text not null,
  status text not null, -- e.g. 'draft', 'open', 'closed', 'awarded'
  created_by uuid not null references user(id),
  created_at timestamp with time zone default now(),
  ai_analysis jsonb -- stores AI comparison results
);

create table bid_subs (
  id identity primary key,
  bid_id integer not null references bids(id),
  sub_name text not null,
  sub_email text,
  sub_phone text,
  invite_status text not null, -- 'invited', 'responded', 'declined'
  invited_at timestamp with time zone default now()
);

create table bid_responses (
  id identity primary key,
  bid_id integer not null references bids(id),
  sub_id integer not null references bid_subs(id),
  response jsonb not null, -- line items, price, notes, etc.
  submitted_at timestamp with time zone default now()
);
```
**Constraints:**
- All access must be RLS-protected by user’s org/project.
- Only authenticated users can create/invite/award bids.

---

### 2. **API & Server Actions**

**Files:**
- `app/actions/bids.ts` – Server actions for CRUD, AI analysis, invite, award.
- `app/api/bids/` – API routes for bid operations (if needed for external access).

**Actions to Implement:**
- `createBid({ projectId, phase, scope })`
- `inviteSub({ bidId, subName, subEmail, subPhone })`
- `submitBidResponse({ bidId, subId, response })`
- `runAIAnalysis({ bidId })` – Calls AI helper, updates `ai_analysis`
- `awardBid({ bidId, subId })` – Marks as awarded, triggers task creation

**Debug Logging:**
- Log all action inputs/outputs and errors to console with clear context, e.g.:
  ```typescript
  console.log('[BID][CREATE]', { projectId, phase, scope });
  if (error) console.error('[BID][CREATE][ERROR]', error);
  ```

---

### 3. **Supabase Integration**

**Client Usage:**
- Use `/utils/supabase/client.ts` for all user-facing data fetches (with auth).
- Use `/utils/supabase/server.ts` for server actions (admin, webhooks).

**Example:**
```typescript
import { getSupabaseClient } from '@/utils/supabase/client';
const supabase = await getSupabaseClient();
const { data, error } = await supabase.from('bids').select('*').eq('project_id', projectId);
if (error) {
  console.error('[BID][FETCH][ERROR]', error);
}
```

---

### 4. **UI Components & Pages**

**Pages:**
- `/app/bids/page.tsx` – Bid package list
- `/app/bids/[id]/page.tsx` – Bid detail (scope, subs, AI tab, award)

**Components (in `components/bids/`):**
- `BidCard.tsx` – Card for each bid in list
- `BidDetailTabs.tsx` – Tabs: Scope, Subs, AI Table, Award
- `BidInviteModal.tsx` – Modal to invite subs (email/SMS)
- `BidTable.tsx` – Table of received bids, AI highlights
- `BidAward.tsx` – Award UI (select sub, confirm)

**UI Guidelines:**
- Use aceternity/ui `Card`, `Tabs`, `Table`, `Dialog`, `Button`, `Input`, `Badge`.
- Use Lucide icons for status, actions (e.g., `Gavel` for award, `Mail` for invite).
- All colors via Tailwind variable classes (e.g., `bg-primary`, `text-primary-foreground`).
- Responsive: Cards stack on mobile, tables scroll horizontally.
- Show clear status badges (e.g., `Open`, `Awarded`) using aceternity/ui `Badge`.

**Example:**
```tsx
<Card className="bg-background border shadow-sm">
  <div className="flex items-center justify-between">
    <div>
      <h3 className="text-lg font-semibold">{bid.scope}</h3>
      <Badge variant={bid.status === 'awarded' ? 'success' : 'default'}>
        {bid.status}
      </Badge>
    </div>
    <Button variant="outline" onClick={() => openBidDetail(bid.id)}>
      <Gavel className="w-4 h-4 mr-2" /> View
    </Button>
  </div>
</Card>
```

---

### 5. **AI Analysis Integration**

**Helper:**
- Add `utils/ai.ts` with `analyzeBids(bidResponses: any[]): Promise<AIAnalysisResult>`

**Usage:**
- On bid detail page, when all responses are in, call `runAIAnalysis` action.
- Store result in `bids.ai_analysis`.
- Display in AI tab as a aceternity/ui `Table`:
  - Highlight gaps, best value, outliers (use `bg-muted` or `text-destructive` for highlights).
  - Show AI summary at top (e.g., “Sub A is lowest, Sub B missing line items”).

**Debug Logging:**
- Log AI input/output and errors:
  ```typescript
  console.log('[BID][AI][INPUT]', bidResponses);
  console.log('[BID][AI][RESULT]', aiResult);
  if (error) console.error('[BID][AI][ERROR]', error);
  ```

---

### 6. **Subcontractor Invitation**

**Modal:**
- Use aceternity/ui `Dialog` for invite modal.
- Inputs: Name, Email, Phone.
- On submit, call `inviteSub` action.
- Show success/error toast (aceternity/ui `Toast`).

**Debug Logging:**
- Log invite details and errors:
  ```typescript
  console.log('[BID][INVITE][SUB]', { bidId, subName, subEmail, subPhone });
  if (error) console.error('[BID][INVITE][ERROR]', error);
  ```

---

### 7. **Bid Awarding**

**Award UI:**
- In Award tab, list all subs who responded.
- Select sub, confirm award (aceternity/ui `Button`).
- On award, call `awardBid` action (creates tasks for winning sub).
- Show awarded status in UI (badge, icon).

**Debug Logging:**
- Log award action and errors:
  ```typescript
  console.log('[BID][AWARD]', { bidId, subId });
  if (error) console.error('[BID][AWARD][ERROR]', error);
  ```

---

### 8. **Permissions & Auth**

- All bid actions require user to be authenticated (reuse existing auth).
- Only project owners/PMs can create/invite/award.
- Subcontractors can only see/respond to their own invites.

---

### 9. **Navigation & Linking**

- Add “Bids” to sidebar navigation (icon: `FileText` or `Gavel`).
- Clicking a bid in the list navigates to `/app/bids/[id]`.
- After awarding, show a toast and update status badge.

---

### 10. **Debug Logging – General**

- Every server action and major UI event must log:
  - Action name, input params, output/result, and errors.
  - Use clear, consistent tags: `[BID][ACTION][CONTEXT]`
- Example:
  ```typescript
  console.log('[BID][CREATE]', { ... });
  if (error) console.error('[BID][CREATE][ERROR]', error);
  ```

---

## **Summary Table**

| Step | Scope                | File/Component                  | Key Constraints/Guidelines                |
|------|----------------------|----------------------------------|-------------------------------------------|
| 1    | DB Schema            | Supabase SQL                     | Use RLS, link to project/user             |
| 2    | Server Actions       | app/actions/bids.ts              | Log all inputs/outputs/errors             |
| 3    | Supabase Integration | utils/supabase/client.ts         | Use correct client for auth/RLS           |
| 4    | UI Components        | components/bids/                 | aceternity/ui, Lucide, Tailwind vars, resp.   |
| 5    | AI Analysis          | utils/ai.ts, BidTable            | Log AI input/output, highlight gaps       |
| 6    | Sub Invite           | BidInviteModal                   | Dialog, toast, log invites                |
| 7    | Awarding             | BidAward                         | Only PM/GC, log award, update status      |
| 8    | Permissions          | All actions/pages                | Auth required, RLS enforced               |
| 9    | Navigation           | Sidebar, BidCard                 | Add to nav, link to detail                |
| 10   | Debug Logging        | All actions/components           | Consistent, contextual logs               |

---

## **Ready for Development**

- All steps are broken down by file/component.
- All constraints, logging, and UI guidelines are explicit.
- No ambiguity for devs; follow this doc to implement AI Bid Management in GenHub PWA.