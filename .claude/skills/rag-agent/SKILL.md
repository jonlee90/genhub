---
name: rag-agent
description: |
  Intelligent RAG agent for autonomous codebase optimization. Indexes best practices from
  Next.js 16, React 19, and Supabase docs alongside project code. Provides LLM-optimized
  context for Claude Code, identifies optimization opportunities, and executes systematic
  upgrades with high accuracy. Use when solving complex problems, needing detailed context,
  or optimizing code architecture.
invocation:
  manual: "/rag"
  auto_trigger:
    enabled: true
    complexity_threshold: 0.7
    indicators:
      - "how do I"
      - "implement"
      - "debug"
      - "fix"
      - "optimize"
      - "architecture"
      - "pattern"
      - "can you"1
---

# RAG Agent - Codebase Optimizer

Self-improving RAG agent that learns best practices, analyzes code, plans optimizations,
and executes improvements through Claude Code with high accuracy.

## Quick Start

```bash
# Index the codebase and external docs
python scripts/indexer.py --config config/config.yaml

# Query the RAG system
python scripts/retriever.py --query "How to implement server actions?"

# Run full optimization analysis
python scripts/synthesizer.py --analyze --scope full
```

## The Optimization Loop

```
LEARN → ANALYZE → PLAN → EXECUTE → VALIDATE
  │                                    │
  └──────── ROLLBACK & LEARN ◄─────────┘
```

## Core Capabilities

### Layer 1: Knowledge Acquisition
- Index best practices (Next.js 16, React 19, Supabase patterns)
- Learn from top open-source implementations
- Continuously update knowledge from latest docs

### Layer 2: Codebase Analysis
- Static analysis (patterns, anti-patterns, tech debt)
- Performance profiling (bundle size, render cycles, queries)
- Gap detection (current vs. ideal state)

### Layer 3: Optimization Planning
- Prioritize improvements by impact × effort
- Generate detailed upgrade plans with validation steps
- Ensure backwards compatibility and safety

### Layer 4: Execution & Validation
- Generate optimal prompts for Claude Code execution
- Validate changes (build, tests, benchmarks)
- Self-correct on failures, learn from outcomes

## Invocation Paths

### Manual: `/rag <query>`
Explicitly invoke the RAG agent for any query:
```
/rag How do I add authentication to the API?
/rag Optimize the dashboard component for performance
/rag What are the best practices for Server Actions?
```

### Auto-Trigger
Automatically invokes when query complexity exceeds threshold (0.7):
- Questions starting with "how do I", "implement", "debug", "fix"
- Multi-part questions requiring context from multiple files
- Questions about architecture, patterns, or conventions

## Hierarchical Indexing Strategy

### Parent Chunks
- Large sections from headers (H1, H2, H3)
- Provide contextual richness

### Child Chunks
- Fixed-size (500 tokens, 100-token overlap)
- Precise semantic search

### Hybrid Retrieval
- **Dense Embeddings**: Semantic understanding (`all-mpnet-base-v2`)
- **Sparse Embeddings**: BM25-based keyword matching
- **Combined**: Both semantically similar AND keyword-relevant

## LLM-Optimized Output Format

```markdown
## Problem Context
[Concise problem statement with relevant background]

## Relevant Code Locations
- `file_path:line_number` - Description

## Key Patterns & Constraints
[Project-specific patterns, blocking rules, conventions]

## Solution Approach
[Step-by-step approach optimized for Claude Code execution]

## Files to Modify
| File | Change Type | Description |
|------|-------------|-------------|
| path/file.ts | Edit | What to change |

## Verification
[How to test the solution]
```

## Optimization Targets

### Performance
| Target | Goal |
|--------|------|
| Bundle size | Minimize |
| LCP | <2.5s |
| FID | <100ms |
| CLS | <0.1 |
| DB queries | Zero N+1 |
| Re-renders | Minimize |

### Code Quality
| Target | How Agent Improves It |
|--------|----------------------|
| Type safety | Strengthen types, remove `any` |
| Error handling | Add proper error boundaries |
| Accessibility | WCAG 2.1 AA compliance |
| Security | RLS policies, input validation |

### Architecture Alignment (AGGRESSIVE MODE)
| Pattern | Agent Rewrites To |
|---------|-------------------|
| Data fetching in client | Server Component |
| Client-side mutations | Server Actions |
| Mixed components | Server/Client pairs |
| Client state | URL state where possible |
| Barrel imports | Direct imports only |
| Heavy components | `dynamic()` imports |

## Priority Knowledge Sources

| Source | Priority | Content |
|--------|----------|---------|
| vercel-react-best-practices | P0 | 45 rules: bundle-*, rerender-*, rendering-*, async-* |
| supabase-table-rls-policy-generator | P0 | RLS policy patterns |
| GenHub codebase | P1 | Current patterns |
| CLAUDE.md | P1 | Project conventions |
| Next.js/Supabase docs | P1 | External best practices |
| Serena memories | P2 | Existing patterns and gotchas |

## Accuracy Mechanisms

### Retrieval Accuracy
- Hybrid search (dense + sparse) reduces false positives
- Parent-child chunks preserve context
- Re-ranking by relevance
- Confidence threshold: 0.7

### Execution Accuracy
- Dry-run mode: Preview before applying
- Incremental commits: One logical change per commit
- Automated validation: Build + test after every change
- Rollback on failure: Automatic revert if validation fails

### Learning Loop
```
Execute → Validate → Success? → Store Pattern
                         ↓
                     Failure → Analyze Cause → Store Anti-Pattern
```

## GenHub Integration

### Memory Integration (Serena MCP)
```python
memories = [
    "genhub-component-patterns",
    "genhub-server-actions",
    "genhub-database-schema",
    "genhub-common-gotchas"
]
```

### Skill Auto-Loading
```yaml
filePatterns:
  "*.tsx": vercel-react-best-practices
  "app/actions/*.ts": postgres-best-practices:postgres-best-practices
  "components/**/*.tsx": [vercel-react-best-practices, a11y-pass]
```

### Blocking Rules Injection
Retrieved context includes applicable blocking rules from CLAUDE.md:
- No Supabase in 'use client' components
- Use ResponsiveModal instead of Dialog
- 44px minimum touch targets

## Reference Documentation

- **Prompt Patterns**: `references/prompt-patterns.md`
- **Configuration**: `config/config.yaml`

## Scripts

| Script | Purpose |
|--------|---------|
| `indexer.py` | Document indexing with hierarchical chunking |
| `retriever.py` | Hybrid retrieval with Qdrant |
| `clarifier.py` | Query clarification and decomposition |
| `synthesizer.py` | LLM-optimized response generation |
| `auto_trigger.py` | Complexity detection for auto-invocation |

## Safety Nets

- Git branch per refactor batch
- Build must pass before commit
- Tests must pass (or be fixed)
- Rollback on any regression
