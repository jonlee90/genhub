# Task 0016: Sendbird Setup

## Phase
Phase 5: KakaoTalk Integration

## Overview
Set up Sendbird integration for KakaoTalk messaging including database schema and service layer.

## Subtasks

### 16.1 Create `kakao_connections` table migration
- Add columns: user_id, kakao_user_id, sendbird_user_id, two_way_sync, connected_at, disconnected_at, access_token (encrypted), refresh_token (encrypted)
- Add unique constraint on user_id
- Add RLS policy: users can manage their own connection

### 16.2 Create `lib/services/kakao.ts` service class
- Implement KakaoService class with Sendbird API integration
- Add `connectKakaoAccount(userId, authCode)` method for OAuth exchange
- Add `disconnectKakaoAccount(userId)` method
- Add `sendAlimTalk(userId, template)` method for template notifications
- Add `syncMessage(userId, message)` method for two-way sync

## Files to Create/Modify
- `supabase/migrations/YYYYMMDDHHMMSS_kakao_connections.sql` (new)
- `lib/services/kakao.ts` (new)
- `types/kakao.types.ts` (new)

## Dependencies
- Task 0001-0004: Core Chat MVP

## Acceptance Criteria
- [ ] Kakao connections table created with encryption for tokens
- [ ] KakaoService class implements all required methods
- [ ] Sendbird API integration configured
- [ ] Service handles token refresh automatically

## References
- Requirements: Req 11.1-11.7
- Design: KakaoTalk Integration section
