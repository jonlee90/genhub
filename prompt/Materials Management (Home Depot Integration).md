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

# GenHub Materials Management (Home Depot Integration)  
**Implementation Guide**

---

## Task  
Implement the Materials Management feature at `/app/materials` with Home Depot product search, add-to-task, receipt upload (AI OCR), and project-wide material tracking.  
All UI must use aceternity/ui, Tailwind variable colors, and Lucide icons.  
**All data fetching/mutations must use Supabase with auth/RLS as per template.**  
**Debug logs must be added at every data operation and integration point.**

---

## Implementation Steps

### 1. **Database Preparation**

#### a. **Tables**
- Ensure the following tables exist in Supabase (add columns if missing):

```sql
-- materials table
create table material (
  id identity primary key,
  name text not null,
  sku text,
  price numeric,
  stock integer,
  image_url text,
  assigned_task integer references task(id),
  status text, -- e.g. 'pending', 'ordered', 'received', 'used'
  user_id uuid not null default next_auth.uid(),
  created_at timestamp with time zone default now()
);

-- receipts table
create table receipt (
  id identity primary key,
  image_url text not null,
  matched_materials jsonb, -- [{material_id, qty, price}]
  total_cost numeric,
  user_id uuid not null default next_auth.uid(),
  created_at timestamp with time zone default now()
);
```

#### b. **RLS**
- Ensure RLS policies allow users to read/write only their own materials/receipts.

---

### 2. **Supabase Client Usage**

- **Frontend:** Use `/utils/supabase/client.ts` for all user data operations.
- **Server Actions:** Use `/utils/supabase/server.ts` for admin-level or webhook operations.

**Example for fetching materials:**
```typescript
import { getSupabaseClient } from '@/utils/supabase/client';
const supabase = await getSupabaseClient();
const { data, error } = await supabase.from('material').select().eq('user_id', userId);
if (error) {
  console.log('[MATERIALS][FETCH][ERROR]', error);
} else {
  console.log('[MATERIALS][FETCH][SUCCESS]', data);
}
```

---

### 3. **UI Structure & Components**

#### a. **Page Route**
- `/app/materials/page.tsx`  
  - Main entry for Materials Management.

#### b. **Components (in `components/materials/`)**
- `MaterialSearch.tsx` – Home Depot search bar + results grid.
- `MaterialCard.tsx` – Card for each material (image, name, price, stock, add-to-task).
- `AddToTaskModal.tsx` – Modal to assign material to a task.
- `ReceiptUpload.tsx` – Dropzone for receipt image upload, triggers AI OCR.
- `MaterialTable.tsx` – Table of all project materials, with filters.
- `MaterialDashboard.tsx` – Summary stats (total cost, # items, etc).

#### c. **Styling**
- Use aceternity/ui components: `Input`, `Card`, `Button`, `Table`, `Dialog`, `Dropzone`, `Badge`, `Tabs`.
- Use Tailwind variable colors: e.g. `bg-primary`, `text-primary-foreground`.
- Use Lucide icons: e.g. `Package`, `Search`, `PlusCircle`, `ReceiptText`, `CheckCircle`, `AlertCircle`.

#### d. **Responsiveness**
- Grid/list layouts must collapse to single column on mobile.
- Modals/dialogs must be mobile-friendly.

---

### 4. **Home Depot Product Search Integration**

#### a. **Integration Helper**
- Use `/utils/homeDepot.ts` for Home Depot API logic.
- **DO NOT** call Home Depot API directly in components.
- Add debug logs for all API calls:
  - `[HOMEDEPOT][SEARCH][QUERY]`, `[HOMEDEPOT][SEARCH][SUCCESS]`, `[HOMEDEPOT][SEARCH][ERROR]`

#### b. **Search Flow**
- User enters search term in `MaterialSearch.tsx`.
- On submit, call helper to fetch products.
- Show loading state, then display results as `MaterialCard` grid.
- Each card: image, name, price, stock, "Add to Task" button.

#### c. **Example Debug Logging**
```typescript
console.log('[HOMEDEPOT][SEARCH][QUERY]', searchTerm);
// After fetch:
if (error) {
  console.log('[HOMEDEPOT][SEARCH][ERROR]', error);
} else {
  console.log('[HOMEDEPOT][SEARCH][SUCCESS]', results);
}
```

---

### 5. **Add Material to Task**

#### a. **AddToTaskModal**
- Opens when user clicks "Add to Task" on a material.
- Shows dropdown of user’s tasks (fetch from Supabase).
- User selects task, quantity.
- On confirm:
  - Insert new row in `material` table with task assignment.
  - Add debug logs: `[MATERIALS][ADD][START]`, `[MATERIALS][ADD][SUCCESS]`, `[MATERIALS][ADD][ERROR]`

#### b. **Example**
```typescript
console.log('[MATERIALS][ADD][START]', { material, taskId, qty });
const { data, error } = await supabase.from('material').insert({...});
if (error) {
  console.log('[MATERIALS][ADD][ERROR]', error);
} else {
  console.log('[MATERIALS][ADD][SUCCESS]', data);
}
```

---

### 6. **Receipt Upload & AI OCR**

#### a. **ReceiptUpload Component**
- Use aceternity/ui `Dropzone` for image upload.
- On upload:
  - Store image in Supabase Storage (bucket: `receipts/`).
  - Call AI OCR helper (`/utils/ai.ts`) to extract material info.
  - Insert new row in `receipt` table with matched materials.
  - Add debug logs: `[RECEIPT][UPLOAD][START]`, `[RECEIPT][UPLOAD][SUCCESS]`, `[RECEIPT][UPLOAD][ERROR]`, `[RECEIPT][OCR][START]`, `[RECEIPT][OCR][SUCCESS]`, `[RECEIPT][OCR][ERROR]`

#### b. **Example**
```typescript
console.log('[RECEIPT][UPLOAD][START]', file.name);
// After upload:
if (error) {
  console.log('[RECEIPT][UPLOAD][ERROR]', error);
} else {
  console.log('[RECEIPT][UPLOAD][SUCCESS]', imageUrl);
  console.log('[RECEIPT][OCR][START]', imageUrl);
  // After OCR:
  if (ocrError) {
    console.log('[RECEIPT][OCR][ERROR]', ocrError);
  } else {
    console.log('[RECEIPT][OCR][SUCCESS]', ocrData);
  }
}
```

---

### 7. **Materials Dashboard & Table**

#### a. **MaterialDashboard**
- Show summary stats: total materials, total cost, # assigned to tasks, # received/used.
- Fetch from Supabase, add debug logs: `[MATERIALS][DASHBOARD][FETCH][START/SUCCESS/ERROR]`

#### b. **MaterialTable**
- List all materials for user/project.
- Columns: name, SKU, price, status, assigned task, actions.
- Filters: status, assigned/unassigned, cost range.
- Use aceternity/ui `Table`, `Badge`, `Button`.

---

### 8. **State Management**

- Use React state/hooks for UI state (search term, modal open, etc).
- Use SWR or React Query (if already in project) for data fetching/caching.
- All data must be fetched via Supabase client with user’s auth token.

---

### 9. **Debug Logging**

- **MANDATORY:**  
  - Every data fetch, mutation, or integration (Home Depot, AI OCR, Supabase) must have a `console.log` with a clear tag and relevant data/error.
  - This enables users/devs to track what worked vs what didn’t.

---

### 10. **Permissions & Auth**

- All `/app/materials` pages/components must check user session (from next-auth).
- If not authenticated, redirect to sign-in (handled by middleware).
- All Supabase queries must use the user’s access token.

---

### 11. **Example UI Flow**

1. User visits `/app/materials`.
2. Sees search bar, dashboard stats, and material table.
3. Searches for "drywall" → Home Depot results appear as cards.
4. Clicks "Add to Task" → modal opens, selects task/qty, confirms.
5. Material is added to their project, table updates.
6. Uploads a Home Depot receipt → AI OCR matches items, adds to dashboard/table.
7. All actions are logged in console for debugging.

---

## Constraints & Guidelines

- **All UI:** aceternity/ui, Tailwind variable colors, Lucide icons.
- **No direct Home Depot API calls in UI:** Use helper in `/utils/homeDepot.ts`.
- **All Supabase operations:** Use correct client with user’s token.
- **Debug logs:** Required for every data/integration step.
- **Responsive:** All layouts/components must be mobile-friendly.
- **No hardcoded demo data:** Use real Supabase data or Home Depot API.

---

## File/Folder Checklist

- `app/app/materials/page.tsx` – main page
- `components/materials/MaterialSearch.tsx`
- `components/materials/MaterialCard.tsx`
- `components/materials/AddToTaskModal.tsx`
- `components/materials/ReceiptUpload.tsx`
- `components/materials/MaterialTable.tsx`
- `components/materials/MaterialDashboard.tsx`
- `utils/homeDepot.ts` – Home Depot API helper
- `utils/ai.ts` – AI OCR helper
- Supabase table/column updates as above

---

**Ready for implementation.**  
Follow the above steps and constraints for a robust, beautiful, and debuggable Materials Management feature.