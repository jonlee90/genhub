---
allowed-tools: all
description: "Implement epic specifications with automated review and testing"
---

# /kc:impl - Implement task specifications with automated review and testing

## Purpose

Implement task specifications with automated review and testing.

## Usage

```
/kc:impl [task-number]
```

## Arguments

- `task-number` - task number (e.g., 0001, 0002, etc.).

## Execution

Based on the task file, find out what agents are needed to implement the task. If Supabase/ database / sql / NextJS actions / API, use @agent-supabase-nextjs-expert. If web frontend, use @agent-frontend-expert. Otherwise, use @general-purpose agent.

Code reviewer shall use @agent-code-reviewer.

1. find the right task file under ./docs/specs/{feature-name}/tasks/. Read it carefully.
2. Think hard to form a plan for the implementation.
3. Review the code with @agent-code-reviewer. If the code is not working as expected, fix the code and repeat the process.
4. Update the task file to reflect the changes.