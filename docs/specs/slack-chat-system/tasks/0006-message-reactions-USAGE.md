# Message Reactions - Usage Guide

## Quick Reference for Frontend Implementation

### Import Server Actions

```typescript
import {
  toggleReaction,
  getMessageReactions,
  getMessagesReactions
} from '@/app/actions/chat';
import { CONSTRUCTION_EMOJIS } from '@/types/chat.types';
import type { MessageReactionGroup } from '@/types/chat.types';
```

---

## Server Actions

### 1. Toggle Reaction

**Use Case:** Add or remove a reaction when user clicks an emoji

```typescript
// In client component
'use client';

const handleReaction = async (messageId: string, emoji: string) => {
  const result = await toggleReaction(messageId, emoji);

  if (result.error) {
    toast.error(result.error);
    return;
  }

  if (result.action === 'added') {
    toast.success('Reaction added');
  } else {
    toast.success('Reaction removed');
  }
};

// Usage
<button onClick={() => handleReaction(message.id, '👍')}>
  👍
</button>
```

**Response Type:**
```typescript
{
  success: true;
  action: 'added' | 'removed';
  messageId: string;
  emoji: string;
  reaction?: { id, message_id, user_id, emoji, created_at };
} | {
  error: string;
}
```

---

### 2. Get Reactions for One Message

**Use Case:** Display reactions below a single message

```typescript
const [reactions, setReactions] = useState<MessageReactionGroup[]>([]);

useEffect(() => {
  async function fetchReactions() {
    const result = await getMessageReactions(messageId);
    if (result.success && result.reactions) {
      setReactions(result.reactions);
    }
  }
  fetchReactions();
}, [messageId]);
```

**Response Type:**
```typescript
{
  success: true;
  reactions: MessageReactionGroup[];
} | {
  error: string;
}

// MessageReactionGroup:
{
  emoji: string;           // '👍'
  count: number;           // 5
  hasReacted: boolean;     // true if current user reacted
  users: Array<{
    id: string;
    name: string;
    avatar_url: string | null;
  }>;
}
```

---

### 3. Get Reactions for Multiple Messages (Batch)

**Use Case:** Display reactions in a message list efficiently

```typescript
const messageIds = messages.map(m => m.id);

const result = await getMessagesReactions(messageIds);
if (result.success && result.reactionsMap) {
  // reactionsMap[messageId] = MessageReactionGroup[]
  const messageReactions = result.reactionsMap[someMessageId];
}
```

**Response Type:**
```typescript
{
  success: true;
  reactionsMap: Record<string, MessageReactionGroup[]>;
} | {
  error: string;
}
```

---

## Construction-Themed Emojis

Use the curated emoji list for the reaction picker:

```typescript
import { CONSTRUCTION_EMOJIS } from '@/types/chat.types';

// CONSTRUCTION_EMOJIS is:
[
  { emoji: '👍', label: 'Thumbs up', category: 'general' },
  { emoji: '✅', label: 'Check mark', category: 'general' },
  { emoji: '🏗️', label: 'Construction site', category: 'construction' },
  { emoji: '🔨', label: 'Hammer', category: 'tools' },
  { emoji: '🔧', label: 'Wrench', category: 'tools' },
  { emoji: '⚠️', label: 'Warning', category: 'safety' },
  { emoji: '🚧', label: 'Construction sign', category: 'construction' },
  { emoji: '📋', label: 'Clipboard', category: 'planning' },
  { emoji: '💰', label: 'Money', category: 'finance' },
  { emoji: '🏢', label: 'Building', category: 'construction' },
]

// Usage in picker:
<div className="emoji-picker">
  {CONSTRUCTION_EMOJIS.map(({ emoji, label }) => (
    <button
      key={emoji}
      onClick={() => handleReaction(messageId, emoji)}
      title={label}
    >
      {emoji}
    </button>
  ))}
</div>
```

---

## Example: MessageReactions Component

```typescript
'use client';

import { useState } from 'react';
import { toggleReaction } from '@/app/actions/chat';
import type { MessageReactionGroup } from '@/types/chat.types';

interface MessageReactionsProps {
  messageId: string;
  reactions: MessageReactionGroup[];
}

export function MessageReactions({ messageId, reactions }: MessageReactionsProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleToggleReaction = async (emoji: string) => {
    setIsLoading(true);
    try {
      const result = await toggleReaction(messageId, emoji);
      if (result.error) {
        console.error('Failed to toggle reaction:', result.error);
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (!reactions || reactions.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-wrap gap-1 mt-1">
      {reactions.map((reaction) => (
        <button
          key={reaction.emoji}
          onClick={() => handleToggleReaction(reaction.emoji)}
          disabled={isLoading}
          className={`
            flex items-center gap-1 px-2 py-1 rounded-full text-sm
            border transition-colors
            ${reaction.hasReacted
              ? 'bg-blue-100 border-blue-300 text-blue-700'
              : 'bg-gray-100 border-gray-300 text-gray-700 hover:bg-gray-200'
            }
          `}
          title={reaction.users.map(u => u.name).join(', ')}
        >
          <span>{reaction.emoji}</span>
          <span className="text-xs font-medium">{reaction.count}</span>
        </button>
      ))}
    </div>
  );
}
```

---

## Example: ReactionPicker Component

```typescript
'use client';

import { useState } from 'react';
import { CONSTRUCTION_EMOJIS } from '@/types/chat.types';
import { toggleReaction } from '@/app/actions/chat';

interface ReactionPickerProps {
  messageId: string;
  onClose: () => void;
}

export function ReactionPicker({ messageId, onClose }: ReactionPickerProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleEmojiClick = async (emoji: string) => {
    setIsLoading(true);
    try {
      await toggleReaction(messageId, emoji);
      onClose(); // Close picker after selection
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-2 border border-gray-200">
      <div className="grid grid-cols-5 gap-1">
        {CONSTRUCTION_EMOJIS.map(({ emoji, label }) => (
          <button
            key={emoji}
            onClick={() => handleEmojiClick(emoji)}
            disabled={isLoading}
            className="p-2 text-2xl hover:bg-gray-100 rounded transition-colors"
            title={label}
          >
            {emoji}
          </button>
        ))}
      </div>
    </div>
  );
}
```

---

## Example: MessageItem with Reactions

```typescript
'use client';

import { useState } from 'react';
import { MessageReactions } from './MessageReactions';
import { ReactionPicker } from './ReactionPicker';

export function MessageItem({ message }) {
  const [showPicker, setShowPicker] = useState(false);

  return (
    <div className="message-item">
      {/* Message content */}
      <div className="message-content">
        {message.content}
      </div>

      {/* Reactions */}
      <MessageReactions
        messageId={message.id}
        reactions={message.reactions || []}
      />

      {/* Hover menu */}
      <div className="message-hover-menu">
        <button onClick={() => setShowPicker(true)}>
          React
        </button>
        {/* Other actions */}
      </div>

      {/* Reaction picker */}
      {showPicker && (
        <ReactionPicker
          messageId={message.id}
          onClose={() => setShowPicker(false)}
        />
      )}
    </div>
  );
}
```

---

## Features

- **Toggle on Click:** Clicking the same emoji again removes the reaction
- **Highlight User's Reactions:** `hasReacted` flag styles the button differently
- **User Tooltips:** Show who reacted by displaying `users` array
- **No Notifications:** Reactions are silent acknowledgments (per requirements)
- **Automatic Revalidation:** Server actions revalidate paths to update UI
- **Type Safety:** Full TypeScript types for all functions

---

## Performance Tips

1. **Batch Queries:** Use `getMessagesReactions()` for message lists instead of calling `getMessageReactions()` for each message individually

2. **Optimistic Updates:** Update local state immediately, then sync with server:
   ```typescript
   const [reactions, setReactions] = useState(initialReactions);

   const handleReaction = async (emoji: string) => {
     // Optimistic update
     setReactions(prev => optimisticallyUpdate(prev, emoji));

     // Server sync
     const result = await toggleReaction(messageId, emoji);
     if (result.error) {
       // Rollback on error
       setReactions(initialReactions);
     }
   };
   ```

3. **Debounce Rapid Clicks:** Prevent spam clicking by disabling button during request

---

## Security

- RLS policies ensure users can only react in rooms they participate in
- Server actions validate all inputs with Zod
- User access is verified before any database mutation
- Only reaction owners can delete their own reactions

---

## Testing Checklist

- [ ] User can add reaction to message
- [ ] User can remove reaction by clicking same emoji
- [ ] Reactions display with correct count
- [ ] User's own reactions are highlighted
- [ ] Tooltip shows list of users who reacted
- [ ] Multiple users can react with same emoji
- [ ] One user can only have one of each emoji per message
- [ ] Reactions update in real-time for other users (via Supabase Realtime)
- [ ] No notifications are sent when reacting
- [ ] Construction-themed emojis display correctly
