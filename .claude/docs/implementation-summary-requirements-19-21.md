# Implementation Summary: Requirements 19-21
## Materials Management, Expense Automation, and Materials Dashboard

**Date**: December 8, 2025
**Session**: Session 10
**Status**: Database & Server Actions Complete, UI Components Pending

---

## Overview

This document summarizes the implementation of Requirements 19-21 for the GenHub PWA construction management application:

- **Requirement 19**: Materials Management with Home Depot Integration
- **Requirement 20**: Expense Automation via AI OCR
- **Requirement 21**: Project-Wide Materials Dashboard

---

## What Has Been Completed

### Phase 1: Database Schema ✅

#### Migration Files Created
1. **`supabase/migrations/020_materials_and_expenses.sql`**
   - Complete database schema for materials and expenses
   - Helper functions for budget calculations
   - Automatic triggers for cost updates

2. **`supabase/migrations/021_materials_expenses_rls.sql`**
   - Row-level security policies
   - Company-based access control
   - Role-based permissions (GC Admin, PM, Workers)

#### Database Tables

**materials** - Product catalog from Home Depot or manual entry
- `id`, `company_id`, `product_name`, `product_description`
- `sku`, `category` (enum), `manufacturer`
- `unit_price`, `unit_of_measure`
- `home_depot_product_id`, `home_depot_url`, `product_image_url`
- `stock_status`, `lead_time_days`
- `specifications` (JSONB for flexible product specs)
- `is_active`, `created_by`, `created_at`, `updated_at`

**material_assignments** - Links materials to tasks with procurement tracking
- `id`, `material_id`, `task_id`, `project_id`
- `quantity`, `unit_cost`, `total_cost` (computed column)
- `procurement_status` (needed, ordered, delivered, installed)
- `purchaser_type` (gc, pm, subcontractor)
- `purchaser_id`, `subcontractor_id`
- `ordered_date`, `estimated_delivery_date`, `delivered_date`, `installed_date`
- `notes`, `assigned_by`, `created_at`, `updated_at`

**expenses** - Receipt-based expense tracking with OCR
- `id`, `company_id`, `project_id`, `task_id`
- `description`, `amount`, `category` (enum), `expense_date`
- `vendor_name`, `vendor_address`
- `receipt_url`, `receipt_ocr_data` (JSONB), `ocr_confidence_score`
- `ocr_processed`
- `status` (submitted, under_review, approved, rejected, paid)
- `submitted_by`, `submitted_at`, `reviewed_by`, `reviewed_at`, `approval_notes`
- `created_at`, `updated_at`

**expense_line_items** - Individual items from receipts with AI matching
- `id`, `expense_id`
- `material_id`, `material_assignment_id` (links to materials)
- `description`, `quantity`, `unit_price`, `line_total` (computed)
- `matched_by_ai`, `match_confidence_score`, `manually_matched`
- `ocr_extracted_data` (JSONB)
- `created_at`, `updated_at`

#### Enums Created
- `procurement_status`: needed, ordered, delivered, installed
- `material_category`: lumber, concrete, electrical, plumbing, hvac, roofing, flooring, paint, hardware, tools, fixtures, insulation, drywall, doors_windows, landscaping, other
- `purchaser_type`: gc, pm, subcontractor
- `expense_status`: submitted, under_review, approved, rejected, paid
- `expense_category`: materials, labor, equipment, permits, transportation, meals, lodging, other

#### Database Functions
- **`update_task_costs()`** - Auto-updates `task.actual_cost` when materials or expenses change
- **`get_project_material_summary(project_uuid)`** - Returns comprehensive material and expense statistics

#### Triggers
- Auto-update `updated_at` on all tables
- Auto-update `task.actual_cost` on material assignment changes
- Auto-update `task.actual_cost` on expense approval

---

### Phase 2: Backend Services & Actions ✅

#### Home Depot Mock API Service
**File**: `lib/services/home-depot-api.ts`

**Functions**:
- `searchHomeDepotProducts(params)` - Search with filters (query, category, price, stock)
- `getHomeDepotProduct(productId)` - Get product details by ID
- `getHomeDepotProductBySku(sku)` - Get product by SKU
- `getHomeDepotCategories()` - List all categories
- `getCategoryDisplayName(category)` - Get human-readable category names

**Mock Data**: 12 sample products covering all categories:
- Lumber (2x4 studs, pressure-treated lumber)
- Concrete (QUIKRETE mix)
- Electrical (Romex wire, junction boxes)
- Plumbing (PVC pipe)
- Drywall (sheets, joint compound)
- Roofing (GAF shingles)
- Paint (BEHR interior paint)
- Hardware (screws)
- HVAC (flexible duct)
- Flooring (luxury vinyl planks)

**Ready to Replace**: The mock service has the exact same interface as a real API would have. Simply replace the mock data fetching with actual API calls when Home Depot API credentials are available.

#### Materials Server Actions
**File**: `app/actions/materials.ts`

**Actions**:
- `searchProducts(searchParams)` - Search Home Depot catalog
- `getProductDetails(productId)` - Get detailed product info
- `createMaterial(data)` - Add custom material to catalog
- `createMaterialFromHomeDepot(product)` - Import Home Depot product
- `getMaterialsByCompany()` - List company's material catalog
- `assignMaterialToTask(data)` - Assign material to task with quantity and purchaser
- `updateMaterialAssignment(data)` - Update procurement status and dates
- `deleteMaterialAssignment(assignmentId)` - Remove material assignment
- `getMaterialAssignmentsByTask(taskId)` - Get materials for a task
- `getMaterialAssignmentsByProject(projectId)` - Get all project materials
- `getProjectMaterialSummary(projectId)` - Dashboard analytics
- `getMaterialsByCategory(projectId)` - Cost breakdown by category

**Features**:
- RLS enforcement (company and project-based access)
- Automatic notifications on material assignment
- Status change notifications (ordered, delivered)
- Budget updates via database triggers

#### Expenses Server Actions
**File**: `app/actions/expenses.ts`

**Actions**:
- `createExpense(data)` - Submit expense with receipt
- `updateExpense(data)` - Edit expense details
- `reviewExpense(data)` - Approve/reject workflow
- `deleteExpense(expenseId)` - Remove expense
- `getExpensesByProject(projectId)` - Project expenses
- `getExpensesByCompany()` - All company expenses
- `getExpenseById(expenseId)` - Detailed expense view
- `addExpenseLineItem(data)` - Add individual line item
- `deleteExpenseLineItem(lineItemId)` - Remove line item
- `processReceiptOCR(expenseId, receiptImageUrl)` - AI extraction (placeholder)
- `matchLineItemToMaterial(lineItemId, materialId)` - Manual matching

**Features**:
- Submission and approval workflow
- Automatic notifications (submitted, approved, rejected)
- OCR placeholder ready for Vercel AI SDK integration
- Material matching (AI and manual)
- Budget updates on approval

---

## What Needs to Be Done

### Phase 3: Materials UI Components (Priority 1)

#### 1. Materials Search Page
**File**: `app/app/materials/page.tsx`

Should include:
- Search bar with real-time filtering
- Category filter dropdown
- Price range filter
- Stock status filter
- Product grid/list view toggle
- Pagination

#### 2. Product Search Component
**File**: `components/materials/ProductSearch.tsx`

Features:
- Search input with debouncing
- Filter panel (category, price, stock)
- Loading states
- Empty state handling
- Construction-themed styling (#001B51 navy, #3C3C3C dark gray)

#### 3. Product Card Component
**File**: `components/materials/ProductCard.tsx`

Display:
- Product image
- Name and description
- Price and unit of measure
- Stock status badge
- Category badge
- "Add to Catalog" button
- "Assign to Task" button
- "Compare" checkbox

#### 4. Product Comparison Modal
**File**: `components/materials/ProductComparisonModal.tsx`

Features:
- Side-by-side comparison of 2-4 products
- Highlight differences
- Specs comparison table
- Price comparison
- Stock availability
- Lead times
- Select best option

#### 5. Assign Material Modal
**File**: `components/materials/AssignMaterialModal.tsx`

Form fields:
- Task selection dropdown
- Quantity input
- Unit cost (pre-filled from product)
- Purchaser type (GC, PM, Subcontractor)
- Purchaser selection dropdown
- Estimated delivery date
- Notes textarea

#### 6. Task Detail Materials Section
**File**: Update `components/tasks/TaskDetail.tsx`

Add section:
- List of assigned materials
- Quantity and cost for each
- Procurement status badges
- Progress indicator
- Total materials cost
- "Assign Material" button

---

### Phase 4: Expense UI Components (Priority 2)

#### 1. Expenses List Page
**File**: `app/app/expenses/page.tsx`

Should include:
- Expenses table/cards
- Filter by status, date, project
- Sort options
- Summary cards (total, pending, approved)
- "Submit Expense" button

#### 2. Create Expense Form
**File**: `components/expenses/CreateExpenseForm.tsx`

Form fields:
- Description
- Amount
- Category dropdown
- Expense date picker
- Project selection
- Task selection (optional)
- Vendor name
- Receipt upload (with camera access)
- Submit button

#### 3. Receipt Upload Component
**File**: `components/expenses/ReceiptUpload.tsx`

Features:
- Camera capture (mobile)
- File upload (desktop)
- Image preview
- OCR processing trigger
- Upload to Supabase Storage
- Progress indicator

#### 4. OCR Review Component
**File**: `components/expenses/OCRReview.tsx`

Display:
- Original receipt image
- Extracted data fields (editable)
- Confidence scores
- Line items table
- Vendor info
- Total amount
- "Confirm" and "Edit" buttons

#### 5. Expense Review Modal
**File**: `components/expenses/ExpenseReviewModal.tsx`

For PM/GC:
- Expense details
- Receipt image
- Line items
- Matched materials
- Approve/Reject buttons
- Approval notes textarea

#### 6. Material Matching Panel
**File**: `components/expenses/MaterialMatchingPanel.tsx`

Features:
- List of expense line items
- Suggested material matches (AI)
- Manual search and select
- Match confidence scores
- Confirm/override options

---

### Phase 5: Materials Dashboard (Priority 3)

#### 1. Project Materials Dashboard Page
**File**: `app/app/materials/dashboard/[projectId]/page.tsx`

Layout:
- Summary cards at top
- Charts section (procurement, costs)
- Materials table with filters
- Export buttons

#### 2. Materials Summary Cards
**File**: `components/materials/MaterialsSummaryCards.tsx`

Cards:
- Total Materials Cost
- Materials Needed Count
- Materials Ordered Count
- Materials Delivered Count
- Budget Variance
- Pending Expenses

#### 3. Procurement Status Chart
**File**: `components/materials/ProcurementStatusChart.tsx`

Visualization:
- Doughnut/Pie chart showing status breakdown
- Legend with counts and percentages
- Color-coded (needed: gray, ordered: blue, delivered: green, installed: navy)

#### 4. Cost Breakdown Table
**File**: `components/materials/CostBreakdownTable.tsx`

Columns:
- Category
- Total Cost
- Percentage of Budget
- Materials Count
- Average Cost per Item

Group by:
- Category
- Subcontractor
- Task

#### 5. Budget Variance Warning
**File**: `components/materials/BudgetVarianceWarning.tsx`

Alert component:
- Shows when materials cost exceeds budget
- Highlights specific overruns
- Suggests actions
- Links to cost breakdown

#### 6. Export Buttons
**File**: `components/materials/ExportButtons.tsx`

Export options:
- CSV (raw data)
- PDF (formatted report)
- Include filters in export
- Loading states

---

## Implementation Guide

### Step 1: Apply Database Migrations

```bash
# Apply migrations to Supabase
cd supabase
supabase migration up
```

Or use the Supabase MCP tool:
```typescript
await mcp__supabase__apply_migration({
  name: "materials_and_expenses",
  query: [contents of 020_materials_and_expenses.sql]
});

await mcp__supabase__apply_migration({
  name: "materials_expenses_rls",
  query: [contents of 021_materials_expenses_rls.sql]
});
```

### Step 2: Generate TypeScript Types

```bash
# Generate types from Supabase schema
supabase gen types typescript --local > types/database.types.ts
```

Or use the Supabase MCP tool:
```typescript
await mcp__supabase__generate_typescript_types();
```

### Step 3: Build UI Components

Follow the component structure outlined above. Key considerations:

**Construction Theme**:
- Primary: #001B51 (Navy Blue)
- Accent: #3C3C3C (Dark Gray)
- Accent Light: #7A7A7A (Mid Gray)

**Icons** (from Lucide):
- Package - Materials
- ShoppingCart - Procurement
- Receipt - Expenses
- TrendingUp - Budget
- AlertTriangle - Warnings
- Truck - Delivery
- CheckCircle - Completed
- Clock - Pending

**Mobile-First**:
- Touch-friendly buttons (min 44x44px)
- Camera access for receipts
- Offline support for material catalog
- Swipe gestures for cards

### Step 4: Integrate AI OCR (Vercel AI SDK)

Replace the placeholder in `app/actions/expenses.ts`:

```typescript
import { generateText } from 'ai';
import { openai } from '@ai-sdk/openai';

export async function processReceiptOCR(expenseId: string, receiptImageUrl: string) {
  const session = await auth();
  // ... auth checks ...

  // Use Vercel AI SDK with vision
  const result = await generateText({
    model: openai('gpt-4-vision-preview'),
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'image',
            image: receiptImageUrl,
          },
          {
            type: 'text',
            text: 'Extract the following from this receipt: vendor name, vendor address, date, line items (description, quantity, unit price), and total amount. Return as JSON.'
          }
        ]
      }
    ]
  });

  const ocrResult = JSON.parse(result.text);

  // Update expense with OCR data
  // Create line items
  // Match to materials using AI

  return { success: true, data: ocrResult };
}
```

### Step 5: Testing

Use the testing checklist in the context file:
- Search products
- Assign materials
- Update procurement status
- Submit expenses
- Process OCR
- Review and approve
- Match line items
- View dashboard
- Export data
- Verify permissions

---

## File Structure

```
C:\Users\Jon\Documents\claude projects\next-saas-starter\

├── supabase/migrations/
│   ├── 020_materials_and_expenses.sql
│   └── 021_materials_expenses_rls.sql
│
├── lib/services/
│   └── home-depot-api.ts
│
├── app/actions/
│   ├── materials.ts
│   └── expenses.ts
│
├── app/app/
│   ├── materials/
│   │   ├── page.tsx                    # TO CREATE
│   │   └── dashboard/
│   │       └── [projectId]/
│   │           └── page.tsx            # TO CREATE
│   │
│   └── expenses/
│       ├── page.tsx                    # TO CREATE
│       └── [id]/
│           └── page.tsx                # TO CREATE
│
└── components/
    ├── materials/
    │   ├── ProductSearch.tsx           # TO CREATE
    │   ├── ProductCard.tsx             # TO CREATE
    │   ├── ProductComparisonModal.tsx  # TO CREATE
    │   ├── AssignMaterialModal.tsx     # TO CREATE
    │   ├── MaterialsSummaryCards.tsx   # TO CREATE
    │   ├── ProcurementStatusChart.tsx  # TO CREATE
    │   ├── CostBreakdownTable.tsx      # TO CREATE
    │   ├── BudgetVarianceWarning.tsx   # TO CREATE
    │   └── ExportButtons.tsx           # TO CREATE
    │
    └── expenses/
        ├── CreateExpenseForm.tsx       # TO CREATE
        ├── ReceiptUpload.tsx           # TO CREATE
        ├── OCRReview.tsx               # TO CREATE
        ├── ExpenseReviewModal.tsx      # TO CREATE
        └── MaterialMatchingPanel.tsx   # TO CREATE
```

---

## Key Features Implemented

### Requirement 19: Materials Management ✅ (Backend Complete)
- [x] Home Depot product search interface (backend)
- [x] Live pricing, stock levels, product specs (mock data)
- [x] Product comparison capability (backend support)
- [x] Assign materials to tasks (backend)
- [x] Quantity and purchaser assignment (backend)
- [x] Cost impact tracking (automatic via triggers)
- [x] Procurement status tracking (backend)
- [x] Real-time budget updates (automatic via triggers)
- [ ] UI components (pending)

### Requirement 20: Expense Automation ✅ (Backend Complete)
- [x] Receipt upload (backend support)
- [x] AI OCR extraction (placeholder ready for Vercel AI SDK)
- [x] Material matching (backend)
- [x] Auto-link to tasks (backend)
- [x] Budget updates (automatic)
- [x] Manual matching fallback (backend)
- [x] Receipt image display (backend support)
- [x] Confidence scores (backend structure)
- [ ] UI components (pending)

### Requirement 21: Materials Dashboard ✅ (Backend Complete)
- [x] Materials needed vs. purchased (backend function)
- [x] Total costs calculation (backend function)
- [x] Cost by category (backend function)
- [x] Cost by subcontractor (backend support)
- [x] Procurement status breakdown (backend function)
- [x] Estimated delivery dates (backend)
- [x] Cost overrun detection (backend function)
- [x] Installation status tracking (backend)
- [ ] CSV export (pending)
- [ ] PDF export (pending)
- [ ] UI components (pending)

---

## Next Steps

1. **Generate TypeScript types** from the new database schema
2. **Create materials search UI** (Priority 1)
3. **Create expense submission UI** (Priority 2)
4. **Build materials dashboard** (Priority 3)
5. **Integrate Vercel AI SDK** for OCR
6. **Implement CSV/PDF exports**
7. **Add offline support** for material catalog
8. **Test all workflows** end-to-end

---

## Notes for Developers

### Database Triggers
The database automatically updates `task.actual_cost` when:
- Material assignments are added, updated, or deleted
- Expenses are approved or rejected

This means you don't need to manually recalculate costs in the UI - just refresh the task data.

### RLS Policies
- Users can only see materials and expenses from their company
- Project team members can manage materials for their projects
- Only GC Admin and PMs can approve expenses
- Submitters can edit their own submitted (not yet approved) expenses

### Home Depot API
The mock service in `lib/services/home-depot-api.ts` has the exact interface the real API would have. When you get Home Depot API credentials:
1. Replace `searchHomeDepotProducts()` with real API call
2. Keep the same return type structure
3. No changes needed in server actions

### AI OCR
The `processReceiptOCR()` function in `app/actions/expenses.ts` is a placeholder. To implement:
1. Install Vercel AI SDK: `npm install ai @ai-sdk/openai`
2. Add OpenAI API key to `.env.local`
3. Replace placeholder with actual AI call (example provided in Step 4 above)
4. Test with various receipt types

### Performance Considerations
- Material catalog should be cached for offline use
- Paginate large product search results
- Use debouncing for search inputs
- Lazy load images in product cards
- Index database queries are already optimized

---

## Support & Questions

For questions about this implementation:
1. Review the context file: `.claude/tasks/context_session_10.md`
2. Check server actions for usage examples
3. Review database schema for data structure
4. Reference mock API for product data format

---

**End of Implementation Summary**
