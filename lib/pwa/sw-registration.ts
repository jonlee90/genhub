/**
 * P5.1 - Service Worker Registration
 * Client-side registration and update management
 */

'use client';

console.log('[SWRegistration] Module loaded');

let registration: ServiceWorkerRegistration | null = null;

/**
 * Register service worker
 */
export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  console.log('[SWRegistration] Registering service worker');

  // Check if service workers are supported
  if (!('serviceWorker' in navigator)) {
    console.warn('[SWRegistration] Service workers not supported');
    return null;
  }

  try {
    // Register the service worker
    registration = await navigator.serviceWorker.register('/service-worker.js', {
      scope: '/',
    });

    console.log('[SWRegistration] Service worker registered:', {
      scope: registration.scope,
      state: registration.active?.state,
    });

    // Listen for updates
    registration.addEventListener('updatefound', () => {
      console.log('[SWRegistration] Update found, installing new worker');

      const newWorker = registration!.installing;
      if (!newWorker) return;

      newWorker.addEventListener('statechange', () => {
        console.log('[SWRegistration] Worker state changed:', newWorker.state);

        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
          console.log('[SWRegistration] New worker installed, ready to activate');

          // Notify user that update is available
          if (typeof window !== 'undefined') {
            window.dispatchEvent(
              new CustomEvent('sw-update-available', {
                detail: { registration, newWorker },
              })
            );
          }
        }
      });
    });

    // Check for updates periodically (every 1 hour)
    setInterval(
      () => {
        console.log('[SWRegistration] Checking for updates');
        registration?.update();
      },
      60 * 60 * 1000
    );

    return registration;
  } catch (error) {
    console.error('[SWRegistration] Registration failed:', error);
    return null;
  }
}

/**
 * Unregister service worker
 */
export async function unregisterServiceWorker(): Promise<boolean> {
  console.log('[SWRegistration] Unregistering service worker');

  if (!registration) {
    console.warn('[SWRegistration] No registration to unregister');
    return false;
  }

  try {
    const success = await registration.unregister();
    console.log('[SWRegistration] Unregister result:', success);
    registration = null;
    return success;
  } catch (error) {
    console.error('[SWRegistration] Unregister failed:', error);
    return false;
  }
}

/**
 * Update service worker (skip waiting)
 */
export function updateServiceWorker(): void {
  console.log('[SWRegistration] Updating service worker');

  if (!registration?.waiting) {
    console.warn('[SWRegistration] No waiting worker to activate');
    return;
  }

  // Tell the waiting worker to skip waiting and activate
  registration.waiting.postMessage({ type: 'SKIP_WAITING' });

  // Reload the page when the new worker activates
  let refreshing = false;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (refreshing) return;
    refreshing = true;
    console.log('[SWRegistration] Controller changed, reloading page');
    window.location.reload();
  });
}

/**
 * Get current registration
 */
export function getServiceWorkerRegistration(): ServiceWorkerRegistration | null {
  return registration;
}

/**
 * Clear model cache (invalidate old versions)
 */
export async function clearModelCache(): Promise<boolean> {
  console.log('[SWRegistration] Clearing model cache');

  if (!registration?.active) {
    console.warn('[SWRegistration] No active service worker');
    return false;
  }

  try {
    return new Promise((resolve) => {
      const messageChannel = new MessageChannel();

      messageChannel.port1.onmessage = (event) => {
        console.log('[SWRegistration] Cache clear response:', event.data);
        resolve(event.data?.success || false);
      };

      registration!.active!.postMessage(
        { type: 'CLEAR_MODEL_CACHE' },
        [messageChannel.port2]
      );

      // Timeout after 5 seconds
      setTimeout(() => resolve(false), 5000);
    });
  } catch (error) {
    console.error('[SWRegistration] Failed to clear cache:', error);
    return false;
  }
}

/**
 * Clear all caches
 */
export async function clearAllCaches(): Promise<boolean> {
  console.log('[SWRegistration] Clearing all caches');

  if (!registration?.active) {
    console.warn('[SWRegistration] No active service worker');
    return false;
  }

  try {
    return new Promise((resolve) => {
      const messageChannel = new MessageChannel();

      messageChannel.port1.onmessage = (event) => {
        console.log('[SWRegistration] All caches clear response:', event.data);
        resolve(event.data?.success || false);
      };

      registration!.active!.postMessage(
        { type: 'CLEAR_ALL_CACHE' },
        [messageChannel.port2]
      );

      // Timeout after 5 seconds
      setTimeout(() => resolve(false), 5000);
    });
  } catch (error) {
    console.error('[SWRegistration] Failed to clear all caches:', error);
    return false;
  }
}

/**
 * Check if app is running in standalone mode (installed PWA)
 */
export function isStandalone(): boolean {
  if (typeof window === 'undefined') return false;

  const isStandalone =
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as any).standalone ||
    document.referrer.includes('android-app://');

  console.log('[SWRegistration] Standalone mode:', isStandalone);
  return isStandalone;
}

/**
 * Check if app is installable
 */
export function checkInstallability(): boolean {
  if (typeof window === 'undefined') return false;

  // Check if beforeinstallprompt event can fire
  const isInstallable = 'onbeforeinstallprompt' in window;

  console.log('[SWRegistration] Installable:', isInstallable);
  return isInstallable;
}
