# {Module Name} Audit Plan

**Date:** {YYYY-MM-DD}
**Scope:** {Full audit | Security only | Performance only | Quality only}
**Status:** {In Progress | Complete}

---

## Summary

Quick overview of audit findings.

---

## Files to Audit

### Core Files
| File | Type | Priority |
|------|------|----------|
| {file-path} | Server Component | HIGH |
| {file-path} | Data fetching | HIGH |

### Server Actions
| File | Issues Found |
|------|--------------|
| {file-path} | {issue-summary} |

### Components
| File | Type |
|------|------|
| {file-path} | Client Component |

---

## Audit Checklist by Priority

### CRITICAL - Security

#### 1. RLS Policy Verification
**Status:** {Verified | Issues Found}

**Tables affected:** {table-list}

**Verification SQL:**
```sql
SELECT relname, relrowsecurity FROM pg_class WHERE relname IN (...);
```

**Findings:**
- {finding}

**Action:**
- {action-item}

---

#### 2. Server Action Auth Checks
**Status:** {Verified | Issues Found}

**Files checked:** {file-list}

**Findings:**
- {finding}

**Action:**
- {action-item}

---

### HIGH - Performance

#### 3. N+1 Query Detection
**Status:** {No Issues | Issues Found}

**Files checked:** {file-list}

**Findings:**
- **File:** {file}:{line}
- **Current:** {description}
- **Fix:** {proposed-fix}

---

#### 4. Missing Database Indexes
**Status:** {Verified | Issues Found}

**Tables checked:** {table-list}

**Findings:**
- {finding}

**Action:**
- Create migration: {migration-name}

---

#### 5. Missing Suspense Boundaries
**Status:** {Verified | Issues Found}

**Files checked:** {file-list}

**Findings:**
- {finding}

**Action:**
- {action-item}

---

#### 6. Sequential Order Index Queries
**Status:** {No Issues | Issues Found}

**Files checked:** {file-list}

**Findings:**
- {finding}

**Action:**
- Create RPC: {function-name}

---

### MEDIUM - Code Quality

#### 7. Console.log in Production
**Status:** {Clean | Issues Found}

**Files checked:** {file-list}

**Findings:**
- {count} unguarded console.log statements

**Action:**
- Wrap in development checks

---

#### 8. Inconsistent Error Return Types
**Status:** {Consistent | Issues Found}

**Files checked:** {file-list}

**Findings:**
- {finding}

**Action:**
- Migrate to discriminated unions

---

#### 9. React Hook Dependency Violations
**Status:** {No Violations | Issues Found}

**Files checked:** {file-list}

**Findings:**
- {finding}

**Action:**
- Add missing dependencies

---

#### 10. Over-fetching / Under-fetching
**Status:** {Optimized | Issues Found}

**Files checked:** {file-list}

**Findings:**
- {finding}

**Action:**
- {action-item}

---

## Implementation Order

1. **CRITICAL:** {item}
2. **HIGH:** {item}
3. **HIGH:** {item}
4. **MEDIUM:** {item}

---

## Verification Steps

### Database
```sql
-- Verify RLS
SELECT tablename, policyname FROM pg_policies WHERE tablename IN (...);

-- Verify indexes
SELECT indexname, tablename FROM pg_indexes WHERE indexname LIKE '...';
```

### TypeScript
```bash
npx tsc --noEmit
npm run lint
```

### Runtime
- [ ] Load page - no console errors
- [ ] Test as admin
- [ ] Test as non-admin
- [ ] Test CRUD operations

---

## Files Modified

### Server Actions
- [ ] {file-path} - {change}

### Components
- [ ] {file-path} - {change}

### Database
- [ ] {migration-file}

### Types
- [ ] {file-path} - {change}

---

## Summary Statistics

- **Tasks completed:** {count}/{total}
- **Files modified:** {count}
- **Migrations applied:** {count}
- **Security issues found:** {count}
- **Performance improvements:** {description}
