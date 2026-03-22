# AI Plan Parsing - Requirements

## Overview
Enable AI-powered extraction of construction takeoff quantities from uploaded plan images using OpenAI Vision API (GPT-4o). This feature automates the manual process of counting materials from construction plans, saving estimators hours of manual review.

## Personas
- **Primary**: PM (Project Manager) - Needs to quickly extract material quantities from plan documents to create estimates
- **Secondary**: GC (General Contractor) - Reviews AI-extracted quantities for accuracy before submitting bids
- **Secondary**: Foreman - Uses parsed takeoff data to order materials for job sites

---

## User Stories

### US-1: Parse Plan with AI
**As a** PM,
**I want** to click "Parse with AI" on an uploaded plan,
**So that** material quantities are automatically extracted without manual counting.

**Acceptance Criteria (EARS):**
- WHEN user clicks "Parse with AI" button on a plan with status "ready" THE SYSTEM SHALL initiate AI parsing within 500ms
- WHEN AI parsing starts THE SYSTEM SHALL update plan_pages.parse_status to "parsing" within 1 second
- WHEN AI parsing completes successfully THE SYSTEM SHALL update plan_pages.parse_status to "parsed" and create records in takeoff_items
- IF parsing fails THEN THE SYSTEM SHALL update plan_pages.parse_status to "parse_failed" and display error message to user
- WHILE parsing is in progress THE SYSTEM SHALL display a visual loading indicator on the plan card

**Priority:** Critical

---

### US-2: View Parsing Progress
**As a** PM,
**I want** to see real-time progress while AI parses my plan,
**So that** I know the system is working and can estimate completion time.

**Acceptance Criteria (EARS):**
- WHEN parsing starts THE SYSTEM SHALL show a loading spinner and "Parsing..." status text within 100ms
- WHILE parse_status is "parsing" THE SYSTEM SHALL poll the server every 2 seconds to check status
- WHEN parsing completes THE SYSTEM SHALL automatically transition to the takeoff review screen within 1 second
- IF parsing exceeds 120 seconds THEN THE SYSTEM SHALL display a timeout warning but continue polling

**Priority:** High

---

### US-3: Review Extracted Takeoff Items
**As a** PM,
**I want** to review AI-extracted takeoff items immediately after parsing,
**So that** I can verify quantities before creating an estimate.

**Acceptance Criteria (EARS):**
- WHEN parsing completes successfully THE SYSTEM SHALL navigate to TakeoffReviewScreen showing all extracted items
- WHEN user views takeoff items THE SYSTEM SHALL display quantity, unit, category, trade, and confidence score for each item
- WHEN items have confidence < 0.7 THE SYSTEM SHALL mark them with needs_review=true and highlight visually
- IF no items were extracted THEN THE SYSTEM SHALL display "No items found" message and option to add manual items

**Priority:** Critical

---

### US-4: Handle Parsing Errors
**As a** PM,
**I want** clear error messages when AI parsing fails,
**So that** I can understand what went wrong and retry if appropriate.

**Acceptance Criteria (EARS):**
- IF OpenAI API returns error THEN THE SYSTEM SHALL log error details and display user-friendly message
- IF network timeout occurs THEN THE SYSTEM SHALL retry up to 2 times with exponential backoff
- IF API quota exceeded THEN THE SYSTEM SHALL display "Daily AI usage limit reached" message
- WHEN parsing fails THE SYSTEM SHALL allow user to click "Retry Parsing" button to attempt again

**Priority:** High

---

### US-5: Track AI Usage
**As a** GC,
**I want** AI parsing costs tracked automatically,
**So that** I can monitor AI spending and budget accordingly.

**Acceptance Criteria (EARS):**
- WHEN AI parsing completes THE SYSTEM SHALL create record in ai_usage_log with token counts and cost
- WHEN parse results are stored THE SYSTEM SHALL include model name, prompt_tokens, completion_tokens, and calculated cost
- IF cached result exists for identical image THEN THE SYSTEM SHALL reuse cached result and set cached=true

**Priority:** Medium

---

## Out of Scope
- Multi-page PDF parsing (only single pages in this phase)
- OCR text extraction from plans (GPT-4o vision handles this)
- Custom AI prompt editing by users
- Batch parsing of multiple plans at once
- Manual annotation/markup on plan images (future enhancement)

## Dependencies
- OpenAI API key configured in environment (`OPENAI_API_KEY`)
- Existing upload flow (`app/api/estimates/upload/route.ts`)
- Existing database tables: `plan_uploads`, `plan_pages`, `takeoff_items`, `plan_parse_results`, `ai_usage_log`
- Existing components: `PlanUploadProgress`, `TakeoffReviewScreen`, `TakeoffItemList`

## Non-Functional Requirements
- **Performance**: AI parsing should complete within 60 seconds for typical construction plan
- **Cost**: Track and log all OpenAI API costs for billing/budgeting
- **Reliability**: Implement retry logic with exponential backoff for transient API failures
- **Security**: Never expose OpenAI API key to client; all API calls from server
- **Mobile**: Polling and status updates must work on mobile devices with intermittent connectivity

---

**Status:** PENDING APPROVAL
**Approval Required:** [yes] Do you approve to proceed to design phase?
