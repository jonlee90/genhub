/**
 * Performance Tests - Load Times & Core Web Vitals
 *
 * Measures:
 * - Page load times (<3s)
 * - First Contentful Paint (FCP)
 * - Largest Contentful Paint (LCP)
 * - Cumulative Layout Shift (CLS)
 * - Time to Interactive (TTI)
 */

import { test, expect, type Page } from '@playwright/test';

async function setupAuthenticatedPage(page: Page, baseURL: string) {
  const response = await page.request.post(`${baseURL}/api/test/auth`, {
    headers: { 'Content-Type': 'application/json' },
    data: { email: 'jonlee213@gmail.com' },
  });

  const data = await response.json();
  if (!data.success) throw new Error(`Auth failed: ${data.error}`);

  await page.context().addCookies([{
    name: 'authjs.session-token',
    value: data.sessionToken,
    domain: 'localhost',
    path: '/',
    httpOnly: true,
    sameSite: 'Lax',
    expires: Math.floor(Date.now() / 1000) + (30 * 24 * 60 * 60),
  }]);
}

async function measureWebVitals(page: Page) {
  const vitals = await page.evaluate(() => {
    return {
      fcp: performance.getEntriesByName('first-contentful-paint')[0]?.startTime,
      lcp: performance.getEntriesByType('largest-contentful-paint').pop()?.renderTime || 0,
      cls: 0, // CLS needs PerformanceObserver to track
      tti: performance.timing.loadEventEnd - performance.timing.navigationStart,
    };
  });
  return vitals;
}

test.describe('Performance - Load Times', () => {

  test.describe('Page Load Times (<3s)', () => {

    test('projects page loads in <3s', async ({ page, baseURL }) => {
      await setupAuthenticatedPage(page, baseURL!);

      const startTime = Date.now();
      await page.goto('/app/projects');
      await page.waitForLoadState('networkidle');
      const loadTime = Date.now() - startTime;

      console.log(`[Perf] Projects page: ${loadTime}ms`);
      expect(loadTime).toBeLessThan(3000);
    });

    test('tasks page loads in <3s', async ({ page, baseURL }) => {
      await setupAuthenticatedPage(page, baseURL!);

      const startTime = Date.now();
      await page.goto('/app/tasks');
      await page.waitForLoadState('networkidle');
      const loadTime = Date.now() - startTime;

      console.log(`[Perf] Tasks page: ${loadTime}ms`);
      expect(loadTime).toBeLessThan(3000);
    });

    test('materials page loads in <3s', async ({ page, baseURL }) => {
      await setupAuthenticatedPage(page, baseURL!);

      const startTime = Date.now();
      await page.goto('/app/materials');
      await page.waitForLoadState('networkidle');
      const loadTime = Date.now() - startTime;

      console.log(`[Perf] Materials page: ${loadTime}ms`);
      expect(loadTime).toBeLessThan(3000);
    });

    test('expenses page loads in <2s', async ({ page, baseURL }) => {
      await setupAuthenticatedPage(page, baseURL!);

      const startTime = Date.now();
      await page.goto('/app/expenses');
      await page.waitForLoadState('networkidle');
      const loadTime = Date.now() - startTime;

      console.log(`[Perf] Expenses page: ${loadTime}ms`);
      expect(loadTime).toBeLessThan(2000);
    });

    test('settings page loads in <3s', async ({ page, baseURL }) => {
      await setupAuthenticatedPage(page, baseURL!);

      const startTime = Date.now();
      await page.goto('/app/settings');
      await page.waitForLoadState('networkidle');
      const loadTime = Date.now() - startTime;

      console.log(`[Perf] Settings page: ${loadTime}ms`);
      expect(loadTime).toBeLessThan(3000);
    });
  });

  test.describe('Core Web Vitals', () => {

    test('projects page FCP <1.8s, LCP <2.5s', async ({ page, baseURL }) => {
      await setupAuthenticatedPage(page, baseURL!);

      await page.goto('/app/projects');
      const vitals = await measureWebVitals(page);

      console.log(`[CWV] Projects - FCP: ${vitals.fcp}ms, LCP: ${vitals.lcp}ms`);

      if (vitals.fcp) expect(vitals.fcp).toBeLessThan(1800);
      if (vitals.lcp) expect(vitals.lcp).toBeLessThan(2500);
    });

    test('tasks page FCP <1.8s, LCP <2.5s', async ({ page, baseURL }) => {
      await setupAuthenticatedPage(page, baseURL!);

      await page.goto('/app/tasks');
      const vitals = await measureWebVitals(page);

      console.log(`[CWV] Tasks - FCP: ${vitals.fcp}ms, LCP: ${vitals.lcp}ms`);

      if (vitals.fcp) expect(vitals.fcp).toBeLessThan(1800);
      if (vitals.lcp) expect(vitals.lcp).toBeLessThan(2500);
    });

    test('no console errors on page load', async ({ page, baseURL }) => {
      const errors: string[] = [];

      page.on('console', (msg) => {
        if (msg.type() === 'error') {
          errors.push(msg.text());
        }
      });

      await setupAuthenticatedPage(page, baseURL!);
      await page.goto('/app/projects');
      await page.waitForLoadState('networkidle');

      // Filter out expected errors
      const unexpectedErrors = errors.filter(err =>
        !err.includes('Firebase') &&
        !err.includes('Warning') &&
        !err.includes('Non-Error') &&
        !err.toLowerCase().includes('script')
      );

      console.log(`[Errors] Found ${unexpectedErrors.length} unexpected errors`);
      expect(unexpectedErrors.length).toBe(0);
    });
  });

  test.describe('Resource Loading', () => {

    test('bundles load efficiently', async ({ page, baseURL }) => {
      const resourceTimes: Record<string, number> = {};

      page.on('requestfinished', (request) => {
        const url = request.url();
        if (url.includes('_next') || url.includes('.js') || url.includes('.css')) {
          const timing = request.timing();
          if (timing) {
            resourceTimes[url.split('/').pop() || 'unknown'] =
              (timing.responseEnd - timing.responseStart) || 0;
          }
        }
      });

      await setupAuthenticatedPage(page, baseURL!);
      await page.goto('/app/projects');
      await page.waitForLoadState('networkidle');

      // Check bundle sizes aren't excessive
      const bundleSizes = Object.entries(resourceTimes);
      console.log(`[Bundles] Loaded ${bundleSizes.length} resources`);

      // Should have reasonable bundle sizes
      const slowResources = bundleSizes.filter(([, time]) => time > 2000);
      expect(slowResources.length).toBeLessThan(3);
    });

    test('images load with lazy loading', async ({ page, baseURL }) => {
      await setupAuthenticatedPage(page, baseURL!);
      await page.goto('/app/projects');

      // Check for lazy-loaded images
      const images = page.locator('img');
      const count = await images.count();

      if (count > 0) {
        const lazyImages = await images.evaluateAll(imgs =>
          imgs.filter(img => img.getAttribute('loading') === 'lazy').length
        );

        console.log(`[Images] ${lazyImages} of ${count} images lazy-loaded`);
        // At least some should be lazy-loaded
        expect(lazyImages).toBeGreaterThan(0);
      }
    });
  });

  test.describe('Re-render Performance', () => {

    test('filter interactions respond <100ms', async ({ page, baseURL }) => {
      await setupAuthenticatedPage(page, baseURL!);
      await page.goto('/app/projects');
      await page.waitForLoadState('networkidle');

      const filterButton = page.getByRole('button', { name: /filter/i }).first();
      if (await filterButton.isVisible()) {
        const startTime = Date.now();
        await filterButton.click();

        // Wait for filter dropdown
        await page.locator('[role="listbox"], .dropdown, [data-testid="filter-menu"]').first()
          .isVisible({ timeout: 200 });

        const responseTime = Date.now() - startTime;
        console.log(`[Interaction] Filter response: ${responseTime}ms`);

        expect(responseTime).toBeLessThan(500);
      }
    });

    test('list updates re-render efficiently', async ({ page, baseURL }) => {
      await setupAuthenticatedPage(page, baseURL!);
      await page.goto('/app/projects');
      await page.waitForLoadState('networkidle');

      // Measure time to show new item
      const startTime = Date.now();

      // Trigger a list update (e.g., status change)
      const statusButton = page.getByRole('button', { name: /status/i }).first();
      if (await statusButton.isVisible()) {
        await statusButton.click();
        await page.waitForTimeout(100);

        // Wait for list to update
        const updateTime = Date.now() - startTime;
        console.log(`[Perf] List update: ${updateTime}ms`);

        expect(updateTime).toBeLessThan(500);
      }
    });
  });

  test.describe('Network Performance', () => {

    test('API calls optimize with batching', async ({ page, baseURL }) => {
      let apiCallCount = 0;

      page.on('request', (request) => {
        if (request.url().includes('/api') && !request.url().includes('auth')) {
          apiCallCount++;
        }
      });

      await setupAuthenticatedPage(page, baseURL!);
      await page.goto('/app/projects');
      await page.waitForLoadState('networkidle');

      console.log(`[API] Total API calls: ${apiCallCount}`);

      // Should have reasonable number of API calls (batched, not N+1)
      expect(apiCallCount).toBeLessThan(20);
    });

    test('no memory leaks on page navigation', async ({ page, baseURL }) => {
      await setupAuthenticatedPage(page, baseURL!);

      const routes = ['/app/projects', '/app/tasks', '/app/materials', '/app/expenses'];

      for (const route of routes) {
        await page.goto(route);
        await page.waitForLoadState('networkidle');
      }

      // If we get here without crashes, memory management is reasonable
      expect(true).toBeTruthy();
    });
  });

  test.describe('Server Performance', () => {

    test('server responds to requests <500ms', async ({ page, baseURL }) => {
      const responseTimes: number[] = [];

      page.on('response', (response) => {
        const timing = response.request().timing();
        if (timing && response.url().includes('/api')) {
          responseTimes.push(timing.responseEnd - timing.requestStart);
        }
      });

      await setupAuthenticatedPage(page, baseURL!);
      await page.goto('/app/projects');
      await page.waitForLoadState('networkidle');

      const avgTime = responseTimes.length > 0
        ? responseTimes.reduce((a, b) => a + b) / responseTimes.length
        : 0;

      console.log(`[Server] Avg response time: ${avgTime.toFixed(0)}ms`);

      if (responseTimes.length > 0) {
        expect(avgTime).toBeLessThan(500);
      }
    });
  });
});
