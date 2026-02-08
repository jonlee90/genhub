# AI Plan Estimator - Part 1: Database, API Routes, and AI Parsing Pipeline

**Implementation Tasks for Backend Infrastructure**

---

## Overview

Part 1 establishes the foundational backend infrastructure for AI-assisted plan estimating:
- Database schema (9 tables, 6 enums, RLS policies)
- Storage buckets for plan files and page images
- API routes for file upload and AI parsing
- OpenAI GPT-4o integration with caching
- AI budget enforcement
- Server Actions for data access

**Estimated Duration:** 2 weeks
**Dependencies:** None (clean slate implementation)
**Agent Sequence:** backend-engineer → code-reviewer

---

## Task 1.1: Create Database Migration - Enums and Core Tables

**Agent:** backend-engineer
**Skills:** `postgres-best-practices:postgres-best-practices`

**Description:**
Create the foundational database migration with 6 new enum types and the first 5 core tables (plan_uploads, plan_pages, plan_parse_results, takeoff_items, estimates).

**Files:**
- `supabase/migrations/{timestamp}_create_estimating_core.sql`

**Acceptance Criteria:**
- [ ] 6 enum types created:
  - `plan_upload_status`: uploading, processing, ready, failed
  - `plan_page_parse_status`: pending, parsing, parsed, parse_failed
  - `estimate_status`: draft, reviewed, approved, superseded
  - `takeoff_category`: structural, architectural, mechanical, electrical, plumbing, painting, site, general
  - `extraction_method`: labeled, calculated, inferred, manual
  - `review_status`: pending, accepted, rejected, edited
- [ ] `plan_uploads` table with company_id, project_id, phase_id (nullable), file metadata, status
- [ ] `plan_pages` table with page_number, image metadata, parse_status, image_hash_sha256
- [ ] `plan_parse_results` table with raw_response JSONB, token counts, cost tracking
- [ ] `takeoff_items` table with normalized quantities, waste factors, confidence, review fields
- [ ] `estimates` table with overhead_pct, markup_pct, totals, versioning (superseded_by FK)
- [ ] All tables have `company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE`
- [ ] Indexes created per design document (company_id, status fields, foreign keys)
- [ ] `updated_at` triggers for plan_uploads, takeoff_items, estimates
- [ ] All COMMENT ON TABLE statements added
- [ ] Test migration with `mcp__supabase__execute_sql` (dry-run validation)
- [ ] Apply migration with `mcp__supabase__apply_migration`
- [ ] Run `npm run db:gen-types` to verify types generate correctly

**Dependencies:** None

---

## Task 1.2: Create Database Migration - Supporting Tables and RLS

**Agent:** backend-engineer
**Skills:** `postgres-best-practices:postgres-best-practices`

**Description:**
Complete the database schema with the remaining 4 tables (estimate_line_items, pricing_templates, pricing_template_items, ai_usage_log) and implement RLS policies for all 9 tables.

**Files:**
- `supabase/migrations/{timestamp}_create_estimating_support.sql`

**Acceptance Criteria:**
- [ ] `estimate_line_items` table with material/labor/equipment costs, trade, unit_cost, subtotal
- [ ] `pricing_templates` table with name, is_default flag
- [ ] `pricing_template_items` table with trade, category, sub_type, cost breakdown
- [ ] `ai_usage_log` table with model, tokens, cost, cached flag
- [ ] Add `ai_monthly_budget numeric(10,2) NOT NULL DEFAULT 50.00` to existing `companies` table
- [ ] RLS policies for all 9 tables:
  - SELECT: `company_id = public.get_user_company_id(next_auth.uid())`
  - INSERT: same company_id check
  - UPDATE: same company_id check
  - DELETE: company_id check + role check where specified (plan_uploads delete requires admin)
- [ ] All tables have `ENABLE ROW LEVEL SECURITY`
- [ ] Composite index on `ai_usage_log(company_id, created_at)` for monthly queries
- [ ] Test migration with `mcp__supabase__execute_sql` (dry-run validation)
- [ ] Apply migration with `mcp__supabase__apply_migration`
- [ ] Run `npm run db:gen-types` to verify types generate correctly

**Dependencies:** Task 1.1

---

## Task 1.3: Create Supabase Storage Buckets

**Agent:** backend-engineer
**Skills:** `postgres-best-practices:postgres-best-practices`

**Description:**
Create two private Supabase Storage buckets for plan files and page images with appropriate RLS policies.

**Strategy:** Use SQL migration with `INSERT INTO storage.buckets` (GenHub has no existing pattern, so establishing one). Alternative: manual creation via Supabase dashboard if SQL approach fails.

**Files:**
- `supabase/migrations/{timestamp}_create_estimating_buckets.sql`

**Acceptance Criteria:**
- [ ] Bucket `plan-files` created (private, no public access)
- [ ] Bucket `plan-pages` created (private, no public access)
- [ ] Storage RLS policy for `plan-files`:
  - SELECT: company_id matches user's company (extracted from path `{companyId}/...`)
  - INSERT: company_id matches user's company (validate path prefix)
  - DELETE: admin role only
- [ ] Storage RLS policy for `plan-pages`:
  - SELECT: company_id matches user's company (extracted from path)
  - INSERT: company_id matches user's company (validate path prefix)
  - DELETE: admin role only
- [ ] Path structure enforced: `{companyId}/projects/{projectId}/plans/{filename}` for plan-files
- [ ] Path structure enforced: `{companyId}/projects/{projectId}/pages/{planId}/page_{pageNumber}.png` for plan-pages
- [ ] Storage RLS validates companyId in path matches authenticated user's company (prevent path traversal)
- [ ] Test migration with `mcp__supabase__execute_sql` (dry-run validation)
- [ ] Apply migration with `mcp__supabase__apply_migration`
- [ ] Verify buckets visible in Supabase dashboard after migration

**Dependencies:** Task 1.2

---

## Task 1.4: Install PDF Processing and AI Dependencies

**Agent:** backend-engineer
**Skills:** `postgres-best-practices:postgres-best-practices`

**Description:**
Install pdfjs-dist for PDF rendering, openai for GPT-4o API, and verify sharp is available.

**Files:**
- `package.json`

**Acceptance Criteria:**
- [ ] `openai` added to dependencies (^4.0.0 or latest stable)
- [ ] `pdfjs-dist` added to dependencies (^4.0.0 or latest stable)
- [ ] Verify `sharp` already exists in dependencies (no installation needed)
- [ ] `npm install` completes without errors
- [ ] TypeScript types for pdfjs-dist available (@types/pdfjs-dist if needed)
- [ ] TypeScript types for openai bundled (no @types needed)
- [ ] No peer dependency warnings
- [ ] Build passes with no TypeScript errors

**Dependencies:** None

---

## Task 1.5: API Route - Plan Upload with PDF-to-Image Pipeline

**Agent:** backend-engineer
**Skills:** `postgres-best-practices:postgres-best-practices`

**Description:**
Create the plan upload API route that handles multipart/form-data, validates files, stores originals in Supabase Storage, converts PDF pages to PNG images, and creates database records.

**Files:**
- `app/api/estimates/upload/route.ts`

**Acceptance Criteria:**
- [ ] POST endpoint accepts multipart/form-data with `file`, `projectId`, `phaseId?`
- [ ] **Auth pattern (performance-optimized):**
  ```typescript
  const [session, formData] = await Promise.all([auth(), request.formData()])
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  ```
- [ ] Creates admin Supabase client via `createAdminClient()` from `@/utils/supabase/server`
- [ ] **Company validation:** Verify user belongs to company before any storage writes
- [ ] **Project validation:** Verify `projectId` belongs to user's company (prevent cross-company access)
- [ ] File size validation: file size < 50MB (return 413 if exceeded)
- [ ] MIME type validation: `application/pdf`, `image/jpeg`, `image/png` (server-side check, not just extension)
- [ ] **Filename sanitization with timestamp:**
  ```typescript
  const timestamp = Date.now()
  const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_")
  const filename = `${timestamp}_${sanitizedName}`
  ```
- [ ] Stores original file to `plan-files` bucket at path `{companyId}/projects/{projectId}/plans/{timestamp}_{filename}`
- [ ] Inserts `plan_uploads` record with status `uploading`, then updates to `processing` for PDFs
- [ ] **PDF Processing Pipeline:**
  - Uses `pdfjs-dist.getDocument()` to load PDF
  - Iterates each page sequentially (not parallel to limit memory)
  - Renders page to canvas at scale factor 4.17 (~300 DPI from 72 DPI)
  - Converts canvas to PNG buffer via `sharp`
  - Uploads PNG to `plan-pages` bucket at path `{companyId}/projects/{projectId}/pages/{planUploadId}/page_{pageNumber}.png`
  - Inserts `plan_pages` record with status `pending`
  - **Memory cleanup per page:** Call `page.cleanup()` after render
  - **Memory cleanup after all pages:** Call `doc.destroy()` after processing
- [ ] Updates `plan_uploads.status` to `ready` and sets `total_pages`
- [ ] Error handling: sets status to `failed` on PDF conversion errors, logs error message
- [ ] Returns `{ success: true, data: { planUpload: { id, status, totalPages } } }`
- [ ] For JPG/PNG uploads, stores directly without conversion, creates single plan_page
- [ ] No memory leaks verified (monitor buffer/canvas lifecycle)
- [ ] Build passes with no TypeScript errors

**Dependencies:** Task 1.3, Task 1.4

---

## Task 1.6: API Route - AI Parsing with GPT-4o Integration

**Agent:** backend-engineer
**Skills:** `postgres-best-practices:postgres-best-practices`

**Description:**
Create the AI parsing API route that retrieves page images, checks cache via SHA-256 hash, calls OpenAI GPT-4o vision API with structured extraction prompt, stores raw results, and normalizes into takeoff items.

**Files:**
- `app/api/estimates/parse/route.ts`
- `lib/ai/parse-prompt.ts` (extraction prompt + schema)
- `lib/ai/normalize-takeoff.ts` (normalization logic)

**Acceptance Criteria:**
- [ ] POST endpoint accepts `{ planUploadId, pageIds?: string[] }`
- [ ] **Auth pattern:** Parallel fetch of `[session, body] = await Promise.all([auth(), request.json()])`
- [ ] Creates admin client via `createAdminClient()`
- [ ] **Company validation:** Verify `planUploadId` belongs to user's company before proceeding
- [ ] **Environment validation:** Check `OPENAI_API_KEY` exists at startup, return 500 if missing
- [ ] **Budget check BEFORE any OpenAI call:**
  - Query current month spend from `ai_usage_log` using `date_trunc('month', now())`
  - If `current_spend >= company.ai_monthly_budget`, return 402 Payment Required
  - If `current_spend >= 0.8 * budget`, include warning in response
- [ ] **For each page:**
  - Download page image from `plan-pages` bucket
  - Compute SHA-256 hash using `crypto.subtle.digest('SHA-256', imageBuffer)` with hex encoding
  - Update `plan_pages.image_hash_sha256`
  - Check `plan_parse_results` for cached result by `image_hash_sha256`
  - If cache hit: clone result, set `cached=true`, skip OpenAI call
  - If cache miss: proceed with OpenAI
- [ ] **OpenAI API call:**
  - Initialize OpenAI client: `new OpenAI({ apiKey: process.env.OPENAI_API_KEY, timeout: 30000 })`
  - Resize image to max 2048px width via `sharp` (JPEG quality 85 for API only)
  - Base64 encode resized image
  - Send to GPT-4o vision (`gpt-4o` or `gpt-4o-2024-08-06`) with structured extraction prompt
  - Prompt includes: system rules (never fabricate, explicit labels only), category definitions, confidence guidelines
  - Response format: JSON with `page_type`, `items[]`, `raw_notes`, `warnings`
  - **Error handling:** Catch rate limit errors (429), timeout errors, API errors
  - **Retry logic:** 1 automatic retry on transient failures (429, 500, timeout), then mark `parse_failed`
- [ ] Zod validation of API response against schema (strict validation, reject invalid)
- [ ] Store raw response in `plan_parse_results` with `prompt_tokens`, `completion_tokens`, `total_tokens`, `cost` (calculate from pricing)
- [ ] **Normalization to `takeoff_items`:**
  - Use AI `category` + `sub_type` directly
  - Map `trade` from label context (e.g., "2x4 studs" → "framing")
  - Apply waste factors by trade: Drywall +10%, Flooring +15%, Lumber +5%, Concrete +2%
  - Set `needs_review=true` if `confidence < 0.7`
  - Store `ai_item_id`, `source_region` (bounding box), `extraction_method` (labeled/calculated/inferred)
  - Set `reviewed_by` NULL, `review_status` 'pending'
- [ ] Log to `ai_usage_log` with model, tokens, cost (use OpenAI pricing), cached flag
- [ ] Update `plan_pages.parse_status` to `parsed` or `parse_failed`
- [ ] **Sanitize AI outputs:** Escape any user-provided text before inserting to DB (prevent injection)
- [ ] Returns `{ success: true, data: { totalPages, parsed, failed, warnings?: string[] } }`
- [ ] Environment variable `OPENAI_API_KEY` required (validated at startup)
- [ ] Build passes with no TypeScript errors

**Dependencies:** Task 1.5

---

## Task 1.7: API Route - Parse Status Polling Endpoint

**Agent:** backend-engineer
**Skills:** `postgres-best-practices:postgres-best-practices`

**Description:**
Create a GET endpoint for polling parse status per plan upload.

**Files:**
- `app/api/estimates/parse-status/route.ts`

**Acceptance Criteria:**
- [ ] GET endpoint accepts query param `planUploadId`
- [ ] Auth via `auth()` + admin client
- [ ] **Company validation:** Verify `planUploadId` belongs to user's company
- [ ] Queries all `plan_pages` for the plan with `id`, `page_number`, `parse_status`
- [ ] Returns `{ success: true, data: { pages: [...], allComplete: boolean } }`
- [ ] `allComplete` is true when all pages are `parsed` or `parse_failed` (no `pending` or `parsing`)
- [ ] Response time < 100ms (simple SELECT query with index on `plan_upload_id`)
- [ ] Build passes with no TypeScript errors

**Dependencies:** Task 1.6

---

## Task 1.8: Server Actions - Estimates CRUD

**Agent:** backend-engineer
**Skills:** `postgres-best-practices:postgres-best-practices`

**Description:**
Create Server Actions for estimates and estimate line items CRUD operations.

**Files:**
- `app/actions/estimates.ts`

**Acceptance Criteria:**
- [ ] `"use server"` directive at top
- [ ] All functions use `getUserContext()` from `@/lib/auth-context`
- [ ] Zod schemas for all input validation
- [ ] **Functions implemented:**
  - `getEstimates(projectId)` - list estimates for project (filter by company_id via RLS)
  - `getEstimate(estimateId)` - get single estimate with line items (join query, company validation)
  - `createEstimate(input)` - create estimate + bulk insert line items in transaction (see note below)
  - `updateEstimate(input)` - update name, overhead_pct, markup_pct, recalculate totals
  - `approveEstimate(estimateId)` - set status to `approved` (role check: admin/PM only via getUserContext role)
  - `createMaterialsFromEstimate(estimateId)` - bulk insert to `materials` table (copy line items)
  - `createExpenseFromEstimate(estimateId)` - create expense + line items (copy estimate to expense)
- [ ] All return `{ success: true, data }` or `{ success: false, error: "message" }`
- [ ] **Transaction handling:** Use Postgres function with BEGIN/COMMIT for multi-table ops (create estimate + line items), OR accept eventual consistency if complexity too high
- [ ] Total calculations: `subtotal = SUM(line_items.subtotal)`, `overhead_amount = subtotal * overhead_pct`, `markup_amount = (subtotal + overhead) * markup_pct`, `grand_total = subtotal + overhead + markup`
- [ ] **Company validation:** All reads/writes verify company_id matches user's company (rely on RLS + explicit checks)
- [ ] Build passes with no TypeScript errors

**Dependencies:** Task 1.2

---

## Task 1.9: Server Actions - Plan Uploads and Pages

**Agent:** backend-engineer
**Skills:** `postgres-best-practices:postgres-best-practices`

**Description:**
Create Server Actions for querying plan uploads, pages, and parse results.

**Files:**
- `app/actions/estimates.ts` (add to existing file from Task 1.8)

**Acceptance Criteria:**
- [ ] **Functions implemented:**
  - `getPlanUploads(projectId)` - list all plan uploads for project with status (filter by company_id)
  - `getPlanPages(planUploadId)` - get pages with parse_status, image URLs (signed URLs, 1hr expiry)
  - `getParseResults(pageId)` - get raw AI output for a page (company validation)
- [ ] **Company validation:** Verify `projectId`/`planUploadId`/`pageId` belongs to user's company before generating signed URLs
- [ ] Signed URLs generated for private storage via `supabase.storage.from('plan-pages').createSignedUrl(path, 3600)` (1hr = 3600s)
- [ ] **Signed URL expiry:** 1hr (sufficient for viewing, but consider 15min if higher security needed)
- [ ] All return standard `{ success, data/error }` format
- [ ] Build passes with no TypeScript errors

**Dependencies:** Task 1.8

---

## Task 1.10: Server Actions - Takeoff Items CRUD

**Agent:** backend-engineer
**Skills:** `postgres-best-practices:postgres-best-practices`

**Description:**
Create Server Actions for takeoff items review, editing, and manual entry.

**Files:**
- `app/actions/estimates.ts` (add to existing file)

**Acceptance Criteria:**
- [ ] **Functions implemented:**
  - `getTakeoffItems(planUploadId, filters?)` - list items with optional filtering by trade, review_status, needs_review
  - `updateTakeoffItem(input)` - update quantity, unit, waste_factor, etc. (append to edit_history)
  - `reviewTakeoffItem(input)` - set review_status (accepted/rejected/edited), append to edit_history JSONB
  - `addManualTakeoffItem(input)` - create manual item with extraction_method='manual', confidence=1.0
  - `deleteTakeoffItem(itemId)` - hard delete (verify company ownership)
- [ ] Zod schemas for all inputs
- [ ] **Edit history tracking:** Append to `edit_history` JSONB: `{ timestamp: ISO string, user_id: UUID, field: string, old_value: any, new_value: any }`
- [ ] **Company validation:** All operations verify company_id matches user's company
- [ ] All return standard format
- [ ] Build passes with no TypeScript errors

**Dependencies:** Task 1.9

---

## Task 1.11: Server Actions - Pricing Templates

**Agent:** backend-engineer
**Skills:** `postgres-best-practices:postgres-best-practices`

**Description:**
Create Server Actions for pricing template management and application.

**Files:**
- `app/actions/pricing-templates.ts`

**Acceptance Criteria:**
- [ ] `"use server"` directive at top
- [ ] All functions use `getUserContext()` from `@/lib/auth-context`
- [ ] **Functions implemented:**
  - `getPricingTemplates()` - list company templates (filter by company_id)
  - `getPricingTemplate(id)` - get template with items (join query, company validation)
  - `createPricingTemplate(input)` - create template + bulk insert items in transaction
  - `updatePricingTemplate(input)` - update template name/is_default, replace items (transaction)
  - `deletePricingTemplate(id)` - delete template (cascade to items, verify company ownership)
  - `applyPricingTemplate(templateId, estimateId)` - match items by trade+category, update costs
- [ ] **Matching logic for `applyPricingTemplate`:**
  - Match by exact `trade` AND `category`
  - If multiple matches, use `sub_type` similarity (fuzzy match via Levenshtein or exact substring)
  - Update `unit_cost`, `material_cost`, `labor_cost`, `equipment_cost` from template
  - Recalculate `subtotal` for each line item
- [ ] Returns count of matched items: `{ success: true, data: { matched: number, total: number } }`
- [ ] **Company validation:** All operations verify company_id matches
- [ ] All return standard format
- [ ] Build passes with no TypeScript errors

**Dependencies:** Task 1.2

---

## Task 1.12: Server Actions - AI Budget Management

**Agent:** backend-engineer
**Skills:** `postgres-best-practices:postgres-best-practices`

**Description:**
Create Server Actions for AI usage tracking and budget configuration.

**Files:**
- `app/actions/ai-budget.ts`

**Acceptance Criteria:**
- [ ] `"use server"` directive at top
- [ ] All functions use `getUserContext()` from `@/lib/auth-context`
- [ ] **Functions implemented:**
  - `getAiUsage()` - current month stats (total_spend, pages_parsed, avg_cost_per_page)
  - `getAiBudget()` - company budget settings (monthly_budget, current_spend, percent_used)
  - `updateAiBudget(input)` - update monthly budget (admin only, role check via getUserContext)
- [ ] **Current month query:** Uses `date_trunc('month', now())` for dynamic rolling window (no cron needed)
- [ ] **Budget calculations:**
  - `total_spend = SUM(cost) WHERE created_at >= date_trunc('month', now())`
  - `pages_parsed = COUNT(DISTINCT page_id)`
  - `avg_cost_per_page = total_spend / pages_parsed`
  - `percent_used = (total_spend / monthly_budget) * 100`
- [ ] **Role check:** `updateAiBudget` only allows admin/owner role (check `getUserContext().role`)
- [ ] All return standard format
- [ ] Build passes with no TypeScript errors

**Dependencies:** Task 1.2

---

## Task 1.13: Generate TypeScript Types from Database

**Agent:** backend-engineer
**Skills:** `postgres-best-practices:postgres-best-practices`

**Description:**
Run Supabase type generation and create manual type definitions for estimates domain.

**Files:**
- `types/db/tables/estimates.ts` (manual types)
- `types/supabase.ts` (auto-generated via npm script)

**Acceptance Criteria:**
- [ ] Run `npm run db:gen-types` to generate Supabase types from migrations
- [ ] Create manual type definitions in `types/db/tables/estimates.ts`:
  - Base types: `PlanUpload`, `PlanPage`, `ParseResult`, `TakeoffItem`, `Estimate`, `EstimateLineItem`, `PricingTemplate`, `PricingTemplateItem`, `AiUsageLog`
  - Joined types: `EstimateWithLineItems` (estimate + line_items[]), `TemplateWithItems` (template + items[])
  - Input types: `CreateEstimateInput`, `UpdateEstimateInput`, `ReviewTakeoffItemInput`, `ManualTakeoffInput`
  - Row types: `{TableName}Row` (extends auto-generated), `{TableName}Insert` (insert payload)
- [ ] All enums exported: `PlanUploadStatus`, `PlanPageParseStatus`, `EstimateStatus`, `TakeoffCategory`, `ExtractionMethod`, `ReviewStatus`
- [ ] Import from auto-generated types where possible: `import type { Database } from '@/types/supabase'`
- [ ] No TypeScript errors in type definitions
- [ ] Build passes with no errors

**Dependencies:** Task 1.2

---

## Task 1.14: Code Review - Part 1 Backend Infrastructure

**Agent:** code-reviewer
**Skills:** None (code-reviewer has internal review patterns)

**Description:**
Review all Part 1 backend code for correctness, security, performance, and adherence to GenHub patterns.

**Files:**
- All files created in Tasks 1.1-1.13

**Acceptance Criteria:**
- [ ] All migrations apply cleanly with `mcp__supabase__apply_migration`
- [ ] All RLS policies tested (SELECT/INSERT/UPDATE/DELETE for different companies, verify isolation)
- [ ] Storage buckets accessible with signed URLs (test 1hr expiry)
- [ ] API routes handle errors gracefully (file too large, unsupported MIME, budget exceeded, missing OPENAI_API_KEY)
- [ ] PDF-to-image pipeline tested with 10-page PDF (completes in < 30s, no memory leaks)
- [ ] OpenAI integration tested with real API key or mocked in tests (verify token counting, cost calculation)
- [ ] Cache layer tested (same page image SHA-256 returns cached result, no duplicate API calls)
- [ ] Budget enforcement tested (blocks at 100%, warns at 80%, allows at 79%)
- [ ] All Server Actions return consistent `{ success, data/error }` format
- [ ] No Supabase clients in wrong contexts (admin client only in API routes, user client in Server Actions)
- [ ] Zod validation on all inputs (no unvalidated user input reaches DB)
- [ ] No SQL injection vulnerabilities (parameterized queries only)
- [ ] Company isolation verified (cannot access other company's data via path manipulation, ID guessing)
- [ ] Path traversal prevented (storage paths validated, companyId matches authenticated user)
- [ ] TypeScript build passes with zero errors
- [ ] ESLint passes with zero warnings
- [ ] No console.log statements in production code (use proper logging or remove)

**Dependencies:** Tasks 1.1-1.13

---

## Summary

**Total Tasks:** 14
**Estimated Duration:** 2 weeks
**Output:**
- 3 database migrations (9 tables, 6 enums, RLS, indexes, buckets)
- 3 API routes (upload, parse, parse-status)
- 3 Server Action files (estimates.ts, pricing-templates.ts, ai-budget.ts)
- Type definitions
- Full code review

**Next Phase:** Part 2 - UI Components and Integration
