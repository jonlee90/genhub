# E5-T7: Performance Optimization

**Epic**: Polish & Testing (Week 9-10)
**Effort**: Medium
**References**: Req 31 (Performance), Design Section 10

## Description

Implement performance optimizations including Suspense loading states, database query optimization, image optimization, and bundle size optimization.

## Subtasks

### 7.1 Implement loading states with Suspense
- Add Suspense boundaries to all data-fetching components
- Create specific skeleton components for each page
- Ensure smooth loading experience
- **Refs:** Req 31.1-31.2 (Loading States), Design Section 10
- **Effort:** M
- **Files:** Various page components

### 7.2 Optimize database queries
- Review all Supabase queries for efficiency
- Add appropriate indexes for common queries
- Implement pagination for large lists (projects, tasks)
- **Refs:** Req 31.6 (Large Lists), Design Section 10.2
- **Effort:** M
- **Files:** Server actions and queries

### 7.3 Implement image optimization
- Use next/image for all images
- Configure image optimization in next.config.ts
- Lazy load images below the fold
- **Refs:** Req 31.2 (Performance), Design Section 10.1
- **Effort:** S
- **Files:** `next.config.ts`, Image components

### 7.4 Audit and optimize bundle size
- Run bundle analyzer
- Code-split large components
- Lazy load non-critical routes
- **Refs:** Req 31.2 (Performance), Design Section 10.1
- **Effort:** M
- **Files:** `next.config.ts`, various components

## Acceptance Criteria

- [ ] Suspense boundaries prevent loading waterfalls
- [ ] Database queries optimized with indexes
- [ ] Pagination implemented for large lists
- [ ] All images use next/image
- [ ] Bundle size reduced
- [ ] Lazy loading implemented
- [ ] Performance metrics improved

## Files to Create/Modify

- Various page components (for Suspense)
- Server action files (for query optimization)
- `next.config.ts`
- Various component files
