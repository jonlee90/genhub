/**
 * Scale Detector (VEC-003)
 *
 * Detects the drawing scale from a VectorPage via a 6-priority cascade:
 *   1. PDF metadata (UserUnit or custom Scale key)
 *   2. Title block text (architectural / engineering / metric patterns)
 *   3. Scale bar detection (tick marks + nearby numeric text)
 *   4. Dimension calibration (extension-line pairs + dimension labels)
 *   5. Sheet size inference (standard ARCH/Letter page sizes)
 *   6. Fallback → null
 *
 * All coordinates in inches. Scale factor = real-world inches / drawing inches.
 */

import type {
  VectorPage,
  ScaleInfo,
  VectorLine,
  TextCluster,
  Point,
} from "./types";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function euclideanDist(a: Point, b: Point): number {
  return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
}

function lineLength(line: VectorLine): number {
  return euclideanDist(line.start, line.end);
}

/** Angle in radians [0, π) for a VectorLine. */
function lineAngle(line: VectorLine): number {
  const dx = line.end.x - line.start.x;
  const dy = line.end.y - line.start.y;
  let angle = Math.atan2(dy, dx);
  if (angle < 0) angle += Math.PI;
  if (angle >= Math.PI) angle -= Math.PI;
  return angle;
}

/** Perpendicular distance from point p to infinite line through (a, b). */
function perpDistanceToLine(p: Point, a: Point, b: Point): number {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const len = Math.sqrt(dx * dx + dy * dy);
  if (len < 1e-9) return euclideanDist(p, a);
  return Math.abs(dy * p.x - dx * p.y + b.x * a.y - b.y * a.x) / len;
}

/** Compute median of a numeric array. */
function median(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? (sorted[mid - 1] + sorted[mid]) / 2
    : sorted[mid];
}

/** Standard deviation of a numeric array. */
function stdDev(values: number[], mean: number): number {
  if (values.length === 0) return 0;
  const variance =
    values.reduce((s, v) => s + (v - mean) ** 2, 0) / values.length;
  return Math.sqrt(variance);
}

// ---------------------------------------------------------------------------
// Architectural / engineering / metric scale maps
// ---------------------------------------------------------------------------

/** Architectural scales: drawing string → factor (real-world in / drawing in) */
const ARCH_SCALE_MAP: Record<string, number> = {
  '1/8"=1\'-0"': 96,
  '3/16"=1\'-0"': 64,
  '1/4"=1\'-0"': 48,
  '3/8"=1\'-0"': 32,
  '1/2"=1\'-0"': 24,
  '1"=1\'-0"': 12,
};

/** Engineering scales: drawing string → factor */
const ENG_SCALE_MAP: Record<string, number> = {
  "1\"=10'": 120,
  "1\"=20'": 240,
  "1\"=30'": 360,
  "1\"=40'": 480,
  "1\"=50'": 600,
  "1\"=100'": 1200,
};

/** Metric scales: drawing string → factor */
const METRIC_SCALE_MAP: Record<string, number> = {
  "1:50": 50,
  "1:100": 100,
  "1:200": 200,
  "1:500": 500,
};

// ---------------------------------------------------------------------------
// VEC-003 exported helper: parseScaleText
// ---------------------------------------------------------------------------

/**
 * Attempt to parse a scale string into a scale factor number.
 * Returns null if the string cannot be parsed.
 *
 * Supported formats:
 * - Architectural: 1/4"=1'-0", 1/8"=1'-0", etc.
 * - Engineering: 1"=20', 1"=100', etc.
 * - Metric: 1:100, 1:200, etc.
 * - Dynamic: Scale: 0.25"=5'  (generic ratio form)
 */
export function parseScaleText(text: string): number | null {
  const normalized = text.trim();

  // Check architectural map
  for (const [key, factor] of Object.entries(ARCH_SCALE_MAP)) {
    if (normalized.includes(key)) return factor;
  }

  // Check engineering map
  for (const [key, factor] of Object.entries(ENG_SCALE_MAP)) {
    if (normalized.includes(key)) return factor;
  }

  // Check metric map
  for (const [key, factor] of Object.entries(METRIC_SCALE_MAP)) {
    if (normalized.includes(key)) return factor;
  }

  // Dynamic architectural regex: N/D"=M'-N"
  // Example: 3/32"=1'-0" → drawing 1" = 1*12 / (3/32) real inches = 128
  const archDynamic = normalized.match(
    /(\d+)\/(\d+)"\s*=\s*(\d+)['`]\s*-?\s*(\d*)"?/i,
  );
  if (archDynamic) {
    const num = parseFloat(archDynamic[1]);
    const den = parseFloat(archDynamic[2]);
    const feet = parseFloat(archDynamic[3]);
    const inches = archDynamic[4] ? parseFloat(archDynamic[4]) : 0;
    if (den > 0) {
      const drawingInches = num / den;
      const realInches = feet * 12 + inches;
      if (drawingInches > 0) return realInches / drawingInches;
    }
  }

  // Dynamic engineering regex: 1"=Nft or 1"=N'
  const engDynamic = normalized.match(/1"\s*=\s*([\d.]+)\s*[''`ft]/i);
  if (engDynamic) {
    const feet = parseFloat(engDynamic[1]);
    if (!isNaN(feet) && feet > 0) return feet * 12;
  }

  // Dynamic metric: N:M
  const metricDynamic = normalized.match(/\b(\d+)\s*:\s*(\d+)\b/);
  if (metricDynamic) {
    const n = parseFloat(metricDynamic[1]);
    const m = parseFloat(metricDynamic[2]);
    if (n > 0) return m / n;
  }

  // Generic "Scale: X"=Y'" dynamic form
  const genericScale = normalized.match(
    /Scale:\s*([\d.]+)["']\s*=\s*([\d'-]+)/i,
  );
  if (genericScale) {
    const drawingVal = parseFloat(genericScale[1]);
    const realStr = genericScale[2];
    // Parse real value: could be "20'" or "20'-0"" etc.
    const feetMatch = realStr.match(/(\d+)['`]/);
    const inchMatch = realStr.match(/(\d+)"/);
    const feet = feetMatch ? parseFloat(feetMatch[1]) : 0;
    const inches = inchMatch ? parseFloat(inchMatch[1]) : 0;
    const totalRealInches = feet * 12 + inches;
    if (drawingVal > 0 && totalRealInches > 0) {
      return totalRealInches / drawingVal;
    }
  }

  return null;
}

// ---------------------------------------------------------------------------
// Priority 1: PDF metadata
// ---------------------------------------------------------------------------

function tryMetadata(pdfMetadata?: Record<string, string>): ScaleInfo | null {
  if (!pdfMetadata) return null;

  // /UserUnit specifies how many user-space units = 1/72 inch
  // A UserUnit > 1 effectively scales the drawing
  const userUnit = pdfMetadata["/UserUnit"] ?? pdfMetadata["UserUnit"];
  if (userUnit) {
    const val = parseFloat(userUnit);
    if (!isNaN(val) && val > 0 && val !== 1) {
      // factor = val (how many drawing units represent 1 real PDF unit)
      return { factor: val, confidence: "metadata" };
    }
  }

  // Custom metadata keys
  const candidates = ["Scale", "Drawing Scale", "DrawingScale", "scale"];
  for (const key of candidates) {
    const val = pdfMetadata[key];
    if (!val) continue;
    const parsed = parseScaleText(val);
    if (parsed !== null) {
      return { factor: parsed, confidence: "metadata" };
    }
  }

  return null;
}

// ---------------------------------------------------------------------------
// Priority 2: Title block text
// ---------------------------------------------------------------------------

function tryTitleBlock(page: VectorPage): ScaleInfo | null {
  const titleClusters = page.textClusters.filter(
    (c) => c.clusterType === "titleBlock",
  );

  for (const cluster of titleClusters) {
    const combinedText = cluster.texts.map((t) => t.content).join(" ");

    // Try each text item individually and combined
    const textsToTry = [combinedText, ...cluster.texts.map((t) => t.content)];

    for (const text of textsToTry) {
      const factor = parseScaleText(text);
      if (factor !== null) {
        return { factor, confidence: "explicit" };
      }
    }
  }

  return null;
}

// ---------------------------------------------------------------------------
// Priority 3: Scale bar detection
// ---------------------------------------------------------------------------

/**
 * Find candidate scale bars:
 * 1. Horizontal line 0.5"–6" long
 * 2. 2–6 evenly spaced vertical tick marks along the line
 * 3. Nearby "dimensions"-classified text cluster with numeric content
 */
function tryScaleBar(page: VectorPage): ScaleInfo | null {
  const DEG_TO_RAD = Math.PI / 180;
  const HORIZONTAL_TOLERANCE = 5 * DEG_TO_RAD; // 5° from horizontal
  const TICK_PROXIMITY = 0.3; // inches — tick must be near the bar's projection
  const TEXT_PROXIMITY = 1.5; // inches — label must be near bar
  const MIN_BAR_LEN = 0.5;
  const MAX_BAR_LEN = 6.0;

  // Find candidate horizontal bar lines
  const horizontalLines = page.lines.filter((line) => {
    const len = lineLength(line);
    if (len < MIN_BAR_LEN || len > MAX_BAR_LEN) return false;
    const angle = lineAngle(line);
    // Horizontal = angle near 0 or near π (i.e. <= 5° or >= 175°)
    return (
      angle <= HORIZONTAL_TOLERANCE || angle >= Math.PI - HORIZONTAL_TOLERANCE
    );
  });

  if (horizontalLines.length === 0) return null;

  // Dimension text clusters with numeric content
  const dimensionClusters = page.textClusters.filter(
    (c) => c.clusterType === "dimensions",
  );

  for (const bar of horizontalLines) {
    const barLen = lineLength(bar);
    const barLeft = Math.min(bar.start.x, bar.end.x);
    const barRight = Math.max(bar.start.x, bar.end.x);
    const barY = (bar.start.y + bar.end.y) / 2;

    // Find tick marks: short vertical lines with x within bar range and y near bar y
    const ticks = page.lines.filter((line) => {
      const len = lineLength(line);
      if (len < 0.05 || len > 0.5) return false;
      const angle = lineAngle(line);
      // Near vertical: angle between 85° and 95°
      const nearVertical = angle >= 85 * DEG_TO_RAD && angle <= 95 * DEG_TO_RAD;
      if (!nearVertical) return false;
      const midX = (line.start.x + line.end.x) / 2;
      const midY = (line.start.y + line.end.y) / 2;
      // Tick x must be within bar's x range (with small tolerance)
      if (midX < barLeft - TICK_PROXIMITY || midX > barRight + TICK_PROXIMITY)
        return false;
      // Tick y must be near bar y
      return Math.abs(midY - barY) <= TICK_PROXIMITY;
    });

    if (ticks.length < 2 || ticks.length > 6) continue;

    // Check that ticks are evenly spaced (within 20% variance)
    const tickXPositions = ticks
      .map((t) => (t.start.x + t.end.x) / 2)
      .sort((a, b) => a - b);

    if (tickXPositions.length >= 2) {
      const spacings: number[] = [];
      for (let i = 1; i < tickXPositions.length; i++) {
        spacings.push(tickXPositions[i] - tickXPositions[i - 1]);
      }
      const meanSpacing = spacings.reduce((s, v) => s + v, 0) / spacings.length;
      const maxDeviation = Math.max(
        ...spacings.map((s) => Math.abs(s - meanSpacing)),
      );
      if (meanSpacing > 0 && maxDeviation / meanSpacing > 0.2) continue;
    }

    // Find a nearby dimension text cluster with numeric content
    const barCenter: Point = {
      x: (bar.start.x + bar.end.x) / 2,
      y: barY,
    };

    let matchedCluster: TextCluster | null = null;
    for (const cluster of dimensionClusters) {
      if (euclideanDist(cluster.centroid, barCenter) <= TEXT_PROXIMITY) {
        matchedCluster = cluster;
        break;
      }
    }

    if (!matchedCluster) continue;

    // Parse the label text to get the scale value
    // Expected: "0 10 20 FT" or "0 5 10" or "0   20   40"
    const labelText = matchedCluster.texts.map((t) => t.content).join(" ");
    const numbers = labelText.match(/\b(\d+(?:\.\d+)?)\b/g);
    if (!numbers || numbers.length < 2) continue;

    // Find the first non-zero value and its position along the bar
    const numericValues = numbers.map(Number).filter((n) => !isNaN(n));
    const firstNonZero = numericValues.find((n) => n > 0);
    if (!firstNonZero) continue;

    // Determine if label is in feet or feet (assume feet for scale bars)
    // Factor: labelValue (in feet) * 12 / barLengthInches
    // We use the full bar length corresponding to the last labeled value
    const lastValue = numericValues[numericValues.length - 1];
    if (lastValue <= 0) continue;

    // Assume last value labels the full bar
    const factor = (lastValue * 12) / barLen;
    if (factor > 0) {
      return { factor, confidence: "scale_bar" };
    }
  }

  return null;
}

// ---------------------------------------------------------------------------
// Priority 4: Dimension calibration
// ---------------------------------------------------------------------------

/** Parse a dimension text string like "3'-6\"", "12\"", "9' 6\"" into inches. */
function parseDimensionToInches(text: string): number | null {
  // Pattern: Nft-Nin or N'N" or N' or N"
  const feetInches = text.match(/(\d+)['`]\s*-?\s*(\d+)"/);
  if (feetInches) {
    return parseFloat(feetInches[1]) * 12 + parseFloat(feetInches[2]);
  }

  const feetOnly = text.match(/^(\d+(?:\.\d+)?)'$/);
  if (feetOnly) {
    return parseFloat(feetOnly[1]) * 12;
  }

  const inchesOnly = text.match(/^(\d+(?:\.\d+)?)"$/);
  if (inchesOnly) {
    return parseFloat(inchesOnly[1]);
  }

  const feetWithInches = text.match(/(\d+)'\s+(\d+)"/);
  if (feetWithInches) {
    return parseFloat(feetWithInches[1]) * 12 + parseFloat(feetWithInches[2]);
  }

  return null;
}

function tryDimensionCalibration(page: VectorPage): ScaleInfo | null {
  const dimensionClusters = page.textClusters.filter(
    (c) => c.clusterType === "dimensions",
  );

  if (dimensionClusters.length < 3) return null;

  const EXTENSION_LINE_PROXIMITY = 1.0; // inches — extension line must be near dimension text
  const DEG_TO_RAD = Math.PI / 180;
  const PARALLEL_ANGLE_TOLERANCE = 5 * DEG_TO_RAD;

  const candidateFactors: number[] = [];

  for (const cluster of dimensionClusters) {
    const combinedText = cluster.texts.map((t) => t.content).join(" ");
    const dimensionInches = parseDimensionToInches(combinedText.trim());
    if (dimensionInches === null || dimensionInches <= 0) continue;

    // Find lines near this cluster (potential extension lines)
    const nearbyLines = page.lines.filter((line) => {
      const midX = (line.start.x + line.end.x) / 2;
      const midY = (line.start.y + line.end.y) / 2;
      const lineMid: Point = { x: midX, y: midY };
      return (
        euclideanDist(lineMid, cluster.centroid) <= EXTENSION_LINE_PROXIMITY
      );
    });

    if (nearbyLines.length < 2) continue;

    // Find pairs of parallel lines (potential extension lines)
    for (let i = 0; i < nearbyLines.length; i++) {
      for (let j = i + 1; j < nearbyLines.length; j++) {
        const lineA = nearbyLines[i];
        const lineB = nearbyLines[j];
        const angleA = lineAngle(lineA);
        const angleB = lineAngle(lineB);
        const angleDiff = Math.abs(angleA - angleB);
        const normalizedDiff = Math.min(angleDiff, Math.PI - angleDiff);

        if (normalizedDiff > PARALLEL_ANGLE_TOLERANCE) continue;

        // Lines are parallel — compute perpendicular distance between them
        const midA: Point = {
          x: (lineA.start.x + lineA.end.x) / 2,
          y: (lineA.start.y + lineA.end.y) / 2,
        };
        const distInPdf = perpDistanceToLine(midA, lineB.start, lineB.end);

        if (distInPdf < 0.01) continue; // Coincident lines

        const factor = dimensionInches / distInPdf;
        if (factor > 0 && isFinite(factor)) {
          candidateFactors.push(factor);
        }
      }
    }
  }

  if (candidateFactors.length < 3) return null;

  // Reject outliers beyond 2 standard deviations from the mean
  const mean =
    candidateFactors.reduce((s, v) => s + v, 0) / candidateFactors.length;
  const sd = stdDev(candidateFactors, mean);
  const filtered = candidateFactors.filter((f) => Math.abs(f - mean) <= 2 * sd);

  if (filtered.length < 3) return null;

  const medianFactor = median(filtered);
  return { factor: medianFactor, confidence: "calibrated" };
}

// ---------------------------------------------------------------------------
// Priority 5: Sheet size inference
// ---------------------------------------------------------------------------

interface SheetSizeEntry {
  widthIn: number;
  heightIn: number;
  factor: number;
  name: string;
}

const STANDARD_SHEET_SIZES: SheetSizeEntry[] = [
  { name: "ARCH E", widthIn: 36, heightIn: 48, factor: 96 },
  { name: "ARCH D", widthIn: 24, heightIn: 36, factor: 48 },
  { name: "ARCH C", widthIn: 18, heightIn: 24, factor: 24 },
  { name: "ARCH B", widthIn: 12, heightIn: 18, factor: 24 },
  { name: "Letter", widthIn: 8.5, heightIn: 11, factor: 12 },
  { name: "Legal", widthIn: 8.5, heightIn: 14, factor: 12 },
  // Also allow landscape orientations
  { name: "ARCH E landscape", widthIn: 48, heightIn: 36, factor: 96 },
  { name: "ARCH D landscape", widthIn: 36, heightIn: 24, factor: 48 },
  { name: "ARCH C landscape", widthIn: 24, heightIn: 18, factor: 24 },
];

const TOLERANCE = 0.5; // inches

function trySheetSizeInference(
  mediaBoxPts?: [number, number, number, number],
): ScaleInfo | null {
  if (!mediaBoxPts) return null;

  const [x0, y0, x1, y1] = mediaBoxPts;
  const widthPt = Math.abs(x1 - x0);
  const heightPt = Math.abs(y1 - y0);
  const widthIn = widthPt / 72;
  const heightIn = heightPt / 72;

  for (const sheet of STANDARD_SHEET_SIZES) {
    const widthMatch = Math.abs(widthIn - sheet.widthIn) <= TOLERANCE;
    const heightMatch = Math.abs(heightIn - sheet.heightIn) <= TOLERANCE;
    if (widthMatch && heightMatch) {
      return { factor: sheet.factor, confidence: "inferred" };
    }
  }

  return null;
}

// ---------------------------------------------------------------------------
// VEC-003 main export: detectScale
// ---------------------------------------------------------------------------

/**
 * Detect the drawing scale factor via a 6-priority cascade.
 *
 * @param page          - Parsed VectorPage from extractVectorPage()
 * @param pdfMetadata   - Optional PDF metadata dictionary (key/value strings)
 * @param mediaBoxPts   - Optional page MediaBox in PDF points [x0, y0, x1, y1]
 * @returns ScaleInfo with factor and confidence, or null if undetermined
 */
export async function detectScale(
  page: VectorPage,
  pdfMetadata?: Record<string, string>,
  mediaBoxPts?: [number, number, number, number],
): Promise<ScaleInfo | null> {
  // Priority 1: PDF metadata
  const metaResult = tryMetadata(pdfMetadata);
  if (metaResult) return metaResult;

  // Priority 2: Title block text
  const titleResult = tryTitleBlock(page);
  if (titleResult) return titleResult;

  // Priority 3: Scale bar
  const scaleBarResult = tryScaleBar(page);
  if (scaleBarResult) return scaleBarResult;

  // Priority 4: Dimension calibration
  const dimResult = tryDimensionCalibration(page);
  if (dimResult) return dimResult;

  // Priority 5: Sheet size inference
  const sheetResult = trySheetSizeInference(mediaBoxPts);
  if (sheetResult) return sheetResult;

  // Priority 6: Fallback
  return null;
}
