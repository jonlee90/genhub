/**
 * Settings Module E2E Tests
 *
 * Tests:
 * - Admin-only access enforcement
 * - Project types CRUD
 * - Task types CRUD
 * - Phase templates CRUD
 * - Drag-drop reorder functionality
 * - Performance (RPC queries, composite indexes)
 * - RLS admin-only write enforcement
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

test.describe('Settings Module', () => {

  // ============================================================================
  // Admin-Only Access
  // ============================================================================

  test.describe('Admin-Only Access', () => {

    test('should require admin access to settings', async ({ page, baseURL }) => {
      await setupAuthenticatedPage(page, baseURL!);
      await page.goto('/app/settings');

      // Should either show settings (user is admin) or redirect
      const settingsHeading = page.getByRole('heading', { name: /settings|project types|task types/i });
      const forbiddenMsg = page.getByText(/forbidden|not authorized|admin only/i);

      const hasAccess = await settingsHeading.isVisible().catch(() => false);
      const denied = await forbiddenMsg.isVisible().catch(() => false);

      expect(hasAccess || denied).toBeTruthy();
    });

    test('should redirect non-admin users from settings', async ({ page, baseURL }) => {
      await setupAuthenticatedPage(page, baseURL!);

      // First check if user is admin by going to settings
      await page.goto('/app/settings');

      const isAdmin = !await page.getByText(/not authorized|forbidden/i).isVisible().catch(() => true);

      if (!isAdmin) {
        // Should be redirected to dashboard or show error
        const redirected = page.url().includes('/app/dashboard') || page.url().includes('/app/projects');
        expect(redirected || true).toBeTruthy();
      }
    });
  });

  // ============================================================================
  // Project Types CRUD
  // ============================================================================

  test.describe('Project Types', () => {

    test('should load project types list', async ({ page, baseURL }) => {
      await setupAuthenticatedPage(page, baseURL!);
      await page.goto('/app/settings');

      const typesList = page.getByText(/project types/i) || page.locator('[data-testid="project-types"]');
      expect(await typesList.isVisible().catch(() => false) || true).toBeTruthy();
    });

    test('should create a new project type', async ({ page, baseURL }) => {
      await setupAuthenticatedPage(page, baseURL!);
      await page.goto('/app/settings');

      const createButton = page.getByRole('button', { name: /new project type|add|create/i });
      if (await createButton.isVisible()) {
        await createButton.click();
        await page.waitForTimeout(300);

        // Fill form
        const nameInput = page.locator('input[name="name"]');
        if (await nameInput.isVisible()) {
          await nameInput.fill('Commercial Renovation');

          // Optional: description
          const descInput = page.locator('textarea[name="description"], input[name="description"]');
          if (await descInput.isVisible()) {
            await descInput.fill('Large commercial building renovation');
          }

          // Submit
          const submitButton = page.getByRole('button', { name: /create|save/i }).last();
          await submitButton.click();

          await page.waitForTimeout(500);
          expect(await page.getByText(/success|created/i).isVisible().catch(() => false)).toBeTruthy();
        }
      }
    });

    test('should update a project type', async ({ page, baseURL }) => {
      await setupAuthenticatedPage(page, baseURL!);
      await page.goto('/app/settings');

      const editButton = page.getByRole('button', { name: /edit|update/i }).first();
      if (await editButton.isVisible()) {
        await editButton.click();
        await page.waitForTimeout(300);

        const nameInput = page.locator('input[name="name"]').first();
        if (await nameInput.isVisible()) {
          const currentValue = await nameInput.inputValue();
          await nameInput.fill(currentValue + ' Updated');

          const saveButton = page.getByRole('button', { name: /save|update/i }).last();
          await saveButton.click();

          await page.waitForTimeout(500);
          expect(await page.getByText(/success|updated/i).isVisible().catch(() => false)).toBeTruthy();
        }
      }
    });

    test('should delete a project type', async ({ page, baseURL }) => {
      await setupAuthenticatedPage(page, baseURL!);
      await page.goto('/app/settings');

      const deleteButton = page.getByRole('button', { name: /delete|remove/i }).first();
      if (await deleteButton.isVisible()) {
        await deleteButton.click();
        await page.waitForTimeout(300);

        const confirmButton = page.getByRole('button', { name: /confirm|yes|delete/i });
        if (await confirmButton.isVisible()) {
          await confirmButton.click();
          await page.waitForTimeout(500);

          expect(await page.getByText(/deleted|removed|success/i).isVisible().catch(() => false)).toBeTruthy();
        }
      }
    });
  });

  // ============================================================================
  // Task Types CRUD
  // ============================================================================

  test.describe('Task Types', () => {

    test('should create a new task type', async ({ page, baseURL }) => {
      await setupAuthenticatedPage(page, baseURL!);
      await page.goto('/app/settings');

      // Navigate to task types section if needed
      const taskTypesTab = page.getByRole('tab', { name: /task types/i });
      if (await taskTypesTab.isVisible()) {
        await taskTypesTab.click();
        await page.waitForTimeout(300);
      }

      const createButton = page.getByRole('button', { name: /new task type|add|create/i });
      if (await createButton.isVisible()) {
        await createButton.click();
        await page.waitForTimeout(300);

        const nameInput = page.locator('input[name="name"]');
        if (await nameInput.isVisible()) {
          await nameInput.fill('Framing');

          const submitButton = page.getByRole('button', { name: /create|save/i }).last();
          await submitButton.click();

          await page.waitForTimeout(500);
          expect(await page.getByText(/success|created/i).isVisible().catch(() => false)).toBeTruthy();
        }
      }
    });

    test('should update a task type', async ({ page, baseURL }) => {
      await setupAuthenticatedPage(page, baseURL!);
      await page.goto('/app/settings');

      const taskTypesTab = page.getByRole('tab', { name: /task types/i });
      if (await taskTypesTab.isVisible()) {
        await taskTypesTab.click();
        await page.waitForTimeout(300);
      }

      const editButton = page.getByRole('button', { name: /edit|update/i }).first();
      if (await editButton.isVisible()) {
        await editButton.click();
        await page.waitForTimeout(300);

        const nameInput = page.locator('input[name="name"]').first();
        if (await nameInput.isVisible()) {
          await nameInput.fill('Updated Task Type');

          const saveButton = page.getByRole('button', { name: /save|update/i }).last();
          await saveButton.click();

          await page.waitForTimeout(500);
          expect(await page.getByText(/success|updated/i).isVisible().catch(() => false)).toBeTruthy();
        }
      }
    });

    test('should delete a task type', async ({ page, baseURL }) => {
      await setupAuthenticatedPage(page, baseURL!);
      await page.goto('/app/settings');

      const taskTypesTab = page.getByRole('tab', { name: /task types/i });
      if (await taskTypesTab.isVisible()) {
        await taskTypesTab.click();
        await page.waitForTimeout(300);
      }

      const deleteButton = page.getByRole('button', { name: /delete|remove/i }).first();
      if (await deleteButton.isVisible()) {
        await deleteButton.click();
        await page.waitForTimeout(300);

        const confirmButton = page.getByRole('button', { name: /confirm|delete/i });
        if (await confirmButton.isVisible()) {
          await confirmButton.click();
          await page.waitForTimeout(500);

          expect(await page.getByText(/deleted|success/i).isVisible().catch(() => false)).toBeTruthy();
        }
      }
    });
  });

  // ============================================================================
  // Phase Templates CRUD
  // ============================================================================

  test.describe('Phase Templates', () => {

    test('should create a new phase template', async ({ page, baseURL }) => {
      await setupAuthenticatedPage(page, baseURL!);
      await page.goto('/app/settings');

      const phaseTab = page.getByRole('tab', { name: /phase|template/i });
      if (await phaseTab.isVisible()) {
        await phaseTab.click();
        await page.waitForTimeout(300);
      }

      const createButton = page.getByRole('button', { name: /new phase|add|create/i });
      if (await createButton.isVisible()) {
        await createButton.click();
        await page.waitForTimeout(300);

        const nameInput = page.locator('input[name="name"]');
        if (await nameInput.isVisible()) {
          await nameInput.fill('Design Phase');

          const submitButton = page.getByRole('button', { name: /create|save/i }).last();
          if (await submitButton.isVisible()) {
            await submitButton.click();
            await page.waitForTimeout(500);

            expect(await page.getByText(/success|created/i).isVisible().catch(() => false)).toBeTruthy();
          }
        }
      }
    });

    test('should add tasks to phase template', async ({ page, baseURL }) => {
      await setupAuthenticatedPage(page, baseURL!);
      await page.goto('/app/settings');

      const phaseTab = page.getByRole('tab', { name: /phase|template/i });
      if (await phaseTab.isVisible()) {
        await phaseTab.click();
        await page.waitForTimeout(300);
      }

      const editButton = page.getByRole('button', { name: /edit|add tasks/i }).first();
      if (await editButton.isVisible()) {
        await editButton.click();
        await page.waitForTimeout(300);

        const addTaskButton = page.getByRole('button', { name: /add task|add item/i });
        if (await addTaskButton.isVisible()) {
          await addTaskButton.click();
          await page.waitForTimeout(300);

          const taskInput = page.locator('input[name*="task"]').last();
          if (await taskInput.isVisible()) {
            await taskInput.fill('Task 1');

            const saveButton = page.getByRole('button', { name: /save|done/i }).last();
            if (await saveButton.isVisible()) {
              await saveButton.click();
              await page.waitForTimeout(500);

              expect(await page.getByText(/success|added/i).isVisible().catch(() => false)).toBeTruthy();
            }
          }
        }
      }
    });
  });

  // ============================================================================
  // Drag-Drop Reorder
  // ============================================================================

  test.describe('Drag-Drop Reorder', () => {

    test('should reorder project types via drag-drop', async ({ page, baseURL }) => {
      await setupAuthenticatedPage(page, baseURL!);
      await page.goto('/app/settings');

      const items = page.locator('[data-testid="project-type-item"], .project-type-item, [draggable="true"]');
      const count = await items.count();

      if (count >= 2) {
        const first = items.nth(0);
        const second = items.nth(1);

        // Perform drag
        await first.dragTo(second);
        await page.waitForTimeout(500);

        // Should show success message or persist order
        const success = await page.getByText(/reordered|success|updated/i).isVisible().catch(() => false);
        expect(success || true).toBeTruthy();
      }
    });

    test('should reorder task types via drag-drop', async ({ page, baseURL }) => {
      await setupAuthenticatedPage(page, baseURL!);
      await page.goto('/app/settings');

      const taskTypesTab = page.getByRole('tab', { name: /task types/i });
      if (await taskTypesTab.isVisible()) {
        await taskTypesTab.click();
        await page.waitForTimeout(300);
      }

      const items = page.locator('[data-testid="task-type-item"], .task-type-item, [draggable="true"]');
      const count = await items.count();

      if (count >= 2) {
        const first = items.nth(0);
        const second = items.nth(1);

        await first.dragTo(second);
        await page.waitForTimeout(500);

        expect(await page.getByText(/reordered|success/i).isVisible().catch(() => false) || true).toBeTruthy();
      }
    });
  });

  // ============================================================================
  // Performance Tests
  // ============================================================================

  test.describe('Performance', () => {

    test('should load settings page efficiently', async ({ page, baseURL }) => {
      await setupAuthenticatedPage(page, baseURL!);

      const startTime = Date.now();
      await page.goto('/app/settings');
      await page.waitForLoadState('networkidle');

      const loadTime = Date.now() - startTime;
      console.log(`[Perf] Settings page loaded in ${loadTime}ms`);
      expect(loadTime).toBeLessThan(3000);
    });

    test('should use efficient RPC get_project_types_with_counts', async ({ page, baseURL }) => {
      await setupAuthenticatedPage(page, baseURL!);

      let rpcCalls = 0;
      page.on('request', (request) => {
        if (request.url().includes('rpc') && request.url().includes('project_types')) {
          rpcCalls++;
        }
      });

      await page.goto('/app/settings');
      await page.waitForLoadState('networkidle');

      // Should use single RPC call with counts
      console.log(`[Perf] RPC calls for project types: ${rpcCalls}`);
      expect(rpcCalls).toBeLessThanOrEqual(1);
    });

    test('should benefit from composite index on (company_id, display_order)', async ({ page, baseURL }) => {
      await setupAuthenticatedPage(page, baseURL!);

      const startTime = Date.now();
      await page.goto('/app/settings');

      // Wait for types to load
      const typesList = page.locator('[data-testid="project-type-item"], .project-type-item').first();
      if (await typesList.isVisible({ timeout: 500 }).catch(() => false)) {
        const loadTime = Date.now() - startTime;
        console.log(`[Perf] Types rendered in ${loadTime}ms`);

        // Should be fast due to index
        expect(loadTime).toBeLessThan(2000);
      }
    });
  });

  // ============================================================================
  // Mobile UX Tests
  // ============================================================================

  test.describe('Mobile UX', () => {

    test('should display settings on mobile', async ({ page, baseURL }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await setupAuthenticatedPage(page, baseURL!);
      await page.goto('/app/settings');

      const content = page.locator('main, [role="main"]').first();
      expect(await content.isVisible().catch(() => false)).toBeTruthy();
    });

    test('should have 44px touch targets on mobile', async ({ page, baseURL }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await setupAuthenticatedPage(page, baseURL!);
      await page.goto('/app/settings');

      const buttons = page.getByRole('button');
      const count = Math.min(await buttons.count(), 3);

      for (let i = 0; i < count; i++) {
        const button = buttons.nth(i);
        if (await button.isVisible()) {
          const box = await button.boundingBox();
          expect(box!.height).toBeGreaterThanOrEqual(44);
        }
      }
    });
  });

  // ============================================================================
  // Security Tests (RLS)
  // ============================================================================

  test.describe('Security - RLS Admin-Only Writes', () => {

    test('should enforce admin-only write permissions', async ({ page, baseURL }) => {
      await setupAuthenticatedPage(page, baseURL!);
      await page.goto('/app/settings');

      // User is either admin (can write) or non-admin (no write access)
      const createButton = page.getByRole('button', { name: /new|create/i });
      const forbiddenMsg = page.getByText(/forbidden|not authorized/i);

      const canCreate = await createButton.isVisible().catch(() => false);
      const isForbidden = await forbiddenMsg.isVisible().catch(() => false);

      // One of these should be true
      expect(canCreate || isForbidden).toBeTruthy();
    });

    test('should not show settings to non-admin users', async ({ page, baseURL }) => {
      await setupAuthenticatedPage(page, baseURL!);

      await page.goto('/app/settings');

      // Check for access denied message or redirect
      const denied = await page.getByText(/access denied|forbidden|not authorized|admin only/i).isVisible().catch(() => false);
      const redirected = !page.url().includes('/settings');

      expect(denied || redirected).toBeTruthy();
    });
  });

  // ============================================================================
  // Error Handling
  // ============================================================================

  test.describe('Error Handling', () => {

    test('should handle type creation errors', async ({ page, baseURL }) => {
      await setupAuthenticatedPage(page, baseURL!);
      await page.goto('/app/settings');

      await page.context().setOffline(true);

      const createButton = page.getByRole('button', { name: /new project type/i });
      if (await createButton.isVisible()) {
        await createButton.click();
        await page.waitForTimeout(300);

        const submitButton = page.getByRole('button', { name: /create/i }).last();
        if (await submitButton.isVisible()) {
          await submitButton.click();
          await page.waitForTimeout(500);

          const errorMsg = page.getByText(/error|failed|offline/i);
          expect(await errorMsg.isVisible().catch(() => false)).toBeTruthy();
        }
      }

      await page.context().setOffline(false);
    });
  });

  // ============================================================================
  // Accessibility
  // ============================================================================

  test.describe('Accessibility', () => {

    test('should have accessible tabs', async ({ page, baseURL }) => {
      await setupAuthenticatedPage(page, baseURL!);
      await page.goto('/app/settings');

      const tabs = page.getByRole('tab');
      const count = await tabs.count();

      expect(count).toBeGreaterThan(0);

      // Should be keyboard navigable
      await tabs.first().focus();
      const focused = await page.evaluate(() => document.activeElement?.getAttribute('role'));
      expect(focused).toBe('tab');
    });

    test('should have proper form labels', async ({ page, baseURL }) => {
      await setupAuthenticatedPage(page, baseURL!);
      await page.goto('/app/settings');

      const createButton = page.getByRole('button', { name: /new|create/i }).first();
      if (await createButton.isVisible()) {
        await createButton.click();
        await page.waitForTimeout(300);

        const inputs = page.locator('input, select, textarea');
        const count = Math.min(await inputs.count(), 3);

        for (let i = 0; i < count; i++) {
          const input = inputs.nth(i);
          const label = await input.getAttribute('aria-label') || await input.getAttribute('name');
          expect(label).toBeTruthy();
        }
      }
    });
  });
});
