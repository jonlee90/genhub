# Skill: Create New Page

> Create new pages in GenHub following the standard layout patterns.

## When to Use

- Adding a new route to the app
- User says: "create page", "add route", "new screen"
- Design doc specifies new UI route

## Prerequisites

- Server Actions exist for data fetching (or create them first)
- Understanding of what data the page needs

---

## Quick Reference

### Server Component Page (Default)

```tsx
// app/app/{feature}/page.tsx
import { Suspense } from 'react';
import { getEntities } from '@/app/actions/entities';
import { EntityList } from '@/components/{feature}/EntityList';
import { PageSkeleton } from '@/components/ui/skeletons';

export default async function EntitiesPage() {
  const { data: entities, error } = await getEntities();

  if (error) {
    return <div className="p-8 text-red-600">Error: {error}</div>;
  }

  return (
    <div className="flex-1 space-y-4 md:space-y-6 p-4 md:p-8">
      {/* Blueprint Grid Background */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          backgroundImage: `
            linear-gradient(rgba(0, 27, 81, 0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0, 27, 81, 0.03) 1px, transparent 1px)
          `,
          backgroundSize: '40px 40px',
        }}
      />

      {/* Industrial Header */}
      <div className="relative">
        <div className="h-1 bg-construction-blue mb-4" />
        <h1 className="text-2xl md:text-3xl font-black uppercase tracking-tight text-construction-blue">
          Entities
        </h1>
        <p className="text-gray-600 mt-1">Manage your entities</p>
      </div>

      {/* Content */}
      <Suspense fallback={<PageSkeleton />}>
        <EntityList entities={entities ?? []} />
      </Suspense>
    </div>
  );
}
```

### Page with Dynamic Route

```tsx
// app/app/{feature}/[id]/page.tsx
import { notFound } from 'next/navigation';
import { getEntityById } from '@/app/actions/entities';
import { EntityDetail } from '@/components/{feature}/EntityDetail';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function EntityDetailPage({ params }: PageProps) {
  const { id } = await params;
  const { data: entity, error } = await getEntityById(id);

  if (error || !entity) {
    notFound();
  }

  return (
    <div className="flex-1 space-y-4 md:space-y-6 p-4 md:p-8">
      {/* Blueprint Grid Background */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          backgroundImage: `
            linear-gradient(rgba(0, 27, 81, 0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0, 27, 81, 0.03) 1px, transparent 1px)
          `,
          backgroundSize: '40px 40px',
        }}
      />

      {/* Industrial Header with Back */}
      <div className="relative">
        <div className="h-1 bg-construction-blue mb-4" />
        <div className="flex items-center gap-4">
          <Link href="/app/entities" className="text-gray-500 hover:text-gray-700">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-2xl md:text-3xl font-black uppercase tracking-tight text-construction-blue">
              {entity.name}
            </h1>
            <p className="text-gray-600 mt-1">Entity details</p>
          </div>
        </div>
      </div>

      <EntityDetail entity={entity} />
    </div>
  );
}
```

---

## Step-by-Step

### 1. Create Directory Structure

```
app/app/{feature}/
├── page.tsx              # List page
├── new/
│   └── page.tsx          # Create page (optional)
└── [id]/
    └── page.tsx          # Detail page
```

### 2. Implement Server Component Page

Server components can:
- Fetch data directly with `await`
- Import Server Actions
- Pass data as props to client components

```tsx
// This is a Server Component (no 'use client')
export default async function Page() {
  const { data } = await getEntities(); // Direct await
  return <ClientComponent entities={data} />; // Pass as props
}
```

### 3. Apply Standard Layout Pattern

Every page must include:

1. **Blueprint Grid Background**
```tsx
<div
  className="fixed inset-0 pointer-events-none"
  style={{
    backgroundImage: `
      linear-gradient(rgba(0, 27, 81, 0.03) 1px, transparent 1px),
      linear-gradient(90deg, rgba(0, 27, 81, 0.03) 1px, transparent 1px)
    `,
    backgroundSize: '40px 40px',
  }}
/>
```

2. **Industrial Header**
```tsx
<div className="relative">
  <div className="h-1 bg-construction-blue mb-4" />
  <h1 className="text-2xl md:text-3xl font-black uppercase tracking-tight text-construction-blue">
    Page Title
  </h1>
  <p className="text-gray-600 mt-1">Page description</p>
</div>
```

3. **Page Container**
```tsx
<div className="flex-1 space-y-4 md:space-y-6 p-4 md:p-8">
  {/* Content */}
</div>
```

### 4. Handle Loading States

Use Suspense for async content:
```tsx
import { Suspense } from 'react';
import { PageSkeleton } from '@/components/ui/skeletons';

<Suspense fallback={<PageSkeleton />}>
  <AsyncContent />
</Suspense>
```

### 5. Handle Errors

```tsx
if (error) {
  return (
    <div className="flex-1 p-8">
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
        {error}
      </div>
    </div>
  );
}
```

### 6. Handle Not Found

```tsx
import { notFound } from 'next/navigation';

if (!entity) {
  notFound();
}
```

---

## Examples

### Example 1: List Page with Actions

```tsx
// app/app/materials/page.tsx
import { Plus } from 'lucide-react';
import { getMaterials } from '@/app/actions/materials';
import { MaterialList } from '@/components/materials/MaterialList';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default async function MaterialsPage() {
  const { data: materials, error } = await getMaterials();

  return (
    <div className="flex-1 space-y-4 md:space-y-6 p-4 md:p-8">
      {/* Blueprint Grid */}
      <div className="fixed inset-0 pointer-events-none" style={{...}} />

      {/* Header with Action */}
      <div className="relative">
        <div className="h-1 bg-construction-blue mb-4" />
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl md:text-3xl font-black uppercase tracking-tight text-construction-blue">
              Materials
            </h1>
            <p className="text-gray-600 mt-1">Manage your material inventory</p>
          </div>
          <Link href="/app/materials/new">
            <Button className="bg-construction-blue hover:bg-construction-blue/90">
              <Plus className="h-4 w-4 mr-2" />
              Add Material
            </Button>
          </Link>
        </div>
      </div>

      {/* Content */}
      {error ? (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
          {error}
        </div>
      ) : (
        <MaterialList materials={materials ?? []} />
      )}
    </div>
  );
}
```

### Example 2: Detail Page with Tabs

```tsx
// app/app/projects/[id]/page.tsx
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default async function ProjectDetailPage({ params }: PageProps) {
  const { id } = await params;
  const { data: project } = await getProjectById(id);
  const { data: tasks } = await getProjectTasks(id);
  const { data: team } = await getProjectTeam(id);

  if (!project) notFound();

  return (
    <div className="flex-1 space-y-4 md:space-y-6 p-4 md:p-8">
      {/* Header */}
      <div className="relative">
        <div className="h-1 bg-construction-blue mb-4" />
        <h1 className="text-2xl font-black uppercase text-construction-blue">
          {project.name}
        </h1>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="tasks">Tasks ({tasks?.length ?? 0})</TabsTrigger>
          <TabsTrigger value="team">Team ({team?.length ?? 0})</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <ProjectOverview project={project} />
        </TabsContent>
        <TabsContent value="tasks">
          <TaskList tasks={tasks ?? []} projectId={id} />
        </TabsContent>
        <TabsContent value="team">
          <TeamList team={team ?? []} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
```

---

## Anti-Patterns

- **Never** use `'use client'` on page files unless absolutely necessary
- **Never** fetch data in client components - pass as props
- **Never** skip the blueprint grid background
- **Never** use custom fonts - use system/Tailwind defaults
- **Never** add riveted borders or hazard stripes
- **Never** forget mobile padding (`p-4 md:p-8`)

---

## Affected Documentation

| Document | Update Action |
|----------|---------------|
| `docs/indexes/routes.md` | Add new route entry |
| `docs/law/UI_RULES.md` | Reference if new pattern |

---

## Checklist

- [ ] Page is Server Component (no `'use client'`)
- [ ] Data fetched with Server Actions
- [ ] Blueprint grid background included
- [ ] Industrial header with h-1 border
- [ ] Proper spacing: `p-4 md:p-8`
- [ ] Loading state handled (Suspense)
- [ ] Error state handled
- [ ] Mobile responsive
- [ ] Uses Lucide icons only
