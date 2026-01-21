# RLS Security Audit Findings

**Date:** 2026-01-20
**Auditor:** Backend Engineer Agent
**Scope:** All Supabase RLS policies and security configurations

## Executive Summary

| Metric | Value |
|--------|-------|
| Total Tables | 44 |
| Tables with RLS Enabled | 44 (100%) |
| Tables without ANY RLS Policies | 0 |
| Critical Issues (P0) | 3 |
| High Priority Issues (P1) | 5 |
| Medium Issues (P2) | 3 |
| Security Advisor Warnings | 3 |

**Overall Assessment:** GOOD - All tables have RLS enabled. Critical issues primarily related to overly permissive policies and function security.

---

## CRITICAL ISSUES (P0)

### 1. Overly Permissive Policies with `true` Conditions

**Risk:** Bypass of all security checks, allowing unrestricted access

#### Tables Affected:
- `attachments` - SELECT policy: "Users can view attachments" with `qual: true`
- `default_marker_configs` - SELECT policy: "default_marker_configs_select" with `qual: true`
- `stripe_customers` - ALL operations policy: "stripe_customers_service_role" with `qual: true` and `with_check: true`

**Impact:**
- **attachments**: ANY authenticated user can view ALL attachments across ALL companies (major data leak)
- **default_marker_configs**: Acceptable (read-only default data)
- **stripe_customers**: Acceptable IF service role only, but policy is named incorrectly

**Recommendation:**
```sql
-- FIX: attachments table
DROP POLICY "Users can view attachments" ON public.attachments;
CREATE POLICY "Users can view company attachments" ON public.attachments
  FOR SELECT TO authenticated
  USING (
    -- Verify attachment belongs to user's company via entity relationship
    EXISTS (
      SELECT 1 FROM projects p
      WHERE p.id = attachments.entity_id
        AND p.company_id = get_user_company_id(next_auth.uid())
    )
    OR EXISTS (
      SELECT 1 FROM tasks t
      JOIN projects p ON p.id = t.project_id
      WHERE t.id = attachments.entity_id
        AND p.company_id = get_user_company_id(next_auth.uid())
    )
    OR uploaded_by = next_auth.uid()
  );
```

### 2. Company Isolation Violations

**Risk:** Cross-tenant data leakage

#### Vulnerable Tables Missing Company Context:
- `task_dependencies` - Uses only `task_id` check, doesn't verify company isolation directly
- `task_activity` - Uses only `task_id` check, relies on JOIN to tasks

**Analysis:**
These tables use indirect company checks via task → project → company joins. While technically secure, they are vulnerable if:
1. Foreign key constraints are dropped
2. Task IDs are compromised
3. Complex query optimization bypasses checks

**Recommendation:**
Add explicit company_id columns to these tables for defense-in-depth:
```sql
ALTER TABLE task_dependencies ADD COLUMN company_id UUID REFERENCES companies(id);
ALTER TABLE task_activity ADD COLUMN company_id UUID REFERENCES companies(id);

-- Update policies to use direct company_id checks
```

### 3. Function Search Path Vulnerabilities (Security Advisor)

**Risk:** SQL injection via search_path manipulation

**Affected Functions:**
- `public.get_project_team_cost_summary`
- `public.get_task_analytics`

**Recommendation:**
```sql
ALTER FUNCTION public.get_project_team_cost_summary
  SET search_path TO public, pg_temp;

ALTER FUNCTION public.get_task_analytics
  SET search_path TO public, pg_temp;
```

---

## HIGH PRIORITY ISSUES (P1)

### 4. Duplicate SELECT Policies

**Risk:** Policy conflict, maintenance burden, unclear precedence

#### Tables Affected:
- `companies` - Has both "companies_select" and "Authenticated users can create companies"
- `company_users` - Has both "Users can view company members" and "company_users_select"
- `projects` - Has both "Users can view company projects" and "projects_select"
- `user_profiles` - Has "user_profiles_select" with complex OR conditions

**Recommendation:**
Consolidate to single SELECT policy per table. The `*_select` policies appear to be newer and include owner access.

### 5. Missing RLS on Materialized View (Security Advisor)

**Table:** `mv_dashboard_kpis`
**Risk:** Materialized view is accessible via API without RLS

**Recommendation:**
```sql
ALTER MATERIALIZED VIEW mv_dashboard_kpis ENABLE ROW LEVEL SECURITY;

CREATE POLICY "company_dashboard_access" ON mv_dashboard_kpis
  FOR SELECT TO authenticated
  USING (company_id = get_user_company_id(next_auth.uid()));
```

### 6. Weak INSERT Policies on Critical Tables

**Tables:**
- `material_price_history` - INSERT policy has `with_check: false` (blocks all inserts)
- `notifications` - Allows inserting for ANY company member (potential spam vector)

**Recommendation:**
```sql
-- Fix material_price_history
DROP POLICY "material_price_history_insert" ON public.material_price_history;
CREATE POLICY "material_price_history_insert" ON public.material_price_history
  FOR INSERT TO authenticated
  WITH CHECK (company_id = get_user_company_id(next_auth.uid()));

-- Tighten notifications
DROP POLICY "users_can_notify_company_members" ON public.notifications;
CREATE POLICY "users_can_notify_company_members" ON public.notifications
  FOR INSERT TO authenticated
  WITH CHECK (
    user_id IN (
      SELECT cu.user_id FROM company_users cu
      WHERE cu.company_id = get_user_company_id(next_auth.uid())
        AND cu.status = 'active'
    )
    AND (
      -- Only admins or message senders can create notifications
      is_user_admin(next_auth.uid())
      OR EXISTS (
        SELECT 1 FROM messages m
        WHERE m.sender_id = next_auth.uid()
      )
    )
  );
```

### 7. Owner Bypass Too Permissive

**Risk:** Owner role has unrestricted access to sensitive data

**Tables with `is_user_owner()` bypass:**
- `companies` - Owner can view ALL companies
- `company_users` - Owner can view ALL company memberships
- `projects` - Owner can view ALL projects
- `user_profiles` - Owner can view ALL user profiles

**Recommendation:**
Audit owner role necessity. If required for support, add audit logging:
```sql
CREATE TABLE owner_access_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES user_profiles(id),
  table_name TEXT NOT NULL,
  record_id UUID NOT NULL,
  action TEXT NOT NULL,
  accessed_at TIMESTAMPTZ DEFAULT now()
);
```

### 8. Missing DELETE Policies

**Tables without explicit DELETE policies:**
- `notifications` - Users cannot delete their own notifications
- `messages` - Users cannot delete their own messages (only edit)

**Recommendation:**
```sql
CREATE POLICY "Users can delete their notifications" ON public.notifications
  FOR DELETE TO authenticated
  USING (user_id = next_auth.uid());

CREATE POLICY "Users can delete own messages within 24h" ON public.messages
  FOR DELETE TO authenticated
  USING (
    sender_id = next_auth.uid()
    AND created_at > now() - interval '24 hours'
  );
```

---

## MEDIUM ISSUES (P2)

### 9. Inconsistent Policy Naming

**Examples:**
- Mix of "company_access", "project_access", "task_project_access"
- Mix of "Users can..." vs "GC/PM can..." vs function-based names

**Recommendation:**
Standardize naming convention:
- `{table}_{operation}_{role}` (e.g., `tasks_select_company_members`)
- OR `{role}_{operation}_{scope}` (e.g., `company_members_select_tasks`)

### 10. Complex Nested EXISTS Queries

**Performance Risk:** Multiple nested EXISTS in policies can cause slow queries

**Tables Affected:**
- `chat_participants` - 3 levels of nesting
- `message_attachments` - 2 levels of nesting
- `marker_content` - 2 levels of nesting

**Recommendation:**
Consider denormalizing company_id to child tables for performance.

### 11. No Audit Trail for Policy Changes

**Risk:** Cannot track when RLS policies were added/modified

**Recommendation:**
Implement migration naming convention and maintain changelog:
```
supabase/migrations/YYYYMMDDHHMMSS_rls_policy_change_description.sql
```

---

## POSITIVE FINDINGS

1. **100% RLS Coverage** - All tables have RLS enabled
2. **Consistent auth.uid() Usage** - All policies use `next_auth.uid()` correctly
3. **Company Isolation Generally Sound** - Most policies properly filter by company_id
4. **Role-Based Access Control** - Good use of `is_user_admin()` and `is_user_owner()` helpers
5. **Granular Permissions** - Separate policies for SELECT/INSERT/UPDATE/DELETE
6. **Self-Service Constraints** - Users can only modify their own data (profiles, kakao connections, push subscriptions)

---

## RECOMMENDATIONS SUMMARY

### Immediate Actions (P0)
1. Fix `attachments` SELECT policy to enforce company isolation
2. Set search_path on vulnerable functions
3. Verify `stripe_customers` policy is service-role only

### Short-Term Actions (P1)
4. Consolidate duplicate SELECT policies
5. Add RLS to `mv_dashboard_kpis` materialized view
6. Fix `material_price_history` INSERT policy
7. Tighten `notifications` INSERT policy
8. Add audit logging for owner access
9. Add missing DELETE policies for user-owned data

### Long-Term Actions (P2)
10. Standardize policy naming across all tables
11. Denormalize company_id to child tables for performance
12. Implement policy change audit trail
13. Add explicit company_id columns to `task_dependencies` and `task_activity`

---

## Testing Recommendations

1. **Cross-Tenant Leak Test**: Create two companies, verify users cannot access each other's data
2. **Privilege Escalation Test**: Verify regular users cannot perform admin operations
3. **Owner Role Audit**: Review all owner access logs for suspicious activity
4. **Performance Test**: Benchmark queries on tables with complex nested EXISTS policies
5. **Negative Test**: Attempt to bypass RLS using direct SQL injection

---

## Compliance Notes

- **GDPR**: User can view and update own profile (Article 15, 16) ✓
- **GDPR**: Missing user can delete own data (Article 17) - Needs cascade DELETE policies
- **Multi-Tenancy**: Company isolation enforced on 42/44 tables (95%)
- **Principle of Least Privilege**: Generally followed, owner role too permissive

---

## Sign-Off

**Security Status:** CONDITIONAL PASS
**Blockers for Production:** Fix P0 issues #1, #2, #3
**Next Review:** After P0 fixes implemented
