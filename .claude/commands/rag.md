# RAG Agent Command

Invoke the intelligent RAG agent for context-rich assistance with complex tasks.

## Usage

```
/rag <query>
```

## Examples

```
/rag How do I add authentication to the API?
/rag Optimize the dashboard component for performance
/rag What are the best practices for Server Actions?
/rag Refactor the tasks module to use Server Components
```

## What This Does

When you invoke `/rag`, the agent:

1. **Clarifies** your query - decomposing complex questions into sub-queries
2. **Retrieves** relevant context from:
   - GenHub codebase (indexed patterns, components, actions)
   - Priority skills (vercel-react-best-practices, supabase-table-rls-policy-generator)
   - Project conventions (CLAUDE.md, Serena memories)
   - External docs (Next.js, Supabase, React)
3. **Synthesizes** an LLM-optimized response with:
   - Problem context
   - Relevant code locations (`file:line`)
   - Applicable blocking rules and patterns
   - Step-by-step solution approach
   - Files to modify
   - Verification steps

## When to Use

- Complex implementation tasks spanning multiple files
- Architecture decisions requiring context
- Debugging unfamiliar code areas
- Optimization and refactoring tasks
- Understanding existing patterns before changes

## Auto-Trigger

The RAG agent can also be invoked automatically when query complexity exceeds threshold (0.7). Triggers include:
- "how do I", "implement", "debug", "fix", "optimize"
- Multi-part questions
- Cross-cutting concerns (frontend + backend)
- Architectural decisions

## Output Format

The RAG agent returns structured context optimized for Claude Code:

```markdown
## Problem Context
[Concise problem statement]

## Relevant Code Locations
- `file_path:line_number` - Description

## Key Patterns & Constraints
[Project-specific patterns, blocking rules]

## Solution Approach
1. Step one
2. Step two

## Files to Modify
| File | Change Type | Description |
|------|-------------|-------------|

## Verification
- [ ] Build passes
- [ ] Tests pass
```

## Configuration

See `.claude/skills/rag-agent/config/config.yaml` for:
- Indexing settings (chunk sizes, sources)
- Retrieval parameters (top-k, thresholds)
- Auto-trigger settings
- Optimization targets

## First-Time Setup

Before first use, index the codebase:

```bash
cd .claude/skills/rag-agent
pip install -r requirements.txt
python scripts/indexer.py --config config/config.yaml
```

---

*Part of the RAG Agent skill for GenHub codebase optimization.*
