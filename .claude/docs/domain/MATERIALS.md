# Materials Domain Reference

> Material tracking patterns for GenHub

Last updated: 2026-01-09

---

## Overview

Materials track construction supplies from order to installation. They can be linked to tasks and projects, with optional Home Depot integration for product search.

---

## Data Model

### Materials Table
```sql
materials (
  id uuid PRIMARY KEY,
  project_id uuid REFERENCES projects(id),
  task_id uuid REFERENCES tasks(id),
  company_id uuid REFERENCES companies(id),

  -- Product info
  name text NOT NULL,
  description text,
  sku text,
  upc text,

  -- Quantities
  quantity integer NOT NULL DEFAULT 1,
  unit text DEFAULT 'each',
  quantity_used integer DEFAULT 0,

  -- Pricing
  unit_price decimal(10,2),
  total_price decimal(10,2),

  -- Status
  status material_status DEFAULT 'needed',

  -- Home Depot integration
  home_depot_id text,
  home_depot_url text,
  store_location text,

  -- Metadata
  notes text,
  created_at timestamptz,
  updated_at timestamptz,
  ordered_at timestamptz,
  delivered_at timestamptz,
  installed_at timestamptz
)
```

### Material Receipts Table
```sql
material_receipts (
  id uuid PRIMARY KEY,
  material_id uuid REFERENCES materials(id),

  -- Receipt info
  receipt_url text NOT NULL,
  vendor text,
  amount decimal(10,2),
  purchase_date date,

  -- AI extraction
  extracted_data jsonb,

  -- Metadata
  created_at timestamptz,
  uploaded_by uuid REFERENCES next_auth.users(id)
)
```

---

## Relationships

```
projects
  └── materials (1:N)
        ├── material_receipts (1:N)
        └── tasks (N:1)

materials → expenses (can link via expense.material_id)
```

---

## Server Actions

### Location
`app/actions/materials.ts`

### Available Actions

| Action | Purpose | Auth |
|--------|---------|------|
| getMaterials | List materials with filters | user |
| getMaterial | Get single material | user |
| createMaterial | Add new material | user |
| updateMaterial | Update material fields | user |
| updateMaterialStatus | Change status | user |
| deleteMaterial | Remove material | user |
| searchHomeDepot | Search Home Depot API | user |
| uploadReceipt | Upload and OCR receipt | user |

### Key Patterns

```typescript
// Get materials with status summary
export async function getProjectMaterials(projectId: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('materials')
    .select(`
      *,
      task:tasks(id, title),
      receipts:material_receipts(id, receipt_url)
    `)
    .eq('project_id', projectId)
    .order('created_at', { ascending: false })

  // Calculate summary
  const summary = {
    total: data?.length || 0,
    needed: data?.filter(m => m.status === 'needed').length || 0,
    ordered: data?.filter(m => m.status === 'ordered').length || 0,
    delivered: data?.filter(m => m.status === 'delivered').length || 0,
    installed: data?.filter(m => m.status === 'installed').length || 0,
    totalCost: data?.reduce((sum, m) => sum + (m.total_price || 0), 0) || 0,
  }

  return { data, summary, error }
}
```

---

## UI Components

### Location
`components/materials/`

### Key Components

| Component | Purpose |
|-----------|---------|
| MaterialList | Table/card view of materials |
| MaterialCard | Single material summary |
| MaterialDetail | Full material view |
| MaterialForm | Add/edit form |
| MaterialSearch | Home Depot search |
| ReceiptUpload | Receipt upload with OCR |
| MaterialStatusBadge | Status indicator |

### Home Depot Search
```tsx
<MaterialSearch
  onSelect={(product) => {
    setFormData({
      name: product.title,
      sku: product.sku,
      unit_price: product.price,
      home_depot_id: product.id,
      home_depot_url: product.url,
    })
  }}
/>
```

---

## Business Rules

### Status Flow
```
needed → ordered → delivered → installed
needed → delivered  (direct purchase)
ordered → needed  (cancel order)
delivered → needed  (return)
```

### Status Transitions
| From | To | Triggers |
|------|-----|----------|
| needed | ordered | Set ordered_at |
| ordered | delivered | Set delivered_at |
| delivered | installed | Set installed_at, update quantity_used |

### Cost Calculations
```typescript
// Total project material cost
const totalCost = materials.reduce((sum, m) =>
  sum + (m.unit_price * m.quantity), 0
)

// Remaining material value
const remainingValue = materials
  .filter(m => m.status !== 'installed')
  .reduce((sum, m) => sum + (m.unit_price * m.quantity), 0)

// Usage rate
const usageRate = materials.reduce((sum, m) =>
  sum + (m.quantity_used / m.quantity), 0
) / materials.length
```

---

## Home Depot Integration

### API Configuration
```typescript
// utils/homeDepot.ts
const HOME_DEPOT_API_KEY = process.env.HOME_DEPOT_API_KEY

export async function searchProducts(query: string) {
  const response = await fetch(
    `https://api.homedepot.com/products/search?q=${encodeURIComponent(query)}`,
    {
      headers: {
        'Authorization': `Bearer ${HOME_DEPOT_API_KEY}`,
      },
    }
  )

  return response.json()
}
```

### Product Data
```typescript
interface HomeDepotProduct {
  id: string
  title: string
  description: string
  sku: string
  price: number
  image_url: string
  url: string
  in_stock: boolean
  store_stock: number
}
```

---

## Receipt OCR

### AI Extraction
```typescript
import { generateObject } from 'ai'
import { anthropic } from '@ai-sdk/anthropic'

const ReceiptSchema = z.object({
  vendor: z.string(),
  date: z.string(),
  total: z.number(),
  items: z.array(z.object({
    name: z.string(),
    quantity: z.number(),
    price: z.number(),
    sku: z.string().optional(),
  })),
})

export async function extractReceiptData(imageBuffer: ArrayBuffer) {
  const { object } = await generateObject({
    model: anthropic('claude-sonnet-4-20250514'),
    schema: ReceiptSchema,
    messages: [{
      role: 'user',
      content: [
        { type: 'text', text: 'Extract receipt data:' },
        { type: 'image', image: imageBuffer },
      ],
    }],
  })

  return object
}
```

---

## Access Control

### RLS Policy
```sql
-- Company isolation
CREATE POLICY "materials_company_access" ON materials
  FOR ALL TO authenticated
  USING (company_id = get_user_company_id(next_auth.uid()));
```

---

## See Also

- `skills/domain/material-tracking.md` - Implementation patterns
- `docs/backend/SCHEMA_CORE.md` - Full schema
- `skills/integration/file-upload.md` - Receipt upload
