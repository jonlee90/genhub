# GenHub Backend Documentation Suite

> Comprehensive backend documentation for the GenHub Construction PWA
>
> **Generated:** 2026-02-07 | **Last Updated:** 2026-02-08 | **Total:** 8 reports, ~350KB, 10,084 lines

---

## Reports

| # | Report | Lines | Size | Description |
|---|--------|-------|------|-------------|
| 01 | [System Architecture](01-system-architecture.md) | 1,732 | 52KB | 10,000-foot view: 47 server actions, 33 API routes, auth flow, request lifecycle, multi-tenancy, cache invalidation |
| 02 | [Data Model & ERD](02-data-model.md) | 1,437 | 60KB | 54+ tables, ER diagrams by domain, column catalog, relationships, RLS policies, 33 RPC functions, enums, indexes, constraints |
| 03 | [API Catalog](03-api-catalog.md) | 1,461 | 61KB | Every server action and API route: inputs (Zod schemas), outputs, validation, error patterns, cache invalidation matrix |
| 04 | [Data Flow & Integrations](04-data-flow-integrations.md) | 1,790 | 53KB | Stripe payments, Home Depot API, KakaoTalk/Sendbird, Supabase Storage (incl. COI docs), push notifications, cron jobs |
| 05 | [Security & Access Control](05-security-access-control.md) | 1,195 | 44KB | Auth architecture, JWT sessions, RBAC (6 roles), RLS audit, multi-tenancy analysis, security recommendations |
| 06 | [Performance Optimization](06-performance-optimization.md) | 1,276 | 52KB | Query patterns, RPC gains, React.cache usage, cache invalidation gaps, index coverage, optimization signals |
| 07 | [Dependency & Impact Analysis](07-dependency-impact-analysis.md) | 1,129 | 36KB | Function consumer registry, cross-domain coupling, domain isolation scores, safe/risky refactoring zones |

---

## Quick Reference

### Finding What You Need

| If you need to... | Start with |
|-------------------|------------|
| Understand the overall system | [01 - System Architecture](01-system-architecture.md) |
| Look up a database table or column | [02 - Data Model](02-data-model.md) |
| Find an API endpoint or server action | [03 - API Catalog](03-api-catalog.md) |
| Understand an external integration | [04 - Data Flow](04-data-flow-integrations.md) |
| Review security or permissions | [05 - Security](05-security-access-control.md) |
| Optimize a slow query or page | [06 - Performance](06-performance-optimization.md) |
| Assess impact of a code change | [07 - Dependencies](07-dependency-impact-analysis.md) |

### For AI Agents

Each report includes an **Optimization Signals** section at the end, designed for AI agents to identify and propose improvements. Key areas flagged:

- **Report 02:** Missing indexes, RLS performance concerns, schema normalization opportunities
- **Report 03:** Inconsistent error handling patterns, missing cache invalidation
- **Report 05:** RLS gaps (S-001, S-002), service role bypass audit
- **Report 06:** N+1 patterns, over-fetching, materialized view refresh strategy
- **Report 07:** High-coupling zones, breaking change risk areas

---

## Related Documentation

| Resource | Purpose |
|----------|---------|
| `.claude/docs/architecture-index.md` | File placement rules, module boundaries, component counts |
| `.claude/docs/dependency-graph.md` | Critical function chains, cross-module imports, cache topology |
| `.claude/docs/context-strategy.md` | What context to load for different tasks |

---

## Statistics

- **Database:** 54+ tables, 1 materialized view (refreshed 3x), 33 RPC functions, 23 enum types, 40+ indexes
- **Backend:** 47 server actions, 33 API routes, 3 external integrations
- **Migrations:** 71 SQL migration files (Jan 3 - Feb 17, 2026)
- **Security:** RLS on all tables, 6-tier RBAC, company_id multi-tenancy isolation
