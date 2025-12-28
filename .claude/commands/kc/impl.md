---
allowed-tools: all
description: "Implement epic specifications with automated review and testing"
---

# /kc:impl - Implement Task Specifications

## Purpose

Implement task specifications from design documents with proper agent delegation, automated review, and testing.

## Usage

```
/kc:impl [task-number]
```

## Arguments

- `task-number` - Task number (e.g., 0001, 0002, etc.) or task file path.

## Agent Selection Guide

### Primary Agents (4 Core Agents)

| Agent | Use For |
|-------|---------|
| **@agent-frontend-architect** | UI planning, component architecture, Aceternity UI research. Creates plans only - does NOT write code. Use BEFORE complex UI features. |
| **@agent-frontend-builder** | UI implementation. Uses `frontend-design` plugin. Use AFTER architect creates plan, or for simple UI tasks. |
| **@agent-backend-engineer** | Supabase database, Server Actions, API routes, authentication, RLS policies. ALWAYS uses MCP Supabase. |
| **@agent-code-reviewer** | Code review, debugging, testing, security audits. Run AFTER implementations. |

### Specialized Agents (Use When Needed)

| Agent | Use For |
|-------|---------|
| **@agent-supabase-nextjs-expert** | Complex Supabase + Next.js integration patterns |
| **@agent-ai-sdk-v5-expert** | Vercel AI SDK v5 integration |
| **@agent-kiro-executor** | Execute from detailed spec documents |
| **@agent-technical-documentation-writer** | User manuals, tutorials, guides |

## Execution Flow

### Step 1: Find & Read Task File
```
Location: ./docs/specs/{feature-name}/tasks/
Example: ./docs/specs/project-card-redesign/tasks/0001-redesign-card.md
```

### Step 2: Determine Agent(s) Needed

**For Database/Backend Work:**
```
1. @agent-backend-engineer → Implements with MCP Supabase
2. @agent-code-reviewer → Security audit
```

**For Complex UI Features:**
```
1. @agent-frontend-architect → Creates plan in .claude/docs/ui-plans/
2. @agent-frontend-builder → Implements using frontend-design plugin
3. @agent-code-reviewer → Reviews and fixes issues
```

**For Simple UI Changes:**
```
1. @agent-frontend-builder → Direct implementation with plugin
2. @agent-code-reviewer → Quick review
```

**For Full-Stack Features:**
```
1. @agent-backend-engineer → Database + Server Actions
2. @agent-frontend-architect → UI planning (if complex)
3. @agent-frontend-builder → UI implementation
4. @agent-code-reviewer → Full review
```

### Step 3: Implement
- Use appropriate agent(s) based on task requirements
- Follow construction theme colors (#001B51 navy blue, #3C3C3C dark gray)
- Add debug console.log statements
- Ensure TypeScript types are correct

### Step 4: Review
- Always run @agent-code-reviewer after implementation
- Fix any issues identified
- Verify build passes with `/kc:build`

### Step 5: Update Task File
- Mark completed items
- Document any deviations from original spec
- Note any follow-up tasks needed

## Example Workflow

```
User: /kc:impl 0001

Claude:
1. Read task file: ./docs/specs/dashboard/tasks/0001-add-stats-widget.md
2. Task requires: Database query + UI component
3. Launch @agent-backend-engineer for database function
4. Launch @agent-frontend-builder for UI component
5. Launch @agent-code-reviewer for final review
6. Update task file with completion status
```

## Quick Reference

| Task Type | Primary Agent | Support Agent |
|-----------|---------------|---------------|
| Database/RLS | backend-engineer | code-reviewer |
| Server Actions | backend-engineer | code-reviewer |
| Complex UI | frontend-architect → frontend-builder | code-reviewer |
| Simple UI | frontend-builder | code-reviewer |
| API Routes | backend-engineer | code-reviewer |
| Auth/Security | backend-engineer | code-reviewer |
| Documentation | technical-documentation-writer | - |
