# Skill: Material Tracking

> Construction material management patterns for GenHub

## When to Use

- Adding materials to tasks
- Tracking material status (ordered → delivered → installed)
- Home Depot product search integration
- Receipt upload and matching

## Prerequisites

- Check `docs/indexes/tables.md` for materials schema
- Materials are linked to tasks, not directly to projects

---

## Quick Reference

### Database Schema
```sql
materials (
  id uuid PRIMARY KEY,
  task_id uuid REFERENCES tasks(id) ON DELETE CASCADE,
  company_id uuid NOT NULL,
  name text NOT NULL,
  description text,
  sku text,
  quantity integer DEFAULT 1,
  unit text,
  unit_price numeric(10,2),
  total_price numeric(10,2),
  status material_status DEFAULT 'pending',
  supplier text,
  home_depot_product_id text,
  receipt_url text,
  notes text,
  created_at timestamptz,
  updated_at timestamptz
)
```

### Status Values
```typescript
type MaterialStatus = 'pending' | 'ordered' | 'shipped' | 'delivered' | 'installed'

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

### Get Materials for Task
```typescript
export async function getTaskMaterials(taskId: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('materials')
    .select('*')
    .eq('task_id', taskId)
    .order('created_at', { ascending: false })

  if (error) return { error: error.message }
  return { data }
}
```

### Get Materials for Project
```typescript
export async function getProjectMaterials(projectId: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('materials')
    .select(`
      *,
      task:tasks!inner(id, title, project_id)
    `)
    .eq('task.project_id', projectId)
    .order('created_at', { ascending: false })

  if (error) return { error: error.message }
  return { data }
}
```

### Add Material
```typescript
export async function addMaterial(input: {
  taskId: string
  name: string
  quantity: number
  unit?: string
  unitPrice?: number
  sku?: string
  supplier?: string
  homeDepotProductId?: string
}) {
  const supabase = await createClient()

  // Get company from task
  const { data: task } = await supabase
    .from('tasks')
    .select('project:projects(company_id)')
    .eq('id', input.taskId)
    .single()

  if (!task) return { error: 'Task not found' }

  const totalPrice = input.unitPrice ? input.unitPrice * input.quantity : null

  const { data, error } = await supabase
    .from('materials')
    .insert({
      task_id: input.taskId,
      company_id: task.project.company_id,
      name: input.name,
      quantity: input.quantity,
      unit: input.unit,
      unit_price: input.unitPrice,
      total_price: totalPrice,
      sku: input.sku,
      supplier: input.supplier,
      home_depot_product_id: input.homeDepotProductId,
      status: 'pending',
    })
    .select()
    .single()

  if (error) return { error: error.message }

  revalidatePath(`/app/tasks/${input.taskId}`)
  return { data }
}
```

### Update Material Status
```typescript
export async function updateMaterialStatus(
  materialId: string,
  newStatus: MaterialStatus
) {
  const supabase = await createClient()

  // Validate status transition
  const { data: material } = await supabase
    .from('materials')
    .select('status, task_id')
    .eq('id', materialId)
    .single()

  if (!material) return { error: 'Material not found' }

  const allowedTransitions = STATUS_FLOW[material.status as MaterialStatus]
  if (!allowedTransitions.includes(newStatus)) {
    return { error: `Cannot transition from ${material.status} to ${newStatus}` }
  }

  const { error } = await supabase
    .from('materials')
    .update({ status: newStatus, updated_at: new Date().toISOString() })
    .eq('id', materialId)

  if (error) return { error: error.message }

  revalidatePath(`/app/tasks/${material.task_id}`)
  return { success: true }
}
```

### Bulk Status Update
```typescript
export async function bulkUpdateMaterialStatus(
  materialIds: string[],
  newStatus: MaterialStatus
) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('materials')
    .update({ status: newStatus, updated_at: new Date().toISOString() })
    .in('id', materialIds)

  if (error) return { error: error.message }

  revalidatePath('/app/materials')
  return { success: true, count: materialIds.length }
}
```

---

## Home Depot Integration

### Search Products
```typescript
// utils/homeDepot.ts
const HOME_DEPOT_API_KEY = process.env.HOME_DEPOT_API_KEY

export async function searchHomeDepotProducts(query: string) {
  // Note: This is a placeholder - actual API may differ
  const response = await fetch(
    `https://api.homedepot.com/products/search?q=${encodeURIComponent(query)}`,
    {
      headers: { 'Authorization': `Bearer ${HOME_DEPOT_API_KEY}` },
    }
  )

  if (!response.ok) throw new Error('Home Depot API error')
  return response.json()
}

// Server Action wrapper
export async function searchProducts(query: string) {
  try {
    const products = await searchHomeDepotProducts(query)
    return { data: products }
  } catch (err) {
    return { error: 'Failed to search products' }
  }
}
```

### Add from Home Depot
```typescript
export async function addMaterialFromHomeDepot(
  taskId: string,
  product: HomeDepotProduct,
  quantity: number
) {
  return addMaterial({
    taskId,
    name: product.name,
    quantity,
    unitPrice: product.price,
    sku: product.sku,
    supplier: 'Home Depot',
    homeDepotProductId: product.id,
  })
}
```

---

## UI Components

### Material Card
```tsx
'use client'

import { Package, Truck, Check } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { formatCurrency } from '@/lib/utils'

const STATUS_CONFIG = {
  pending: { label: 'Pending', color: 'bg-gray-100 text-gray-800', icon: Package },
  ordered: { label: 'Ordered', color: 'bg-blue-100 text-blue-800', icon: Package },
  shipped: { label: 'Shipped', color: 'bg-yellow-100 text-yellow-800', icon: Truck },
  delivered: { label: 'Delivered', color: 'bg-green-100 text-green-800', icon: Truck },
  installed: { label: 'Installed', color: 'bg-green-200 text-green-900', icon: Check },
}

export function MaterialCard({ material, onStatusChange }: MaterialCardProps) {
  const config = STATUS_CONFIG[material.status]
  const StatusIcon = config.icon

  return (
    <div className="p-4 border-2 border-gray-200 rounded-lg">
      <div className="flex items-start justify-between">
        <div>
          <h4 className="font-medium">{material.name}</h4>
          {material.sku && (
            <p className="text-sm text-gray-500">SKU: {material.sku}</p>
          )}
        </div>
        <Badge className={config.color}>
          <StatusIcon className="w-3 h-3 mr-1" />
          {config.label}
        </Badge>
      </div>

      <div className="flex items-center justify-between mt-3 text-sm">
        <span className="text-gray-600">
          {material.quantity} {material.unit || 'units'}
        </span>
        {material.total_price && (
          <span className="font-medium">
            {formatCurrency(material.total_price)}
          </span>
        )}
      </div>

      {onStatusChange && (
        <div className="flex gap-2 mt-3 pt-3 border-t">
          {STATUS_FLOW[material.status].map(nextStatus => (
            <Button
              key={nextStatus}
              size="sm"
              variant="outline"
              onClick={() => onStatusChange(material.id, nextStatus)}
            >
              Mark {nextStatus}
            </Button>
          ))}
        </div>
      )}
    </div>
  )
}
```

### Add Material Modal
```tsx
'use client'

import { useState } from 'react'
import { BaseModal } from '@/components/ui/BaseModal'
import { Package } from 'lucide-react'
import { addMaterial } from '@/app/actions/materials'

interface AddMaterialModalProps {
  isOpen: boolean
  onClose: () => void
  taskId: string
}

export function AddMaterialModal({ isOpen, onClose, taskId }: AddMaterialModalProps) {
  const [isPending, setIsPending] = useState(false)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsPending(true)

    const formData = new FormData(e.currentTarget)
    const result = await addMaterial({
      taskId,
      name: formData.get('name') as string,
      quantity: Number(formData.get('quantity')),
      unit: formData.get('unit') as string,
      unitPrice: formData.get('unitPrice') ? Number(formData.get('unitPrice')) : undefined,
      sku: formData.get('sku') as string,
      supplier: formData.get('supplier') as string,
    })

    setIsPending(false)

    if (result.error) {
      toast.error(result.error)
      return
    }

    toast.success('Material added')
    onClose()
  }

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title="Add Material"
      icon={<Package className="w-5 h-5" />}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Form fields */}
      </form>
    </BaseModal>
  )
}
```

---

## Material Summary

### Project Material Summary
```typescript
export async function getProjectMaterialSummary(projectId: string) {
  const supabase = await createClient()

  const { data } = await supabase
    .from('materials')
    .select(`
      status,
      total_price,
      task:tasks!inner(project_id)
    `)
    .eq('task.project_id', projectId)

  if (!data) return null

  const summary = {
    total: data.length,
    totalCost: data.reduce((sum, m) => sum + (m.total_price || 0), 0),
    byStatus: {
      pending: data.filter(m => m.status === 'pending').length,
      ordered: data.filter(m => m.status === 'ordered').length,
      shipped: data.filter(m => m.status === 'shipped').length,
      delivered: data.filter(m => m.status === 'delivered').length,
      installed: data.filter(m => m.status === 'installed').length,
    },
  }

  return summary
}
```

---

## Anti-Patterns

```typescript
// WRONG: Direct material → project link
materials.project_id = projectId
// Materials should link to tasks, not projects

// CORRECT: Task linkage
materials.task_id = taskId

// WRONG: Skipping status transitions
await updateMaterialStatus(id, 'installed')
// Should validate transition from current status

// WRONG: Not recalculating totals
await supabase.from('materials').update({ quantity: newQty })
// Should recalculate total_price
```

---

## Checklist

- [ ] Materials linked to task (not project)
- [ ] Company ID set from task's project
- [ ] Status transitions validated
- [ ] Total price recalculated on quantity change
- [ ] Home Depot ID stored if from search
- [ ] Receipt URL stored if uploaded
- [ ] RLS via task → project → company chain
