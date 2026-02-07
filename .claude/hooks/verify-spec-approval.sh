#!/usr/bin/env bash

# PreToolUse hook: Verify spec phase approvals before implementation
# Called when editing files that match a spec feature
# Exit 0 = allow, Exit 2 = block

INPUT=$(cat)
COMMAND=$(echo "$INPUT" | jq -r '.tool_input.command // empty' 2>/dev/null)

# Only check when running kc:impl or implementation-related commands
if ! echo "$COMMAND" | grep -q 'kc:impl\|implement'; then
  exit 0
fi

# Extract feature name from command if present
FEATURE=$(echo "$COMMAND" | grep -oP '(?<=specs/)[^/]+' || echo "")

if [ -z "$FEATURE" ]; then
  exit 0
fi

SPEC_DIR=".claude/specs/$FEATURE"

if [ ! -d "$SPEC_DIR" ]; then
  exit 0
fi

# Check for approval markers
MISSING=""
if [ -f "$SPEC_DIR/requirements.md" ] && [ ! -f "$SPEC_DIR/requirements.APPROVED" ]; then
  MISSING="${MISSING}\n  - requirements.APPROVED missing"
fi

if [ -f "$SPEC_DIR/design.md" ] && [ ! -f "$SPEC_DIR/design.APPROVED" ]; then
  MISSING="${MISSING}\n  - design.APPROVED missing"
fi

if [ -f "$SPEC_DIR/tasks.md" ] && [ ! -f "$SPEC_DIR/tasks.APPROVED" ]; then
  MISSING="${MISSING}\n  - tasks.APPROVED missing"
fi

if [ -n "$MISSING" ]; then
  echo "BLOCKED: Spec '$FEATURE' has unapproved phases:$MISSING" >&2
  echo "Create approval markers with: touch $SPEC_DIR/{phase}.APPROVED" >&2
  exit 2
fi

exit 0
