# Task 0018: AlimTalk Templates

## Phase
Phase 5: KakaoTalk Integration

## Overview
Register and integrate AlimTalk templates for sending key event notifications via KakaoTalk.

## Subtasks

### 18.1 Register AlimTalk templates with Sendbird
- Create template for task assignments
- Create template for expense approvals/rejections
- Create template for project milestone updates
- Store template codes in environment variables or config

### 18.2 Integrate AlimTalk sending for key events
- Send task assignment notification via AlimTalk if user has KakaoTalk connected
- Send expense approval/rejection notification
- Send project milestone notification
- Handle send failures with retry logic (up to 3 times)

## Files to Create/Modify
- `lib/services/kakao.ts` (modify for templates)
- `app/actions/tasks.ts` (modify for AlimTalk on assignment)
- `app/actions/expenses.ts` (modify for AlimTalk on approval)
- `app/actions/projects.ts` (modify for AlimTalk on milestone)
- `config/kakao-templates.ts` (new)

## Dependencies
- Task 0016: Sendbird Setup
- Task 0017: OAuth Connection Flow

## Acceptance Criteria
- [ ] AlimTalk templates registered with Sendbird
- [ ] Task assignments send AlimTalk to connected users
- [ ] Expense approvals send AlimTalk to connected users
- [ ] Project milestones send AlimTalk to connected users
- [ ] Failed sends retry up to 3 times

## References
- Requirements: Req 11.5, Req 11.7
- Design: KakaoTalk Integration section
