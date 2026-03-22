# EST-P4-004: Supplier Integration & Automated Pricing

**Parent Task:** `EST-P4-004` in `tasks-phase3-phase4.md`
**Priority:** P3 - Advanced
**Total Effort:** ~5.5 days
**Dependencies:** EST-P2-008 (Material Catalog must be complete)

---

## Sub-Task Overview

| ID | Name | Agent | Effort | Depends On |
|----|------|-------|--------|------------|
| P4-004-A | Database migrations | backend-engineer | 0.5d | — |
| P4-004-B | Supplier API clients | backend-engineer | 1.0d | P4-004-A |
| P4-004-C | Quote aggregation API route | backend-engineer | 1.0d | P4-004-B |
| P4-004-D | Purchase order server actions | backend-engineer | 1.0d | P4-004-A |
| P4-004-E | SupplierPricingModal + CostEditor | frontend-engineer | 1.0d | P4-004-C |
| P4-004-F | QuoteComparisonTable component | frontend-engineer | 0.5d | P4-004-E |
| P4-004-G | PurchaseOrderPreview component | frontend-engineer | 0.5d | P4-004-D |

---

## P4-004-A: Database Migrations

**Agent:** backend-engineer
**Effort:** 0.5 days

**Files:**
- `supabase/migrations/YYYYMMDD_create_supplier_tables.sql`

**Task:**
```sql
CREATE TABLE public.supplier_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id),
  supplier_name TEXT NOT NULL,
  api_credentials JSONB NOT NULL,  -- store encrypted via Supabase Vault or pgcrypto
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.supplier_quotes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  estimate_id UUID NOT NULL REFERENCES estimates(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES companies(id),
  supplier_id UUID NOT NULL REFERENCES supplier_connections(id),
  line_items JSONB NOT NULL,
  total_amount NUMERIC(12,2),
  valid_until TIMESTAMPTZ,
  status TEXT CHECK (status IN ('pending', 'received', 'accepted', 'rejected', 'expired')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.purchase_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  estimate_id UUID NOT NULL REFERENCES estimates(id),
  company_id UUID NOT NULL REFERENCES companies(id),
  supplier_quote_id UUID REFERENCES supplier_quotes(id),
  po_number TEXT UNIQUE NOT NULL,
  line_items JSONB NOT NULL,
  total_amount NUMERIC(12,2),
  delivery_address TEXT,
  status TEXT CHECK (status IN ('draft', 'sent', 'confirmed', 'shipped', 'delivered', 'cancelled')),
  tracking_number TEXT,
  created_by UUID NOT NULL REFERENCES profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_supplier_quotes_estimate ON supplier_quotes(estimate_id);
CREATE INDEX idx_purchase_orders_estimate ON purchase_orders(estimate_id);
CREATE INDEX idx_purchase_orders_status ON purchase_orders(company_id, status);
```

**Security note:** `api_credentials` must be encrypted at rest. Use `pgcrypto` symmetric encryption or Supabase Vault. Document approach in migration comments.

**Acceptance Criteria:**
- [ ] Migration runs without errors
- [ ] RLS enforces company_id isolation on all three tables
- [ ] `api_credentials` storage approach documented
- [ ] `npm run db:gen-types` updated

---

## P4-004-B: Supplier API Clients

**Agent:** backend-engineer
**Effort:** 1.0 days
**Depends on:** P4-004-A

**Files:**
- `lib/suppliers/home-depot-api.ts` (new)
- `lib/suppliers/ferguson-api.ts` (new)
- `lib/suppliers/supplier-base.ts` (new — shared interface)

**Task:**

**`supplier-base.ts`:**
```typescript
export interface SupplierProduct {
  sku: string
  name: string
  price: number
  unit: string
  qtyAvailable: number
  leadTimeDays: number
  imageUrl?: string
}

export interface SupplierClient {
  name: string
  searchProducts(query: string, quantity?: number): Promise<SupplierProduct[]>
  getProductBySku(sku: string): Promise<SupplierProduct | null>
  requestQuote(items: Array<{ sku: string; qty: number }>): Promise<{ quoteId: string; total: number; validUntil: string }>
}
```

**`home-depot-api.ts`:**
- OAuth2 authentication (client_credentials flow)
- `GET /products/search?q={query}&storeId={storeId}`
- Map response to `SupplierProduct`
- Rate limit: 10 req/sec, use exponential backoff on 429

**`ferguson-api.ts`:**
- API key authentication (Bearer token)
- `POST /quotes` with material list
- Parse quote PDF URL from response + structured `line_items`

Both clients: server-side only (never imported in `'use client'` components). Credentials loaded from environment variables or `supplier_connections` table.

**Acceptance Criteria:**
- [ ] Home Depot client returns products for common queries ("2x4 lumber", "drywall")
- [ ] Ferguson client submits quote and returns total
- [ ] Retry on 429 with exponential backoff (max 3 retries)
- [ ] Credentials never logged or exposed to client

---

## P4-004-C: Quote Aggregation API Route

**Agent:** backend-engineer
**Effort:** 1.0 days
**Depends on:** P4-004-B

**Files:**
- `app/api/suppliers/quotes/route.ts` (new)

**Task:**
POST endpoint that queries all active suppliers in parallel and returns normalized quotes.

```typescript
// POST /api/suppliers/quotes
// Body: { estimateId: string, lineItemIds: string[] }
// Returns: { quotes: NormalizedQuote[] }

interface NormalizedQuote {
  supplierId: string
  supplierName: string
  lineItems: Array<{
    ourDescription: string
    sku: string
    matchedName: string
    unitPrice: number
    quantity: number
    total: number
    availability: 'in-stock' | 'limited' | 'out-of-stock'
    leadTimeDays: number
  }>
  totalAmount: number
  validUntil: string
  status: 'received' | 'partial' | 'error'
}
```

Flow:
1. Load active `supplier_connections` for company
2. Fetch line items for given `lineItemIds`
3. `Promise.all` calls to all supplier clients
4. Normalize responses to `NormalizedQuote[]`
5. Save quotes to `supplier_quotes` table
6. Return normalized results

**Skills Applied:**
- `async-parallel` — `Promise.all` for all supplier API calls

**Acceptance Criteria:**
- [ ] All suppliers queried in parallel (not sequentially)
- [ ] Partial results returned if some suppliers fail (no all-or-nothing)
- [ ] Quotes saved to DB before returning
- [ ] Response time < 5s for 3 suppliers

---

## P4-004-D: Purchase Order Server Actions

**Agent:** backend-engineer
**Effort:** 1.0 days
**Depends on:** P4-004-A

**Files:**
- `app/actions/purchase-orders.ts` (new)

**Signatures:**
```typescript
createPurchaseOrder(data: {
  estimateId: string
  supplierQuoteId?: string
  lineItems: POLineItem[]
  deliveryAddress: string
}): Promise<{ data: PurchaseOrder | null; error: string | null }>

submitPurchaseOrder(poId: string): Promise<{ error: string | null }>
// Calls supplier API to submit PO, updates status to 'sent'

updatePOStatus(poId: string, status: POStatus, trackingNumber?: string): Promise<{ error: string | null }>
// Called by webhook handler or manual update

getPurchaseOrders(estimateId: string): Promise<{ data: PurchaseOrder[]; error: string | null }>

syncSupplierCatalog(supplierId: string): Promise<{ synced: number; errors: string[] }>
// Background import of supplier SKUs to materials catalog
```

PO number generation: `GH-{year}-{sequential 5-digit}` (e.g., `GH-2026-00042`).

**Acceptance Criteria:**
- [ ] `createPurchaseOrder` generates unique PO number
- [ ] `submitPurchaseOrder` calls supplier API and updates status atomically
- [ ] Company_id validated for all operations
- [ ] `syncSupplierCatalog` handles duplicates via upsert

---

## P4-004-E: SupplierPricingModal + CostEditor Wire-up

**Agent:** frontend-engineer
**Effort:** 1.0 days
**Depends on:** P4-004-C

**Files:**
- `components/estimates/SupplierPricingModal.tsx` (new)
- `components/estimates/CostEditor.tsx` (modified — add "Get Quotes" button)

**Task:**

**`SupplierPricingModal`:**
```typescript
interface SupplierPricingModalProps {
  isOpen: boolean
  onClose: () => void
  estimateId: string
  selectedLineItemIds: string[]
  onAcceptQuote: (quote: NormalizedQuote) => void
}
```

Layout:
- `ResponsiveModal` (never raw Dialog)
- Loading state: "Fetching prices from suppliers..." with animated supplier logos
- Content: `<QuoteComparisonTable>` after quotes loaded
- Footer: "Accept Quote" (calls supplier API) + "Cancel"

**`CostEditor.tsx`:**
- Add "Get Quotes" button per trade section header (or per line item row)
- Opens `SupplierPricingModal` with selected item IDs
- On quote accepted: auto-populate unit costs from accepted quote

**Mobile Checks:**
- [ ] Modal full-screen on mobile
- [ ] "Accept Quote" button is `min-h-[44px]`
- [ ] Loading state visible and accessible (role="status")
- [ ] `dark:` variants

**Acceptance Criteria:**
- [ ] Modal opens and fetches quotes via `/api/suppliers/quotes`
- [ ] Accepted quote populates `CostEditor` unit costs
- [ ] Uses `ResponsiveModal` (not raw Dialog)

---

## P4-004-F: QuoteComparisonTable Component

**Agent:** frontend-engineer
**Effort:** 0.5 days
**Depends on:** P4-004-E

**Files:**
- `components/estimates/QuoteComparisonTable.tsx` (new)

**Task:**
Side-by-side table comparing quotes from multiple suppliers.

```typescript
interface QuoteComparisonTableProps {
  quotes: NormalizedQuote[]
  onSelectQuote: (quote: NormalizedQuote) => void
  selectedQuoteId?: string
}
```

Layout:
- Header row: our item description
- Columns: one per supplier
- Cells: unit price + total + availability badge + lead time
- "Best Price" highlight: green border on lowest-price column
- Row hover: highlight full row
- Mobile: horizontal scroll table

**Mobile Checks:**
- [ ] Horizontal scroll with `-webkit-overflow-scrolling: touch`
- [ ] Column headers sticky on horizontal scroll
- [ ] Select button per column is `min-h-[44px]`
- [ ] `dark:` variants on table bg + borders

**Acceptance Criteria:**
- [ ] Lowest price column highlighted correctly
- [ ] `onSelectQuote` fires with correct quote on selection
- [ ] Renders correctly with 1, 2, and 3 suppliers

---

## P4-004-G: PurchaseOrderPreview Component

**Agent:** frontend-engineer
**Effort:** 0.5 days
**Depends on:** P4-004-D

**Files:**
- `components/estimates/PurchaseOrderPreview.tsx` (new)

**Task:**
Preview and submission UI for purchase orders.

```typescript
interface PurchaseOrderPreviewProps {
  estimateId: string
  isOpen: boolean
  onClose: () => void
}
```

Layout:
- `ResponsiveModal`
- Header: PO number + supplier name + date
- Line items table: description, qty, unit, unit price, total
- Delivery address input (editable before submission)
- Total amount row
- Status timeline: Draft → Sent → Confirmed → Shipped → Delivered
- Buttons: "Submit PO" (calls `submitPurchaseOrder`) + "Download PDF" + "Cancel"

**Mobile Checks:**
- [ ] Full-screen modal on mobile
- [ ] "Submit PO" button is `min-h-[44px]`
- [ ] Status timeline is horizontal scroll on mobile
- [ ] `dark:` variants

**Acceptance Criteria:**
- [ ] "Submit PO" transitions status from 'draft' to 'sent'
- [ ] Status timeline reflects current PO status
- [ ] Delivery address required before submission
- [ ] Uses `ResponsiveModal`
- [ ] Build passes with no TS errors
