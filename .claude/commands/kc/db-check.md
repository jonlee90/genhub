---
allowed-tools: mcp__supabase__list_tables, mcp__supabase__get_advisors, mcp__supabase__execute_sql, mcp__supabase__generate_typescript_types
description: "Check database security and performance, regenerate types"
---

# /kc:db-check - Database health check

## Purpose
Run comprehensive database checks for security vulnerabilities, performance issues, and type synchronization.

## Execution

1. **List all tables and check schema**:
```
mcp__supabase__list_tables
```

2. **Run security advisors**:
```
mcp__supabase__get_advisors type: "security"
```

3. **Run performance advisors**:
```
mcp__supabase__get_advisors type: "performance"
```

4. **Check RLS status on all tables**:
```sql
SELECT schemaname, tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public';
```

5. **Regenerate TypeScript types**:
```
mcp__supabase__generate_typescript_types
```
Save to `types/database.types.ts`

## Output Format

```markdown
# Database Health Check

## Tables
| Table | RLS Enabled | Policies |
|-------|-------------|----------|
| ... | Yes/No | [count] |

## Security Issues
| Severity | Issue | Table | Remediation |
|----------|-------|-------|-------------|
| ... | ... | ... | [link] |

## Performance Issues
| Severity | Issue | Table | Remediation |
|----------|-------|-------|-------------|
| ... | ... | ... | [link] |

## TypeScript Types
- Status: Updated/Failed
- Location: types/database.types.ts

## Recommendations
1. [Action items based on findings]
```
