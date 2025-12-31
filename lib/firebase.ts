/**
 * Firebase Client SDK Configuration
 * Initializes Firebase app and messaging for push notifications
 */

import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getMessaging, Messaging, isSupported } from 'firebase/messaging';

// Firebase configuration from environment variables
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Debug: Log Firebase config (without sensitive data)
console.log('[Firebase] Initializing with project:', firebaseConfig.projectId);

// Initialize Firebase app (singleton pattern)
let firebaseApp: FirebaseApp;

if (!getApps().length) {
  firebaseApp = initializeApp(firebaseConfig);
  console.log('[Firebase] App initialized');
} else {
  firebaseApp = getApps()[0];
  console.log('[Firebase] Using existing app instance');
}

// Initialize Firebase Cloud Messaging (only in browser with support)
let messaging: Messaging | null = null;

// Check if running in browser and messaging is supported
if (typeof window !== 'undefined') {
  isSupported()
    .then((supported) => {
      if (supported) {
        messaging = getMessaging(firebaseApp);
        console.log('[Firebase] Messaging initialized');
      } else {
        console.warn('[Firebase] Messaging not supported in this browser');
      }
    })
    .catch((error) => {
      console.error('[Firebase] Error checking messaging support:', error);
    });
}

export { firebaseApp, messaging };
