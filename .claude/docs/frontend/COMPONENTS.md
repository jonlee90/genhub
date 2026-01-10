# GenHub - Component Patterns

> Common UI component patterns and usage.

---

## Base Components

### Button Variants
```tsx
import { Button } from '@/components/ui/button';

<Button>Primary</Button>
<Button variant="secondary">Secondary</Button>
<Button variant="outline">Outline</Button>
<Button variant="destructive">Delete</Button>
<Button variant="ghost">Ghost</Button>

// Sizes
<Button size="sm">Small</Button>
<Button size="default">Default</Button>
<Button size="lg">Large</Button>
<Button size="icon"><Plus className="w-4 h-4" /></Button>

// With icon
<Button className="bg-construction-blue text-white">
  <Plus className="w-4 h-4 mr-2" />
  Add Item
</Button>

// Loading state
<Button disabled>
  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
  Saving...
</Button>
```

**Button Text Color Contrast Rule:**
- Dark backgrounds → white text (`text-white`)
- Light backgrounds → dark text (default or `text-gray-900`)

| Background | Text Class |
|------------|------------|
| `bg-construction-blue` | `text-white` |
| `bg-blue-600`, `bg-blue-700`, etc. | `text-white` |
| `bg-gray-800`, `bg-gray-900` | `text-white` |
| `bg-green-600`, `bg-red-600` | `text-white` |
| `bg-construction-yellow` | `text-black` |
| `bg-gray-100`, `bg-white` | `text-gray-900` |

### BaseModal (ALWAYS use for modals)
```tsx
import { BaseModal } from '@/components/ui/BaseModal';

<BaseModal
  isOpen={isOpen}
  onClose={() => setIsOpen(false)}
  title="Modal Title"
  icon={<Plus className="w-5 h-5" />}
>
  <div className="space-y-4">
    {/* Modal content */}
  </div>
</BaseModal>
```

**NEVER use `Dialog` directly - always use `BaseModal`**

### Card
```tsx
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

<Card className="border-2 border-gray-200 shadow-construction">
  <CardHeader>
    <CardTitle>Title</CardTitle>
    <CardDescription>Description</CardDescription>
  </CardHeader>
  <CardContent>
    {/* Content */}
  </CardContent>
</Card>
```

### Badge
```tsx
import { Badge } from '@/components/ui/badge';

<Badge>Default</Badge>
<Badge variant="secondary">Secondary</Badge>
<Badge variant="outline">Outline</Badge>
<Badge variant="destructive">Destructive</Badge>

// Custom status colors
<Badge className="bg-construction-green text-white">On Track</Badge>
<Badge className="bg-construction-red text-white">Delayed</Badge>
<Badge className="bg-construction-yellow text-black">Warning</Badge>
```

---

## Status Badges

### Task Status Badge
```tsx
const STATUS_CONFIG = {
  todo: { label: 'To Do', className: 'bg-gray-100 text-gray-800' },
  in_progress: { label: 'In Progress', className: 'bg-blue-100 text-blue-800' },
  review: { label: 'Review', className: 'bg-yellow-100 text-yellow-800' },
  blocked: { label: 'Blocked', className: 'bg-red-100 text-red-800' },
  completed: { label: 'Completed', className: 'bg-green-100 text-green-800' },
};

function TaskStatusBadge({ status }: { status: TaskStatus }) {
  const config = STATUS_CONFIG[status];
  return (
    <Badge className={config.className}>
      {config.label}
    </Badge>
  );
}
```

### Priority Badge
```tsx
const PRIORITY_CONFIG = {
  low: { label: 'Low', className: 'bg-gray-100 text-gray-600' },
  medium: { label: 'Medium', className: 'bg-blue-100 text-blue-700' },
  high: { label: 'High', className: 'bg-orange-100 text-orange-700' },
  critical: { label: 'Critical', className: 'bg-red-100 text-red-700' },
};
```

---

## Card Patterns

### Task Card
```tsx
<Card className="hover:shadow-md transition-shadow">
  <CardContent className="p-4">
    <div className="flex items-start justify-between mb-2">
      <h3 className="font-medium line-clamp-2">{task.title}</h3>
      <PriorityBadge priority={task.priority} />
    </div>
    <p className="text-sm text-gray-600 line-clamp-2 mb-3">
      {task.description}
    </p>
    <div className="flex items-center justify-between text-sm">
      <div className="flex items-center gap-2">
        <Avatar className="w-6 h-6" />
        <span className="text-gray-600">{assignee.name}</span>
      </div>
      <span className="text-gray-500">{formatDate(task.due_date)}</span>
    </div>
  </CardContent>
</Card>
```

### Project Card
```tsx
<Card className="border-l-4 border-l-construction-blue">
  <CardHeader>
    <div className="flex items-center justify-between">
      <CardTitle>{project.name}</CardTitle>
      <StatusBadge status={project.status} />
    </div>
    <CardDescription>
      <Building2 className="inline w-4 h-4 mr-1" />
      {project.client_name}
    </CardDescription>
  </CardHeader>
  <CardContent>
    <Progress value={project.completion_percentage} className="mb-2" />
    <div className="flex justify-between text-sm text-gray-500">
      <span>{project.completion_percentage}% complete</span>
      <span>Due {formatDate(project.end_date)}</span>
    </div>
  </CardContent>
</Card>
```

### Stats Card
```tsx
<Card className="border-2 border-gray-200">
  <CardContent className="p-4">
    <div className="flex items-center gap-3">
      <div className="p-2 bg-construction-blue/10 rounded-lg">
        <CheckSquare className="w-5 h-5 text-construction-blue" />
      </div>
      <div>
        <p className="text-sm text-gray-500">Active Tasks</p>
        <p className="text-2xl font-bold">{count}</p>
      </div>
    </div>
  </CardContent>
</Card>
```

---

## Form Patterns

### Form Layout
```tsx
<form onSubmit={handleSubmit} className="space-y-4">
  <div className="space-y-2">
    <Label htmlFor="name">Name *</Label>
    <Input
      id="name"
      name="name"
      required
      placeholder="Enter name"
    />
  </div>

  <div className="space-y-2">
    <Label htmlFor="description">Description</Label>
    <Textarea
      id="description"
      name="description"
      placeholder="Enter description (optional)"
      rows={3}
    />
  </div>

  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
    <div className="space-y-2">
      <Label>Start Date</Label>
      <Input type="date" name="start_date" />
    </div>
    <div className="space-y-2">
      <Label>End Date</Label>
      <Input type="date" name="end_date" />
    </div>
  </div>

  <div className="flex justify-end gap-3 pt-4">
    <Button type="button" variant="outline" onClick={onCancel}>
      Cancel
    </Button>
    <Button type="submit" className="bg-construction-blue">
      Save
    </Button>
  </div>
</form>
```

### Error Display
```tsx
{error && (
  <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-red-700 text-sm">
    {error}
  </div>
)}
```

---

## List Patterns

### Simple List
```tsx
<div className="space-y-3">
  {items.map(item => (
    <div
      key={item.id}
      className="flex items-center justify-between p-3 bg-white rounded-lg border hover:border-construction-blue/30 transition-colors"
    >
      <div>
        <p className="font-medium">{item.name}</p>
        <p className="text-sm text-gray-500">{item.description}</p>
      </div>
      <Button variant="ghost" size="icon">
        <MoreVertical className="w-4 h-4" />
      </Button>
    </div>
  ))}
</div>
```

### Grid List
```tsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  {items.map(item => (
    <ItemCard key={item.id} item={item} />
  ))}
</div>
```

---

## Navigation Patterns

### Tabs
```tsx
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

<Tabs defaultValue="overview">
  <TabsList>
    <TabsTrigger value="overview">Overview</TabsTrigger>
    <TabsTrigger value="tasks">Tasks</TabsTrigger>
    <TabsTrigger value="team">Team</TabsTrigger>
  </TabsList>
  <TabsContent value="overview">
    <OverviewContent />
  </TabsContent>
  <TabsContent value="tasks">
    <TasksContent />
  </TabsContent>
  <TabsContent value="team">
    <TeamContent />
  </TabsContent>
</Tabs>
```

### Breadcrumbs
```tsx
<div className="flex items-center gap-2 text-sm text-gray-500">
  <Link href="/app/projects" className="hover:text-construction-blue">
    Projects
  </Link>
  <ChevronRight className="w-4 h-4" />
  <span className="text-gray-900">{project.name}</span>
</div>
```

---

## See Also

- Design system: `frontend/DESIGN_SYSTEM.md`
- Page layouts: `frontend/LAYOUTS.md`
- Form patterns skill: `skills/frontend/form-patterns.md`
