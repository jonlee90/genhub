# E1-T6: Generate TypeScript Types from Database

**Epic**: Foundation (Week 1-2)
**Effort**: Small
**References**: Design Section 3, .claude/rules/supabase_types.md

## Description

Generate TypeScript type definitions from the Supabase database schema to ensure type safety throughout the application.

## Subtasks

### 6.1 Generate Supabase TypeScript types
- Run `npx supabase gen types typescript` after migrations
- Save output to `types/database.types.ts`
- Verify all tables and enums are correctly typed
- **Refs:** Design Section 3, `.claude/rules/supabase_types.md`
- **Effort:** S
- **Files:** `types/database.types.ts`

## Acceptance Criteria

- [ ] All database tables have corresponding TypeScript interfaces
- [ ] All enum types are properly typed
- [ ] Foreign key relationships are reflected in types
- [ ] Types file compiles without errors
- [ ] Insert, Update, and Row types available for all tables

## Files to Create/Modify

- `types/database.types.ts`
