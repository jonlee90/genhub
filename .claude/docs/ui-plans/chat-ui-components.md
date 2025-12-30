# Chat UI Components Implementation Plan

## Overview
Implementation plan for the Slack-like chat system UI components (Task 0003). This plan covers the complete chat interface with responsive layout, virtualized message list, room list with unread badges, and message input with auto-resize.

## Component Architecture

```
app/app/chat/page.tsx (Server Component)
    ├── Fetch chat rooms data
    └── Pass to ChatLayout

components/chat/ChatLayout.tsx (Client Component)
    ├── State: activeRoomId, isMobileSidebarOpen
    ├── Responsive layout (sidebar + main area)
    ├── ChatRoomList (sidebar)
    │   └── ChatRoomItem (for each room)
    └── Active Room View (main area)
        ├── Room Header (room name, participant count, settings)
        ├── MessageList (virtualized)
        │   └── MessageItem (for each message)
        └── MessageInput (bottom)
```

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `app/app/chat/page.tsx` | Create | Server component - fetches rooms, handles loading/error |
| `components/chat/ChatLayout.tsx` | Create | Main layout container with responsive sidebar + main area |
| `components/chat/ChatRoomList.tsx` | Create | Room list with project/DM sections, unread badges |
| `components/chat/ChatRoomItem.tsx` | Create | Individual room item with avatar, preview, timestamp |
| `components/chat/MessageList.tsx` | Create | Virtualized message list with infinite scroll |
| `components/chat/MessageItem.tsx` | Create | Individual message with sender, content, actions |
| `components/chat/MessageInput.tsx` | Create | Auto-resizing textarea with send button |

## Detailed Implementation Specifications

### 1. Chat Page (Server Component)

**File:** `app/app/chat/page.tsx`

**Functionality:**
- Fetch initial chat rooms using `getChatRooms()` server action
- Handle loading state with skeleton UI
- Handle error state with error message
- Pass rooms data to ChatLayout client component

**Props Interface:**
```typescript
// No props - this is a page component
```

**Data Flow:**
```typescript
const { rooms, error } = await getChatRooms();

if (error) {
  return <ErrorState message={error} />;
}

return <ChatLayout initialRooms={rooms || []} />;
```

**Loading State:**
- Display skeleton with sidebar skeleton (3-5 room placeholders)
- Display main area skeleton (header + message list placeholders)

**Error State:**
- Display construction-themed error message
- "Failed to load chat rooms" with retry button
- Use AlertTriangle icon from Lucide

---

### 2. ChatLayout (Client Component)

**File:** `components/chat/ChatLayout.tsx`

**Props Interface:**
```typescript
interface ChatLayoutProps {
  initialRooms: ChatRoomWithUnread[];
}
```

**State Management:**
```typescript
const [activeRoomId, setActiveRoomId] = useState<string | null>(null);
const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(true);
const [rooms, setRooms] = useState<ChatRoomWithUnread[]>(initialRooms);
```

**Responsive Layout:**

**Desktop (md and up):**
```
┌────────────────────────────────────────┐
│  Sidebar (300px) │  Main Area (flex)   │
│  - Room List     │  - Room Header      │
│                  │  - Message List     │
│                  │  - Message Input    │
└────────────────────────────────────────┘
```

**Mobile:**
```
Sidebar Open:
┌──────────────────┐
│   Room List      │
│   (full screen)  │
└──────────────────┘

Room Selected:
┌──────────────────┐
│  Room Header     │
│  - Back Button   │
│  - Room Name     │
├──────────────────┤
│  Message List    │
│  (full screen)   │
├──────────────────┤
│  Message Input   │
└──────────────────┘
```

**Layout Classes:**
```tsx
// Container
<div className="flex h-screen bg-gray-50">

  {/* Sidebar - Desktop: always visible, Mobile: conditional */}
  <div className={cn(
    "border-r border-gray-200 bg-white",
    "md:w-[300px] md:flex md:flex-col",
    // Mobile: full screen when open, hidden when closed
    isMobileSidebarOpen ? "w-full flex flex-col" : "hidden"
  )}>
    <ChatRoomList
      rooms={rooms}
      activeRoomId={activeRoomId}
      onRoomSelect={handleRoomSelect}
    />
  </div>

  {/* Main Area - Desktop: always visible, Mobile: show when room selected */}
  <div className={cn(
    "flex flex-col flex-1",
    // Mobile: show when room selected
    activeRoomId ? "flex" : "hidden md:flex"
  )}>
    {activeRoomId ? (
      <>
        <RoomHeader />
        <MessageList />
        <MessageInput />
      </>
    ) : (
      <EmptyState message="Select a chat to start messaging" />
    )}
  </div>
</div>
```

**Mobile Room Selection Handler:**
```typescript
const handleRoomSelect = (roomId: string) => {
  setActiveRoomId(roomId);
  // On mobile, hide sidebar when room selected
  if (window.innerWidth < 768) {
    setIsMobileSidebarOpen(false);
  }
};

const handleBackToRooms = () => {
  setActiveRoomId(null);
  setIsMobileSidebarOpen(true);
};
```

**Construction Theme Integration:**
- Primary color: `bg-construction-blue` for active room
- Border: `border-construction-blue` for active room highlight
- Accent: `bg-construction-accent/10` for hover states

---

### 3. ChatRoomList

**File:** `components/chat/ChatRoomList.tsx`

**Props Interface:**
```typescript
interface ChatRoomListProps {
  rooms: ChatRoomWithUnread[];
  activeRoomId: string | null;
  onRoomSelect: (roomId: string) => void;
}
```

**Layout Structure:**
```tsx
<div className="flex flex-col h-full">
  {/* Header */}
  <div className="p-4 border-b border-gray-200">
    <h2 className="text-lg font-bold text-construction-blue">Messages</h2>
  </div>

  {/* Search/Filter (Phase 2) */}
  <div className="p-3 border-b border-gray-200">
    <Input placeholder="Search chats..." />
  </div>

  {/* Room List - Scrollable */}
  <div className="flex-1 overflow-y-auto">
    {/* Project Chats Section */}
    {projectRooms.length > 0 && (
      <>
        <div className="px-3 py-2 text-xs font-bold text-gray-500 uppercase tracking-wide">
          Project Chats
        </div>
        {projectRooms.map(room => (
          <ChatRoomItem
            key={room.id}
            room={room}
            isActive={room.id === activeRoomId}
            onSelect={() => onRoomSelect(room.id)}
          />
        ))}
      </>
    )}

    {/* Direct Messages Section */}
    {dmRooms.length > 0 && (
      <>
        <div className="px-3 py-2 text-xs font-bold text-gray-500 uppercase tracking-wide">
          Direct Messages
        </div>
        {dmRooms.map(room => (
          <ChatRoomItem
            key={room.id}
            room={room}
            isActive={room.id === activeRoomId}
            onSelect={() => onRoomSelect(room.id)}
          />
        ))}
      </>
    )}

    {/* Empty State */}
    {rooms.length === 0 && (
      <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
        <MessageSquare className="h-12 w-12 text-gray-300 mb-3" />
        <p className="text-sm text-gray-500">No chat rooms yet</p>
      </div>
    )}
  </div>
</div>
```

**Room Sorting:**
```typescript
// Sort by most recent message activity
const sortedRooms = useMemo(() => {
  return [...rooms].sort((a, b) => {
    const aTime = a.last_message?.created_at || a.created_at;
    const bTime = b.last_message?.created_at || b.created_at;
    return new Date(bTime).getTime() - new Date(aTime).getTime();
  });
}, [rooms]);

// Separate project and DM rooms
const projectRooms = sortedRooms.filter(r => r.type === 'project');
const dmRooms = sortedRooms.filter(r => r.type === 'dm');
```

**Icons:**
- Project rooms: `Building2` from Lucide
- DMs: `MessageSquare` from Lucide
- Empty state: `MessageCircle` from Lucide

---

### 4. ChatRoomItem

**File:** `components/chat/ChatRoomItem.tsx`

**Props Interface:**
```typescript
interface ChatRoomItemProps {
  room: ChatRoomWithUnread;
  isActive: boolean;
  onSelect: () => void;
}
```

**Layout Structure:**
```tsx
<motion.button
  onClick={onSelect}
  className={cn(
    "w-full flex items-start gap-3 p-3 hover:bg-gray-50 transition-colors border-l-4",
    isActive
      ? "bg-construction-blue/5 border-l-construction-blue"
      : "border-l-transparent"
  )}
  whileTap={{ scale: 0.98 }}
>
  {/* Avatar */}
  <Avatar className="h-12 w-12 shrink-0">
    <AvatarImage src={getAvatarUrl(room)} />
    <AvatarFallback className="bg-construction-blue/10 text-construction-blue font-bold">
      {getInitials(room.name)}
    </AvatarFallback>
  </Avatar>

  {/* Content */}
  <div className="flex-1 min-w-0">
    {/* Room Name + Timestamp */}
    <div className="flex items-start justify-between gap-2 mb-1">
      <h3 className={cn(
        "text-sm truncate",
        room.unread_count > 0 ? "font-bold text-gray-900" : "font-medium text-gray-700"
      )}>
        {room.name}
      </h3>
      <span className="text-xs text-gray-500 shrink-0">
        {formatRelativeTime(room.last_message?.created_at || room.created_at)}
      </span>
    </div>

    {/* Last Message Preview */}
    <div className="flex items-center justify-between gap-2">
      <p className={cn(
        "text-xs truncate",
        room.unread_count > 0 ? "text-gray-700 font-medium" : "text-gray-500"
      )}>
        {getMessagePreview(room.last_message)}
      </p>

      {/* Unread Badge + Muted Icon */}
      <div className="flex items-center gap-1 shrink-0">
        {room.muted_until && new Date(room.muted_until) > new Date() && (
          <BellOff className="h-3 w-3 text-gray-400" />
        )}
        {room.unread_count > 0 && (
          <Badge className="bg-construction-blue text-white text-[10px] px-1.5 py-0.5 min-w-[20px] flex items-center justify-center">
            {room.unread_count > 99 ? '99+' : room.unread_count}
          </Badge>
        )}
      </div>
    </div>
  </div>
</motion.button>
```

**Helper Functions:**
```typescript
// Get avatar URL (project icon or user avatar for DMs)
const getAvatarUrl = (room: ChatRoomWithUnread) => {
  if (room.type === 'project') {
    return '/icons/project-default.png'; // Placeholder
  }
  // For DMs, get other participant's avatar (Phase 2)
  return null;
};

// Get initials from room name
const getInitials = (name: string) => {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
};

// Format relative time (2m, 1h, Yesterday, Dec 15)
const formatRelativeTime = (timestamp: string) => {
  const now = new Date();
  const date = new Date(timestamp);
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'now';
  if (diffMins < 60) return `${diffMins}m`;
  if (diffHours < 24) return `${diffHours}h`;
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays}d`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

// Get message preview (truncate to 50 chars)
const getMessagePreview = (message?: MessageWithSender) => {
  if (!message) return 'No messages yet';
  if (message.deleted_at) return 'This message was deleted';
  const content = message.content.replace(/\n/g, ' ').trim();
  return content.length > 50 ? `${content.slice(0, 50)}...` : content;
};
```

**Icons:**
- Muted: `BellOff` from Lucide
- Project: `Building2` from Lucide

---

### 5. MessageList (Virtualized)

**File:** `components/chat/MessageList.tsx`

**Dependencies:**
```bash
pnpm add @tanstack/react-virtual
```

**Props Interface:**
```typescript
interface MessageListProps {
  chatRoomId: string;
}
```

**State Management:**
```typescript
const [messages, setMessages] = useState<MessageWithSender[]>([]);
const [isLoading, setIsLoading] = useState(true);
const [nextCursor, setNextCursor] = useState<string | null>(null);
const [isLoadingMore, setIsLoadingMore] = useState(false);
const [firstUnreadIndex, setFirstUnreadIndex] = useState<number | null>(null);

const scrollContainerRef = useRef<HTMLDivElement>(null);
```

**Virtualization Setup:**
```typescript
import { useVirtualizer } from '@tanstack/react-virtual';

const rowVirtualizer = useVirtualizer({
  count: messages.length,
  getScrollElement: () => scrollContainerRef.current,
  estimateSize: () => 80, // Estimate message height
  overscan: 10, // Render 10 extra items outside viewport
  // Reverse order (newest at bottom)
  scrollMargin: scrollContainerRef.current?.offsetTop ?? 0,
});
```

**Data Fetching:**
```typescript
useEffect(() => {
  async function loadMessages() {
    setIsLoading(true);
    const result = await getMessages(chatRoomId);
    if (result.messages) {
      // Messages come in DESC order, reverse for display (oldest first)
      setMessages(result.messages.reverse());
      setNextCursor(result.nextCursor || null);

      // Calculate first unread message index (using participant's last_read_at)
      // This will be implemented with participant data
    }
    setIsLoading(false);
  }
  loadMessages();
}, [chatRoomId]);
```

**Infinite Scroll (Load Older):**
```typescript
const handleScroll = useCallback(async (e: React.UIEvent<HTMLDivElement>) => {
  const target = e.currentTarget;

  // Detect scroll to top (load older messages)
  if (target.scrollTop < 100 && !isLoadingMore && nextCursor) {
    setIsLoadingMore(true);

    const result = await getMessages(chatRoomId, nextCursor);
    if (result.messages) {
      setMessages(prev => [...result.messages!.reverse(), ...prev]);
      setNextCursor(result.nextCursor || null);
    }

    setIsLoadingMore(false);
  }
}, [chatRoomId, nextCursor, isLoadingMore]);
```

**Auto-Scroll to Bottom:**
```typescript
useEffect(() => {
  // Scroll to bottom on initial load
  if (!isLoading && messages.length > 0 && scrollContainerRef.current) {
    scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight;
  }
}, [isLoading]);

// Auto-scroll on new message (if already at bottom)
useEffect(() => {
  if (scrollContainerRef.current) {
    const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current;
    const isAtBottom = scrollHeight - scrollTop - clientHeight < 100;

    if (isAtBottom) {
      scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight;
    }
  }
}, [messages.length]);
```

**Layout Structure:**
```tsx
<div className="flex-1 overflow-hidden relative bg-white">
  {/* Loading spinner at top when loading more */}
  {isLoadingMore && (
    <div className="absolute top-2 left-1/2 -translate-x-1/2 z-10">
      <div className="flex items-center gap-2 bg-white border-2 border-gray-200 rounded-lg px-3 py-2 shadow-construction">
        <Loader2 className="h-4 w-4 animate-spin text-construction-blue" />
        <span className="text-xs font-medium text-gray-600">Loading...</span>
      </div>
    </div>
  )}

  {/* Scrollable container */}
  <div
    ref={scrollContainerRef}
    onScroll={handleScroll}
    className="h-full overflow-y-auto px-4 py-4"
  >
    {isLoading ? (
      <MessageListSkeleton />
    ) : (
      <div
        style={{
          height: `${rowVirtualizer.getTotalSize()}px`,
          position: 'relative',
        }}
      >
        {rowVirtualizer.getVirtualItems().map((virtualItem) => {
          const message = messages[virtualItem.index];
          const isFirstUnread = virtualItem.index === firstUnreadIndex;

          return (
            <div
              key={virtualItem.key}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                transform: `translateY(${virtualItem.start}px)`,
              }}
            >
              {/* "New Messages" divider */}
              {isFirstUnread && (
                <div className="flex items-center gap-2 my-4">
                  <div className="flex-1 h-px bg-construction-red" />
                  <span className="text-xs font-bold text-construction-red uppercase tracking-wide">
                    New Messages
                  </span>
                  <div className="flex-1 h-px bg-construction-red" />
                </div>
              )}

              <MessageItem
                message={message}
                ref={rowVirtualizer.measureElement}
              />
            </div>
          );
        })}
      </div>
    )}
  </div>
</div>
```

**Icons:**
- Loading: `Loader2` from Lucide

---

### 6. MessageItem

**File:** `components/chat/MessageItem.tsx`

**Props Interface:**
```typescript
interface MessageItemProps {
  message: MessageWithSender;
  onReply?: (message: MessageWithSender) => void;
  onEdit?: (message: MessageWithSender) => void;
  onDelete?: (messageId: string) => void;
}
```

**State Management:**
```typescript
const [showActions, setShowActions] = useState(false);
const [session, setSession] = useState<Session | null>(null);

useEffect(() => {
  async function loadSession() {
    const s = await auth();
    setSession(s);
  }
  loadSession();
}, []);

const isOwnMessage = session?.user?.id === message.sender_id;
```

**Layout Structure:**
```tsx
<div
  className="group relative py-2"
  onMouseEnter={() => setShowActions(true)}
  onMouseLeave={() => setShowActions(false)}
>
  {/* Deleted message placeholder */}
  {message.deleted_at ? (
    <div className="flex items-center gap-2 py-2 px-3 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
      <Ban className="h-4 w-4 text-gray-400" />
      <span className="text-sm text-gray-500 italic">This message was deleted</span>
    </div>
  ) : (
    <div className="flex gap-3">
      {/* Avatar */}
      <Avatar className="h-10 w-10 shrink-0">
        <AvatarImage src={message.sender.avatar_url || undefined} />
        <AvatarFallback className="bg-construction-blue/10 text-construction-blue text-xs font-bold">
          {getInitials(message.sender.name)}
        </AvatarFallback>
      </Avatar>

      {/* Content */}
      <div className="flex-1 min-w-0">
        {/* Header: Sender name + Timestamp + Edited indicator */}
        <div className="flex items-baseline gap-2 mb-1">
          <span className="text-sm font-bold text-gray-900">
            {message.sender.name}
          </span>
          <span className="text-xs text-gray-500">
            {formatMessageTime(message.created_at)}
          </span>
          {message.edited_at && (
            <span className="text-xs text-gray-400 italic">(edited)</span>
          )}
        </div>

        {/* Reply-to preview (if replying to another message) */}
        {message.reply_to && (
          <div className="mb-2 pl-3 border-l-4 border-construction-blue/30 bg-gray-50 rounded-r-md p-2">
            <div className="flex items-center gap-1 mb-1">
              <Reply className="h-3 w-3 text-construction-blue" />
              <span className="text-xs font-medium text-construction-blue">
                {message.reply_to.sender.name}
              </span>
            </div>
            <p className="text-xs text-gray-600 line-clamp-2">
              {message.reply_to.content}
            </p>
          </div>
        )}

        {/* Message content */}
        <div className="text-sm text-gray-700 whitespace-pre-wrap break-words">
          {message.content}
        </div>
      </div>

      {/* Hover actions menu */}
      <div className={cn(
        "absolute top-1 right-2 flex items-center gap-1 bg-white border-2 border-gray-200 rounded-lg shadow-construction p-1 transition-opacity",
        showActions ? "opacity-100" : "opacity-0 pointer-events-none"
      )}>
        <button
          onClick={() => onReply?.(message)}
          className="p-1.5 hover:bg-gray-100 rounded transition-colors"
          title="Reply"
        >
          <Reply className="h-4 w-4 text-gray-600" />
        </button>
        <button
          className="p-1.5 hover:bg-gray-100 rounded transition-colors"
          title="Copy"
        >
          <Copy className="h-4 w-4 text-gray-600" />
        </button>
        {isOwnMessage && (
          <>
            <button
              onClick={() => onEdit?.(message)}
              className="p-1.5 hover:bg-gray-100 rounded transition-colors"
              title="Edit"
            >
              <Pencil className="h-4 w-4 text-gray-600" />
            </button>
            <button
              onClick={() => onDelete?.(message.id)}
              className="p-1.5 hover:bg-red-100 rounded transition-colors"
              title="Delete"
            >
              <Trash2 className="h-4 w-4 text-red-600" />
            </button>
          </>
        )}
      </div>
    </div>
  )}
</div>
```

**Helper Functions:**
```typescript
// Format message time (9:45 AM, Yesterday at 3:00 PM, Dec 15 at 2:30 PM)
const formatMessageTime = (timestamp: string) => {
  const date = new Date(timestamp);
  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();

  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const isYesterday = date.toDateString() === yesterday.toDateString();

  const timeStr = date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });

  if (isToday) return timeStr;
  if (isYesterday) return `Yesterday at ${timeStr}`;

  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  }) + ` at ${timeStr}`;
};

const getInitials = (name: string) => {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
};
```

**Icons:**
- Reply: `Reply` from Lucide
- Copy: `Copy` from Lucide
- Edit: `Pencil` from Lucide
- Delete: `Trash2` from Lucide
- Deleted: `Ban` from Lucide

---

### 7. MessageInput

**File:** `components/chat/MessageInput.tsx`

**Props Interface:**
```typescript
interface MessageInputProps {
  chatRoomId: string;
  replyTo?: MessageWithSender | null;
  onCancelReply?: () => void;
}
```

**State Management:**
```typescript
const [content, setContent] = useState('');
const [isSending, setIsSending] = useState(false);
const textareaRef = useRef<HTMLTextAreaElement>(null);
```

**Auto-Resize Textarea:**
```typescript
useEffect(() => {
  if (textareaRef.current) {
    // Reset height to auto to get accurate scrollHeight
    textareaRef.current.style.height = 'auto';

    // Calculate new height (min 1 row, max 5 rows)
    const lineHeight = 24; // 1.5rem
    const minHeight = lineHeight;
    const maxHeight = lineHeight * 5;
    const scrollHeight = textareaRef.current.scrollHeight;

    const newHeight = Math.min(Math.max(scrollHeight, minHeight), maxHeight);
    textareaRef.current.style.height = `${newHeight}px`;
  }
}, [content]);
```

**Send Message Handler:**
```typescript
const handleSend = async () => {
  if (!content.trim() || isSending) return;

  setIsSending(true);

  const formData = new FormData();
  formData.append('chatRoomId', chatRoomId);
  formData.append('content', content.trim());
  if (replyTo) {
    formData.append('replyToId', replyTo.id);
  }

  const result = await sendMessage(formData);

  if (result.success) {
    setContent('');
    onCancelReply?.();
    // Focus back on input
    textareaRef.current?.focus();
  } else {
    toast.error(result.error || 'Failed to send message');
  }

  setIsSending(false);
};

const handleKeyDown = (e: React.KeyboardEvent) => {
  // Send on Enter (without Shift)
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    handleSend();
  }
  // Shift+Enter adds newline (default behavior)
};
```

**Layout Structure:**
```tsx
<div className="border-t border-gray-200 bg-white p-4">
  {/* Reply-to preview */}
  {replyTo && (
    <div className="mb-2 flex items-start gap-2 bg-gray-50 border-l-4 border-construction-blue rounded-r-md p-2">
      <div className="flex-1">
        <div className="flex items-center gap-1 mb-1">
          <Reply className="h-3 w-3 text-construction-blue" />
          <span className="text-xs font-medium text-construction-blue">
            Replying to {replyTo.sender.name}
          </span>
        </div>
        <p className="text-xs text-gray-600 line-clamp-2">
          {replyTo.content}
        </p>
      </div>
      <button
        onClick={onCancelReply}
        className="p-1 hover:bg-gray-200 rounded transition-colors"
      >
        <X className="h-4 w-4 text-gray-500" />
      </button>
    </div>
  )}

  {/* Input area */}
  <div className="flex items-end gap-2">
    {/* Attachment button (placeholder for Phase 2) */}
    <button
      className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-500"
      title="Attach file (coming soon)"
      disabled
    >
      <Paperclip className="h-5 w-5" />
    </button>

    {/* Textarea */}
    <div className="flex-1 relative">
      <textarea
        ref={textareaRef}
        value={content}
        onChange={(e) => setContent(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Type a message..."
        className={cn(
          "w-full resize-none rounded-lg border-2 border-gray-200 px-3 py-2",
          "focus:border-construction-blue focus:outline-none",
          "placeholder:text-gray-400 text-sm",
          "transition-colors"
        )}
        rows={1}
        style={{ minHeight: '40px', maxHeight: '120px' }}
      />
      {/* Character count (optional) */}
      <div className="absolute bottom-1 right-2 text-[10px] text-gray-400">
        {content.length}/10000
      </div>
    </div>

    {/* Send button */}
    <button
      onClick={handleSend}
      disabled={!content.trim() || isSending}
      className={cn(
        "p-2.5 rounded-lg transition-all",
        content.trim() && !isSending
          ? "bg-construction-blue hover:bg-blue-700 text-white"
          : "bg-gray-200 text-gray-400 cursor-not-allowed"
      )}
    >
      {isSending ? (
        <Loader2 className="h-5 w-5 animate-spin" />
      ) : (
        <Send className="h-5 w-5" />
      )}
    </button>
  </div>

  {/* Helper text */}
  <p className="text-xs text-gray-500 mt-2">
    Press Enter to send, Shift+Enter for new line
  </p>
</div>
```

**Icons:**
- Reply: `Reply` from Lucide
- Cancel: `X` from Lucide
- Attachment: `Paperclip` from Lucide
- Send: `Send` from Lucide
- Loading: `Loader2` from Lucide

---

## Styling Approach

### Tailwind Classes

**Primary Colors:**
```css
bg-construction-blue (#001B51)
text-construction-blue
border-construction-blue
hover:bg-blue-700
```

**Accent Colors:**
```css
bg-construction-accent (#3C3C3C)
bg-construction-accent/10 (hover states)
border-construction-accent
```

**Semantic Colors:**
```css
bg-construction-red (unread divider, error states)
bg-construction-green (success states)
text-gray-900 (primary text)
text-gray-600 (secondary text)
text-gray-500 (muted text, timestamps)
```

**Shadows:**
```css
shadow-construction (cards, buttons)
shadow-construction-lg (elevated elements)
```

### Typography

```css
text-lg font-bold (headers)
text-sm font-bold (sender names, active rooms)
text-sm font-medium (room names)
text-sm (message content)
text-xs (timestamps, metadata)
text-[10px] (badges, micro text)
```

### Spacing

```css
p-4 (container padding)
p-3 (item padding)
gap-2, gap-3 (flex gaps)
mb-1, mb-2 (vertical spacing)
```

---

## Responsive Design

### Breakpoints

```
Mobile: < 768px (md)
Tablet/Desktop: >= 768px (md)
```

### Mobile Behavior

**Room List View:**
- Full screen room list
- Tap room → hide list, show messages

**Message View:**
- Back button in header (top left)
- Full screen messages + input
- Back → hide messages, show room list

### Desktop Behavior

**Split View:**
- 300px sidebar (always visible)
- Flexible main area (always visible)
- No back button needed

### Responsive Classes

```tsx
// Sidebar
className="md:w-[300px] md:flex w-full"

// Mobile conditional rendering
className={cn(
  isMobileSidebarOpen ? "flex" : "hidden md:flex"
)}

// Text sizes
className="text-xs md:text-sm"

// Padding
className="p-3 md:p-4"
```

---

## Dependencies

### Required Packages

```bash
pnpm add @tanstack/react-virtual
```

### Already Available

- `framer-motion` - Animations
- `lucide-react` - Icons
- `@radix-ui/react-avatar` - Avatar component
- `sonner` - Toast notifications

---

## Construction Theme Integration

### Colors

- **Primary:** `#001B51` (Navy Blue) - Active states, primary actions
- **Accent:** `#3C3C3C` (Dark Gray) - Secondary elements, hover states
- **Success:** `#059669` (Green) - Success states
- **Error:** `#DC2626` (Red) - Error states, unread dividers

### Icons (Lucide)

- `MessageSquare`, `MessageCircle` - Chat related
- `Building2` - Project rooms
- `Send` - Send message
- `Reply` - Reply to message
- `Paperclip` - Attachments
- `BellOff` - Muted rooms
- `Loader2` - Loading states
- `ArrowLeft` - Back navigation
- `X` - Close/Cancel
- `Copy`, `Pencil`, `Trash2`, `Ban` - Message actions

### Design Patterns

- Industrial stamped metal badges (from TaskCard reference)
- Construction-themed shadows (`shadow-construction`)
- Bold uppercase labels for sections
- 2px borders for emphasis
- Gradient backgrounds for active states

---

## Important Notes

### Debug Comments

Add debug comments for all major features:

```tsx
// Debug: Auto-resize textarea on content change
// Debug: Infinite scroll - load older messages on scroll up
// Debug: Mark messages as read on room select
// Debug: Mobile sidebar toggle logic
```

### Console Logging

```typescript
console.log('[ChatLayout] Active room changed:', activeRoomId);
console.log('[MessageList] Loading messages for room:', chatRoomId);
console.log('[MessageInput] Sending message, length:', content.length);
```

### Performance Considerations

- **Virtualization:** MessageList uses `@tanstack/react-virtual` for efficient rendering
- **Memoization:** Use `useMemo` for expensive computations (sorting, filtering)
- **Debouncing:** Consider debouncing search input (Phase 2)
- **Optimistic Updates:** Update UI before server response for better UX

### Accessibility

- **ARIA labels:** Add to all interactive elements
- **Keyboard navigation:** Tab through rooms, Shift+Tab back
- **Screen reader support:** Announce new messages
- **Focus management:** Focus input after sending message

### Real-time (Phase 2)

- Current implementation is static (no real-time updates)
- Task 0004 will add Supabase Realtime subscriptions
- Components are designed to support real-time updates via state updates

---

## Next Steps (After Implementation)

1. **frontend-builder** implements components following this plan
2. **code-reviewer** reviews implementation for:
   - Construction theme adherence
   - Responsive design correctness
   - Performance optimizations
   - Accessibility compliance
3. Test on mobile devices (Chrome DevTools mobile emulation)
4. Prepare for Task 0004 (Supabase Realtime integration)

---

## File Summary

| File | Lines (est.) | Complexity |
|------|-------------|------------|
| `app/app/chat/page.tsx` | ~50 | Low |
| `components/chat/ChatLayout.tsx` | ~150 | Medium |
| `components/chat/ChatRoomList.tsx` | ~100 | Low |
| `components/chat/ChatRoomItem.tsx` | ~120 | Low |
| `components/chat/MessageList.tsx` | ~200 | High |
| `components/chat/MessageItem.tsx` | ~150 | Medium |
| `components/chat/MessageInput.tsx` | ~120 | Medium |
| **Total** | ~890 | Medium-High |

---

**Plan created:** 2025-12-30
**Ready for implementation by frontend-builder**
