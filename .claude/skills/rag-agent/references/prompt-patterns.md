# RAG Agent Prompt Patterns

This document contains all prompt templates used by the RAG agent for query processing, retrieval, and response synthesis.

---

## 1. Query Clarification Prompts

### 1.1 Query Optimization Template

```
Given the user's question and conversation history:
- Question: {question}
- History: {history}
- Project Context: {project_type}

Generate 2-4 optimized search queries that:
1. Use specific technical terms (not vague language)
2. Include relevant file patterns (*.tsx, app/actions/*)
3. Reference known conventions (Server Actions, ResponsiveModal)

Output format:
- query_1: [optimized query]
- query_2: [optimized query]
- ...
```

### 1.2 Ambiguity Detection Template

```
Analyze the following query for ambiguity:

Query: {query}
Conversation history: {history}

Identify:
1. Pronouns without clear antecedents ("it", "this", "that")
2. Vague references ("the thing", "previous", "earlier")
3. Implicit assumptions that need clarification
4. Multiple possible interpretations

Output:
- ambiguous_terms: [list of terms needing clarification]
- clarification_questions: [questions to ask user]
- confidence: [0-1 score of query clarity]
```

### 1.3 Query Decomposition Template

```
Decompose this complex query into simpler sub-queries:

Query: {query}
Technical context: {context}

Break down into:
1. Main objective (what user wants to achieve)
2. Sub-tasks (discrete steps needed)
3. Context queries (what info is needed first)
4. Verification queries (how to validate success)

Output format:
- main_query: [primary search query]
- sub_queries:
  - [sub-query 1]
  - [sub-query 2]
- context_needed: [what context to gather first]
```

---

## 2. Retrieval Prompts

### 2.1 Semantic Search Template

```
You are retrieving relevant context for this query.

Query: {query}
Project type: Next.js 16 + React 19 + Supabase PWA

Prioritize results that:
1. Directly address the query's main objective
2. Come from authoritative sources (official docs, verified patterns)
3. Include actionable code examples or file references
4. Match the project's technology stack

Deprioritize results that:
1. Are outdated or deprecated
2. Use patterns not aligned with project conventions
3. Are tangentially related without clear relevance
```

### 2.2 Parent-Child Lookup Template

```
For the matched child chunk, retrieve its parent context.

Child chunk: {child_content}
Child metadata: {child_metadata}

Retrieve parent that:
1. Provides surrounding context (function/class/section scope)
2. Includes imports and dependencies
3. Shows the broader pattern or convention
4. Contains header hierarchy for navigation

Return: parent_content, full_header_path
```

### 2.3 Multi-Agent Retrieval Template

```
Spawn parallel retrieval agents for these sub-queries:

Original query: {query}
Sub-queries:
{sub_queries}

Each agent should:
1. Search independently for their sub-query
2. Return top-{k} most relevant results
3. Include confidence scores
4. Flag any ambiguity or uncertainty

Merge strategy:
- Deduplicate by chunk_id
- Prioritize by: max(confidence) across agents
- Preserve source attribution
```

---

## 3. Response Synthesis Prompts

### 3.1 Claude Code Optimized Response Template

```
You are generating context for Claude Code to solve: {problem}

Retrieved documents:
{documents}

Structure your response to:
1. State the problem in 1-2 sentences
2. List relevant file:line references
3. Identify applicable patterns/rules from project conventions
4. Provide step-by-step solution approach
5. Specify verification steps

Format for LLM consumption (not human reading):
- Use tables for file changes
- Use bullet points for steps
- Avoid prose explanations
- Include exact code patterns to follow

IMPORTANT: This output will be consumed by Claude Code, not displayed to users.
Optimize for:
- Token efficiency
- Actionable specificity
- Pattern matching with project conventions
```

### 3.2 Blocking Rules Injection Template

```
Based on the query and retrieved context, identify applicable blocking rules:

Query: {query}
Files involved: {file_list}
Context: {context}

Check against GenHub blocking rules:
1. No Supabase in 'use client' components
2. Server Actions for all DB operations
3. ResponsiveModal only (not Dialog)
4. Lucide icons only
5. 44px minimum touch targets
6. Required skill loading for file patterns

Output:
- applicable_rules: [list of rules that apply]
- violations_detected: [any existing violations in context]
- warnings: [potential issues to watch for]
```

### 3.3 Skill Mapping Template

```
Determine required skills based on files to be modified:

Query: {query}
Files to modify: {files}

Skill mapping rules:
- *.tsx, *.jsx → vercel-react-best-practices
- app/actions/*.ts → postgres-best-practices:postgres-best-practices
- components/**/*.tsx → vercel-react-best-practices + a11y-pass
- supabase/migrations/* → postgres-best-practices:postgres-best-practices

Output:
- required_skills: [list of skills to load]
- applicable_rules: [specific rules from each skill]
- load_order: [order to load skills]
```

---

## 4. Optimization Analysis Prompts

### 4.1 Codebase Analysis Template

```
Analyze this code for optimization opportunities:

Code: {code}
File: {file_path}
Context: GenHub PWA (Next.js 16 + React 19 + Supabase)

Check for:
1. Server Component opportunities (client with data fetching → server)
2. Server Action migrations (client DB calls → actions)
3. Barrel import elimination (index.ts imports → direct)
4. Dynamic import needs (heavy libs → next/dynamic)
5. URL state opportunities (useState → useSearchParams)
6. Missing RLS policies

Output format:
| Issue | Severity | Location | Recommended Fix |
|-------|----------|----------|-----------------|
```

### 4.2 Performance Audit Template

```
Audit this code for performance issues:

Code: {code}
Component type: {type}

Check for:
1. Re-render triggers (missing memo, unstable references)
2. Bundle impact (large imports, unused exports)
3. Hydration issues (server/client mismatch)
4. Fetch waterfalls (sequential vs parallel)
5. N+1 query patterns (loop with DB calls)

For each issue:
- severity: critical | high | medium | low
- impact: estimated effect on performance
- fix: specific code change needed
```

### 4.3 Optimization Prompt Template

```
Generate an optimization plan for this file:

File: {file_path}
Current code: {code}
Issues found: {issues}

Create a plan that:
1. Prioritizes by impact × effort
2. Ensures backwards compatibility
3. Includes validation steps
4. Can be executed incrementally

Output:
## Optimization Task: {task_name}

**File**: `{file_path}`
**Priority**: {P0|P1|P2}

### Changes
{detailed_changes}

### Validation
1. Run: `npm run build`
2. Run: `npm run test`
3. Verify: {specific_check}

### Rollback
- git checkout main -- {file_path}
```

---

## 5. Conversation Context Prompts

### 5.1 Context Extraction Template

```
Extract relevant context from conversation history:

History: {history}

Identify:
1. Files mentioned (paths, components, functions)
2. Technical decisions made
3. Errors or issues encountered
4. User preferences expressed
5. Constraints or requirements stated

Output:
- files: [list of file references]
- decisions: [key decisions made]
- constraints: [stated constraints]
- open_questions: [unresolved questions]
```

### 5.2 Reference Resolution Template

```
Resolve ambiguous references in the query:

Query: {query}
History: {history}
Ambiguous terms: {terms}

For each term, determine the most likely referent:
- "it" → [resolved reference]
- "this" → [resolved reference]
- "previous" → [resolved reference]

Output resolved query with substitutions.
```

---

## 6. Validation Prompts

### 6.1 Solution Validation Template

```
Validate the proposed solution before execution:

Solution: {solution}
Files affected: {files}
Changes: {changes}

Check:
1. Does it follow project conventions (CLAUDE.md)?
2. Are required skills loaded?
3. Will it pass build and lint?
4. Are there potential regressions?
5. Is it backwards compatible?

Output:
- valid: true/false
- issues: [list of potential problems]
- suggestions: [improvements to consider]
```

### 6.2 Post-Execution Validation Template

```
Validate the executed changes:

Changes made: {changes}
Build output: {build}
Test output: {tests}

Verify:
1. Build passed without errors
2. No TypeScript errors introduced
3. Tests pass (or were updated appropriately)
4. No regressions in affected areas
5. Mobile checks pass (44px, dark mode, safe areas)

Output:
- success: true/false
- issues: [any problems found]
- next_steps: [what to do if issues found]
```

---

## Usage Notes

### Token Efficiency
- Templates are designed for minimal token usage
- Structured output reduces parsing overhead
- Tables preferred over prose for file lists

### Context Window Management
- Front-load critical information
- Use hierarchical summarization for long contexts
- Truncate low-relevance content

### Accuracy Maximization
- Include confidence scores in all outputs
- Flag uncertainty for human review
- Cross-reference multiple sources

### Project Alignment
- All templates reference GenHub conventions
- Blocking rules are baked into validation
- Skill mappings are enforced
