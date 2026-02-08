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
**Skills:**
- `.claude/skills/database/create-migration.md`
- `postgres-best-practices:postgres-best-practices`

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
- [ ] Migration applies cleanly with `npm run db:gen-types`

**Dependencies:** None

---

## Task 1.2: Create Database Migration - Supporting Tables and RLS

**Agent:** backend-engineer
**Skills:**
- `.claude/skills/database/create-migration.md`
- `postgres-best-practices:postgres-best-practices`

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
- [ ] Migration applies cleanly with `npm run db:gen-types`

**Dependencies:** Task 1.1

---

## Task 1.3: Create Supabase Storage Buckets

**Agent:** backend-engineer
**Skills:** `.claude/skills/backend/supabase-storage.md`

**Description:**
Create two private Supabase Storage buckets for plan files and page images with appropriate RLS policies.

**Files:**
- `supabase/migrations/{timestamp}_create_estimating_buckets.sql`

**Acceptance Criteria:**
- [ ] Bucket `plan-files` created (private, no public access)
- [ ] Bucket `plan-pages` created (private, no public access)
- [ ] Storage RLS policy for `plan-files`:
  - SELECT: company_id matches user's company (extracted from path)
  - INSERT: company_id matches user's company
  - DELETE: admin role only
- [ ] Storage RLS policy for `plan-pages`:
  - SELECT: company_id matches user's company
  - INSERT: company_id matches user's company
  - DELETE: admin role only
- [ ] Path structure enforced: `{companyId}/projects/{projectId}/plans/{filename}` for plan-files
- [ ] Path structure enforced: `{companyId}/projects/{projectId}/pages/{planId}/page_{pageNumber}.png` for plan-pages
- [ ] Buckets visible in Supabase dashboard after migration

**Dependencies:** Task 1.2

---

## Task 1.4: Install PDF Processing Dependencies

**Agent:** backend-engineer
**Skills:** `.claude/skills/backend/dependencies.md`

**Description:**
Install pdfjs-dist for server-side PDF rendering and verify sharp is available.

**Files:**
- `package.json`

**Acceptance Criteria:**
- [ ] `pdfjs-dist` added to dependencies (latest stable version)
- [ ] Verify `sharp` already exists in dependencies (no installation needed)
- [ ] `npm install` completes without errors
- [ ] TypeScript types for pdfjs-dist available (@types/pdfjs-dist if needed)
- [ ] No peer dependency warnings

**Dependencies:** None

---

## Task 1.5: API Route - Plan Upload with PDF-to-Image Pipeline

**Agent:** backend-engineer
**Skills:**
- `.claude/skills/backend/api-routes.md`
- `postgres-best-practices:postgres-best-practices`

**Description:**
Create the plan upload API route that handles multipart/form-data, validates files, stores originals in Supabase Storage, converts PDF pages to PNG images, and creates database records.

**Files:**
- `app/api/estimates/upload/route.ts`

**Acceptance Criteria:**
- [ ] POST endpoint accepts multipart/form-data with `file`, `projectId`, `phaseId?`
- [ ] Auth via `auth()` from `@/lib/auth` + session check
- [ ] Creates admin Supabase client via `createAdminClient()`
- [ ] Client-side validation: file size < 50MB, MIME type check (application/pdf, image/jpeg, image/png)
- [ ] Filename sanitization: `filename.replace(/[^a-zA-Z0-9.-]/g, "_")`
- [ ] Server-side MIME type validation (not just extension)
- [ ] Stores original file to `plan-files` bucket at path `{companyId}/projects/{projectId}/plans/{timestamp}_{filename}`
- [ ] Inserts `plan_uploads` record with status `uploading`, then updates to `processing` for PDFs
- [ ] **PDF Processing Pipeline:**
  - Uses `pdfjs-dist.getDocument()` to load PDF
  - Iterates each page sequentially (not parallel to limit memory)
  - Renders page to canvas at scale factor 4.17 (~300 DPI from 72 DPI)
  - Converts canvas to PNG buffer via `sharp`
  - Uploads PNG to `plan-pages` bucket
  - Inserts `plan_pages` record with status `pending`
- [ ] Updates `plan_uploads.status` to `ready` and sets `total_pages`
- [ ] Error handling: sets status to `failed` on PDF conversion errors
- [ ] Returns `{ success: true, data: { planUpload: { id, status, totalPages } } }`
- [ ] For JPG/PNG uploads, stores directly without conversion, creates single plan_page
- [ ] No memory leaks (canvas/buffer disposal per page)
- [ ] Build passes with no TypeScript errors

**Dependencies:** Task 1.3, Task 1.4

---

## Task 1.6: API Route - AI Parsing with GPT-4o Integration

**Agent:** backend-engineer
**Skills:**
- `.claude/skills/backend/api-routes.md`
- `.claude/skills/backend/openai-integration.md`

**Description:**
Create the AI parsing API route that retrieves page images, checks cache via SHA-256 hash, calls OpenAI GPT-4o vision API with structured extraction prompt, stores raw results, and normalizes into takeoff items.

**Files:**
- `app/api/estimates/parse/route.ts`
- `lib/ai/parse-prompt.ts` (extraction prompt + schema)
- `lib/ai/normalize-takeoff.ts` (normalization logic)

**Acceptance Criteria:**
- [ ] POST endpoint accepts `{ planUploadId, pageIds?: string[] }`
- [ ] Auth via `auth()` + admin client
- [ ] Budget check BEFORE any OpenAI call:
  - Query current month spend from `ai_usage_log`
  - If >= budget, return 402 with error message
  - If >= 80%, include warning in response
- [ ] For each page:
  - Compute SHA-256 hash of page image bytes
  - Update `plan_pages.image_hash_sha256`
  - Check `plan_parse_results` for cached result by hash
  - If cache hit: clone result, set `cached=true`, skip API call
  - If cache miss: proceed with OpenAI
- [ ] OpenAI API call:
  - Resize image to max 2048px width via `sharp` (JPEG quality 85 for API only)
  - Send to GPT-4o vision with structured extraction prompt
  - Prompt includes: system rules (never fabricate, explicit labels only), category definitions, confidence guidelines
  - Response format: JSON with page_type, items[], raw_notes, warnings
- [ ] Zod validation of API response against schema
- [ ] Store raw response in `plan_parse_results` with token counts, cost
- [ ] Normalization to `takeoff_items`:
  - Use AI `category` + `sub_type` directly
  - Map trade from label context
  - Apply waste factors by trade (Drywall +10%, Flooring +15%, etc.)
  - Set `needs_review=true` if confidence < 0.7
  - Store `ai_item_id`, `source_region`, `extraction_method`
- [ ] Log to `ai_usage_log` with model, tokens, cost, cached flag
- [ ] Update `plan_pages.parse_status` to `parsed` or `parse_failed`
- [ ] Retry logic: 1 automatic retry on failure, then mark failed
- [ ] Returns `{ success: true, data: { totalPages, parsed, failed } }`
- [ ] Environment variable `OPENAI_API_KEY` required
- [ ] Build passes with no TypeScript errors

**Dependencies:** Task 1.5

---

## Task 1.7: API Route - Parse Status Polling Endpoint

**Agent:** backend-engineer
**Skills:** `.claude/skills/backend/api-routes.md`

**Description:**
Create a GET endpoint for polling parse status per plan upload.

**Files:**
- `app/api/estimates/parse-status/route.ts`

**Acceptance Criteria:**
- [ ] GET endpoint accepts query param `planUploadId`
- [ ] Auth via `auth()` + admin client
- [ ] Queries all `plan_pages` for the plan with `id`, `page_number`, `parse_status`
- [ ] Returns `{ success: true, data: { pages: [...], allComplete: boolean } }`
- [ ] `allComplete` is true when all pages are `parsed` or `parse_failed` (no `pending` or `parsing`)
- [ ] Response time < 100ms (simple SELECT query)
- [ ] Build passes with no TypeScript errors

**Dependencies:** Task 1.6

---

## Task 1.8: Server Actions - Estimates CRUD

**Agent:** backend-engineer
**Skills:**
- `.claude/skills/backend/server-action.md`
- `postgres-best-practices:postgres-best-practices`

**Description:**
Create Server Actions for estimates and estimate line items CRUD operations.

**Files:**
- `app/actions/estimates.ts`

**Acceptance Criteria:**
- [ ] `"use server"` directive at top
- [ ] All functions use `getUserContext()` from `@/lib/auth-context`
- [ ] Zod schemas for all input validation
- [ ] Functions implemented:
  - `getEstimates(projectId)` - list estimates for project
  - `getEstimate(estimateId)` - get single estimate with line items (join query)
  - `createEstimate(input)` - create estimate + bulk insert line items in transaction
  - `updateEstimate(input)` - update name, overhead_pct, markup_pct, recalculate totals
  - `approveEstimate(estimateId)` - set status to `approved` (role check: admin/PM only)
  - `createMaterialsFromEstimate(estimateId)` - bulk insert to `materials` table
  - `createExpenseFromEstimate(estimateId)` - create expense + line items
- [ ] All return `{ success: true, data }` or `{ success: false, error: "message" }`
- [ ] Transaction handling for multi-table operations
- [ ] Total calculations: `subtotal`, `overhead_amount`, `markup_amount`, `grand_total`
- [ ] Build passes with no TypeScript errors

**Dependencies:** Task 1.2

---

## Task 1.9: Server Actions - Plan Uploads and Pages

**Agent:** backend-engineer
**Skills:** `.claude/skills/backend/server-action.md`

**Description:**
Create Server Actions for querying plan uploads, pages, and parse results.

**Files:**
- `app/actions/estimates.ts` (add to existing file from Task 1.8)

**Acceptance Criteria:**
- [ ] Functions implemented:
  - `getPlanUploads(projectId)` - list all plan uploads for project with status
  - `getPlanPages(planUploadId)` - get pages with parse_status, image URLs (signed URLs, 1hr expiry)
  - `getParseResults(pageId)` - get raw AI output for a page
- [ ] Signed URLs generated for private storage via `supabase.storage.from().createSignedUrl()`
- [ ] All return standard `{ success, data/error }` format
- [ ] Build passes with no TypeScript errors

**Dependencies:** Task 1.8

---

## Task 1.10: Server Actions - Takeoff Items CRUD

**Agent:** backend-engineer
**Skills:** `.claude/skills/backend/server-action.md`

**Description:**
Create Server Actions for takeoff items review, editing, and manual entry.

**Files:**
- `app/actions/estimates.ts` (add to existing file)

**Acceptance Criteria:**
- [ ] Functions implemented:
  - `getTakeoffItems(planUploadId, filters?)` - list items with optional filtering by trade, review_status, needs_review
  - `updateTakeoffItem(input)` - update quantity, unit, waste_factor, etc.
  - `reviewTakeoffItem(input)` - set review_status (accepted/rejected/edited), append to edit_history JSONB
  - `addManualTakeoffItem(input)` - create manual item with extraction_method='manual', confidence=1.0
  - `deleteTakeoffItem(itemId)` - soft delete or hard delete (implement hard delete)
- [ ] Zod schemas for all inputs
- [ ] Edit history tracking: `{ timestamp, user_id, field, old_value, new_value }`
- [ ] All return standard format
- [ ] Build passes with no TypeScript errors

**Dependencies:** Task 1.9

---

## Task 1.11: Server Actions - Pricing Templates

**Agent:** backend-engineer
**Skills:** `.claude/skills/backend/server-action.md`

**Description:**
Create Server Actions for pricing template management and application.

**Files:**
- `app/actions/pricing-templates.ts`

**Acceptance Criteria:**
- [ ] Functions implemented:
  - `getPricingTemplates()` - list company templates
  - `getPricingTemplate(id)` - get template with items (join query)
  - `createPricingTemplate(input)` - create template + bulk insert items in transaction
  - `updatePricingTemplate(input)` - update template and replace items
  - `deletePricingTemplate(id)` - delete template (cascade to items)
  - `applyPricingTemplate(templateId, estimateId)` - match items by trade+category, update costs
- [ ] Matching logic for `applyPricingTemplate`: match by `trade` and `category` + `sub_type` similarity
- [ ] Returns count of matched items: `{ success: true, data: { matched: number } }`
- [ ] All return standard format
- [ ] Build passes with no TypeScript errors

**Dependencies:** Task 1.2

---

## Task 1.12: Server Actions - AI Budget Management

**Agent:** backend-engineer
**Skills:** `.claude/skills/backend/server-action.md`

**Description:**
Create Server Actions for AI usage tracking and budget configuration.

**Files:**
- `app/actions/ai-budget.ts`

**Acceptance Criteria:**
- [ ] Functions implemented:
  - `getAiUsage()` - current month stats (total_spend, pages_parsed, avg_cost_per_page)
  - `getAiBudget()` - company budget settings (monthly_budget, current_spend, percent_used)
  - `updateAiBudget(input)` - update monthly budget (admin only, role check)
- [ ] Current month query uses `date_trunc('month', now())` for dynamic window (no cron needed)
- [ ] Budget percent calculation: `(current_spend / monthly_budget) * 100`
- [ ] All return standard format
- [ ] Build passes with no TypeScript errors

**Dependencies:** Task 1.2

---

## Task 1.13: Generate TypeScript Types from Database

**Agent:** backend-engineer
**Skills:** `.claude/skills/backend/type-generation.md`

**Description:**
Run Supabase type generation and create manual type definitions for estimates domain.

**Files:**
- `types/db/tables/estimates.ts` (manual types)
- `types/supabase.ts` (auto-generated)

**Acceptance Criteria:**
- [ ] Run `npm run db:gen-types` to generate Supabase types
- [ ] Create manual type definitions in `types/db/tables/estimates.ts`:
  - `PlanUpload`, `PlanPage`, `ParseResult`, `TakeoffItem`, `Estimate`, `EstimateLineItem`, `PricingTemplate`, `PricingTemplateItem`, `AiUsageLog`
  - `EstimateWithLineItems` (joined type)
  - `TemplateWithItems` (joined type)
  - `CreateEstimateInput`, `UpdateEstimateInput`, `ReviewTakeoffItemInput`, `ManualTakeoffInput`
- [ ] All enums exported: `PlanUploadStatus`, `PlanPageParseStatus`, `EstimateStatus`, `TakeoffCategory`, `ExtractionMethod`, `ReviewStatus`
- [ ] No TypeScript errors in type definitions
- [ ] Build passes with no errors

**Dependencies:** Task 1.2

---

## Task 1.14: Code Review - Part 1 Backend Infrastructure

**Agent:** code-reviewer
**Skills:** `.claude/skills/workflow/code-review.md`

**Description:**
Review all Part 1 backend code for correctness, security, performance, and adherence to GenHub patterns.

**Files:**
- All files created in Tasks 1.1-1.13

**Acceptance Criteria:**
- [ ] All migrations apply cleanly with `npm run db:gen-types`
- [ ] All RLS policies tested (SELECT/INSERT/UPDATE/DELETE for different companies)
- [ ] Storage buckets accessible with signed URLs
- [ ] API routes handle errors gracefully (file too large, unsupported MIME, budget exceeded)
- [ ] PDF-to-image pipeline tested with 10-page PDF (completes in < 30s)
- [ ] OpenAI integration tested with real API key (or mocked in tests)
- [ ] Cache layer tested (same page image returns cached result)
- [ ] Budget enforcement tested (blocks at 100%, warns at 80%)
- [ ] All Server Actions return consistent `{ success, data/error }` format
- [ ] No Supabase clients in wrong contexts (admin client only in API routes)
- [ ] Zod validation on all inputs
- [ ] No SQL injection vulnerabilities
- [ ] TypeScript build passes with zero errors
- [ ] ESLint passes with zero warnings
- [ ] No console.log statements in production code

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
