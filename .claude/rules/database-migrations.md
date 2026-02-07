---
paths:
  - "supabase/migrations/**/*.sql"
  - "supabase/**/*.sql"
---

# Database Migration Rules

## Blocking
- Load `postgres-best-practices:postgres-best-practices` skill BEFORE editing
- Delegate to `backend-engineer` agent only
- NEVER edit already-applied migrations (2024*, 2025*)

## Patterns
- Always include RLS policies with `company_id` filter
- Run `npm run db:gen-types` after applying migrations
- Use `mcp__supabase__apply_migration` for new migrations
- Test with `mcp__supabase__execute_sql` before applying
