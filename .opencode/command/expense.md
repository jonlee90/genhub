---
description: Outline GenHub expense workflow, receipt OCR, and approvals
tags:
  - genhub
  - expenses
  - domain
dependencies:
  - subagent:genhub-domain-ops
  - subagent:genhub-supabase
---

# GenHub Expense Workflow

**Arguments**: `$ARGUMENTS`

Provide an expense processing plan including receipt OCR and approval rules.

## Workflow
1. Clarify expense types and approval roles
2. Map status flow and validation requirements
3. Identify schema/actions and RLS checks
4. Define acceptance criteria and risks

## Output
- Expense lifecycle flow
- Schema + server action checklist
- Approval and security notes
