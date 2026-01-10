# Skill: Chat & Realtime

> Chat and realtime messaging patterns for GenHub

## When to Use

- Project/task chat rooms
- Direct messages
- Realtime message updates
- Typing indicators and presence

## Prerequisites

- Supabase Realtime enabled on tables
- Check `docs/indexes/tables.md` for chat schema

---

## Quick Reference

### Database Schema
```sql
-- Chat rooms
chat_rooms (
  id uuid PRIMARY KEY,
  company_id uuid NOT NULL,
  name text,
  type chat_room_type NOT NULL,  -- 'project', 'task', 'direct', 'group'
  project_id uuid REFERENCES projects(id),
  task_id uuid REFERENCES tasks(id),
  created_at timestamptz
)

-- Room members
chat_room_members (
  id uuid PRIMARY KEY,
  room_id uuid REFERENCES chat_rooms(id) ON DELETE CASCADE,
  user_id uuid REFERENCES users(id),
  joined_at timestamptz,
  last_read_at timestamptz,
  unread_count integer DEFAULT 0
)

-- Messages
chat_messages (
  id uuid PRIMARY KEY,
  room_id uuid REFERENCES chat_rooms(id) ON DELETE CASCADE,
  sender_id uuid REFERENCES users(id),
  content text NOT NULL,
  message_type text DEFAULT 'text',  -- 'text', 'file', 'system'
  file_url text,
  file_name text,
  reply_to_id uuid REFERENCES chat_messages(id),
  edited_at timestamptz,
  deleted_at timestamptz,
  created_at timestamptz DEFAULT now()
)
```

### Realtime Channels
```typescript
// Message subscription
supabase.channel(`room:${roomId}`)
  .on('postgres_changes', {
    event: 'INSERT',
    schema: 'public',
    table: 'chat_messages',
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

### Get Chat Rooms
```typescript
export async function getChatRooms() {
  const supabase = await createClient()
  const session = await auth()

  const { data, error } = await supabase
    .from('chat_room_members')
    .select(`
      room_id,
      unread_count,
      last_read_at,
      room:chat_rooms(
        id,
        name,
        type,
        project:projects(id, name),
        task:tasks(id, title)
      )
    `)
    .eq('user_id', session.user.id)
    .order('last_read_at', { ascending: false })

  if (error) return { error: error.message }
  return { data }
}
```

### Get Room Messages
```typescript
export async function getRoomMessages(roomId: string, cursor?: string) {
  const supabase = await createClient()

  let query = supabase
    .from('chat_messages')
    .select(`
      *,
      sender:users!sender_id(id, name, image),
      reply_to:chat_messages!reply_to_id(id, content, sender:users(name))
    `)
    .eq('room_id', roomId)
    .is('deleted_at', null)
    .order('created_at', { ascending: false })
    .limit(50)

  if (cursor) {
    query = query.lt('created_at', cursor)
  }

  const { data, error } = await query

  if (error) return { error: error.message }
  return { data: data?.reverse() }  // Oldest first for display
}
```

### Send Message
```typescript
export async function sendMessage(input: {
  roomId: string
  content: string
  replyToId?: string
  fileUrl?: string
  fileName?: string
}) {
  const supabase = await createClient()
  const session = await auth()

  // Verify membership
  const { data: member } = await supabase
    .from('chat_room_members')
    .select('id')
    .eq('room_id', input.roomId)
    .eq('user_id', session.user.id)
    .single()

  if (!member) return { error: 'Not a member of this room' }

  const { data, error } = await supabase
    .from('chat_messages')
    .insert({
      room_id: input.roomId,
      sender_id: session.user.id,
      content: input.content,
      reply_to_id: input.replyToId,
      file_url: input.fileUrl,
      file_name: input.fileName,
      message_type: input.fileUrl ? 'file' : 'text',
    })
    .select(`
      *,
      sender:users!sender_id(id, name, image)
    `)
    .single()

  if (error) return { error: error.message }
  return { data }
}
```

### Mark Room as Read
```typescript
export async function markRoomAsRead(roomId: string) {
  const supabase = await createClient()
  const session = await auth()

  await supabase
    .from('chat_room_members')
    .update({
      last_read_at: new Date().toISOString(),
      unread_count: 0,
    })
    .eq('room_id', roomId)
    .eq('user_id', session.user.id)

  return { success: true }
}
```

### Create Direct Message Room
```typescript
export async function createDirectMessageRoom(otherUserId: string) {
  const supabase = await createClient()
  const session = await auth()

  // Check if DM already exists
  const { data: existingRooms } = await supabase
    .from('chat_rooms')
    .select(`
      id,
      members:chat_room_members(user_id)
    `)
    .eq('type', 'direct')

  const existingDM = existingRooms?.find(room =>
    room.members.length === 2 &&
    room.members.some(m => m.user_id === session.user.id) &&
    room.members.some(m => m.user_id === otherUserId)
  )

  if (existingDM) return { data: existingDM }

  // Get company
  const { data: companyUser } = await supabase
    .from('company_users')
    .select('company_id')
    .eq('user_id', session.user.id)
    .single()

  // Create room
  const { data: room, error } = await supabase
    .from('chat_rooms')
    .insert({
      company_id: companyUser.company_id,
      type: 'direct',
    })
    .select()
    .single()

  if (error) return { error: error.message }

  // Add both members
  await supabase.from('chat_room_members').insert([
    { room_id: room.id, user_id: session.user.id },
    { room_id: room.id, user_id: otherUserId },
  ])

  return { data: room }
}
```

---

## Realtime Hooks

### useMessages Hook
```typescript
// lib/hooks/useMessages.ts
'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/utils/supabase/client'

export function useMessages(roomId: string, initialMessages: Message[]) {
  const [messages, setMessages] = useState<Message[]>(initialMessages)
  const supabase = createClient()

  useEffect(() => {
    const channel = supabase
      .channel(`room:${roomId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
          filter: `room_id=eq.${roomId}`,
        },
        (payload) => {
          setMessages(prev => [...prev, payload.new as Message])
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'chat_messages',
          filter: `room_id=eq.${roomId}`,
        },
        (payload) => {
          setMessages(prev =>
            prev.map(m => m.id === payload.new.id ? payload.new as Message : m)
          )
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [roomId, supabase])

  const addOptimisticMessage = useCallback((content: string, tempId: string) => {
    const optimistic: Message = {
      id: tempId,
      room_id: roomId,
      content,
      created_at: new Date().toISOString(),
      sender: { id: 'me', name: 'You' },  // Will be replaced by real message
    }
    setMessages(prev => [...prev, optimistic])
  }, [roomId])

  return { messages, addOptimisticMessage }
}
```

### useTypingIndicator Hook
```typescript
export function useTypingIndicator(roomId: string) {
  const [typingUsers, setTypingUsers] = useState<string[]>([])
  const supabase = createClient()

  useEffect(() => {
    const channel = supabase.channel(`typing:${roomId}`)

    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState()
        const typing = Object.values(state)
          .flat()
          .filter((p: any) => p.is_typing)
          .map((p: any) => p.user_name)
        setTypingUsers(typing)
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [roomId, supabase])

  const setTyping = useCallback(async (isTyping: boolean, userName: string) => {
    const channel = supabase.channel(`typing:${roomId}`)
    await channel.track({ is_typing: isTyping, user_name: userName })
  }, [roomId, supabase])

  return { typingUsers, setTyping }
}
```

---

## UI Components

### Message Input
```tsx
'use client'

export function MessageInput({ roomId, onSend }: MessageInputProps) {
  const [content, setContent] = useState('')
  const [isSending, setIsSending] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!content.trim() || isSending) return

    const tempId = `temp-${Date.now()}`
    onSend?.(content, tempId)  // Optimistic update

    setIsSending(true)
    setContent('')

    await sendMessage({ roomId, content: content.trim() })
    setIsSending(false)
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-2 p-4 border-t">
      <Input
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Type a message..."
        className="flex-1 border-2"
      />
      <Button type="submit" disabled={!content.trim() || isSending}>
        <Send className="w-4 h-4" />
      </Button>
    </form>
  )
}
```

### Message Bubble
```tsx
export function MessageBubble({ message, isOwn }: MessageBubbleProps) {
  return (
    <div className={cn(
      "flex gap-2 mb-3",
      isOwn ? "flex-row-reverse" : "flex-row"
    )}>
      {!isOwn && (
        <Avatar className="w-8 h-8">
          <AvatarImage src={message.sender.image} />
          <AvatarFallback>{message.sender.name[0]}</AvatarFallback>
        </Avatar>
      )}
      <div className={cn(
        "max-w-[70%] rounded-lg p-3",
        isOwn
          ? "bg-[#001B51] text-white"
          : "bg-gray-100 text-gray-900"
      )}>
        {!isOwn && (
          <p className="text-xs font-medium mb-1">{message.sender.name}</p>
        )}
        <p className="text-sm whitespace-pre-wrap">{message.content}</p>
        <p className={cn(
          "text-xs mt-1",
          isOwn ? "text-white/70" : "text-gray-500"
        )}>
          {formatTime(message.created_at)}
        </p>
      </div>
    </div>
  )
}
```

### Typing Indicator
```tsx
export function TypingIndicator({ users }: { users: string[] }) {
  if (users.length === 0) return null

  const text = users.length === 1
    ? `${users[0]} is typing...`
    : users.length === 2
    ? `${users[0]} and ${users[1]} are typing...`
    : `${users.length} people are typing...`

  return (
    <div className="px-4 py-2 text-sm text-gray-500 italic">
      {text}
    </div>
  )
}
```

---

## Anti-Patterns

```typescript
// WRONG: Fetching messages in client component
'use client'
const { data } = await supabase.from('chat_messages').select()
// Use Server Action or fetch in Server Component

// WRONG: No membership check
await sendMessage({ roomId, content })
// Always verify user is room member

// WRONG: Realtime without cleanup
useEffect(() => {
  supabase.channel('room').subscribe()
  // No cleanup - memory leak!
}, [])

// CORRECT: Always cleanup
useEffect(() => {
  const channel = supabase.channel('room').subscribe()
  return () => supabase.removeChannel(channel)
}, [])
```

---

## Checklist

- [ ] Room membership verified before actions
- [ ] Realtime subscriptions have cleanup
- [ ] Optimistic updates for messages
- [ ] Typing indicator with debounce
- [ ] Unread count updated correctly
- [ ] Company isolation in queries
- [ ] Soft delete for messages (deleted_at)
- [ ] Pagination for message history
