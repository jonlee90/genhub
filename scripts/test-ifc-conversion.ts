/**
 * P2.4 - Test Script: IFC to XKT Conversion Service
 *
 * This script tests the IFC conversion service with a sample IFC file.
 *
 * Usage:
 *   npm tsx scripts/test-ifc-conversion.ts [path-to-ifc-file]
 *
 * If no IFC file is provided, creates a minimal test IFC file.
 */

import fs from 'fs/promises';
import path from 'path';
import os from 'os';
import { convertIFCtoXKT, cleanupTempFiles } from '../lib/services/ifc-conversion-service';

const log = (message: string, data?: any) => {
  console.log(`[Test-IFC-Conversion] ${message}`, data ? JSON.stringify(data, null, 2) : '');
};

/**
 * Create minimal valid IFC file for testing
 */
async function createTestIFCFile(): Promise<string> {
  log('Creating minimal test IFC file');

  const tempDir = os.tmpdir();
  const testFilePath = path.join(tempDir, `test-sample-${Date.now()}.ifc`);

  // Debug: Minimal valid IFC STEP file
  const minimalIFC = `ISO-10303-21;
HEADER;
FILE_DESCRIPTION(('ViewDefinition [CoordinationView]'),'2;1');
FILE_NAME('test-model.ifc','2026-01-02T00:00:00',('Author'),('Organization'),'PreProc - Version 0.1.0','PreProc - Version 0.1.0','');
FILE_SCHEMA(('IFC4'));
ENDSEC;
DATA;
#1=IFCPROJECT('3aBxPGQ8D0nRGP$8EDwGlb',#2,'Test Project',$,$,$,$,(#15),#9);
#2=IFCOWNERHISTORY(#3,#6,$,.ADDED.,$,$,$,1640995200);
#3=IFCPERSONANDORGANIZATION(#4,#5,$);
#4=IFCPERSON($,'Author',$,$,$,$,$,$);
#5=IFCORGANIZATION($,'Organization',$,$,$);
#6=IFCAPPLICATION(#5,'0.1.0','PreProc','PreProc');
#9=IFCUNITASSIGNMENT((#10,#11,#12,#13));
#10=IFCSIUNIT(*,.LENGTHUNIT.,.MILLI.,.METRE.);
#11=IFCSIUNIT(*,.AREAUNIT.,$,.SQUARE_METRE.);
#12=IFCSIUNIT(*,.VOLUMEUNIT.,$,.CUBIC_METRE.);
#13=IFCSIUNIT(*,.PLANEANGLEUNIT.,$,.RADIAN.);
#15=IFCGEOMETRICREPRESENTATIONCONTEXT($,'Model',3,1.00000000000E-5,#16,$);
#16=IFCAXIS2PLACEMENT3D(#17,$,$);
#17=IFCCARTESIANPOINT((0.,0.,0.));
#20=IFCSITE('0LV1trueX3ww$Mcsp5JUTI',#2,'Test Site',$,$,#21,$,$,.ELEMENT.,(0,0,0,0),$,$);
#21=IFCLOCALPLACEMENT($,#22);
#22=IFCAXIS2PLACEMENT3D(#23,$,$);
#23=IFCCARTESIANPOINT((0.,0.,0.));
#30=IFCBUILDING('2xZK8LGqn3hxqKhZcpqJwT',#2,'Test Building',$,$,#31,$,$,.ELEMENT.,$,$,$);
#31=IFCLOCALPLACEMENT(#21,#32);
#32=IFCAXIS2PLACEMENT3D(#33,$,$);
#33=IFCCARTESIANPOINT((0.,0.,0.));
#40=IFCBUILDINGSTOREY('3OePGFyJn4TgTkRKbJdE2v',#2,'Ground Floor',$,$,#41,$,$,.ELEMENT.,0.);
#41=IFCLOCALPLACEMENT(#31,#42);
#42=IFCAXIS2PLACEMENT3D(#43,$,$);
#43=IFCCARTESIANPOINT((0.,0.,0.));
#50=IFCBUILDINGSTOREY('3OePGFyJn4TgTkRKbJdE2w',#2,'First Floor',$,$,#51,$,$,.ELEMENT.,4000.);
#51=IFCLOCALPLACEMENT(#31,#52);
#52=IFCAXIS2PLACEMENT3D(#53,$,$);
#53=IFCCARTESIANPOINT((0.,0.,4000.));
#60=IFCRELAGGREGATES('2Z_2yOgq51gRP0kwZbLWgF',#2,$,$,#1,(#20));
#61=IFCRELAGGREGATES('2Z_2yOgq51gRP0kwZbLWgG',#2,$,$,#20,(#30));
#62=IFCRELAGGREGATES('2Z_2yOgq51gRP0kwZbLWgH',#2,$,$,#30,(#40,#50));
ENDSEC;
END-ISO-10303-21;
`;

  await fs.writeFile(testFilePath, minimalIFC, 'utf8');
  log('Test IFC file created', testFilePath);

  return testFilePath;
}

/**
 * Main test function
 */
async function testConversion() {
  log('=== IFC to XKT Conversion Test ===\n');

  let ifcPath: string;
  let xktPath: string;
  let cleanupFiles: string[] = [];

  try {
    // Step 1: Determine IFC file to use
    const args = process.argv.slice(2);
    if (args.length > 0 && args[0]) {
      ifcPath = path.resolve(args[0]);
      log('Using provided IFC file', ifcPath);

      // Debug: Verify file exists
      try {
        await fs.access(ifcPath);
      } catch {
        log('ERROR: Provided IFC file does not exist', ifcPath);
        process.exit(1);
      }
    } else {
      log('No IFC file provided, creating test IFC file');
      ifcPath = await createTestIFCFile();
      cleanupFiles.push(ifcPath);
    }

    // Step 2: Prepare output path
    const tempDir = os.tmpdir();
    xktPath = path.join(tempDir, `output-${Date.now()}.xkt`);
    cleanupFiles.push(xktPath);

    log('Output XKT path', xktPath);

    // Step 3: Run conversion
    log('\n--- Starting Conversion ---');
    const startTime = Date.now();

    const result = await convertIFCtoXKT(ifcPath, xktPath, {
      generateLODs: false,
      extractThumbnail: false,
      maxProcessingTimeMs: 5 * 60 * 1000,
    });

    const duration = Date.now() - startTime;

    log('\n--- Conversion Complete ---');
    log(`Duration: ${duration}ms`);

    // Step 4: Check result
    if (result.success) {
      log('✅ Conversion SUCCEEDED');
      log('\nMetadata:', result.metadata);

      // Debug: Verify XKT file was created
      const xktStats = await fs.stat(xktPath);
      log('\nXKT File Info:', {
        path: xktPath,
        size: xktStats.size,
        created: xktStats.birthtime,
      });

      // Debug: Read first 256 bytes of XKT
      const xktHandle = await fs.open(xktPath, 'r');
      const xktBuffer = Buffer.alloc(256);
      await xktHandle.read(xktBuffer, 0, 256, 0);
      await xktHandle.close();

      log('\nXKT File Preview (first 256 bytes):', xktBuffer.toString('utf8').substring(0, 200));

      log('\n✅ TEST PASSED');
    } else {
      log('❌ Conversion FAILED');
      log('Error:', result.error);
      log('\n❌ TEST FAILED');
      process.exit(1);
    }
  } catch (error) {
    log('❌ TEST ERROR', error);
    process.exit(1);
  } finally {
    // Step 5: Cleanup
    if (cleanupFiles.length > 0) {
      log('\n--- Cleanup ---');
      await cleanupTempFiles(cleanupFiles);
      log('Cleanup complete');
    }
  }
}

// Run test
testConversion().catch((error) => {
  console.error('Unhandled error:', error);
  process.exit(1);
});
