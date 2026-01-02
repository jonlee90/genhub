# Task 3.2: Create ProjectConfigurationSection component

## Objective
Create tabbed navigation component for managing project configuration entities.

## References
- Requirements §6.2 (Tabs/sections)
- `.claude/docs/law/UI_RULES.md` - Component patterns

## Implementation Details

### Files to Create
- `components/settings/ProjectConfigurationSection.tsx`

### Component Structure

**Client Component** (`'use client'`)

**Tabs:**
1. Project Types
2. Task Types
3. Phase Templates
4. Task Templates

**Tab Content:**
- Each tab renders its respective manager component:
  - ProjectTypeManager
  - TaskTypeManager
  - PhaseTemplateManager
  - TaskTemplateManager

**Styling:**
- Use Aceternity UI `Tabs` component
- Construction theme colors
- Standard card pattern: `border-2 border-gray-200 shadow-construction`

## Acceptance Criteria
- ✅ 4 tabs rendered correctly
- ✅ Tab navigation works smoothly
- ✅ Each tab loads its manager component
- ✅ Construction theme applied
- ✅ Responsive design works

## Code Template

```typescript
'use client';

import { useState } from 'react';
import { ProjectTypeManager } from './ProjectTypeManager';
import { TaskTypeManager } from './TaskTypeManager';
import { PhaseTemplateManager } from './PhaseTemplateManager';
import { TaskTemplateManager } from './TaskTemplateManager';

export function ProjectConfigurationSection() {
  const [activeTab, setActiveTab] = useState('project-types');

  const tabs = [
    { id: 'project-types', label: 'Project Types', component: ProjectTypeManager },
    { id: 'task-types', label: 'Task Types', component: TaskTypeManager },
    { id: 'phase-templates', label: 'Phase Templates', component: PhaseTemplateManager },
    { id: 'task-templates', label: 'Task Templates', component: TaskTemplateManager },
  ];

  return (
    <div className="border-2 border-gray-200 rounded-lg shadow-construction bg-white">
      {/* Tab navigation */}
      <div className="border-b border-gray-200">
        <nav className="flex gap-4 px-6">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-4 px-2 font-semibold border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-construction-blue text-construction-blue'
                  : 'border-transparent text-gray-600 hover:text-construction-blue'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab content */}
      <div className="p-6">
        {tabs.map((tab) => (
          <div key={tab.id} className={activeTab === tab.id ? 'block' : 'hidden'}>
            <tab.component />
          </div>
        ))}
      </div>
    </div>
  );
}
```
