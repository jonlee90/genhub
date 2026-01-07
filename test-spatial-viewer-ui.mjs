import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

const TEST_RESULTS = [];
const BASE_URL = 'http://localhost:3000';
const SCREENSHOTS_DIR = './test-screenshots';

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
  const icon = status === 'PASS' ? '✓' : '✗';
  console.log(`\n  ${icon} ${testName}`, message ? `- ${message}` : '');
}

async function takeScreenshot(page, name) {
  const filename = path.join(SCREENSHOTS_DIR, `${name}-${Date.now()}.png`);
  try {
    await page.screenshot({ path: filename, fullPage: false });
    console.log(`    📸 Screenshot: ${name}`);
  } catch (e) {
    console.log(`    ⚠ Screenshot failed: ${e.message}`);
  }
}

async function runTests() {
  let browser;

  try {
    browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();

    await page.setViewportSize({ width: 1920, height: 1080 });

    console.log('\n' + '='.repeat(70));
    console.log('🧪 SPATIAL VIEWER COMPONENT TEST SUITE - UI Verification');
    console.log('='.repeat(70));
    console.log(`\n📍 Target: ${BASE_URL}`);
    console.log(`⏰ Time: ${new Date().toISOString()}\n`);

    // Step 1: Check page structure
    console.log('\n📋 PHASE 1: Verify Page Structure & Navigation');
    console.log('-'.repeat(70));

    try {
      await page.goto(`${BASE_URL}/app`, { waitUntil: 'domcontentloaded', timeout: 15000 });

      // Check if we got redirected to login or landed on app
      const currentUrl = page.url();
      console.log(`Current URL: ${currentUrl}`);

      if (currentUrl.includes('/login')) {
        logTest('Authentication Check', 'PASS', 'Redirected to login (expected for unauthenticated user)');
        await takeScreenshot(page, 'test-1-login-page');
        console.log('\n⚠️  Note: Cannot test spatial viewer without authentication.');
        console.log('   The spatial viewer requires an authenticated user and a project with a 3D model.');
        console.log('   To test with real data:');
        console.log('   1. Log in to GenHub');
        console.log('   2. Create or navigate to a project');
        console.log('   3. Upload a 3D IFC model');
        console.log('   4. Run this test again\n');

        // Try to find a demo or test project
        console.log('📊 Testing Component Visibility (without Authentication):\n');

        // Check if components exist in the HTML even if not visible
        const projectLinks = await page.$$('[href*="/projects"]');
        logTest('Project Links Present in DOM', projectLinks.length > 0 ? 'PASS' : 'FAIL',
          `Found ${projectLinks.length} project links`);

        const spatialViewerElements = await page.$$('[class*="spatial"], [class*="viewer"], #xeokit-canvas');
        logTest('Spatial Viewer Elements in DOM', spatialViewerElements.length > 0 ? 'PASS' : 'FAIL',
          `Found ${spatialViewerElements.length} viewer-related elements`);

      } else {
        // We're authenticated, continue testing
        logTest('Page Load', 'PASS', 'Successfully loaded /app');
        await takeScreenshot(page, 'test-1-app-page');

        // Step 2: Navigate to a project
        console.log('\n📋 PHASE 2: Navigate to Projects & Spatial Viewer');
        console.log('-'.repeat(70));

        try {
          // Try to find and click a project link
          const projectSelector = 'a[href*="/projects/"], [role="link"][href*="/projects/"]';
          const projectLink = await page.$(projectSelector);

          if (projectLink) {
            const projectUrl = await projectLink.getAttribute('href');
            console.log(`Found project link: ${projectUrl}`);

            await projectLink.click();
            await page.waitForURL(`**${projectUrl}`, { timeout: 10000 });

            logTest('Navigate to Project Details', 'PASS');
            await takeScreenshot(page, 'test-2-project-page');

            // Step 3: Check for Spatial Viewer
            console.log('\n📋 PHASE 3: Verify Spatial Viewer Components');
            console.log('-'.repeat(70));

            // Check for canvas
            const canvas = await page.$('#xeokit-canvas');
            if (canvas) {
              logTest('Spatial Viewer Canvas', 'PASS', 'Canvas element #xeokit-canvas found');

              // Wait for canvas to render
              await page.waitForTimeout(2000);
              await takeScreenshot(page, 'test-3-spatial-viewer');

              // Check for viewer toolbar
              const toolbar = await page.$('[class*="toolbar"], [class*="camera"], button[title*="camera"]');
              logTest('Viewer Toolbar/Controls', toolbar ? 'PASS' : 'FAIL',
                toolbar ? 'Controls found' : 'Controls not visible');

              // Check for filter panel
              const filterPanel = await page.$('[class*="filter"], button:has-text("Filter")');
              logTest('Marker Filter Panel', filterPanel ? 'PASS' : 'FAIL',
                filterPanel ? 'Panel found' : 'Panel not visible');

              // Check for model stats
              const stats = await page.$('[class*="stats"], [class*="model-stats"]');
              logTest('Model Statistics Display', stats ? 'PASS' : 'FAIL',
                stats ? 'Stats display found' : 'Stats not visible');

              // Check for marker annotation panel
              const markerPanel = await page.$('[class*="marker"], [class*="annotation"]');
              logTest('Marker Annotation Panel', markerPanel ? 'PASS' : 'FAIL',
                markerPanel ? 'Panel found' : 'Panel not visible');

            } else {
              logTest('Spatial Viewer Canvas', 'FAIL', 'Canvas #xeokit-canvas not found');

              // Check if there's an IFC uploader instead (no model loaded)
              const uploader = await page.$('[class*="upload"], input[accept*=".ifc"]');
              if (uploader) {
                logTest('IFC Uploader (No Model Loaded)', 'PASS',
                  'Project has no 3D model yet - uploader visible');
              }
            }

            // Step 4: Test Interactions (if canvas exists)
            const canvasElement = await page.$('#xeokit-canvas');
            if (canvasElement) {
              console.log('\n📋 PHASE 4: Test User Interactions');
              console.log('-'.repeat(70));

              const box = await canvasElement.boundingBox();

              // Test right-click for context menu
              try {
                await page.click('#xeokit-canvas', {
                  button: 'right',
                  position: { x: box.width / 2, y: box.height / 2 }
                });
                await page.waitForTimeout(500);

                const menuItems = await page.$$('[role="menuitem"], button:visible');
                logTest('Right-Click Context Menu', menuItems.length > 0 ? 'PASS' : 'FAIL',
                  menuItems.length > 0 ? `Menu with ${menuItems.length} items` : 'Menu not shown');

                if (menuItems.length > 0) {
                  await takeScreenshot(page, 'test-4-context-menu');
                }

                // Click elsewhere to close menu
                await page.click('body');
              } catch (e) {
                logTest('Right-Click Context Menu', 'FAIL', e.message);
              }

              // Test mouse wheel zoom
              try {
                await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
                await page.mouse.wheel(0, 3);
                await page.waitForTimeout(300);
                logTest('Mouse Wheel Zoom', 'PASS', 'Zoom interaction executed');
                await takeScreenshot(page, 'test-5-zoom');
              } catch (e) {
                logTest('Mouse Wheel Zoom', 'FAIL', e.message);
              }

              // Test camera controls
              try {
                const cameraBtn = await page.$('button[title*="camera"], button[title*="Camera"], button[title*="view"]');
                if (cameraBtn) {
                  await cameraBtn.click();
                  await page.waitForTimeout(500);
                  logTest('Camera Control Button Click', 'PASS', 'Button clicked successfully');
                  await takeScreenshot(page, 'test-6-camera-control');
                } else {
                  logTest('Camera Control Button Click', 'FAIL', 'Camera button not found');
                }
              } catch (e) {
                logTest('Camera Control Button Click', 'FAIL', e.message);
              }

              // Step 5: Test Modal Interactions
              console.log('\n📋 PHASE 5: Test Modal & Form Interactions');
              console.log('-'.repeat(70));

              try {
                // Open context menu and try to create task
                await page.click('#xeokit-canvas', {
                  button: 'right',
                  position: { x: box.width / 2, y: box.height / 2 }
                });
                await page.waitForTimeout(500);

                const createTaskBtn = await page.$('button:has-text("Create Task"), button:has-text("Task")');
                if (createTaskBtn) {
                  await createTaskBtn.click();
                  await page.waitForTimeout(1000);

                  const modal = await page.$('[role="dialog"], .modal, form');
                  logTest('Create Task Modal Opens', modal ? 'PASS' : 'FAIL',
                    modal ? 'Modal displayed' : 'Modal not shown');

                  if (modal) {
                    await takeScreenshot(page, 'test-7-task-modal');
                  }
                } else {
                  logTest('Create Task Button', 'FAIL', 'Create Task button not found in menu');
                }

                // Close modal
                await page.press('Escape');
              } catch (e) {
                logTest('Create Task Modal', 'FAIL', e.message);
              }

              // Test adding markers
              try {
                await page.click('#xeokit-canvas', {
                  button: 'right',
                  position: { x: box.width / 3, y: box.height / 2 }
                });
                await page.waitForTimeout(500);

                const issueBtn = await page.$('button:has-text("Issue")');
                if (issueBtn) {
                  await issueBtn.click();
                  await page.waitForTimeout(1000);

                  const modal = await page.$('[role="dialog"], .modal, form');
                  logTest('Create Issue Marker Modal', modal ? 'PASS' : 'FAIL',
                    modal ? 'Marker modal displayed' : 'Modal not shown');

                  if (modal) {
                    await takeScreenshot(page, 'test-8-marker-modal');
                  }
                } else {
                  logTest('Add Issue Marker', 'FAIL', 'Issue button not found');
                }

                await page.press('Escape');
              } catch (e) {
                logTest('Add Issue Marker', 'FAIL', e.message);
              }
            }

          } else {
            logTest('Navigate to Project', 'FAIL', 'No project links found');
          }
        } catch (e) {
          logTest('Navigate to Project Details', 'FAIL', e.message);
        }
      }
    } catch (e) {
      logTest('Page Load', 'FAIL', e.message);
    }

    // Generate Report
    console.log('\n' + '='.repeat(70));
    console.log('\n📊 TEST RESULTS SUMMARY\n');

    const passCount = TEST_RESULTS.filter((r) => r.status === 'PASS').length;
    const failCount = TEST_RESULTS.filter((r) => r.status === 'FAIL').length;
    const totalCount = TEST_RESULTS.length;
    const passPercentage = totalCount > 0 ? ((passCount / totalCount) * 100).toFixed(2) : '0';

    console.log(`Total Tests Run: ${totalCount}`);
    console.log(`✓ Passed: ${passCount}`);
    console.log(`✗ Failed: ${failCount}`);
    console.log(`Success Rate: ${passPercentage}%\n`);

    if (failCount > 0) {
      console.log('Failed Tests:');
      TEST_RESULTS.filter((r) => r.status === 'FAIL').forEach((r) => {
        console.log(`  ✗ ${r.test}`);
        if (r.message) console.log(`    → ${r.message}`);
      });
    }

    console.log('\nPassed Tests:');
    TEST_RESULTS.filter((r) => r.status === 'PASS').forEach((r) => {
      console.log(`  ✓ ${r.test}`);
      if (r.message) console.log(`    → ${r.message}`);
    });

    // Save report
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
            timestamp: new Date().toISOString(),
          },
          results: TEST_RESULTS,
        },
        null,
        2
      )
    );

    console.log(`\n📄 Full report saved to: ${reportPath}`);
    console.log(`📸 Screenshots saved to: ${SCREENSHOTS_DIR}\n`);
    console.log('='.repeat(70) + '\n');

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

runTests();
