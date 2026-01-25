# Agent Rule Mappings

Maps relevant rules from shared skills to each OpenCode agent for contextual loading.

## Skills Referenced

| Skill | Location | Source |
|-------|----------|--------|
| vercel-react-best-practices | `.claude/skills/vercel-react-best-practices/` | Project |
| postgres-best-practices:postgres-best-practices | User-level (`~/.claude/skills/`) | Supabase |

---

## Rule Mappings by Agent

### code-reviewer

**Purpose:** Validates all code against best practices

**vercel-react-best-practices (ALL - for comprehensive review):**
```
async-*           # Waterfall prevention
bundle-*          # Bundle optimization
server-*          # Server-side performance
client-*          # Client data fetching
rerender-*        # Re-render optimization
rendering-*       # Rendering performance
js-*              # JavaScript performance
advanced-*        # Advanced patterns
```

**postgres-best-practices:postgres-best-practices (ALL - for DB code review):**
```
query-*           # Query performance
conn-*            # Connection management
security-*        # Security & RLS
schema-*          # Schema design
lock-*            # Concurrency
data-*            # Data access patterns
monitor-*         # Monitoring
advanced-*        # Advanced features
```

---

### refactor-specialist

**Purpose:** Deep refactoring and code cleanup

**vercel-react-best-practices:**
```
rerender-*        # Re-render optimization (MEDIUM)
  - rerender-defer-reads
  - rerender-memo
  - rerender-dependencies
  - rerender-derived-state
  - rerender-functional-setstate
  - rerender-lazy-state-init
  - rerender-transitions

rendering-*       # Rendering performance (MEDIUM)
  - rendering-hoist-jsx
  - rendering-conditional-render
  - rendering-content-visibility

js-*              # JavaScript performance (LOW-MEDIUM)
  - js-combine-iterations
  - js-early-exit
  - js-cache-function-results
  - js-cache-property-access
  - js-index-maps
  - js-set-map-lookups

advanced-*        # Advanced patterns (LOW)
  - advanced-event-handler-refs
  - advanced-use-latest
```

**postgres-best-practices:postgres-best-practices:**
```
query-*           # Query optimization
  - query-select-columns
  - query-single-vs-maybeSingle

data-*            # Data patterns
  - data-batch-operations
```

---

### component-scanner

**Purpose:** Scans modules for extraction opportunities

**vercel-react-best-practices:**
```
bundle-*          # Bundle optimization (CRITICAL)
  - bundle-barrel-imports
  - bundle-dynamic-imports
  - bundle-defer-third-party
  - bundle-conditional

rerender-*        # Re-render patterns (MEDIUM)
  - rerender-memo
  - rerender-dependencies

rendering-*       # Rendering patterns (MEDIUM)
  - rendering-hoist-jsx
  - rendering-content-visibility
  - rendering-conditional-render
```

**postgres-best-practices:postgres-best-practices:**
```
(Not applicable - focuses on UI components)
```

---

### tailwind-optimizer

**Purpose:** HTML structure and Tailwind CSS optimization

**vercel-react-best-practices:**
```
rendering-*       # Rendering/CSS performance (MEDIUM)
  - rendering-animate-svg-wrapper
  - rendering-content-visibility
  - rendering-svg-precision
  - rendering-hydration-no-flicker

js-*              # DOM/CSS related (LOW-MEDIUM)
  - js-batch-dom-css

client-*          # Event handling (MEDIUM-HIGH)
  - client-passive-event-listeners
  - client-event-listeners
```

**postgres-best-practices:postgres-best-practices:**
```
(Not applicable - focuses on HTML/CSS)
```

---

## Loading Rules in Context

### OpenCode Skill Loading

```json
{
  "skills": {
    "discovery": [
      ".opencode/skill/",
      ".claude/skills/"
    ],
    "agentMappings": {
      "reviewer": ["vercel-react-best-practices", "postgres-best-practices:postgres-best-practices"],
      "refactor": ["vercel-react-best-practices"],
      "component-scanner": ["vercel-react-best-practices"],
      "tailwind-optimizer": ["vercel-react-best-practices"]
    }
  }
}
```

### Dynamic Rule Loading

Agents should load rules based on file types being processed:

| File Pattern | Load Rules |
|--------------|------------|
| `*.tsx` | vercel-react: `rendering-*`, `rerender-*` |
| `app/actions/*.ts` | postgres: `query-*`, `security-*` |
| `components/**/*.tsx` | vercel-react: `bundle-*`, `rendering-*` |
| `lib/**/*.ts` | vercel-react: `js-*`, postgres: `data-*` |

---

## Priority Order

When multiple rules apply, prioritize by impact:

1. **CRITICAL** - `async-*`, `bundle-*`, `query-*`, `conn-*`, `security-*`
2. **HIGH** - `server-*`, `schema-*`
3. **MEDIUM-HIGH** - `client-*`, `lock-*`
4. **MEDIUM** - `rerender-*`, `rendering-*`, `data-*`
5. **LOW-MEDIUM** - `js-*`, `monitor-*`
6. **LOW** - `advanced-*`
