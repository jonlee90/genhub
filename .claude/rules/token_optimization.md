# Token Optimization Rules

**CRITICAL:** Follow these rules to minimize token usage in all conversations.

---

## 1. Use Targeted Grep Instead of Full Reads

**NEVER do this:**
```
Read("/path/to/large-file.tsx")  // Reads entire file (3,000 tokens)
```

**ALWAYS do this:**
```
// First, search for what you need
Grep({ pattern: "specific-function", path: "/path/to/large-file.tsx", output_mode: "content", head_limit: 20 })
// Only 300 tokens

// Only if you need full context, then Read with offset/limit
Read("/path/to/large-file.tsx", { offset: 100, limit: 50 })
// Only 800 tokens instead of 3,000
```

**When to use:**
- Searching for pattern → Grep with `output_mode: "files_with_matches"` or `"content"`
- Need specific section → Read with offset/limit
- Need entire file → Read (but ask: do I really need the whole file?)

**Savings:** 90% reduction

---

## 3. Use `head_limit` and `offset` in Grep

**NEVER do this:**
```
Grep({ pattern: "error", output_mode: "content" })
// Returns ALL 500 matches = 5,000 tokens
```

**ALWAYS do this:**
```
Grep({
  pattern: "error",
  output_mode: "content",
  head_limit: 10  // Only first 10 matches = 500 tokens
})

// For pagination:
Grep({
  pattern: "error",
  output_mode: "content",
  offset: 10,      // Skip first 10
  head_limit: 10   // Get next 10
})
```

**Rules:**
- Default `head_limit: 20` for content searches
- Use `output_mode: "files_with_matches"` when you only need file paths
- Use `output_mode: "count"` when you only need match counts

**Savings:** 90% reduction for large result sets

---

## 4. Batch File Operations

**NEVER do this:**
```
Message 1: Read("file1.tsx")
Message 2: Read("file2.tsx")
Message 3: Read("file3.tsx")
// 3 separate messages = overhead
```

**ALWAYS do this:**
```
// Single message with multiple parallel tool calls
// Call Read, Grep, Edit in same response when independent
```

**Rules:**
- Batch independent operations in single message
- Use parallel tool calls when operations don't depend on each other
- Sequential only when later calls need results from earlier ones

**Savings:** Reduces message overhead

---

## 5. Use `limit` and `offset` When Reading Large Files

**NEVER do this:**
```
Read("/Users/.../tasks.md")
// 1,673 lines = 6,000 tokens
```

**ALWAYS do this:**
```
// If you know the section you need:
Read("/Users/.../tasks.md", { offset: 900, limit: 100 })
// Only 400 tokens

// Or use Grep first to find location:
Grep({ pattern: "Phase 4", path: "tasks.md", output_mode: "content", -n: true })
// Then Read that specific section
```

**When to use offset/limit:**
- Large specification files (>500 lines)
- Log files
- Build output
- When you know rough line numbers

**Savings:** 90%+ for large files

---

## 6. Suppress Verbose Build Output

**NEVER do this:**
```
Bash("npm run build")
// Returns 5,000 lines = 8,000 tokens
```

**ALWAYS do this:**
```
// Filter to only relevant output
Bash("npm run build 2>&1 | grep -E 'Compiled|Failed|Error:' | tail -20")
// Returns 20 lines = 500 tokens

// Or check specific status:
Bash("npm run build 2>&1 | tail -30")  // Last 30 lines only

// For TypeScript check:
Bash("npm run lint:ts 2>&1 | grep -A 2 'error TS' | head -30")
```

**Rules:**
- Always pipe build commands through grep/tail/head
- Only show errors and final status
- If user needs full output, they can ask specifically

**Common filters:**
- `grep -E "Compiled|Failed|Error:"` - Build status only
- `tail -30` - Last 30 lines
- `head -50` - First 50 lines
- `grep "error TS"` - Only TypeScript errors

**Savings:** 90% reduction on build commands

---

## 9. Create Concise Documentation

**NEVER do this:**
```markdown
# Very Detailed Report

## Section 1: Introduction
Lorem ipsum dolor sit amet, consectetur adipiscing elit...
[500 words of introduction]

## Section 2: Implementation Details
[Full code snippets with 200 lines of code]

## Section 3: Line-by-Line Explanation
Line 1: This line imports React...
Line 2: This line defines a component...
[Repeating obvious information]

Total: 4,500 tokens
```

**ALWAYS do this:**
```markdown
# Concise Summary

## Changes
- Added PhaseFilter component (290 lines)
- Created TaskLinker modal
- Fixed icon import error

## Files Modified
- `components/spatial/PhaseFilter.tsx` (new)
- `components/tasks/TaskCard.tsx` (line 8, 375)

## Testing
See: PHASE4_TESTING_CHECKLIST.md

Total: 1,200 tokens
```

**Rules:**
- Bullet points over paragraphs
- File paths over full code snippets
- Links to files instead of copying code
- Only include non-obvious information
- User can read the code themselves

**Savings:** 60-70% reduction

---

## 10. Skip Unnecessary Type Generation Steps

**NEVER do this:**
```
// In conversation, show:
Bash("npx supabase gen types typescript --project-id XXX > types/database.types.ts")
// Then show full output (2,000 tokens)
```

**ALWAYS do this:**
```
// Just tell user to run it:
"After applying migrations, regenerate types:
npx supabase gen types typescript --project-id fozwbpqgkcduwxqvmkjd > types/database.types.ts"

// Don't actually run it in conversation
```

**When to skip:**
- Type generation (user runs manually)
- Large file downloads
- Database dumps
- Log file generation
- Any operation that produces >1000 lines of output

**Savings:** 2,000+ tokens per skipped operation

---

## Automation: Pre-Flight Checklist

Before ANY operation, ask:

1. **Do I need the whole file?** → Use Grep or Read with offset/limit
2. **Can I batch this?** → Combine multiple operations in one message
3. **Will this produce verbose output?** → Add grep/tail/head filters
4. **Do I need to generate files?** → Tell user to run manually
5. **Is this documentation?** → Keep it concise, use bullet points

---

## Examples: Before & After

### Example 1: Finding a component

**BEFORE (2,500 tokens):**
```
Read("components/tasks/TaskCard.tsx")  // 2,000 tokens
Read("components/tasks/TaskList.tsx")  // 1,500 tokens
Read("components/tasks/TaskBoard.tsx") // 1,800 tokens
```

**AFTER (300 tokens):**
```
Grep({
  pattern: "TaskCard",
  glob: "components/**/*.tsx",
  output_mode: "files_with_matches"
})  // 100 tokens

// Then read only the found file
Read("components/tasks/TaskCard.tsx", { limit: 100 })  // 200 tokens
```

### Example 2: Build verification

**BEFORE (8,000 tokens):**
```
Bash("npm run build")  // Full output: 8,000 tokens
```

**AFTER (500 tokens):**
```
Bash("npm run build 2>&1 | grep -E 'Compiled|Failed|Error:' | tail -20")  // 500 tokens
```

### Example 3: Code review

**BEFORE (6,000 tokens):**
```
Read all 6 changed files completely  // 5,000 tokens
Write detailed review with code snippets  // 3,000 tokens
Total: 8,000 tokens
```

**AFTER (1,500 tokens):**
```
Grep for specific patterns in changed files  // 500 tokens
Write concise bullet-point review  // 1,000 tokens
Total: 1,500 tokens
```

---

## Enforcement

**These rules are MANDATORY, not suggestions.**

If you catch yourself about to:
- Read a file >500 lines without offset/limit → STOP, use Grep or offset/limit
- Run build without filters → STOP, add grep/tail
- Write documentation >2000 tokens → STOP, make it concise

**Target efficiency:**
- Simple tasks: <2,000 tokens
- Medium tasks: <5,000 tokens
- Complex tasks: <15,000 tokens

---

## Token Budget Per Operation

| Operation | Max Tokens | How to Achieve |
|-----------|------------|----------------|
| File search | 200 | Grep with files_with_matches |
| Code inspection | 500 | Grep with head_limit or Read with offset/limit |
| Build check | 500 | Bash with grep/tail filters |
| Bug fix | 1,000 | Targeted Grep + minimal Read |
| Documentation | 1,500 | Bullet points, file links only |
| Code review | 2,000 | Focused on changed lines only |

**If you exceed these budgets, you're doing something wrong. Optimize.**
