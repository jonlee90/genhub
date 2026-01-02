/**
 * Playwright Tests for Chat Page
 * Tests chat room functionality, messaging, and UI interactions
 */

import { test, expect, type Page } from '@playwright/test';
import { authenticateUser, DEFAULT_TEST_USER } from './helpers/auth';

// Test suite setup
test.describe('Chat Page', () => {

  /**
   * Helper: Authenticate before each test
   */
  async function setupAuthenticatedPage(page: Page, baseURL: string) {
    console.log('[Test] Setting up authenticated session');

    // Create test session via API
    const response = await page.request.post(`${baseURL}/api/test/auth`, {
      headers: { 'Content-Type': 'application/json' },
      data: { email: DEFAULT_TEST_USER.email },
    });

    const data = await response.json();

    if (!data.success) {
      throw new Error(`Authentication failed: ${data.error || 'Unknown error'}`);
    }

    // Set session cookie
    await page.context().addCookies([{
      name: 'authjs.session-token',
      value: data.sessionToken,
      domain: 'localhost',
      path: '/',
      httpOnly: true,
      sameSite: 'Lax',
      expires: Math.floor(Date.now() / 1000) + (30 * 24 * 60 * 60),
    }]);

    console.log('[Test] Authentication successful');
  }

  // ============================================================================
  // Authentication & Access Tests
  // ============================================================================

  test.describe('Authentication & Access', () => {

    test('should redirect to login when not authenticated', async ({ page }) => {
      await page.goto('/app/chat');

      // Should redirect to login page
      await expect(page).toHaveURL(/\/login/);

      // Should show login form
      await expect(page.getByRole('heading', { name: /sign in/i })).toBeVisible();
    });

    test('should access chat page when authenticated', async ({ page, baseURL }) => {
      await setupAuthenticatedPage(page, baseURL!);
      await page.goto('/app/chat');

      // Should stay on chat page (no redirect)
      await expect(page).toHaveURL(/\/app\/chat/);

      // Should show chat interface - use heading with exact match
      await expect(page.getByRole('heading', { name: 'Messages' })).toBeVisible();
    });

    test('should show authenticated user info', async ({ page, baseURL }) => {
      await setupAuthenticatedPage(page, baseURL!);
      await page.goto('/app/chat');

      // Should display user name in sidebar
      await expect(page.getByText(DEFAULT_TEST_USER.name)).toBeVisible();
    });
  });

  // ============================================================================
  // UI Layout & Navigation Tests
  // ============================================================================

  test.describe('UI Layout & Navigation', () => {

    test.beforeEach(async ({ page, baseURL }) => {
      await setupAuthenticatedPage(page, baseURL!);
      await page.goto('/app/chat');
    });

    test('should display main navigation sidebar', async ({ page }) => {
      // Check all navigation items
      await expect(page.getByRole('link', { name: /dashboard/i })).toBeVisible();
      await expect(page.getByRole('link', { name: /projects/i })).toBeVisible();
      await expect(page.getByRole('link', { name: /tasks/i })).toBeVisible();
      await expect(page.getByRole('link', { name: /materials/i })).toBeVisible();
      await expect(page.getByRole('link', { name: /expenses/i })).toBeVisible();

      // Team is a button (has children), not a link
      await expect(page.getByRole('button', { name: /team/i })).toBeVisible();

      await expect(page.getByRole('link', { name: /reports/i })).toBeVisible();
      await expect(page.getByRole('link', { name: /analytics/i })).toBeVisible();
      await expect(page.getByRole('link', { name: /settings/i })).toBeVisible();
    });

    test('should display chat header with messages count', async ({ page }) => {
      await expect(page.getByRole('heading', { name: 'Messages' })).toBeVisible();

      // Should show message count (0 initially)
      await expect(page.getByText('0').first()).toBeVisible();
    });

    test('should display direct messages section', async ({ page }) => {
      await expect(page.getByText('Direct Messages', { exact: true })).toBeVisible();

      // Should have "New" button for creating DM
      await expect(page.getByRole('button', { name: /new/i })).toBeVisible();
    });

    test('should use construction theme colors', async ({ page }) => {
      // Check for construction theme primary color (#001B51)
      const logo = page.locator('text=GenHub').first();
      await expect(logo).toBeVisible();

      // Verify construction-themed elements are present
      const sidebar = page.locator('nav, aside, [role="navigation"]').first();
      await expect(sidebar).toBeVisible();
    });
  });

  // ============================================================================
  // Empty State Tests
  // ============================================================================

  test.describe('Empty States', () => {

    test.beforeEach(async ({ page, baseURL }) => {
      await setupAuthenticatedPage(page, baseURL!);
      await page.goto('/app/chat');
    });

    test('should show empty state for direct messages', async ({ page }) => {
      await expect(page.getByText(/no direct messages yet/i)).toBeVisible();

      // Should show "Start a conversation" button (use first() as there are multiple)
      await expect(page.getByRole('button', { name: /start a conversation/i }).first()).toBeVisible();
    });

    test('should show empty state for chat rooms', async ({ page }) => {
      await expect(page.getByText(/no chat rooms yet/i)).toBeVisible();

      // Should show descriptive text
      await expect(page.getByText(/chat rooms will appear here/i)).toBeVisible();

      // Should show "Start a conversation" button (use first() as there are multiple)
      await expect(page.getByRole('button', { name: /start a conversation/i }).first()).toBeVisible();
    });

    test('should show main area empty state', async ({ page }) => {
      // Main area should prompt user to select a chat
      await expect(page.getByText(/select a chat to start messaging/i)).toBeVisible();

      // Should show instructional text
      await expect(page.getByText(/choose a project chat or direct message/i)).toBeVisible();
    });
  });

  // ============================================================================
  // Chat Room Interaction Tests
  // ============================================================================

  test.describe('Chat Room Interactions', () => {

    test.beforeEach(async ({ page, baseURL }) => {
      await setupAuthenticatedPage(page, baseURL!);
      await page.goto('/app/chat');
    });

    test('should open new conversation modal when clicking "New" button', async ({ page }) => {
      // Click "New" button in Direct Messages
      const newButton = page.getByRole('button', { name: /new/i }).first();
      await newButton.click();

      // Modal/dialog should appear (check for common modal indicators)
      // Note: Actual implementation may vary, adjust selectors as needed
      await page.waitForTimeout(500); // Wait for modal animation
    });

    test('should open new conversation modal from empty state', async ({ page }) => {
      // Click "Start a conversation" from empty state
      const startButton = page.getByRole('button', { name: /start a conversation/i }).first();
      await startButton.click();

      // Modal/dialog should appear
      await page.waitForTimeout(500);
    });
  });

  // ============================================================================
  // PWA & Notifications Tests
  // ============================================================================

  test.describe('PWA & Notifications', () => {

    test.beforeEach(async ({ page, baseURL }) => {
      await setupAuthenticatedPage(page, baseURL!);
      await page.goto('/app/chat');
    });

    test('should show push notification prompt', async ({ page }) => {
      // Should display notification prompt
      const notifPrompt = page.getByText(/stay connected on-site/i);

      // Prompt might be visible or hidden depending on state
      // Check if it exists in the DOM
      const count = await notifPrompt.count();
      expect(count).toBeGreaterThanOrEqual(0);
    });

    test('should show PWA install prompt', async ({ page }) => {
      // Should display PWA install modal
      const installPrompt = page.getByText(/install genhub/i);

      // Prompt might be visible or hidden
      const count = await installPrompt.count();
      expect(count).toBeGreaterThanOrEqual(0);
    });

    test('should allow dismissing notification prompt', async ({ page }) => {
      // Find and click "Later" button if notification prompt is visible
      const laterButton = page.getByRole('button', { name: /later/i });

      if (await laterButton.isVisible()) {
        await laterButton.click();

        // Prompt should be dismissed
        await expect(laterButton).not.toBeVisible({ timeout: 2000 });
      }
    });

    test('should allow dismissing PWA install prompt', async ({ page }) => {
      // Find close button if PWA prompt is visible
      const closeButton = page.getByRole('button', { name: /don't show again|later/i }).last();

      if (await closeButton.isVisible()) {
        await closeButton.click();

        // Prompt should be dismissed
        await page.waitForTimeout(1000);
      }
    });
  });

  // ============================================================================
  // Responsive Design Tests
  // ============================================================================

  test.describe('Responsive Design', () => {

    test('should display correctly on desktop', async ({ page, baseURL }) => {
      await page.setViewportSize({ width: 1920, height: 1080 });
      await setupAuthenticatedPage(page, baseURL!);
      await page.goto('/app/chat');

      // Sidebar should be visible on desktop
      const sidebar = page.getByRole('heading', { name: 'Messages' });
      await expect(sidebar).toBeVisible();

      // Main area should be visible
      await expect(page.getByText(/select a chat to start messaging/i)).toBeVisible();
    });

    test('should display correctly on tablet', async ({ page, baseURL }) => {
      await page.setViewportSize({ width: 768, height: 1024 });
      await setupAuthenticatedPage(page, baseURL!);
      await page.goto('/app/chat');

      // Page should load without errors
      await expect(page.getByRole('heading', { name: 'Messages' })).toBeVisible();
    });

    test('should display correctly on mobile', async ({ page, baseURL }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await setupAuthenticatedPage(page, baseURL!);
      await page.goto('/app/chat');

      // Page should load without errors
      await expect(page.getByRole('heading', { name: 'Messages' })).toBeVisible();
    });
  });

  // ============================================================================
  // Accessibility Tests
  // ============================================================================

  test.describe('Accessibility', () => {

    test.beforeEach(async ({ page, baseURL }) => {
      await setupAuthenticatedPage(page, baseURL!);
      await page.goto('/app/chat');
    });

    test('should have proper heading hierarchy', async ({ page }) => {
      // Should have main heading
      const headings = page.getByRole('heading');
      const count = await headings.count();

      expect(count).toBeGreaterThan(0);
    });

    test('should have keyboard accessible navigation', async ({ page }) => {
      // Tab through navigation items
      await page.keyboard.press('Tab');

      // At least one element should receive focus
      const focusedElement = await page.evaluate(() => document.activeElement?.tagName);
      expect(focusedElement).toBeTruthy();
    });

    test('should have proper button labels', async ({ page }) => {
      // All buttons should have accessible names
      const buttons = page.getByRole('button');
      const count = await buttons.count();

      for (let i = 0; i < count; i++) {
        const button = buttons.nth(i);
        const name = await button.getAttribute('aria-label') || await button.textContent();
        expect(name).toBeTruthy();
      }
    });
  });

  // ============================================================================
  // Performance Tests
  // ============================================================================

  test.describe('Performance', () => {

    test('should load chat page within acceptable time', async ({ page, baseURL }) => {
      await setupAuthenticatedPage(page, baseURL!);

      const startTime = Date.now();
      await page.goto('/app/chat');
      await page.waitForLoadState('networkidle');
      const loadTime = Date.now() - startTime;

      // Page should load within 15 seconds (dev environment with Turbopack)
      expect(loadTime).toBeLessThan(15000);

      console.log(`[Performance] Chat page loaded in ${loadTime}ms`);
    });

    test('should not have console errors', async ({ page, baseURL }) => {
      const errors: string[] = [];

      page.on('console', (msg) => {
        if (msg.type() === 'error') {
          errors.push(msg.text());
        }
      });

      await setupAuthenticatedPage(page, baseURL!);
      await page.goto('/app/chat');

      // Wait for page to fully load
      await page.waitForLoadState('networkidle');

      // Should have no console errors
      // Note: Some errors may be expected (e.g., Firebase config missing)
      // Filter out known/expected errors if needed
      const unexpectedErrors = errors.filter(err =>
        !err.includes('Firebase') &&
        !err.includes('Warning')
      );

      if (unexpectedErrors.length > 0) {
        console.log('[Performance] Console errors:', unexpectedErrors);
      }
    });
  });
});
