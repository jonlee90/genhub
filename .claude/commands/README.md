# GenHub Commands

Quick reference for all available `/kc:*` commands.

---

## Feature Development

### `/kc:spec {feature-name}`
Create comprehensive feature specifications.

**Usage:**
```bash
/kc:spec task-comments                 # Full workflow
/kc:spec task-comments --mode=req      # Requirements only
/kc:spec task-comments --mode=design   # Design only
/kc:spec task-comments --mode=plan     # Tasks only
```

**Output:**
- `.claude/tasks/features/{feature}/requirement.md`
- `.claude/tasks/features/{feature}/design.md`
- `.claude/tasks/features/{feature}/tasks.md`

**See:** [kc/spec.md](./kc/spec.md)

---

### `/kc:impl {task-id}`
Implement tasks from specifications.

**Usage:**
```bash
/kc:impl task-comments-001            # Implement single task
```

**Requires:** Approved spec in `.claude/tasks/features/`

**See:** [kc/impl.md](./kc/impl.md)

---

## Quality & Maintenance

### `/kc:audit {module-path}`
Comprehensive security, performance, and code quality audit.

**Usage:**
```bash
/kc:audit app/app/settings/page.tsx              # Full audit
/kc:audit app/app/dashboard/page.tsx --scope=perf # Performance only
/kc:audit app/actions/projects.ts --scope=security # Security only
```

**Checks:**
- RLS policies and auth guards
- N+1 queries and missing indexes
- Console logs and error types
- React Hook violations

**Output:**
- `.claude/reports/{module}-audit-plan-{date}.md`
- `.claude/reports/{module}-audit-{date}.md`

**See:** [kc/audit.md](./kc/audit.md)

---

### `/kc:build`
Build verification and error reporting.

**Usage:**
```bash
/kc:build                              # TypeScript + build check
```

**See:** [kc/build.md](./kc/build.md)

---

## Research & Documentation

### `/kc:research-ui {component}`
Research Aceternity UI components and patterns.

**Usage:**
```bash
/kc:research-ui animated-tabs          # Find Aceternity component
```

**See:** [kc/research-ui.md](./kc/research-ui.md)

---

### `/kc:research-ai-sdk {topic}`
Research Vercel AI SDK v5 patterns.

**Usage:**
```bash
/kc:research-ai-sdk streaming          # AI SDK research
```

**See:** [kc/research-ai-sdk.md](./kc/research-ai-sdk.md)

---

### `/kc:docs {topic}`
Documentation lookup and creation.

**Usage:**
```bash
/kc:docs database-schema              # Find docs
```

**See:** [kc/docs.md](./kc/docs.md)

---

## Standalone Commands

### `/refactor-code`
Intelligent code refactoring and pattern extraction.

**Usage:**
```bash
/refactor-code components/modals       # Refactor similar patterns
```

**See:** [refactor-code.md](./refactor-code.md)

---

### `/handoff-to-opencode`
Create handoff document for OpenCode GPT-5.2 review.

**Usage:**
```bash
/handoff-to-opencode                   # After implementation
```

**See:** [handoff-to-opencode.md](./handoff-to-opencode.md)

---

## Common Workflows

### New Feature (Spec-Driven)
```bash
1. /kc:spec feature-name              # Create spec
2. Review and approve each phase
3. /kc:impl feature-name-001          # Implement tasks
4. /kc:build                          # Verify build
5. /handoff-to-opencode               # Code review
```

### Audit Existing Module
```bash
1. /kc:audit app/app/module/page.tsx  # Run audit
2. Review findings
3. Approve fixes
4. /kc:build                          # Verify fixes
```

### Quick Research
```bash
1. /kc:research-ui component-name     # Find UI patterns
2. /kc:research-ai-sdk topic          # Find AI SDK patterns
3. /kc:docs topic                     # Find docs
```

---

## Directory Structure

```
.claude/commands/
├── README.md                         # This file
├── kc/
│   ├── spec.md                       # /kc:spec
│   ├── impl.md                       # /kc:impl
│   ├── audit.md                      # /kc:audit (NEW)
│   ├── build.md                      # /kc:build
│   ├── research-ui.md                # /kc:research-ui
│   ├── research-ai-sdk.md            # /kc:research-ai-sdk
│   └── docs.md                       # /kc:docs
├── refactor-code.md                  # /refactor-code
└── handoff-to-opencode.md            # /handoff-to-opencode
```

---

## Quick Tips

- Use tab completion: `/kc:` then tab to see available commands
- Commands are documented in their respective .md files
- All `/kc:*` commands follow consistent patterns
- Audit before major refactors: `/kc:audit` finds issues early
- Always run `/kc:build` after implementation

---

## See Also

- `.claude/CLAUDE.md` - Project rules and constraints
- `.claude/skills/` - Reusable patterns and skills
- `.claude/docs/` - Architecture documentation
- `.claude/reports/` - Audit and implementation reports
