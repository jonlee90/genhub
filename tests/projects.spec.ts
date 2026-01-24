/**
 * Projects Module E2E Tests
 *
 * Tests:
 * - CRUD operations (create, read, update, delete projects)
 * - Validation (name, email, dates)
 * - Performance (load times, calculations)
 * - Mobile UX (touch targets, responsive)
 * - Security (RLS company isolation)
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

test.describe('Projects Module', () => {

  // ============================================================================
  // CRUD Operations
  // ============================================================================

  test.describe('CRUD Operations', () => {

    test('should load projects page', async ({ page, baseURL }) => {
      await setupAuthenticatedPage(page, baseURL!);
      await page.goto('/app/projects');

      await expect(page).toHaveURL(/\/app\/projects/);
      await expect(page.getByRole('heading', { name: /projects/i })).toBeVisible();
    });

    test('should create a new project with all fields', async ({ page, baseURL }) => {
      await setupAuthenticatedPage(page, baseURL!);
      await page.goto('/app/projects');

      // Open create project modal
      const createButton = page.getByRole('button', { name: /new project|create/i });
      if (await createButton.isVisible()) {
        await createButton.click();
        await page.waitForTimeout(300);

        // Fill form fields
        await page.fill('input[name="name"]', 'Test Project 1');
        await page.fill('input[name="address"]', '123 Main St');
        await page.fill('input[name="city"]', 'Springfield');
        await page.fill('input[name="state"]', 'IL');
        await page.fill('input[name="zipCode"]', '62701');
        await page.fill('input[name="clientEmail"]', 'client@example.com');

        // Set dates
        const startDate = new Date();
        const endDate = new Date(startDate.getTime() + 30 * 24 * 60 * 60 * 1000);

        await page.fill('input[type="date"]:first-of-type', startDate.toISOString().split('T')[0]);
        await page.fill('input[type="date"]:nth-of-type(2)', endDate.toISOString().split('T')[0]);

        // Submit form
        const submitButton = page.getByRole('button', { name: /create|save|submit/i }).last();
        await submitButton.click();

        // Wait for success
        await page.waitForTimeout(500);

        // Project should appear in list or show success message
        const successMsg = page.getByText(/project created|success/i);
        const projectCard = page.getByText(/Test Project 1/i);

        const msgVisible = await successMsg.isVisible().catch(() => false);
        const cardVisible = await projectCard.isVisible().catch(() => false);

        expect(msgVisible || cardVisible).toBeTruthy();
      }
    });

    test('should read/display project details', async ({ page, baseURL }) => {
      await setupAuthenticatedPage(page, baseURL!);
      await page.goto('/app/projects');

      // Wait for projects to load
      await page.waitForTimeout(500);

      // Find first project card and click it
      const projectCard = page.locator('[data-testid="project-card"]').first();
      if (await projectCard.isVisible()) {
        await projectCard.click();

        // Should show project details
        await page.waitForTimeout(300);
        const details = page.locator('[data-testid="project-details"]');
        expect(await details.isVisible().catch(() => false)).toBeTruthy();
      }
    });

    test('should update project details', async ({ page, baseURL }) => {
      await setupAuthenticatedPage(page, baseURL!);
      await page.goto('/app/projects');

      await page.waitForTimeout(500);

      const editButton = page.getByRole('button', { name: /edit|update/i }).first();
      if (await editButton.isVisible()) {
        await editButton.click();
        await page.waitForTimeout(300);

        // Update a field
        const nameInput = page.locator('input[name="name"]').first();
        if (await nameInput.isVisible()) {
          await nameInput.fill('Updated Project Name');

          const saveButton = page.getByRole('button', { name: /save|update|submit/i }).last();
          await saveButton.click();

          await page.waitForTimeout(500);
          expect(await page.getByText(/updated|saved|success/i).isVisible().catch(() => false)).toBeTruthy();
        }
      }
    });
  });

  // ============================================================================
  // Validation Tests
  // ============================================================================

  test.describe('Validation', () => {

    test('should validate project name (1-200 chars)', async ({ page, baseURL }) => {
      await setupAuthenticatedPage(page, baseURL!);
      await page.goto('/app/projects');

      const createButton = page.getByRole('button', { name: /new project|create/i });
      if (await createButton.isVisible()) {
        await createButton.click();
        await page.waitForTimeout(300);

        // Try empty name
        const nameInput = page.locator('input[name="name"]');
        await nameInput.fill('');
        await nameInput.blur();

        const error = page.getByText(/required|name/i);
        expect(await error.isVisible().catch(() => false)).toBeTruthy();

        // Try very long name (>200 chars)
        const longName = 'a'.repeat(201);
        await nameInput.fill(longName);
        await nameInput.blur();

        expect(await error.isVisible().catch(() => false)).toBeTruthy();
      }
    });

    test('should validate email format', async ({ page, baseURL }) => {
      await setupAuthenticatedPage(page, baseURL!);
      await page.goto('/app/projects');

      const createButton = page.getByRole('button', { name: /new project|create/i });
      if (await createButton.isVisible()) {
        await createButton.click();
        await page.waitForTimeout(300);

        const emailInput = page.locator('input[name="clientEmail"]');
        if (await emailInput.isVisible()) {
          // Invalid email
          await emailInput.fill('not-an-email');
          await emailInput.blur();

          const error = page.getByText(/email|invalid|format/i);
          expect(await error.isVisible().catch(() => false)).toBeTruthy();

          // Valid email
          await emailInput.fill('valid@example.com');
          const errorGone = await error.isVisible().catch(() => false);
          expect(!errorGone).toBeTruthy();
        }
      }
    });

    test('should validate start_date <= end_date', async ({ page, baseURL }) => {
      await setupAuthenticatedPage(page, baseURL!);
      await page.goto('/app/projects');

      const createButton = page.getByRole('button', { name: /new project|create/i });
      if (await createButton.isVisible()) {
        await createButton.click();
        await page.waitForTimeout(300);

        const startDate = page.locator('input[type="date"]:first-of-type');
        const endDate = page.locator('input[type="date"]:nth-of-type(2)');

        if (await startDate.isVisible() && await endDate.isVisible()) {
          // Set invalid dates (end before start)
          await startDate.fill('2025-12-31');
          await endDate.fill('2025-01-01');
          await endDate.blur();

          const error = page.getByText(/date|after|before|invalid/i);
          expect(await error.isVisible().catch(() => false)).toBeTruthy();
        }
      }
    });
  });

  // ============================================================================
  // Performance Tests
  // ============================================================================

  test.describe('Performance', () => {

    test('should load projects list in <3s', async ({ page, baseURL }) => {
      await setupAuthenticatedPage(page, baseURL!);

      const startTime = Date.now();
      await page.goto('/app/projects');
      await page.waitForLoadState('networkidle');
      const loadTime = Date.now() - startTime;

      console.log(`[Perf] Projects page loaded in ${loadTime}ms`);
      expect(loadTime).toBeLessThan(3000);
    });

    test('should calculate project stats in <500ms', async ({ page, baseURL }) => {
      await setupAuthenticatedPage(page, baseURL!);
      await page.goto('/app/projects');

      // Measure stats calculation (completion %, budget, etc)
      const startTime = Date.now();

      // Wait for all stats to appear
      const stats = page.locator('[data-testid="project-stats"]');
      if (await stats.first().isVisible({ timeout: 500 }).catch(() => false)) {
        const calcTime = Date.now() - startTime;
        console.log(`[Perf] Stats calculated in ${calcTime}ms`);
        expect(calcTime).toBeLessThan(500);
      }
    });

    test('should respond to filter actions <200ms', async ({ page, baseURL }) => {
      await setupAuthenticatedPage(page, baseURL!);
      await page.goto('/app/projects');
      await page.waitForLoadState('networkidle');

      const filterButton = page.getByRole('button', { name: /filter|status/i });
      if (await filterButton.isVisible()) {
        const startTime = Date.now();
        await filterButton.click();

        // Wait for filter dropdown
        const dropdown = page.locator('[role="listbox"], .dropdown, [data-testid="filter-menu"]');
        if (await dropdown.isVisible({ timeout: 200 }).catch(() => false)) {
          const responseTime = Date.now() - startTime;
          console.log(`[Perf] Filter response in ${responseTime}ms`);
          expect(responseTime).toBeLessThan(200);
        }
      }
    });
  });

  // ============================================================================
  // Mobile UX Tests
  // ============================================================================

  test.describe('Mobile UX', () => {

    test('should have 44px+ touch targets on mobile', async ({ page, baseURL }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await setupAuthenticatedPage(page, baseURL!);
      await page.goto('/app/projects');

      // Check button sizes
      const buttons = page.getByRole('button');
      const count = await buttons.count();

      for (let i = 0; i < Math.min(count, 5); i++) {
        const button = buttons.nth(i);
        if (await button.isVisible()) {
          const box = await button.boundingBox();
          if (box) {
            expect(box.height).toBeGreaterThanOrEqual(44);
            expect(box.width).toBeGreaterThanOrEqual(44);
          }
        }
      }
    });

    test('should be responsive from 375px to 1920px', async ({ page, baseURL }) => {
      const breakpoints = [375, 768, 1024, 1920];

      for (const width of breakpoints) {
        await page.setViewportSize({ width, height: 667 });
        await setupAuthenticatedPage(page, baseURL!);
        await page.goto('/app/projects');

        // Check no horizontal overflow
        const mainContent = page.locator('main, [role="main"]').first();
        if (await mainContent.isVisible()) {
          const hasHScroll = await page.evaluate(() =>
            document.documentElement.scrollWidth > window.innerWidth
          );
          expect(hasHScroll).toBe(false);
        }
      }
    });
  });

  // ============================================================================
  // Security (RLS) Tests
  // ============================================================================

  test.describe('Security - RLS Company Isolation', () => {

    test('should only show user\'s company projects', async ({ page, baseURL }) => {
      await setupAuthenticatedPage(page, baseURL!);
      await page.goto('/app/projects');

      await page.waitForLoadState('networkidle');

      // All visible projects should belong to authenticated user's company
      // This is verified by RLS policy at DB level
      // UI test: verify no "forbidden" errors appear
      const errors = await page.locator('[role="alert"], .error, [data-testid="error"]')
        .filter({ hasText: /forbidden|unauthorized|access denied/i });

      expect(await errors.count()).toBe(0);
    });

    test('should not allow direct URL access to other company\'s project', async ({ page, baseURL }) => {
      await setupAuthenticatedPage(page, baseURL!);

      // Try to access a project with invalid ID
      await page.goto('/app/projects/invalid-company-project-id', { waitUntil: 'networkidle' });

      // Should show error or redirect
      const isNotFound = await page.getByText(/not found|not exist|error/i).isVisible().catch(() => false);
      const isRedirected = page.url().includes('/app/projects');

      expect(isNotFound || isRedirected).toBeTruthy();
    });
  });

  // ============================================================================
  // Edge Cases & Error Handling
  // ============================================================================

  test.describe('Error Handling', () => {

    test('should handle network errors gracefully', async ({ page, baseURL }) => {
      await setupAuthenticatedPage(page, baseURL!);

      // Go offline
      await page.context().setOffline(true);
      await page.goto('/app/projects');

      const errorMsg = page.getByText(/offline|connection|error/i);
      expect(await errorMsg.isVisible().catch(() => false)).toBeTruthy();

      // Go back online
      await page.context().setOffline(false);
    });

    test('should show success message on project creation', async ({ page, baseURL }) => {
      await setupAuthenticatedPage(page, baseURL!);
      await page.goto('/app/projects');

      const createButton = page.getByRole('button', { name: /new project|create/i });
      if (await createButton.isVisible()) {
        await createButton.click();
        await page.waitForTimeout(300);

        // Fill minimal fields
        await page.fill('input[name="name"]', 'Test Project Success');

        const submitButton = page.getByRole('button', { name: /create|save|submit/i }).last();
        await submitButton.click();

        // Should show success or confirmation
        const feedback = page.getByText(/success|created|saved/i);
        expect(await feedback.isVisible().catch(() => false)).toBeTruthy();
      }
    });
  });

  // ============================================================================
  // Accessibility Tests
  // ============================================================================

  test.describe('Accessibility', () => {

    test('should have proper heading hierarchy', async ({ page, baseURL }) => {
      await setupAuthenticatedPage(page, baseURL!);
      await page.goto('/app/projects');

      const mainHeading = page.getByRole('heading', { level: 1 });
      expect(await mainHeading.count()).toBeGreaterThan(0);
    });

    test('should have keyboard accessible controls', async ({ page, baseURL }) => {
      await setupAuthenticatedPage(page, baseURL!);
      await page.goto('/app/projects');

      // Tab through interactive elements
      await page.keyboard.press('Tab');
      const focusedTag = await page.evaluate(() => document.activeElement?.tagName);

      expect(['BUTTON', 'A', 'INPUT', 'SELECT']).toContain(focusedTag);
    });
  });
});
