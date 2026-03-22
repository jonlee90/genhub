# AI Plan Parsing - Technical Design

## Overview
Implement client-side UI changes to enable and monitor AI parsing of construction plan images. The backend parsing infrastructure already exists at `app/api/estimates/parse/route.ts` and handles OpenAI Vision API calls, token tracking, and takeoff item extraction.

## Requirements Reference
See: `.claude/specs/ai-plan-parsing/requirements.md`

---

## Architecture Overview

### Component Diagram
```
┌─────────────────────────────────────────────────────────────────┐
│ PlanUploadPanel (Client)                                        │
│   └── PlanUploadProgress (Client) ← MODIFY                      │
│       ├── Enabled "Parse with AI" button                        │
│       └── Polling logic (useEffect + setInterval)               │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ onClick → POST /api/estimates/parse
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│ /api/estimates/parse/route.ts (ALREADY EXISTS)                  │
│   1. Validate auth + company                                    │
│   2. Check AI budget limits                                     │
│   3. Download plan page images from storage                     │
│   4. Call OpenAI Vision API (GPT-4o)                            │
│   5. Parse response + validate schema                           │
│   6. Insert takeoff_items                                       │
│   7. Log ai_usage_log                                           │
│   8. Update plan_pages.parse_status                             │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ Poll every 2s to check status
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│ Server Action: getPlanPageStatus(pageId)                        │
│   → Returns parse_status from plan_pages                        │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ On parse_status="parsed"
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│ Navigation: Navigate to Takeoff Review Screen                   │
│   EstimatesTabContent (Client)                                  │
│     └── TakeoffReviewScreen (Server Component)                  │
│         └── TakeoffReviewScreenContent (Client)                 │
│             └── TakeoffItemList → TakeoffItemRow                │
└─────────────────────────────────────────────────────────────────┘
```

### Data Flow
```
1. User clicks "Parse with AI" on PlanUploadProgress
   ↓
2. PlanUploadProgress calls POST /api/estimates/parse
   {
     planUploadId: "uuid",
     pageIds: ["page-uuid"] // or omit for all pages
   }
   ↓
3. API route sets plan_pages.parse_status = "parsing"
   ↓
4. API route downloads image from Supabase Storage
   ↓
5. API route calls OpenAI Vision API with construction prompt
   ↓
6. API route validates response with Zod schema
   ↓
7. API route inserts records into takeoff_items table
   ↓
8. API route updates plan_pages.parse_status = "parsed"
   ↓
9. Client polls getPlanPageStatus every 2s
   ↓
10. When status="parsed", navigate to TakeoffReviewScreen
```

---

## Server Actions

### New Action: `getPlanPageStatus(planUploadId: string)`
**Purpose:** Poll parsing status for client-side progress updates
**Location:** `app/actions/estimates.ts`

**Input:**
```typescript
planUploadId: string // UUID of plan upload
```

**Output:**
```typescript
{
  success: true,
  data: {
    planUploadId: string,
    pages: Array<{
      id: string,
      pageNumber: number,
      parseStatus: "pending" | "parsing" | "parsed" | "parse_failed",
      parsedAt: string | null
    }>,
    allParsed: boolean, // true if all pages have parse_status="parsed"
    anyFailed: boolean  // true if any page has parse_status="parse_failed"
  }
} | {
  success: false,
  error: string
}
```

**Logic:**
1. Get user context (auth + company_id)
2. Verify plan upload belongs to company
3. Query all plan_pages for the planUploadId
4. Map to status objects
5. Calculate allParsed and anyFailed flags
6. Return status summary

**Revalidates:** None (read-only)

---

## API Route (Already Exists)

### `POST /api/estimates/parse`
**Location:** `app/api/estimates/parse/route.ts` (ALREADY IMPLEMENTED)

**Input:**
```typescript
{
  planUploadId: string,    // Required
  pageIds?: string[]       // Optional - parse specific pages only
}
```

**Output:**
```typescript
{
  success: true,
  data: {
    totalPages: number,
    parsed: number,
    failed: number,
    warnings?: string[]
  }
} | {
  error: string
}
```

**Existing Logic:**
1. Auth validation via `auth()` helper
2. Company access check
3. AI budget validation (monthly spend limit)
4. Check image hash for cached results (reuse if exists)
5. Download plan page image from `plan-pages` storage bucket
6. Resize image to max 2048px with Sharp
7. Call OpenAI Vision API with construction-specific prompt
8. Retry logic: 2 attempts with exponential backoff on 429/500 errors
9. Validate response with `ParseResponseSchema` (Zod)
10. Normalize items via `normalizeTakeoffItem()` (add trade, waste_factor)
11. Insert into `takeoff_items` table
12. Insert into `plan_parse_results` table
13. Insert into `ai_usage_log` table
14. Update `plan_pages.parse_status` to "parsed"

**Error Handling:**
- 401: Unauthorized (no session)
- 403: No active company
- 404: Plan upload not found
- 402: Monthly AI budget exceeded
- 500: OpenAI API failure or server error

---

## OpenAI Integration (Already Implemented)

### Prompt Design
**System Prompt:** `PARSE_SYSTEM_PROMPT` in `lib/ai/parse-prompt.ts`
- Instructs GPT-4o to act as construction takeoff expert
- Defines categories (structural, architectural, mechanical, electrical, plumbing, painting, site, general)
- Defines extraction methods (labeled, calculated, inferred)
- Confidence scoring rules (1.0 for labeled, 0.7-0.9 for calculated, 0.5-0.6 for inferred)

**User Prompt:** `PARSE_USER_PROMPT` in `lib/ai/parse-prompt.ts`
- Requests extraction of category, sub_type, quantity, unit, confidence, extraction_method, source_region

**Response Format:** JSON Object
```typescript
{
  page_type?: string,           // e.g., "foundation plan", "electrical plan"
  items: [
    {
      id: string,                // AI-generated ID
      category: TakeoffCategory,
      sub_type: string,          // e.g., "2x4 studs", "5/8\" drywall"
      quantity: number,
      unit: string,              // LF, SF, CF, CY, EA, etc.
      confidence: number,        // 0.0 to 1.0
      extraction_method: ExtractionMethod,
      source_region?: {
        x: number,               // Normalized coordinates (0-1)
        y: number,
        width: number,
        height: number
      },
      notes?: string
    }
  ],
  raw_notes?: string,
  warnings?: string[]
}
```

### Image Preprocessing
- **Resize:** Max 2048px width using Sharp (quality: 85%)
- **Format:** JPEG
- **Encoding:** Base64 for OpenAI API

### Cost Tracking
**Pricing (GPT-4o):**
- Prompt tokens: $0.0025 per 1K
- Completion tokens: $0.01 per 1K

**Storage:**
- `plan_parse_results.cost` (USD)
- `ai_usage_log.cost` (USD)
- Monthly budget check before parsing

### Caching Strategy
- Compute SHA-256 hash of plan page image
- Store in `plan_pages.image_hash_sha256`
- Before calling OpenAI, check if identical hash exists in `plan_parse_results`
- If cache hit: Reuse existing parse result, set `cached=true`, skip API call
- Saves cost and improves response time for duplicate pages

---

## UI Component Updates

### Component: `PlanUploadProgress`
**Location:** `components/estimates/PlanUploadProgress.tsx`

**Current State:**
```tsx
{planUpload.status === "ready" && (
  <div className="mt-4 flex gap-2">
    <Button size="sm" className="min-h-[44px] min-w-[44px]" disabled>
      Parse with AI
    </Button>
  </div>
)}
```

**Changes Required:**
1. Add state management
2. Add parsing trigger handler
3. Add polling logic with useEffect
4. Add loading/error states
5. Handle navigation to review screen

**New Props:**
```typescript
type PlanUploadProgressProps = {
  planUpload: PlanUpload;
  projectId: string;      // NEW - for navigation
  onNavigateToReview?: (planUploadId: string) => void; // NEW - callback
};
```

**New State:**
```typescript
const [isParsing, setIsParsing] = useState(false);
const [parseError, setParseError] = useState<string | null>(null);
const [parseStatus, setParseStatus] = useState<"pending" | "parsing" | "parsed" | "parse_failed">("pending");
```

**Parse Handler:**
```typescript
const handleParseClick = async () => {
  setIsParsing(true);
  setParseError(null);

  try {
    const response = await fetch("/api/estimates/parse", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ planUploadId: planUpload.id }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to start parsing");
    }

    // Parsing started successfully
    setParseStatus("parsing");
    toast.success("AI parsing started");
  } catch (error) {
    console.error("[PlanUploadProgress] Parse error:", error);
    setParseError(error instanceof Error ? error.message : "Failed to parse");
    toast.error(error instanceof Error ? error.message : "Failed to parse plan");
    setIsParsing(false);
  }
};
```

**Polling Logic (useEffect):**
```typescript
useEffect(() => {
  if (parseStatus !== "parsing") return;

  const pollInterval = setInterval(async () => {
    try {
      const result = await getPlanPageStatus(planUpload.id);

      if (!result.success) {
        console.error("[PlanUploadProgress] Poll error:", result.error);
        return;
      }

      if (result.data.anyFailed) {
        setParseStatus("parse_failed");
        setParseError("Parsing failed for one or more pages");
        setIsParsing(false);
        clearInterval(pollInterval);
        toast.error("AI parsing failed");
      } else if (result.data.allParsed) {
        setParseStatus("parsed");
        setIsParsing(false);
        clearInterval(pollInterval);
        toast.success("AI parsing complete");

        // Navigate to review screen
        if (onNavigateToReview) {
          onNavigateToReview(planUpload.id);
        }
      }
    } catch (error) {
      console.error("[PlanUploadProgress] Poll error:", error);
    }
  }, 2000); // Poll every 2 seconds

  return () => clearInterval(pollInterval);
}, [parseStatus, planUpload.id, onNavigateToReview]);
```

**Button Rendering:**
```tsx
{planUpload.status === "ready" && (
  <div className="mt-4 flex gap-2">
    <Button
      size="sm"
      onClick={handleParseClick}
      disabled={isParsing || parseStatus === "parsing"}
      className="min-h-[44px] min-w-[44px] active:scale-95"
    >
      {isParsing || parseStatus === "parsing" ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin mr-2" />
          Parsing...
        </>
      ) : (
        "Parse with AI"
      )}
    </Button>
  </div>
)}

{parseError && (
  <div className="mt-2 p-2 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/40 rounded text-xs text-red-700 dark:text-red-300">
    {parseError}
  </div>
)}
```

---

### Component: `EstimatesTabContent`
**Location:** `components/estimates/EstimatesTabContent.tsx`

**Changes Required:**
1. Add navigation to review screen via state management
2. Pass `projectId` and navigation callback to `PlanUploadProgress`

**New State:**
```typescript
const [selectedPlanForReview, setSelectedPlanForReview] = useState<string | null>(null);
```

**Updated Render:**
```tsx
{subView === "upload" && !selectedPlanForReview && (
  <PlanUploadPanel
    projectId={projectId}
    planUploads={planUploads}
    userRole={userRole}
    onNavigateToReview={setSelectedPlanForReview}
  />
)}

{selectedPlanForReview && (
  <div className="space-y-4">
    <Button
      variant="ghost"
      onClick={() => setSelectedPlanForReview(null)}
      className="min-h-[44px] active:scale-95"
    >
      ← Back to Uploads
    </Button>
    <TakeoffReviewScreen
      planUploadId={selectedPlanForReview}
      projectId={projectId}
    />
  </div>
)}
```

**Updated PlanUploadPanel Props:**
```typescript
type PlanUploadPanelProps = {
  projectId: string;
  planUploads: PlanUpload[];
  userRole: UserRole | null;
  onNavigateToReview?: (planUploadId: string) => void; // NEW
};
```

---

### Component: `PlanUploadPanel`
**Location:** `components/estimates/PlanUploadPanel.tsx`

**Changes Required:**
1. Accept `onNavigateToReview` prop
2. Pass to each `PlanUploadProgress` component

**Updated Props:**
```typescript
type PlanUploadPanelProps = {
  projectId: string;
  planUploads: PlanUpload[];
  userRole: UserRole | null;
  onNavigateToReview?: (planUploadId: string) => void; // NEW
};
```

**Updated Render:**
```tsx
{planUploads.map((upload) => (
  <PlanUploadProgress
    key={upload.id}
    planUpload={upload}
    projectId={projectId}
    onNavigateToReview={onNavigateToReview}
  />
))}
```

---

## Database Operations

### Status Transitions
**plan_pages.parse_status:**
```
"pending" → (user clicks "Parse with AI") → API sets "parsing"
"parsing" → (OpenAI success) → API sets "parsed"
"parsing" → (OpenAI failure) → API sets "parse_failed"
```

### Takeoff Items Insertion
**Performed by:** `/api/estimates/parse/route.ts` (already implemented)

**Process:**
1. OpenAI returns array of `TakeoffItemAI` objects
2. Normalize each item via `normalizeTakeoffItem()`:
   - Infer `trade` from category + sub_type
   - Calculate `waste_factor` based on trade
   - Calculate `adjusted_quantity = quantity * (1 + waste_factor)`
   - Set `needs_review = true` if confidence < 0.7
   - Set `review_status = "pending"`
3. Bulk insert into `takeoff_items` table with company_id, plan_page_id, plan_upload_id

**Schema:**
```sql
INSERT INTO takeoff_items (
  company_id,
  plan_page_id,
  plan_upload_id,
  ai_item_id,
  category,
  trade,
  sub_type,
  quantity,
  unit,
  waste_factor,
  adjusted_quantity,
  extraction_method,
  confidence,
  source_region,
  needs_review,
  review_status,
  notes
) VALUES (...);
```

### Parse Results Logging
**Performed by:** `/api/estimates/parse/route.ts` (already implemented)

**Tables Updated:**
1. `plan_parse_results` - Raw AI response, token counts, cost
2. `ai_usage_log` - Usage tracking for billing/budgeting
3. `plan_pages` - Update parse_status, parsed_at, image_hash_sha256

---

## Error Handling

### Scenarios

| Error Type | HTTP Status | User Message | Action |
|------------|-------------|--------------|--------|
| Unauthorized | 401 | "Please sign in" | Redirect to login |
| No active company | 403 | "No active company found" | Contact support |
| Plan not found | 404 | "Plan upload not found" | Refresh page |
| Budget exceeded | 402 | "Monthly AI budget exceeded. Contact admin to increase limit." | Disable parse button |
| OpenAI API error | 500 | "AI service temporarily unavailable. Retry in a moment." | Show retry button |
| Network timeout | 500 | "Request timed out. Please try again." | Show retry button |
| Validation error | 500 | "Failed to parse AI response. Please try again." | Show retry button |

### Retry Logic

**Client-side (Button Retry):**
```tsx
{parseError && (
  <Button
    size="sm"
    variant="outline"
    onClick={() => {
      setParseError(null);
      handleParseClick();
    }}
    className="mt-2 min-h-[44px]"
  >
    Retry Parsing
  </Button>
)}
```

**Server-side (API Route - Already Implemented):**
- Retry up to 2 times on OpenAI API errors (429, 500)
- Exponential backoff: 1 second, 2 seconds
- Fail immediately on other errors (400, 401, etc.)

### Timeout Handling

**Client-side Polling:**
```typescript
const MAX_POLLING_DURATION = 120000; // 120 seconds
const pollStartTime = useRef<number>(Date.now());

useEffect(() => {
  if (parseStatus !== "parsing") return;

  const pollInterval = setInterval(async () => {
    const elapsed = Date.now() - pollStartTime.current;

    if (elapsed > MAX_POLLING_DURATION) {
      toast.warning("Parsing is taking longer than expected. Check back shortly.");
      // Continue polling but warn user
    }

    // ... rest of polling logic
  }, 2000);

  return () => clearInterval(pollInterval);
}, [parseStatus]);
```

---

## Mobile Considerations

### Touch Targets
- All buttons: `min-h-[44px] min-w-[44px]`
- Active states: `active:scale-95` or `active:bg-*`

### Polling on Mobile
- Uses standard `setInterval()` - works on all mobile browsers
- Handles backgrounding gracefully (interval pauses when tab inactive)
- Resumes polling when user returns to tab

### Network Handling
- Polling continues during intermittent connectivity
- Failed polls logged but don't stop polling
- User sees last successful status until next poll succeeds

### Loading States
- Spinner icon from Lucide: `<Loader2 className="w-4 h-4 animate-spin" />`
- Status text: "Parsing..." with loading animation
- Disabled button state during parsing

---

## Security Considerations

### Server-side Only
- OpenAI API key NEVER exposed to client
- All parsing logic in `/api/estimates/parse/route.ts` (API route)
- Auth validation on every request via `auth()` helper

### Company Isolation
- All queries filtered by `company_id`
- RLS policies enforce access control at database level
- Plan upload ownership verified before parsing

### Budget Protection
- Check monthly AI spend before parsing
- Reject if `current_spend >= ai_monthly_budget`
- Return 402 status with budget details

### Input Validation
- Validate `planUploadId` is UUID
- Verify plan upload exists and belongs to user's company
- Validate file exists in storage before parsing

---

## Performance Optimization

### Caching (Already Implemented)
- SHA-256 hash of plan page image
- Check `plan_parse_results` for matching hash
- Reuse existing result if found (set `cached=true`)
- Saves API cost and improves latency

### Image Optimization (Already Implemented)
- Resize to max 2048px width with Sharp
- JPEG compression at 85% quality
- Reduces token usage and API cost

### Parallel Processing
- API route can handle multiple pages in single request
- `pageIds` parameter allows selective parsing
- Future enhancement: Parse pages in parallel (not in this phase)

---

## Testing Checklist

### Functional Tests
- [ ] "Parse with AI" button enabled when status="ready"
- [ ] Button disabled when status="uploading" or "processing"
- [ ] Click triggers POST /api/estimates/parse
- [ ] Polling starts after successful parse request
- [ ] Polling updates status every 2 seconds
- [ ] Navigation to review screen on completion
- [ ] Error message displayed on failure
- [ ] Retry button works after error

### Integration Tests
- [ ] Full flow: Upload → Ready → Parse → Review
- [ ] Parse creates records in takeoff_items
- [ ] Parse creates records in plan_parse_results
- [ ] Parse creates records in ai_usage_log
- [ ] parse_status updates correctly (pending → parsing → parsed)
- [ ] Confidence < 0.7 sets needs_review=true

### Error Scenarios
- [ ] Budget exceeded returns 402 and blocks parsing
- [ ] Invalid planUploadId returns 404
- [ ] Unauthorized request returns 401
- [ ] OpenAI API failure retries 2x then fails
- [ ] Network timeout handled gracefully

### Mobile Tests
- [ ] Button touch target 44px minimum
- [ ] Active state visible on tap
- [ ] Polling works on mobile browsers
- [ ] Loading spinner renders correctly
- [ ] Toast notifications appear properly

---

## Implementation Notes

### Existing Infrastructure
**Already Implemented (NO CHANGES NEEDED):**
- `/api/estimates/parse/route.ts` - Complete parsing logic
- `lib/ai/parse-prompt.ts` - OpenAI prompts and schemas
- `lib/ai/normalize-takeoff.ts` - Trade inference and waste factors
- `TakeoffReviewScreen` - Review UI for parsed items
- `TakeoffItemList`, `TakeoffItemRow` - Item display components
- Database schema - All tables, columns, enums exist

**To Be Implemented (This Spec):**
- `getPlanPageStatus()` Server Action - Polling endpoint
- `PlanUploadProgress` - Enable button, add polling, handle navigation
- `EstimatesTabContent` - Add review screen navigation state
- `PlanUploadPanel` - Pass navigation callback to children

### Libraries Used
- **OpenAI SDK:** `openai` npm package (already installed)
- **Image Processing:** `sharp` npm package (already installed)
- **Validation:** `zod` (already installed)
- **Icons:** `lucide-react` (Loader2 icon)
- **Notifications:** `sonner` toast library (already installed)

---

**Status:** PENDING APPROVAL
**Approval Required:** [yes] Do you approve to proceed to task planning phase?
