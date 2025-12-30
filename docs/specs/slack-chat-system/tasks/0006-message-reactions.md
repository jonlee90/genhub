# Task 0006: Message Reactions

## Phase
Phase 2: Rich Features

## Overview
Implement emoji reactions on messages with a construction-themed emoji picker.

## Subtasks

### 6.1 Create `message_reactions` table migration
- Add columns: message_id, user_id, emoji, created_at
- Add unique constraint on (message_id, user_id, emoji)
- Add RLS policies: users can view reactions in their rooms, manage their own reactions

### 6.2 Implement `toggleReaction(messageId, emoji)` server action
- Check if reaction exists, remove if yes, add if no
- No notification on reaction (silent acknowledgment per Req 3.7)
- Revalidate message to update reaction display

### 6.3 Create `components/chat/MessageReactions.tsx` component
- Display grouped reactions below message with emoji + count
- Highlight reactions where current user has reacted
- Show tooltip with reactor names on hover

### 6.4 Create reaction picker with construction-themed emojis
- Include curated emojis: thumbs up, check mark, hard hat, hammer, wrench, warning, construction sign, clipboard, money, building
- Trigger picker on hover menu "React" action
- Close picker after emoji selection

## Files to Create/Modify
- `supabase/migrations/YYYYMMDDHHMMSS_message_reactions.sql` (new)
- `app/actions/chat.ts` (add toggleReaction)
- `components/chat/MessageReactions.tsx` (new)
- `components/chat/ReactionPicker.tsx` (new)
- `components/chat/MessageItem.tsx` (modify to include reactions)

## Dependencies
- Task 0001-0004: Core Chat MVP

## Acceptance Criteria
- [ ] Users can add emoji reactions to messages
- [ ] Clicking same emoji again removes the reaction
- [ ] Reactions display with count below messages
- [ ] User's own reactions are highlighted
- [ ] Construction-themed emoji picker works

## References
- Requirements: Req 3.1-3.7
- Design: Appendix (Construction Emojis)
