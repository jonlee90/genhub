---
description: Generate a GenHub feature spec aligned with UI and domain rules
tags:
  - genhub
  - product
  - spec
dependencies:
  - subagent:genhub-product-ux
  - context:genhub/templates/feature-spec
---

# GenHub Feature Spec

**Arguments**: `$ARGUMENTS`

Provide a complete feature specification for GenHub using the template in
`.opencode/context/genhub/templates/feature-spec.md`.

## Workflow
1. Clarify feature goal, users, and success criteria
2. Draft spec with scope, data model, and UX notes
3. Ensure BaseModal + layout rules are referenced
4. Call out performance needs (deferred load, split, virtualize)

## Output
- Filled feature spec
- Acceptance criteria checklist
- Open questions for product decisions
