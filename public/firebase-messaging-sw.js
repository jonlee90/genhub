/**
 * Firebase Messaging Service Worker
 * Handles background push notifications when app is closed or in background
 */

// Import Firebase scripts
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js');

// Debug: Log service worker initialization
console.log('[Service Worker] Firebase Messaging SW initializing...');

// Firebase configuration (must match lib/firebase.ts)
// Note: These values will be replaced by environment variables during build
const firebaseConfig = {
  apiKey: 'NEXT_PUBLIC_FIREBASE_API_KEY',
  authDomain: 'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN',
  projectId: 'NEXT_PUBLIC_FIREBASE_PROJECT_ID',
  storageBucket: 'NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET',
  messagingSenderId: 'NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID',
  appId: 'NEXT_PUBLIC_FIREBASE_APP_ID',
};

// Initialize Firebase in service worker
try {
  firebase.initializeApp(firebaseConfig);
  console.log('[Service Worker] Firebase initialized');
} catch (error) {
  console.error('[Service Worker] Error initializing Firebase:', error);
}

// Get messaging instance
const messaging = firebase.messaging();

/**
 * Handle background messages
 * Displays notification when app is closed or in background
 */
messaging.onBackgroundMessage((payload) => {
  console.log('[Service Worker] Background message received:', payload);

  // Extract notification data
  const notificationTitle = payload.notification?.title || 'New message';
  const notificationBody = payload.notification?.body || '';

  // Extract custom data
  const roomId = payload.data?.roomId || '';
  const messageId = payload.data?.messageId || '';
  const url = payload.data?.url || '/app/chat';

  console.log('[Service Worker] Displaying notification:', {
    title: notificationTitle,
    body: notificationBody,
    url,
  });

  // Notification options
  const notificationOptions = {
    body: notificationBody,
    icon: '/icons/icon-192x192.png',
    badge: '/icons/badge-72x72.png',
    tag: `chat-${roomId}`, // Group notifications by room
    requireInteraction: false,
    vibrate: [200, 100, 200],
    data: {
      roomId,
      messageId,
      url,
    },
  };

  // Show notification
  return self.registration.showNotification(notificationTitle, notificationOptions);
});

/**
 * Handle notification click
 * Opens chat room when notification is clicked
 */
self.addEventListener('notificationclick', (event) => {
  console.log('[Service Worker] Notification clicked:', event.notification);

  // Close notification
  event.notification.close();

  // Get URL from notification data
  const urlToOpen = event.notification.data?.url || '/app/chat';

  console.log('[Service Worker] Opening URL:', urlToOpen);

  // Open URL or focus existing window
  event.waitUntil(
    clients
      .matchAll({
        type: 'window',
        includeUncontrolled: true,
      })
      .then((clientList) => {
        // Check if there's already a window open with this URL
        for (const client of clientList) {
          if (client.url === urlToOpen && 'focus' in client) {
            console.log('[Service Worker] Focusing existing window');
            return client.focus();
          }
        }

        // No matching window found, open new one
        if (clients.openWindow) {
          console.log('[Service Worker] Opening new window');
          return clients.openWindow(urlToOpen);
        }
      })
      .catch((error) => {
        console.error('[Service Worker] Error handling notification click:', error);
      })
  );
});

/**
 * Handle service worker activation
 */
self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Activated');
});

/**
 * Handle service worker installation
 */
self.addEventListener('install', (event) => {
  console.log('[Service Worker] Installing...');
  self.skipWaiting();
});

console.log('[Service Worker] Firebase Messaging SW loaded');
