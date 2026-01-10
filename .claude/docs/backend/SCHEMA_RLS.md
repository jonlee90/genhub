# GenHub - RLS Patterns

> Row Level Security patterns and helper functions.

---

## Helper Functions

### next_auth.uid()
Returns current user's UUID from JWT.
```sql
SELECT next_auth.uid();  -- Returns logged-in user's ID
```

### get_user_company_id(user_id)
Returns the company ID for a user.
```sql
SELECT get_user_company_id(next_auth.uid());  -- Returns user's company
```

### is_user_gc_admin(user_id)
Checks if user is a GC Admin.
```sql
SELECT is_user_gc_admin(next_auth.uid());  -- Returns true/false
```

---

## Standard RLS Patterns

### Company-Scoped Access

Most common pattern - users can only access their company's data:

```sql
-- SELECT: Company members can view
CREATE POLICY "table_select" ON public.table_name
FOR SELECT USING (
  company_id = get_user_company_id(next_auth.uid())
);

-- INSERT: Company members can create
CREATE POLICY "table_insert" ON public.table_name
FOR INSERT WITH CHECK (
  company_id = get_user_company_id(next_auth.uid())
);

-- UPDATE: Same company
CREATE POLICY "table_update" ON public.table_name
FOR UPDATE USING (
  company_id = get_user_company_id(next_auth.uid())
);

-- DELETE: Admin or owner only
CREATE POLICY "table_delete" ON public.table_name
FOR DELETE USING (
  company_id = get_user_company_id(next_auth.uid())
  AND (
    created_by = next_auth.uid()
    OR is_user_gc_admin(next_auth.uid())
  )
);
```

### Project-Scoped Access

For project-specific data:

```sql
CREATE POLICY "project_data_select" ON public.table_name
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.project_team
    WHERE project_id = table_name.project_id
    AND user_id = next_auth.uid()
  )
);
```

### User-Scoped Access

For personal data (notifications, settings):

```sql
CREATE POLICY "user_data_select" ON public.notifications
FOR SELECT USING (user_id = next_auth.uid());

CREATE POLICY "user_data_update" ON public.notifications
FOR UPDATE USING (user_id = next_auth.uid());
```

### Role-Based Access

For actions restricted to certain roles:

```sql
-- Only GC Admin can manage
CREATE POLICY "admin_only_manage" ON public.company_settings
FOR ALL USING (
  is_user_gc_admin(next_auth.uid())
);

-- GC Admin or Project Manager
CREATE POLICY "managers_manage" ON public.projects
FOR UPDATE USING (
  company_id = get_user_company_id(next_auth.uid())
  AND EXISTS (
    SELECT 1 FROM public.company_users
    WHERE user_id = next_auth.uid()
    AND role IN ('gc_admin', 'project_manager')
    AND status = 'active'
  )
);
```

---

## Soft Delete Pattern

For tables with `deleted_at`:

```sql
CREATE POLICY "soft_delete_select" ON public.table_name
FOR SELECT USING (
  company_id = get_user_company_id(next_auth.uid())
  AND deleted_at IS NULL
);
```

---

## Append-Only Tables

For audit logs (no UPDATE/DELETE):

```sql
-- Only SELECT policy
CREATE POLICY "audit_select" ON public.file_audit_log
FOR SELECT USING (
  company_id = get_user_company_id(next_auth.uid())
);

-- INSERT via service role only (triggers)
-- No UPDATE or DELETE policies
```

---

## Participant-Based Access

For chat rooms:

```sql
CREATE POLICY "chat_room_access" ON public.messages
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.chat_participants
    WHERE chat_room_id = messages.chat_room_id
    AND user_id = next_auth.uid()
  )
);
```

---

## Cross-Schema Limitation

Tables with FKs to `next_auth.users` cannot use PostgREST auto-join:

```typescript
// ❌ WRONG - "Could not find relationship" error
.from('project_files')
.select(`*, uploader:uploaded_by (id, name)`)

// ✅ CORRECT - Fetch user separately
.from('project_files')
.select('*')
// Then join user_profiles manually
```

**Affected tables**: project_files, project_photos, spatial_markers, marker_content

---

## RLS Bypass in Server Actions

Server client (`createClient()`) bypasses RLS. Always verify manually:

```typescript
async function getProjectData(projectId: string) {
  const ctx = await getUserContext();
  if ('error' in ctx) return ctx;

  // Verify project belongs to user's company
  const { data: project } = await ctx.supabase
    .from('projects')
    .select('company_id')
    .eq('id', projectId)
    .single();

  if (project?.company_id !== ctx.companyId) {
    return { error: 'Insufficient permissions' };
  }

  // Now safe to query project data
  return ctx.supabase.from('tasks').select('*').eq('project_id', projectId);
}
```

---

## Testing RLS

```sql
-- Test as specific user
SET request.jwt.claims = '{"sub": "user-uuid-here"}';
SELECT * FROM table_name;  -- Should only return authorized rows
RESET request.jwt.claims;
```

---

## Security Checklist

- [ ] All tables have RLS enabled
- [ ] SELECT policy exists for all tables
- [ ] INSERT checks company ownership
- [ ] UPDATE/DELETE restricted appropriately
- [ ] Server Actions verify company ownership
- [ ] Soft delete tables filter deleted_at

---

## See Also

- Core schema: `backend/SCHEMA_CORE.md`
- Server Actions: `backend/SERVER_ACTIONS.md`
- Core rules: `core/RULES.md`
