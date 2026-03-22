# EST-P4-006: Multi-Project Template Library

**Parent Task:** `EST-P4-006` in `tasks-phase3-phase4.md`
**Priority:** P3 - Advanced
**Total Effort:** ~3 days
**Dependencies:** EST-P2-007 (Template Management must be complete)

---

## Sub-Task Overview

| ID | Name | Agent | Effort | Depends On |
|----|------|-------|--------|------------|
| P4-006-A | Database migrations | backend-engineer | 0.5d | — |
| P4-006-B | Inheritance resolver | backend-engineer | 0.5d | P4-006-A |
| P4-006-C | Marketplace server actions | backend-engineer | 0.5d | P4-006-A |
| P4-006-D | TemplateHierarchy + TemplateVersionControl | frontend-engineer | 0.5d | P4-006-B |
| P4-006-E | TemplateMarketplace component | frontend-engineer | 0.5d | P4-006-C |

---

## P4-006-A: Database Migrations

**Agent:** backend-engineer
**Effort:** 0.5 days

**Files:**
- `supabase/migrations/YYYYMMDD_create_template_library.sql`

**Task:**
```sql
-- Template hierarchy (parent-child inheritance)
ALTER TABLE public.pricing_templates
ADD COLUMN IF NOT EXISTS parent_template_id UUID REFERENCES pricing_templates(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS hierarchy_level TEXT DEFAULT 'project'
  CHECK (hierarchy_level IN ('corporate', 'regional', 'project'));

-- Version control for templates
CREATE TABLE public.template_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID NOT NULL REFERENCES pricing_templates(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES companies(id),
  version_number INTEGER NOT NULL,
  parent_version_id UUID REFERENCES template_versions(id),
  snapshot JSONB NOT NULL,          -- full template line_items snapshot
  change_summary TEXT,
  created_by UUID NOT NULL REFERENCES profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(template_id, version_number)
);

-- Marketplace (anonymized shared templates)
CREATE TABLE public.template_marketplace (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_template_id UUID,          -- NULL if submitted anonymously
  company_id UUID,                  -- NULL if fully anonymized
  title TEXT NOT NULL,
  description TEXT,
  project_type TEXT,
  trade_coverage TEXT[],
  line_items JSONB NOT NULL,        -- anonymized line items (no prices, only structure)
  tags TEXT[] DEFAULT '{}',
  download_count INTEGER DEFAULT 0,
  rating_avg NUMERIC(3,2) DEFAULT 0,
  rating_count INTEGER DEFAULT 0,
  is_approved BOOLEAN DEFAULT false, -- moderated before visible
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_template_versions_template ON template_versions(template_id, version_number DESC);
CREATE INDEX idx_marketplace_type ON template_marketplace(project_type, is_approved);
CREATE INDEX idx_marketplace_tags ON template_marketplace USING GIN(tags);
```

**Acceptance Criteria:**
- [ ] Migration runs without errors
- [ ] `pricing_templates` updated without breaking existing data
- [ ] Marketplace RLS: public SELECT for approved entries, company-scoped for own entries
- [ ] `npm run db:gen-types` updated

---

## P4-006-B: Inheritance Resolver

**Agent:** backend-engineer
**Effort:** 0.5 days
**Depends on:** P4-006-A

**Files:**
- `lib/templates/inheritance-resolver.ts` (new)

**Task:**
Merge parent template line items with child overrides (child takes precedence).

```typescript
export interface TemplateLineItem {
  id: string
  trade: string
  category: string
  description: string
  unit: string
  unit_cost: number
  source: 'inherited' | 'override' | 'new'
}

export interface ResolvedTemplate {
  templateId: string
  lineItems: TemplateLineItem[]
  hierarchy: Array<{ id: string; name: string; level: string }>
}

// Recursively resolve parent chain (corporate → regional → project)
export async function resolveTemplateInheritance(
  templateId: string
): Promise<ResolvedTemplate>

// Diff two template versions
export function diffTemplateVersions(
  versionA: TemplateLineItem[],
  versionB: TemplateLineItem[]
): {
  added: TemplateLineItem[]
  removed: TemplateLineItem[]
  modified: Array<{ item: TemplateLineItem; changes: Record<string, { from: unknown; to: unknown }> }>
  unchanged: TemplateLineItem[]
}
```

Merge logic:
1. Load parent chain (stop at root or 3 levels deep)
2. Start with corporate items
3. Apply regional overrides: same `(trade, category, description)` → override unit_cost
4. Apply project overrides: same key → override again
5. Mark each item's `source`

**Server actions to add in `app/actions/templates.ts`:**
```typescript
getResolvedTemplate(templateId: string): Promise<ResolvedTemplate>
createTemplateVersion(templateId: string, changeSummary: string): Promise<{ versionId: string }>
rollbackToVersion(templateId: string, versionId: string): Promise<void>
```

**Acceptance Criteria:**
- [ ] Child overrides correctly replace parent items with matching key
- [ ] Items unique to parent included with `source: 'inherited'`
- [ ] Max depth 3 to prevent infinite loops
- [ ] `diffTemplateVersions` correctly identifies added/removed/modified

---

## P4-006-C: Marketplace Server Actions

**Agent:** backend-engineer
**Effort:** 0.5 days
**Depends on:** P4-006-A

**Files:**
- `app/actions/template-marketplace.ts` (new)

**Signatures:**
```typescript
// Browse marketplace
searchMarketplace(params: {
  query?: string
  projectType?: string
  tags?: string[]
  page?: number
  limit?: number
}): Promise<{ data: MarketplaceTemplate[]; total: number; error: string | null }>

// Submit a template to marketplace (anonymized)
submitToMarketplace(templateId: string, params: {
  title: string
  description: string
  tags: string[]
  anonymize: boolean  // strip company name + project details
}): Promise<{ error: string | null }>

// Download marketplace template to company library
downloadMarketplaceTemplate(marketplaceId: string): Promise<{
  data: { newTemplateId: string } | null
  error: string | null
}>

// Bulk apply template to multiple estimates
bulkApplyTemplate(templateId: string, estimateIds: string[]): Promise<{
  applied: string[]
  errors: string[]
}>

// Validate template completeness before saving
validateTemplate(templateId: string): Promise<{
  isValid: boolean
  issues: Array<{ type: 'missing_trade' | 'negative_cost' | 'empty'; message: string }>
}>
```

**Acceptance Criteria:**
- [ ] `searchMarketplace` only returns `is_approved = true` entries
- [ ] `submitToMarketplace` with `anonymize: true` strips company_id + names
- [ ] `bulkApplyTemplate` creates separate line items per estimate (not shared)
- [ ] `validateTemplate` catches negative costs and missing required trades

---

## P4-006-D: TemplateHierarchy + TemplateVersionControl Components

**Agent:** frontend-engineer
**Effort:** 0.5 days
**Depends on:** P4-006-B

**Files:**
- `components/estimates/TemplateHierarchy.tsx` (new)
- `components/estimates/TemplateVersionControl.tsx` (new)
- `components/estimates/TemplateLibrary.tsx` (modified — add hierarchy view)

**Task:**

**`TemplateHierarchy`:**
- Tree view: Corporate Template → Regional Template → Project Template
- Each node: template name + item count + "Edit" button
- "Create Child Template" button on each node
- Expand/collapse nodes
- Badge showing inheritance level (Corporate/Regional/Project)

```typescript
interface TemplateHierarchyProps {
  rootTemplateId?: string
  onSelectTemplate: (templateId: string) => void
}
```

**`TemplateVersionControl`:**
- Version history list: v1, v2, v3... with timestamp + author + change summary
- "View Diff" button → opens `ResponsiveModal` showing `diffTemplateVersions` result
- "Rollback to this version" button (with confirmation)
- Diff display: green rows for added, red rows for removed, yellow rows for modified

**`TemplateLibrary.tsx` modifications:**
- Add "Hierarchy" tab alongside existing list view
- Render `<TemplateHierarchy>` in hierarchy tab
- Add version history panel (collapsible) in template detail view

**Mobile Checks:**
- [ ] Hierarchy tree items are `min-h-[44px]`
- [ ] "Rollback" confirmation uses `ResponsiveModal`
- [ ] Diff view scrollable on mobile
- [ ] `dark:` variants on diff row backgrounds

**Acceptance Criteria:**
- [ ] Hierarchy tree renders corporate → regional → project chain
- [ ] Diff modal shows added/removed/modified with correct colors
- [ ] "Rollback" calls `rollbackToVersion` action after confirmation
- [ ] Build passes with no TS errors

---

## P4-006-E: TemplateMarketplace Component

**Agent:** frontend-engineer
**Effort:** 0.5 days
**Depends on:** P4-006-C

**Files:**
- `components/estimates/TemplateMarketplace.tsx` (new)

**Task:**
Browseable marketplace of community templates. Loaded via `next/dynamic`.

```typescript
interface TemplateMarketplaceProps {
  isOpen: boolean
  onClose: () => void
  onDownload: (newTemplateId: string) => void
}
```

Layout (`ResponsiveModal`, full-screen on mobile):
- Search bar + project type filter + tag pills
- Results grid: cards with title, description, trade coverage tags, download count, rating
- Pagination or "Load More" (infinite scroll preferred)
- Virtual scroll for large result sets (`content-visibility: auto`)
- "Submit Template" button: opens submission flow (title + description + tag input + anonymize toggle)
- "Download" button per card: calls `downloadMarketplaceTemplate`, fires `onDownload`

**Skills Applied:**
- `bundle-dynamic-imports` — lazy load marketplace modal
- `rendering-content-visibility` — virtual scroll for results
- `rerender-memo` — memo marketplace cards

**Mobile Checks:**
- [ ] Cards full-width on mobile
- [ ] "Download" buttons `min-h-[44px]`
- [ ] Search input `min-h-[44px]`
- [ ] `active:scale-95` on cards
- [ ] `dark:` variants on card bg + borders

**Acceptance Criteria:**
- [ ] Search queries `searchMarketplace` with debounce (300ms)
- [ ] "Download" creates template in company library and fires `onDownload`
- [ ] Submission form validates required fields before calling `submitToMarketplace`
- [ ] Marketplace loaded lazily (not in initial bundle)
- [ ] Build passes with no TS errors
