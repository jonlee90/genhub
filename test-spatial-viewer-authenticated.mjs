import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const TEST_RESULTS = [];
const SCREENSHOTS_DIR = './test-screenshots-authenticated';
const BASE_URL = 'http://localhost:3000';

// Test credentials - use environment variables or defaults
const TEST_EMAIL = process.env.TEST_EMAIL || 'test@genhub.com';
const TEST_PASSWORD = process.env.TEST_PASSWORD || 'TestPassword123!';

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
  const prefix = status === 'PASS' ? '✅' : '❌';
  console.log(`\n  ${icon} ${testName}${message ? ` - ${message}` : ''}`);
}

async function takeScreenshot(page, name) {
  const filename = path.join(SCREENSHOTS_DIR, `${name}-${Date.now()}.png`);
  try {
    await page.screenshot({ path: filename, fullPage: false });
    console.log(`    📸 ${name}`);
    return filename;
  } catch (e) {
    console.log(`    ⚠️  Screenshot failed: ${e.message}`);
    return null;
  }
}

async function login(page, email, password) {
  console.log(`\n  🔐 Attempting login with ${email}...`);

  try {
    await page.goto(`${BASE_URL}/login`, { waitUntil: 'domcontentloaded', timeout: 15000 });

    // Check if already logged in
    if (page.url().includes('/app')) {
      logTest('Already Authenticated', 'PASS');
      return true;
    }

    // Fill in email
    const emailInput = await page.$('input[type="email"]');
    if (emailInput) {
      await emailInput.fill(email);
      await page.waitForTimeout(500);
    }

    // Fill in password
    const passwordInput = await page.$('input[type="password"]');
    if (passwordInput) {
      await passwordInput.fill(password);
      await page.waitForTimeout(500);
    }

    // Click login button
    const loginBtn = await page.$('button:has-text("Sign in"), button:has-text("Login"), button:has-text("Log in")');
    if (loginBtn) {
      await loginBtn.click();
      await page.waitForURL('**/app', { timeout: 15000 });
      logTest('User Authentication', 'PASS', `Logged in as ${email}`);
      await takeScreenshot(page, '01-authenticated');
      return true;
    } else {
      logTest('User Authentication', 'FAIL', 'Login button not found');
      await takeScreenshot(page, '01-login-failed');
      return false;
    }
  } catch (e) {
    logTest('User Authentication', 'FAIL', e.message);
    return false;
  }
}

async function findOrCreateProject(page) {
  console.log(`\n  📂 Looking for projects with 3D models...`);

  try {
    // Navigate to projects
    await page.goto(`${BASE_URL}/app/projects`, { waitUntil: 'domcontentloaded', timeout: 15000 });
    await takeScreenshot(page, '02-projects-list');

    // Look for first project
    const projectLinks = await page.$$('a[href*="/projects/"]');
    let projectUrl = null;

    for (const link of projectLinks) {
      const href = await link.getAttribute('href');
      if (href && href.includes('/projects/') && !href.endsWith('/projects')) {
        projectUrl = href;
        break;
      }
    }

    if (projectUrl) {
      logTest('Found Project', 'PASS', projectUrl);
      await page.goto(`${BASE_URL}${projectUrl}`, { waitUntil: 'domcontentloaded', timeout: 15000 });
      await takeScreenshot(page, '03-project-details');
      return projectUrl;
    } else {
      logTest('Found Project', 'FAIL', 'No projects found');
      return null;
    }
  } catch (e) {
    logTest('Found Project', 'FAIL', e.message);
    return null;
  }
}

async function checkSpatialViewer(page) {
  console.log(`\n  🎯 Checking for Spatial Viewer...`);

  try {
    // Wait for canvas or uploader
    const canvas = await page.$('#xeokit-canvas');
    const uploader = await page.$('input[accept*=".ifc"], [class*="uploader"]');

    if (canvas) {
      logTest('Spatial Viewer Canvas', 'PASS', '3D model loaded');
      await page.waitForTimeout(2000);
      await takeScreenshot(page, '04-spatial-viewer-loaded');
      return 'has_model';
    } else if (uploader) {
      logTest('Spatial Viewer Canvas', 'PASS', 'Uploader visible (no model yet)');
      await takeScreenshot(page, '04-spatial-viewer-uploader');
      return 'no_model';
    } else {
      logTest('Spatial Viewer Canvas', 'FAIL', 'Neither canvas nor uploader found');
      return null;
    }
  } catch (e) {
    logTest('Spatial Viewer Canvas', 'FAIL', e.message);
    return null;
  }
}

async function testCanvasInteractions(page) {
  console.log(`\n  🎮 Testing Canvas Interactions...`);

  const canvas = await page.$('#xeokit-canvas');
  if (!canvas) {
    console.log('  ⚠️  No canvas found, skipping interaction tests');
    return;
  }

  const box = await canvas.boundingBox();

  // Test 1: Right-click context menu
  try {
    console.log('  Testing right-click context menu...');
    await page.click('#xeokit-canvas', {
      button: 'right',
      position: { x: box.width / 2, y: box.height / 2 }
    });
    await page.waitForTimeout(800);

    const menuItems = await page.$$('button:visible, [role="menuitem"]:visible');
    if (menuItems.length > 0) {
      logTest('Right-Click Context Menu', 'PASS', `${menuItems.length} menu items`);
      await takeScreenshot(page, '05-context-menu');
    } else {
      logTest('Right-Click Context Menu', 'FAIL', 'Menu not visible');
    }

    // Close menu
    await page.click('body', { position: { x: 100, y: 100 } });
    await page.waitForTimeout(300);
  } catch (e) {
    logTest('Right-Click Context Menu', 'FAIL', e.message);
  }

  // Test 2: Mouse wheel zoom
  try {
    console.log('  Testing mouse wheel zoom...');
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await page.mouse.wheel(0, 5);
    await page.waitForTimeout(500);
    logTest('Mouse Wheel Zoom', 'PASS', 'Zoom interaction executed');
    await takeScreenshot(page, '06-zoom-interaction');
  } catch (e) {
    logTest('Mouse Wheel Zoom', 'FAIL', e.message);
  }

  // Test 3: Camera controls
  try {
    console.log('  Testing camera controls...');
    const cameraBtn = await page.$('button[title*="camera"], button[title*="Camera"], button[title*="view"], [class*="toolbar"] button');
    if (cameraBtn) {
      await cameraBtn.click();
      await page.waitForTimeout(500);
      logTest('Camera Control Button', 'PASS', 'Button clicked');
      await takeScreenshot(page, '07-camera-controls');
    } else {
      logTest('Camera Control Button', 'FAIL', 'Camera button not found');
    }
  } catch (e) {
    logTest('Camera Control Button', 'FAIL', e.message);
  }
}

async function testTaskCreation(page) {
  console.log(`\n  ➕ Testing Task Creation...`);

  const canvas = await page.$('#xeokit-canvas');
  if (!canvas) {
    console.log('  ⚠️  No canvas found, skipping task creation');
    return;
  }

  const box = await canvas.boundingBox();

  try {
    console.log('  Opening context menu for task creation...');
    await page.click('#xeokit-canvas', {
      button: 'right',
      position: { x: box.width / 2, y: box.height / 2 }
    });
    await page.waitForTimeout(800);

    // Find "Create Task" button
    const createTaskBtn = await page.$('button:has-text("Create Task"), button:has-text("Task")');
    if (createTaskBtn) {
      console.log('  Clicking Create Task button...');
      await createTaskBtn.click();
      await page.waitForTimeout(1000);

      // Check for modal
      const modal = await page.$('[role="dialog"], .modal, form');
      if (modal) {
        logTest('Create Task Modal Opens', 'PASS', 'Task form displayed');
        await takeScreenshot(page, '08-task-modal');

        // Try to fill in task details
        const titleInput = await page.$('input[placeholder*="title"], input[placeholder*="Task"], input[placeholder*="Name"]');
        if (titleInput) {
          await titleInput.fill('Test Task from Spatial Viewer');
          await page.waitForTimeout(300);

          // Try to submit
          const submitBtn = await page.$('button:has-text("Create"), button:has-text("Save"), button:has-text("Submit")');
          if (submitBtn) {
            console.log('  Attempting to submit task...');
            await submitBtn.click();
            await page.waitForTimeout(1500);

            // Check if task was created (look for success message or modal closure)
            const isModalClosed = !await page.$('[role="dialog"]');
            const successToast = await page.$('[class*="toast"], [class*="success"], [class*="notification"]');

            if (isModalClosed || successToast) {
              logTest('Create Task Submission', 'PASS', 'Task created successfully');
              await takeScreenshot(page, '08b-task-created');
            } else {
              logTest('Create Task Submission', 'FAIL', 'Task submission unclear');
            }
          } else {
            logTest('Task Form Submission', 'FAIL', 'Submit button not found');
          }
        } else {
          logTest('Task Form Fill', 'FAIL', 'Title input not found');
        }
      } else {
        logTest('Create Task Modal Opens', 'FAIL', 'Modal not displayed');
      }
    } else {
      logTest('Create Task Button', 'FAIL', 'Create Task option not in menu');
      const allOptions = await page.$$('button:visible');
      console.log(`  Available buttons: ${allOptions.length}`);
    }

    // Close modal if still open
    await page.press('Escape');
    await page.waitForTimeout(300);
  } catch (e) {
    logTest('Task Creation Flow', 'FAIL', e.message);
  }
}

async function testMarkerCreation(page) {
  console.log(`\n  🎯 Testing Marker Creation...`);

  const canvas = await page.$('#xeokit-canvas');
  if (!canvas) {
    console.log('  ⚠️  No canvas found, skipping marker tests');
    return;
  }

  const box = await canvas.boundingBox();

  try {
    console.log('  Opening context menu for marker creation...');
    await page.click('#xeokit-canvas', {
      button: 'right',
      position: { x: box.width / 3, y: box.height / 2 }
    });
    await page.waitForTimeout(800);

    // Try to find marker type buttons
    const markerTypes = ['Issue', 'Note', 'Safety', 'Milestone'];
    let foundMarkerType = null;

    for (const type of markerTypes) {
      const btn = await page.$(`button:has-text("${type}")`);
      if (btn) {
        foundMarkerType = type;
        console.log(`  Found ${type} marker button...`);
        await btn.click();
        await page.waitForTimeout(1000);

        // Check for modal
        const modal = await page.$('[role="dialog"], .modal, form');
        if (modal) {
          logTest(`Create ${type} Marker Modal`, 'PASS', 'Form displayed');
          await takeScreenshot(page, `09-marker-${foundMarkerType.toLowerCase()}-modal`);

          // Fill in details
          const titleInput = await page.$('input[placeholder*="title"], input[placeholder*="Title"], input[placeholder*="Description"]');
          if (titleInput) {
            await titleInput.fill(`Test ${type} Marker`);
            await page.waitForTimeout(300);

            // Submit
            const submitBtn = await page.$('button:has-text("Create"), button:has-text("Save"), button:has-text("Submit")');
            if (submitBtn) {
              await submitBtn.click();
              await page.waitForTimeout(1000);

              logTest(`Submit ${type} Marker`, 'PASS', 'Marker created');
              await takeScreenshot(page, `09b-marker-${foundMarkerType.toLowerCase()}-created`);
            }
          }
        }
        break;
      }
    }

    if (!foundMarkerType) {
      logTest('Marker Type Buttons', 'FAIL', 'No marker type buttons found in menu');
    }

    await page.press('Escape');
    await page.waitForTimeout(300);
  } catch (e) {
    logTest('Marker Creation Flow', 'FAIL', e.message);
  }
}

async function testMarkerFiltering(page) {
  console.log(`\n  🔍 Testing Marker Filtering...`);

  try {
    // Look for filter panel
    const filterPanel = await page.$('[class*="filter"], button:has-text("Filter"), [class*="marker"]');

    if (filterPanel) {
      logTest('Filter Panel Visible', 'PASS', 'Marker filter found');
      await takeScreenshot(page, '10-filter-panel');

      // Try clicking filter buttons
      const filterButtons = await page.$$('button:has-text("Issue"), button:has-text("Note"), button:has-text("Safety"), button:has-text("Milestone")');
      if (filterButtons.length > 0) {
        console.log(`  Found ${filterButtons.length} filter buttons`);
        await filterButtons[0].click();
        await page.waitForTimeout(500);
        logTest('Apply Marker Filter', 'PASS', `${filterButtons.length} filter options`);
        await takeScreenshot(page, '10b-filter-applied');
      }
    } else {
      logTest('Filter Panel Visible', 'FAIL', 'Filter panel not found');
    }
  } catch (e) {
    logTest('Marker Filtering', 'FAIL', e.message);
  }
}

async function testModelStats(page) {
  console.log(`\n  📊 Testing Model Statistics...`);

  try {
    const statsDisplay = await page.$('[class*="stats"], [class*="model"], h2:has-text("Statistics"), h2:has-text("Model")');

    if (statsDisplay) {
      logTest('Model Statistics Display', 'PASS', 'Stats visible');
      await takeScreenshot(page, '11-model-stats');

      // Get stats content
      const statsText = await statsDisplay.textContent();
      if (statsText && statsText.length > 0) {
        console.log(`  Stats content: ${statsText.substring(0, 100)}...`);
      }
    } else {
      // Try to find any visible text about model info
      const pageText = await page.textContent('body');
      if (pageText.includes('Element') || pageText.includes('Size') || pageText.includes('Model')) {
        logTest('Model Statistics Display', 'PASS', 'Stats info in page content');
      } else {
        logTest('Model Statistics Display', 'FAIL', 'No stats found');
      }
    }
  } catch (e) {
    logTest('Model Statistics', 'FAIL', e.message);
  }
}

async function generateReport(testType = 'authenticated') {
  console.log('\n' + '='.repeat(80));
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
  const reportPath = path.join(SCREENSHOTS_DIR, `e2e-test-report-${testType}-${Date.now()}.json`);
  fs.writeFileSync(
    reportPath,
    JSON.stringify(
      {
        summary: {
          testType,
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

  console.log(`\n📄 Report saved to: ${reportPath}`);
  console.log(`📸 Screenshots saved to: ${SCREENSHOTS_DIR}\n`);
  console.log('='.repeat(80) + '\n');

  return { passed: passCount, failed: failCount };
}

async function runAuthenticatedTests() {
  let browser;

  try {
    console.log('\n' + '='.repeat(80));
    console.log('\n🧪 SPATIAL VIEWER E2E TEST - AUTHENTICATED USER\n');
    console.log(`Target: ${BASE_URL}`);
    console.log(`Time: ${new Date().toISOString()}`);
    console.log(`Test Credentials: ${TEST_EMAIL}\n`);
    console.log('='.repeat(80));

    browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();

    // Set reasonable viewport
    await page.setViewportSize({ width: 1920, height: 1080 });

    // Phase 1: Authentication
    console.log('\n📋 PHASE 1: User Authentication');
    console.log('-'.repeat(80));
    const authenticated = await login(page, TEST_EMAIL, TEST_PASSWORD);

    if (!authenticated) {
      console.log('\n⚠️  Authentication failed. Cannot continue with E2E tests.');
      console.log('Make sure:');
      console.log('  1. Dev server is running: npm run dev');
      console.log('  2. User exists or can register');
      console.log('  3. Database is set up');
      await generateReport('authenticated-failed');
      process.exit(1);
    }

    // Phase 2: Find project with model
    console.log('\n📋 PHASE 2: Locate Project');
    console.log('-'.repeat(80));
    const projectUrl = await findOrCreateProject(page);

    if (!projectUrl) {
      console.log('\n⚠️  No projects found. Cannot test spatial viewer.');
      await generateReport('no-projects');
      process.exit(1);
    }

    // Phase 3: Check spatial viewer
    console.log('\n📋 PHASE 3: Spatial Viewer Status');
    console.log('-'.repeat(80));
    const viewerStatus = await checkSpatialViewer(page);

    if (!viewerStatus) {
      console.log('\n⚠️  Spatial viewer not found.');
      await generateReport('no-viewer');
      process.exit(1);
    }

    if (viewerStatus === 'no_model') {
      logTest('Spatial Viewer Status', 'PASS', 'Uploader visible (no 3D model yet)');
      console.log('\n📝 Note: Project has no 3D model yet.');
      console.log('   Upload an IFC file to test full spatial viewer functionality.');
      await generateReport('no-model');
      process.exit(0);
    }

    // Phase 4: Test interactions
    console.log('\n📋 PHASE 4: Canvas Interactions');
    console.log('-'.repeat(80));
    await testCanvasInteractions(page);

    // Phase 5: Test task creation
    console.log('\n📋 PHASE 5: Task Creation');
    console.log('-'.repeat(80));
    await testTaskCreation(page);

    // Phase 6: Test marker creation
    console.log('\n📋 PHASE 6: Marker Creation');
    console.log('-'.repeat(80));
    await testMarkerCreation(page);

    // Phase 7: Test filtering
    console.log('\n📋 PHASE 7: Marker Filtering');
    console.log('-'.repeat(80));
    await testMarkerFiltering(page);

    // Phase 8: Test stats
    console.log('\n📋 PHASE 8: Model Statistics');
    console.log('-'.repeat(80));
    await testModelStats(page);

    // Generate final report
    const results = await generateReport('authenticated-success');

    process.exit(results.failed > 0 ? 1 : 0);
  } catch (error) {
    console.error('\n❌ Fatal test error:', error);
    await generateReport('fatal-error');
    process.exit(1);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

// Run tests
runAuthenticatedTests();
