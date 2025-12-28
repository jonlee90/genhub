---
description: Git Conventional Commits
globs:
---

# Git Conventional Commits

Rule for automatically committing changes made by CursorAI using conventional commits format.

## Rule: conventional_commits

**Description:** Automatically commit changes made by CursorAI using conventional commits format

### Filters
- type: event - pattern: "build_success"
- type: file_change - pattern: "*"

### Actions

#### Execute Command
```bash
# Extract the change type and scope from the changes
CHANGE_TYPE=""
case "$CHANGE_DESCRIPTION" in
  *"add"*|*"create"*|*"implement"*) CHANGE_TYPE="feat";;
  *"fix"*|*"correct"*|*"resolve"*) CHANGE_TYPE="fix";;
  *"refactor"*|*"restructure"*) CHANGE_TYPE="refactor";;
  *"test"*) CHANGE_TYPE="test";;
  *"doc"*|*"comment"*) CHANGE_TYPE="docs";;
  *"style"*|*"format"*) CHANGE_TYPE="style";;
  *"perf"*|*"optimize"*) CHANGE_TYPE="perf";;
  *) CHANGE_TYPE="chore";;
esac

# Extract scope from file path
SCOPE=$(dirname "$FILE" | tr '/' '-')

# Commit the changes
git add "$FILE"
git commit -m "$CHANGE_TYPE($SCOPE): $CHANGE_DESCRIPTION"
```

#### Suggestion Message
Changes should be committed using conventional commits format:

**Format:** `<type>(<scope>): <description>`

**Types:**
- **feat**: A new feature
- **fix**: A bug fix
- **docs**: Documentation only changes
- **style**: Changes that do not affect the meaning of the code
- **refactor**: A code change that neither fixes a bug nor adds a feature
- **perf**: A code change that improves performance
- **test**: Adding missing tests or correcting existing tests
- **chore**: Changes to the build process or auxiliary tools

The scope should be derived from the file path or affected component.
The description should be clear and concise, written in imperative mood.

### Examples

**Example 1: Adding a new function**
```
Input:
  CHANGE_DESCRIPTION="add user authentication function"
  FILE="src/auth/login.ts"

Output: "feat(src-auth): add user authentication function"
```

**Example 2: Fixing a bug**
```
Input:
  CHANGE_DESCRIPTION="fix incorrect date parsing"
  FILE="lib/utils/date.js"

Output: "fix(lib-utils): fix incorrect date parsing"
```

### Metadata
- **Priority:** high
- **Version:** 1.0
