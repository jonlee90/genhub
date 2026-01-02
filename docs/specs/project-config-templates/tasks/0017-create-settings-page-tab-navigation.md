# Task 3.1: Create Settings page tab navigation

## Objective
Add Project Configuration section to Settings page with role-based access control.

## References
- Requirements §6 (Settings Page Integration)
- Design UI Layout
- `.claude/docs/law/UI_RULES.md` - Standard page layout

## Implementation Details

### Files to Modify
- `app/app/settings/page.tsx`

### Changes to Make

**1. Add role check:**
- Only show "Project Configuration" section if user role is `gc_admin`
- Use user context from session

**2. Add section header:**
- Use `SectionHeader` component pattern
- Icon: `Wrench` from lucide-react
- Title: "Project Configuration"
- Description: "Manage project types, task types, and workflow templates"

**3. Add ProjectConfigurationSection component:**
- Import from `@/components/settings/ProjectConfigurationSection`
- Render below section header

**4. Apply standard layout:**
- Follow blueprint grid background pattern
- Use construction theme colors
- Maintain consistent spacing

## Acceptance Criteria
- ✅ Section visible only to gc_admin users
- ✅ Non-admin users do not see the section
- ✅ SectionHeader follows standard pattern
- ✅ Standard page layout applied
- ✅ Construction theme colors used

## Code Template

```typescript
// app/app/settings/page.tsx

import { auth } from '@/lib/auth';
import { Wrench } from 'lucide-react';
import { ProjectConfigurationSection } from '@/components/settings/ProjectConfigurationSection';

export default async function SettingsPage() {
  const session = await auth();
  const user = session?.user;
  const isAdmin = user?.role === 'gc_admin';

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8">
      {/* Existing sections... */}

      {/* Project Configuration (Admin only) */}
      {isAdmin && (
        <section className="space-y-4">
          <div className="flex items-center gap-3 pb-2 border-b-2 border-construction-blue">
            <div className="p-2 bg-construction-blue rounded">
              <Wrench className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-construction-blue uppercase">
                Project Configuration
              </h2>
              <p className="text-sm text-gray-600">
                Manage project types, task types, and workflow templates
              </p>
            </div>
          </div>
          <ProjectConfigurationSection />
        </section>
      )}
    </div>
  );
}
```
