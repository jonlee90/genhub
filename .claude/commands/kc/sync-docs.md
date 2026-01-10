# /kc:sync-docs

## Usage
```bash
/kc:sync-docs                           # Full sync check
/kc:sync-docs --source=database/tasks   # After table change
/kc:sync-docs --source=actions/tasks.ts # After action change
/kc:sync-docs --changed-files           # Based on git diff
```

## Execution

1. Load dependency graph from `.claude/docs/dependencies.json`
2. Find all affected docs for the given source
3. For each affected doc:
   - Read current content
   - Read source (database/file)
   - Generate updated content
   - Write if changed
4. Output sync report

## Output Format
```markdown
# Sync Report

## Updated
- indexes/tables.md - Added new_table entry
- backend/SCHEMA_CORE.md - Updated tasks schema

## Flagged for Manual Review
- domain/TASKS.md - Complex changes, verify accuracy

## No Changes Needed
- indexes/actions.md - Already current
```