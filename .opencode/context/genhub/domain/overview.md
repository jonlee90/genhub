# GenHub Domain Overview

## Purpose
GenHub is a construction management SaaS that supports project delivery from
planning through completion. It combines task workflows, materials tracking,
expenses, spatial/3D coordination, and client visibility.

## Core Personas
- General contractors
- Project managers
- Field workers
- Subcontractors
- Clients

## Primary Domains
- Projects & phases
- Tasks and task dependencies
- Materials and receipts (Home Depot integration)
- Expenses and approvals
- Spatial models and 3D markers
- Chat and notifications

## System Patterns (from `.claude/docs`)
- Server actions use `getUserContext()` for auth + company scope checks
- Server client bypasses RLS, so ownership must be verified manually
- PostgREST cannot join `public` ↔ `next_auth` schemas
- Use `user_profiles` when client-visible user data is required

## UI/UX Conventions
- Always use `BaseModal` for modals
- Pages follow the blueprint grid + industrial header layout
- Mobile-first, 44px minimum touch targets

## Performance Priorities
- Prefer server components when possible
- Virtualize long lists and split heavy components
- Use deferred loading for non-critical data
