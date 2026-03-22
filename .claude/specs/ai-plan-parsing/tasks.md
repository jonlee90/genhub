# AI Plan Parsing - Implementation Tasks

## References
- Requirements: `.claude/specs/ai-plan-parsing/requirements.md`
- Design: `.claude/specs/ai-plan-parsing/design.md`

---

## Phase 1: Backend Server Action

### Task 1.1: Create getPlanPageStatus Server Action
- **Agent:** backend-engineer
- **Skill:** `skills/backend/server-action.md`
- **Output:** Modified `app/actions/estimates.ts`
- **Requirements:**
  - Create `getPlanPageStatus(planUploadId: string)` function
  - Query all plan_pages for the given planUploadId
  - Calculate `allParsed` flag (all pages have parse_status="parsed")
  - Calculate `anyFailed` flag (any page has parse_status="parse_failed")
  - Return status summary with page details
  - Include proper error handling and company_id isolation
  - Follow existing Server Action patterns in the file
- **Acceptance:**
  - [ ] Function signature matches design spec
  - [ ] Auth check via `getUserContext()`
  - [ ] Company isolation enforced (plan_upload.company_id check)
  - [ ] Returns `{ success: true, data }` or `{ success: false, error }`
  - [ ] TypeScript types defined
  - [ ] No linting errors
  - [ ] Follows existing code style in `estimates.ts`

**Implementation Details:**
```typescript
export async function getPlanPageStatus(planUploadId: string) {
  try {
    const context = await getUserContext();
    if ("error" in context) {
      return { success: false, error: context.error };
    }

    // Verify plan upload belongs to company
    const { data: planUpload, error: uploadError } = await context.supabase
      .from("plan_uploads")
      .select("id, company_id")
      .eq("id", planUploadId)
      .eq("company_id", context.companyId)
      .single();

    if (uploadError || !planUpload) {
      return { success: false, error: "Plan upload not found" };
    }

    // Get all pages for this upload
    const { data: pages, error: pagesError } = await context.supabase
      .from("plan_pages")
      .select("id, page_number, parse_status, parsed_at")
      .eq("plan_upload_id", planUploadId)
      .eq("company_id", context.companyId)
      .order("page_number", { ascending: true });

    if (pagesError) throw pagesError;

    const pageStatuses = (pages || []).map((page) => ({
      id: page.id,
      pageNumber: page.page_number,
      parseStatus: page.parse_status,
      parsedAt: page.parsed_at,
    }));

    const allParsed =
      pages && pages.length > 0
        ? pages.every((p) => p.parse_status === "parsed")
        : false;

    const anyFailed =
      pages && pages.length > 0
        ? pages.some((p) => p.parse_status === "parse_failed")
        : false;

    return {
      success: true,
      data: {
        planUploadId,
        pages: pageStatuses,
        allParsed,
        anyFailed,
      },
    };
  } catch (error) {
    console.error("[getPlanPageStatus] Error:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to get parse status",
    };
  }
}
```

---

## Phase 2: Component Updates

### Task 2.1: Update PlanUploadProgress component
- **Agent:** frontend-engineer
- **Skill:** `skills/frontend/component-patterns.md`
- **Output:** Modified `components/estimates/PlanUploadProgress.tsx`
- **Dependencies:** Task 1.1 (Server Action must exist)
- **Requirements:**
  - Add new props: `projectId`, `onNavigateToReview`
  - Add state: `isParsing`, `parseError`, `parseStatus`
  - Implement `handleParseClick` to call `/api/estimates/parse`
  - Implement polling logic with `useEffect` + `setInterval` (2 second interval)
  - Call `getPlanPageStatus()` during polling
  - Navigate to review screen when `allParsed=true`
  - Update button to be enabled (remove `disabled` prop)
  - Add loading state with `Loader2` icon
  - Add error display with retry button
  - Follow mobile patterns (44px targets, active states)
- **Acceptance:**
  - [ ] Button enabled when `planUpload.status === "ready"`
  - [ ] Button shows "Parsing..." with spinner when active
  - [ ] Polling starts after successful parse API call
  - [ ] Polling interval is 2 seconds
  - [ ] Polling stops when `allParsed=true` or `anyFailed=true`
  - [ ] Calls `onNavigateToReview()` callback when complete
  - [ ] Error message displayed in red alert box
  - [ ] Retry button appears on error
  - [ ] All touch targets minimum 44px
  - [ ] Active states on buttons (`active:scale-95`)
  - [ ] No console errors
  - [ ] Component compiles without TypeScript errors

**Implementation Details:**
```typescript
"use client";

import { useState, useEffect, useRef } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Check from "lucide-react/icons/check";
import X from "lucide-react/icons/x";
import Loader2 from "lucide-react/icons/loader-2";
import FileText from "lucide-react/icons/file-text";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { getPlanPageStatus } from "@/app/actions/estimates";
import type { PlanUpload } from "@/types/db/tables/estimates";

type PlanUploadProgressProps = {
  planUpload: PlanUpload;
  projectId: string;
  onNavigateToReview?: (planUploadId: string) => void;
};

export function PlanUploadProgress({
  planUpload,
  projectId,
  onNavigateToReview,
}: PlanUploadProgressProps) {
  const [isParsing, setIsParsing] = useState(false);
  const [parseError, setParseError] = useState<string | null>(null);
  const [parseStatus, setParseStatus] = useState<
    "pending" | "parsing" | "parsed" | "parse_failed"
  >("pending");
  const pollStartTime = useRef<number>(Date.now());

  const getStatusDisplay = () => {
    // ... existing status display logic
  };

  const handleParseClick = async () => {
    setIsParsing(true);
    setParseError(null);
    pollStartTime.current = Date.now();

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

      setParseStatus("parsing");
      toast.success("AI parsing started");
    } catch (error) {
      console.error("[PlanUploadProgress] Parse error:", error);
      setParseError(
        error instanceof Error ? error.message : "Failed to parse plan",
      );
      toast.error(
        error instanceof Error ? error.message : "Failed to parse plan",
      );
      setIsParsing(false);
    }
  };

  // Polling logic
  useEffect(() => {
    if (parseStatus !== "parsing") return;

    const pollInterval = setInterval(async () => {
      const elapsed = Date.now() - pollStartTime.current;

      if (elapsed > 120000) {
        toast.warning(
          "Parsing is taking longer than expected. Check back shortly.",
        );
      }

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

          if (onNavigateToReview) {
            onNavigateToReview(planUpload.id);
          }
        }
      } catch (error) {
        console.error("[PlanUploadProgress] Poll error:", error);
      }
    }, 2000);

    return () => clearInterval(pollInterval);
  }, [parseStatus, planUpload.id, onNavigateToReview]);

  const statusDisplay = getStatusDisplay();

  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
      {/* ... existing file info and status badge ... */}

      {/* Action buttons */}
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

      {/* Error display */}
      {parseError && (
        <div className="mt-2 p-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/40 rounded-lg">
          <p className="text-xs text-red-700 dark:text-red-300 mb-2">
            {parseError}
          </p>
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              setParseError(null);
              handleParseClick();
            }}
            className="min-h-[44px] active:scale-95"
          >
            Retry Parsing
          </Button>
        </div>
      )}

      {/* ... existing failed retry button ... */}
    </div>
  );
}
```

---

### Task 2.2: Update PlanUploadPanel component
- **Agent:** frontend-engineer
- **Skill:** `skills/frontend/component-patterns.md`
- **Output:** Modified `components/estimates/PlanUploadPanel.tsx`
- **Dependencies:** Task 2.1
- **Requirements:**
  - Add new prop: `onNavigateToReview`
  - Pass `projectId` to each `PlanUploadProgress` component
  - Pass `onNavigateToReview` callback to each `PlanUploadProgress` component
  - Update TypeScript prop types
- **Acceptance:**
  - [ ] New prop `onNavigateToReview` added to component interface
  - [ ] Both `projectId` and `onNavigateToReview` passed to child components
  - [ ] TypeScript types updated correctly
  - [ ] No breaking changes to existing functionality
  - [ ] Component compiles without errors

**Implementation Details:**
```typescript
type PlanUploadPanelProps = {
  projectId: string;
  planUploads: PlanUpload[];
  userRole: UserRole | null;
  onNavigateToReview?: (planUploadId: string) => void; // NEW
};

export function PlanUploadPanel({
  projectId,
  planUploads,
  userRole,
  onNavigateToReview, // NEW
}: PlanUploadPanelProps) {
  // ... existing upload logic ...

  return (
    <div className="space-y-4">
      {/* ... existing upload zone ... */}

      {/* Plan uploads list */}
      {planUploads.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
            Plan Uploads
          </h3>

          {planUploads.map((upload) => (
            <PlanUploadProgress
              key={upload.id}
              planUpload={upload}
              projectId={projectId}
              onNavigateToReview={onNavigateToReview}
            />
          ))}
        </div>
      )}
    </div>
  );
}
```

---

### Task 2.3: Update EstimatesTabContent component
- **Agent:** frontend-engineer
- **Skill:** `skills/frontend/component-patterns.md`
- **Output:** Modified `components/estimates/EstimatesTabContent.tsx`
- **Dependencies:** Task 2.2
- **Requirements:**
  - Add state: `selectedPlanForReview` (string | null)
  - Pass `onNavigateToReview` callback to `PlanUploadPanel`
  - Conditionally render `TakeoffReviewScreen` when plan selected
  - Add "Back to Uploads" button when viewing review screen
  - Update rendering logic to show upload panel OR review screen
- **Acceptance:**
  - [ ] State management for selected plan ID
  - [ ] Callback passed to `PlanUploadPanel`
  - [ ] Review screen rendered when `selectedPlanForReview` is set
  - [ ] Back button navigates back to upload list
  - [ ] TakeoffReviewScreen receives `planUploadId` and `projectId`
  - [ ] Component compiles without TypeScript errors
  - [ ] Navigation works smoothly without page refresh

**Implementation Details:**
```typescript
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import ChevronLeft from "lucide-react/icons/chevron-left";
import { EstimatesErrorBoundary } from "@/components/estimates/EstimatesErrorBoundary";
import { PlanUploadPanel } from "@/components/estimates/PlanUploadPanel";
import { TakeoffReviewScreen } from "@/components/estimates/TakeoffReviewScreen";
import type { PlanUpload, Estimate } from "@/types/db/tables/estimates";
import type { UserRole } from "@/types/db/enums";

type SubView = "upload" | "review" | "costing" | "summary";

type EstimatesTabContentProps = {
  planUploads: PlanUpload[];
  estimates: Estimate[];
  projectId: string;
  userRole: UserRole | null;
};

export function EstimatesTabContent({
  planUploads,
  estimates,
  projectId,
  userRole,
}: EstimatesTabContentProps) {
  const [subView, setSubView] = useState<SubView>("upload");
  const [selectedPlan, setSelectedPlan] = useState<PlanUpload | null>(null);
  const [selectedEstimate, setSelectedEstimate] = useState<Estimate | null>(
    null,
  );
  const [selectedPlanForReview, setSelectedPlanForReview] = useState<
    string | null
  >(null);

  return (
    <EstimatesErrorBoundary>
      <div className="space-y-4 pb-[env(safe-area-inset-bottom)]">
        {/* Upload Panel - Show when no plan selected for review */}
        {subView === "upload" && !selectedPlanForReview && (
          <PlanUploadPanel
            projectId={projectId}
            planUploads={planUploads}
            userRole={userRole}
            onNavigateToReview={setSelectedPlanForReview}
          />
        )}

        {/* Review Screen - Show when plan selected */}
        {selectedPlanForReview && (
          <div className="space-y-4">
            <Button
              variant="ghost"
              onClick={() => setSelectedPlanForReview(null)}
              className="min-h-[44px] active:scale-95 gap-2"
            >
              <ChevronLeft className="w-4 h-4" />
              Back to Uploads
            </Button>
            <TakeoffReviewScreen
              planUploadId={selectedPlanForReview}
              projectId={projectId}
            />
          </div>
        )}

        {/* Future sub-views will be added here:
         * - subView === 'costing' → <CostEditor>
         * - subView === 'summary' → <EstimateSummary>
         */}
      </div>
    </EstimatesErrorBoundary>
  );
}
```

---

## Phase 3: Integration & Testing

### Task 3.1: Integration testing
- **Agent:** code-reviewer
- **Output:** Test report in this task comment
- **Dependencies:** Tasks 2.1, 2.2, 2.3
- **Requirements:**
  - Verify full user flow: Upload → Ready → Parse → Review
  - Test polling mechanism (observe network tab for 2-second intervals)
  - Test navigation to review screen on completion
  - Test error handling (invalid plan ID, API failure)
  - Test retry button functionality
  - Test mobile responsiveness (375px width)
  - Verify all touch targets are 44px minimum
  - Check console for errors
  - Verify toast notifications appear correctly
  - Test with dev tools throttling (slow 3G) to simulate network delay
- **Acceptance:**
  - [ ] "Parse with AI" button appears when plan status="ready"
  - [ ] Button triggers API call to `/api/estimates/parse`
  - [ ] Polling starts and queries every 2 seconds
  - [ ] Review screen appears when parsing completes
  - [ ] Back button returns to upload list
  - [ ] Error states render correctly
  - [ ] Retry button works after failure
  - [ ] No console errors during flow
  - [ ] Mobile layout correct at 375px
  - [ ] All buttons have 44px touch targets
  - [ ] Active states visible on tap

**Test Scenarios:**
1. **Happy Path:**
   - Upload plan → Wait for "ready" status → Click "Parse with AI"
   - Observe "Parsing..." state with spinner
   - Wait for completion (or simulate by manually updating DB)
   - Verify navigation to TakeoffReviewScreen
   - Verify takeoff items appear in review UI

2. **Error Handling:**
   - Trigger budget exceeded error (set company.ai_monthly_budget=0)
   - Verify 402 error message displays
   - Test retry button

3. **Polling:**
   - Start parsing
   - Open Network tab in DevTools
   - Verify `getPlanPageStatus` calls every 2 seconds
   - Verify polling stops when parsing completes

4. **Mobile:**
   - Set viewport to 375px × 667px
   - Verify all buttons are tappable (44px)
   - Verify text is readable
   - Verify active states work on tap

---

### Task 3.2: Documentation sync
- **Agent:** backend-engineer OR frontend-engineer
- **Output:** Updated documentation files
- **Dependencies:** Task 3.1 (testing complete)
- **Requirements:**
  - Update `.claude/docs/indexes/actions.md` with `getPlanPageStatus`
  - Update `.claude/docs/indexes/components.md` with modified components
  - Update `.claude/docs/architecture-index.md` if needed
  - Add inline code comments for complex logic (polling, navigation)
- **Acceptance:**
  - [ ] `actions.md` lists `getPlanPageStatus` with signature and purpose
  - [ ] `components.md` updated with `PlanUploadProgress` changes
  - [ ] Inline comments added to polling logic
  - [ ] No broken links in documentation

---

## Execution Order

```
Sequential Dependencies:
1.1 → 2.1 → 2.2 → 2.3 → 3.1 → 3.2

Parallelizable:
- None (each task depends on the previous)

Critical Path:
1.1 (Server Action) MUST complete before 2.1 (component using it)
2.1, 2.2, 2.3 MUST complete before 3.1 (integration testing)
```

---

## Estimated Effort
- **Backend (Phase 1):** 1 task (~30 min)
- **Frontend (Phase 2):** 3 tasks (~2 hours)
- **Testing (Phase 3):** 2 tasks (~1 hour)
- **Total:** 6 tasks (~3.5 hours)

---

## Risk Mitigation

### Risk: Polling doesn't stop
**Mitigation:** Use cleanup function in `useEffect` to clear interval on unmount

### Risk: Navigation doesn't work
**Mitigation:** Test callback prop thoroughly in Task 3.1

### Risk: Parse API fails silently
**Mitigation:** Add comprehensive error handling with user-facing messages

### Risk: Mobile polling drains battery
**Mitigation:** Polling stops automatically when parsing completes or fails (not infinite)

---

## Post-Implementation Checklist

- [ ] All tasks completed and marked as done
- [ ] Integration test report shows all scenarios passing
- [ ] No console errors in production build
- [ ] Mobile testing completed on actual device (or Chrome DevTools)
- [ ] Documentation updated
- [ ] Code reviewed by second engineer
- [ ] Deployed to staging environment
- [ ] QA approval obtained

---

**Status:** READY FOR IMPLEMENTATION

**Orchestration Command:**
```bash
# Execute tasks sequentially
/kc:impl ai-plan-parsing-1.1  # Backend: Server Action
/kc:impl ai-plan-parsing-2.1  # Frontend: PlanUploadProgress
/kc:impl ai-plan-parsing-2.2  # Frontend: PlanUploadPanel
/kc:impl ai-plan-parsing-2.3  # Frontend: EstimatesTabContent
/kc:impl ai-plan-parsing-3.1  # Testing: Integration tests
/kc:impl ai-plan-parsing-3.2  # Docs: Sync documentation
```

**Or use full orchestrator:**
```bash
/kc:orchestrate ai-plan-parsing
```
