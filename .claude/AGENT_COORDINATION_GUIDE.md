# Agent Coordination Guide

**Quick reference for the new optimized agent coordination system.**

---

## For Orchestrator Agent

When delegating to other agents, always pass `ORCHESTRATED=true`:

```typescript
Task(
  subagent_type="backend-engineer",
  prompt="""
  ... implementation details ...

  ORCHESTRATED=true (skip build/sync, return status only)
  """
)
```

### Expected Return Format

```
Status: ✓ completed | ✗ failed
Files: [list of files modified]
Issues: [CRITICAL issues if any found]
Actions: app/actions/feature.ts with functions: [list]
Types: Import from types/db/{domain}.ts (e.g., types/db/task.ts, types/db/expense.ts)
```

### Orchestrator Responsibilities

1. **Phase A (Backend)**: Delegate with `ORCHESTRATED=true`
2. **Phase B (Frontend)**: Delegate with `ORCHESTRATED=true`
3. **Phase C (Review)**: Delegate with context note
4. **Phase D (Build+Sync)**: RUN ONCE at orchestrator level
   - `/kc:sync-docs` (comprehensive)
   - `/kc:build` (final validation)

---

## For Frontend-Engineer

### Execution Context Check

```
if (ORCHESTRATED=true) {
  ✓ Create components/pages
  ✓ Run CRITICAL checks only (5 items)
  ✓ Return status + files + issues
  ✗ Skip: /kc:build, /kc:sync-docs
} else {
  ✓ Create components/pages
  ✓ Run ALL checks (12 items)
  ✓ /kc:sync-docs
  ✓ /kc:build
}
```

### CRITICAL Checks (When ORCHESTRATED)

- [ ] No Supabase imports in 'use client' files
- [ ] No fetch() in client components
- [ ] Mobile-first responsive (test at 375px)
- [ ] BaseModal for all modals (not Dialog)
- [ ] No `any` types

### Full Checks (When Independent)

- [ ] All CRITICAL checks
- [ ] TypeScript strict (no `any` types)
- [ ] Touch targets minimum 44px
- [ ] Design system colors used (not custom)
- [ ] Lucide icons only (not custom SVG)
- [ ] Error states handled
- [ ] Loading states (isPending) handled
- [ ] `/kc:build` passed

---

## For Backend-Engineer

### Execution Context Check

```
if (ORCHESTRATED=true) {
  ✓ Create migrations/Server Actions
  ✓ Run CRITICAL checks only (7 items)
  ✓ Generate types ONCE (if schema changed)
  ✓ Return status + files + issues
  ✗ Skip: /kc:build, /kc:sync-docs
} else {
  ✓ Create migrations/Server Actions
  ✓ Run ALL checks (13 items)
  ✓ /kc:sync-docs
  ✓ /kc:build
}
```

### CRITICAL Checks (When ORCHESTRATED)

- [ ] MCP Supabase used (not psql/CLI)
- [ ] RLS enabled on all new tables
- [ ] RLS policies created (at minimum company_access)
- [ ] Foreign keys have ON DELETE behavior
- [ ] Server Actions have error handling
- [ ] No client component modifications
- [ ] No custom colors/styles

### Full Checks (When Independent)

- [ ] All CRITICAL checks
- [ ] Indexes on company_id and all FKs
- [ ] TypeScript types regenerated
- [ ] Server Actions have Zod validation
- [ ] Server Actions call revalidatePath
- [ ] Security advisors checked (no critical issues)
- [ ] Migration saved to supabase/migrations/
- [ ] `/kc:build` passed

---

## For Code-Reviewer

### Phase 0: Determine Review Scope

**Question: Is this post-orchestrator execution?**

```
if (post-orchestrator) {
  Scope: architecture, integration, acceptance criteria
  Violation scan: SKIP (agents did CRITICAL already)
  Tests: Full (tsc, lint, build? wait for orchestrator)
} else {
  Scope: All violations + logic + security
  Violation scan: FULL (CRITICAL, HIGH, MEDIUM)
  Tests: Full (tsc, lint, build)
}
```

### Post-Orchestrator Review Focus

When reviewing after backend + frontend agents:

✓ Agents already validated:
  - No Supabase in client components
  - RLS policies on tables
  - Error handling in actions
  - Design system colors/icons

✓ Your focus:
  - All acceptance criteria met
  - Backend & frontend work together
  - Server Actions properly used
  - Types match between backend/frontend
  - No cross-boundary type errors
  - Mobile responsive
  - Code quality consistent with GenHub

✗ Skip:
  - Violation scans (agents ran them)
  - Build verification (orchestrator does it)

---

## Decision Tree: When to Use What

### I'm implementing a new feature with both backend + frontend

→ Use **orchestrator** with `ORCHESTRATED=true` for both agents
→ Orchestrator runs single build + sync at end
→ Result: Fast, efficient, no redundancy

### I'm adding a new Server Action only

→ Call **backend-engineer** directly (no flag)
→ Agent runs full workflow including build + sync
→ Result: Independent agent does full job

### I'm creating a new page/component only

→ Call **frontend-engineer** directly (no flag)
→ Agent runs full workflow including build + sync
→ Result: Independent agent does full job

### I need to review code after implementation

→ Call **code-reviewer** and describe context
→ If post-orchestrator: phase 0 detects it, skips duplicate checks
→ If standalone: runs full checks as before
→ Result: Smart review based on context

---

## Common Workflows

### Workflow 1: Feature Needs Backend + Frontend (Use Orchestrator)

```
Task(subagent_type="orchestrator", prompt="""
Implement feature per spec at .claude/tasks/features/X/spec.md

ORCHESTRATED=true
Backend phase: server actions + migration
Frontend phase: components + pages
Review phase: integration test
Build phase: final build + sync (Phase D)
""")
```

**Result:** Backend → Frontend → Review → 1 Build → Done ✓

### Workflow 2: Just Add Server Action (Use Backend Direct)

```
Task(subagent_type="backend-engineer", prompt="""
Create Server Action for user authentication
No flag needed (independent mode)
""")
```

**Result:** Backend → Build + Sync → Done ✓

### Workflow 3: Just Add Component (Use Frontend Direct)

```
Task(subagent_type="frontend-engineer", prompt="""
Create TaskCard component
No flag needed (independent mode)
""")
```

**Result:** Frontend → Build + Sync → Done ✓

### Workflow 4: Fix Bugs (Use Code-Reviewer)

```
Task(subagent_type="code-reviewer", prompt="""
Review recent changes and fix bugs
Phase 0 auto-detects context
""")
```

**Result:** Context-aware review + fixes ✓

---

## Key Differences: Before vs After

| Aspect | Before | After |
|--------|--------|-------|
| Backend build | ✓ Run | ✗ Skip (orchestrated) |
| Frontend build | ✓ Run | ✗ Skip (orchestrated) |
| Final build | ✓ Run | ✓ Run once |
| Sync calls | 2-3x | 1x |
| Type regen | 3-5x | 1x |
| Violation scan | By reviewer | By agents + reviewer (post-check) |
| Time per feature | ~140s | ~45s |
| Token efficiency | Lower | Higher |

---

## Return Value Expectations

### When ORCHESTRATED=true (Orchestrated Mode)

Agent returns SHORT status:

```
Status: ✓ completed
Files: app/actions/tasks.ts, components/TaskCard.tsx
Issues: None
Types: Task, CreateTaskInput
Actions: createTask, getTasks, updateTask, deleteTask
```

### When Independent Mode (No Flag)

Agent returns FULL output:

```
Status: ✓ completed
Files: app/actions/tasks.ts, components/TaskCard.tsx
Build: ✓ passed
Sync: ✓ updated tables.md, actions.md, components.md
Issues: None
Types: Regenerated
Documentation: Updated
```

---

## Troubleshooting

### "Agent is running build even though ORCHESTRATED=true"

→ Agent didn't detect the flag
→ Check: Is `ORCHESTRATED=true` in the prompt?
→ Verify agent's EXECUTION PROTOCOL section checks for it

### "Build is failing with type errors"

→ Types weren't regenerated at the right time
→ In ORCHESTRATED mode: backend generates types once
→ Check: Did backend run `npx supabase gen types typescript...`?

### "Documentation isn't updated"

→ Agent skipped sync in ORCHESTRATED mode (correct)
→ Orchestrator should run `/kc:sync-docs` in Phase D
→ Check: Did orchestrator complete Phase D?

### "Duplicate violation checks happening"

→ Orchestrator likely called code-reviewer directly without context
→ Add context note to reviewer: "Post-implementation review"
→ Reviewer's Phase 0 will detect and skip duplicates

---

## Best Practices

### DO

✓ Use orchestrator for multi-agent features
✓ Pass `ORCHESTRATED=true` when delegating
✓ Let orchestrator run single final build
✓ Call direct agents for single-agent work
✓ Include context note for code-reviewer
✓ Check agent's EXECUTION PROTOCOL for mode detection

### DON'T

✗ Call individual agents with `ORCHESTRATED=true` then run build again manually
✗ Skip Phase D build (orchestrator needs to run it once)
✗ Run `/kc:sync-docs` from individual agents if orchestrator will do it
✗ Call orchestrator for single-agent work (less efficient)
✗ Forget to pass `ORCHESTRATED=true` when delegating

---

## Quick Reference Card

```
┌─────────────────────────────────────────────────┐
│ ORCHESTRATOR WORKFLOW (Optimized)               │
├─────────────────────────────────────────────────┤
│ Phase A: Backend-Engineer                       │
│   ✓ ORCHESTRATED=true                           │
│   ✓ Migrations + Server Actions + CRITICAL      │
│   ✗ No build                                    │
│   ✗ No sync                                     │
│                                                 │
│ Phase B: Frontend-Engineer                      │
│   ✓ ORCHESTRATED=true                           │
│   ✓ Components + Pages + CRITICAL               │
│   ✗ No build                                    │
│   ✗ No sync                                     │
│                                                 │
│ Phase C: Code-Reviewer                          │
│   ✓ Context: post-orchestrator                  │
│   ✓ Integration + acceptance focus              │
│   ✗ No violation scans (skip duplicate)         │
│                                                 │
│ Phase D: Orchestrator (Consolidated)            │
│   ✓ /kc:sync-docs (ONE comprehensive)           │
│   ✓ /kc:build (ONE final)                       │
│   ✓ Report: Ready for merge                     │
└─────────────────────────────────────────────────┘
```

---

## See Also

- `.claude/CLAUDE.md` — Orchestration signals definition
- `.claude/agents/frontend-engineer.md` — Frontend execution protocol
- `.claude/agents/backend-engineer.md` — Backend execution protocol
- `.claude/agents/code-reviewer.md` — Code review workflow
- `.claude/agents/orchestrator.md` — Orchestrator phases
- `.claude/OPTIMIZATION_IMPLEMENTATION.md` — Full technical details
