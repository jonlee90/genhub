# Detection Heuristics

Detailed scoring system for identifying similar components.

## Similarity Dimensions

### 1. Props Interface (40% weight)

| Score | Criteria |
|-------|----------|
| 100% | Identical prop names and types |
| 80% | Same props, different naming (e.g., `isOpen` vs `open`) |
| 60% | 70%+ prop overlap with minor additions |
| 40% | 50-69% prop overlap |
| 20% | <50% prop overlap |

**Common prop patterns to match:**

```typescript
// State control props (consider equivalent)
isOpen / open / visible / show
onClose / onDismiss / onHide / handleClose

// Content props (consider equivalent)
children / content / body
title / header / heading
footer / actions / buttons

// Styling props (consider equivalent)
className / style / classes
size / width / variant
```

### 2. Structure (30% weight)

| Score | Criteria |
|-------|----------|
| 100% | Identical JSX structure |
| 80% | Same sections (header/body/footer), different markup |
| 60% | 2 of 3 sections match |
| 40% | 1 of 3 sections match |
| 20% | Completely different structure |

**Structure detection:**

```typescript
// Look for these patterns:
const hasHeader = /className.*header|<Header|<h[1-6]/;
const hasBody = /className.*body|className.*content|children/;
const hasFooter = /className.*footer|className.*actions/;
```

### 3. Behavior (30% weight)

| Score | Criteria |
|-------|----------|
| 100% | Identical event handlers and effects |
| 80% | Same events, different implementation |
| 60% | Core behaviors match (open/close) |
| 40% | Some behaviors match |
| 20% | Different behaviors |

**Behavior patterns:**

```typescript
// Modal behaviors to detect:
- Escape key handling
- Overlay click handling
- Focus trapping
- Body scroll locking
- Animation transitions
```

## Auto-Refactor Candidates (≥70%)

These components can be consolidated with high confidence:

```
✅ Same purpose (both are modals)
✅ Same core props (isOpen, onClose)
✅ Same structure (header/body/footer)
✅ Different only in:
   - Specific content
   - Size/styling variations
   - Module-specific props
```

## Review Required (50-69%)

Present options to user before proceeding:

```
⚠️ Similar purpose but:
   - Different prop naming conventions
   - Partial structural overlap
   - Some unique behaviors

Ask user:
1. "Should I standardize prop names to {recommended}?"
2. "Should I keep behavior X or use behavior Y?"
3. "Which structure pattern do you prefer?"
```

## Skip (≤49%)

Too different to consolidate:

```
❌ Different purposes despite similar names
❌ Module-specific business logic embedded
❌ External library wrappers with constraints
❌ Components with fundamentally different UX
```

## Quick Detection Commands

```bash
# Find modal candidates
grep -rn "interface.*ModalProps" --include="*.tsx"

# Find components with isOpen/open patterns
grep -rn "isOpen.*boolean\|open.*boolean" --include="*.tsx" -l

# Find onClose handlers
grep -rn "onClose\|onDismiss\|onHide" --include="*.tsx" -l

# Compare two components
diff -u ComponentA.tsx ComponentB.tsx | head -100
```

## Similarity Report Template

```markdown
## Component Similarity Analysis

### Candidates Found: [N]

| Component | Props Score | Structure Score | Behavior Score | Total | Recommendation |
|-----------|-------------|-----------------|----------------|-------|----------------|
| ModalA    | 90%         | 85%             | 80%            | 85%   | Auto-refactor  |
| ModalB    | 85%         | 80%             | 75%            | 80%   | Auto-refactor  |
| ModalC    | 60%         | 70%             | 50%            | 60%   | Review needed  |
| DialogX   | 40%         | 30%             | 45%            | 38%   | Skip           |

### Common Props Identified
- isOpen (ModalA, ModalB) / open (ModalC)
- onClose (all)
- title (ModalA, ModalB)
- children (all)

### Recommended Base Interface
[Generated interface based on analysis]
```
