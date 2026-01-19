# Master Plan — PR4 Chat Metadata Batching

## Overview

Batch message metadata fetches (reactions, replies, attachments) to remove N+1 calls per message in the chat list. This is a performance refactor with no UI behavior changes.

## Architecture

- Introduce a batched hook to request metadata by room + visible message IDs.
- Cache results with SWR or in-memory map to avoid re-fetching within session.
- Message rendering reads from the batch results instead of per-message fetches.
- Maintain fallback behavior (missing metadata renders empty states).

## Components (Dependency Order)

1. **Batched Metadata Hook**
   - Scope: Create hook for batched metadata fetch by room and message IDs.
   - Interfaces: `useMessageMetadata({ roomId, messageIds })` returns metadata map + loading state.
   - Dependencies: existing chat metadata fetch functions or server actions.
   - Risks: stale data or missing keys in map.

2. **Message List Integration**
   - Scope: Use batched hook in `MessageList` to load metadata for visible messages.
   - Dependencies: `components/chat/MessageList.tsx`.
   - Risks: incorrect ID list causing missing metadata.

3. **Message Item Mapping**
   - Scope: Replace per-message metadata calls with map lookups in `MessageItem`.
   - Dependencies: `components/chat/MessageItem.tsx`.
   - Risks: regressions if metadata fields are undefined.

## Baseline Measurement

- Capture request count in DevTools for a large chat room (before changes).
- Record counts in PR description for before/after comparison.

## Validation

- `npm run lint -- --file components/chat/MessageList.tsx`
- `npm run lint -- --file components/chat/MessageItem.tsx`
- Manual spot check of chat message list (reactions, replies, attachments) on desktop + mobile.

## Rollout / Handoff

- If missing metadata appears, revert to per-message fetches or add fallback guards.
