# Skill: Chat & Realtime

> Chat and realtime messaging patterns for GenHub

## When to Use

- Project/task chat rooms
- Direct messages
- Realtime message updates
- Typing indicators and presence
- Message threads and reactions
- File attachments

## Prerequisites

- Supabase Realtime enabled on tables
- Check `.claude/docs/indexes/tables.md` for chat schema
- Check `.claude/docs/indexes/actions.md` for chat actions

---

## Quick Reference

### Database Tables

| Table | Purpose |
|-------|---------|
| `chat_rooms` | Chat room definitions (8 cols) |
| `chat_participants` | Room participants (9 cols) |
| `messages` | Chat messages (10 cols) |
| `message_reactions` | Emoji reactions (5 cols) |
| `message_attachments` | File attachments (9 cols) |

### Room Types
```typescript
type RoomType = 'project' | 'dm' | 'group'
// 'project' rooms auto-created with projects
// 'dm' for direct messages (2 participants)
// 'group' for custom group chats
```

### Messages Table
```sql
messages (
  id uuid PRIMARY KEY,
  room_id uuid REFERENCES chat_rooms(id),
  sender_id uuid REFERENCES next_auth.users(id),
  content text NOT NULL,
  parent_message_id uuid REFERENCES messages(id),  -- For threads
  is_edited boolean DEFAULT false,
  is_deleted boolean DEFAULT false,
  created_at timestamptz,
  updated_at timestamptz
)
```

### Realtime Channels
```typescript
// Message subscription
supabase.channel(`room:${roomId}`)
  .on('postgres_changes', {
    event: 'INSERT',
    schema: 'public',
    table: 'messages',
    filter: `room_id=eq.${roomId}`,
  }, handleNewMessage)
  .subscribe()

// Presence (typing, online)
supabase.channel(`presence:${roomId}`)
  .on('presence', { event: 'sync' }, handlePresenceSync)
  .subscribe()
```

---

## Server Actions

### Query Actions (chat-queries.ts)

| Action | Purpose |
|--------|---------|
| `getCurrentUserContext` | Get user auth context |
| `getChatRooms` | List user's chat rooms |
| `getMessages` | Get messages for room |
| `getCompanyUsers` | Get users for mentions |
| `getMessageById` | Single message details |

### Mutation Actions (chat.ts)

| Action | Purpose |
|--------|---------|
| `sendMessage` | Send new message |
| `markMessagesAsRead` | Mark room as read |
| `getThreadMessages` | Get thread replies |
| `getMessageReplyCount` | Count for single message |
| `getMessageReplyCounts` | Batch reply counts |
| `toggleReaction` | Add/remove reaction |
| `getMessageReactions` | Reactions for message |
| `getMessagesReactions` | Batch reactions |
| `uploadAttachment` | Upload file attachment |
| `getMessageAttachments` | Attachments for message |
| `deleteAttachment` | Remove attachment |
| `getMessagesAttachments` | Batch attachments |
| `muteChatRoom` | Mute notifications |
| `createDMRoom` | Create direct message room |
| `editMessage` | Edit message content |
| `deleteMessage` | Soft delete message |
| `updateChatRoom` | Update room settings |
| `exportTranscript` | Export chat history |
| `getChatRoomParticipants` | Get room members |
| `isUserGcAdmin` | Check admin status |

### Search Actions (chat-search.ts)

| Action | Purpose |
|--------|---------|
| `searchProjects` | Search in project context |
| `searchTasks` | Search tasks |
| `searchMaterials` | Search materials |
| `searchExpenses` | Search expenses |
| `searchUsers` | Search users for mentions |
| `searchMessages` | Search message content |

### Query Pattern
```typescript
// Get messages with sender info
const { data } = await supabase
  .from('messages')
  .select(`
    *,
    sender:user_profiles!sender_id (id, name, avatar_url)
  `)
  .eq('room_id', roomId)
  .eq('is_deleted', false)
  .order('created_at', { ascending: false })
  .limit(50);
```

### Thread Pattern
```typescript
// Get thread replies
const replies = await getThreadMessages(parentMessageId);
// Returns messages with parent_message_id = parentMessageId

// Reply to message
await sendMessage({
  roomId,
  content: 'Reply text',
  parentMessageId,  // Creates thread
});
```

---

## Reactions & Attachments

### Reactions Pattern
```typescript
// Toggle reaction (adds if not exists, removes if exists)
await toggleReaction({
  messageId,
  emoji: '👍',
});

// Get reactions for batch of messages
const reactions = await getMessagesReactions(messageIds);
// Returns: { messageId: [{ emoji, count, userReacted }] }
```

### Attachments Pattern
```typescript
// Upload attachment
const { data: attachment } = await uploadAttachment({
  messageId,
  file,  // File object
});
// Stores in Supabase Storage, links to message

// Get attachments
const attachments = await getMessageAttachments(messageId);
```

---

## Client Realtime (CRITICAL)

**IMPORTANT**: Realtime subscriptions require Supabase client-side SDK.
This is the ONE exception to "no Supabase in client" rule:

```typescript
// hooks/use-chat-realtime.ts
'use client'

import { createClient } from '@/utils/supabase/client'  // CLIENT version only here

export function useChatRealtime(roomId: string) {
  useEffect(() => {
    const supabase = createClient()  // Browser client

    const channel = supabase
      .channel(`room:${roomId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `room_id=eq.${roomId}`,
      }, handleNewMessage)
      .subscribe()

    // CRITICAL: Always cleanup
    return () => {
      supabase.removeChannel(channel)
    }
  }, [roomId])
}
```

---

## Anti-Patterns

```typescript
// WRONG: Using server Supabase in client
'use client'
import { createClient } from '@/utils/supabase/server'
// Will cause build error

// CORRECT: Use client version for realtime only
import { createClient } from '@/utils/supabase/client'

// WRONG: Table name 'chat_messages'
supabase.from('chat_messages').select()
// Actual table is 'messages'

// CORRECT: Actual table name
supabase.from('messages').select()

// WRONG: Table name 'chat_room_members'
supabase.from('chat_room_members').select()
// Actual table is 'chat_participants'

// CORRECT: Actual table name
supabase.from('chat_participants').select()

// WRONG: No cleanup on realtime
useEffect(() => {
  supabase.channel('room').subscribe()
}, [])  // Memory leak!

// CORRECT: Always cleanup
useEffect(() => {
  const channel = supabase.channel('room').subscribe()
  return () => supabase.removeChannel(channel)
}, [])
```

---

## Checklist

- [ ] Table names: `messages` (not `chat_messages`)
- [ ] Table names: `chat_participants` (not `chat_room_members`)
- [ ] Realtime uses client-side Supabase (only exception)
- [ ] Realtime subscriptions have cleanup
- [ ] Room membership verified via Server Actions
- [ ] Threads use `parent_message_id`
- [ ] Reactions via `toggleReaction`
- [ ] Attachments via `message_attachments` table
- [ ] Soft delete via `is_deleted` flag
