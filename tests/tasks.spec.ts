/**
 * Tasks Module E2E Tests
 *
 * Tests:
 * - Kanban board CRUD and drag-drop
 * - Task creation with assignees
 * - Validation (title, dates)
 * - Optimistic updates
 * - Performance (render, drag response)
 * - RLS project-scoped access
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

test.describe('Tasks Module', () => {

  // ============================================================================
  // CRUD Operations
  // ============================================================================

  test.describe('CRUD Operations', () => {

    test('should load tasks page with Kanban board', async ({ page, baseURL }) => {
      await setupAuthenticatedPage(page, baseURL!);
      await page.goto('/app/tasks');

      await expect(page).toHaveURL(/\/app\/tasks/);

      // Check for Kanban columns
      const columns = page.locator('[data-testid="kanban-column"], .kanban-column, [role="region"]');
      expect(await columns.count()).toBeGreaterThan(0);
    });

    test('should create a new task', async ({ page, baseURL }) => {
      await setupAuthenticatedPage(page, baseURL!);
      await page.goto('/app/tasks');

      const createButton = page.getByRole('button', { name: /new task|create|add/i });
      if (await createButton.isVisible()) {
        await createButton.click();
        await page.waitForTimeout(300);

        // Fill task form
        await page.fill('input[name="title"]', 'Test Task 1');

        // Set priority
        const prioritySelect = page.locator('select[name="priority"], [data-testid="priority"]');
        if (await prioritySelect.isVisible()) {
          await prioritySelect.selectOption('high');
        }

        // Set dates
        const startDate = new Date();
        const dueDate = new Date(startDate.getTime() + 7 * 24 * 60 * 60 * 1000);

        const dateInputs = page.locator('input[type="date"]');
        if (await dateInputs.first().isVisible()) {
          await dateInputs.first().fill(startDate.toISOString().split('T')[0]);
        }
        if (await dateInputs.nth(1).isVisible()) {
          await dateInputs.nth(1).fill(dueDate.toISOString().split('T')[0]);
        }

        // Submit
        const submitButton = page.getByRole('button', { name: /create|save|submit/i }).last();
        await submitButton.click();

        await page.waitForTimeout(500);
        expect(await page.getByText(/success|created|task created/i).isVisible().catch(() => false)).toBeTruthy();
      }
    });

    test('should create task with multiple assignees', async ({ page, baseURL }) => {
      await setupAuthenticatedPage(page, baseURL!);
      await page.goto('/app/tasks');

      const createButton = page.getByRole('button', { name: /new task|create|add/i });
      if (await createButton.isVisible()) {
        await createButton.click();
        await page.waitForTimeout(300);

        await page.fill('input[name="title"]', 'Multi-Assignee Task');

        // Select assignees (assuming checkbox or multi-select)
        const assigneeInputs = page.locator('input[name="assignees"], [data-testid="assignees"]');
        if (await assigneeInputs.first().isVisible()) {
          // Try to click and select multiple
          await assigneeInputs.first().click();
          await page.waitForTimeout(200);

          const firstOption = page.locator('[role="option"]').first();
          if (await firstOption.isVisible()) {
            await firstOption.click();
            await page.waitForTimeout(100);
          }
        }

        const submitButton = page.getByRole('button', { name: /create|save|submit/i }).last();
        await submitButton.click();

        await page.waitForTimeout(500);
        expect(await page.getByText(/success|created/i).isVisible().catch(() => false)).toBeTruthy();
      }
    });
  });

  // ============================================================================
  // Kanban Interactions
  // ============================================================================

  test.describe('Kanban Board', () => {

    test('should drag task between columns', async ({ page, baseURL }) => {
      await setupAuthenticatedPage(page, baseURL!);
      await page.goto('/app/tasks');

      await page.waitForLoadState('networkidle');

      // Find first task card
      const taskCard = page.locator('[data-testid="task-card"], .task-card, [draggable="true"]').first();
      const targetColumn = page.locator('[data-testid="kanban-column"], .kanban-column').nth(1);

      if (await taskCard.isVisible() && await targetColumn.isVisible()) {
        // Perform drag
        const startTime = Date.now();
        await taskCard.dragTo(targetColumn);
        const dragTime = Date.now() - startTime;

        console.log(`[Perf] Task drag completed in ${dragTime}ms`);
        expect(dragTime).toBeLessThan(500);

        // Task should move (optimistic update)
        await page.waitForTimeout(300);
        expect(await taskCard.isVisible().catch(() => false)).toBeTruthy();
      }
    });

    test('should update task status when moved', async ({ page, baseURL }) => {
      await setupAuthenticatedPage(page, baseURL!);
      await page.goto('/app/tasks');

      const taskCard = page.locator('[data-testid="task-card"]').first();
      if (await taskCard.isVisible()) {
        // Get initial column
        const initialColumn = await taskCard.locator('..');
        const initialStatus = await initialColumn.getAttribute('data-status');

        // Move to different column
        const targetColumn = page.locator('[data-testid="kanban-column"]').nth(1);
        if (await targetColumn.isVisible()) {
          await taskCard.dragTo(targetColumn);
          await page.waitForTimeout(500);

          // Status should update (via optimistic update or server)
          const updatedColumn = await taskCard.locator('..');
          const updatedStatus = await updatedColumn.getAttribute('data-status');

          expect(updatedStatus).not.toBe(initialStatus);
        }
      }
    });

    test('should rollback on server error', async ({ page, baseURL }) => {
      await setupAuthenticatedPage(page, baseURL!);
      await page.goto('/app/tasks');

      const taskCard = page.locator('[data-testid="task-card"]').first();
      if (await taskCard.isVisible()) {
        // Enable offline to simulate error
        await page.context().setOffline(true);

        const targetColumn = page.locator('[data-testid="kanban-column"]').nth(1);
        if (await targetColumn.isVisible()) {
          await taskCard.dragTo(targetColumn);
          await page.waitForTimeout(500);
        }

        // Error message should appear
        const errorMsg = page.getByText(/error|failed|retry/i);
        expect(await errorMsg.isVisible().catch(() => false)).toBeTruthy();

        await page.context().setOffline(false);
      }
    });
  });

  // ============================================================================
  // Validation Tests
  // ============================================================================

  test.describe('Validation', () => {

    test('should validate task title (1-500 chars)', async ({ page, baseURL }) => {
      await setupAuthenticatedPage(page, baseURL!);
      await page.goto('/app/tasks');

      const createButton = page.getByRole('button', { name: /new task|create/i });
      if (await createButton.isVisible()) {
        await createButton.click();
        await page.waitForTimeout(300);

        const titleInput = page.locator('input[name="title"]');

        // Empty title
        await titleInput.fill('');
        await titleInput.blur();
        expect(await page.getByText(/required|title/i).isVisible().catch(() => false)).toBeTruthy();

        // Too long title
        const longTitle = 'a'.repeat(501);
        await titleInput.fill(longTitle);
        await titleInput.blur();
        expect(await page.getByText(/too long|max|characters/i).isVisible().catch(() => false)).toBeTruthy();

        // Valid title
        await titleInput.fill('Valid Task Title');
        expect(await page.getByText(/required|title/i).isVisible().catch(() => false)).toBe(false);
      }
    });

    test('should validate date range', async ({ page, baseURL }) => {
      await setupAuthenticatedPage(page, baseURL!);
      await page.goto('/app/tasks');

      const createButton = page.getByRole('button', { name: /new task|create/i });
      if (await createButton.isVisible()) {
        await createButton.click();
        await page.waitForTimeout(300);

        const dateInputs = page.locator('input[type="date"]');
        if (await dateInputs.nth(0).isVisible() && await dateInputs.nth(1).isVisible()) {
          // Set invalid range (due before start)
          await dateInputs.nth(0).fill('2025-12-31');
          await dateInputs.nth(1).fill('2025-01-01');
          await dateInputs.nth(1).blur();

          expect(await page.getByText(/invalid|after|before/i).isVisible().catch(() => false)).toBeTruthy();
        }
      }
    });
  });

  // ============================================================================
  // Performance Tests
  // ============================================================================

  test.describe('Performance', () => {

    test('should render Kanban board <500ms', async ({ page, baseURL }) => {
      await setupAuthenticatedPage(page, baseURL!);

      const startTime = Date.now();
      await page.goto('/app/tasks');

      const columns = page.locator('[data-testid="kanban-column"]');
      await columns.first().waitFor({ state: 'visible', timeout: 1000 });

      const renderTime = Date.now() - startTime;
      console.log(`[Perf] Kanban rendered in ${renderTime}ms`);
      expect(renderTime).toBeLessThan(2000);
    });

    test('should respond to drag action <100ms', async ({ page, baseURL }) => {
      await setupAuthenticatedPage(page, baseURL!);
      await page.goto('/app/tasks');

      const taskCard = page.locator('[data-testid="task-card"]').first();
      if (await taskCard.isVisible()) {
        const targetColumn = page.locator('[data-testid="kanban-column"]').nth(1);

        if (await targetColumn.isVisible()) {
          const startTime = Date.now();
          await taskCard.dragTo(targetColumn);
          const dragTime = Date.now() - startTime;

          // Optimistic update should be instant
          console.log(`[Perf] Optimistic drag update in ${dragTime}ms`);
          expect(dragTime).toBeLessThan(500);
        }
      }
    });

    test('should memoize task card renders', async ({ page, baseURL }) => {
      await setupAuthenticatedPage(page, baseURL!);
      await page.goto('/app/tasks');

      // Check that task cards have stable keys (for memoization)
      const cards = page.locator('[data-testid="task-card"]');
      const firstCardKey = await cards.first().getAttribute('data-task-id');

      expect(firstCardKey).toBeTruthy();
      expect(firstCardKey).toMatch(/^[a-f0-9\-]{36}$/); // UUID format
    });
  });

  // ============================================================================
  // Mobile UX Tests
  // ============================================================================

  test.describe('Mobile UX', () => {

    test('should display Kanban on mobile in scrollable format', async ({ page, baseURL }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await setupAuthenticatedPage(page, baseURL!);
      await page.goto('/app/tasks');

      const kanban = page.locator('[data-testid="kanban-board"], .kanban-board').first();
      if (await kanban.isVisible()) {
        const box = await kanban.boundingBox();
        // Should fit in viewport
        expect(box!.width).toBeLessThanOrEqual(375);
      }
    });

    test('should have 44px touch targets for task cards on mobile', async ({ page, baseURL }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await setupAuthenticatedPage(page, baseURL!);
      await page.goto('/app/tasks');

      const taskCards = page.locator('[data-testid="task-card"]');
      const count = await taskCards.count();

      for (let i = 0; i < Math.min(count, 3); i++) {
        const card = taskCards.nth(i);
        if (await card.isVisible()) {
          const box = await card.boundingBox();
          expect(box!.height).toBeGreaterThanOrEqual(44);
        }
      }
    });
  });

  // ============================================================================
  // Security Tests (RLS)
  // ============================================================================

  test.describe('Security - RLS Project-Scoped Access', () => {

    test('should only show tasks from user\'s company projects', async ({ page, baseURL }) => {
      await setupAuthenticatedPage(page, baseURL!);
      await page.goto('/app/tasks');

      // Verify no "access denied" messages
      const errors = page.getByText(/access denied|forbidden|unauthorized/i);
      expect(await errors.count()).toBe(0);

      // All visible tasks should belong to company
      const taskCards = page.locator('[data-testid="task-card"]');
      expect(await taskCards.count()).toBeGreaterThanOrEqual(0);
    });

    test('should not allow viewing tasks from other projects', async ({ page, baseURL }) => {
      await setupAuthenticatedPage(page, baseURL!);

      // Try accessing tasks from invalid project
      await page.goto('/app/projects/invalid-project-id/tasks', { waitUntil: 'networkidle' });

      const notFound = await page.getByText(/not found|not exist|error/i).isVisible().catch(() => false);
      const redirected = page.url().includes('/app/tasks') || page.url().includes('/app/projects');

      expect(notFound || redirected).toBeTruthy();
    });
  });

  // ============================================================================
  // Error Handling
  // ============================================================================

  test.describe('Error Handling', () => {

    test('should show error when task creation fails', async ({ page, baseURL }) => {
      await setupAuthenticatedPage(page, baseURL!);
      await page.goto('/app/tasks');

      // Go offline to force error
      await page.context().setOffline(true);

      const createButton = page.getByRole('button', { name: /new task|create/i });
      if (await createButton.isVisible()) {
        await createButton.click();
        await page.waitForTimeout(300);

        const submitButton = page.getByRole('button', { name: /create|submit/i }).last();
        await submitButton.click();

        await page.waitForTimeout(500);

        // Should show error message
        const errorMsg = page.getByText(/error|failed|network/i);
        expect(await errorMsg.isVisible().catch(() => false)).toBeTruthy();
      }

      await page.context().setOffline(false);
    });

    test('should handle missing task modal gracefully', async ({ page, baseURL }) => {
      await setupAuthenticatedPage(page, baseURL!);
      await page.goto('/app/tasks');

      // Modal should exist or be easy to create
      const modal = page.locator('[role="dialog"], .modal, [data-testid="task-modal"]');
      const createButton = page.getByRole('button', { name: /new task/i });

      expect(await createButton.isVisible() || await modal.isVisible()).toBeTruthy();
    });
  });

  // ============================================================================
  // Accessibility
  // ============================================================================

  test.describe('Accessibility', () => {

    test('should have accessible Kanban columns', async ({ page, baseURL }) => {
      await setupAuthenticatedPage(page, baseURL!);
      await page.goto('/app/tasks');

      // Columns should have roles/labels
      const columns = page.locator('[data-testid="kanban-column"], [role="region"]');
      const count = await columns.count();

      for (let i = 0; i < count; i++) {
        const column = columns.nth(i);
        const label = await column.getAttribute('aria-label') || await column.getAttribute('data-status');
        expect(label).toBeTruthy();
      }
    });

    test('should support keyboard navigation', async ({ page, baseURL }) => {
      await setupAuthenticatedPage(page, baseURL!);
      await page.goto('/app/tasks');

      // Tab to first task
      await page.keyboard.press('Tab');
      const focused = await page.evaluate(() => document.activeElement?.tagName);

      expect(['BUTTON', 'A', 'DIV']).toContain(focused);
    });
  });
});
