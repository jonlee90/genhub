# Audit Implementation Protocol

> Prevents breaking working code when implementing audit findings

---

## CRITICAL RULE: Verify Before Implementing

**NEVER implement audit findings without verification.** Audit reports can be:
- Outdated (run on old code versions)
- Incorrect (auditor misread the code)
- Missing context (why code was designed that way)

---

## Step-by-Step Protocol

### 1. Read Audit Finding
- Note the file path and line numbers
- Understand the claimed problem
- Note the proposed fix

### 2. Verify Against Actual Code ✅ REQUIRED
```bash
# Read the actual file section mentioned
# Compare with audit's description
# Check git history if needed
git log -p --follow <file> | grep -A 10 -B 10 "<pattern>"
```

**Questions to ask:**
- Does the code actually match the audit description?
- When was this code last modified?
- Is there a comment explaining why it's structured this way?

### 3. Check Database Schema (for FK/JOIN changes)
```typescript
// Before adding JOINs, verify FK exists:
// 1. Use Supabase MCP to list tables
// 2. Check foreign key relationships
// 3. Test the JOIN syntax in a separate query first
```

**For Supabase JOINs:**
- ✅ Test: `assignee:user_profiles!tasks_assignee_id_fkey (...)` in isolation
- ✅ Verify: FK relationship exists in schema
- ❌ Never assume: Just because column names match doesn't mean FK exists

### 4. Implement Incrementally with Verification

**Pattern:**
1. Make ONE change at a time
2. Verify build passes: `npm run build`
3. Start dev server: `npm run dev`
4. Test the affected page/functionality
5. Check browser console for errors
6. Only then move to next change

**Red Flags:**
- Audit says "remove redundant code" → Verify it's actually redundant
- Audit says "add JOIN" → Verify FK exists
- Audit says "this is slow" → Benchmark before and after
- Audit says "N+1 query" → Trace the actual queries being run

### 5. Git Commit Per Logical Change

```bash
# Good: One fix per commit
git commit -m "HIGH-001: Remove redundant assignee fetch"

# Bad: All fixes in one commit
git commit -m "Implement all audit fixes"
```

**Why:** Easy to revert specific changes if they break something

### 6. Verification Checklist

**Before Marking Fix Complete:**
- [ ] Read actual code, confirmed audit description is accurate
- [ ] Build passes: `npm run build`
- [ ] Dev server starts: `npm run dev`
- [ ] Affected pages load without errors
- [ ] Browser console shows no new errors
- [ ] Database queries return expected data (check logs)
- [ ] Original functionality still works

---

## Common Audit Mistakes

### 1. Outdated Information
**Symptom:** Audit references line numbers that don't match current code
**Fix:** Check git blame to see when code changed

### 2. Incorrect Assumptions
**Symptom:** "Code already has X" but actually doesn't
**Fix:** Read the actual file, don't trust descriptions

### 3. Missing Context
**Symptom:** "This is redundant" but there's a good reason for it
**Fix:** Check git history, comments, related issues

### 4. Schema Mismatches
**Symptom:** "Add this JOIN" but FK doesn't exist in database
**Fix:** Verify schema with Supabase MCP before adding JOINs

---

## Emergency Rollback

If a fix breaks functionality:

```bash
# 1. Identify the breaking commit
git log --oneline

# 2. Revert specific commit
git revert <commit-hash>

# 3. Or reset to before changes (if not pushed)
git reset --hard HEAD~1

# 4. Document what went wrong
# Update audit plan with "INVALID FINDING" note
```

---

## Template: Verification Report

Before implementing each audit fix:

```markdown
## Fix Verification: HIGH-XXX

**Audit Claim:**
> [Copy exact claim from audit]

**Actual Code (current):**
```typescript
// Paste actual code from current version
```

**Verification:**
- [ ] Code matches audit description: YES/NO
- [ ] Foreign keys verified (if applicable): YES/NO/N/A
- [ ] Similar pattern exists elsewhere: YES/NO
- [ ] Original code has comments explaining design: YES/NO

**Decision:**
- [ ] Implement as described
- [ ] Modify approach because: [reason]
- [ ] Skip because: [reason]

**Test Plan:**
1. [Specific test step]
2. [Expected result]
```

---

## Delegation to Agents

When using Task tool for audit fixes:

**Bad Prompt:**
```
Implement HIGH-001 from audit plan
```

**Good Prompt:**
```
BEFORE implementing HIGH-001:
1. Read lib/tasks.ts lines 158-182
2. Verify the audit's claim that assignee JOIN already exists
3. If JOIN exists, remove redundant fetch
4. If JOIN doesn't exist, report back before making changes

Only implement if verification confirms audit is correct.
```

---

## Success Criteria

A fix is only complete when:
1. ✅ Audit claim verified against actual code
2. ✅ Build passes
3. ✅ Functionality tested and works
4. ✅ No new errors in console
5. ✅ Performance improvement measured (if performance fix)
6. ✅ Committed with clear message

**Remember:** Preventing breakage is more important than speed.
