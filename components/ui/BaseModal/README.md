# BaseModal Component System

Production-grade modal system with construction-themed design for GenHub PWA.

## Features

- **Responsive Design**: Bottom sheet on mobile (< 768px), centered modal on desktop
- **Construction Theme**: Industrial aesthetics with blueprint grid patterns
- **Multi-step Support**: Built-in step indicator for wizard flows
- **Priority Themes**: Pre-configured color schemes for low/medium/high priority
- **Flexible Footer**: Left and right action slots
- **Form Remounting**: Support for resetting forms via `formKey` prop
- **Accessibility**: ARIA attributes, keyboard navigation, focus management
- **Animations**: Smooth Framer Motion transitions
- **Customizable**: Theme overrides, custom max widths, className props

## Installation

The BaseModal system is already integrated. Dependencies:

```json
{
  "framer-motion": "^12.4.7",
  "lucide-react": "^0.475.0",
  "tailwind-merge": "^3.0.1",
  "clsx": "^2.1.1"
}
```

## Basic Usage

```tsx
import { BaseModal } from '@/components/ui/BaseModal';
import { HardHat } from 'lucide-react';

function MyComponent() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={() => setIsOpen(false)}
      icon={HardHat}
      title="Create Project"
      subtitle="Enter project details to get started"
    >
      <div>Your content here</div>
    </BaseModal>
  );
}
```

## Props Reference

### Core Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `isOpen` | `boolean` | - | Controls modal visibility (required) |
| `onClose` | `() => void` | - | Close handler (required) |
| `children` | `ReactNode` | - | Modal content (required) |
| `title` | `string` | - | Modal title (required) |

### Header Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `icon` | `LucideIcon` | - | Icon component (e.g., `HardHat`) |
| `subtitle` | `string` | - | Descriptive subtitle |
| `badges` | `ReactNode` | - | Custom badge components |

### Footer Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `leftActions` | `ReactNode` | - | Left-aligned footer actions |
| `rightActions` | `ReactNode` | - | Right-aligned footer actions |
| `showFooter` | `boolean` | `true` | Show/hide footer |

### Stepper Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `steps` | `string[]` | - | Array of step labels |
| `currentStep` | `number` | `1` | Current step (1-indexed) |

### Theming Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `theme` | `string` | `'default'` | Theme name: `'default'`, `'low'`, `'medium'`, `'high'`, `'info'`, `'success'` |
| `customTheme` | `ModalTheme` | - | Override with custom theme object |

### Behavior Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `closeOnBackdropClick` | `boolean` | `true` | Close when clicking backdrop |
| `closeOnEscape` | `boolean` | `true` | Close on Escape key |
| `formKey` | `string \| number` | - | Key for remounting content |
| `maxWidth` | `ModalSize` | `'xl'` | Max width: `'sm'`, `'md'`, `'lg'`, `'xl'`, `'2xl'`, `'3xl'`, `'4xl'` |

### Styling Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `className` | `string` | - | Modal container classes |
| `contentClassName` | `string` | - | Content area classes |
| `headerClassName` | `string` | - | Header classes |
| `footerClassName` | `string` | - | Footer classes |

### Accessibility Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `ariaLabel` | `string` | `title` | ARIA label for dialog |
| `ariaDescribedBy` | `string` | - | ARIA described-by ID |

## Examples

### 1. Modal with Footer Actions

```tsx
<BaseModal
  isOpen={isOpen}
  onClose={() => setIsOpen(false)}
  icon={Building2}
  title="Create Project"
  subtitle="Enter project details"
  leftActions={
    <Button variant="ghost" onClick={() => setIsOpen(false)}>
      Cancel
    </Button>
  }
  rightActions={
    <>
      <Button variant="outline">Save Draft</Button>
      <Button>Create</Button>
    </>
  }
>
  <form>{/* Form fields */}</form>
</BaseModal>
```

### 2. Multi-step Modal with Stepper

```tsx
const steps = ['Basic Info', 'Details', 'Review'];
const [currentStep, setCurrentStep] = useState(1);

<BaseModal
  isOpen={isOpen}
  onClose={() => setIsOpen(false)}
  icon={Wrench}
  title="Create Task"
  subtitle={`Step ${currentStep} of ${steps.length}`}
  steps={steps}
  currentStep={currentStep}
  leftActions={
    currentStep > 1 && (
      <Button onClick={() => setCurrentStep(currentStep - 1)}>
        Back
      </Button>
    )
  }
  rightActions={
    <Button onClick={() => setCurrentStep(currentStep + 1)}>
      {currentStep < steps.length ? 'Next' : 'Finish'}
    </Button>
  }
>
  {/* Step content */}
</BaseModal>
```

### 3. Priority-themed Modal

```tsx
<BaseModal
  isOpen={isOpen}
  onClose={() => setIsOpen(false)}
  icon={AlertTriangle}
  title="High Priority Task"
  subtitle="This requires immediate attention"
  theme="high"  // Uses danger red theme
  badges={
    <span className="px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-700">
      URGENT
    </span>
  }
>
  {/* Content */}
</BaseModal>
```

### 4. Large Modal with Custom Width

```tsx
<BaseModal
  isOpen={isOpen}
  onClose={() => setIsOpen(false)}
  icon={Building2}
  title="Project Documentation"
  maxWidth="4xl"  // Wider modal
>
  {/* Large content */}
</BaseModal>
```

### 5. Form with Auto-reset

```tsx
const [formKey, setFormKey] = useState(0);

const handleOpen = () => {
  setFormKey(Date.now()); // Reset form
  setIsOpen(true);
};

<BaseModal
  isOpen={isOpen}
  onClose={() => setIsOpen(false)}
  formKey={formKey}  // Remounts content
  title="Create Item"
>
  <form>{/* Form resets on each open */}</form>
</BaseModal>
```

## Available Themes

| Theme | Primary Color | Use Case |
|-------|---------------|----------|
| `default` | Navy Blue (#001B51) | General modals, professional |
| `low` | Emerald Green | Low priority, success, completed |
| `medium` | Amber | Medium priority, warnings |
| `high` | Danger Red | High priority, critical actions |
| `info` | Construction Yellow | Information, guidance |
| `success` | Emerald Green | Success confirmations |

## Custom Theme

```tsx
const customTheme: ModalTheme = {
  primary: '#001B51',
  primaryHover: '#002163',
  primaryLight: '#003087',
  accent: '#3C3C3C',
  accentHover: '#525252',
  accentLight: '#7A7A7A',
  ring: 'rgba(0, 27, 81, 0.5)',
  badge: '#E8EEF7',
  badgeText: '#001B51',
  gradientFrom: '#001B51',
  gradientTo: '#003087',
  iconBg: '#F0F4FC',
  iconGradientFrom: '#001B51',
  iconGradientTo: '#003D99',
};

<BaseModal customTheme={customTheme} {...props}>
  {/* Content */}
</BaseModal>
```

## Responsive Behavior

### Mobile (< 768px)
- Appears as bottom sheet
- Slides up from bottom
- Rounded top corners (`rounded-t-3xl`)
- Drag handle visible
- Max height: 90vh

### Desktop (≥ 768px)
- Centered modal
- Scale + fade animation
- Fully rounded corners (`rounded-2xl`)
- No drag handle
- Max height: 90vh

## Architecture

```
BaseModal/
├── index.tsx              # Main modal component
├── BaseModalHeader.tsx    # Header with icon, title, close
├── BaseModalFooter.tsx    # Footer with action slots
├── StepIndicator.tsx      # Horizontal stepper
├── types.ts               # TypeScript interfaces
├── BaseModal.example.tsx  # Usage examples
└── README.md              # This file
```

## Design Details

### Blueprint Grid Pattern
Icon backgrounds and step circles feature a subtle blueprint grid overlay for industrial authenticity.

### Gradient Accent Strip
Top accent strip with animated shimmer effect provides visual polish.

### Construction-themed Colors
All themes use construction safety color standards (OSHA-inspired).

### Smooth Animations
Framer Motion powers all transitions for professional feel.

## Accessibility

- ✅ ARIA `role="dialog"` and `aria-modal="true"`
- ✅ Focus trap when open
- ✅ Escape key closes (configurable)
- ✅ Backdrop click closes (configurable)
- ✅ Body scroll prevention
- ✅ Keyboard navigation support
- ✅ Screen reader friendly

## Performance

- Portal-free implementation (uses fixed positioning)
- CSS-based animations where possible
- Efficient re-renders with React.memo (where applicable)
- Lazy-loaded content support via `formKey`

## Migration from Old Modals

### TaskModal → BaseModal

```tsx
// Before
<TaskModal
  isOpen={isOpen}
  onClose={onClose}
  task={task}
  // ... task-specific props
/>

// After
<BaseModal
  isOpen={isOpen}
  onClose={onClose}
  icon={CheckSquare}
  title={task.title}
  subtitle={task.description}
  theme={getThemeForPriority(task.priority)}
>
  <TaskModalContent task={task} />
</BaseModal>
```

### CreateExpenseModal → BaseModal

```tsx
// Before
<CreateExpenseModal
  isOpen={isOpen}
  onClose={onClose}
  tasks={tasks}
  // ...
/>

// After
<BaseModal
  isOpen={isOpen}
  onClose={onClose}
  icon={Receipt}
  title="Create Expense"
  subtitle="Log a new project expense"
  formKey={formKey}
  rightActions={
    <Button onClick={handleSubmit}>Create Expense</Button>
  }
>
  <ExpenseForm tasks={tasks} />
</BaseModal>
```

## Troubleshooting

### Modal not appearing
- Ensure `isOpen={true}`
- Check z-index conflicts (BaseModal uses `z-50`)
- Verify Framer Motion is installed

### Animations not working
- Check `framer-motion` version (≥12.4.7)
- Ensure no CSS `transform` conflicts

### Bottom sheet not showing on mobile
- Verify `useMediaQuery` hook is working
- Check viewport width detection

### Form not resetting
- Use `formKey` prop with unique value
- Example: `formKey={Date.now()}`

## Credits

Designed for GenHub PWA with construction-themed industrial aesthetics.
Built with Framer Motion, Tailwind CSS, and Lucide icons.
