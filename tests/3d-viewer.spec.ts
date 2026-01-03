import { test, expect } from '@playwright/test';

test.describe('3D Viewer Tests', () => {
  test('Navigate to project and verify 3D viewer loads', async ({ page }) => {
    console.log('Test: 3D Viewer Loading');
    
    const errors = [];
    const logs = [];

    page.on('console', (msg) => {
      const text = msg.text();
      logs.push(`[${msg.type()}] ${text}`);
    });

    page.on('pageerror', (error) => {
      errors.push(error.message);
    });

    await page.goto('http://localhost:3000/app/projects/cac08f15-4a7d-4606-ae02-0cf7cc45240a', {
      waitUntil: 'domcontentloaded'
    });

    const canvas = page.locator('canvas').first();
    await canvas.waitFor({ timeout: 5000 });
    
    const isVisible = await canvas.isVisible();
    expect(isVisible).toBe(true);

    await page.waitForTimeout(3000);

    const abortErrors = errors.filter(e => e.includes('AbortError'));
    const pluginErrors = errors.filter(e => e.includes('addPlugin'));
    
    console.log(`Errors: ${errors.length}, AbortErrors: ${abortErrors.length}, PluginErrors: ${pluginErrors.length}`);
  });

  test('Capture 3D viewer screenshot', async ({ page }) => {
    await page.goto('http://localhost:3000/app/projects/cac08f15-4a7d-4606-ae02-0cf7cc45240a', {
      waitUntil: 'domcontentloaded'
    });

    const canvas = page.locator('canvas').first();
    await canvas.waitFor({ timeout: 5000 });
    
    await page.waitForTimeout(2000);

    const screenshotPath = '/Users/jonathanlee/Desktop/genhub/output/3d-viewer-test-result.png';
    await page.screenshot({ path: screenshotPath, fullPage: true });
  });
});
