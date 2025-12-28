We are building a next js project based on an existing next js template that have auth, payment built already, below are rules you have to follow:

<frontend rules>
1. MUST Use 'use client' directive for client-side components; In Next.js, page components are server components by default, and React hooks like useEffect can only be used in client components.
2. The UI has to look great, using polished component from aceternity, tailwind when possible; Don't recreate aceternity components, make sure you use 'aceternity@latest add xxx' CLI to add components
3. MUST adding debugging log & comment for every single feature we implement
4. Make sure to concatenate strings correctly using backslash
7. Use stock photos from picsum.photos where appropriate, only valid URLs you know exist
8. Don't update aceternity components unless otherwise specified
9. Configure next.config.js image remotePatterns to enable stock photos from picsum.photos
11. MUST implement the navigation elements items in their rightful place i.e. Left sidebar, Top header
12. Accurately implement necessary grid layouts
13. Follow proper import practices:
   - Use @/ path aliases
   - Keep component imports organized
   - Update current src/app/page.tsx with new comprehensive code
   - Don't forget root route (page.tsx) handling
   - You MUST complete the entire prompt before stopping
</frontend rules>

<styling_requirements>
- You ALWAYS tries to use the aceternity/ui library.
- You MUST USE the builtin Tailwind CSS variable based colors as used in the examples, like bg-primary or text-primary-foreground.
- You DOES NOT use indigo or blue colors unless specified in the prompt.
- You MUST generate responsive designs.
- The React Code Block is rendered on top of a white background. If v0 needs to use a different background color, it uses a wrapper element with a background color Tailwind class.
</styling_requirements>

<frameworks_and_libraries>
- You prefers Lucide React for icons, and aceternity/ui for components.
- You MAY use other third-party libraries if necessary or requested by the user.
- You imports the aceternity/ui components from "@/components/ui"
- You DOES NOT use fetch or make other network requests in the code.
- You DOES NOT use dynamic imports or lazy loading for components or libraries. Ex: const Confetti = dynamic(...) is NOT allowed. Use import Confetti from 'react-confetti' instead.
- Prefer using native Web APIs and browser features when possible. For example, use the Intersection Observer API for scroll-based animations or lazy loading.
</frameworks_and_libraries>

# GenHub Feature Implementation Guide: Communication System (Chat + KakaoTalk Integration)

---

## Task

Implement a **real-time chat system** for GenHub, supporting:
- Project/task chatrooms and DMs
- In-app messaging UI (list, chat window, attachments)
- KakaoTalk account linking and message sync
- Notifications for new messages

---

## Implementation Guide

### 1. **Database Preparation**

#### a. **Tables Required**

- **chatroom**
  - `id` (uuid, pk)
  - `type` (enum: 'project', 'task', 'dm')
  - `name` (text, nullable)
  - `project_id` (int, nullable)
  - `task_id` (int, nullable)
  - `created_by` (uuid, user)
  - `created_at` (timestamp)
- **chatroom_participant**
  - `id` (uuid, pk)
  - `chatroom_id` (uuid, fk)
  - `user_id` (uuid, fk)
  - `joined_at` (timestamp)
- **message**
  - `id` (uuid, pk)
  - `chatroom_id` (uuid, fk)
  - `sender_id` (uuid, fk)
  - `content` (text)
  - `attachments` (jsonb, nullable)
  - `created_at` (timestamp)
  - `kakao_message_id` (text, nullable) // for Kakao sync
- **kakao_account**
  - `id` (uuid, pk)
  - `user_id` (uuid, fk)
  - `kakao_user_id` (text)
  - `access_token` (text)
  - `refresh_token` (text)
  - `linked_at` (timestamp)

**Constraints:**
- All chat data must be RLS-protected: only participants can read/write messages in a chatroom.
- Kakao account table is only for users who link their KakaoTalk.

---

### 2. **Supabase Integration**

#### a. **Client Setup**

- Use `/utils/supabase/client.ts` for all chat data fetching/mutations in the browser.
- Use `/utils/supabase/server.ts` for server actions (e.g., Kakao webhook, admin sync).

#### b. **Realtime Subscriptions**

- Use Supabase Realtime to subscribe to new messages in chatrooms the user is a participant of.
- Example:
  ```typescript
  const supabase = await getSupabaseClient();
  const channel = supabase
    .channel('chatroom-messages')
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'message', filter: `chatroom_id=eq.${chatroomId}` }, payload => {
      // handle new message
    })
    .subscribe();
  ```

- **Debug log:**  
  - Log all subscription events:  
    `console.debug('[Chat] New message received:', payload);`
  - Log errors:  
    `console.error('[Chat] Subscription error:', error);`

---

### 3. **UI Implementation**

#### a. **Chat List Page (`/app/chat/page.tsx`)**

- **Sidebar/List:**  
  - Use aceternity/ui `List` or `NavigationMenu` for chatrooms.
  - Show unread badge (count of unread messages).
  - Use Lucide icons for chatroom type (project, task, DM).
  - Responsive: collapses to icons on mobile.

- **Debug log:**  
  - Log chatroom fetch:  
    `console.debug('[Chat] Loaded chatrooms:', chatrooms);`
  - Log unread count calculation.

#### b. **Chat Window**

- **Main Area:**  
  - Use aceternity/ui `Card` for chat window.
  - Message bubbles:  
    - Use aceternity/ui `Card` or custom bubble, align left/right by sender.
    - Show sender avatar (use user avatar), name, timestamp.
    - Attachments: show Lucide paperclip icon, preview image/file if present.
  - Input:  
    - aceternity/ui `Textarea` for message input.
    - Lucide icons for send, attach file.
    - On send, optimistic UI update (show message immediately, mark as pending if needed).

- **Debug log:**  
  - Log message send attempt:  
    `console.debug('[Chat] Sending message:', { content, attachments });`
  - Log send success/failure:  
    `console.info('[Chat] Message sent:', message);`  
    `console.error('[Chat] Message send failed:', error);`

#### c. **Chat in Project/Task Detail**

- Add a "Chat" tab in project/task detail pages.
- Reuse chat window component, filtered to the relevant chatroom.

#### d. **DMs**

- Allow user to start a DM with any team member.
- If DM chatroom does not exist, create it on demand.

---

### 4. **KakaoTalk Integration**

#### a. **Account Linking (Settings Page)**

- Add a "Connect KakaoTalk" button in `/app/settings/page.tsx`.
- On click, start OAuth flow (see `utils/kakao.ts`).
- On success, store tokens in `kakao_account` table.
- Show linked status (green badge if linked, red if not).

- **Debug log:**  
  - Log OAuth start/finish:  
    `console.debug('[Kakao] OAuth started');`  
    `console.info('[Kakao] Account linked:', kakaoUserId);`  
    `console.error('[Kakao] OAuth error:', error);`

#### b. **Message Sync (Webhook/API)**

- Set up a webhook endpoint in `/app/api/chat/kakao/` to receive KakaoTalk messages.
- On new Kakao message:
  - Find linked user by `kakao_user_id`.
  - Insert message into the correct chatroom (or create if needed).
  - Mark message as from Kakao (set `kakao_message_id`).
- On new in-app message:
  - If user has Kakao linked, send message to KakaoTalk via API (see `utils/kakao.ts`).

- **Debug log:**  
  - Log all webhook events:  
    `console.debug('[Kakao] Webhook received:', payload);`
  - Log sync success/failure:  
    `console.info('[Kakao] Message synced to chatroom:', messageId);`  
    `console.error('[Kakao] Sync error:', error);`

#### c. **Sync Status UI**

- In chat window, show Kakao sync status (icon + tooltip).
- If sync error, show warning badge.

---

### 5. **Notifications**

- On new message (in-app or via Kakao), trigger notification:
  - In-app: show badge on header bell, popover with unread messages.
  - Optionally, send email/push/Kakao notification (if enabled in user settings).

- **Debug log:**  
  - Log notification trigger:  
    `console.debug('[Chat] Notification triggered for message:', messageId);`

---

### 6. **Access Control & RLS**

- All chatroom/message queries must use the authenticated Supabase client.
- Only participants can read/write in a chatroom.
- DMs: only the two users can access.
- Project/task chatrooms: only project/task team members can access.

---

### 7. **Component/Folder Structure**

- `components/chat/`
  - `ChatRoomList.tsx` (sidebar/list)
  - `ChatWindow.tsx` (main chat UI)
  - `MessageBubble.tsx`
  - `KakaoSyncStatus.tsx`
- `app/app/chat/page.tsx` (main chat page)
- `app/app/projects/[id]/ChatTab.tsx` (project chat tab)
- `app/app/tasks/[id]/ChatTab.tsx` (task chat tab)
- `utils/kakao.ts` (Kakao API helpers)
- `app/api/chat/kakao/route.ts` (webhook endpoint)

---

### 8. **Styling & Responsiveness**

- All UI must use aceternity/ui components.
- Use Tailwind variable colors (e.g., `bg-primary`, `text-primary-foreground`).
- Use Lucide icons for all actions/status.
- Responsive: chat list collapses on mobile, chat window adapts to screen size.
- Message bubbles: rounded, modern, with subtle shadow and color differentiation for sender/receiver.

---

### 9. **Debug Logging (Summary)**

- **All data fetches, mutations, and real-time events must log:**
  - What was attempted (action, params)
  - Success/failure (with error details)
  - Key state changes (e.g., unread count, sync status)
- Use `console.debug`, `console.info`, `console.error` as appropriate.
- Example:
  ```typescript
  console.debug('[Chat] Fetched messages:', messages);
  console.error('[Chat] Failed to fetch messages:', error);
  ```

---

## Example: Fetching Messages in a Chatroom

```typescript
import { getSupabaseClient } from '@/utils/supabase/client';

export async function fetchMessages(chatroomId: string) {
  const supabase = await getSupabaseClient();
  const { data, error } = await supabase
    .from('message')
    .select('*')
    .eq('chatroom_id', chatroomId)
    .order('created_at', { ascending: true });

  if (error) {
    console.error('[Chat] Failed to fetch messages:', error);
    return [];
  }
  console.debug('[Chat] Fetched messages:', data);
  return data;
}
```

---

## Constraints & Guidelines

- **Do not use fetch for Supabase data; always use the provided client.**
- **All UI must use aceternity/ui and Lucide icons.**
- **All chat and Kakao actions must be logged for debugging.**
- **All chat data must be RLS-protected.**
- **No blue/indigo colors unless specified.**
- **All components must be responsive and visually attractive.**

---

**This guide provides all necessary steps, constraints, and debug logging requirements for implementing the GenHub Communication System (Chat + KakaoTalk Integration) with zero ambiguity.**