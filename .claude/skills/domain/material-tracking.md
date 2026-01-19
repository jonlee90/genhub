# Skill: Material Tracking

> Construction material management patterns for GenHub

## When to Use

- Adding materials to tasks
- Material catalog management
- Tracking material status (ordered → delivered → installed)
- Home Depot product search integration
- Material price tracking
- Linking materials to spatial markers

## Prerequisites

- Check `.claude/docs/indexes/tables.md` for materials schema
- Check `.claude/docs/indexes/actions.md` for material actions

---

## Quick Reference

### Database Tables

| Table | Purpose |
|-------|---------|
| `materials` | Company material catalog (19 cols) |
| `material_assignments` | Task-to-material join (20 cols) |
| `tracked_materials` | Price tracking subscriptions |
| `material_price_history` | Historical price data |

### Two-Table Pattern (IMPORTANT)

Materials use a **catalog + assignment** pattern:

```sql
-- materials: Company-wide catalog
materials (
  id uuid PRIMARY KEY,
  company_id uuid NOT NULL,
  name text NOT NULL,
  sku text,
  unit_price numeric(10,2),
  category text,
  home_depot_product_id text,
  -- NO task_id - this is a catalog
)

-- material_assignments: Link to tasks
material_assignments (
  id uuid PRIMARY KEY,
  company_id uuid,
  material_id uuid REFERENCES materials(id),
  task_id uuid REFERENCES tasks(id),
  project_id uuid REFERENCES projects(id),
  quantity_needed numeric,
  quantity_ordered numeric,
  quantity_delivered numeric,
  status text,  -- 'pending' | 'ordered' | 'shipped' | 'delivered' | 'installed'
  marker_id uuid REFERENCES spatial_markers(id),
)
```

### Status Values
```typescript
type AssignmentStatus = 'pending' | 'ordered' | 'shipped' | 'delivered' | 'installed'

const STATUS_FLOW = {
  pending: ['ordered'],
  ordered: ['shipped', 'pending'],
  shipped: ['delivered', 'ordered'],
  delivered: ['installed', 'shipped'],
  installed: [],  // Terminal state
}
```

---

## Server Actions

### Key Actions (materials.ts)

| Action | Purpose |
|--------|---------|
| `searchProducts` | Search Home Depot products |
| `getProductDetails` | Get Home Depot product details |
| `createMaterial` | Add to company catalog |
| `createMaterialFromHomeDepot` | Add from Home Depot to catalog |
| `getMaterialsByCompany` | List company catalog |
| `getMaterialsByCategory` | Filter by category |
| `assignMaterialToTask` | Create assignment |
| `updateMaterialAssignment` | Update assignment status/qty |
| `deleteMaterialAssignment` | Remove assignment |
| `getMaterialAssignmentsByTask` | Assignments for task |
| `getMaterialAssignmentsByProject` | Assignments for project |
| `getProjectMaterialSummary` | Material stats for project |
| `getTaskMaterials` | Get task materials (old pattern) |
| `removeMaterialFromTask` | Remove from task |
| `updateMaterialQuantity` | Update quantity |
| `addProductToTask` | Search + assign in one step |
| `linkMaterialToMarker` | Link to spatial marker |
| `getMaterialsByMarker` | Get materials for marker |
| `getTaskLinkedMaterials` | Materials linked via markers |
| `getTrackedMaterials` | Price-tracked materials |
| `toggleTracking` | Enable/disable price tracking |
| `getMaterialSummaryStats` | Company-wide stats |
| `updateMaterialLeadTime` | Update lead time |

### Catalog + Assignment Pattern
```typescript
// 1. Add to catalog (or get existing)
const { data: material } = await createMaterial({
  name: 'Drywall 4x8',
  sku: 'DW-001',
  unitPrice: 15.99,
  category: 'Building Materials',
});

// 2. Assign to task with quantity
await assignMaterialToTask({
  materialId: material.id,
  taskId: taskId,
  projectId: projectId,
  quantityNeeded: 50,
});

// 3. Query assignments (not materials directly)
const assignments = await getMaterialAssignmentsByTask(taskId);
```

### Query Pattern
```typescript
// Get assignments with material details
const { data } = await supabase
  .from('material_assignments')
  .select(`
    *,
    material:materials (*),
    task:tasks (id, title),
    marker:spatial_markers (id, title)
  `)
  .eq('task_id', taskId);

// Each assignment has: quantity_needed, quantity_ordered,
// quantity_delivered, status + material catalog data
```

---

## Home Depot Integration

### Search and Add Pattern
```typescript
// Server Action: addProductToTask
export async function addProductToTask(input: {
  taskId: string;
  projectId: string;
  homeDepotProductId: string;
  quantity: number;
}) {
  // 1. Fetch product details from Home Depot
  const product = await getProductDetails(input.homeDepotProductId);

  // 2. Create or get catalog entry
  const material = await createMaterialFromHomeDepot(product);

  // 3. Create assignment to task
  await assignMaterialToTask({
    materialId: material.id,
    taskId: input.taskId,
    projectId: input.projectId,
    quantityNeeded: input.quantity,
  });
}
```

---

## Price Tracking

### Tracked Materials Pattern
```typescript
// Enable price tracking for a material
await toggleTracking(materialId, true);

// Get all tracked materials for company
const tracked = await getTrackedMaterials();

// Price history is stored in material_price_history
// when prices change via Home Depot sync
```

---

## Spatial Marker Integration

Materials can be linked to spatial markers for 3D location context:

```typescript
// Link material assignment to marker
await linkMaterialToMarker({
  assignmentId: assignmentId,
  markerId: markerId,
});

// Get materials for a specific marker location
const materials = await getMaterialsByMarker(markerId);
```

---

## Anti-Patterns

```typescript
// WRONG: Old direct task_id pattern
await supabase.from('materials').insert({
  task_id: taskId,  // Materials don't have task_id
  name: 'Material',
});

// CORRECT: Use catalog + assignment
const material = await createMaterial({ name, sku, unitPrice });
await assignMaterialToTask({ materialId: material.id, taskId });

// WRONG: Querying materials for task
const { data } = await supabase
  .from('materials')
  .select('*')
  .eq('task_id', taskId);

// CORRECT: Query assignments
const { data } = await supabase
  .from('material_assignments')
  .select('*, material:materials(*)')
  .eq('task_id', taskId);

// WRONG: Skipping status transitions
await updateMaterialAssignment(id, { status: 'installed' });
// Should validate transition from current status
```

---

## Checklist

- [ ] Use `material_assignments` table for task links (not `materials.task_id`)
- [ ] Materials in `materials` table are company catalog entries
- [ ] Assignments track: `quantity_needed`, `quantity_ordered`, `quantity_delivered`
- [ ] Status transitions validated via `STATUS_FLOW`
- [ ] Home Depot product ID stored in catalog
- [ ] Price tracking via `tracked_materials` if needed
- [ ] Spatial marker links via `marker_id` on assignments
- [ ] Company isolation via `getUserContext()`
