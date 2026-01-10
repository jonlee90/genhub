# GenHub Common Gotchas

## HARD FAIL Issues

### 1. Supabase in Client Component
```
Error: Module not found: Can't resolve 'child_process'
```
**Fix**: Never import Supabase in `'use client'` - use Server Actions

### 2. Using Dialog Instead of BaseModal
**Fix**: Always use `<BaseModal>` - never `<Dialog>`

### 3. Forgetting RLS on New Tables
**Fix**: Every table needs RLS. Use `skills/database/rls-patterns.md`

## Common Mistakes

### 4. Direct Database Mutations in Components
**Wrong**: Calling Supabase directly in onClick
**Right**: Call Server Action, which calls Supabase

### 5. Missing Revalidation
**Wrong**: Mutation without `revalidatePath()`
**Right**: Always revalidate affected routes

### 6. Wrong Icon Library
**Wrong**: Using react-icons, heroicons, etc.
**Right**: Only Lucide React

### 7. Ignoring Token Budget
**Symptom**: Agent stops mid-task
**Fix**: backend-engineer 35k, frontend-engineer 45k max

## Quick Fixes

| Problem | Solution |
|---------|----------|
| Build fails with child_process | Move Supabase to Server Action |
| Modal won't close | Check BaseModal isOpen/onClose props |
| Data not updating | Add revalidatePath() to action |
| RLS blocking queries | Check company_id in policy |
