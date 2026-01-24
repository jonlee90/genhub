# Feature Delivery Process

## Goal
Ship GenHub features safely across schema, server actions, UI, and review.

## Workflow
1. Define feature scope and acceptance criteria
2. Confirm domain rules in `.claude/docs/domain/*`
3. Design data model and RLS policies
4. Implement server actions with `getUserContext()` and Zod validation
5. Build UI using layout + design system conventions
6. Apply performance patterns (virtualization, splitting, deferred loading)
7. Run code review for quality, security, and performance
8. Run tests/typechecks and finalize

## Required Outputs
- Feature spec (problem, scope, constraints)
- Data model + RLS summary
- Server action notes (auth + validation)
- UI behavior notes (layouts, mobile, offline)
- Review notes and follow-ups
