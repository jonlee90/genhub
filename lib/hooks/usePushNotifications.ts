'use client';

import { useState, useEffect, useCallback } from 'react';
import { getToken, onMessage, MessagePayload } from 'firebase/messaging';
import { messaging } from '@/lib/firebase';
import { registerPushSubscription } from '@/app/actions/push';
import { toast } from 'sonner';

/**
 * React hook for managing push notifications
 * Handles permission requests, FCM token registration, and foreground messages
 */
export function usePushNotifications() {
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Debug: Check notification support on mount
  useEffect(() => {
    if (typeof window === 'undefined') {
      console.log('[usePushNotifications] Running on server, skipping');
      return;
    }

    if (!('Notification' in window)) {
      console.error('[usePushNotifications] Notifications not supported in this browser');
      setError('Notifications not supported in this browser');
      return;
    }

    // Get current permission status
    const currentPermission = Notification.permission;
    console.log('[usePushNotifications] Current permission:', currentPermission);
    setPermission(currentPermission);
  }, []);

  /**
   * Request notification permission from user and get FCM token
   * Stores subscription in database for push delivery
   */
  const requestPermission = useCallback(async () => {
    console.log('[usePushNotifications] Requesting permission...');

    // Check browser support
    if (typeof window === 'undefined' || !('Notification' in window)) {
      const errorMsg = 'Notifications not supported in this browser';
      console.error('[usePushNotifications]', errorMsg);
      toast.error(errorMsg);
      setError(errorMsg);
      return false;
    }

    // Check if already granted
    if (permission === 'granted') {
      console.log('[usePushNotifications] Permission already granted');
      return true;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Request permission
      const permissionResult = await Notification.requestPermission();
      console.log('[usePushNotifications] Permission result:', permissionResult);
      setPermission(permissionResult);

      if (permissionResult === 'granted') {
        // Check if messaging is available
        if (!messaging) {
          console.error('[usePushNotifications] Firebase Messaging not initialized');
          toast.error('Push notifications are not available');
          setError('Firebase Messaging not available');
          setIsLoading(false);
          return false;
        }

        // Get FCM token
        console.log('[usePushNotifications] Getting FCM token...');
        const vapidKey = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;

        if (!vapidKey) {
          console.error('[usePushNotifications] VAPID key not configured');
          toast.error('Push notifications are not properly configured');
          setError('VAPID key missing');
          setIsLoading(false);
          return false;
        }

        const fcmToken = await getToken(messaging, { vapidKey });

        if (fcmToken) {
          console.log('[usePushNotifications] FCM token received:', fcmToken.substring(0, 20) + '...');
          setToken(fcmToken);

          // Register subscription with backend
          console.log('[usePushNotifications] Registering subscription with backend...');
          const subscription = {
            endpoint: fcmToken,
            platform: 'web' as const,
            p256dh_key: fcmToken, // FCM uses token as endpoint
            auth_key: fcmToken,
            user_agent: navigator.userAgent,
          };

          const result = await registerPushSubscription(subscription);

          if ('error' in result) {
            console.error('[usePushNotifications] Failed to register subscription:', result.error);
            toast.error('Failed to enable push notifications');
            setError(result.error);
            setIsLoading(false);
            return false;
          }

          console.log('[usePushNotifications] Subscription registered successfully');
          toast.success('Push notifications enabled!');
          setIsLoading(false);
          return true;
        } else {
          console.error('[usePushNotifications] No FCM token received');
          toast.error('Failed to get notification token');
          setError('Failed to get FCM token');
          setIsLoading(false);
          return false;
        }
      } else {
        console.log('[usePushNotifications] Permission denied by user');
        toast.error('Notification permission denied');
        setError('Permission denied');
        setIsLoading(false);
        return false;
      }
    } catch (err) {
      console.error('[usePushNotifications] Error requesting permission:', err);
      const errorMsg = err instanceof Error ? err.message : 'Failed to enable push notifications';
      toast.error(errorMsg);
      setError(errorMsg);
      setIsLoading(false);
      return false;
    }
  }, [permission]);

  /**
   * Handle foreground messages (when app is open)
   * Shows toast notification instead of browser notification
   */
  useEffect(() => {
    if (!messaging) {
      console.log('[usePushNotifications] Messaging not available, skipping foreground handler');
      return;
    }

    console.log('[usePushNotifications] Setting up foreground message handler');

    const unsubscribe = onMessage(messaging, (payload: MessagePayload) => {
      console.log('[usePushNotifications] Foreground message received:', payload);

      // Extract notification data
      const title = payload.notification?.title || 'New message';
      const body = payload.notification?.body || '';
      const url = payload.data?.url;

      // Show toast notification for foreground messages
      toast(title, {
        description: body,
        action: url
          ? {
              label: 'View',
              onClick: () => {
                window.location.href = url;
              },
            }
          : undefined,
      });
    });

    return () => {
      console.log('[usePushNotifications] Cleaning up foreground message handler');
      unsubscribe();
    };
  }, []);

  return {
    permission,
    token,
    isLoading,
    error,
    requestPermission,
  };
}
