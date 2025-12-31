# Push Notifications Setup Guide

This guide walks through setting up Firebase Cloud Messaging (FCM) for push notifications in GenHub PWA.

## Overview

GenHub uses Firebase Cloud Messaging (FCM) to send push notifications to users when they receive new chat messages while offline or when mentioned in a conversation.

### Features

- **Background Notifications**: Receive push notifications when the app is closed or in background
- **Foreground Notifications**: Show toast notifications when the app is open
- **PWA Badge Count**: Display unread message count on the app icon
- **Mute Support**: Respect room mute settings (except for @mentions)
- **Mention Overrides**: Always send notifications for @mentions, even in muted rooms
- **Multi-Device Support**: Users can register multiple devices (web, iOS, Android)

---

## Firebase Project Setup

### 1. Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add project"
3. Enter project name (e.g., "GenHub PWA")
4. Disable Google Analytics (optional)
5. Click "Create project"

### 2. Enable Cloud Messaging

1. In Firebase Console, go to **Project Settings** (gear icon)
2. Navigate to **Cloud Messaging** tab
3. Under "Web configuration", click "Generate key pair" for Web Push certificates
4. Copy the **VAPID Key** (you'll need this later)

### 3. Get Firebase Configuration

1. In Firebase Console, go to **Project Settings**
2. Scroll down to "Your apps" section
3. Click the **Web** icon (`</>`) to add a web app
4. Register app with nickname (e.g., "GenHub Web")
5. Copy the Firebase config object

Example:
```javascript
const firebaseConfig = {
  apiKey: "AIza...",
  authDomain: "genhub-pwa.firebaseapp.com",
  projectId: "genhub-pwa",
  storageBucket: "genhub-pwa.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abc123"
};
```

### 4. Get FCM Server Key (for Edge Function)

1. In Firebase Console, go to **Project Settings**
2. Navigate to **Cloud Messaging** tab
3. Under "Cloud Messaging API (Legacy)", find **Server key**
4. Copy the server key (starts with `AAAA...`)

> **Note**: If "Cloud Messaging API (Legacy)" is disabled, you need to enable it:
> - Click "Manage API in Google Cloud Console"
> - Enable "Cloud Messaging API"

---

## Environment Variables

Add the following environment variables to your `.env.local` file:

```bash
# Firebase Cloud Messaging (Push Notifications)
NEXT_PUBLIC_FIREBASE_API_KEY=your-firebase-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-firebase-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
NEXT_PUBLIC_FIREBASE_APP_ID=your-firebase-app-id
NEXT_PUBLIC_FIREBASE_VAPID_KEY=your-firebase-vapid-key

# FCM Server Key (for Edge Function)
FCM_SERVER_KEY=your-fcm-server-key
```

---

## Database Migration

Run the push subscriptions migration:

```bash
# Using MCP Supabase (recommended)
mcp__supabase__apply_migration name:"push_subscriptions" query:"$(cat supabase/migrations/030_push_subscriptions.sql)"

# Or manually in Supabase SQL Editor
# Copy contents of supabase/migrations/030_push_subscriptions.sql and execute
```

This creates:
- `push_subscriptions` table for storing FCM tokens
- `muted_until` column on `chat_participants` for muting rooms
- RLS policies for user-scoped access
- Indexes for performance

---

## Service Worker Configuration

The Firebase Messaging Service Worker is already configured in `public/firebase-messaging-sw.js`.

**Important**: Update the Firebase config placeholder values in the service worker file:

```javascript
// public/firebase-messaging-sw.js
const firebaseConfig = {
  apiKey: 'YOUR_ACTUAL_API_KEY',
  authDomain: 'YOUR_ACTUAL_AUTH_DOMAIN',
  projectId: 'YOUR_ACTUAL_PROJECT_ID',
  storageBucket: 'YOUR_ACTUAL_STORAGE_BUCKET',
  messagingSenderId: 'YOUR_ACTUAL_SENDER_ID',
  appId: 'YOUR_ACTUAL_APP_ID',
};
```

> **Note**: In production, consider using a build script to inject environment variables into the service worker.

---

## Deploy Supabase Edge Function

Deploy the `send-push-notification` Edge Function:

```bash
# Using Supabase CLI
supabase functions deploy send-push-notification

# Set secrets
supabase secrets set FCM_SERVER_KEY=your-fcm-server-key
```

Test the Edge Function:

```bash
curl -X POST 'https://your-project.supabase.co/functions/v1/send-push-notification' \
  -H 'Authorization: Bearer YOUR_ANON_KEY' \
  -H 'Content-Type: application/json' \
  -d '{
    "userId": "user-uuid",
    "title": "Test Notification",
    "body": "This is a test",
    "data": {
      "roomId": "room-uuid",
      "messageId": "message-uuid",
      "url": "/app/chat/room-uuid"
    }
  }'
```

---

## Client Implementation

### Request Push Permission

Use the `usePushNotifications` hook in your chat components:

```typescript
'use client';

import { usePushNotifications } from '@/lib/hooks/usePushNotifications';

export function ChatPage() {
  const { permission, requestPermission, isLoading } = usePushNotifications();

  const handleEnableNotifications = async () => {
    const granted = await requestPermission();
    if (granted) {
      console.log('Push notifications enabled!');
    }
  };

  return (
    <div>
      {permission !== 'granted' && (
        <button onClick={handleEnableNotifications} disabled={isLoading}>
          Enable Notifications
        </button>
      )}
    </div>
  );
}
```

### Badge Count

Use the `useBadgeCount` hook to show unread count on the app icon:

```typescript
'use client';

import { useBadgeCount } from '@/lib/hooks/useBadgeCount';
import { useSession } from 'next-auth/react';

export function AppLayout({ children }) {
  const { data: session } = useSession();

  // Auto-updates badge count based on unread messages
  useBadgeCount(session?.user?.id);

  return <div>{children}</div>;
}
```

---

## Testing

### Test Foreground Notifications

1. Open the app in a browser
2. Grant notification permission
3. Open DevTools Console
4. Send a test message from another account
5. You should see a toast notification

### Test Background Notifications

1. Close or minimize the app
2. Send a test message from another account
3. You should receive a browser notification
4. Click the notification to open the chat room

### Test Badge Count

1. Send messages to the user
2. Check the app icon badge (on mobile or PWA-installed browsers)
3. Open the chat room and verify the badge clears

---

## Troubleshooting

### No notifications received

1. **Check browser support**: Not all browsers support push notifications
   - ✅ Chrome, Edge, Firefox (desktop & Android)
   - ❌ Safari (iOS) - requires APNs, not FCM

2. **Check permission**: Ensure notification permission is granted
   ```javascript
   console.log(Notification.permission); // Should be "granted"
   ```

3. **Check service worker registration**:
   ```javascript
   navigator.serviceWorker.getRegistrations().then(console.log);
   ```

4. **Check FCM token**:
   ```javascript
   // In usePushNotifications hook, check the token state
   console.log(token); // Should be a long string
   ```

5. **Check Edge Function logs**:
   ```bash
   supabase functions logs send-push-notification
   ```

### "Messaging not supported" error

- Ensure you're using HTTPS (required for service workers)
- Check browser compatibility
- Verify Firebase config is correct

### Invalid FCM token

- FCM tokens can expire or become invalid
- The Edge Function automatically deletes invalid tokens
- User needs to re-register by granting permission again

---

## Security Notes

1. **Never expose FCM Server Key client-side** - Only use in Edge Functions or server-side code
2. **VAPID Key is public** - Safe to expose in client-side code
3. **RLS policies ensure users only manage their own subscriptions**
4. **Validate all push notification triggers server-side**

---

## Production Checklist

- [ ] Firebase project created and configured
- [ ] Environment variables set in production
- [ ] Service worker updated with actual Firebase config
- [ ] Database migration applied
- [ ] Edge Function deployed with secrets
- [ ] Push notifications tested on multiple devices
- [ ] Badge count verified on PWA
- [ ] Mute functionality tested
- [ ] @mention overrides verified

---

## Related Files

| File | Description |
|------|-------------|
| `lib/firebase.ts` | Firebase client SDK initialization |
| `lib/hooks/usePushNotifications.ts` | React hook for managing push notifications |
| `lib/hooks/useBadgeCount.ts` | React hook for badge count |
| `app/actions/push.ts` | Server actions for subscription management |
| `app/actions/chat.ts` | Push trigger integration in sendMessage |
| `public/firebase-messaging-sw.js` | Service worker for background notifications |
| `supabase/functions/send-push-notification/index.ts` | Edge Function for sending FCM messages |
| `supabase/migrations/030_push_subscriptions.sql` | Database migration |

---

For more information, refer to:
- [Firebase Cloud Messaging Documentation](https://firebase.google.com/docs/cloud-messaging)
- [Web Push Notifications](https://developer.mozilla.org/en-US/docs/Web/API/Push_API)
- [Service Workers](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)
