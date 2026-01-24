---
name: reusable-code-detector
description: Identifies code patterns that should be extracted into reusable components, hooks, or utilities
globs:
  - "**/*.tsx"
  - "**/*.ts"
---

# Reusable Code Detector Skill

This skill identifies code that should be made reusable to keep the codebase DRY and maintainable.

## Detection Categories

### 1. Component Patterns

**Trigger:** Same JSX structure in 2+ files

```tsx
// Pattern detected in multiple files:
<div className="flex items-center gap-2">
  <Icon className="w-4 h-4" />
  <span className="text-sm">{label}</span>
</div>

// Suggested extraction:
export function IconLabel({ icon: Icon, label }: { icon: LucideIcon; label: string }) {
  return (
    <div className="flex items-center gap-2">
      <Icon className="w-4 h-4" />
      <span className="text-sm">{label}</span>
    </div>
  )
}
```

### 2. Hook Patterns

**Trigger:** Same useState + useEffect combination in 2+ files

```tsx
// Pattern detected:
const [data, setData] = useState<T | null>(null)
const [loading, setLoading] = useState(true)
const [error, setError] = useState<Error | null>(null)

useEffect(() => {
  fetchData().then(setData).catch(setError).finally(() => setLoading(false))
}, [])

// Suggested extraction:
function useAsync<T>(fetchFn: () => Promise<T>) {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    fetchFn().then(setData).catch(setError).finally(() => setLoading(false))
  }, [fetchFn])

  return { data, loading, error }
}
```

### 3. Utility Patterns

**Trigger:** Same data transformation in 2+ files

```tsx
// Pattern detected:
const formattedDate = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
  year: 'numeric'
}).format(date)

// Suggested extraction in lib/utils.ts:
export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  }).format(date)
}
```

### 4. Type Patterns

**Trigger:** Same type definition in 2+ files

```tsx
// Pattern detected:
type Status = 'pending' | 'in_progress' | 'completed' | 'cancelled'

// Suggested extraction in types/:
export type TaskStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled'
```

### 5. Validation Patterns

**Trigger:** Same Zod schema in 2+ files

```tsx
// Pattern detected:
const emailSchema = z.string().email()
const phoneSchema = z.string().regex(/^\+?[1-9]\d{1,14}$/)

// Suggested extraction in lib/validations.ts:
export const contactSchemas = {
  email: z.string().email(),
  phone: z.string().regex(/^\+?[1-9]\d{1,14}$/),
}
```

## Existing Reusables (Check First)

Before suggesting new extractions, check existing:

### Components (components/ui/)
```
Button, Card, Dialog, Input, Badge,
LoadingSpinner, EmptyState, ConfirmDialog
```

### Hooks (hooks/)
```
useDebounce, useLocalStorage, useMediaQuery,
useMounted, useOnClickOutside
```

### Utilities (lib/utils.ts)
```
cn(), formatDate(), formatCurrency(),
debounce(), throttle()
```

### Types (types/)
```
TaskStatus, ProjectStatus, MaterialUnit,
User, Company, Project, Task, Material
```

## Detection Commands

```bash
# Find repeated function signatures
grep -rhn "export function\|export const.*=" --include="*.ts" | \
  awk -F':' '{print $3}' | sort | uniq -c | sort -rn | head -20

# Find repeated className patterns
grep -roh 'className="[^"]*"' --include="*.tsx" | \
  sort | uniq -c | sort -rn | head -20

# Find repeated type definitions
grep -rn "^type\|^interface" --include="*.ts" --include="*.tsx" | \
  awk -F':' '{print $3}' | sort | uniq -c | sort -rn | head -20

# Find repeated hook patterns
grep -rn "useState.*useState" --include="*.tsx" | head -10

# Find repeated imports
grep -rn "^import.*from" --include="*.tsx" | \
  awk -F'from' '{print $2}' | sort | uniq -c | sort -rn | head -20
```

## Output Format

```markdown
## Reusability Analysis: {scope}

### Existing Components to Use
| Instead of | Use | Location |
|------------|-----|----------|
| Custom button | `<Button>` | components/ui/Button |
| Inline loading | `<LoadingSpinner>` | components/ui/LoadingSpinner |

### New Extractions Recommended

#### High Priority (3+ occurrences)
1. **IconLabel Component**
   - Pattern: Icon + label flex layout
   - Occurrences: 5 files
   - Save to: `components/ui/IconLabel.tsx`

2. **useAsyncData Hook**
   - Pattern: fetch + loading + error state
   - Occurrences: 8 files
   - Save to: `hooks/useAsyncData.ts`

#### Medium Priority (2 occurrences)
1. **formatPhoneNumber Utility**
   - Pattern: Phone formatting logic
   - Occurrences: 2 files
   - Save to: `lib/formatters.ts`

### Skip (Not Worth Extracting Yet)
- Pattern X: Only 1 occurrence, wait for repetition
```

## Integration

This skill works with:
- `code-reviewer` agent - Suggests extractions during review
- `component-scanner` agent - Feeds into scan reports
- `refactor-specialist` agent - Executes extractions

## Thresholds

| Pattern Type | Min Occurrences | Action |
|--------------|-----------------|--------|
| Component | 2 | Suggest extraction |
| Hook | 2 | Suggest extraction |
| Utility | 2 | Suggest extraction |
| Type | 2 | Suggest extraction |
| className | 3 | Suggest cn()/cva() |
