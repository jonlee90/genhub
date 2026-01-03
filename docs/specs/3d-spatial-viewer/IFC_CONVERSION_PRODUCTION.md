# IFC to XKT Conversion - Production Implementation Guide

## Current Status: Development Mock

The current implementation (`lib/ifc-converter.ts`) is a **mock** that:
- Returns the original IFC URL instead of converted XKT
- Simulates 2-second processing delay
- Returns placeholder metadata (element count, bounds)
- Does NOT perform actual conversion

**This allows UI/UX testing but will NOT work with xeokit viewer in production.**

---

## Why XKT Conversion is Required

xeokit viewer requires **XKT format** for optimal performance:
- **IFC files** are raw building models (text-based, large, not optimized)
- **XKT files** are xeokit's optimized binary format (compressed, GPU-ready)
- xeokit **cannot load IFC files directly** - conversion is mandatory

**Current Error:** When uploading IFC, xeokit shows: `Unsupported .XKT file version: 760173385`

---

## Production Options

### Option 1: Docker Container Conversion Service (Recommended)

**Pros:**
- Full control over environment
- Works on any cloud platform (AWS, GCP, Azure)
- Can scale horizontally
- Isolates native dependencies

**Implementation:**
```dockerfile
# Dockerfile
FROM node:18-bullseye

# Install IfcOpenShell (required for IFC parsing)
RUN apt-get update && apt-get install -y \
    python3-pip \
    libboost-all-dev \
    && pip3 install ifcopenshell

# Install xeokit-convert CLI
RUN npm install -g @xeokit/xeokit-convert

WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .

CMD ["node", "conversion-worker.js"]
```

**Conversion Worker (`conversion-worker.js`):**
```javascript
const { exec } = require('child_process');
const { createClient } = require('@supabase/supabase-js');

// Poll database for pending conversions
setInterval(async () => {
  const { data: models } = await supabase
    .from('projects_3d_models')
    .select('*')
    .eq('processing_status', 'pending')
    .limit(1);

  if (models && models.length > 0) {
    await convertModel(models[0]);
  }
}, 5000); // Check every 5 seconds

async function convertModel(model) {
  // 1. Download IFC from Supabase Storage
  const { data: fileBlob } = await supabase.storage
    .from('ifc-models')
    .download(model.original_file_url);

  // 2. Save locally
  const ifcPath = `/tmp/${model.id}.ifc`;
  const xktPath = `/tmp/${model.id}.xkt`;
  fs.writeFileSync(ifcPath, fileBlob);

  // 3. Convert using xeokit-convert CLI
  exec(`xeokit-convert ${ifcPath} ${xktPath}`, async (error) => {
    if (error) {
      await updateModelStatus(model.id, 'failed', error.message);
      return;
    }

    // 4. Upload XKT to Supabase Storage
    const xktBlob = fs.readFileSync(xktPath);
    const { data } = await supabase.storage
      .from('ifc-models')
      .upload(`${model.project_id}/${model.id}.xkt`, xktBlob);

    const { data: urlData } = supabase.storage
      .from('ifc-models')
      .getPublicUrl(`${model.project_id}/${model.id}.xkt`);

    // 5. Update database
    await updateModelStatus(model.id, 'ready', null, urlData.publicUrl);
  });
}
```

**Deployment:**
```bash
# Build and deploy to AWS ECS, Google Cloud Run, or Azure Container Instances
docker build -t ifc-converter .
docker run -e SUPABASE_URL=xxx -e SUPABASE_KEY=xxx ifc-converter
```

---

### Option 2: AWS Lambda with Custom Runtime

**Pros:**
- Serverless (pay per conversion)
- Automatic scaling
- No server management

**Cons:**
- 10GB deployment package limit
- 15-minute timeout (may not be enough for large models)
- Complex setup with Lambda layers

**Implementation:**
1. Create Lambda layer with IfcOpenShell + xeokit-convert
2. Trigger Lambda on Supabase Storage upload event
3. Lambda downloads IFC, converts, uploads XKT, updates DB

**Lambda Function:**
```javascript
exports.handler = async (event) => {
  // Triggered by Supabase webhook or SQS queue
  const modelId = event.modelId;

  // Download IFC, convert, upload XKT (same logic as Option 1)
  // ...
};
```

---

### Option 3: Cloud Conversion API (BIMServer, Third-Party)

**Pros:**
- No infrastructure management
- Maintained by third party

**Cons:**
- Monthly cost
- Data privacy concerns (uploading IFC to external service)
- Vendor lock-in

**Example (BIMServer):**
```javascript
const response = await fetch('https://api.bimserver.org/convert', {
  method: 'POST',
  headers: { 'Authorization': 'Bearer XXX' },
  body: ifcFileBlob,
});

const xktBlob = await response.blob();
```

---

## Installation Steps (Option 1: Docker)

### 1. Install System Dependencies

**On Ubuntu/Debian:**
```bash
sudo apt-get update
sudo apt-get install -y \
  python3-pip \
  libboost-all-dev \
  build-essential

pip3 install ifcopenshell
```

**On macOS (for local testing):**
```bash
brew install boost python3
pip3 install ifcopenshell
```

**On Windows:**
- Use WSL2 or Docker Desktop

### 2. Install xeokit-convert

```bash
npm install -g @xeokit/xeokit-convert

# Verify installation
xeokit-convert --version
```

### 3. Update `lib/ifc-converter.ts`

Replace mock implementation with actual conversion:

```typescript
import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import path from 'path';
import { createClient } from '@/utils/supabase/server';

const execAsync = promisify(exec);

export async function convertIFCToXKT(
  ifcUrl: string,
  modelId: string
): Promise<ConversionResult> {
  const supabase = await createClient();
  const tempDir = '/tmp';
  const ifcPath = path.join(tempDir, `${modelId}.ifc`);
  const xktPath = path.join(tempDir, `${modelId}.xkt`);

  try {
    // 1. Download IFC file
    const response = await fetch(ifcUrl);
    const ifcBlob = await response.arrayBuffer();
    await fs.writeFile(ifcPath, Buffer.from(ifcBlob));

    // 2. Convert using xeokit-convert CLI
    const { stdout, stderr } = await execAsync(
      `xeokit-convert ${ifcPath} ${xktPath}`
    );

    console.log('[IFCConverter] Conversion output:', stdout);
    if (stderr) console.error('[IFCConverter] Conversion warnings:', stderr);

    // 3. Read XKT file
    const xktBuffer = await fs.readFile(xktPath);

    // 4. Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('ifc-models')
      .upload(`converted/${modelId}.xkt`, xktBuffer, {
        contentType: 'application/octet-stream',
      });

    if (uploadError) throw uploadError;

    // 5. Get public URL
    const { data: urlData } = supabase.storage
      .from('ifc-models')
      .getPublicUrl(`converted/${modelId}.xkt`);

    // 6. Extract metadata (element count, bounds) from conversion output
    const elementCount = extractElementCount(stdout);
    const bounds = extractBounds(stdout);

    // 7. Cleanup temp files
    await fs.unlink(ifcPath);
    await fs.unlink(xktPath);

    return {
      success: true,
      xktUrl: urlData.publicUrl,
      elementCount,
      bounds,
    };
  } catch (error) {
    console.error('[IFCConverter] Conversion failed:', error);

    // Cleanup
    try {
      await fs.unlink(ifcPath);
      await fs.unlink(xktPath);
    } catch {}

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
```

---

## Testing Conversion Locally

### 1. Prepare Test Environment

```bash
# Install dependencies
npm install -g @xeokit/xeokit-convert
pip3 install ifcopenshell

# Create test directory
mkdir -p /tmp/ifc-test
cd /tmp/ifc-test
```

### 2. Test Conversion Manually

```bash
# Download sample IFC
cp /Users/jonathanlee/Downloads/sample-house.ifc ./

# Convert to XKT
xeokit-convert sample-house.ifc sample-house.xkt

# Check output
ls -lh sample-house.xkt
```

**Expected Output:**
```
Parsing IFC file...
Found 150 objects
Converting geometry...
Writing XKT file...
Conversion complete: sample-house.xkt (42 KB)
```

### 3. Test in GenHub

```bash
# Start dev server
npm run dev

# Upload sample-house.ifc via UI
# Monitor logs for conversion progress
```

**Check Database:**
```sql
SELECT id, processing_status, xkt_file_url, element_count
FROM projects_3d_models
WHERE processing_status = 'ready';
```

---

## Production Deployment Checklist

- [ ] Choose deployment option (Docker, Lambda, or API)
- [ ] Set up conversion infrastructure
- [ ] Install IfcOpenShell and xeokit-convert
- [ ] Update `lib/ifc-converter.ts` with real implementation
- [ ] Configure Supabase Storage bucket permissions
- [ ] Set up conversion queue (SQS, Redis, or DB polling)
- [ ] Add monitoring and error alerts
- [ ] Test with various IFC files (small, medium, large)
- [ ] Optimize conversion performance (parallel processing)
- [ ] Add retry logic for failed conversions
- [ ] Document conversion limits (file size, timeout)

---

## Monitoring & Observability

### Key Metrics to Track

1. **Conversion Success Rate:** % of conversions that succeed
2. **Conversion Duration:** Time from upload to ready
3. **File Size Impact:** IFC size vs XKT size (should be ~10x smaller)
4. **Queue Depth:** Number of pending conversions
5. **Error Rate:** Failed conversions by error type

### Logging

```typescript
console.log('[IFCConverter] Starting conversion', {
  modelId,
  ifcSize: file.size,
  timestamp: Date.now(),
});

console.log('[IFCConverter] Conversion complete', {
  modelId,
  xktSize: xktBuffer.length,
  duration: Date.now() - startTime,
  elementCount,
});
```

---

## Cost Estimates

### Option 1: Docker on AWS ECS

- **Compute:** $0.05/hour (t3.micro) × 24 hours × 30 days = **$36/month**
- **Storage:** 100GB × $0.10/GB = **$10/month**
- **Total:** ~**$50/month** (handles ~500 conversions/month)

### Option 2: AWS Lambda

- **Compute:** $0.0000166667/GB-second
- **Example:** 1GB RAM, 30-second conversion, 100 conversions/month = **$5/month**
- **Total:** ~**$5-20/month** (cheaper for low volume)

### Option 3: BIMServer API

- **Pricing:** ~$0.10-0.50 per conversion
- **Example:** 100 conversions/month = **$10-50/month**

---

## Security Considerations

1. **File Validation:** Verify IFC file integrity before conversion
2. **Sandboxing:** Run conversion in isolated environment (Docker)
3. **Timeout:** Enforce conversion timeout (5-10 minutes max)
4. **Resource Limits:** Limit CPU/memory to prevent abuse
5. **Access Control:** Ensure only authorized users can trigger conversions
6. **Audit Logging:** Log all conversion attempts with user ID

---

## Next Steps

1. **Choose deployment option** based on volume and budget
2. **Set up local testing environment** (Docker recommended)
3. **Implement real conversion** in `lib/ifc-converter.ts`
4. **Deploy to staging** and test with sample files
5. **Monitor performance** and optimize as needed
6. **Deploy to production** after thorough testing

---

**Current Implementation Status:**
- ✅ Upload workflow: Complete
- ✅ Database schema: Complete
- ✅ Conversion queue: Complete (mock)
- ❌ Actual conversion: **TODO (Production)**
- ✅ UI/UX: Complete
- ✅ Error handling: Complete

**Estimated Implementation Time (Option 1):** 4-8 hours
