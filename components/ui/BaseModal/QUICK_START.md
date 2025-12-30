# BaseModal Quick Start Guide

## 30-Second Integration

### 1. Import
```tsx
import { BaseModal } from '@/components/ui/BaseModal';
import { HardHat } from 'lucide-react';
```

### 2. Use
```tsx
<BaseModal
  isOpen={isOpen}
  onClose={() => setIsOpen(false)}
  icon={HardHat}
  title="Your Title"
>
  <div>Your content</div>
</BaseModal>
```

That's it! ✅

---

## Common Patterns

### With Footer Buttons
```tsx
<BaseModal
  isOpen={isOpen}
  onClose={() => setIsOpen(false)}
  icon={Building2}
  title="Create Project"
  rightActions={
    <>
      <Button variant="ghost" onClick={() => setIsOpen(false)}>Cancel</Button>
      <Button onClick={handleCreate}>Create</Button>
    </>
  }
>
  <form>{/* ... */}</form>
</BaseModal>
```

### Multi-Step Form
```tsx
const [step, setStep] = useState(1);

<BaseModal
  isOpen={isOpen}
  onClose={() => setIsOpen(false)}
  icon={Wrench}
  title="Create Task"
  steps={['Info', 'Details', 'Review']}
  currentStep={step}
  leftActions={
    step > 1 && <Button onClick={() => setStep(step - 1)}>Back</Button>
  }
  rightActions={
    <Button onClick={() => setStep(step + 1)}>
      {step < 3 ? 'Next' : 'Finish'}
    </Button>
  }
>
  {/* Step content */}
</BaseModal>
```

### Priority Colors
```tsx
<BaseModal
  theme="high"  // 'low' | 'medium' | 'high'
  icon={AlertTriangle}
  title="Urgent Task"
  // ...
>
```

### Large Modal
```tsx
<BaseModal
  maxWidth="4xl"  // 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl'
  // ...
>
```

### Form Auto-Reset
```tsx
const [key, setKey] = useState(0);

const open = () => {
  setKey(Date.now());
  setIsOpen(true);
};

<BaseModal formKey={key} /* ... */>
  <form>{/* Resets on open */}</form>
</BaseModal>
```

---

## Props Cheat Sheet

| Essential | Optional | Advanced |
|-----------|----------|----------|
| `isOpen` | `subtitle` | `formKey` |
| `onClose` | `icon` | `theme` |
| `title` | `badges` | `steps` |
| `children` | `leftActions` | `currentStep` |
| | `rightActions` | `maxWidth` |
| | `showFooter` | `closeOnBackdropClick` |
| | | `closeOnEscape` |

---

## Themes

- `default` - Navy blue (professional)
- `low` - Green (success, low priority)
- `medium` - Amber (warning)
- `high` - Red (critical)
- `info` - Yellow (information)
- `success` - Green (completed)

---

## Examples

Full examples: `components/ui/BaseModal/BaseModal.example.tsx`

Full docs: `components/ui/BaseModal/README.md`

---

## Troubleshooting

**Modal not showing?**
- Check `isOpen={true}`
- Verify Framer Motion is installed

**Form not resetting?**
- Use `formKey={Date.now()}` on open

**Animation issues?**
- Check `framer-motion` version ≥12.4.7

---

That's all you need! 🎉
