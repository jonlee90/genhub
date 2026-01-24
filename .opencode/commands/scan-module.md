---
name: scan-module
description: Scan a module/directory for refactoring opportunities
args:
  - name: path
    description: Directory or file to scan
    required: true
  - name: mode
    description: Scan mode (quick|deep|tailwind)
    default: quick
---

# Scan Module for Refactoring

Perform a comprehensive scan of the specified path to find:
- Files over 200 lines (god components)
- Repeated code patterns (extraction candidates)
- Tailwind class issues (redundancy, conflicts)
- HTML structure problems (div soup)

## Scan Modes

### Quick (default)
Fast analysis of obvious issues:
- File sizes
- Major duplications
- Critical class issues

### Deep
Full analysis including:
- Line-by-line pattern matching
- Cross-file duplication detection
- Complexity metrics
- Complete Tailwind audit

### Tailwind
Focused Tailwind-only analysis:
- Redundant classes
- Conflicting classes
- Class ordering
- Design token compliance

## Usage

```
/scan-module components/projects/
/scan-module components/ui/ --mode=deep
/scan-module app/app/tasks/page.tsx --mode=tailwind
```

## Output

Report saved to `.opencode/reports/scan-{timestamp}.md`

## What Happens Next

After scanning:
1. Review the report
2. Prioritize high-impact items
3. Use `/refactor` command or `refactor-specialist` agent to fix
4. Re-scan to verify improvements
