import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const TEST_RESULTS = [];
const SCREENSHOTS_DIR = './test-integration-reports';

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

function checkFileContent(filepath, searchPatterns) {
  try {
    const content = fs.readFileSync(filepath, 'utf-8');
    const results = {};

    for (const [key, pattern] of Object.entries(searchPatterns)) {
      if (typeof pattern === 'string') {
        results[key] = content.includes(pattern);
      } else if (pattern instanceof RegExp) {
        results[key] = pattern.test(content);
      }
    }

    return results;
  } catch (e) {
    return null;
  }
}

function runTests() {
  console.log('\n' + '='.repeat(70));
  console.log('🧪 SPATIAL VIEWER INTEGRATION TEST SUITE');
  console.log('='.repeat(70));
  console.log(`\n⏰ Time: ${new Date().toISOString()}\n`);

  // Test 1: Verify Component Files Exist
  console.log('\n📋 PHASE 1: Component Files Verification');
  console.log('-'.repeat(70));

  const requiredComponents = [
    { path: 'components/projects/spatial/SpatialViewer.tsx', name: 'SpatialViewer' },
    { path: 'components/projects/spatial/InteractionLayer.tsx', name: 'InteractionLayer' },
    { path: 'components/projects/spatial/MarkerFilterPanel.tsx', name: 'MarkerFilterPanel' },
    { path: 'components/projects/spatial/SpatialMarkerPin.tsx', name: 'SpatialMarkerPin' },
    { path: 'components/projects/spatial/SpatialMarkerContextMenu.tsx', name: 'SpatialMarkerContextMenu' },
    { path: 'components/projects/spatial/MarkerCreationModal.tsx', name: 'MarkerCreationModal' },
    { path: 'components/projects/spatial/TaskLinkerEnhanced.tsx', name: 'TaskLinkerEnhanced' },
    { path: 'components/projects/spatial/ViewerToolbar.tsx', name: 'ViewerToolbar' },
    { path: 'components/projects/spatial/ModelStatsDisplay.tsx', name: 'ModelStatsDisplay' },
    { path: 'components/projects/ProjectOverview.tsx', name: 'ProjectOverview' },
  ];

  const missingComponents = [];

  requiredComponents.forEach(({ path: componentPath, name }) => {
    const fullPath = `${__dirname}/${componentPath}`;
    if (fs.existsSync(fullPath)) {
      logTest(`Component Exists: ${name}`, 'PASS', componentPath);
    } else {
      logTest(`Component Exists: ${name}`, 'FAIL', `Not found at ${componentPath}`);
      missingComponents.push(name);
    }
  });

  // Test 2: Verify SpatialViewer Core Implementation
  console.log('\n📋 PHASE 2: SpatialViewer Core Implementation');
  console.log('-'.repeat(70));

  const spatialViewerPath = `${__dirname}/components/projects/spatial/SpatialViewer.tsx`;
  const spatialViewerContent = checkFileContent(spatialViewerPath, {
    exportsFunctionComponent: /export function SpatialViewer/,
    hasCanvasClickHandler: /handleCanvasClick/,
    hasContextMenuState: /contextMenuOpen/,
    hasMarkerState: /markers.*useState/,
    hasTaskCreationHandler: /handleTaskCreated/,
    hasMarkerCreationHandler: /handleMarkerCreated/,
    integratesInteractionLayer: /InteractionLayer/,
    integratesspatialMarkerPin: /SpatialMarkerPin/,
    integratesMarkerFilterPanel: /MarkerFilterPanel/,
    integratesContextMenu: /SpatialMarkerContextMenu/,
    integratesTaskLinker: /TaskLinker/,
    integratesMarkerModal: /MarkerCreationModal/,
  });

  if (spatialViewerContent) {
    Object.entries(spatialViewerContent).forEach(([feature, exists]) => {
      logTest(`SpatialViewer: ${feature}`, exists ? 'PASS' : 'FAIL');
    });
  } else {
    logTest('SpatialViewer Content Check', 'FAIL', 'Could not read file');
  }

  // Test 3: Verify Interaction Layer Implementation
  console.log('\n📋 PHASE 3: Interaction Layer Implementation');
  console.log('-'.repeat(70));

  const interactionLayerPath = `${__dirname}/components/projects/spatial/InteractionLayer.tsx`;
  const interactionLayerContent = checkFileContent(interactionLayerPath, {
    exportsFunctionComponent: /export function InteractionLayer/,
    hasRightClickHandler: /contextmenu/,
    hasTouchSupport: /touchstart|touchend|touchmove/,
    hasCanvasClickCallback: /onCanvasClick/,
    hasWorldPositionCapture: /worldPos/,
    hasPermissionCheck: /canEditMarkers/,
  });

  if (interactionLayerContent) {
    Object.entries(interactionLayerContent).forEach(([feature, exists]) => {
      logTest(`InteractionLayer: ${feature}`, exists ? 'PASS' : 'FAIL');
    });
  } else {
    logTest('InteractionLayer Content Check', 'FAIL', 'Could not read file');
  }

  // Test 4: Verify Marker Components Integration
  console.log('\n📋 PHASE 4: Marker Components Integration');
  console.log('-'.repeat(70));

  const markerComponents = [
    { file: 'SpatialMarkerPin.tsx', features: { hasDragSupport: /drag/, hasClickHandler: /onClick/ } },
    { file: 'MarkerFilterPanel.tsx', features: { hasFilterUI: /filter|Filter/, hasStatusUpdate: /activeFilters/ } },
    { file: 'SpatialMarkerContextMenu.tsx', features: { hasContextMenu: /contextmenu|context menu/, hasMenuItems: /onClick|onClose/ } },
    { file: 'MarkerCreationModal.tsx', features: { hasModalForm: /form|Form|modal|Modal/, hasSubmitHandler: /onSubmit|submit/ } },
  ];

  markerComponents.forEach(({ file, features }) => {
    const fullPath = `${__dirname}/components/projects/spatial/${file}`;
    const content = checkFileContent(fullPath, features);

    if (content) {
      Object.entries(content).forEach(([feature, exists]) => {
        logTest(`${file}: ${feature}`, exists ? 'PASS' : 'FAIL');
      });
    } else {
      logTest(`${file}`, 'FAIL', 'Could not read file');
    }
  });

  // Test 5: Verify Task Integration Features
  console.log('\n📋 PHASE 5: Task Integration Features');
  console.log('-'.repeat(70));

  const taskLinkerPath = `${__dirname}/components/projects/spatial/TaskLinkerEnhanced.tsx`;
  const taskLinkerContent = checkFileContent(taskLinkerPath, {
    exportsFunctionComponent: /export (function|const) TaskLinker/,
    hasCreateMode: /mode.*create/,
    hasLinkMode: /mode.*link/,
    hasPhaseSelection: /phase/i,
    hasTeamMemberAssignment: /teamMember|assignee/,
    hasPositionCapture: /position.*[xyz]/,
  });

  if (taskLinkerContent) {
    Object.entries(taskLinkerContent).forEach(([feature, exists]) => {
      logTest(`TaskLinker: ${feature}`, exists ? 'PASS' : 'FAIL');
    });
  }

  // Test 6: Verify Server Actions Integration
  console.log('\n📋 PHASE 6: Server Actions Integration');
  console.log('-'.repeat(70));

  const serverActionsPath = `${__dirname}/app/actions/spatial.ts`;
  const serverActionsContent = checkFileContent(serverActionsPath, {
    hasCreateMarkerAction: /createMarker|createSpatialMarker/i,
    hasGetMarkersAction: /getMarkersByProject/i,
    hasUpdateMarkerAction: /updateMarker/i,
    hasCreateTaskMarkerAction: /createTask|linkTask/i,
    hasDeleteMarkerAction: /deleteMarker/i,
  });

  if (serverActionsContent) {
    Object.entries(serverActionsContent).forEach(([feature, exists]) => {
      logTest(`Server Actions: ${feature}`, exists ? 'PASS' : 'FAIL');
    });
  } else {
    logTest('Server Actions File', 'FAIL', 'app/actions/spatial.ts not found or readable');
  }

  // Test 7: Verify Database Types
  console.log('\n📋 PHASE 7: Database Types & Types');
  console.log('-'.repeat(70));

  const databaseTypesPath = `${__dirname}/types/database.types.ts`;
  const databaseTypesContent = checkFileContent(databaseTypesPath, {
    hasSpatialMarkerTable: /spatial_marker|SpatialMarker/i,
    hasMarkerType: /marker_type|markerType/,
    hasPosition: /position_[xyz]|positionX|worldPos/,
    hasStatus: /status|status_field/,
    hasPriority: /priority|priority_level/,
  });

  if (databaseTypesContent) {
    Object.entries(databaseTypesContent).forEach(([feature, exists]) => {
      logTest(`Database Types: ${feature}`, exists ? 'PASS' : 'FAIL');
    });
  } else {
    logTest('Database Types File', 'FAIL', 'types/database.types.ts not found');
  }

  // Test 8: Verify ProjectOverview Integration
  console.log('\n📋 PHASE 8: ProjectOverview Integration');
  console.log('-'.repeat(70));

  const projectOverviewPath = `${__dirname}/components/projects/ProjectOverview.tsx`;
  const projectOverviewContent = checkFileContent(projectOverviewPath, {
    importsSpatialViewer: /import.*SpatialViewer|from.*SpatialViewer/,
    rendersSpatialViewer: /<SpatialViewer/,
    passesProjectId: /projectId=/,
    passesUserRole: /userRole=/,
    passesTeamMembers: /teamMembers=/,
    passesPhases: /phases=/,
    passesTaskList: /projectTasks=/,
    hasMarkerAnnotationPanel: /MarkerAnnotationPanel/,
    hasModelStats: /ModelStatsDisplay/,
    hasIFCUploader: /IFCUploader/,
  });

  if (projectOverviewContent) {
    Object.entries(projectOverviewContent).forEach(([feature, exists]) => {
      logTest(`ProjectOverview: ${feature}`, exists ? 'PASS' : 'FAIL');
    });
  } else {
    logTest('ProjectOverview Content Check', 'FAIL', 'Could not read file');
  }

  // Test 9: Verify Accessibility Features
  console.log('\n📋 PHASE 9: Accessibility & UX Features');
  console.log('-'.repeat(70));

  const accessibilityFeatures = checkFileContent(spatialViewerPath, {
    hasAriaLabels: /aria-label|aria-describedby/,
    hasKeyboardSupport: /onKeyDown|keydown|onKeyUp/,
    hasErrorHandling: /try|catch|error/,
    hasLoadingState: /isModelReady|loading/,
    hasWebGLFallback: /webglSupported|fallback/,
  });

  if (accessibilityFeatures) {
    Object.entries(accessibilityFeatures).forEach(([feature, exists]) => {
      logTest(`Accessibility: ${feature}`, exists ? 'PASS' : 'FAIL');
    });
  }

  // Test 10: Verify Performance Optimizations
  console.log('\n📋 PHASE 10: Performance Optimizations');
  console.log('-'.repeat(70));

  const performanceFeatures = checkFileContent(spatialViewerPath, {
    hasMarkerMemoization: /useMemo|memo|useCallback/,
    hasMobileOptimization: /isMobile|mobile|viewport/,
    hasLODManager: /LODManager|lod|level of detail/i,
    hasRenderThrottling: /fps|throttle|debounce/,
    hasDynamicImport: /dynamic.*import|lazy|Suspense/,
  });

  if (performanceFeatures) {
    Object.entries(performanceFeatures).forEach(([feature, exists]) => {
      logTest(`Performance: ${feature}`, exists ? 'PASS' : 'FAIL');
    });
  }

  // Generate Final Report
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

  // Test Categories Summary
  const categories = {
    'Component Files': TEST_RESULTS.filter((r) => r.test.includes('Component Exists')),
    'SpatialViewer': TEST_RESULTS.filter((r) => r.test.includes('SpatialViewer')),
    'InteractionLayer': TEST_RESULTS.filter((r) => r.test.includes('InteractionLayer')),
    'Marker Components': TEST_RESULTS.filter((r) => r.test.includes('Component Files') === false && r.test.includes('.tsx:')),
    'Task Integration': TEST_RESULTS.filter((r) => r.test.includes('TaskLinker')),
    'Server Actions': TEST_RESULTS.filter((r) => r.test.includes('Server Actions')),
    'Database Types': TEST_RESULTS.filter((r) => r.test.includes('Database Types')),
    'ProjectOverview': TEST_RESULTS.filter((r) => r.test.includes('ProjectOverview')),
    'Accessibility': TEST_RESULTS.filter((r) => r.test.includes('Accessibility')),
    'Performance': TEST_RESULTS.filter((r) => r.test.includes('Performance')),
  };

  console.log('Category Results:\n');
  Object.entries(categories).forEach(([category, tests]) => {
    if (tests.length > 0) {
      const passed = tests.filter((t) => t.status === 'PASS').length;
      const rate = ((passed / tests.length) * 100).toFixed(0);
      console.log(`  ${category}: ${passed}/${tests.length} (${rate}%)`);
    }
  });

  if (failCount > 0 && failCount <= 10) {
    console.log('\n⚠️  Failed Tests (need attention):\n');
    TEST_RESULTS.filter((r) => r.status === 'FAIL').forEach((r) => {
      console.log(`  ✗ ${r.test}`);
      if (r.message) console.log(`    → ${r.message}`);
    });
  }

  // Save detailed report
  const reportPath = path.join(SCREENSHOTS_DIR, `integration-test-report-${Date.now()}.json`);
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
          categories: Object.entries(categories).reduce((acc, [cat, tests]) => {
            if (tests.length > 0) {
              acc[cat] = {
                total: tests.length,
                passed: tests.filter((t) => t.status === 'PASS').length,
              };
            }
            return acc;
          }, {}),
        },
        results: TEST_RESULTS,
        testSuite: {
          name: 'Spatial Viewer Integration Test Suite',
          description: 'Comprehensive integration test for the 3D spatial viewer component',
          components: requiredComponents.map((c) => c.name),
        },
      },
      null,
      2
    )
  );

  console.log(`\n📄 Full report saved to: ${reportPath}\n`);
  console.log('='.repeat(70) + '\n');

  // Recommendations
  if (failCount > 0) {
    console.log('📝 Recommendations:\n');
    if (missingComponents.length > 0) {
      console.log(`  • Create missing component files: ${missingComponents.join(', ')}`);
    }
    console.log('  • Verify all imports are correct and paths match');
    console.log('  • Run `npm run build` to check for TypeScript errors');
    console.log('  • Test with actual authentication to verify runtime behavior\n');
  } else {
    console.log('✅ All integration tests passed! The spatial viewer is properly structured.\n');
    console.log('📌 Next Steps:\n');
    console.log('  1. Run the E2E tests with authentication: npm run test:e2e');
    console.log('  2. Deploy and test with real 3D models');
    console.log('  3. Verify marker creation and task linking in production\n');
  }

  process.exit(failCount > 0 ? 1 : 0);
}

runTests();
