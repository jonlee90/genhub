#!/usr/bin/env bash

# PreToolUse hook: Block edits to sensitive/protected files
# Exit 0 = allow, Exit 2 = block

INPUT=$(cat)
FILE_PATH=$(echo "$INPUT" | jq -r '.tool_input.file_path // empty' 2>/dev/null)

# Skip if no file path (non-file tool calls)
if [ -z "$FILE_PATH" ]; then
  exit 0
fi

# Protected file patterns
PROTECTED_PATTERNS=(
  ".env"
  ".env.local"
  ".env.production"
  "package-lock.json"
  "pnpm-lock.yaml"
  ".git/"
  ".npmrc"
  "credentials"
)

for pattern in "${PROTECTED_PATTERNS[@]}"; do
  if [[ "$FILE_PATH" == *"$pattern"* ]]; then
    echo "BLOCKED: Cannot edit '$FILE_PATH' (matches protected pattern '$pattern'). Ask user for permission first." >&2
    exit 2
  fi
done

exit 0
