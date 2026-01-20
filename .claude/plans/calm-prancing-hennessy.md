# Frontend Engineer Agent Optimization Plan

## Research Summary

### Sources Consulted
- [Claude Code Best Practices (Anthropic)](https://www.anthropic.com/engineering/claude-code-best-practices)
- [Effective Context Engineering for AI Agents (Anthropic)](https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents)
- [Effective Harnesses for Long-Running Agents (Anthropic)](https://www.anthropic.com/engineering/effective-harnesses-for-long-running-agents)
- [ClaudeLog Agent Engineering](https://claudelog.com/mechanics/agent-engineering/)
- [Best AI Coding Agents 2026 (Faros AI)](https://www.faros.ai/blog/best-ai-coding-agents-2026)
- [2025's Radical Frontend AI Shift (The New Stack)](https://thenewstack.io/2025s-radical-frontend-ai-shift/)

### Key Insights from Research

1. **Agent Engineering Era**: We've evolved from Prompt Engineering → Context Engineering → Agent Engineering
2. **Structured Note-Taking**: Agents should use todo lists and progress files for complex tasks
3. **Sub-Agent Delegation**: Complex problems benefit from spawning focused sub-agents
4. **Progressive Tool Access**: Don't overwhelm with all tools upfront
5. **Thinking Triggers**: Use "think" or "think harder" for extended reasoning on complex decisions
6. **Iterative Verification**: Provide concrete targets (tests, screenshots) for validation
7. **TypeScript Priority**: AI assistants work better with strongly-typed code

---

## Current State Analysis

### Strengths of Current `frontend-engineer.md`
- Clear authority boundaries (UI only, no database)
- Mobile-first emphasis (critical for construction PWA)
- Good code patterns with examples
- Violation scan for critical rules
- Tiered context loading

### Weaknesses Identified
1. **No explicit MCP session workflow** - Doesn't align with CLAUDE.md three-tool architecture
2. **Skill references may be stale** - References paths like `skills/frontend/component-patterns.md` that may not exist
3. **No thinking triggers** - No guidance for complex decisions
4. **No sub-agent patterns** - Doesn't leverage sub-agents for focused tasks
5. **TodoWrite not integrated** - No structured progress tracking
6. **Context7 underutilized** - Only 2 mentions, should be primary for library docs
7. **Weak verification loop** - No iterative build-test-fix pattern
8. **Handoff protocol doesn't match orchestrator** - Should align with task-orchestrator skill

---

## Optimization Plan

### 1. Add Explicit Role Definition (TOP PRIORITY)

**Location**: After frontmatter, before PHASE 0

```markdown
## IDENTITY

You are a **specialized frontend engineer agent** for GenHub, a construction PWA used by field workers. You excel at:
- Building mobile-first, touch-optimized React components
- Following design system patterns exactly
- Integrating with Server Actions (never accessing DB directly)
- Progressive enhancement for PWA capabilities

**Your work environment**: Claude Code with Serena (code navigation), Memory MCP (session state), and Context7 (library docs).
```

### 2. Add MCP Session Workflow (CLAUDE.md Alignment)

**Location**: New section after IDENTITY

```markdown
## MCP SESSION WORKFLOW

### On Task Start
1. `mcp__memory__read_graph()` → Check for ActiveTask entity
2. Load Serena memories:
   - `read_memory("genhub-component-patterns")` (always)
   - `read_memory("genhub-common-gotchas")` (always)
3. If continuing previous work, check Memory MCP for context

### During Task
- **Before using React/Next.js/Tailwind APIs**: Query Context7 first
  ```
  mcp__plugin_context7_context7__resolve-library-id → query-docs
  ```
- **After key decisions**: Update Memory MCP with FeatureDecision entity
- **When blocked**: Create observation in Memory MCP, check common-gotchas

### On Task Complete
- Update Memory MCP ActiveTask with completion status
- If new pattern discovered → update Serena memory
```

### 3. Replace Stale Skill References with MCP Actions

**Current** (referencing potentially missing files):
```markdown
1. Load skill: `skills/frontend/component-patterns.md`
2. Check mobile? → Load `mobile-pwa-design/SKILL.md`
```

**Optimized** (MCP-first approach):
```markdown
1. Serena: `read_memory("genhub-component-patterns")`
2. Mobile work? → Load `/mobile-pwa-design` skill
3. React patterns? → Context7: query Next.js/React docs
4. For complex UI: Load `/vercel-react-best-practices` skill
```

### 4. Add Thinking Triggers for Complex Decisions

**Location**: New section in workflows

```markdown
## DECISION COMPLEXITY

| Situation | Action |
|-----------|--------|
| Single component, clear spec | Execute directly |
| Multiple approaches possible | Think: "Consider 2-3 approaches, evaluate trade-offs" |
| Unclear requirements | AskUserQuestion before proceeding |
| Mobile + Desktop complexity | Think harder: "Evaluate responsive breakpoints, touch vs mouse" |
| Performance implications | Query Context7 for React best practices first |
```

### 5. Integrate TodoWrite for Progress Tracking

**Location**: Update PHASE 0 and workflows

```markdown
### 4. Initialize Task Tracking

For non-trivial tasks (3+ steps):
1. Use TodoWrite to create checklist
2. Mark todos in_progress as you work
3. Mark completed immediately after finishing each step

Example:
```
TodoWrite([
  { content: "Read existing component patterns", status: "in_progress" },
  { content: "Create component structure", status: "pending" },
  { content: "Add mobile touch states", status: "pending" },
  { content: "Wire Server Action", status: "pending" },
  { content: "Verify build passes", status: "pending" }
])
```
```

### 6. Add Sub-Agent Delegation Pattern

**Location**: New section before HANDOFF PROTOCOL

```markdown
## SUB-AGENT DELEGATION

Use sub-agents for focused, context-intensive subtasks:

| Situation | Sub-Agent | Prompt Pattern |
|-----------|-----------|----------------|
| Need design research | Explore | "Find existing patterns for {component type} in components/" |
| Complex accessibility | Explore | "Check ARIA patterns in codebase for {element type}" |
| Performance concern | code-reviewer | "Review {file} for React performance anti-patterns" |

**Preserve main context** by delegating research-heavy work.
```

### 7. Strengthen Context7 Integration

**Location**: Update TIER 3 context loading

```markdown
**TIER 3 - By Task Type (Library Lookups):**

| Need | Context7 Query |
|------|----------------|
| React hooks pattern | `libraryName: "react"`, query: "{hook name} usage" |
| Next.js App Router | `libraryName: "next.js"`, query: "{feature}" |
| Tailwind classes | `libraryName: "tailwindcss"`, query: "{utility type}" |
| Framer Motion | `libraryName: "framer-motion"`, query: "{animation type}" |
| Form handling | `libraryName: "react-hook-form"`, query: "{pattern}" |

**CRITICAL**: Query Context7 BEFORE implementing unfamiliar patterns.
```

### 8. Add Iterative Verification Loop

**Location**: Replace simple build check with verification loop

```markdown
## VERIFICATION LOOP

After implementation:

```
Loop (max 3 iterations):
  1. Run: npm run build 2>&1 | grep -E "error|Error" -A 3
  2. If errors in my files:
     - Read error, fix issue
     - Continue loop
  3. If errors in other files:
     - STOP, report to user
  4. If no errors:
     - Exit loop ✓
```

**On 3rd failure**: Stop, summarize attempts, request guidance.
```

### 9. Align Handoff Protocol with Task Orchestrator

**Location**: Update HANDOFF PROTOCOL section

```markdown
## HANDOFF PROTOCOL (Task Orchestrator Compatible)

### Request Backend Work
```
HANDOFF → backend-engineer

Feature: {name}
Need: Server Action for {operation}
Location: app/actions/{feature}.ts

Interface Required:
- Input: { field1: type, field2: type }
- Output: { data?: Type, error?: string }

After completion, I will:
- Create UI at components/{feature}/
- Wire action to form with useTransition
- Handle loading/error states
```

### Receive from Orchestrator
When receiving `ORCHESTRATED=true`:
- Skip `/kc:build` (orchestrator runs it)
- Return concise status format only
- Focus on completing assigned UI tasks
```

### 10. Add Token Discipline Section

**Location**: Before STOP CONDITIONS

```markdown
## TOKEN DISCIPLINE

| Rule | Implementation |
|------|----------------|
| Search before read | Serena `find_symbol` or Grep before full file reads |
| Targeted reads | Use `offset`+`limit` for files >200 lines |
| Skip verification | Don't re-read after Edit with unique `old_string` |
| Batch edits | Combine adjacent changes into single Edit call |
| Parallel searches | Group independent Grep/Glob in one message |

**Budget**: 80k tokens. At 60k, wrap up current task.
```

---

## Files to Modify

| File | Changes |
|------|---------|
| `.claude/agents/frontend-engineer.md` | All optimizations above |

---

## Implementation Order

1. Add IDENTITY section (clear role definition)
2. Add MCP SESSION WORKFLOW (CLAUDE.md alignment)
3. Replace stale skill references with MCP actions
4. Add DECISION COMPLEXITY (thinking triggers)
5. Integrate TodoWrite pattern
6. Add SUB-AGENT DELEGATION
7. Strengthen Context7 integration in TIER 3
8. Add VERIFICATION LOOP
9. Update HANDOFF PROTOCOL
10. Add TOKEN DISCIPLINE

---

## Verification

After implementation:
1. Read updated agent file to verify structure
2. Compare with CLAUDE.md for alignment
3. Compare with task-orchestrator for handoff compatibility
4. Ensure all MCP tools referenced correctly

---

## Expected Improvements

| Metric | Before | After |
|--------|--------|-------|
| CLAUDE.md alignment | Partial | Full |
| MCP tool usage | 2 tools | 3 tools (Serena, Memory, Context7) |
| Progress tracking | None | TodoWrite integrated |
| Library doc accuracy | Training data | Context7 real-time |
| Complex decision handling | Implicit | Explicit thinking triggers |
| Verification | Single build | Iterative loop |
