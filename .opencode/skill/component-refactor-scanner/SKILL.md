---
name: component-refactor-scanner
description: Scans modules for HTML structure issues, Tailwind class redundancy, and refactoring opportunities
globs:
  - "components/**/*.tsx"
  - "app/**/*.tsx"
---

# Component Refactor Scanner Skill

This skill enables deep scanning of React components for:
- Unnecessary HTML nesting (div soup)
- Redundant/conflicting Tailwind classes
- Opportunities to extract reusable components
- Code that violates DRY principles

## Quick Commands

### Scan Single File
```
scan {filepath} for refactoring opportunities
```

### Scan Directory
```
deep scan {directory} for component cleanup
```

### Tailwind Audit
```
audit Tailwind classes in {filepath}
```

## Scanning Rules

### HTML Structure

**Div Soup Detection:**
- More than 3 levels of nested divs without semantic purpose
- Empty wrapper divs (div containing only another div)
- Fragments inside single parents
- Divs that could be semantic elements (button, nav, article)

**Fix Approach:**
1. Flatten unnecessary nesting
2. Combine classes on single element
3. Use semantic HTML elements
4. Extract repeated structures to components

### Tailwind Classes

**Redundant Class Patterns:**
| Pattern | Issue |
|---------|-------|
| `flex flex-row` | flex defaults to row |
| `block` on div | block is default |
| `static` | static is default position |
| `font-normal` | normal is default |
| `text-left` | left is default |

**Conflicting Class Patterns:**
| Pattern | Resolution |
|---------|------------|
| `p-4 p-2` | Keep last (p-2) |
| `text-sm text-lg` | Keep intended |
| Multiple bg colors | Keep intended |

**Class Ordering (Correct Order):**
1. Layout (flex, grid, block)
2. Positioning (relative, absolute)
3. Sizing (w-, h-)
4. Spacing (p-, m-, gap-)
5. Typography (text-, font-)
6. Colors (bg-, text-)
7. Borders (border, rounded)
8. Effects (shadow, opacity)
9. States (hover:, active:, focus:)
10. Responsive (sm:, md:, lg:)

### Component Extraction

**Trigger Conditions:**
- Same JSX pattern appears 2+ times
- Same className string appears 3+ times
- File exceeds 300 lines
- Component has 5+ useState hooks

**Extraction Types:**
| Pattern | Extract To |
|---------|------------|
| Repeated JSX | New component |
| Repeated classes | cn() variable or cva() |
| Repeated logic | Custom hook |
| Repeated types | Shared type file |

## Output Format

```markdown
## Scan Results: {path}

### Summary
- Files scanned: N
- Issues found: N
- Extraction opportunities: N

### Critical (Fix Immediately)
1. **{file}:{line}** - {issue description}
   - Before: `{code}`
   - After: `{code}`

### Recommendations
1. Extract `{pattern}` to `<ComponentName>`
2. Consolidate classes to `{variable}`

### Metrics
| Metric | Before | After (est) |
|--------|--------|-------------|
| Lines | X | Y |
| Components | X | Y+N |
| Shared utils | X | Y+N |
```

## Integration

This skill is used by:
- `component-scanner` agent - For read-only analysis
- `refactor-specialist` agent - For executing changes
- `tailwind-optimizer` agent - For class-specific fixes

## References

See `references/` for:
- `html-patterns.md` - Common HTML anti-patterns
- `tailwind-guide.md` - Complete Tailwind optimization rules
- `extraction-heuristics.md` - When to extract components
