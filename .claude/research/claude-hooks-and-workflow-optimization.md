# Research: Claude Code Hooks & CLAUDE.md Workflow Optimization

> Date: 2026-02-07 | Project: GenHub PWA

---

## Part 1: Top Trending Claude Code Hooks (2025-2026)

### What Are Hooks?

Claude Code hooks are **user-defined shell commands or LLM prompts that execute automatically at specific lifecycle events**. They provide deterministic control over Claude's behavior -- ensuring actions always happen rather than relying on probabilistic tool use.

### All 14 Hook Lifecycle Events

| Event | When It Fires |
|-------|---------------|
| `SessionStart` | Session begins or resumes |
| `UserPromptSubmit` | Before Claude processes your prompt |
| `PreToolUse` | Before any tool executes (can block it) |
| `PermissionRequest` | When permission dialog appears |
| `PostToolUse` | After a tool succeeds |
| `PostToolUseFailure` | After a tool fails |
| `Notification` | When Claude needs attention |
| `SubagentStart` | When a subagent spawns |
| `SubagentStop` | When a subagent finishes |
| `Stop` | When Claude finishes responding |
| `TeammateIdle` | When agent team teammate goes idle |
| `TaskCompleted` | When marking task complete |
| `PreCompact` | Before context compaction |
| `SessionEnd` | When session terminates |

---

### Top 10 Trending Hooks

#### 1. Auto-Format Code After Edits (Most Popular)

Runs Prettier/Ruff every time Claude writes a file. Eliminates formatting inconsistency.

```json
{
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Edit|Write",
        "hooks": [
          {
            "type": "command",
            "command": "jq -r '.tool_input.file_path' | xargs npx prettier --write 2>/dev/null || true"
          }
        ]
      }
    ]
  }
}
```

**GenHub status**: Already implemented via `formatter.sh`

---

#### 2. Run Tests Automatically After Edits

Execute test suites immediately after file changes. The `async: true` flag (Jan 2026) lets Claude continue working while tests run in background.

```json
{
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Write|Edit",
        "hooks": [
          {
            "type": "command",
            "command": "npm test --silent",
            "async": true,
            "timeout": 300
          }
        ]
      }
    ]
  }
}
```

**GenHub status**: NOT implemented -- high-value addition

---

#### 3. Protect Sensitive Files

Block Claude from editing `.env`, `package-lock.json`, migrations, etc.

```bash
#!/bin/bash
# .claude/hooks/protect-files.sh
INPUT=$(cat)
FILE_PATH=$(echo "$INPUT" | jq -r '.tool_input.file_path // empty')

PROTECTED_PATTERNS=(".env" "package-lock.json" ".git/" ".npmrc" "credentials")

for pattern in "${PROTECTED_PATTERNS[@]}"; do
  if [[ "$FILE_PATH" == *"$pattern"* ]]; then
    echo "Blocked: $FILE_PATH matches protected pattern '$pattern'" >&2
    exit 2
  fi
done
exit 0
```

```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Edit|Write",
        "hooks": [{ "type": "command", "command": "\"$CLAUDE_PROJECT_DIR\"/.claude/hooks/protect-files.sh" }]
      }
    ]
  }
}
```

**GenHub status**: Partially implemented (deny_check.sh covers bash, but no file-level protection)

---

#### 4. Block Destructive Commands

Prevent `rm -rf`, `DROP TABLE`, and other dangerous operations.

```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Bash",
        "hooks": [
          {
            "type": "command",
            "command": "jq -r '.tool_input.command' | grep -qE '(rm -rf|DROP TABLE|DELETE FROM|truncate)' && exit 2 || exit 0"
          }
        ]
      }
    ]
  }
}
```

**GenHub status**: Implemented via `deny_check.sh`

---

#### 5. Desktop Notifications

Get notified when Claude needs permission or finishes work.

```json
{
  "hooks": {
    "Notification": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "notify-send 'Claude Code' 'Needs your attention'"
          }
        ]
      }
    ],
    "Stop": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "afplay /System/Library/Sounds/Funk.aiff"
          }
        ]
      }
    ]
  }
}
```

**GenHub status**: Already implemented

---

#### 6. Git Safety Checkpoints

Auto-create temporary commits before major changes for safe rollback.

```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Edit|Write",
        "hooks": [
          {
            "type": "command",
            "command": "git add -A && git commit -m \"[Claude Backup] $(date +%s)\" 2>/dev/null || true"
          }
        ]
      }
    ]
  }
}
```

**GenHub status**: Partially implemented (stop-hook-git-check.sh runs on Stop)

---

#### 7. Input Tool Modification (PreToolUse v2.0.10+)

Intercept and fix tool calls before execution instead of blocking.

```bash
#!/bin/bash
# Normalize commands: convert grep to rg for better performance
INPUT=$(cat)
COMMAND=$(echo "$INPUT" | jq -r '.tool_input.command')
UPDATED=$(echo "$COMMAND" | sed 's/^grep /rg /g')

if [ "$COMMAND" != "$UPDATED" ]; then
  echo "{
    \"hookSpecificOutput\": {
      \"hookEventName\": \"PreToolUse\",
      \"permissionDecision\": \"allow\",
      \"updatedInput\": { \"command\": \"$UPDATED\" }
    }
  }"
else
  exit 0
fi
```

**GenHub status**: NOT implemented -- innovative pattern

---

#### 8. Context Re-injection After Compaction

When Claude's context fills up and compaction happens, re-inject critical project context.

```json
{
  "hooks": {
    "PreCompact": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "echo 'Critical: Use Server Actions for DB. ResponsiveModal only. Lucide icons only. 44px touch targets.'"
          }
        ]
      }
    ]
  }
}
```

**GenHub status**: NOT implemented -- would prevent rule amnesia

---

#### 9. Prompt-Based Hooks (AI-Powered)

Use Claude Haiku to make decisions instead of shell scripts.

```json
{
  "hooks": {
    "Stop": [
      {
        "hooks": [
          {
            "type": "prompt",
            "prompt": "Check if all requested tasks are complete. If not, list remaining work. $ARGUMENTS",
            "timeout": 30
          }
        ]
      }
    ]
  }
}
```

**GenHub status**: NOT implemented -- would catch incomplete work

---

#### 10. Agent-Based Hooks (Most Powerful, Jan 2026)

Spawn a full subagent that can read files and run commands to verify conditions.

```json
{
  "hooks": {
    "Stop": [
      {
        "hooks": [
          {
            "type": "agent",
            "prompt": "Verify: 1) Build passes 2) No new TypeScript errors 3) All modified files have tests. $ARGUMENTS",
            "timeout": 120
          }
        ]
      }
    ]
  }
}
```

**GenHub status**: NOT implemented -- highest-value hook type

---

### Hook Best Practices

| Practice | Details |
|----------|---------|
| Use `$CLAUDE_PROJECT_DIR` | Absolute paths with env vars for portability |
| Exit codes matter | `0` = allow, `2` = block (show stderr), other = non-blocking |
| Parse JSON with `jq` | `jq -r '.tool_input.file_path // empty'` |
| Set timeouts | Quick validation: 10s, Tests: 120s, Long ops: 300s |
| Use `async: true` | For long-running tasks that shouldn't block Claude |
| Organize by scope | Global: `~/.claude/settings.json`, Project: `.claude/settings.json`, Local: `.claude/settings.local.json` |
| Filter shell profile output | Wrap `echo` in `[[ $- == *i* ]]` to prevent JSON parsing errors |

---

## Part 2: Top 10 Ways to Enhance Your CLAUDE.md Workflow

### Current Assessment: 8.5/10

GenHub has an exceptionally mature setup -- clear governance, comprehensive docs, well-defined agent dispatch, and good hook coverage. These 10 enhancements would push it to a reference-grade implementation.

---

### Enhancement 1: Adopt Path-Specific Rules (`.claude/rules/`)

**Problem**: Monolithic CLAUDE.md loads all rules for every task, wasting tokens on irrelevant context.

**Solution**: Use `.claude/rules/` with frontmatter path matching. Rules load **only when editing matching files**.

```markdown
# .claude/rules/react-components.md
---
paths:
  - "components/**/*.tsx"
  - "app/**/*.tsx"
---

# React Component Rules
- Use ResponsiveModal, not Dialog
- Lucide icons only
- 44px minimum touch targets
- Always include dark: variants
```

```markdown
# .claude/rules/server-actions.md
---
paths:
  - "app/actions/**/*.ts"
---

# Server Action Rules
- Always call auth() first
- Use createClient from @/utils/supabase/server
- Include company_id in all RLS queries
```

**Impact**: 40-60% token reduction at startup. Rules auto-apply when editing matching files.

**Current gap**: All rules inline in CLAUDE.md (~200 lines loaded every session regardless of task type).

---

### Enhancement 2: Implement PreCompact Hook for Rule Persistence

**Problem**: When context compacts (long sessions), Claude "forgets" critical CLAUDE.md rules like "Server Actions for DB" or "ResponsiveModal only".

**Solution**: PreCompact hook re-injects the non-negotiable rules.

```json
{
  "hooks": {
    "PreCompact": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "cat \"$CLAUDE_PROJECT_DIR\"/.claude/hooks/critical-rules.txt"
          }
        ]
      }
    ]
  }
}
```

```text
# .claude/hooks/critical-rules.txt
CRITICAL RULES (re-injected after compaction):
- DB access: Server Actions ONLY (never in 'use client')
- Modals: ResponsiveModal ONLY (never raw Dialog)
- Icons: Lucide ONLY
- Touch targets: 44px minimum (min-h-[44px] min-w-[44px])
- Skills: Load vercel-react-best-practices before ANY .tsx edit
- Agent boundary: frontend-engineer NEVER touches database
```

**Impact**: Prevents the most common post-compaction violations.

---

### Enhancement 3: Add Agent Stop Hook for Task Verification

**Problem**: No automated verification that work is complete and correct before Claude stops.

**Solution**: Use an agent-type Stop hook that verifies build, types, and completeness.

```json
{
  "hooks": {
    "Stop": [
      {
        "hooks": [
          {
            "type": "prompt",
            "prompt": "Before stopping, verify: 1) Were all requested changes made? 2) Did we follow the output format (Status, Files, Skills Applied, Mobile Checks, Build)? 3) Are there any TODO items still in_progress? If anything is incomplete, list what remains. $ARGUMENTS",
            "timeout": 30
          }
        ]
      }
    ]
  }
}
```

**Impact**: Catches incomplete work, missing output format compliance, and forgotten tasks.

---

### Enhancement 4: Slim Down CLAUDE.md with Progressive Disclosure

**Problem**: Current CLAUDE.md is comprehensive but loads ~200 lines of instructions at startup every session, consuming tokens even for simple tasks.

**Solution**: Three-tier architecture.

**Tier 1 -- CLAUDE.md (loaded every session, <80 lines)**:
- Build/test/lint commands
- Blocking rules (table format, concise)
- Agent dispatch (quick reference)
- Design tokens
- Links to deeper docs

**Tier 2 -- `.claude/rules/*.md` (loaded on-demand by file path)**:
- React component rules
- Server Action rules
- Migration rules
- Testing rules

**Tier 3 -- Skills & docs (loaded explicitly when needed)**:
- Detailed workflows
- Architecture docs
- Dependency graphs

**Impact**: 50-60% startup token reduction. From ~2,100 tokens to ~800 tokens.

---

### Enhancement 5: Add Async Test Runner Hook

**Problem**: No automatic test execution after code changes. Regressions caught late.

**Solution**: PostToolUse hook that runs tests in background after edits.

```json
{
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Write|Edit",
        "hooks": [
          {
            "type": "command",
            "command": "\"$CLAUDE_PROJECT_DIR\"/.claude/hooks/run-tests-for-file.sh",
            "async": true,
            "timeout": 120
          }
        ]
      }
    ]
  }
}
```

```bash
#!/bin/bash
# .claude/hooks/run-tests-for-file.sh
INPUT=$(cat)
FILE_PATH=$(echo "$INPUT" | jq -r '.tool_input.file_path // empty')

# Only run tests for source files, not configs
if [[ "$FILE_PATH" == *.tsx ]] || [[ "$FILE_PATH" == *.ts ]]; then
  # Find and run related test file
  TEST_FILE=$(echo "$FILE_PATH" | sed 's/\.tsx\?$/.test&/')
  if [[ -f "$TEST_FILE" ]]; then
    npx jest "$TEST_FILE" --silent 2>&1 | tail -20
  fi
fi
exit 0
```

**Impact**: Instant feedback on regressions without blocking Claude's workflow.

---

### Enhancement 6: Implement File Protection Hook

**Problem**: No guardrails preventing Claude from editing sensitive files (`.env`, `package-lock.json`, migration files already applied).

**Solution**: PreToolUse hook with project-specific protected file patterns.

```bash
#!/bin/bash
# .claude/hooks/protect-files.sh
INPUT=$(cat)
FILE_PATH=$(echo "$INPUT" | jq -r '.tool_input.file_path // empty')

PROTECTED=(
  ".env"
  ".env.local"
  "package-lock.json"
  "pnpm-lock.yaml"
  ".git/"
  "supabase/migrations/2024"  # Already-applied migrations
  "supabase/migrations/2025"
)

for pattern in "${PROTECTED[@]}"; do
  if [[ "$FILE_PATH" == *"$pattern"* ]]; then
    echo "BLOCKED: Cannot edit '$FILE_PATH' (matches protected pattern '$pattern')" >&2
    exit 2
  fi
done
exit 0
```

**Impact**: Prevents accidental edits to lock files, env files, and applied migrations.

---

### Enhancement 7: Add Automated Mobile/A11y Verification Hook

**Problem**: Mobile checks (44px, active states, dark mode, safe areas) are self-reported by agents with no validation.

**Solution**: PostToolUse hook that scans modified TSX files for compliance.

```bash
#!/bin/bash
# .claude/hooks/mobile-check.sh
INPUT=$(cat)
FILE_PATH=$(echo "$INPUT" | jq -r '.tool_input.file_path // empty')

if [[ "$FILE_PATH" != *.tsx ]]; then exit 0; fi

ISSUES=""

# Check for buttons/links missing min touch target
if grep -qE '<(Button|button|Link|a)\b' "$FILE_PATH"; then
  if ! grep -q 'min-h-\[44px\]\|min-h-11\|h-11\|h-12\|h-14' "$FILE_PATH"; then
    ISSUES="${ISSUES}\n- WARNING: $FILE_PATH has clickable elements without 44px min touch target"
  fi
fi

# Check for hover without active
if grep -q 'hover:' "$FILE_PATH"; then
  if ! grep -q 'active:' "$FILE_PATH"; then
    ISSUES="${ISSUES}\n- WARNING: $FILE_PATH has hover: states but no active: states"
  fi
fi

if [[ -n "$ISSUES" ]]; then
  echo -e "Mobile/A11y issues found:$ISSUES" >&2
  exit 0  # Non-blocking warning
fi
exit 0
```

**Impact**: Catches mobile compliance gaps automatically rather than relying on self-reporting.

---

### Enhancement 8: Create Spec Phase Approval Markers

**Problem**: Spec phases (requirements -> design -> tasks) require manual approval with no clear tracking of what's been approved.

**Solution**: Marker files + PreToolUse hook that enforces phase sequence.

```
.claude/specs/{feature}/
  requirements.md
  requirements.APPROVED     # Created after approval
  design.md
  design.APPROVED           # Created after approval
  tasks.md
  tasks.APPROVED            # Created after approval
```

Add to `/kc:impl` skill:
```
Before implementing any task, verify:
1. requirements.APPROVED exists
2. design.APPROVED exists
3. tasks.APPROVED exists
If any are missing, STOP and report which approval is needed.
```

**Impact**: Prevents premature implementation and ensures all phases complete in order.

---

### Enhancement 9: Leverage Auto Memory for Cross-Session Learning

**Problem**: MEMORY.md is currently empty. Learnings from complex tasks are lost between sessions.

**Solution**: Populate MEMORY.md with structured project knowledge and use the `post-task-learning` skill consistently.

```markdown
# MEMORY.md - GenHub Project Memory

## Architecture Decisions
- Server Actions pattern: all DB via app/actions/*.ts
- ResponsiveModal wraps Radix Dialog for mobile
- Company-scoped RLS on every table

## Common Gotchas
- Supabase client NEVER in 'use client' components
- Must run `npm run db:gen-types` after migration
- Playwright tests need running dev server

## Patterns That Work
- Skill pre-loading catches 90% of style violations
- Agent dispatch (backend -> frontend -> review) prevents boundary crossing
- PostToolUse formatter hook eliminates formatting PRs

## Recently Learned
- [Updated each session by post-task-learning skill]
```

**Impact**: Each session starts with accumulated project wisdom instead of from scratch.

---

### Enhancement 10: Consolidate and Optimize Hook Pipeline

**Problem**: Current hooks are split across global (`~/.claude/settings.json`) and project settings with some overlap. No centralized view.

**Solution**: Consolidated hook architecture with clear purpose for each.

```json
{
  "hooks": {
    "SessionStart": [
      {
        "hooks": [{ "type": "command", "command": "cat \"$CLAUDE_PROJECT_DIR\"/.claude/hooks/session-context.txt" }]
      }
    ],
    "PreToolUse": [
      {
        "matcher": "Edit|Write",
        "hooks": [{ "type": "command", "command": "\"$CLAUDE_PROJECT_DIR\"/.claude/hooks/protect-files.sh" }]
      },
      {
        "matcher": "Bash",
        "hooks": [{ "type": "command", "command": "\"$CLAUDE_PROJECT_DIR\"/.claude/hooks/deny-dangerous.sh" }]
      }
    ],
    "PostToolUse": [
      {
        "matcher": "Edit|Write",
        "hooks": [
          { "type": "command", "command": "\"$CLAUDE_PROJECT_DIR\"/.claude/hooks/formatter.sh" },
          { "type": "command", "command": "\"$CLAUDE_PROJECT_DIR\"/.claude/hooks/mobile-check.sh" },
          { "type": "command", "command": "\"$CLAUDE_PROJECT_DIR\"/.claude/hooks/run-tests-for-file.sh", "async": true, "timeout": 120 }
        ]
      }
    ],
    "PreCompact": [
      {
        "hooks": [{ "type": "command", "command": "cat \"$CLAUDE_PROJECT_DIR\"/.claude/hooks/critical-rules.txt" }]
      }
    ],
    "Stop": [
      {
        "hooks": [
          { "type": "prompt", "prompt": "Verify all tasks complete and output format followed. $ARGUMENTS", "timeout": 30 },
          { "type": "command", "command": "\"$CLAUDE_PROJECT_DIR\"/.claude/hooks/git-safety.sh" },
          { "type": "command", "command": "afplay /System/Library/Sounds/Funk.aiff 2>/dev/null || true" }
        ]
      }
    ],
    "Notification": [
      {
        "hooks": [{ "type": "command", "command": "afplay /System/Library/Sounds/Funk.aiff 2>/dev/null || true" }]
      }
    ]
  }
}
```

**Impact**: Single source of truth for all hooks, clear pipeline, no duplicates.

---

## Part 3: Implementation Priority Matrix

| # | Enhancement | Impact | Effort | Priority |
|---|-------------|--------|--------|----------|
| 1 | Path-specific rules | High (token savings) | Medium | P0 |
| 2 | PreCompact rule re-injection | High (prevents violations) | Low | P0 |
| 3 | Stop hook task verification | High (catches incomplete work) | Low | P0 |
| 4 | Slim CLAUDE.md progressive disclosure | High (token savings) | Medium | P1 |
| 5 | Async test runner | Medium (early regression catch) | Medium | P1 |
| 6 | File protection hook | Medium (prevents accidents) | Low | P1 |
| 7 | Mobile/a11y verification hook | Medium (automated compliance) | Medium | P2 |
| 8 | Spec approval markers | Medium (workflow clarity) | Low | P2 |
| 9 | Auto memory population | High (cross-session learning) | Low | P0 |
| 10 | Consolidated hook pipeline | Medium (maintainability) | Medium | P1 |

---

## Sources

- [Claude Code Hooks Guide](https://code.claude.com/docs/en/hooks-guide)
- [Claude Code Hooks Reference](https://code.claude.com/docs/en/hooks)
- [Claude Code Best Practices](https://code.claude.com/docs/en/best-practices)
- [Manage Claude's Memory](https://code.claude.com/docs/en/memory)
- [Manage costs effectively](https://code.claude.com/docs/en/costs)
- [DataCamp: Claude Code Hooks Practical Guide](https://www.datacamp.com/tutorial/claude-code-hooks)
- [Eesel: Complete Guide to Hooks](https://www.eesel.ai/blog/hooks-in-claude-code)
- [GitHub: claude-code-hooks-mastery](https://github.com/disler/claude-code-hooks-mastery)
- [Builder.io: Complete Guide to CLAUDE.md](https://www.builder.io/blog/claude-md-guide)
- [HumanLayer: Writing a Good CLAUDE.md](https://www.humanlayer.dev/blog/writing-a-good-claude-md)
- [Medium: Stop Wasting Tokens - Optimize Context by 60%](https://medium.com/@jpranav97/stop-wasting-tokens-how-to-optimize-claude-code-context-by-60-bfad6fd477e5)
- [ClaudeLog: Token Usage Optimization](https://claudelog.com/faqs/how-to-optimize-claude-code-token-usage/)
- [GitButler: Automate Workflows with Hooks](https://blog.gitbutler.com/automate-your-ai-workflows-with-claude-code-hooks)
