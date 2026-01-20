# Migration Patterns

Complex refactoring scenarios and solutions.

## Pattern 1: Prop Renaming

When components use different prop names for the same concept.

### Problem

```typescript
// ComponentA uses
interface PropsA {
  isOpen: boolean;
  onClose: () => void;
}

// ComponentB uses
interface PropsB {
  open: boolean;
  onDismiss: () => void;
}
```

### Solution: Adapter Pattern

```typescript
// Base component uses canonical names
interface BaseModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// Create adapters for legacy usage
type LegacyPropsB = {
  open?: boolean;
  onDismiss?: () => void;
} & Omit<BaseModalProps, 'isOpen' | 'onClose'>;

export function LegacyModal({ open, onDismiss, ...props }: LegacyPropsB) {
  return (
    <ResponsiveModal
      isOpen={open ?? false}
      onClose={onDismiss ?? (() => {})}
      {...props}
    />
  );
}
```

## Pattern 2: Compound to Slots

When migrating from compound components to slot-based.

### Problem

```typescript
// Current: Compound pattern
<Modal>
  <Modal.Header>Title</Modal.Header>
  <Modal.Body>Content</Modal.Body>
  <Modal.Footer>
    <Button>Save</Button>
  </Modal.Footer>
</Modal>
```

### Solution: Preserve Both Patterns

```typescript
// Option A: Convert to slots
<ResponsiveModal
  title="Title"
  footer={<Button>Save</Button>}
>
  Content
</ResponsiveModal>

// Option B: Create compound wrapper (backwards compatible)
const Modal = Object.assign(ResponsiveModal, {
  Header: ({ children }) => <>{children}</>,
  Body: ({ children }) => <>{children}</>,
  Footer: ({ children }) => <>{children}</>,
});

// Usage unchanged
<Modal isOpen={true} onClose={onClose}>
  <Modal.Header>Title</Modal.Header>
  <Modal.Body>Content</Modal.Body>
</Modal>
```

## Pattern 3: Embedded State to Controlled

When components have internal state that should be controlled.

### Problem

```typescript
// Component manages its own open state
function OldModal({ trigger }) {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <>
      <button onClick={() => setIsOpen(true)}>{trigger}</button>
      {isOpen && <div className="modal">...</div>}
    </>
  );
}
```

### Solution: Extract to Controlled Pattern

```typescript
// New: Parent controls state
function NewModal({ isOpen, onClose, children }) {
  if (!isOpen) return null;
  return <BaseModal isOpen={isOpen} onClose={onClose}>{children}</BaseModal>;
}

// Wrapper for uncontrolled usage (backwards compatible)
function UncontrolledModal({ trigger, children }) {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <>
      <button onClick={() => setIsOpen(true)}>{trigger}</button>
      <NewModal isOpen={isOpen} onClose={() => setIsOpen(false)}>
        {children}
      </NewModal>
    </>
  );
}
```

## Pattern 4: Different Animation Libraries

When components use different animation approaches.

### Problem

```typescript
// ModalA uses framer-motion
<motion.div animate={{ opacity: 1 }}>

// ModalB uses CSS transitions
<div className="transition-opacity duration-300">

// ModalC uses react-spring
<animated.div style={fadeIn}>
```

### Solution: Animation Prop Abstraction

```typescript
interface BaseModalProps {
  // ... other props
  animation?: 'fade' | 'slide' | 'scale' | 'none';
  animationDuration?: number;
}

// Implement with CSS (most portable)
const animationClasses = {
  fade: 'animate-fade-in',
  slide: 'animate-slide-up',
  scale: 'animate-scale-in',
  none: '',
};

// Or provide render prop for custom animations
interface BaseModalProps {
  renderWrapper?: (props: { children: ReactNode; isOpen: boolean }) => ReactNode;
}
```

## Pattern 5: Different Overlay Handling

When components have inconsistent overlay/backdrop behavior.

### Problem

```typescript
// Some modals have overlay, some don't
// Some close on overlay click, some don't
// Some have blur, some have opacity
```

### Solution: Configurable Overlay

```typescript
interface OverlayConfig {
  show?: boolean;
  closeOnClick?: boolean;
  className?: string;
  blur?: boolean;
}

interface BaseModalProps {
  overlay?: boolean | OverlayConfig;
}

// Default overlay behavior
const defaultOverlay: OverlayConfig = {
  show: true,
  closeOnClick: true,
  className: 'bg-black/50',
  blur: false,
};
```

## Pattern 6: Form Integration

When modals contain forms with validation.

### Problem

```typescript
// Different modals handle forms differently
// Some use react-hook-form, some use formik, some are uncontrolled
```

### Solution: Form-Agnostic Base

```typescript
// Base modal is form-agnostic
<BaseModal isOpen={isOpen} onClose={onClose}>
  {/* Any form library works inside */}
  <form onSubmit={handleSubmit}>
    ...
  </form>
</BaseModal>

// Create form-specific variants if needed
function FormModal<T>({
  onSubmit,
  defaultValues,
  ...modalProps
}: FormModalProps<T>) {
  const form = useForm({ defaultValues });
  return (
    <BaseModal {...modalProps}>
      <FormProvider {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          {modalProps.children}
        </form>
      </FormProvider>
    </BaseModal>
  );
}
```

## Migration Checklist

```markdown
## Pre-Migration
- [ ] All similar components identified
- [ ] Similarity scores calculated
- [ ] Base component designed
- [ ] Breaking changes documented

## During Migration
- [ ] Base component implemented
- [ ] Type definitions complete
- [ ] First component migrated as POC
- [ ] Build passes after POC
- [ ] Remaining components migrated one-by-one
- [ ] Build verified after each migration

## Post-Migration
- [ ] All components using base component
- [ ] No duplicate implementations remain
- [ ] Types are strict (no `any`)
- [ ] Deprecated files removed
- [ ] Exports updated
- [ ] Documentation updated
```

## Rollback Strategy

If migration fails:

1. **Immediate rollback**: `git checkout -- <files>`
2. **Keep base component**: New components can use it
3. **Gradual migration**: Migrate remaining components in future PRs
4. **Hybrid approach**: Some components use base, some stay legacy

Never force all migrations in one PR if issues arise.
