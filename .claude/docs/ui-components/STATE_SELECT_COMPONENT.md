# StateSelect Component Documentation

## Overview

A reusable US States dropdown component with all 50 US states, designed for the GenHub construction-themed application.

## Component Location

```
components/ui/StateSelect.tsx
```

## Features

- ✅ All 50 US states with abbreviations
- ✅ Construction theme styling (#001B51 primary color)
- ✅ Compatible with react-hook-form and standard forms
- ✅ Controlled and uncontrolled modes
- ✅ Error state styling (red border)
- ✅ Disabled state support
- ✅ TypeScript with full type safety
- ✅ Hidden input for form submission
- ✅ Helper functions for state name conversion

## Usage

### Basic (Controlled)

```tsx
import { StateSelect } from '@/components/ui/StateSelect';

function MyForm() {
  const [state, setState] = useState('');

  return (
    <StateSelect
      value={state}
      onValueChange={setState}
      placeholder="Select state"
    />
  );
}
```

### Uncontrolled with Default Value

```tsx
<StateSelect
  name="state"
  defaultValue="CA"
/>
```

### With Form Integration

```tsx
<form onSubmit={handleSubmit}>
  <Label htmlFor="state">State</Label>
  <StateSelect
    id="state"
    name="state"
    value={formValues.state}
    onValueChange={(value) => setFormValues({ ...formValues, state: value })}
    required
  />
</form>
```

### With Error State

```tsx
<StateSelect
  value={state}
  onValueChange={setState}
  error={!!errors.state}
/>
{errors.state && (
  <p className="text-sm text-red-600">{errors.state}</p>
)}
```

### Disabled

```tsx
<StateSelect
  defaultValue="NY"
  disabled
/>
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `value` | `string` | - | Current value (controlled) |
| `defaultValue` | `string` | - | Default value (uncontrolled) |
| `onValueChange` | `(value: string) => void` | - | Change handler |
| `disabled` | `boolean` | `false` | Disabled state |
| `error` | `boolean` | `false` | Error state (red border) |
| `placeholder` | `string` | `'Select state'` | Placeholder text |
| `className` | `string` | - | Additional className for trigger |
| `name` | `string` | - | Name attribute for form submission |
| `required` | `boolean` | `false` | Required field |
| `id` | `string` | - | ID for label association |

## Helper Functions

### getStateName(abbreviation: string)

Convert state abbreviation to full name.

```tsx
import { getStateName } from '@/components/ui/StateSelect';

getStateName('CA'); // → 'California'
getStateName('NY'); // → 'New York'
```

### getStateAbbreviation(name: string)

Convert full state name to abbreviation.

```tsx
import { getStateAbbreviation } from '@/components/ui/StateSelect';

getStateAbbreviation('California'); // → 'CA'
getStateAbbreviation('New York'); // → 'NY'
```

## States List

The component includes all 50 US states:

```typescript
export const US_STATES = [
  { value: 'AL', label: 'Alabama' },
  { value: 'AK', label: 'Alaska' },
  // ... all 50 states
] as const;
```

## Implementation Details

### Form Submission

The component automatically includes a hidden input when the `name` prop is provided:

```tsx
<StateSelect name="state" value={selectedState} />

// Renders:
// <Select>...</Select>
// <input type="hidden" name="state" value="CA" />
```

This ensures the value is submitted with the form data.

### Styling

The component uses the existing `Select` component from `@/components/ui/select` with construction theme colors:

- Focus ring: `construction-blue/20`
- Focus border: `construction-blue`
- Error border: `red-500`
- Height: `h-11` (44px for mobile tap targets)

### Accessibility

- Supports `id` prop for label association
- Supports `required` attribute
- Keyboard navigation via Radix UI Select
- Screen reader compatible

## Files Modified

### Created
1. `/components/ui/StateSelect.tsx` - Main component
2. `/components/ui/StateSelect.example.tsx` - Usage examples

### Updated
1. `/components/projects/CreateProjectForm.tsx`
   - Imported `StateSelect` component
   - Replaced state `Input` field with `StateSelect` (line 927-934)

## Integration Example

**Before:**
```tsx
<Input
  id="state"
  name="state"
  placeholder="State"
  disabled={isPending}
  className="h-11 border-gray-200"
  defaultValue={formValues.state}
  onChange={(e) => setFormValues({ ...formValues, state: e.target.value })}
/>
```

**After:**
```tsx
<StateSelect
  id="state"
  name="state"
  placeholder="Select state"
  disabled={isPending}
  value={formValues.state}
  onValueChange={(value) => setFormValues({ ...formValues, state: value })}
/>
```

## Benefits

1. **User Experience**: Dropdown prevents typos and ensures valid state values
2. **Consistency**: All state inputs use the same format (2-letter abbreviation)
3. **Validation**: No need for custom validation logic
4. **Accessibility**: Better for mobile users with large tap targets
5. **Searchable**: Users can type to search (built into Radix UI Select)

## Testing

To test the component:

1. Navigate to project creation form
2. Fill in location details
3. Click the state dropdown
4. Select a state
5. Verify the state abbreviation is saved correctly
6. Test with form submission

## Future Enhancements

Possible improvements:

- Add state grouping by region (West, East, etc.)
- Add state flags or icons
- Support for US territories (PR, GU, VI, etc.)
- Integration with address autocomplete APIs
