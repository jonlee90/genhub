# Quick Start Guide: Materials Management
## Requirements 19-21 Implementation

**Status**: Backend Complete, UI Pending
**Last Updated**: December 8, 2025

---

## What's Ready to Use

### ✅ Database Schema
- 4 new tables: materials, material_assignments, expenses, expense_line_items
- 6 new enums for status and categories
- RLS policies for security
- Auto-updating budget triggers
- Helper functions for analytics

**Files**:
- `supabase/migrations/020_materials_and_expenses.sql`
- `supabase/migrations/021_materials_expenses_rls.sql`

### ✅ Home Depot Mock API
- 12 sample products (lumber, concrete, electrical, plumbing, etc.)
- Search by query, category, price, stock status
- Ready to replace with real API

**File**: `lib/services/home-depot-api.ts`

### ✅ Server Actions
- Materials: search, create, assign, update status
- Expenses: create, review, approve, OCR placeholder
- Analytics: project summaries, cost breakdowns

**Files**:
- `app/actions/materials.ts`
- `app/actions/expenses.ts`

---

## Quick Setup (3 Steps)

### 1. Apply Migrations

Option A - Using Supabase CLI:
```bash
cd supabase
supabase migration up
```

Option B - Using Supabase MCP:
```typescript
// Apply migration 020
await mcp__supabase__apply_migration({
  name: "materials_and_expenses",
  query: [paste contents of 020_materials_and_expenses.sql]
});

// Apply migration 021
await mcp__supabase__apply_migration({
  name: "materials_expenses_rls",
  query: [paste contents of 021_materials_expenses_rls.sql]
});
```

### 2. Generate Types

```bash
supabase gen types typescript --local > types/database.types.ts
```

Or use MCP:
```typescript
await mcp__supabase__generate_typescript_types();
```

### 3. Test Server Actions

Create a test page to verify:

```typescript
// app/app/test-materials/page.tsx
'use client';

import { searchProducts, assignMaterialToTask } from '@/app/actions/materials';
import { createExpense } from '@/app/actions/expenses';

export default function TestMaterialsPage() {
  const handleSearch = async () => {
    const result = await searchProducts({
      query: 'lumber',
      category: 'lumber',
      limit: 10
    });
    console.log('Search results:', result);
  };

  return (
    <div className="p-8">
      <h1>Test Materials Management</h1>
      <button onClick={handleSearch}>Search Lumber</button>
    </div>
  );
}
```

---

## Using the Server Actions

### Search Home Depot Products

```typescript
import { searchProducts } from '@/app/actions/materials';

const result = await searchProducts({
  query: 'drywall',
  category: 'drywall',
  minPrice: 10,
  maxPrice: 50,
  inStockOnly: true,
  page: 1,
  limit: 20
});

if (result.success) {
  console.log('Products:', result.data.products);
  console.log('Total:', result.data.total);
}
```

### Create Material from Home Depot

```typescript
import { createMaterialFromHomeDepot } from '@/app/actions/materials';

// After searching and selecting a product
const result = await createMaterialFromHomeDepot(selectedProduct);

if (result.success) {
  console.log('Material created:', result.data);
}
```

### Assign Material to Task

```typescript
import { assignMaterialToTask } from '@/app/actions/materials';

const result = await assignMaterialToTask({
  material_id: 'uuid-of-material',
  task_id: 'uuid-of-task',
  project_id: 'uuid-of-project',
  quantity: 50,
  unit_cost: 6.47,
  purchaser_type: 'gc',
  purchaser_id: 'uuid-of-purchaser',
  estimated_delivery_date: '2025-12-15',
  notes: 'Needed for framing phase'
});

if (result.success) {
  console.log('Material assigned:', result.data);
  // Task budget automatically updated!
}
```

### Update Procurement Status

```typescript
import { updateMaterialAssignment } from '@/app/actions/materials';

const result = await updateMaterialAssignment({
  id: 'uuid-of-assignment',
  procurement_status: 'ordered',
  ordered_date: new Date().toISOString(),
  estimated_delivery_date: '2025-12-20'
});

if (result.success) {
  console.log('Status updated:', result.data);
  // Notification sent to purchaser!
}
```

### Submit Expense

```typescript
import { createExpense } from '@/app/actions/expenses';

const result = await createExpense({
  description: 'Lumber purchase from Home Depot',
  amount: 323.50,
  category: 'materials',
  expense_date: '2025-12-08',
  project_id: 'uuid-of-project',
  task_id: 'uuid-of-task',
  vendor_name: 'Home Depot',
  receipt_url: 'https://storage.supabase.co/...'
});

if (result.success) {
  console.log('Expense submitted:', result.data);
  // PM notified for review!
}
```

### Review Expense

```typescript
import { reviewExpense } from '@/app/actions/expenses';

const result = await reviewExpense({
  id: 'uuid-of-expense',
  status: 'approved',
  approval_notes: 'Approved - within budget'
});

if (result.success) {
  console.log('Expense approved:', result.data);
  // Submitter notified!
  // Budget automatically updated!
}
```

### Get Project Material Summary

```typescript
import { getProjectMaterialSummary } from '@/app/actions/materials';

const result = await getProjectMaterialSummary('uuid-of-project');

if (result.success) {
  console.log('Total materials cost:', result.data.total_materials_cost);
  console.log('Materials needed:', result.data.materials_needed_count);
  console.log('Materials ordered:', result.data.materials_ordered_count);
  console.log('Total expenses:', result.data.total_expense_amount);
  console.log('Approved expenses:', result.data.approved_expense_amount);
}
```

---

## Data Flow

### Material Assignment Flow
1. User searches Home Depot products → `searchProducts()`
2. User selects product → `createMaterialFromHomeDepot()`
3. Material added to company catalog
4. User assigns material to task → `assignMaterialToTask()`
5. Database trigger updates `task.actual_cost`
6. Purchaser receives notification
7. Status updates: needed → ordered → delivered → installed

### Expense Flow
1. User submits expense with receipt → `createExpense()`
2. PM receives notification
3. (Optional) OCR processes receipt → `processReceiptOCR()`
4. PM reviews expense → `reviewExpense()`
5. If approved:
   - Database trigger updates `task.actual_cost`
   - Submitter receives notification
   - Budget variance checked

---

## Mock Data Available

### Home Depot Products (12 samples)

**Lumber**:
- 2x4x8 Whitewood Stud - $6.47
- 2x6x8 Pressure-Treated - $12.98

**Concrete**:
- QUIKRETE 80lb Mix - $5.48

**Electrical**:
- Romex 12/2 250ft - $139.00
- 4" Square Box - $2.18

**Plumbing**:
- 3" PVC Pipe 10ft - $14.27

**Drywall**:
- 1/2" x 4x8 Sheet - $14.98
- Joint Compound 4.5gal - $18.97

**Roofing**:
- GAF Timberline Shingles - $43.98

**Paint**:
- BEHR Premium 1gal - $38.98

**Hardware**:
- Drywall Screws 1lb - $7.97

**HVAC**:
- 6" Flex Duct 25ft - $32.47

**Flooring**:
- Luxury Vinyl Plank - $35.88/case

---

## Testing Checklist

```
Backend:
[x] Database migrations applied
[x] Types generated
[ ] Search products by query
[ ] Filter by category
[ ] Filter by price range
[ ] Create material from Home Depot
[ ] Assign material to task
[ ] Update procurement status
[ ] Submit expense
[ ] Review and approve expense
[ ] Get project summary
[ ] Check budget auto-updates
[ ] Verify notifications sent
[ ] Test RLS policies

Frontend (Pending):
[ ] Product search interface
[ ] Product cards display
[ ] Product comparison modal
[ ] Material assignment form
[ ] Expense submission form
[ ] Receipt upload with camera
[ ] OCR review interface
[ ] Expense approval interface
[ ] Materials dashboard
[ ] Cost breakdown charts
[ ] CSV export
[ ] PDF export
```

---

## Common Issues & Solutions

### Issue: Types not found
**Solution**: Run `supabase gen types typescript` or use MCP tool

### Issue: RLS policy denies access
**Solution**: Ensure user has active company_users record

### Issue: Budget not updating
**Solution**: Check that triggers are created (migration 020)

### Issue: Notifications not sent
**Solution**: Check notification_type enum includes new types

### Issue: Home Depot search returns empty
**Solution**: Check search query matches mock product names/descriptions

---

## Next: Build the UI

See the full implementation guide:
- `.claude/docs/implementation-summary-requirements-19-21.md`

Priority order:
1. Materials search interface
2. Material assignment to tasks
3. Expense submission form
4. Materials dashboard

---

## File Locations

```
Database:
  supabase/migrations/020_materials_and_expenses.sql
  supabase/migrations/021_materials_expenses_rls.sql

Backend:
  lib/services/home-depot-api.ts
  app/actions/materials.ts
  app/actions/expenses.ts

Documentation:
  .claude/tasks/context_session_10.md
  .claude/docs/implementation-summary-requirements-19-21.md
  .claude/docs/quick-start-materials-management.md (this file)
```

---

## Support

Questions? Check:
1. Implementation summary for detailed explanations
2. Context file for current status
3. Server action files for usage examples
4. Database schema for table structure

---

**Happy Building! 🏗️**
