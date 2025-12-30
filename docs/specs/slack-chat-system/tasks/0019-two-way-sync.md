# Task 0019: Two-Way Sync (Optional)

## Phase
Phase 5: KakaoTalk Integration

## Overview
Implement optional two-way message sync between GenHub chat and KakaoTalk.

## Subtasks

### 19.1 Implement message sync from GenHub to KakaoTalk
- After sending message in GenHub, check if sender has two_way_sync enabled
- Call `syncMessage` to forward message to KakaoTalk
- Display sync indicator on successfully synced messages

### 19.2 Create webhook for incoming KakaoTalk messages
- Create `app/api/kakao/webhook/route.ts`
- Verify webhook signature from Sendbird
- Parse incoming message and find matching chat room
- Insert message into GenHub chat with external_source indicator

## Files to Create/Modify
- `app/api/kakao/webhook/route.ts` (new)
- `app/actions/chat.ts` (modify sendMessage for sync)
- `components/chat/MessageItem.tsx` (modify for sync indicator)
- `lib/services/kakao.ts` (modify for message sync)

## Dependencies
- Task 0016: Sendbird Setup
- Task 0017: OAuth Connection Flow

## Acceptance Criteria
- [ ] Messages sent in GenHub sync to KakaoTalk (if enabled)
- [ ] Messages sent in KakaoTalk appear in GenHub
- [ ] Sync indicator shows on synced messages
- [ ] External source indicator shows on KakaoTalk messages
- [ ] Webhook validates Sendbird signature

## References
- Requirements: Req 11.4, Req 11.6
- Design: KakaoTalk Integration section
