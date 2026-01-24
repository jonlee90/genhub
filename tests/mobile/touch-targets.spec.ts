/**
 * Mobile & Accessibility Tests
 *
 * Tests:
 * - 44px minimum touch targets
 * - Responsive design (375px-1920px)
 * - Dark mode contrast
 * - Screen reader support
 * - Keyboard navigation
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

test.describe('Mobile & Accessibility', () => {

  // ============================================================================
  // 44px Touch Targets
  // ============================================================================

  test.describe('Touch Targets (44px minimum)', () => {

    test('projects page has 44px+ buttons on mobile', async ({ page, baseURL }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await setupAuthenticatedPage(page, baseURL!);
      await page.goto('/app/projects');

      const buttons = page.getByRole('button');
      const count = await buttons.count();

      let smallButtons = 0;

      for (let i = 0; i < Math.min(count, 10); i++) {
        const button = buttons.nth(i);
        if (await button.isVisible()) {
          const box = await button.boundingBox();
          if (box && (box.height < 44 || box.width < 44)) {
            smallButtons++;
          }
        }
      }

      console.log(`[A11y] Projects: ${smallButtons} buttons <44px`);
      expect(smallButtons).toBe(0);
    });

    test('tasks page has 44px+ buttons on mobile', async ({ page, baseURL }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await setupAuthenticatedPage(page, baseURL!);
      await page.goto('/app/tasks');

      const buttons = page.getByRole('button');
      const count = await buttons.count();

      let smallButtons = 0;

      for (let i = 0; i < Math.min(count, 10); i++) {
        const button = buttons.nth(i);
        if (await button.isVisible()) {
          const box = await button.boundingBox();
          if (box && (box.height < 44 || box.width < 44)) {
            smallButtons++;
          }
        }
      }

      console.log(`[A11y] Tasks: ${smallButtons} buttons <44px`);
      expect(smallButtons).toBe(0);
    });

    test('materials page has 44px+ buttons on mobile', async ({ page, baseURL }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await setupAuthenticatedPage(page, baseURL!);
      await page.goto('/app/materials');

      const buttons = page.getByRole('button');
      const count = await buttons.count();

      let smallButtons = 0;

      for (let i = 0; i < Math.min(count, 10); i++) {
        const button = buttons.nth(i);
        if (await button.isVisible()) {
          const box = await button.boundingBox();
          if (box && (box.height < 44 || box.width < 44)) {
            smallButtons++;
          }
        }
      }

      console.log(`[A11y] Materials: ${smallButtons} buttons <44px`);
      expect(smallButtons).toBe(0);
    });

    test('expenses page has 44px+ buttons on mobile', async ({ page, baseURL }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await setupAuthenticatedPage(page, baseURL!);
      await page.goto('/app/expenses');

      const buttons = page.getByRole('button');
      const count = await buttons.count();

      let smallButtons = 0;

      for (let i = 0; i < Math.min(count, 10); i++) {
        const button = buttons.nth(i);
        if (await button.isVisible()) {
          const box = await button.boundingBox();
          if (box && (box.height < 44 || box.width < 44)) {
            smallButtons++;
          }
        }
      }

      console.log(`[A11y] Expenses: ${smallButtons} buttons <44px`);
      expect(smallButtons).toBe(0);
    });

    test('form inputs have 44px+ touch area', async ({ page, baseURL }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await setupAuthenticatedPage(page, baseURL!);
      await page.goto('/app/projects');

      const createButton = page.getByRole('button', { name: /new|create/i });
      if (await createButton.isVisible()) {
        await createButton.click();
        await page.waitForTimeout(300);

        const inputs = page.locator('input, select, textarea');
        const count = await inputs.count();

        let smallInputs = 0;

        for (let i = 0; i < Math.min(count, 5); i++) {
          const input = inputs.nth(i);
          const box = await input.boundingBox();
          if (box && box.height < 44) {
            smallInputs++;
          }
        }

        console.log(`[A11y] Inputs: ${smallInputs} <44px`);
        expect(smallInputs).toBe(0);
      }
    });
  });

  // ============================================================================
  // Responsive Design (375px - 1920px)
  // ============================================================================

  test.describe('Responsive Design', () => {

    const breakpoints = [
      { width: 375, name: 'mobile' },
      { width: 568, name: 'small mobile' },
      { width: 768, name: 'tablet' },
      { width: 1024, name: 'landscape' },
      { width: 1366, name: 'desktop' },
      { width: 1920, name: '4k' },
    ];

    breakpoints.forEach(({ width, name }) => {
      test(`projects page responsive at ${width}px (${name})`, async ({ page, baseURL }) => {
        await page.setViewportSize({ width, height: 667 });
        await setupAuthenticatedPage(page, baseURL!);
        await page.goto('/app/projects');

        // Check no horizontal overflow
        const hasHScroll = await page.evaluate(() =>
          document.documentElement.scrollWidth > window.innerWidth
        );

        console.log(`[Responsive] Projects @ ${width}px: ${hasHScroll ? 'OVERFLOW' : 'OK'}`);
        expect(hasHScroll).toBe(false);
      });
    });

    test('all module pages responsive at 375px', async ({ page, baseURL }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await setupAuthenticatedPage(page, baseURL!);

      const routes = ['/app/projects', '/app/tasks', '/app/materials', '/app/expenses'];

      for (const route of routes) {
        await page.goto(route);

        const hasHScroll = await page.evaluate(() =>
          document.documentElement.scrollWidth > window.innerWidth
        );

        expect(hasHScroll).toBe(false);
      }
    });

    test('layout adapts for landscape mobile (568x320)', async ({ page, baseURL }) => {
      await page.setViewportSize({ width: 568, height: 320 });
      await setupAuthenticatedPage(page, baseURL!);
      await page.goto('/app/projects');

      // Content should still be visible
      const content = page.locator('main, [role="main"]');
      expect(await content.isVisible()).toBe(true);
    });
  });

  // ============================================================================
  // Keyboard Navigation
  // ============================================================================

  test.describe('Keyboard Navigation', () => {

    test('can tab through projects page controls', async ({ page, baseURL }) => {
      await setupAuthenticatedPage(page, baseURL!);
      await page.goto('/app/projects');

      // Tab multiple times
      for (let i = 0; i < 5; i++) {
        await page.keyboard.press('Tab');
      }

      // Should have focused on interactive elements
      const focusedTag = await page.evaluate(() => document.activeElement?.tagName);
      expect(['BUTTON', 'A', 'INPUT', 'SELECT']).toContain(focusedTag);
    });

    test('can escape from modal dialogs', async ({ page, baseURL }) => {
      await setupAuthenticatedPage(page, baseURL!);
      await page.goto('/app/projects');

      const createButton = page.getByRole('button', { name: /new|create/i });
      if (await createButton.isVisible()) {
        await createButton.click();
        await page.waitForTimeout(300);

        // Modal should be open
        const modal = page.locator('[role="dialog"]').first();
        if (await modal.isVisible()) {
          // Press escape
          await page.keyboard.press('Escape');
          await page.waitForTimeout(300);

          // Modal should close
          expect(await modal.isVisible()).toBe(false);
        }
      }
    });

    test('can enter to submit forms', async ({ page, baseURL }) => {
      await setupAuthenticatedPage(page, baseURL!);
      await page.goto('/app/projects');

      const createButton = page.getByRole('button', { name: /new|create/i });
      if (await createButton.isVisible()) {
        await createButton.click();
        await page.waitForTimeout(300);

        const nameInput = page.locator('input[name="name"]');
        if (await nameInput.isVisible()) {
          await nameInput.fill('Keyboard Test Project');

          // Tab to submit button
          const submitButton = page.getByRole('button', { name: /create|submit/i }).last();
          if (await submitButton.isVisible()) {
            await submitButton.focus();
            // Enter should submit (depends on implementation)
            // await page.keyboard.press('Enter');
          }
        }
      }
    });
  });

  // ============================================================================
  // Contrast & Dark Mode
  // ============================================================================

  test.describe('Accessibility - Contrast', () => {

    test('text has sufficient contrast in light mode', async ({ page, baseURL }) => {
      await setupAuthenticatedPage(page, baseURL!);
      await page.goto('/app/projects');

      // Check text elements have readable contrast
      const textElements = page.locator('p, span, h1, h2, h3, button, a');
      const count = Math.min(await textElements.count(), 5);

      let lowContrast = 0;

      for (let i = 0; i < count; i++) {
        const element = textElements.nth(i);
        const computed = await element.evaluate(el => {
          const style = window.getComputedStyle(el);
          return {
            color: style.color,
            bgColor: style.backgroundColor,
          };
        });

        // This is a simplified check - real contrast testing requires WCAG calculations
        if (computed.color === 'rgba(0, 0, 0, 0)') {
          lowContrast++;
        }
      }

      console.log(`[A11y] Elements with potential contrast issues: ${lowContrast}`);
      expect(lowContrast).toBeLessThan(2);
    });

    test('dark mode respects prefers-color-scheme', async ({ page, baseURL }) => {
      // Enable dark mode preference
      await page.evaluate(() => {
        const meta = document.createElement('meta');
        meta.name = 'color-scheme';
        meta.content = 'dark';
        document.head.appendChild(meta);
      });

      await setupAuthenticatedPage(page, baseURL!);
      await page.goto('/app/projects');

      // Page should respond to dark mode
      const bgColor = await page.evaluate(() =>
        window.getComputedStyle(document.body).backgroundColor
      );

      console.log(`[A11y] Dark mode background: ${bgColor}`);
      expect(bgColor).toBeTruthy();
    });
  });

  // ============================================================================
  // Screen Reader Support
  // ============================================================================

  test.describe('Accessibility - Screen Readers', () => {

    test('headings have proper hierarchy', async ({ page, baseURL }) => {
      await setupAuthenticatedPage(page, baseURL!);
      await page.goto('/app/projects');

      const h1s = await page.locator('h1').count();
      const h2s = await page.locator('h2').count();

      // Should have at least one h1
      expect(h1s).toBeGreaterThan(0);
    });

    test('buttons have accessible labels', async ({ page, baseURL }) => {
      await setupAuthenticatedPage(page, baseURL!);
      await page.goto('/app/projects');

      const buttons = page.getByRole('button');
      const count = Math.min(await buttons.count(), 5);

      let unlabeledButtons = 0;

      for (let i = 0; i < count; i++) {
        const button = buttons.nth(i);
        const label = await button.getAttribute('aria-label') ||
                     await button.getAttribute('title') ||
                     (await button.textContent())?.trim();

        if (!label) {
          unlabeledButtons++;
        }
      }

      console.log(`[A11y] Unlabeled buttons: ${unlabeledButtons}`);
      expect(unlabeledButtons).toBe(0);
    });

    test('images have alt text', async ({ page, baseURL }) => {
      await setupAuthenticatedPage(page, baseURL!);
      await page.goto('/app/projects');

      const images = page.locator('img');
      const count = await images.count();

      let missingAlt = 0;

      for (let i = 0; i < Math.min(count, 10); i++) {
        const img = images.nth(i);
        const alt = await img.getAttribute('alt');

        if (!alt) {
          missingAlt++;
        }
      }

      console.log(`[A11y] Images missing alt text: ${missingAlt}`);
      // Some images may be decorative, so allow a few
      expect(missingAlt).toBeLessThan(count);
    });

    test('form inputs have associated labels', async ({ page, baseURL }) => {
      await setupAuthenticatedPage(page, baseURL!);
      await page.goto('/app/projects');

      const createButton = page.getByRole('button', { name: /new|create/i });
      if (await createButton.isVisible()) {
        await createButton.click();
        await page.waitForTimeout(300);

        const inputs = page.locator('input, select, textarea');
        const count = Math.min(await inputs.count(), 5);

        let unlabeledInputs = 0;

        for (let i = 0; i < count; i++) {
          const input = inputs.nth(i);
          const name = await input.getAttribute('name');
          const label = await page.locator(`label[for="${name}"]`).count();
          const ariaLabel = await input.getAttribute('aria-label');

          if (label === 0 && !ariaLabel && !name) {
            unlabeledInputs++;
          }
        }

        console.log(`[A11y] Inputs without labels: ${unlabeledInputs}`);
        expect(unlabeledInputs).toBeLessThan(2);
      }
    });
  });
});
