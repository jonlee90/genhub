# Command: /kc:docs

> Create comprehensive documentation for code and features

## Usage

```
/kc:docs [target] [type]
```

## Description

Launches the technical-documentation-writer agent to create user manuals, tutorials, guides, API documentation, and technical references based on existing code.

## Arguments

- `target` — What to document (e.g., `api`, `component`, `feature`, `workflow`)
- `type` — Documentation type: `manual`, `tutorial`, `guide`, `reference`, `how-to`

## Use Cases

- API documentation from endpoints
- Component library documentation
- Feature user guides
- Installation/setup instructions
- Workflow tutorials
- How-to guides for specific tasks

## Workflow

1. **Analyze Code**
   - Read relevant source files
   - Understand structure and patterns
   - Identify key concepts

2. **Plan Documentation**
   - Outline structure
   - Identify audience
   - Determine coverage

3. **Create Documentation**
   - Write clear explanations
   - Include code examples
   - Add step-by-step instructions

## Output

Creates markdown documentation with:
- Overview/introduction
- Step-by-step instructions or API reference
- Code examples
- Common use cases
- Troubleshooting section

## Examples

```
User: /kc:docs api reference

Output:
Created API documentation:
- Generated comprehensive API reference
- Includes all endpoints, parameters, examples
- Saved to docs/api-reference.md

User: /kc:docs chat-realtime tutorial

Output:
Created tutorial:
- Step-by-step guide for implementing realtime chat
- Includes code examples and architecture overview
- Saved to docs/tutorials/chat-realtime.md
```

## See Also

- `agents/technical-documentation-writer.md` - Documentation writer agent
- `skills/workflow/doc-sync.md` - Documentation synchronization
