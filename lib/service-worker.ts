/**
 * Service Worker Registration and Management
 *
 * Handles service worker lifecycle for GenHub PWA:
 * - Registration on app load
 * - Update detection and prompts
 * - Skip waiting and activation
 * - Unregistration helper
 *
 * @module lib/service-worker
 */

export type ServiceWorkerStatus =
  | 'unsupported'
  | 'registering'
  | 'registered'
  | 'updating'
  | 'updated'
  | 'error';

export interface ServiceWorkerState {
  status: ServiceWorkerStatus;
  registration?: ServiceWorkerRegistration;
  error?: Error;
}

export type ServiceWorkerCallback = (state: ServiceWorkerState) => void;

/**
 * Register the service worker
 *
 * @param onStateChange - Callback for status updates
 * @returns Promise that resolves to registration or null
 */
export async function registerServiceWorker(
  onStateChange?: ServiceWorkerCallback
): Promise<ServiceWorkerRegistration | null> {
  // Check if service workers are supported
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    console.warn('[SW] Service workers not supported');
    onStateChange?.({ status: 'unsupported' });
    return null;
  }

  // Only register in production
  if (process.env.NODE_ENV !== 'production') {
    console.log('[SW] Service worker disabled in development');
    return null;
  }

  try {
    onStateChange?.({ status: 'registering' });

    // Register the service worker
    const registration = await navigator.serviceWorker.register('/sw.js', {
      scope: '/',
    });

    console.log('[SW] Service worker registered successfully');
    onStateChange?.({ status: 'registered', registration });

    // Check for updates on load
    registration.update();

    // Listen for updates
    registration.addEventListener('updatefound', () => {
      const newWorker = registration.installing;

      if (!newWorker) {
        return;
      }

      console.log('[SW] New service worker found, installing...');
      onStateChange?.({ status: 'updating', registration });

      newWorker.addEventListener('statechange', () => {
        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
          // New service worker installed, ready to activate
          console.log('[SW] New service worker installed, waiting to activate');
          onStateChange?.({ status: 'updated', registration });
        }
      });
    });

    // Listen for controller change (new SW activated)
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      console.log('[SW] Service worker activated, reloading page...');
      window.location.reload();
    });

    return registration;
  } catch (error) {
    console.error('[SW] Service worker registration failed:', error);
    onStateChange?.({
      status: 'error',
      error: error instanceof Error ? error : new Error(String(error)),
    });
    return null;
  }
}

/**
 * Unregister all service workers
 *
 * @returns Promise that resolves when all SWs are unregistered
 */
export async function unregisterServiceWorker(): Promise<boolean> {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return false;
  }

  try {
    const registrations = await navigator.serviceWorker.getRegistrations();

    const results = await Promise.all(
      registrations.map((registration) => registration.unregister())
    );

    const allUnregistered = results.every((result) => result === true);

    if (allUnregistered) {
      console.log('[SW] All service workers unregistered');
    }

    return allUnregistered;
  } catch (error) {
    console.error('[SW] Failed to unregister service workers:', error);
    return false;
  }
}

/**
 * Skip waiting and activate new service worker immediately
 *
 * Call this when user accepts update prompt
 *
 * @param registration - Service worker registration
 */
export function skipWaiting(registration?: ServiceWorkerRegistration | null): void {
  if (!registration?.waiting) {
    console.warn('[SW] No waiting service worker to activate');
    return;
  }

  // Send message to waiting SW to skip waiting
  registration.waiting.postMessage({ type: 'SKIP_WAITING' });
  console.log('[SW] Skip waiting message sent');
}

/**
 * Clear all service worker caches
 *
 * Useful for troubleshooting or forcing fresh content
 *
 * @returns Promise that resolves when caches are cleared
 */
export async function clearServiceWorkerCache(): Promise<boolean> {
  if (typeof window === 'undefined' || !('caches' in window)) {
    return false;
  }

  try {
    // Get all cache names
    const cacheNames = await caches.keys();

    // Delete all GenHub caches
    const genHubCaches = cacheNames.filter((name) => name.startsWith('genhub-'));

    await Promise.all(genHubCaches.map((name) => caches.delete(name)));

    console.log('[SW] All caches cleared:', genHubCaches);

    // Also notify service worker to clear its caches
    if (navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({ type: 'CLEAR_CACHE' });
    }

    return true;
  } catch (error) {
    console.error('[SW] Failed to clear caches:', error);
    return false;
  }
}

/**
 * Check if app is running in standalone (PWA) mode
 *
 * @returns True if app is installed as PWA
 */
export function isStandalone(): boolean {
  if (typeof window === 'undefined') {
    return false;
  }

  // Check display mode
  const isStandaloneMode =
    window.matchMedia('(display-mode: standalone)').matches ||
    window.matchMedia('(display-mode: fullscreen)').matches;

  // Check iOS standalone
  const isIOSStandalone = (window.navigator as any).standalone === true;

  return isStandaloneMode || isIOSStandalone;
}

/**
 * Check if app is currently online
 *
 * @returns True if online, false if offline
 */
export function isOnline(): boolean {
  if (typeof window === 'undefined') {
    return true;
  }

  return navigator.onLine;
}

/**
 * Add online/offline event listeners
 *
 * @param onOnline - Callback when connection is restored
 * @param onOffline - Callback when connection is lost
 * @returns Cleanup function to remove listeners
 */
export function addNetworkListeners(
  onOnline: () => void,
  onOffline: () => void
): () => void {
  if (typeof window === 'undefined') {
    return () => {};
  }

  window.addEventListener('online', onOnline);
  window.addEventListener('offline', onOffline);

  return () => {
    window.removeEventListener('online', onOnline);
    window.removeEventListener('offline', onOffline);
  };
}

/**
 * Get current service worker registration
 *
 * @returns Promise that resolves to registration or null
 */
export async function getServiceWorkerRegistration(): Promise<ServiceWorkerRegistration | null> {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return null;
  }

  try {
    return await navigator.serviceWorker.getRegistration();
  } catch (error) {
    console.error('[SW] Failed to get registration:', error);
    return null;
  }
}

/**
 * Check if there's a waiting service worker (update available)
 *
 * @returns True if update is waiting
 */
export async function hasWaitingServiceWorker(): Promise<boolean> {
  const registration = await getServiceWorkerRegistration();
  return registration?.waiting !== undefined && registration?.waiting !== null;
}

/**
 * React hook for service worker management
 *
 * Usage:
 * ```tsx
 * const { status, registration, update, clearCache } = useServiceWorker();
 * ```
 */
export interface UseServiceWorkerReturn {
  status: ServiceWorkerStatus;
  registration: ServiceWorkerRegistration | null;
  update: () => void;
  clearCache: () => Promise<boolean>;
  isStandalone: boolean;
  isOnline: boolean;
}

/**
 * Example React hook implementation (to be used in components)
 */
export function createServiceWorkerHook() {
  return function useServiceWorker(): UseServiceWorkerReturn {
    const [status, setStatus] = React.useState<ServiceWorkerStatus>('registering');
    const [registration, setRegistration] = React.useState<ServiceWorkerRegistration | null>(
      null
    );
    const [standalone] = React.useState(() => isStandalone());
    const [online, setOnline] = React.useState(() => isOnline());

    React.useEffect(() => {
      // Register service worker
      registerServiceWorker((state) => {
        setStatus(state.status);
        if (state.registration) {
          setRegistration(state.registration);
        }
      });

      // Add network listeners
      const cleanup = addNetworkListeners(
        () => setOnline(true),
        () => setOnline(false)
      );

      return cleanup;
    }, []);

    const update = React.useCallback(() => {
      if (registration) {
        skipWaiting(registration);
      }
    }, [registration]);

    return {
      status,
      registration,
      update,
      clearCache: clearServiceWorkerCache,
      isStandalone: standalone,
      isOnline: online,
    };
  };
}
