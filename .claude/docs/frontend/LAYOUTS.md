# GenHub - Page Layouts

> Standard page layout patterns and responsive design.

---

## Page Layout Checklist

**All `/app/*` pages MUST include:**

- [ ] Blueprint grid background (fixed, 0.03 opacity, 40px)
- [ ] Industrial header (h-1 blue border + UPPERCASE title)
- [ ] Page container (`flex-1 space-y-4 md:space-y-6 p-4 md:p-8`)
- [ ] Section headers (icon + title + description)
- [ ] Card styling (`border-2 border-gray-200 shadow-construction`)

---

## Standard Page Template

```tsx
export default async function Page() {
  return (
    <div className="flex-1 space-y-4 md:space-y-6 p-4 md:p-8 relative overflow-hidden">

      {/* 1. Blueprint Grid Background */}
      <div className="fixed inset-0 pointer-events-none opacity-[0.03]">
        <div className="absolute inset-0" style={{
          backgroundImage: `
            linear-gradient(to right, currentColor 1px, transparent 1px),
            linear-gradient(to bottom, currentColor 1px, transparent 1px)
          `,
          backgroundSize: '40px 40px',
          color: '#001B51'
        }} />
      </div>

      {/* 2. Industrial Header */}
      <div className="relative">
        <div className="absolute top-0 left-0 right-0 h-1 bg-construction-blue" />
        <div className="flex items-start justify-between pt-2 md:pt-4 gap-3">
          <div>
            <h1 className="text-3xl md:text-5xl font-black tracking-tighter text-construction-blue uppercase">
              PAGE TITLE
            </h1>
            <p className="mt-2 text-sm md:text-base text-gray-500">
              Page description
            </p>
          </div>
          <Button className="bg-construction-blue">
            <Plus className="w-4 h-4 mr-2" />
            Action
          </Button>
        </div>
      </div>

      {/* 3. Page Content */}
      <div className="space-y-6">
        {/* Content sections */}
      </div>

    </div>
  );
}
```

---

## Section Header Pattern

```tsx
<div className="flex items-start gap-3 px-3 py-2 bg-gradient-to-r from-construction-blue/5 to-transparent rounded-lg border-l-4 border-construction-blue">
  <div className="p-2 bg-construction-blue rounded-lg shrink-0">
    <FolderKanban className="h-6 w-6 text-white" />
  </div>
  <div>
    <h2 className="text-2xl font-black text-construction-blue uppercase">
      SECTION TITLE
    </h2>
    <p className="text-sm text-gray-500">
      Section description
    </p>
  </div>
</div>
```

---

## Card Patterns

### Standard Card
```tsx
<Card className="border-2 border-gray-200 shadow-construction hover:border-construction-blue/30 transition-colors">
  <CardContent className="p-4 md:p-6">
    {/* Content */}
  </CardContent>
</Card>
```

### Accent Border Card
```tsx
<Card className="border-l-4 border-l-construction-blue">
  <CardHeader>
    <CardTitle>Title</CardTitle>
    <CardDescription>Description</CardDescription>
  </CardHeader>
  <CardContent>
    {/* Content */}
  </CardContent>
</Card>
```

---

## Responsive Design

### Breakpoints
| Breakpoint | Width | Usage |
|------------|-------|-------|
| `sm:` | 480px | Mobile portrait |
| `md:` | 768px | Tablet |
| `lg:` | 1024px | Desktop |
| `xl:` | 1280px | Large desktop |

### Common Patterns

```tsx
// Navigation
<Sidebar className="hidden md:flex" />
<MobileMenu className="md:hidden" />

// Grid layouts
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">

// Spacing
<div className="p-4 md:p-6 lg:p-8">

// Typography
<h1 className="text-xl md:text-2xl lg:text-3xl">

// Flex direction
<div className="flex flex-col md:flex-row gap-4">

// Hide/show
<div className="hidden md:block">  {/* Desktop only */}
<div className="md:hidden">        {/* Mobile only */}
```

---

## Mobile-First Patterns

### Touch Targets
```tsx
// Minimum 44px height for buttons
<Button className="h-12 md:h-10">

// Large tap areas
<button className="p-4 -m-4">
```

### Form Inputs (Mobile)
```tsx
<Input className="h-12 text-base" />  // Larger input for mobile
```

### Button Layout
```tsx
// Stack on mobile, row on desktop
<div className="flex flex-col md:flex-row gap-3">
  <Button variant="outline" className="w-full md:w-auto">
    Cancel
  </Button>
  <Button className="w-full md:w-auto bg-construction-blue">
    Save
  </Button>
</div>
```

---

## Empty States

```tsx
<div className="flex flex-col items-center justify-center py-12 text-center">
  <div className="p-4 bg-gray-100 rounded-full mb-4">
    <FolderKanban className="w-8 h-8 text-gray-400" />
  </div>
  <h3 className="text-lg font-medium text-gray-900 mb-1">
    No projects yet
  </h3>
  <p className="text-sm text-gray-500 mb-4 max-w-sm">
    Create your first project to get started with GenHub.
  </p>
  <Button className="bg-construction-blue">
    <Plus className="w-4 h-4 mr-2" />
    Create Project
  </Button>
</div>
```

---

## Loading States

```tsx
// Skeleton loader
<div className="animate-pulse">
  <div className="h-8 bg-gray-200 rounded w-1/3 mb-4" />
  <div className="h-4 bg-gray-200 rounded w-full mb-2" />
  <div className="h-4 bg-gray-200 rounded w-2/3" />
</div>

// Spinner
<Loader2 className="w-6 h-6 animate-spin text-construction-blue" />

// Full page loading
<div className="flex-1 flex items-center justify-center">
  <Loader2 className="w-8 h-8 animate-spin text-construction-blue" />
</div>
```

---

## Error States

```tsx
<div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
  <div className="flex items-center gap-2">
    <AlertCircle className="w-5 h-5" />
    <span className="font-medium">Error loading data</span>
  </div>
  <p className="text-sm mt-1">
    Please try refreshing the page.
  </p>
</div>
```

---

## See Also

- Design system: `frontend/DESIGN_SYSTEM.md`
- Component patterns: `frontend/COMPONENTS.md`
- Page creation skill: `skills/frontend/page-creation.md`
