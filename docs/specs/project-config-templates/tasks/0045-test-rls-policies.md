# Task 8.3: Test RLS policies ✅ COMPLETED
## Objective
Verify company scoping and role enforcement.
## References
Security requirements
## Acceptance Criteria
✅ Cross-company access blocked
✅ Role enforcement works

## Implementation Notes
- All RLS policy tests passed (8/8 tests)
- Company scoping verified: Users can only see their company's templates
- Role enforcement verified: Only GC Admin can create/edit/delete templates
- All users can read templates (proper read access)
- Task types filtered by is_active for non-admins
- Cross-company access properly blocked
- RLS enabled on all 4 template tables
- Minor issue: 18 functions lack SET search_path (non-blocking, should fix before production)
- See test report: `docs/specs/project-config-templates/test-reports/backend-tests.md`
