# Threaded Replies - Frontend Developer API Reference

## Quick Start

The backend for threaded message replies is fully implemented. Use these server actions in your UI components.

---

## Server Actions Available

All actions are in `app/actions/chat.ts`.

### 1. Send a Reply

```typescript
import { sendMessage } from '@/app/actions/chat';

// In your component:
const handleReply = async (parentMessageId: string, content: string) => {
  const formData = new FormData();
  formData.append('chatRoomId', roomId);
  formData.append('content', content);
  formData.append('replyToId', parentMessageId); // This makes it a reply!

  const result = await sendMessage(formData);

  if (result.error) {
    console.error('Failed to send reply:', result.error);
    return;
  }

  // Reply sent successfully!
  // Parent author will be notified automatically
};
```

**Features**:
- Automatically creates notification for parent message author
- No notification if replying to your own message
- Returns full message object with sender details

---

### 2. Fetch Thread Messages

```typescript
import { getThreadMessages } from '@/app/actions/chat';

// In your thread panel component:
const loadThread = async (parentMessageId: string) => {
  const result = await getThreadMessages(parentMessageId);

  if (result.error) {
    console.error('Failed to load thread:', result.error);
    return;
  }

  const { parentMessage, replies } = result;

  // parentMessage: The original message
  // replies: Array of reply messages (chronologically sorted)
};
```

**Returns**:
```typescript
{
  success: true,
  parentMessage: {
    id: string,
    content: string,
    created_at: string,
    sender: {
      id: string,
      name: string,
      email: string,
      avatar_url: string | null
    },
    // ... other message fields
  },
  replies: [
    // Same structure as parentMessage
  ]
}
```

---

### 3. Get Reply Count (Single Message)

```typescript
import { getMessageReplyCount } from '@/app/actions/chat';

// For showing "3 replies" badge:
const count = await getMessageReplyCount(messageId);

if (count.success) {
  console.log(`${count.count} replies`); // "3 replies"
}
```

---

### 4. Get Reply Counts (Multiple Messages) ⚡ Optimized

```typescript
import { getMessageReplyCounts } from '@/app/actions/chat';

// In your message list (more efficient than individual calls):
const messageIds = messages.map(m => m.id);
const result = await getMessageReplyCounts(messageIds);

if (result.success) {
  const { counts } = result;

  // counts is an object: { 'msg-uuid-1': 3, 'msg-uuid-2': 0, ... }
  messages.forEach(msg => {
    const replyCount = counts[msg.id] || 0;
    console.log(`Message ${msg.id} has ${replyCount} replies`);
  });
}
```

**Use this for message lists!** Much faster than calling `getMessageReplyCount()` for each message.

---

## UI Component Checklist

### 1. MessageThread.tsx (Thread Panel)

```typescript
'use client';

import { useState, useEffect } from 'react';
import { getThreadMessages } from '@/app/actions/chat';

interface MessageThreadProps {
  parentMessageId: string;
  roomId: string;
  onClose: () => void;
}

export function MessageThread({ parentMessageId, roomId, onClose }: MessageThreadProps) {
  const [thread, setThread] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadThread();
  }, [parentMessageId]);

  const loadThread = async () => {
    const result = await getThreadMessages(parentMessageId);
    if (result.success) {
      setThread(result);
    }
    setLoading(false);
  };

  if (loading) return <div>Loading thread...</div>;
  if (!thread) return <div>Thread not found</div>;

  return (
    <div className="thread-panel">
      {/* Header with close button */}
      <div className="thread-header">
        <h2>Thread</h2>
        <button onClick={onClose}>Close</button>
      </div>

      {/* Parent message */}
      <div className="parent-message">
        <MessageItem message={thread.parentMessage} isParent />
      </div>

      {/* Replies */}
      <div className="thread-replies">
        {thread.replies.map(reply => (
          <MessageItem key={reply.id} message={reply} />
        ))}
      </div>

      {/* Reply input */}
      <MessageInput
        roomId={roomId}
        replyToId={parentMessageId}
        placeholder="Reply to thread..."
      />
    </div>
  );
}
```

---

### 2. MessageItem.tsx (Add Thread Indicator)

```typescript
'use client';

import { useState, useEffect } from 'react';
import { getMessageReplyCount } from '@/app/actions/chat';

interface MessageItemProps {
  message: any;
  onOpenThread?: (messageId: string) => void;
}

export function MessageItem({ message, onOpenThread }: MessageItemProps) {
  const [replyCount, setReplyCount] = useState(0);

  useEffect(() => {
    loadReplyCount();
  }, [message.id]);

  const loadReplyCount = async () => {
    const result = await getMessageReplyCount(message.id);
    if (result.success) {
      setReplyCount(result.count);
    }
  };

  return (
    <div className="message-item">
      {/* Message content */}
      <div className="message-content">
        {message.content}
      </div>

      {/* Thread indicator (if has replies) */}
      {replyCount > 0 && (
        <button
          onClick={() => onOpenThread?.(message.id)}
          className="thread-indicator"
        >
          💬 {replyCount} {replyCount === 1 ? 'reply' : 'replies'}
        </button>
      )}

      {/* Hover menu: Add "Reply in thread" action */}
      <div className="message-actions">
        <button onClick={() => onOpenThread?.(message.id)}>
          Reply in thread
        </button>
      </div>
    </div>
  );
}
```

---

### 3. ChatLayout.tsx (Integrate Thread Panel)

```typescript
'use client';

import { useState } from 'react';
import { MessageThread } from './MessageThread';

export function ChatLayout({ roomId }: { roomId: string }) {
  const [activeThread, setActiveThread] = useState<string | null>(null);

  // Listen for URL query param: ?thread=xxx
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const threadId = params.get('thread');
    if (threadId) {
      setActiveThread(threadId);
    }
  }, []);

  return (
    <div className="chat-layout">
      {/* Main chat area */}
      <div className="main-chat">
        <MessageList
          roomId={roomId}
          onOpenThread={setActiveThread}
        />
      </div>

      {/* Thread panel (conditionally shown) */}
      {activeThread && (
        <div className="thread-panel">
          <MessageThread
            parentMessageId={activeThread}
            roomId={roomId}
            onClose={() => setActiveThread(null)}
          />
        </div>
      )}
    </div>
  );
}
```

---

## Filtering Main Messages

To hide threaded replies from the main chat view:

```typescript
// In your message list query:
const { data: messages } = await supabase
  .from('messages')
  .select('*')
  .eq('chat_room_id', roomId)
  .is('reply_to_id', null)  // ← Only show top-level messages!
  .is('deleted_at', null)
  .order('created_at', { ascending: false });
```

---

## Notification Handling

When a user receives a thread notification, they click the link:
```
/app/chat/{roomId}?thread={parentMessageId}
```

Your UI should:
1. Parse the `thread` query param
2. Open the thread panel automatically
3. Scroll to the parent message

Example:
```typescript
useEffect(() => {
  const params = new URLSearchParams(window.location.search);
  const threadId = params.get('thread');

  if (threadId) {
    openThread(threadId);
    // Optional: Clear query param after opening
    window.history.replaceState({}, '', window.location.pathname);
  }
}, []);
```

---

## Performance Tips

### ✅ DO: Use Batch Operations
```typescript
// Good: Single query for all messages
const messageIds = messages.map(m => m.id);
const { counts } = await getMessageReplyCounts(messageIds);
```

### ❌ DON'T: Loop Individual Calls
```typescript
// Bad: N queries (slow!)
for (const msg of messages) {
  const count = await getMessageReplyCount(msg.id);
}
```

### ✅ DO: Filter Main Messages Server-Side
```typescript
// Good: Database filters replies
.is('reply_to_id', null)
```

### ❌ DON'T: Filter Client-Side
```typescript
// Bad: Fetches all messages then filters
const allMessages = await fetchAll();
const mainMessages = allMessages.filter(m => !m.reply_to_id);
```

---

## TypeScript Types

Use the generated database types:

```typescript
import { Database } from '@/types/database.types';

type Message = Database['public']['Tables']['messages']['Row'];
type MessageInsert = Database['public']['Tables']['messages']['Insert'];

// Message with sender details (from server actions)
interface MessageWithSender extends Message {
  sender: {
    id: string;
    name: string;
    email: string;
    avatar_url: string | null;
  };
}
```

---

## Error Handling

All server actions return a consistent structure:

```typescript
// Success
{ success: true, data: {...} }

// Error
{ error: string }

// Validation error
{ error: string, fieldErrors: {...} }
```

Always check for errors:

```typescript
const result = await sendMessage(formData);

if (result.error) {
  // Show error to user
  toast.error(result.error);
  return;
}

// Success!
toast.success('Reply sent!');
```

---

## Testing Checklist

- [ ] Can reply to a message
- [ ] Reply appears in thread panel
- [ ] Reply does NOT appear in main chat
- [ ] Reply count updates immediately
- [ ] Parent author receives notification
- [ ] Clicking notification opens correct thread
- [ ] Can reply to a reply (nested threads)
- [ ] Deleted messages don't show in threads
- [ ] Thread panel shows "0 replies" gracefully
- [ ] Batch reply count query works for 50+ messages

---

## Questions?

- **Backend code**: `app/actions/chat.ts` (lines 197-448)
- **Database schema**: `.claude/docs/law/DB_SCHEMA.md` (lines 959-975)
- **Implementation summary**: `docs/specs/slack-chat-system/tasks/0005-threaded-replies-IMPLEMENTATION.md`

All backend functionality is complete and tested. Build with confidence! 🚀
