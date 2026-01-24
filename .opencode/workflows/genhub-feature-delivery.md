---
description: End-to-end workflow for delivering GenHub features
---

# GenHub Feature Delivery Workflow

## Goal
Ship a feature across product spec, schema, UI, review, and validation.

## Steps
1. **Spec**: Use `/feature-spec` to define scope and acceptance criteria
2. **Schema**: Use `/db-schema` to design tables, enums, and RLS
3. **Build**: Implement server actions + UI using GenHub standards
4. **Review**: Run code review (quality, security, performance)
5. **Validate**: Run tests or targeted checks as needed

## Agents
- GenHubProductUX
- GenHubSupabase
- GenHubNextjs
- CodeReviewer

## Outputs
- Feature spec
- Schema + RLS notes
- Implementation checklist
- Review summary
