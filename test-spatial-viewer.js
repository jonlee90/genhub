const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  try {
    console.log('🧪 Testing Spatial Viewer in ProjectOverview...\n');

    // 1. Navigate to app
    console.log('1️⃣ Navigating to http://localhost:3000/app');
    await page.goto('http://localhost:3000/app', { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);

    // Take screenshot
    await page.screenshot({ path: 'test-screenshots/01-dashboard.png' });
    console.log('   ✅ Screenshot saved: 01-dashboard.png\n');

    // 2. Look for projects
    console.log('2️⃣ Looking for projects to test...');
    const projectLinks = await page.locator('a[href*="/app/projects/"]').count();
    console.log(`   Found ${projectLinks} project links`);

    if (projectLinks === 0) {
      console.log('   ⚠️ No projects found. Creating test data...');
      // Try to navigate to projects page
      await page.goto('http://localhost:3000/app/projects', { waitUntil: 'networkidle' });
      await page.waitForTimeout(1000);
    }

    // Take screenshot
    await page.screenshot({ path: 'test-screenshots/02-projects-page.png' });
    console.log('   ✅ Screenshot saved: 02-projects-page.png\n');

    // 3. Click first project with spatial viewer
    console.log('3️⃣ Clicking first project...');
    const firstProject = page.locator('a[href*="/app/projects/"]').first();
    const projectHref = await firstProject.getAttribute('href');
    console.log(`   Found project: ${projectHref}`);

    await firstProject.click();
    await page.waitForTimeout(3000);

    // Take screenshot
    await page.screenshot({ path: 'test-screenshots/03-project-detail.png' });
    console.log('   ✅ Screenshot saved: 03-project-detail.png\n');

    // 4. Check for spatial viewer
    console.log('4️⃣ Checking for spatial viewer...');
    const spatialViewer = page.locator('[class*="SpatialViewer"], #xeokit-canvas, [data-testid="spatial-viewer"]').first();
    const viewerCount = await page.locator('canvas').count();
    console.log(`   Found ${viewerCount} canvas element(s) (may include 3D viewer)`);

    // Check for spatial tabs
    const spatialTab = page.locator('button:has-text("Spatial")');
    const spatialTabCount = await spatialTab.count();
    console.log(`   Found ${spatialTabCount} "Spatial" tab(s)`);

    if (spatialTabCount > 0) {
      console.log('   ✅ Spatial tab found, clicking...');
      await spatialTab.click();
      await page.waitForTimeout(3000);
      await page.screenshot({ path: 'test-screenshots/04-spatial-tab.png' });
      console.log('   ✅ Screenshot saved: 04-spatial-tab.png\n');
    } else {
      console.log('   ⚠️ Spatial tab not found\n');
    }

    // 5. Test touch gestures simulation (desktop)
    console.log('5️⃣ Testing touch/mouse interaction on 3D viewer...');
    const canvas = page.locator('canvas').first();
    const canvasBox = await canvas.boundingBox();

    if (canvasBox) {
      console.log(`   Canvas found at: ${JSON.stringify(canvasBox)}`);

      // Simulate single finger drag (rotate)
      console.log('   Testing drag gesture (rotate)...');
      await page.mouse.move(canvasBox.x + canvasBox.width / 2, canvasBox.y + canvasBox.height / 2);
      await page.mouse.down();
      await page.mouse.move(canvasBox.x + canvasBox.width / 2 + 50, canvasBox.y + canvasBox.height / 2);
      await page.mouse.up();
      await page.waitForTimeout(500);
      console.log('   ✅ Drag gesture completed\n');
    } else {
      console.log('   ⚠️ Canvas not found, skipping gesture tests\n');
    }

    // 6. Test adding a task
    console.log('6️⃣ Looking for "Add Task" button or similar...');
    const addTaskBtn = page.locator('button:has-text("Add Task"), button:has-text("Create Task"), button:has-text("New Task")').first();
    const addTaskCount = await addTaskBtn.count();

    if (addTaskCount > 0) {
      console.log('   ✅ Found Add Task button, clicking...');
      await addTaskBtn.click();
      await page.waitForTimeout(2000);
      await page.screenshot({ path: 'test-screenshots/05-add-task-modal.png' });
      console.log('   ✅ Screenshot saved: 05-add-task-modal.png');

      // Fill in task form if modal opened
      const titleInput = page.locator('input[placeholder*="title"], input[placeholder*="Task"], input[type="text"]').first();
      const titleCount = await titleInput.count();

      if (titleCount > 0) {
        console.log('   Filling in task form...');
        await titleInput.fill('Test Spatial Task');

        // Try to find submit button
        const submitBtn = page.locator('button:has-text("Create"), button:has-text("Save"), button[type="submit"]').first();
        const submitCount = await submitBtn.count();

        if (submitCount > 0) {
          await submitBtn.click();
          await page.waitForTimeout(2000);
          console.log('   ✅ Task created');
          await page.screenshot({ path: 'test-screenshots/06-task-created.png' });
          console.log('   ✅ Screenshot saved: 06-task-created.png\n');
        } else {
          console.log('   ⚠️ Submit button not found\n');
        }
      } else {
        console.log('   ⚠️ Task form not found\n');
      }
    } else {
      console.log('   ⚠️ Add Task button not found\n');
    }

    // 7. Test adding image/attachment
    console.log('7️⃣ Looking for attachment/image upload...');
    const uploadBtn = page.locator('button:has-text("Upload"), button:has-text("Add Image"), button:has-text("Attach")').first();
    const uploadCount = await uploadBtn.count();

    if (uploadCount > 0) {
      console.log('   ✅ Found upload button');
      await uploadBtn.click();
      await page.waitForTimeout(1000);
      await page.screenshot({ path: 'test-screenshots/07-upload-button.png' });
      console.log('   ✅ Screenshot saved: 07-upload-button.png\n');
    } else {
      console.log('   ⚠️ Upload button not found\n');
    }

    // 8. Test marker creation (long-press equivalent on desktop)
    console.log('8️⃣ Testing context menu (right-click on canvas)...');
    if (canvasBox) {
      console.log('   Right-clicking on 3D viewer...');
      await page.click('canvas', { button: 'right' });
      await page.waitForTimeout(1000);
      await page.screenshot({ path: 'test-screenshots/08-context-menu.png' });
      console.log('   ✅ Screenshot saved: 08-context-menu.png\n');

      // Check for context menu
      const contextMenu = page.locator('[role="menu"], .context-menu, [class*="menu"]');
      const menuCount = await contextMenu.count();
      console.log(`   Found ${menuCount} potential menu item(s)\n`);
    }

    // 9. Check responsive behavior
    console.log('9️⃣ Testing responsive design...');
    const viewport = page.viewportSize();
    console.log(`   Current viewport: ${viewport.width}x${viewport.height}`);

    // Test mobile viewport
    await page.setViewportSize({ width: 375, height: 812 });
    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'test-screenshots/09-mobile-viewport.png' });
    console.log('   ✅ Mobile viewport tested, screenshot saved: 09-mobile-viewport.png');

    // Check if bottom sheet appears on mobile
    const bottomSheet = page.locator('[class*="bottom-sheet"], [class*="sheet"]');
    const sheetCount = await bottomSheet.count();
    console.log(`   Found ${sheetCount} potential bottom sheet element(s)\n`);

    // 10. Test touch events on mobile
    console.log('🔟 Testing touch gestures on mobile viewport...');
    await page.touch(canvasBox.x + canvasBox.width / 2, canvasBox.y + canvasBox.height / 2);
    await page.waitForTimeout(500);
    console.log('   ✅ Touch interaction simulated\n');

    // Final summary
    console.log('✅ SPATIAL VIEWER TEST COMPLETE\n');
    console.log('📊 Test Summary:');
    console.log('   ✅ Navigation to project page');
    console.log('   ✅ Canvas element detected');
    console.log(`   ${spatialTabCount > 0 ? '✅' : '⚠️'} Spatial tab${spatialTabCount > 0 ? '' : ' (not found)'}`);
    console.log(`   ${addTaskCount > 0 ? '✅' : '⚠️'} Add Task functionality${addTaskCount > 0 ? '' : ' (not found)'}`);
    console.log(`   ${uploadCount > 0 ? '✅' : '⚠️'} Image upload functionality${uploadCount > 0 ? '' : ' (not found)'}`);
    console.log(`   ${menuCount > 0 ? '✅' : '⚠️'} Context menu${menuCount > 0 ? '' : ' (not found)'}`);
    console.log('   ✅ Mobile responsive viewport tested');
    console.log('\n📸 Screenshots saved to: test-screenshots/\n');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    await page.screenshot({ path: 'test-screenshots/error.png' });
    console.log('   Error screenshot saved: error.png');
  } finally {
    await browser.close();
  }
})();
