# AI Plan Estimator - Optimized Spec Prompt

> Production-ready prompt for generating a complete, implementable specification
> for the "AI-Assisted Plan Estimating" feature in GenHub.
>
> Usage: Feed this prompt to Claude Opus or GPT-4o to generate the full spec.
> All 18 improvements from the prompt engineering review are incorporated.

---

## THE PROMPT

```
You are a senior construction technology architect with 15 years of experience
building estimating software for general contractors. You understand CSI
MasterFormat divisions, unit-rate estimating, quantity takeoff workflows, and
the trust gap between AI-generated data and field-verified measurements.

You are designing a spec for the "AI-Assisted Plan Estimating" feature for
GenHub, a production construction management PWA. Your spec must be
implementable by a developer who has never seen this feature before, using
only the spec and the existing codebase.

Think step-by-step through each deliverable. Before writing each section,
briefly state your reasoning about key tradeoffs, then produce the section.

=======================================
QUALITY PRINCIPLES (Apply everywhere)
=======================================

1. IMPLEMENTABLE over theoretical. Every decision must map to a concrete
   file, table, or component. No hand-waving.
2. TRANSPARENT over automated. Users must understand and control every
   number. No black boxes.
3. INCREMENTAL over monolithic. v1 ships in 2-4 weeks.
4. MOBILE-FIRST. This is a PWA for field workers. Every screen must work
   on 375px with 44px touch targets.
5. COST-CONTROLLED. AI API calls cost money. Every parsing operation
   must have explicit cost guardrails.

=======================================
EXISTING SYSTEM CONTEXT (MANDATORY)
=======================================

You MUST design within these existing patterns. Do not invent new patterns
where existing ones apply.

<tech-stack>
- Next.js 16 (App Router) + React 19
- Supabase (Postgres + Auth + Storage + RLS)
- NextAuth for authentication
- Tailwind CSS + shadcn/ui primitives
- Zod for all validation
- Lucide icons only (never heroicons/fontawesome)
- Design tokens: Primary #001B51, Accent #3C3C3C, Touch 44px min,
  Viewport dvh, Safe area pb-[env(safe-area-inset-bottom)]
</tech-stack>

<architecture-rules>
- Server Actions in `app/actions/{domain}.ts` for ALL DB operations
- API Routes in `app/api/{feature}/route.ts` for file uploads and webhooks
- NO direct Supabase access in 'use client' components (BLOCKING RULE)
- `ResponsiveModal` for all modals (never raw Dialog) (BLOCKING RULE)

Auth pattern used in Server Actions:
  import { getUserContext } from "@/lib/auth-context"
  // Returns: { userId, companyId, role, supabase } or { error: string }
  const ctx = await getUserContext();
  if ("error" in ctx) return { success: false, error: "Unauthorized" };

Auth pattern used in API Routes:
  import { auth } from "@/lib/auth"
  import { createAdminClient } from "@/utils/supabase/server"
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const supabase = createAdminClient();

Project access verification:
  import { verifyProjectAccess } from "@/lib/tasks-utils"
  // verifyProjectAccess(supabase, projectId, companyId)
  // Returns { project } or { error: string }

Server Action return pattern:
  return { success: true, data: result }   // on success
  return { success: false, error: "msg" }  // on failure

Zod validation at top of every action file. Example:
  const createItemSchema = z.object({
    name: z.string().min(1),
    project_id: z.string().uuid(),
    amount: z.number().min(0),
  });
</architecture-rules>

<file-organization>
- Actions: `app/actions/estimates.ts`, `app/actions/estimate-parsing.ts`
- API routes: `app/api/estimates/upload/route.ts`,
              `app/api/estimates/parse/route.ts`
- Components: `components/estimates/` directory
- Types: `types/db/tables/estimates.ts`
- New enums: added to `types/db/enums.ts`
- Validation: Zod schemas at top of each action file
- Pages: `app/app/projects/[id]/estimates/` directory
</file-organization>

<storage-pattern>
Follow existing project-files upload pattern:
- Supabase Storage bucket: `plan-files`
- Path format: `{companyId}/projects/{projectId}/plans/{timestamp}_{sanitizedFilename}`
- Upload via API route with formData, stream File object directly
- 50MB max file size
- Sanitize filenames: file.name.replace(/[^a-zA-Z0-9.-]/g, "_")
- Get public URL: supabase.storage.from('plan-files').getPublicUrl(filePath)
- Insert DB record after successful storage upload
- Audit trail: log to audit table with action, performed_by, new_state
- revalidatePath() after mutations
</storage-pattern>

<multi-tenancy>
- Every table MUST have `company_id` column
- RLS policies enforce company_id isolation
- All queries filter by companyId from getUserContext()
- createAdminClient() bypasses RLS -- only for API routes, never in actions
</multi-tenancy>

<existing-domains>
This feature integrates with these existing tables and types:

Projects:
  Table: `projects` (columns: id, company_id, name, status, project_type, ...)
  Types: ProjectsRow, ProjectsInsert from '@/types/db/tables/projects'
  Enum: ProjectStatus = 'active'|'on_hold'|'completed'|'archived'|'planning'|'in_progress'
  Enum: ProjectType = 'residential'|'restaurant'|'cafe'|'commercial_office'|'industrial'

Project Phases:
  Table: `project_phases` (id, project_id, name, status, sort_order, ...)
  Enum: PhaseStatus = 'not_started'|'in_progress'|'completed'|'on_hold'

Materials:
  Table: `materials` (id, company_id, product_name, category, unit_price, unit_of_measure, ...)
  Table: `material_assignments` (id, material_id, task_id, project_id, quantity, unit_cost, procurement_status, ...)
  Enum: MaterialCategory = 'lumber'|'concrete'|'electrical'|'plumbing'|'hvac'|'roofing'|'flooring'|'paint'|'hardware'|'tools'|'fixtures'|'insulation'|'drywall'|'doors_windows'|'landscaping'|'other'

Expenses:
  Table: `expenses` (id, company_id, project_id, description, amount, category, status, ...)
  Table: `expense_line_items` (id, expense_id, description, quantity, unit_price, material_id, match_confidence_score, ...)
  Enum: ExpenseCategory = 'materials'|'labor'|'equipment'|'permits'|'transportation'|'meals'|'lodging'|'other'
  Enum: ExpenseStatus = 'submitted'|'under_review'|'approved'|'rejected'|'paid'

Project Files:
  Table: `project_files` (id, company_id, project_id, filename, file_url, file_size, file_type, category, ...)
  Table: `file_audit_log` (id, company_id, file_id, action, performed_by, new_state, ...)

User Roles:
  Enum: UserRole = 'admin'|'project_manager'|'foreman'|'field_worker'|'subcontractor'|'client'

Trade Types:
  Enum: TradeType = 'general'|'electrical'|'plumbing'|'hvac'|'carpentry'|'masonry'|'roofing'|'flooring'|'painting'|'drywall'|'concrete'|'landscaping'|'demolition'|'steel_work'|'glass_glazing'|'fire_protection'|'insulation'|'framing'|'other'
</existing-domains>

=======================================
SCOPE: v1 (Ship in 2-4 weeks)
=======================================

<in-scope>
- Upload PDF/JPG/PNG plans to a project
- Convert multi-page PDFs to images (server-side, one per page, ~300 DPI)
- AI vision parsing of each page: extract rooms, dimensions, areas, labels
- Structured takeoff data with confidence scores per item
- Human review screen: view plan image + edit extracted takeoff data
- Apply unit costs to generate line-item estimate
- Save estimate linked to project
- Basic pricing templates (reusable cost presets)
</in-scope>

<out-of-scope>
- DWG/DXF/BIM file support (v2)
- PDF export of estimates (v2)
- AI-powered cost suggestions (v2)
- Multi-estimator collaboration / concurrent editing (v2)
- Offline estimate editing (v2)
- Scale detection / auto-measurement from unmarked drawings (v2)
- Integration with material supplier pricing APIs (v2)
- Change order tracking from plan revisions (v3)
</out-of-scope>

=======================================
FUNCTIONAL REQUIREMENTS
=======================================

FR-1: Plan Upload & Storage
- Accept: PDF (multi-page), JPG, PNG
- Max file size: 50MB per file
- PDF processing: convert to PNG images at ~300 DPI, one per page
  (server-side, use a library like pdf-to-img or pdf-lib + sharp)
- Store original files in Supabase Storage bucket `plan-files`
- Store converted page images in bucket `plan-pages`
- Associate plans with a project (required) and optionally a phase
- Support uploading multiple plan files per project
- Track processing status: uploading | processing | ready | failed
- Authorization: admin and project_manager can upload;
  foreman and field_worker can view only

FR-2: AI Plan Parsing (Page-Level)
- Parse each page independently via vision API (Claude or GPT-4o)
- Extract ONLY what is explicitly visible or labeled on the plan:
  * Room/area names and labels
  * Dimensions (only if numerically labeled on the drawing)
  * Square footage (only if derivable from labeled dimensions)
  * Wall segments (only if clearly delineated with measurements)
  * Construction notes, callouts, material specifications
  * Scale indicator (if present)
- Each extracted item MUST include:
  * confidence: number 0.0-1.0
  * source_region: { x, y, width, height } as percentage of page
  * extraction_method: "labeled" | "calculated" | "inferred"
- STRICT RULES:
  * Never fabricate dimensions not visible on the plan
  * Never assume room purposes from ambiguous labels
  * Flag items with confidence < 0.7 as needs_review = true
  * If a page has no extractable data, return empty items with
    page_type "cover" | "legend" | "schedule" | "unknown"
- Cache parsed results per page (key: SHA-256 hash of page image)
- Cost control: max 1 AI call per page, retry once on failure,
  then mark page as parse_failed

AI Output JSON Schema (per page):
{
  "page_number": 1,
  "page_type": "floor_plan | elevation | section | detail | schedule | cover | legend | unknown",
  "scale": { "ratio": "1/4\" = 1'", "pixels_per_foot": 24.5 } | null,
  "items": [
    {
      "id": "generated-uuid",
      "type": "room | wall | opening | fixture | note | dimension",
      "label": "Kitchen",
      "dimensions": {
        "length_ft": 12.5,
        "width_ft": 10.0,
        "height_ft": null,
        "area_sqft": 125.0,
        "linear_ft": null
      },
      "confidence": 0.85,
      "source_region": { "x": 0.15, "y": 0.22, "width": 0.35, "height": 0.28 },
      "extraction_method": "labeled",
      "needs_review": false,
      "notes": "Dimensions clearly labeled on plan"
    }
  ],
  "raw_notes": ["General notes found on this page"],
  "warnings": ["Scale not found - dimensions may be unreliable"]
}

FR-3: Takeoff Normalization
- Convert all AI output into standardized takeoff line items
- Normalize units: all areas to sqft, all lengths to linear feet
- Merge duplicate rooms detected across pages (match by label similarity)
- Apply standard waste factors per trade:
  * Drywall: +10%
  * Flooring: +15%
  * Paint: +10%
  * Tile: +15%
  * Lumber/framing: +10%
  * Concrete: +5%
  * Insulation: +10%
  (Store waste factors in a config, not hardcoded)
- Flag all items with confidence < 0.7 for mandatory user review
- Store normalized takeoff data SEPARATELY from raw AI output
- Each line item tracks provenance: page_number, ai_item_id, user edits

FR-4: Human Review & Validation
- MANDATORY before estimate generation (block until review complete)
- Mobile layout (default, < 768px): stacked vertically
  * Plan viewer on top (pinch-zoom, pan, swipe between pages)
  * Takeoff item list below (scrollable)
- Desktop layout (>= 768px): side-by-side
  * Plan viewer on left
  * Takeoff list on right
- When user taps a takeoff item, highlight source_region on the plan
- Inline editing: tap any quantity/dimension to edit (44px touch targets)
- Per-item actions: Accept (confirm AI), Reject (remove), Edit (modify)
- Manually add missing items (marked extraction_method = "manual")
- Visual confidence badges:
  * Green (>= 0.8): high confidence
  * Yellow (0.5 - 0.79): medium, review recommended
  * Red (< 0.5): low, review required
- Progress indicator: "12 of 18 items reviewed"
- Completion gate: all items must be accepted/rejected/edited to proceed
- Use ResponsiveModal for any item detail editing

FR-5: Cost & Labor Engine
- Line item structure: quantity x unit_cost = subtotal
- Cost components per line item:
  * Material cost (link to existing materials table when matching)
  * Labor cost (hours x hourly rate)
  * Equipment cost
- Overhead percentage (configurable per estimate, default 10%)
- Profit markup percentage (configurable per estimate, default 15%)
- Pricing templates: save and load named sets of unit costs
  (e.g., "Residential Standard 2025", "Commercial Premium")
- All calculations must be transparent: show formula per line item
- Totals: subtotal, overhead_amount, markup_amount, grand_total

FR-6: Estimate Output & Integration
- Save estimate with full line-item breakdown
- Link to: project (required), phase (optional)
- Summary view: total by trade/category, grand total
- Create material records from estimate line items
  (link to existing materials table using MaterialCategory)
- Create expense records from estimate
  (link to existing expenses table using ExpenseCategory)
- Estimate status lifecycle: draft -> reviewed -> approved -> superseded
- Version history: when a plan is re-uploaded, previous estimate is
  marked "superseded", never deleted
- Authorization: only admin and project_manager can approve estimates

=======================================
NON-FUNCTIONAL REQUIREMENTS
=======================================

NFR-1: Performance
- Plan upload + PDF processing: < 30 seconds for a 10-page PDF
- AI parsing: < 15 seconds per page (timeout at 30s, then fail)
- Takeoff list rendering: < 100ms for 200 line items
- Plan viewer: smooth 60fps pan/zoom on mobile Safari and Chrome

NFR-2: Cost Control
- Track AI API cost per parse (store model, token_count_in, token_count_out)
- Company-level monthly AI budget (configurable, default $50)
- Alert notification at 80% budget consumption
- Hard stop at 100%: block new AI parsing, allow manual-only entry
- Cache: identical page image hash = skip re-parsing entirely

NFR-3: Security & Authorization
- RLS on all new tables (company_id isolation)
- Upload: admin, project_manager only
- View: all project team members
- Approve estimate: admin, project_manager only
- Plan files: private storage bucket, signed URLs with 1-hour expiry
- Sanitize all filenames on upload
- Validate file MIME types server-side (not just extension)

NFR-4: Error Handling
- Corrupt/unreadable PDF: detect, return user-friendly error, do not retry
- AI parsing failure: retry once, then mark page as "parse_failed"
  with option for manual-only takeoff on that page
- Storage upload failure: cleanup any partial uploads, show retry button
- Network interruption during upload: clear error message + retry button
  (resume upload not required in v1)
- Zod validation errors: return first issue message to client

NFR-5: Observability
- Log: upload events, parse start/complete/fail, estimate CRUD
- Track: parse success rate, average confidence, cost per estimate
- Audit trail: all estimate edits tracked (user_id, timestamp, old/new value)
- Use existing file_audit_log pattern for plan file operations

=======================================
DELIVERABLES
=======================================

Produce these sections IN ORDER. For each section, first state 1-2 sentences
of reasoning about key tradeoffs, then produce the deliverable.

After all sections, run the self-validation checklist.

--- DELIVERABLE 1: System Architecture ---
Format: Mermaid flowchart diagram + prose explanation (2-3 paragraphs)
Must show:
- Client -> API Route -> AI Service flow for upload and parsing
- Client -> Server Action flow for CRUD operations
- Storage buckets (plan-files, plan-pages) and their contents
- Which operations are async (parsing) vs synchronous (CRUD)
- How polling or revalidation communicates parse completion to the UI
Depth: component-level, not function-level

--- DELIVERABLE 2: Database Schema ---
Format: SQL DDL (CREATE TABLE statements) for Supabase/Postgres
Must include:
- All new tables with columns, types, constraints, defaults
- Foreign keys to existing tables (projects, materials, expenses)
- company_id on EVERY table
- RLS policy definitions (at minimum: SELECT and INSERT per table)
- Indexes for common query patterns (project_id, company_id, status)
- Any new enum types

Minimum required tables:
  plan_uploads        - uploaded plan files (PDF/image metadata, status)
  plan_pages          - individual page images from a plan
  plan_parse_results  - raw AI output per page (JSONB)
  takeoff_items       - normalized, user-editable line items
  estimates           - estimate header (project link, status, totals)
  estimate_line_items - costed line items within an estimate
  pricing_templates   - reusable named cost preset sets
  pricing_template_items - individual unit rates in a template
  ai_usage_log        - track AI API costs per company per month

--- DELIVERABLE 3: API Endpoints & Server Actions ---
Format: Markdown table with columns:
  Type (API Route | Server Action) | Path | Method | Purpose |
  Auth Required (role) | Input | Output

Must cover:
- Plan file upload (API Route, multipart/form-data)
- Trigger AI parsing (API Route, async)
- Get parsing status/results (Server Action)
- Takeoff item CRUD (Server Actions)
- Estimate CRUD (Server Actions)
- Pricing template CRUD (Server Actions)
- AI usage/budget queries (Server Action)

--- DELIVERABLE 4: AI Parsing Pipeline ---
Format: Numbered step-by-step flow with decision points
Must include:
- PDF-to-image conversion steps and library choice
- Image preparation (resolution, format, size limits)
- The ACTUAL vision model prompt template you would send to
  Claude or GPT-4o (write the full prompt text, not a summary)
- Response parsing and JSON validation against the schema
- Error handling at each step
- Cache check flow (hash image -> check cache -> skip or parse)
- Cost tracking: what to log per API call

--- DELIVERABLE 5: Component Breakdown ---
Format: Tree structure showing:
  components/estimates/
    ComponentName.tsx - description - 'use client' | server

Must follow GenHub patterns:
- Page components in app/app/projects/[id]/estimates/
- Domain components in components/estimates/
- ResponsiveModal for any modal interactions
- Use existing Button, Input, FormField from components/ui/
- Specify 'use client' vs server component for each
- Include loading/skeleton states
- 44px min touch targets on all interactive elements

--- DELIVERABLE 6: User Flow ---
Format: Numbered step-by-step narrative with screen descriptions
Cover the complete path:
  1. Navigate to project -> estimates tab
  2. Upload plan (drag-drop or file picker)
  3. Processing state (progress per page)
  4. Review screen (plan viewer + takeoff editing)
  5. Apply costs (template or manual)
  6. Save estimate
  7. View saved estimate summary
Include: error states, empty states, loading states for each step

--- DELIVERABLE 7: Cost Control & Caching ---
Format: Prose with specific numbers
Must cover:
- Per-page AI cost estimate (input tokens, output tokens, model, $/page)
- Monthly budget enforcement (where checked, how blocked)
- Cache invalidation rules (when does a cached parse expire?)
- Storage cost projections (avg image size, images per plan)
- Decision: Supabase Storage for both buckets (justify)

--- DELIVERABLE 8: Risks & Mitigations ---
Format: Table with columns: Risk | Likelihood | Impact | Mitigation
Minimum risks to address:
- AI accuracy variance: CAD-generated vs scanned vs photographed plans
- Cost overrun from large plan sets (50+ pages)
- User trust: contractors rejecting AI quantities
- Mobile performance with large plan images
- AI provider rate limits or outages
- File size / storage cost growth

--- DELIVERABLE 9: Phased Rollout ---
Format: Three phases, each with:
  Scope | Effort estimate | Success metric | Dependencies
- v1: This spec (upload -> parse -> review -> estimate)
- v2: Next priorities from out-of-scope list
- v3: Long-term vision

=======================================
SELF-VALIDATION CHECKLIST
=======================================

After producing ALL deliverables, verify each item below and report
PASS or FAIL with a brief note for any failures:

[ ] Every new table in the schema has company_id and RLS policies
[ ] Every API endpoint uses auth() and every Server Action uses getUserContext()
[ ] No 'use client' component directly accesses Supabase
[ ] The AI parsing JSON schema matches what the normalization layer consumes
    and what the database stores (plan_parse_results JSONB column)
[ ] The component tree accounts for every screen in the user flow
[ ] The database schema has columns for every field shown in the UX
[ ] Mobile layout is specified for every screen (375px, 44px targets)
[ ] Cost control: monthly budget is ENFORCED (hard stop), not just tracked
[ ] Error states are defined for: upload fail, parse fail, corrupt file
[ ] Estimate line items trace back to: page_number -> ai_item_id -> user edits
[ ] Integration with existing materials and expenses tables is specified
    with FK references and enum value mappings
[ ] All file paths follow GenHub conventions:
    app/actions/, app/api/, components/estimates/, types/db/tables/

=======================================
ANTI-HALLUCINATION RULES
=======================================

- Do NOT invent GenHub features not described in the context above.
  If you need a feature that might exist but was not listed, state
  your assumption explicitly and flag it with [ASSUMPTION].
- Do NOT assume the existence of database tables, columns, or API
  endpoints not mentioned in the existing-domains section.
- Do NOT recommend technologies outside the stated tech stack.
- For AI parsing accuracy, do NOT cite specific percentages. Instead
  describe accuracy by plan quality tier:
  * CAD-generated with labeled dimensions: high confidence expected
  * Scanned hand-drawn plans: low confidence, heavy manual review
  * Photos of plans: lowest confidence, primarily for reference
- Do NOT fabricate construction cost data. Use placeholder values
  (e.g., "$X.XX/sqft") and note they must be configured per company.
```

---

## VERIFICATION CHECKLIST

Confirm these 18 improvements are present in the prompt above:

- [x] 1. Enhanced role/persona with construction domain anchoring (CSI, takeoff, trust gap)
- [x] 2. Quality principles moved to top (shapes all generation)
- [x] 3. Full GenHub codebase context: auth patterns, file org, storage, types
- [x] 4. Explicit v1 scope with IN/OUT boundaries
- [x] 5. Complete AI parsing JSON schema with example item
- [x] 6. source_region and extraction_method on parsed items
- [x] 7. Mobile-first layout (stacked < 768px, side-by-side >= 768px)
- [x] 8. Authorization matrix per operation tied to UserRole enum
- [x] 9. Five NFR sections with specific targets (performance, cost, security, errors, observability)
- [x] 10. Format specified per deliverable (Mermaid, SQL DDL, table, tree, etc.)
- [x] 11. Self-validation checklist (12 items)
- [x] 12. Anti-hallucination rules (5 rules)
- [x] 13. Deep integration with existing domains (materials, expenses, projects, files)
- [x] 14. Estimate versioning lifecycle (draft -> reviewed -> approved -> superseded)
- [x] 15. Waste factors for takeoff normalization (per trade, configurable)
- [x] 16. Nine database tables specified in Deliverable 2
- [x] 17. Vision model prompt template required in Deliverable 4
- [x] 18. Chain-of-thought reasoning instructions ("state reasoning, then produce")
- [x] Contextual constraints distributed to relevant sections (not a standalone block)
- [x] GenHub design tokens embedded (#001B51, #3C3C3C, 44px, dvh, safe-area)
- [x] Server Action return pattern documented ({ success, data/error })
- [x] Existing upload route pattern reflected (formData, sanitize, storage, DB, audit, revalidate)
