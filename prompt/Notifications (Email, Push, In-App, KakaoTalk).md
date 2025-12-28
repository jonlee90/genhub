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

# GenHub PWA – Notifications Feature Implementation Guide

## Task
Implement a unified notifications system supporting in-app, email, push, and KakaoTalk channels.  
This includes:  
- In-app notification bell in the header with dropdown list  
- Notification settings page (enable/disable channels)  
- Notification API/actions for sending, storing, and marking as read  
- Debug logging at all key steps

---

## Implementation Steps

---

### 1. **Database Schema**

**Add/Update the following tables in Supabase:**

```sql
-- notifications table
create table notification (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references user(id),
  type text not null, -- 'task', 'bid', 'expense', etc.
  channel text[] not null, -- e.g. ['in-app', 'email', 'push', 'kakao']
  content text not null,
  link text, -- URL to open when clicked
  read boolean default false,
  created_at timestamp with time zone default now()
);

-- user_notification_preferences table
create table user_notification_preference (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references user(id) unique,
  in_app boolean default true,
  email boolean default true,
  push boolean default false,
  kakao boolean default false,
  created_at timestamp with time zone default now()
);
```

**Constraints:**
- Each notification is per-user (not global).
- Preferences are per-user, one row per user.

---

### 2. **API & Server Actions**

**Create/Update the following files:**

- `app/actions/notifications.ts`
- `app/api/notifications/route.ts`
- `app/api/notifications/[id]/read/route.ts`
- `app/api/notifications/send/route.ts`

**Tasks:**

#### a. **Notification Creation Utility**

- Add a function to `app/actions/notifications.ts`:
  - Accepts: `userId`, `type`, `content`, `link`, `channels`
  - Checks user preferences (from `user_notification_preference`)
  - Inserts notification row for in-app
  - Triggers email/push/KakaoTalk via respective utils if enabled

**Example:**
```typescript
// app/actions/notifications.ts
import { createSupabaseAdminClient } from '@/utils/supabase/server'
import { sendEmailNotification } from '@/utils/mail'
import { sendPushNotification } from '@/utils/pwa'
import { sendKakaoNotification } from '@/utils/kakao'

export async function sendNotification({
  userId, type, content, link, channels
}: {
  userId: string,
  type: string,
  content: string,
  link?: string,
  channels: string[]
}) {
  const supabase = await createSupabaseAdminClient()
  console.log('[NOTIFY] Checking user preferences for', userId)
  const { data: prefs } = await supabase
    .from('user_notification_preference')
    .select('*')
    .eq('user_id', userId)
    .single()
  if (!prefs) {
    console.log('[NOTIFY] No preferences found, using defaults')
  }
  // Insert in-app notification
  if (channels.includes('in-app') && (prefs?.in_app ?? true)) {
    const { error } = await supabase.from('notification').insert({
      user_id: userId, type, channel: channels, content, link
    })
    if (error) console.log('[NOTIFY] Failed to insert in-app notification', error)
    else console.log('[NOTIFY] In-app notification sent to', userId)
  }
  // Email
  if (channels.includes('email') && (prefs?.email ?? true)) {
    await sendEmailNotification({ userId, type, content, link })
    console.log('[NOTIFY] Email notification sent to', userId)
  }
  // Push
  if (channels.includes('push') && (prefs?.push ?? false)) {
    await sendPushNotification({ userId, type, content, link })
    console.log('[NOTIFY] Push notification sent to', userId)
  }
  // KakaoTalk
  if (channels.includes('kakao') && (prefs?.kakao ?? false)) {
    await sendKakaoNotification({ userId, type, content, link })
    console.log('[NOTIFY] KakaoTalk notification sent to', userId)
  }
}
```
- **Add debug logs** at each step for traceability.

#### b. **API Endpoints**

- `GET /api/notifications/` – List notifications for current user (unread first, then recent)
- `POST /api/notifications/[id]/read` – Mark notification as read
- `POST /api/notifications/send` – (Admin/internal) Send notification to user(s)

**Constraints:**
- All endpoints must check user auth (reuse existing auth utilities).
- Only allow users to access their own notifications.

---

### 3. **Frontend Components**

#### a. **Notification Bell in Header**

- Update `components/app/Header.tsx`:
  - Add a Lucide `Bell` icon button (aceternity/ui `Button` or `PopoverTrigger`)
  - Show unread count badge (red, rounded, `bg-primary`)
  - On click, open aceternity/ui `Popover` with notification list

**Example:**
```tsx
import { Bell } from "lucide-react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Badge } from "@/components/ui/badge"

<Popover>
  <PopoverTrigger asChild>
    <button className="relative p-2 rounded-full hover:bg-muted transition">
      <Bell className="w-5 h-5 text-primary" />
      {unreadCount > 0 && (
        <Badge className="absolute -top-1 -right-1 bg-primary text-primary-foreground rounded-full px-1.5 py-0.5 text-xs">
          {unreadCount}
        </Badge>
      )}
    </button>
  </PopoverTrigger>
  <PopoverContent className="w-80 p-0">
    <NotificationList />
  </PopoverContent>
</Popover>
```

#### b. **Notification List Component**

- Create `components/notifications/NotificationList.tsx`
  - Fetch notifications for current user (use supabase browser client)
  - Show unread at top, then recent
  - Each item: icon (by type), content, time, "Mark as read" button
  - On click: mark as read, navigate to `link` if present
  - Show "No notifications" state if empty

**Constraints:**
- Use aceternity/ui `List`, `Button`, `Skeleton` for loading
- Responsive: popover adapts to mobile

#### c. **Notification Settings Page**

- Add `/app/settings/notifications/page.tsx`
  - Show toggles (aceternity/ui `Switch`) for each channel (in-app, email, push, KakaoTalk)
  - Save preferences to `user_notification_preference` table
  - Show current status (synced, error, etc.)
  - Add debug logs on save

**Example:**
```tsx
import { Switch } from "@/components/ui/switch"
<Switch checked={prefs.email} onCheckedChange={v => updatePref('email', v)} />
```

---

### 4. **Push & KakaoTalk Integration**

#### a. **Push Notifications**

- Use existing PWA service worker setup (`utils/pwa.ts`)
- On enabling push, register service worker and subscribe user
- Store push subscription in user profile or a new table
- Add debug logs for registration, errors

#### b. **KakaoTalk Notifications**

- Use `utils/kakao.ts` for sending messages
- On enabling, require user to link KakaoTalk account (OAuth or token)
- Store KakaoTalk user id/token in user profile
- Add debug logs for linking, sending

---

### 5. **Debug Logging**

- All server actions and API endpoints must log:
  - When a notification is created, sent, or failed (with user id, type, channel)
  - When user preferences are read/updated
  - When push/KakaoTalk/email is triggered (success/failure)
- All frontend actions must log:
  - When notifications are fetched, marked as read, or failed
  - When preferences are changed

**Example:**
```typescript
console.log('[NOTIFY] Marked notification as read', { notificationId, userId })
```

---

### 6. **Styling & UI**

- Use aceternity/ui for all components
- Use Tailwind variable colors:  
  - Notification bell: `text-primary`  
  - Badge: `bg-primary text-primary-foreground`  
  - Popover: `bg-popover`  
  - List items: `hover:bg-muted`
- Use Lucide icons for notification types (e.g., `CheckCircle` for success, `AlertCircle` for warnings)
- Responsive: Popover and settings page must work on mobile

---

## **Summary Table**

| Area                | File/Component                                      | Key Steps/Constraints                                  |
|---------------------|-----------------------------------------------------|--------------------------------------------------------|
| DB                  | `notification`, `user_notification_preference`      | Per-user, per-channel, with debug logs                 |
| Server Actions      | `app/actions/notifications.ts`                      | sendNotification utility, logs at each step            |
| API                 | `app/api/notifications/`                            | List, mark as read, send; auth-checked                 |
| Header UI           | `components/app/Header.tsx`                         | Bell icon, badge, popover                              |
| Notification List   | `components/notifications/NotificationList.tsx`     | Unread first, mark as read, click to open link         |
| Settings Page       | `/app/settings/notifications/page.tsx`              | Channel toggles, save prefs, debug logs                |
| Push/KakaoTalk      | `utils/pwa.ts`, `utils/kakao.ts`                    | Register, link, send, debug logs                       |
| Styling             | aceternity/ui, Tailwind variable colors                 | Responsive, beautiful, Lucide icons                    |
| Debug Logging       | All server/frontend actions                         | Log all key events, errors, and user actions           |

---

## **Developer Checklist**

- [ ] Add/verify DB tables for notifications and preferences
- [ ] Implement notification send utility with debug logs
- [ ] Create API endpoints for list, mark as read, send
- [ ] Update header with notification bell, badge, popover
- [ ] Build NotificationList component (unread, mark as read, click to open)
- [ ] Add notification settings page with channel toggles
- [ ] Integrate push and KakaoTalk (with debug logs)
- [ ] Use aceternity/ui, Tailwind variable colors, Lucide icons everywhere
- [ ] Ensure all actions log debug info for traceability

---

**All steps above are required for a robust, user-friendly, and debuggable notifications system.**  
**Do not skip debug logging at any step.**  
**All UI must be beautiful, responsive, and use aceternity/ui + Tailwind variable colors.**