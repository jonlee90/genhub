# EST-P4-002: Voice Input for Field Estimates

**Parent Task:** `EST-P4-002` in `tasks-phase3-phase4.md`
**Priority:** P3 - Advanced
**Total Effort:** ~2.5 days
**Dependencies:** None (uses Web Speech API — no upstream task deps)

---

## Sub-Task Overview

| ID | Name | Agent | Effort | Depends On |
|----|------|-------|--------|------------|
| P4-002-A | Speech parser utility | frontend-engineer | 0.5d | — |
| P4-002-B | VoiceInputButton component | frontend-engineer | 1.0d | P4-002-A |
| P4-002-C | VoiceTranscription component | frontend-engineer | 0.5d | P4-002-A |
| P4-002-D | CostEditor + PlanUploadPanel wire-up | frontend-engineer | 0.5d | P4-002-B, P4-002-C |

---

## P4-002-A: Speech Parser Utility

**Agent:** frontend-engineer
**Effort:** 0.5 days

**Files:**
- `lib/voice/speech-parser.ts` (new)

**Task:**
Pure utility for parsing voice transcriptions into structured estimate data. No React, no side effects.

```typescript
export interface ParsedVoiceInput {
  quantity?: number
  unit?: 'lf' | 'sf' | 'cy' | 'each' | 'dozen' | 'lb' | 'ton'
  description?: string
  trade?: string
  isNote: boolean
  rawText: string
}

export function parseVoiceInput(transcript: string): ParsedVoiceInput
```

Parsing rules (regex-based):
- "Twenty linear feet of two-by-four" → `{ quantity: 20, unit: 'lf', description: '2x4 lumber' }`
- "Forty-five square feet of drywall" → `{ quantity: 45, unit: 'sf', description: 'drywall' }`
- "Note: verify ceiling height" → `{ isNote: true, description: 'verify ceiling height' }`

Supported patterns:
- `{number|word-number} {unit} of {material}` → quantity input
- `Note: {anything}` or `Note, {anything}` → voice note
- Fallback: `{ isNote: true, description: rawText }` if no pattern matches

Number words: zero–twenty, thirty, forty, fifty, sixty, seventy, eighty, ninety, hundred, thousand.
Unit aliases: "linear feet" / "lineal feet" → `lf`, "square feet" / "square foot" → `sf`, "cubic yards" → `cy`, etc.

**Acceptance Criteria:**
- [ ] "Twenty linear feet of two-by-four" parses correctly
- [ ] "Note: check drawing D-3" returns `isNote: true`
- [ ] Unrecognized input falls back to note gracefully
- [ ] All unit aliases covered (at least 8 unit types)
- [ ] Pure function — no side effects, fully unit-testable

---

## P4-002-B: VoiceInputButton Component

**Agent:** frontend-engineer
**Effort:** 1.0 days
**Depends on:** P4-002-A

**Files:**
- `components/estimates/VoiceInputButton.tsx` (new)

**Task:**
Microphone button with recording state and waveform canvas visualization.

```typescript
interface VoiceInputButtonProps {
  onResult: (parsed: ParsedVoiceInput, rawText: string) => void
  onError?: (error: string) => void
  language?: 'en-US' | 'es-US'
  size?: 'sm' | 'md' | 'lg'
}
```

States: `idle` → `requesting-permission` → `recording` → `processing` → `idle`

Implementation:
```typescript
// Web Speech API
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
const recognition = new SpeechRecognition()
recognition.lang = language
recognition.continuous = false
recognition.interimResults = false
```

Waveform animation (while recording):
- `<canvas>` element below button
- Web Audio API: `AudioContext.createAnalyser()`, connect to microphone stream
- `requestAnimationFrame` loop drawing frequency bars
- Stop animation on recording end

Button visual states:
- `idle`: Mic icon, neutral bg
- `recording`: MicOff icon, red bg, pulse ring animation
- `processing`: Loader icon, animate-spin

Browser support fallback:
- If `SpeechRecognition` undefined: show disabled state with tooltip "Voice input requires Chrome or Edge"

**Skills Applied:**
- `bundle-barrel-imports` — `import Mic from 'lucide-react/icons/mic'`
- `async-defer-await` — defer processing until speech result event
- `rendering-conditional-render` — ternary for all button states

**Mobile Checks:**
- [ ] Button is `min-h-[44px] min-w-[44px]`
- [ ] `active:scale-95` on tap
- [ ] `dark:` variants on all button states
- [ ] Touch-hold UX considered (not required but documented)

**Acceptance Criteria:**
- [ ] Microphone permission requested on first use
- [ ] Waveform canvas animates during recording
- [ ] `onResult` fires with parsed result after speech ends
- [ ] Gracefully disabled in Firefox (no crash)
- [ ] Build passes with no TS errors

---

## P4-002-C: VoiceTranscription Component

**Agent:** frontend-engineer
**Effort:** 0.5 days
**Depends on:** P4-002-A

**Files:**
- `components/estimates/VoiceTranscription.tsx` (new)

**Task:**
Inline edit-and-confirm UI shown after transcription completes.

```typescript
interface VoiceTranscriptionProps {
  rawText: string
  parsed: ParsedVoiceInput
  onConfirm: (final: ParsedVoiceInput) => void
  onRetry: () => void
  onCancel: () => void
}
```

Layout:
- Shows raw transcription text (editable `<textarea>`)
- Parsed result preview: "20 LF of 2x4 lumber" (read-only badge)
- Re-parses on textarea change (debounced 300ms)
- Three buttons: "Confirm", "Re-record", "Cancel"
- If `isNote`: shows "Will save as note: ..." and confirm saves to notes

**Mobile Checks:**
- [ ] All three buttons `min-h-[44px]`
- [ ] `active:scale-95` on buttons
- [ ] Textarea is mobile-friendly (no zoom on focus — `font-size: 16px`)
- [ ] `dark:` variants

**Acceptance Criteria:**
- [ ] Editing transcript re-runs `parseVoiceInput` and updates parsed preview
- [ ] "Confirm" fires `onConfirm` with final parsed result
- [ ] "Re-record" fires `onRetry` (parent re-activates recording)
- [ ] Parsed preview updates within 300ms of typing

---

## P4-002-D: CostEditor + PlanUploadPanel Wire-up

**Agent:** frontend-engineer
**Effort:** 0.5 days
**Depends on:** P4-002-B, P4-002-C

**Files:**
- `components/estimates/CostEditor.tsx` (modified)
- `components/estimates/PlanUploadPanel.tsx` (modified)

**Task:**

**`CostEditor.tsx`:**
- Add `<VoiceInputButton>` next to quantity input fields in each line item row
- On `onResult`:
  - If `isNote: false`: populate quantity field with `parsed.quantity`, unit dropdown with `parsed.unit`
  - If `isNote: true`: append to line item notes field
- Show `<VoiceTranscription>` in a `ResponsiveModal` for confirmation before applying
- Only show voice button if `SpeechRecognition` is available

**`PlanUploadPanel.tsx`:**
- Add `<VoiceInputButton>` in the notes/description area of the upload form
- On `onResult`: append transcription to notes textarea
- Skip confirmation modal for notes (apply directly)

**Mobile Checks:**
- [ ] Voice button doesn't overlap other controls on small screens
- [ ] `ResponsiveModal` for transcription confirmation on mobile

**Acceptance Criteria:**
- [ ] Quantity field populated from voice on CostEditor confirm
- [ ] Voice notes appended to notes field
- [ ] VoiceTranscription modal appears before applying to CostEditor
- [ ] No voice button shown in unsupported browsers
- [ ] Build passes with no TS errors
