---
description: Design GenHub schema and RLS changes for Supabase
tags:
  - genhub
  - supabase
  - schema
dependencies:
  - subagent:genhub-supabase
---

# GenHub Schema & RLS Design

**Arguments**: `$ARGUMENTS`

Create or update database schema proposals for GenHub.

## Workflow
1. Identify impacted tables/enums
2. Define required columns and relations
3. Draft RLS policies and ownership checks
4. Outline server action changes (auth + Zod validation)

## Output
- Table/column changes
- RLS policy summary
- Server action checklist
