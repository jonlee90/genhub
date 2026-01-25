# CLAUDE-RAG.md - RAG-Enhanced Workflow Instructions

> Optimized for LLM parsing and human readability | GenHub PWA

---

## 1. Quick Decision Matrix

```
┌─────────────────────────────────────────────────────────────────────┐
│  Should I use RAG?                                                   │
│                                                                      │
│  └─ Complex query (multi-file, architecture, debug)?  → /rag        │
│  └─ Simple query (single file, known pattern)?        → Direct      │
│  └─ Uncertain?                                        → Auto-detect │
│                                                                      │
│  Complexity Indicators:                                              │
│  ├─ "how does X work across..."    → RAG                            │
│  ├─ "implement feature..."         → RAG                            │
│  ├─ "debug/fix/optimize..."        → RAG                            │
│  ├─ "single file edit"             → Direct                         │
│  └─ "add import/export"            → Direct                         │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 2. Auto-Trigger Rules

| Trigger | Threshold | Action |
|---------|-----------|--------|
| Complexity score | ≥ 0.7 | Engage RAG |
| Multi-file detection | ≥ 3 files | Engage RAG |
| Cross-cutting concern | frontend + backend + auth | Engage RAG |
| Conversation depth | ≥ 5 turns on same topic | Boost context |

**Trigger Keywords:**
```
HIGH:    implement, architect, refactor, migrate, integrate
MEDIUM:  debug, fix, optimize, improve, update
LOW:     add, remove, rename, move
```

**Auto-Detect Pattern:**
```
Query contains:
  ├─ "how do I" + technical term     → RAG
  ├─ "what is the best way"          → RAG
  ├─ "why does" + error/behavior     → RAG
  ├─ reference to multiple modules   → RAG
  └─ simple imperative               → Direct
```

---

## 3. Query Optimization

### Decomposition Patterns
```
Complex Query → Decompose:
  ├─ [WHAT]   Target entity/concept
  ├─ [WHERE]  File/module scope
  ├─ [HOW]    Implementation approach
  └─ [WHY]    Business/technical rationale
```

### Reference Resolution
| Pronoun | Resolution Strategy |
|---------|---------------------|
| "it" | Last mentioned entity in conversation |
| "this" | Current file/component in context |
| "that" | Previously discussed solution/pattern |
| "the error" | Most recent error message |

### Ambiguity Detection
```
Ambiguous if:
  ├─ Multiple valid interpretations exist
  ├─ Missing required context (file, module, pattern)
  ├─ Conflicting constraints detected
  └─ ACTION: Ask clarifying question before proceeding
```

---

## 4. Retrieval Strategy

### Hybrid Search Configuration
```
┌─────────────────────────────────────┐
│  Dense Embedding:  70% weight       │
│  Sparse (BM25):    30% weight       │
│  Confidence min:   0.7              │
│  Max results:      10               │
└─────────────────────────────────────┘
```

### Source Priority
| Priority | Source | Description |
|----------|--------|-------------|
| P0 | Skills | vercel-react-best-practices, postgres-best-practices:postgres-best-practices |
| P0 | CLAUDE.md | Project-specific rules and patterns |
| P1 | Codebase | Indexed project files |
| P1 | Serena Memories | genhub-* patterns and conventions |
| P2 | External Docs | Next.js, React, Supabase official docs |

### Chunk Hierarchy
```
Parent Chunk (file-level context)
  └─ Child Chunks (function/component level)
      └─ Leaf Chunks (specific patterns)

Retrieval: Child first → Parent for context if needed
```

---

## 5. Skill Loading Matrix

| File Pattern | Required Skill | Auto-Load |
|--------------|----------------|-----------|
| `*.tsx`, `*.jsx` | vercel-react-best-practices | ✓ |
| `app/actions/*.ts` | postgres-best-practices:postgres-best-practices | ✓ |
| `supabase/migrations/*` | postgres-best-practices:postgres-best-practices | ✓ |
| `components/**/*.tsx` | vercel-react-best-practices + a11y-pass | ✓ |
| `lib/**/*.ts` | (context-dependent) | - |
| `types/**/*.ts` | (no skill required) | - |

### Skill Loading Protocol
```
1. Detect file pattern from query/task
2. Match against skill matrix
3. Load required skill(s) BEFORE any code changes
4. Log: "Skills Applied: [skill-names]"
```

---

## 6. Blocking Rules Injection

### Auto-Injected Rules by Context

| Context Detected | Injected Rules |
|------------------|----------------|
| Client component edit | no-supabase-client |
| Modal/dialog work | responsive-modal-only |
| Icon addition | lucide-icons-only |
| Interactive element | 44px-touch-targets |
| Data fetching | server-actions-for-db |

### Rule Definitions
```yaml
no-supabase-client:
  pattern: "'use client'" + "createClient"
  severity: BLOCKING
  message: "No Supabase in client components"

responsive-modal-only:
  pattern: "<Dialog" from Radix (not ResponsiveModal)
  severity: BLOCKING
  message: "Use ResponsiveModal instead of Dialog"

lucide-icons-only:
  pattern: heroicons|fontawesome imports
  severity: BLOCKING
  message: "Use Lucide icons only"

44px-touch-targets:
  pattern: button|link without min-h-[44px]
  severity: FIX
  message: "Add min-h-[44px] min-w-[44px]"

server-actions-for-db:
  pattern: direct DB call in component
  severity: BLOCKING
  message: "Use Server Actions for database access"
```

---

## 7. Optimization Mode

### Mode Selection
```
┌─────────────────────────────────────────────────────────────────┐
│  Conservative  │  Moderate  │  Aggressive (default)            │
│  ────────────  │  ────────  │  ──────────                      │
│  Safety first  │  Balanced  │  Max optimization                │
│  1 file/batch  │  5 files   │  10 files/batch                  │
│  Manual review │  Auto+spot │  Auto with rollback              │
└─────────────────────────────────────────────────────────────────┘
```

### Architecture Alignment Targets
| Target | Pattern | Transform |
|--------|---------|-----------|
| Server Component | Client component with no interactivity | Remove 'use client' |
| Server Action | Direct DB call in component | Extract to `app/actions/` |
| Barrel Elimination | `import { X } from './components'` | Direct path import |
| Dynamic Import | Large component in initial bundle | `dynamic(() => import(...))` |
| URL State | `useState` for shareable state | `useSearchParams` |
| RLS Policy | Unprotected table | Generate SELECT policy |

---

## 8. Output Format (LLM-Optimized)

```markdown
## Problem Context
[Single sentence describing the issue/task]

## Relevant Code Locations
- `path/file.ts:123` - [description]
- `path/file.ts:456` - [description]

## Key Patterns & Constraints
- [Applicable blocking rule]
- [Required pattern/convention]
- [Performance consideration]

## Solution Approach
1. [Step with rationale]
2. [Step with rationale]
3. [Verification step]

## Files to Modify
| File | Change Type | Description |
|------|-------------|-------------|
| `path/file.ts` | Edit | [What changes] |
| `path/new.ts` | Create | [Why needed] |

## Verification Checklist
- [ ] Build passes (`npm run build`)
- [ ] Type check passes (`npm run type-check`)
- [ ] Blocking rules satisfied
- [ ] Mobile checks: 44px | active states | dark mode
```

---

## 9. Safety & Validation

### Pre-Flight Checklist
```
Before modifying files:
  ├─ [ ] Git working tree clean (or changes stashed)
  ├─ [ ] Required skills loaded
  ├─ [ ] Blocking rules understood
  ├─ [ ] Rollback strategy identified
  └─ [ ] Batch size ≤ 10 files
```

### Batch Processing Protocol
```
┌─────────────────────────────────────────────────────────────────┐
│  1. Create feature branch: git checkout -b rag/[feature]        │
│  2. Process files in batches of ≤ 10                           │
│  3. Run build after each batch                                  │
│  4. On failure: git checkout . && analyze error                 │
│  5. On success: commit batch with descriptive message           │
└─────────────────────────────────────────────────────────────────┘
```

### Rollback Triggers
| Condition | Action |
|-----------|--------|
| Build fails 2x on same error | STOP, ask for guidance |
| Type errors introduced | Revert batch, analyze |
| Runtime error detected | Revert, isolate cause |
| Security advisor critical | STOP immediately |

---

## 10. Integration with Serena Memories

### Required Memories
| Memory Name | Content | Load When |
|-------------|---------|-----------|
| `genhub-component-patterns` | UI patterns, ResponsiveModal usage | Component work |
| `genhub-server-actions` | Action patterns, error handling | Server Action work |
| `genhub-database-schema` | Tables, relations, RLS | Database work |
| `genhub-common-gotchas` | Known issues, workarounds | Debug/troubleshoot |

### Memory Loading Protocol
```typescript
// Before starting task, load relevant memories:
// 1. Identify task type (UI, DB, Auth, etc.)
// 2. Load corresponding memories via Serena read_memory
// 3. Incorporate patterns into solution

// Example invocation:
// mcp__plugin_serena_serena__read_memory({ name: "genhub-component-patterns" })
```

### Memory Update Protocol
```
After completing significant task:
  ├─ Identify new patterns/gotchas discovered
  ├─ Update relevant memory via write_memory
  └─ Log: "Memory updated: [memory-name]"
```

---

## Quick Reference Commands

| Command | Purpose |
|---------|---------|
| `/rag` | Invoke RAG agent for complex queries |
| `/rag:index` | Re-index codebase |
| `/rag:status` | Check index health |

---

## Token Budget Management

```
┌─────────────────────────────────────────────────────────────────┐
│  Context Window Allocation:                                      │
│  ├─ System prompts & rules:  20%                                │
│  ├─ Retrieved context:       40%                                │
│  ├─ Conversation history:    25%                                │
│  └─ Response generation:     15%                                │
│                                                                  │
│  Warning threshold: 70% utilization → Report progress           │
│  Critical threshold: 90% → Summarize and checkpoint             │
└─────────────────────────────────────────────────────────────────┘
```

---

## Invocation Examples

### Simple Query (Direct)
```
User: "Add a loading state to the submit button"
→ Direct approach: Edit single component
```

### Complex Query (RAG)
```
User: "How does authentication flow work in this app?"
→ RAG: Multi-file analysis, architecture understanding
→ Load: genhub-server-actions, genhub-component-patterns
```

### Optimization Task (RAG + Aggressive)
```
User: "Optimize the team management module"
→ RAG + Aggressive mode
→ Batch processing with rollback
→ Skills: vercel-react-best-practices, postgres-best-practices:postgres-best-practices
```
