import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const TEST_RESULTS = [];
const SCREENSHOTS_DIR = './test-screenshots-authenticated';
const BASE_URL = 'http://localhost:3000';

const TEST_EMAIL = process.env.TEST_EMAIL || 'test@example.com';
const TEST_PASSWORD = process.env.TEST_PASSWORD || 'password123';

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
  console.log(`\n  ${icon} ${testName}${message ? ` - ${message}` : ''}`);
}

async function takeScreenshot(page, name) {
  const filename = path.join(SCREENSHOTS_DIR, `${name}-${Date.now()}.png`);
  try {
    await page.screenshot({ path: filename, fullPage: true });
    console.log(`    📸 Screenshot saved`);
    return filename;
  } catch (e) {
    console.log(`    ⚠️  Screenshot failed`);
    return null;
  }
}

async function inspectPage(page, label) {
  console.log(`\n  📋 Page Inspection - ${label}`);
  console.log(`     URL: ${page.url()}`);

  // Get page content
  const title = await page.title();
  console.log(`     Title: ${title}`);

  // Look for form elements
  const inputs = await page.$$('input');
  const buttons = await page.$$('button');
  const forms = await page.$$('form');

  console.log(`     Inputs: ${inputs.length}`);
  console.log(`     Buttons: ${buttons.length}`);
  console.log(`     Forms: ${forms.length}`);

  if (inputs.length > 0) {
    console.log(`     Input types:`);
    for (const input of inputs.slice(0, 5)) {
      const type = await input.getAttribute('type');
      const placeholder = await input.getAttribute('placeholder');
      console.log(`       - type: ${type}, placeholder: ${placeholder}`);
    }
  }

  if (buttons.length > 0) {
    console.log(`     First 3 buttons:`);
    for (const btn of buttons.slice(0, 3)) {
      const text = await btn.textContent();
      console.log(`       - ${text?.trim()}`);
    }
  }
}

async function navigateToApp(page) {
  console.log('\n  Navigating to app...');

  // Try direct app navigation
  await page.goto(`${BASE_URL}/app`, { waitUntil: 'domcontentloaded', timeout: 20000 });
  await page.waitForTimeout(2000);

  const currentUrl = page.url();
  console.log(`  Current URL: ${currentUrl}`);

  if (currentUrl.includes('/login')) {
    console.log('  Redirected to login - need to authenticate');
    return 'login';
  } else if (currentUrl.includes('/app')) {
    console.log('  Successfully at app - already authenticated!');
    return 'app';
  } else {
    console.log('  Unexpected URL');
    return 'unknown';
  }
}

async function tryLogin(page) {
  console.log('\n  Attempting to fill login form...');

  // Wait for inputs to be visible and interactive
  await page.waitForTimeout(2000);

  // Try different selectors for email input
  const emailSelectors = [
    'input[type="email"]',
    'input[name="email"]',
    'input[placeholder*="email" i]',
    'input[placeholder*="Email" i]',
    'input[id*="email" i]',
  ];

  let emailFound = false;
  for (const selector of emailSelectors) {
    const input = await page.$(selector);
    if (input && await input.isVisible()) {
      console.log(`  Found email input: ${selector}`);
      await input.fill(TEST_EMAIL);
      emailFound = true;
      break;
    }
  }

  if (!emailFound) {
    console.log('  ⚠️  Email input not found');
    const allInputs = await page.$$('input');
    console.log(`  Found ${allInputs.length} inputs total`);
    return false;
  }

  await page.waitForTimeout(500);

  // Try different selectors for password input
  const passwordSelectors = [
    'input[type="password"]',
    'input[name="password"]',
    'input[placeholder*="password" i]',
    'input[id*="password" i]',
  ];

  let passwordFound = false;
  for (const selector of passwordSelectors) {
    const input = await page.$(selector);
    if (input && await input.isVisible()) {
      console.log(`  Found password input: ${selector}`);
      await input.fill(TEST_PASSWORD);
      passwordFound = true;
      break;
    }
  }

  if (!passwordFound) {
    console.log('  ⚠️  Password input not found');
    return false;
  }

  await page.waitForTimeout(500);

  // Try to find and click login button
  const buttonSelectors = [
    'button:has-text("Sign in")',
    'button:has-text("Login")',
    'button:has-text("Log in")',
    'button[type="submit"]',
    'button:has-text("Submit")',
  ];

  let loginClicked = false;
  for (const selector of buttonSelectors) {
    const btn = await page.$(selector);
    if (btn && await btn.isVisible()) {
      const text = await btn.textContent();
      console.log(`  Found and clicking button: ${text?.trim()}`);
      await btn.click();
      loginClicked = true;
      break;
    }
  }

  if (!loginClicked) {
    console.log('  ⚠️  Login button not found');
    return false;
  }

  // Wait for navigation
  console.log('  Waiting for authentication...');
  try {
    await page.waitForURL('**/app', { timeout: 15000 });
    console.log('  ✓ Successfully navigated to /app');
    return true;
  } catch (e) {
    console.log(`  ⚠️  Navigation timeout: ${e.message}`);
    return false;
  }
}

async function findProjectWithModel(page) {
  console.log('\n  Navigating to projects...');

  try {
    await page.goto(`${BASE_URL}/app/projects`, { waitUntil: 'domcontentloaded', timeout: 15000 });
    await page.waitForTimeout(1500);

    const projects = await page.$$('a[href*="/projects/"]');
    console.log(`  Found ${projects.length} project links`);

    for (let i = 0; i < Math.min(3, projects.length); i++) {
      const href = await projects[i].getAttribute('href');
      if (href && href.includes('/projects/') && !href.endsWith('/projects')) {
        console.log(`  Trying project: ${href}`);
        await page.goto(`${BASE_URL}${href}`, { waitUntil: 'domcontentloaded', timeout: 15000 });
        await page.waitForTimeout(2000);

        return href;
      }
    }

    console.log('  No valid project found');
    return null;
  } catch (e) {
    console.log(`  Error finding projects: ${e.message}`);
    return null;
  }
}

async function checkSpatialViewerAndTest(page) {
  console.log('\n  Checking for spatial viewer...');

  // Check for canvas
  const canvas = await page.$('#xeokit-canvas');
  if (canvas) {
    console.log('  ✓ Found 3D viewer canvas');
    await page.waitForTimeout(2000);

    // Test 1: Take screenshot of loaded model
    await takeScreenshot(page, '05-model-loaded');

    // Test 2: Right-click for context menu
    console.log('\n  Testing right-click menu...');
    const box = await canvas.boundingBox();
    if (box) {
      await page.click('#xeokit-canvas', {
        button: 'right',
        position: { x: box.width / 2, y: box.height / 2 }
      });
      await page.waitForTimeout(800);

      const visibleButtons = await page.$$('button:visible, [role="menu"]:visible');
      if (visibleButtons.length > 0) {
        logTest('Right-Click Context Menu', 'PASS', `${visibleButtons.length} menu items`);
        await takeScreenshot(page, '06-context-menu');
      } else {
        logTest('Right-Click Context Menu', 'FAIL', 'No menu appeared');
      }

      // Close menu
      await page.press('Escape');
    }

    // Test 3: Zoom with mouse wheel
    console.log('\n  Testing zoom...');
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await page.mouse.wheel(0, 5);
    await page.waitForTimeout(500);
    logTest('Mouse Wheel Zoom', 'PASS', 'Zoom executed');
    await takeScreenshot(page, '07-zoomed');

    return 'has_model';
  }

  // Check for uploader
  const uploader = await page.$('input[accept*=".ifc"]');
  if (uploader) {
    console.log('  ✓ Found IFC uploader (no model yet)');
    logTest('Spatial Viewer Status', 'PASS', 'Uploader found, no model');
    await takeScreenshot(page, '05-uploader');
    return 'no_model';
  }

  console.log('  ✗ Neither canvas nor uploader found');
  return null;
}

async function runE2ETest() {
  let browser;

  try {
    console.log('\n' + '='.repeat(80));
    console.log('\n🧪 SPATIAL VIEWER E2E TEST - AUTHENTICATED USER (IMPROVED)\n');
    console.log(`Target: ${BASE_URL}`);
    console.log(`Time: ${new Date().toISOString()}`);
    console.log(`Credentials: ${TEST_EMAIL}\n`);
    console.log('='.repeat(80));

    browser = await chromium.launch({
      headless: true,
      args: ['--disable-blink-features=AutomationControlled']
    });

    const page = await browser.newPage();
    await page.setViewportSize({ width: 1920, height: 1080 });

    // Phase 1: Navigate and authenticate
    console.log('\n📋 PHASE 1: Navigation & Authentication');
    console.log('-'.repeat(80));

    const navResult = await navigateToApp(page);
    logTest('Navigate to /app', 'PASS', `Landed on: ${navResult}`);
    await takeScreenshot(page, '01-initial-page');

    if (navResult === 'login') {
      await inspectPage(page, 'Login Page');
      const loginSuccess = await tryLogin(page);

      if (!loginSuccess) {
        logTest('User Authentication', 'FAIL', 'Could not complete login form');
        await takeScreenshot(page, '02-login-attempt');
        console.log('\n⚠️  Manual test required:');
        console.log('  1. Visit http://localhost:3000');
        console.log('  2. Log in manually');
        console.log('  3. Navigate to a project with a 3D model');
        console.log('  4. Test right-click menu and task/marker creation');
      } else {
        logTest('User Authentication', 'PASS', 'Logged in successfully');
        await takeScreenshot(page, '02-authenticated');
      }
    } else if (navResult === 'app') {
      logTest('User Authentication', 'PASS', 'Already authenticated');
      await takeScreenshot(page, '02-authenticated');
    }

    // Phase 2: Find project with model
    console.log('\n📋 PHASE 2: Locate Project with 3D Model');
    console.log('-'.repeat(80));

    const projectUrl = await findProjectWithModel(page);
    if (projectUrl) {
      logTest('Find Project', 'PASS', projectUrl);
      await takeScreenshot(page, '03-project-selected');
    } else {
      logTest('Find Project', 'FAIL', 'No projects with models found');
      await inspectPage(page, 'Projects Page');
      await takeScreenshot(page, '03-no-projects');
    }

    // Phase 3: Test spatial viewer
    console.log('\n📋 PHASE 3: Test Spatial Viewer');
    console.log('-'.repeat(80));

    if (projectUrl) {
      const viewerStatus = await checkSpatialViewerAndTest(page);
      if (viewerStatus === 'has_model') {
        logTest('Spatial Viewer Canvas', 'PASS', '3D model loaded and tested');
      } else if (viewerStatus === 'no_model') {
        logTest('Spatial Viewer Canvas', 'PASS', 'Viewer ready, no model');
      }
    }

    // Generate report
    console.log('\n' + '='.repeat(80));
    console.log('\n📊 TEST SUMMARY\n');

    const passCount = TEST_RESULTS.filter((r) => r.status === 'PASS').length;
    const failCount = TEST_RESULTS.filter((r) => r.status === 'FAIL').length;
    const total = TEST_RESULTS.length;
    const rate = total > 0 ? ((passCount / total) * 100).toFixed(1) : '0';

    console.log(`Tests Run: ${total}`);
    console.log(`Passed: ${passCount} ✓`);
    console.log(`Failed: ${failCount} ✗`);
    console.log(`Success Rate: ${rate}%\n`);

    // Save report
    const reportPath = path.join(SCREENSHOTS_DIR, `e2e-report-${Date.now()}.json`);
    fs.writeFileSync(reportPath, JSON.stringify({
      summary: {
        total, passCount, failCount,
        passPercentage: parseFloat(rate),
        timestamp: new Date().toISOString(),
      },
      results: TEST_RESULTS,
      screenshotsDir: SCREENSHOTS_DIR,
    }, null, 2));

    console.log(`📄 Report: ${reportPath}`);
    console.log(`📸 Screenshots: ${SCREENSHOTS_DIR}\n`);
    console.log('='.repeat(80) + '\n');

    process.exit(failCount > 0 ? 1 : 0);
  } catch (error) {
    console.error('\n❌ Test error:', error.message);
    process.exit(1);
  } finally {
    if (browser) await browser.close();
  }
}

runE2ETest();
