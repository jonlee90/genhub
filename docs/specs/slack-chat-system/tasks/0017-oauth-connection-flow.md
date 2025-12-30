# Task 0017: OAuth Connection Flow

## Phase
Phase 5: KakaoTalk Integration

## Overview
Implement OAuth flow for connecting user's KakaoTalk account via Sendbird.

## Subtasks

### 17.1 Create KakaoTalk OAuth callback API route
- Create `app/api/kakao/callback/route.ts`
- Exchange authorization code for tokens via Sendbird
- Store connection in kakao_connections table
- Redirect to settings page with success/error message

### 17.2 Create `components/settings/KakaoTalkSettings.tsx` component
- Display "Connect KakaoTalk" button when not connected
- Show linked KakaoTalk ID and "Disconnect" button when connected
- Add toggle for two-way message sync
- Initiate OAuth flow on connect button click

## Files to Create/Modify
- `app/api/kakao/callback/route.ts` (new)
- `app/api/kakao/connect/route.ts` (new - initiate OAuth)
- `components/settings/KakaoTalkSettings.tsx` (new)
- `app/app/settings/page.tsx` (modify to include KakaoTalk section)
- `app/actions/kakao.ts` (new)

## Dependencies
- Task 0016: Sendbird Setup

## Acceptance Criteria
- [ ] Connect button initiates OAuth flow
- [ ] Callback handles token exchange successfully
- [ ] Connected state shows KakaoTalk ID
- [ ] Disconnect removes connection from database
- [ ] Two-way sync toggle updates user preference

## References
- Requirements: Req 11.1-11.4
- Design: KakaoTalk Integration section
