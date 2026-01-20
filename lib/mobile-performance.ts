/**
 * Mobile Performance Optimization Utilities
 *
 * Utilities following Vercel React best practices for mobile optimization
 */

/**
 * Detect if device is low-end based on hardware concurrency
 * (Vercel: rendering-* - Adapt animations based on device capability)
 */
export function isLowEndDevice(): boolean {
  if (typeof window === 'undefined') return false;

  // Devices with 2 or fewer cores are considered low-end
  const cores = navigator.hardwareConcurrency || 4;
  return cores <= 2;
}

/**
 * Detect if user is on slow connection
 * (Vercel: Adapt loading strategies based on network)
 */
export function isSlowConnection(): boolean {
  if (typeof navigator === 'undefined' || !('connection' in navigator)) {
    return false;
  }

  const connection = (navigator as any).connection;
  if (!connection) return false;

  // Consider 3G and below as slow
  const slowTypes = ['slow-2g', '2g', '3g'];
  return slowTypes.includes(connection.effectiveType);
}

/**
 * Check if device prefers reduced data
 * (Vercel: Respect user preferences for data saving)
 */
export function prefersReducedData(): boolean {
  if (typeof window === 'undefined') return false;

  return window.matchMedia('(prefers-reduced-data: reduce)').matches;
}

/**
 * Get optimal image quality based on device and network
 * (Vercel: Adaptive image loading)
 */
export function getOptimalImageQuality(): 'low' | 'medium' | 'high' {
  if (isSlowConnection() || prefersReducedData()) {
    return 'low';
  }
  if (isLowEndDevice()) {
    return 'medium';
  }
  return 'high';
}

/**
 * Check if animations should be disabled for performance
 * (Vercel: Disable heavy animations on low-end devices)
 */
export function shouldDisableAnimations(): boolean {
  return isLowEndDevice() || isSlowConnection();
}

/**
 * Get optimal list virtualization threshold
 * (Vercel: rendering-content-visibility - Use virtualization smartly)
 */
export function getVirtualizationThreshold(): number {
  if (isLowEndDevice()) {
    return 20; // Virtualize lists > 20 items on low-end devices
  }
  return 50; // Virtualize lists > 50 items on normal devices
}

/**
 * Debounce function optimized for mobile inputs
 * (Vercel: js-* - Optimize event handlers for mobile)
 */
export function mobileDebounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number = 150
): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout> | null = null;

  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null;
      func(...args);
    };

    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/**
 * Throttle function optimized for scroll events
 * (Vercel: js-* - Optimize scroll handlers)
 */
export function mobileThrottle<T extends (...args: any[]) => any>(
  func: T,
  limit: number = 100
): (...args: Parameters<T>) => void {
  let inThrottle: boolean = false;

  return function executedFunction(...args: Parameters<T>) {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

/**
 * Request idle callback with fallback for unsupported browsers
 * (Vercel: rendering-* - Schedule non-urgent work during idle time)
 */
export function requestIdleCallbackCompat(
  callback: () => void,
  options?: { timeout?: number }
): number {
  if (typeof window === 'undefined') return 0;

  if ('requestIdleCallback' in window) {
    return window.requestIdleCallback(callback, options);
  }

  // Fallback for browsers that don't support requestIdleCallback
  return setTimeout(callback, 1) as unknown as number;
}

/**
 * Cancel idle callback with fallback
 */
export function cancelIdleCallbackCompat(handle: number): void {
  if (typeof window === 'undefined') return;

  if ('cancelIdleCallback' in window) {
    window.cancelIdleCallback(handle);
  } else {
    clearTimeout(handle);
  }
}
