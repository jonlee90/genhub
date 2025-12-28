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

# Implementation Guide: Team & Company Management

## Task
Implement the **Team & Company Management** feature for GenHub PWA, enabling admins to manage team members, roles, subcontractor profiles, and company settings.  
All UI must use aceternity/ui, Tailwind variable colors, and Lucide icons.  
Integrate with existing auth and Supabase user management.

---

## Implementation Steps

### 1. **Database Preparation**

- Ensure the following tables exist in Supabase (extend as needed):

```sql
-- users table (already exists via next_auth)
-- Add 'role' and 'status' columns if not present
alter table user add column if not exists role text default 'member';
alter table user add column if not exists status text default 'active';

-- subcontractors table
create table if not exists subcontractor (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  contact_email text,
  phone text,
  company_name text,
  performance_score integer,
  created_at timestamp with time zone default now()
);

-- company table
create table if not exists company (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  logo_url text,
  settings jsonb,
  created_at timestamp with time zone default now()
);
```

- **Debug log:**  
  - Log all schema changes and migrations in your migration scripts.
  - On app start, log a summary of the current schema for verification.

---

### 2. **API & Server Actions**

- **Location:** `app/actions/team.ts`, `app/api/team/`, `app/api/subcontractors/`, `app/api/company/`
- **Actions to implement:**
  - `getTeamMembers()`: Fetch all users for the current company.
  - `inviteTeamMember(email, role)`: Invite a new user (send invite email, create user with pending status).
  - `updateUserRole(userId, role)`: Change a user's role.
  - `updateUserStatus(userId, status)`: Activate/deactivate user.
  - `getSubcontractors()`, `addSubcontractor()`, `updateSubcontractor()`, `deleteSubcontractor()`
  - `getCompany()`, `updateCompanySettings()`

- **Supabase Usage Example:**
  ```typescript
  import { getSupabaseClient } from '@/utils/supabase/server';
  const supabase = await getSupabaseClient();
  const { data, error } = await supabase.from('user').select('id, name, email, role, status');
  if (error) {
    console.log('[Team] Error fetching users:', error);
  } else {
    console.log('[Team] Loaded users:', data.length);
  }
  ```

- **Debug log:**  
  - Log all API requests and responses (success/error) with context (e.g., `[Team]`, `[Subcontractor]`).
  - For mutations, log before and after state if possible.

---

### 3. **State Management**

- **Location:** `lib/hooks/useTeam.ts` (custom React hook)
- **State to manage:**
  - `teamMembers: User[]`
  - `subcontractors: Subcontractor[]`
  - `company: Company`
  - `loading`, `error` for each fetch/mutation

- **Debug log:**  
  - Log state transitions (loading, loaded, error) with context.
  - Example: `console.log('[useTeam] Fetching team members...')`

---

### 4. **UI Components**

#### a. **Team List Table**

- **Location:** `components/team/UserTable.tsx`
- **Requirements:**
  - Use aceternity/ui `Table` for listing users.
  - Columns: Avatar, Name, Email, Role (dropdown), Status (badge), Actions (edit, deactivate).
  - Role: aceternity/ui `Select` for inline role change.
  - Status: aceternity/ui `Badge` (e.g., bg-primary for active, bg-muted for inactive).
  - Actions: Lucide icons (edit, trash, more).
  - Responsive: Table collapses to cards on mobile.

- **Debug log:**  
  - On role/status change, log the user id, old value, new value, and API response.

#### b. **Invite Team Member Modal**

- **Location:** `components/team/InviteModal.tsx`
- **Requirements:**
  - aceternity/ui `Dialog` for modal.
  - Fields: Email (input), Role (select).
  - Submit button: aceternity/ui `Button` (bg-primary).
  - On submit: call `inviteTeamMember`, show loading state, error/success toast.

- **Debug log:**  
  - Log invite attempts and results.

#### c. **Subcontractor Profile Card/List**

- **Location:** `components/team/SubProfile.tsx`
- **Requirements:**
  - aceternity/ui `Card` for each subcontractor.
  - Fields: Name, Company, Contact, Performance (badge or progress bar).
  - Actions: Edit, Delete (Lucide icons).
  - Add/Edit: aceternity/ui `Dialog` with form.

- **Debug log:**  
  - Log all add/edit/delete actions with subcontractor id and API response.

#### d. **Company Settings Form**

- **Location:** `components/team/CompanySettings.tsx`
- **Requirements:**
  - aceternity/ui `Form` for company name, logo upload (aceternity/ui `FileInput`), integrations (checkboxes/switches).
  - Save button: aceternity/ui `Button`.
  - Show current logo (if any) with preview.
  - On save: call `updateCompanySettings`.

- **Debug log:**  
  - Log all settings changes and API responses.

---

### 5. **Page Implementation**

- **Location:** `app/app/team/page.tsx`
- **Layout:**
  - aceternity/ui `Tabs` for sections: "Team", "Subcontractors", "Company".
  - Each tab loads the relevant component.
  - "Invite" button in Team tab header.
  - Responsive: Tabs collapse to dropdown on mobile.

- **Debug log:**  
  - Log tab switches and initial data loads.

---

### 6. **Access Control**

- Only users with `role = 'admin'` can:
  - Invite team members
  - Change roles/status
  - Edit company settings
  - Add/edit/delete subcontractors

- **Enforce in UI and API.**
- **Debug log:**  
  - Log all access denied attempts with user id and attempted action.

---

### 7. **Styling & Responsiveness**

- Use only aceternity/ui components and Tailwind variable colors (e.g., `bg-primary`, `text-primary-foreground`).
- All tables, cards, forms, and dialogs must be fully responsive.
- Use Lucide icons for all actions and section headers.
- Ensure the UI is visually consistent and attractive.

---

### 8. **Example: Team Table Row**

```tsx
<TableRow>
  <TableCell>
    <Avatar src={user.avatar_url} />
  </TableCell>
  <TableCell>{user.name}</TableCell>
  <TableCell>{user.email}</TableCell>
  <TableCell>
    <Select value={user.role} onValueChange={handleRoleChange}>
      <SelectItem value="admin">Admin</SelectItem>
      <SelectItem value="member">Member</SelectItem>
      <SelectItem value="viewer">Viewer</SelectItem>
    </Select>
  </TableCell>
  <TableCell>
    <Badge variant={user.status === 'active' ? 'default' : 'secondary'}>
      {user.status}
    </Badge>
  </TableCell>
  <TableCell>
    <Button variant="ghost" size="icon" onClick={handleEdit}>
      <PencilIcon className="w-4 h-4" />
    </Button>
    <Button variant="ghost" size="icon" onClick={handleDeactivate}>
      <TrashIcon className="w-4 h-4" />
    </Button>
  </TableCell>
</TableRow>
```

---

## Debug Logging Summary

- **All API calls:** Log request, parameters, and response (success/error).
- **All state changes:** Log before/after state for team, subs, company.
- **All user actions:** Log who did what (user id, action, target).
- **All access control denials:** Log attempted action, user id, and reason.

---

## Constraints & Guidelines

- **Do not use any UI library except aceternity/ui and Lucide.**
- **Do not use indigo/blue colors unless specified.**
- **All code must be responsive and accessible.**
- **All data fetching/mutations must use Supabase with proper RLS/auth.**
- **No network requests outside Supabase.**
- **No dynamic imports.**
- **All debug logs must be clear, contextual, and actionable.**

---

## Deliverables

- `app/app/team/page.tsx` (main page, tabs)
- `components/team/UserTable.tsx` (team list)
- `components/team/InviteModal.tsx` (invite dialog)
- `components/team/SubProfile.tsx` (subcontractor card/list)
- `components/team/CompanySettings.tsx` (company form)
- `lib/hooks/useTeam.ts` (state management)
- `app/actions/team.ts` (server actions)
- Debug logging in all relevant places

---

**This guide leaves no ambiguity.  
Follow each step, use the provided structure, and ensure all debug logs are present for easy tracking.**