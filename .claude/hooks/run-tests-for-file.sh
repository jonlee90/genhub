#!/usr/bin/env bash

# PostToolUse async hook: Run type checking after source file edits
# Runs in background, non-blocking

INPUT=$(cat)
FILE_PATH=$(echo "$INPUT" | jq -r '.tool_input.file_path // empty' 2>/dev/null)

# Skip non-source files
if [[ "$FILE_PATH" != *.ts ]] && [[ "$FILE_PATH" != *.tsx ]]; then
  exit 0
fi

# Skip test files, config files, and type declaration files
if [[ "$FILE_PATH" == *.spec.* ]] || [[ "$FILE_PATH" == *.test.* ]] || [[ "$FILE_PATH" == *.config.* ]] || [[ "$FILE_PATH" == *.d.ts ]]; then
  exit 0
fi

# Run TypeScript type check on the modified file's project
# Using --noEmit for fast check without output
npx tsc --noEmit --pretty 2>&1 | tail -20

exit 0
