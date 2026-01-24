# GenHub Quality Standards

## Code Quality
- Follow modular, functional patterns from core code-quality standards
- Keep functions small and testable
- Use `@/` imports and explicit types for public APIs

## Security
- Enforce Supabase RLS for all sensitive tables
- Server actions must manually verify company ownership (server client bypasses RLS)
- Validate inputs at boundaries with Zod
- Avoid cross-schema PostgREST joins (`public` ↔ `next_auth`)

## Performance
- Apply `vercel-react-best-practices` for React/Next.js reviews
- Prefer server components when possible
- Use `Promise.all` for parallel data fetching
- Split heavy UI with `next/dynamic`
- Use virtualization for large lists
- Use deferred loading for non-critical data

## UI/UX
- Always use `BaseModal` for modals
- Use blueprint grid background and industrial headers for `/app/*` pages
- Apply construction color palette and typography rules
- Touch targets must be 44px minimum

## Review Checklist
- RLS and ownership checks present
- No sensitive fields sent to client components
- Cross-schema joins avoided
- Performance bottlenecks flagged
- Error handling is explicit and user-safe
