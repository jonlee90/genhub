# Command: /kc:research-ui

> Research UI patterns and Aceternity UI components

## Usage

```
/kc:research-ui [component-type]
```

## Description

Launches the frontend-architect agent to research UI patterns, Aceternity UI components, and design approaches before implementation.

## Use Cases

- Planning complex UI features
- Finding appropriate Aceternity components
- Researching animation patterns
- Comparing implementation approaches

## Workflow

1. **Define UI Need**
   - What component/feature is needed?
   - What are the UX requirements?

2. **Research Aceternity UI**
   - Search for matching components
   - Review component API
   - Check examples and demos

3. **Plan Implementation**
   - Recommend component approach
   - Document props and usage
   - Note customization needed

## Output

Returns research findings with:
- Recommended components
- Usage examples
- Customization notes
- Implementation approach

## Example

```
User: /kc:research-ui kanban-board

Output:
## UI Research: Kanban Board

### Recommended Approach
Use @dnd-kit for drag-and-drop with custom card components.

### Components Needed
1. KanbanBoard - Container with columns
2. KanbanColumn - Status column (use Aceternity Card)
3. KanbanCard - Draggable task card

### Aceternity Components
- Card: Base for columns and cards
- Badge: Status and priority indicators

### Implementation Notes
- Use @dnd-kit/core and @dnd-kit/sortable
- Follow GenHub color scheme (#001B51)
- Ensure mobile responsive (stack columns)
```

## See Also

- `skills/frontend/list-patterns.md` - List/Kanban patterns
- `agents/frontend-architect.md` - Frontend architect agent
- `docs/frontend/DESIGN_SYSTEM.md` - Design system rules
