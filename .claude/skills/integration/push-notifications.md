# Skill: Push Notifications

> FCM push notification patterns for GenHub PWA

## When to Use

- Task assignments
- Expense approvals
- Chat messages
- Deadline reminders
- Status updates

## Prerequisites

- Firebase project configured
- FCM credentials in environment
- Service worker for PWA

---

## Quick Reference

### Database Schema
```sql
-- Push subscriptions
push_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES next_auth.users(id) ON DELETE CASCADE,
  endpoint text NOT NULL,
  p256dh text NOT NULL,
  auth text NOT NULL,
  device_name text,
  created_at timestamptz DEFAULT now(),
  last_used_at timestamptz,

  UNIQUE(user_id, endpoint)
)

-- Notification preferences
notification_preferences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES next_auth.users(id) ON DELETE CASCADE,
  task_assigned boolean DEFAULT true,
  task_completed boolean DEFAULT true,
  expense_approved boolean DEFAULT true,
  chat_messages boolean DEFAULT true,
  daily_digest boolean DEFAULT false,

  UNIQUE(user_id)
)
```

---

## Server Actions

### Save Push Subscription
```typescript
// app/actions/push.ts
'use server'

import { createClient } from '@/utils/supabase/server'
import { auth } from '@/lib/auth'

export async function savePushSubscription(subscription: {
  endpoint: string
  keys: { p256dh: string; auth: string }
  deviceName?: string
}) {
  const session = await auth()
  if (!session?.user) return { error: 'Unauthorized' }

  const supabase = await createClient()

  const { error } = await supabase
    .from('push_subscriptions')
    .upsert({
      user_id: session.user.id,
      endpoint: subscription.endpoint,
      p256dh: subscription.keys.p256dh,
      auth: subscription.keys.auth,
      device_name: subscription.deviceName,
      last_used_at: new Date().toISOString(),
    }, {
      onConflict: 'user_id,endpoint',
    })

  if (error) return { error: error.message }
  return { success: true }
}
```

### Send Push Notification
```typescript
import webpush from 'web-push'

webpush.setVapidDetails(
  'mailto:' + process.env.VAPID_EMAIL,
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
)

export async function sendPushNotification(
  userId: string,
  notification: {
    title: string
    body: string
    icon?: string
    data?: Record<string, any>
    tag?: string
  }
) {
  const supabase = await createClient()

  // Check user preferences
  const { data: prefs } = await supabase
    .from('notification_preferences')
    .select('*')
    .eq('user_id', userId)
    .single()

  // Get all subscriptions for user
  const { data: subscriptions } = await supabase
    .from('push_subscriptions')
    .select('*')
    .eq('user_id', userId)

  if (!subscriptions?.length) return { sent: 0 }

  let sent = 0
  const failed: string[] = []

  for (const sub of subscriptions) {
    try {
      await webpush.sendNotification(
        {
          endpoint: sub.endpoint,
          keys: { p256dh: sub.p256dh, auth: sub.auth },
        },
        JSON.stringify({
          title: notification.title,
          body: notification.body,
          icon: notification.icon || '/icon-192x192.png',
          badge: '/badge.png',
          data: notification.data,
          tag: notification.tag,
        })
      )
      sent++
    } catch (err: any) {
      console.error('[Push Error]', err.statusCode, sub.endpoint)

      // Remove invalid subscription
      if (err.statusCode === 410 || err.statusCode === 404) {
        await supabase
          .from('push_subscriptions')
          .delete()
          .eq('id', sub.id)
        failed.push(sub.id)
      }
    }
  }

  return { sent, failed: failed.length }
}
```

### Notify on Task Assignment
```typescript
export async function notifyTaskAssigned(task: {
  id: string
  title: string
  assigneeId: string
  projectName: string
}) {
  await sendPushNotification(task.assigneeId, {
    title: 'New Task Assigned',
    body: `${task.title} in ${task.projectName}`,
    tag: `task-${task.id}`,
    data: {
      type: 'task_assigned',
      taskId: task.id,
      url: `/app/tasks/${task.id}`,
    },
  })
}
```

### Notify on Chat Message
```typescript
export async function notifyChatMessage(message: {
  roomId: string
  senderId: string
  senderName: string
  content: string
  recipientIds: string[]
}) {
  // Don't notify sender
  const recipients = message.recipientIds.filter(id => id !== message.senderId)

  for (const userId of recipients) {
    await sendPushNotification(userId, {
      title: message.senderName,
      body: message.content.substring(0, 100),
      tag: `chat-${message.roomId}`,
      data: {
        type: 'chat_message',
        roomId: message.roomId,
        url: `/app/chat/${message.roomId}`,
      },
    })
  }
}
```

---

## Client-Side Setup

### Service Worker
```typescript
// public/sw.js
self.addEventListener('push', function(event) {
  const data = event.data?.json() || {}

  const options = {
    body: data.body,
    icon: data.icon || '/icon-192x192.png',
    badge: data.badge || '/badge.png',
    tag: data.tag,
    data: data.data,
    actions: [
      { action: 'open', title: 'Open' },
      { action: 'dismiss', title: 'Dismiss' },
    ],
  }

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  )
})

self.addEventListener('notificationclick', function(event) {
  event.notification.close()

  if (event.action === 'dismiss') return

  const url = event.notification.data?.url || '/app'

  event.waitUntil(
    clients.matchAll({ type: 'window' }).then(windowClients => {
      // Focus existing window if open
      for (const client of windowClients) {
        if (client.url.includes('/app') && 'focus' in client) {
          client.navigate(url)
          return client.focus()
        }
      }
      // Otherwise open new window
      return clients.openWindow(url)
    })
  )
})
```

### Push Subscription Hook
```typescript
// lib/hooks/usePushNotifications.ts
'use client'

import { useState, useEffect } from 'react'
import { savePushSubscription } from '@/app/actions/push'

export function usePushNotifications() {
  const [isSupported, setIsSupported] = useState(false)
  const [isSubscribed, setIsSubscribed] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const checkSupport = async () => {
      const supported = 'serviceWorker' in navigator && 'PushManager' in window
      setIsSupported(supported)

      if (supported) {
        const registration = await navigator.serviceWorker.ready
        const subscription = await registration.pushManager.getSubscription()
        setIsSubscribed(!!subscription)
      }

      setIsLoading(false)
    }

    checkSupport()
  }, [])

  const subscribe = async () => {
    try {
      const registration = await navigator.serviceWorker.ready

      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
      })

      const result = await savePushSubscription({
        endpoint: subscription.endpoint,
        keys: {
          p256dh: arrayBufferToBase64(subscription.getKey('p256dh')!),
          auth: arrayBufferToBase64(subscription.getKey('auth')!),
        },
        deviceName: navigator.userAgent,
      })

      if (result.success) {
        setIsSubscribed(true)
        return { success: true }
      }

      return result
    } catch (err) {
      console.error('[Push Subscribe Error]', err)
      return { error: 'Failed to subscribe' }
    }
  }

  const unsubscribe = async () => {
    const registration = await navigator.serviceWorker.ready
    const subscription = await registration.pushManager.getSubscription()

    if (subscription) {
      await subscription.unsubscribe()
      setIsSubscribed(false)
    }
  }

  return { isSupported, isSubscribed, isLoading, subscribe, unsubscribe }
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  return btoa(String.fromCharCode(...new Uint8Array(buffer)))
}
```

### Notification Permission UI
```tsx
'use client'

import { Bell, BellOff } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { usePushNotifications } from '@/lib/hooks/usePushNotifications'

export function PushNotificationToggle() {
  const { isSupported, isSubscribed, isLoading, subscribe, unsubscribe } =
    usePushNotifications()

  if (!isSupported) return null

  const handleToggle = async () => {
    if (isSubscribed) {
      await unsubscribe()
      toast.success('Notifications disabled')
    } else {
      const result = await subscribe()
      if (result.success) {
        toast.success('Notifications enabled')
      } else {
        toast.error(result.error || 'Failed to enable notifications')
      }
    }
  }

  return (
    <Button
      variant="outline"
      onClick={handleToggle}
      disabled={isLoading}
    >
      {isSubscribed ? (
        <>
          <Bell className="w-4 h-4 mr-2" />
          Notifications On
        </>
      ) : (
        <>
          <BellOff className="w-4 h-4 mr-2" />
          Enable Notifications
        </>
      )}
    </Button>
  )
}
```

---

## Notification Triggers

### In Server Actions
```typescript
// After task assignment
export async function assignTask(taskId: string, assigneeId: string) {
  const supabase = await createClient()

  const { data: task, error } = await supabase
    .from('tasks')
    .update({ assignee_id: assigneeId })
    .eq('id', taskId)
    .select('title, project:projects(name)')
    .single()

  if (error) return { error: error.message }

  // Send notification
  await notifyTaskAssigned({
    id: taskId,
    title: task.title,
    assigneeId,
    projectName: task.project.name,
  })

  return { data: task }
}
```

---

## Anti-Patterns

```typescript
// WRONG: Sending too many notifications
// Batch or throttle
await Promise.all(users.map(u => sendPushNotification(u.id, ...)))

// BETTER: Use batch with delay
for (const user of users) {
  await sendPushNotification(user.id, ...)
  await new Promise(r => setTimeout(r, 100))  // Rate limit
}

// WRONG: Not respecting preferences
await sendPushNotification(userId, ...)  // Always sends

// CORRECT: Check preferences first
const prefs = await getNotificationPreferences(userId)
if (prefs.task_assigned) {
  await sendPushNotification(userId, ...)
}

// WRONG: Not cleaning up expired subscriptions
// Subscriptions can become invalid

// CORRECT: Remove on 410/404 errors (shown in sendPushNotification)
```

---

## Checklist

- [ ] Firebase/VAPID keys configured
- [ ] Service worker registered
- [ ] Push subscription saved to database
- [ ] User preferences respected
- [ ] Invalid subscriptions cleaned up
- [ ] Notification click handling
- [ ] Deep linking to relevant page
- [ ] Rate limiting for batch notifications
