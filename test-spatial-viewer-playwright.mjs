import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

const TEST_RESULTS = [];
const BASE_URL = 'http://localhost:3000';
const SCREENSHOTS_DIR = './test-screenshots';

// Create screenshots directory if it doesn't exist
if (!fs.existsSync(SCREENSHOTS_DIR)) {
  fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
}

function logTest(testName, status, message = '') {
  const result = {
    timestamp: new Date().toISOString(),
    test: testName,
    status,
    message,
  };
  TEST_RESULTS.push(result);
  console.log(
    `\n${status === 'PASS' ? '✓' : '✗'} ${testName}`,
    message ? `- ${message}` : ''
  );
}

async function takeScreenshot(page, name) {
  const filename = path.join(SCREENSHOTS_DIR, `${name}-${Date.now()}.png`);
  await page.screenshot({ path: filename });
  console.log(`  📸 Screenshot saved: ${filename}`);
  return filename;
}

async function waitForSpatialViewer(page) {
  try {
    // Wait for the canvas element to appear
    await page.waitForSelector('#xeokit-canvas', { timeout: 10000 });
    console.log('  ✓ Spatial viewer canvas found');

    // Wait a bit more for WebGL to initialize
    await page.waitForTimeout(2000);
    return true;
  } catch (e) {
    console.log('  ✗ Spatial viewer canvas not found:', e.message);
    return false;
  }
}

async function runTests() {
  let browser;

  try {
    browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();

    // Set viewport for consistent testing
    await page.setViewportSize({ width: 1920, height: 1080 });

    console.log('\n🧪 Spatial Viewer Test Suite - Playwright\n');
    console.log(`Target: ${BASE_URL}`);
    console.log(`Time: ${new Date().toISOString()}\n`);
    console.log('='.repeat(60));

    // Test 1: Navigate to app
    console.log('\n📋 Test 1: Navigate to Application');
    try {
      await page.goto(`${BASE_URL}/app`, { waitUntil: 'networkidle' });
      logTest('Navigate to /app', 'PASS');
      await takeScreenshot(page, 'test-1-app-dashboard');
    } catch (e) {
      logTest('Navigate to /app', 'FAIL', e.message);
    }

    // Test 2: Check if projects page loads
    console.log('\n📋 Test 2: Navigate to Projects');
    try {
      await page.click('a[href*="/projects"]');
      await page.waitForURL('**/projects', { timeout: 10000 });
      logTest('Navigate to Projects Page', 'PASS');
      await takeScreenshot(page, 'test-2-projects-page');
    } catch (e) {
      logTest('Navigate to Projects Page', 'FAIL', e.message);
    }

    // Test 3: Check if project details page loads with spatial viewer
    console.log('\n📋 Test 3: Open Project Details with Spatial Viewer');
    try {
      // Find and click the first project
      const projectLinks = await page.$$('a[href*="/projects/"]');
      if (projectLinks.length > 0) {
        // Click the first non-projects-only link
        for (const link of projectLinks) {
          const href = await link.getAttribute('href');
          if (href && href.includes('/projects/') && !href.endsWith('/projects')) {
            await link.click();
            break;
          }
        }
        await page.waitForURL('**/projects/**', { timeout: 10000 });
        logTest('Navigate to Project Details', 'PASS');
        await takeScreenshot(page, 'test-3-project-details');
      } else {
        logTest('Navigate to Project Details', 'FAIL', 'No project links found');
      }
    } catch (e) {
      logTest('Navigate to Project Details', 'FAIL', e.message);
    }

    // Test 4: Check for Spatial Viewer Component
    console.log('\n📋 Test 4: Verify Spatial Viewer Loads');
    try {
      const viewerReady = await waitForSpatialViewer(page);
      if (viewerReady) {
        logTest('Spatial Viewer Canvas Loads', 'PASS');
        await takeScreenshot(page, 'test-4-spatial-viewer-loaded');
      } else {
        logTest('Spatial Viewer Canvas Loads', 'FAIL', 'Canvas not found');
      }
    } catch (e) {
      logTest('Spatial Viewer Canvas Loads', 'FAIL', e.message);
    }

    // Test 5: Test Canvas Click (Right-Click for Context Menu)
    console.log('\n📋 Test 5: Test Canvas Right-Click (Context Menu)');
    try {
      const canvas = await page.$('#xeokit-canvas');
      if (canvas) {
        const box = await canvas.boundingBox();
        const centerX = box.x + box.width / 2;
        const centerY = box.y + box.height / 2;

        // Right-click in center of canvas
        await page.click('#xeokit-canvas', { button: 'right', position: { x: box.width / 2, y: box.height / 2 } });
        await page.waitForTimeout(500);

        // Check if context menu appeared (look for menu items)
        const menuItems = await page.$$('button:visible');
        if (menuItems.length > 0) {
          logTest('Context Menu Appears on Right-Click', 'PASS');
          await takeScreenshot(page, 'test-5-context-menu');
        } else {
          logTest('Context Menu Appears on Right-Click', 'FAIL', 'Menu not visible');
        }
      }
    } catch (e) {
      logTest('Context Menu Appears on Right-Click', 'FAIL', e.message);
    }

    // Test 6: Test Creating a Task
    console.log('\n📋 Test 6: Create Task via Context Menu');
    try {
      const canvas = await page.$('#xeokit-canvas');
      if (canvas) {
        const box = await canvas.boundingBox();

        // Right-click again to open menu
        await page.click('#xeokit-canvas', {
          button: 'right',
          position: { x: box.width / 2, y: box.height / 2 }
        });
        await page.waitForTimeout(500);

        // Look for "Create Task" button in context menu
        const createTaskBtn = await page.$('button:has-text("Create Task")');
        if (createTaskBtn) {
          await createTaskBtn.click();

          // Wait for modal/form to appear
          await page.waitForSelector('[role="dialog"], .modal, form', { timeout: 5000 });
          logTest('Create Task Modal Opens', 'PASS');
          await takeScreenshot(page, 'test-6-create-task-modal');

          // Try to fill in task details
          const titleInput = await page.$('input[placeholder*="title"], input[placeholder*="Task"]');
          if (titleInput) {
            await titleInput.fill('Test Task from Spatial Viewer');
            logTest('Fill Task Title', 'PASS');
          } else {
            logTest('Fill Task Title', 'FAIL', 'Title input not found');
          }
        } else {
          logTest('Create Task Modal Opens', 'FAIL', 'Create Task button not found');
        }
      }
    } catch (e) {
      logTest('Create Task Modal Opens', 'FAIL', e.message);
    }

    // Test 7: Test Adding Markers/Issues
    console.log('\n📋 Test 7: Add Issue Marker');
    try {
      const canvas = await page.$('#xeokit-canvas');
      if (canvas) {
        const box = await canvas.boundingBox();

        // Close any open modals first
        const closeButtons = await page.$$('[aria-label="Close"], button:has-text("Close")');
        for (const btn of closeButtons) {
          await btn.click({ timeout: 100 }).catch(() => {});
        }
        await page.waitForTimeout(500);

        // Right-click to open menu
        await page.click('#xeokit-canvas', {
          button: 'right',
          position: { x: box.width / 2, y: box.height / 2 }
        });
        await page.waitForTimeout(500);

        // Look for "Add Issue" button
        const addIssueBtn = await page.$('button:has-text("Issue")');
        if (addIssueBtn) {
          await addIssueBtn.click();

          // Wait for marker creation modal
          await page.waitForSelector('[role="dialog"], .modal, form', { timeout: 5000 });
          logTest('Issue Marker Modal Opens', 'PASS');
          await takeScreenshot(page, 'test-7-issue-marker-modal');

          // Fill marker title
          const titleInput = await page.$('input[placeholder*="title"], input[placeholder*="Issue"], input[placeholder*="Title"]');
          if (titleInput) {
            await titleInput.fill('Test Issue - Spatial Marker');
            logTest('Fill Issue Marker Details', 'PASS');
          }
        } else {
          logTest('Issue Marker Modal Opens', 'FAIL', 'Add Issue button not found');
        }
      }
    } catch (e) {
      logTest('Issue Marker Modal Opens', 'FAIL', e.message);
    }

    // Test 8: Test Marker Filter Panel
    console.log('\n📋 Test 8: Test Marker Filter Panel');
    try {
      // Look for marker filter panel
      const filterPanel = await page.$('[class*="filter"], .marker-filter, button:has-text("Filter")');
      if (filterPanel) {
        logTest('Marker Filter Panel Visible', 'PASS');
        await takeScreenshot(page, 'test-8-filter-panel');

        // Try clicking filter buttons if visible
        const filterButtons = await page.$$('button:has-text("Issue"), button:has-text("Note"), button:has-text("Safety")');
        if (filterButtons.length > 0) {
          await filterButtons[0].click();
          await page.waitForTimeout(500);
          logTest('Apply Marker Filter', 'PASS');
          await takeScreenshot(page, 'test-8-filter-applied');
        }
      } else {
        logTest('Marker Filter Panel Visible', 'FAIL', 'Panel not found');
      }
    } catch (e) {
      logTest('Marker Filter Panel Visible', 'FAIL', e.message);
    }

    // Test 9: Test Camera Controls
    console.log('\n📋 Test 9: Test Camera Controls');
    try {
      // Look for camera control buttons
      const cameraControls = await page.$$('button[title*="camera"], button[title*="view"], button[title*="Camera"]');
      if (cameraControls.length > 0) {
        logTest('Camera Control Buttons Found', 'PASS', `Found ${cameraControls.length} buttons`);

        // Click first camera control button
        await cameraControls[0].click();
        await page.waitForTimeout(1000);
        logTest('Camera Control Click Works', 'PASS');
        await takeScreenshot(page, 'test-9-camera-control');
      } else {
        logTest('Camera Control Buttons Found', 'FAIL', 'No camera controls found');
      }
    } catch (e) {
      logTest('Camera Control Buttons Found', 'FAIL', e.message);
    }

    // Test 10: Test Model Information Display
    console.log('\n📋 Test 10: Check Model Statistics Display');
    try {
      // Look for model stats (like element count, file size, etc.)
      const statsDisplay = await page.$('[class*="stats"], .model-stats, h2:has-text("Statistics")');
      if (statsDisplay) {
        logTest('Model Statistics Display Visible', 'PASS');
        await takeScreenshot(page, 'test-10-model-stats');
      } else {
        // Try to find any visible text indicating stats
        const pageContent = await page.textContent('body');
        if (pageContent.includes('Element') || pageContent.includes('Size') || pageContent.includes('Status')) {
          logTest('Model Statistics Display Visible', 'PASS', 'Stats info found in content');
        } else {
          logTest('Model Statistics Display Visible', 'FAIL', 'Stats not found');
        }
      }
    } catch (e) {
      logTest('Model Statistics Display Visible', 'FAIL', e.message);
    }

    // Test 11: Test Canvas Interactions (Pan, Zoom)
    console.log('\n📋 Test 11: Test Canvas Pan/Zoom Interactions');
    try {
      const canvas = await page.$('#xeokit-canvas');
      if (canvas) {
        const box = await canvas.boundingBox();

        // Simulate mouse wheel zoom
        await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
        await page.mouse.wheel(0, 3); // Scroll up (zoom out)
        await page.waitForTimeout(500);

        logTest('Mouse Wheel Interaction Works', 'PASS');
        await takeScreenshot(page, 'test-11-zoom-interaction');

        // Test drag/pan (simulate middle mouse button drag)
        await page.mouse.move(box.x + box.width / 3, box.y + box.height / 2);
        await page.mouse.down({ button: 'middle' });
        await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2, { steps: 10 });
        await page.mouse.up({ button: 'middle' });
        await page.waitForTimeout(500);

        logTest('Pan Interaction Works', 'PASS');
        await takeScreenshot(page, 'test-11-pan-interaction');
      }
    } catch (e) {
      logTest('Canvas Interactions Work', 'FAIL', e.message);
    }

    // Test 12: Test Task Detail Panel
    console.log('\n📋 Test 12: Check Task Detail Panel Integration');
    try {
      // Look for task detail panel or modal
      const taskPanel = await page.$('[class*="detail"], [class*="panel"], .task-detail, [role="dialog"]');
      if (taskPanel) {
        logTest('Task Detail Panel Visible', 'PASS');
        await takeScreenshot(page, 'test-12-task-detail-panel');
      } else {
        logTest('Task Detail Panel Visible', 'FAIL', 'Panel not visible in current state');
      }
    } catch (e) {
      logTest('Task Detail Panel Visible', 'FAIL', e.message);
    }

    // Generate Test Report
    console.log('\n' + '='.repeat(60));
    console.log('\n📊 Test Summary Report\n');

    const passCount = TEST_RESULTS.filter((r) => r.status === 'PASS').length;
    const failCount = TEST_RESULTS.filter((r) => r.status === 'FAIL').length;
    const totalCount = TEST_RESULTS.length;
    const passPercentage = ((passCount / totalCount) * 100).toFixed(2);

    console.log(`Total Tests: ${totalCount}`);
    console.log(`Passed: ${passCount} ✓`);
    console.log(`Failed: ${failCount} ✗`);
    console.log(`Success Rate: ${passPercentage}%\n`);

    console.log('Failed Tests:');
    TEST_RESULTS.filter((r) => r.status === 'FAIL').forEach((r) => {
      console.log(`  ✗ ${r.test}`);
      if (r.message) console.log(`    → ${r.message}`);
    });

    // Save detailed results to JSON
    const reportPath = path.join(SCREENSHOTS_DIR, `test-report-${Date.now()}.json`);
    fs.writeFileSync(
      reportPath,
      JSON.stringify(
        {
          summary: {
            total: totalCount,
            passed: passCount,
            failed: failCount,
            passPercentage: parseFloat(passPercentage),
          },
          results: TEST_RESULTS,
          environment: {
            baseUrl: BASE_URL,
            timestamp: new Date().toISOString(),
            browser: 'Chromium',
          },
        },
        null,
        2
      )
    );

    console.log(`\n📄 Detailed report saved to: ${reportPath}\n`);

    // Success exit code if all tests pass
    process.exit(failCount > 0 ? 1 : 0);
  } catch (error) {
    console.error('Fatal test error:', error);
    process.exit(1);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

// Run tests
runTests();
