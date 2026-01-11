# GenHub Domain: Materials

## Procurement Workflow
```
needed → ordered → delivered → installed
```

## Enums
- **Category**: lumber | concrete | electrical | plumbing | hvac | roofing | flooring | paint | hardware | tools | fixtures | insulation | drywall | doors_windows | landscaping | other
- **Procurement**: needed | ordered | delivered | installed
- **Purchaser**: gc | pm | subcontractor

## Tables
- `materials` - Material catalog (→ companies)
- `material_assignments` - Task linkage (→ tasks, materials)
- `tracked_materials` - Active tracking instances
- `material_price_history` - Price over time

## Assignment Pattern
```typescript
// Materials linked to tasks via junction
material_assignments: {
  task_id, material_id, quantity, procurement_status
}
// Multiple materials per task, multiple tasks per material
```

## Key Actions (app/actions/materials.ts)
| Action | Purpose |
|--------|---------|
| getMaterials | List company catalog |
| createMaterial | Add to catalog |
| assignMaterial | Assign to task |
| getTaskMaterials | Get task's materials |
| updateMaterialStatus | Update procurement |

## Price Tracking
```typescript
// Track price changes over time
material_price_history: {
  tracked_material_id, price, recorded_at
}
```

## Common Patterns
- Materials exist at company level (catalog)
- Assignments at task level (usage)
- Procurement status per assignment, not material
- Revalidate `/app/materials` and `/app/tasks` after mutations

## Gotchas
- Don't confuse materials (catalog) with material_assignments (usage)
- Status is on assignment, not material
- Purchaser tracks who ordered, not who installed