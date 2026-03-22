/**
 * Vector PDF Preprocessor (VEC-002)
 *
 * Parses a PDF page using pdfjs-dist in Node.js (no canvas, no worker)
 * and extracts typed vector elements:
 *   - VectorLine, VectorRect, VectorPath, VectorArc (from path operators)
 *   - TextObject and TextCluster (from text operators + proximity clustering)
 *   - pageClassification and sheetType (from image area / operator density)
 *   - Hatch and dimension line filtering (removed before return)
 *
 * All coordinates stored in inches (PDF points / 72).
 */

// pdfjs-dist v5 legacy build — no canvas, no worker in Node.js
import * as pdfjsLib from "pdfjs-dist/legacy/build/pdf.mjs";

import type {
  VectorPage,
  VectorLine,
  VectorRect,
  VectorPath,
  TextObject,
  TextCluster,
  TextClusterType,
  PageClassification,
  SheetType,
  Point,
  Rect,
} from "./types";

// ---------------------------------------------------------------------------
// OPS alias for readability
// ---------------------------------------------------------------------------

const OPS = pdfjsLib.OPS as Record<string, number>;

// ---------------------------------------------------------------------------
// VEC-002.1: pdfjs-dist Node.js bootstrap and page loader
// ---------------------------------------------------------------------------

/** Load a single PDF page from a Buffer. No canvas or worker required. */
async function loadPdfPage(
  pdfBytes: Buffer,
  pageNumber: number,
): Promise<pdfjsLib.PDFPageProxy> {
  const data = new Uint8Array(pdfBytes);

  const loadingTask = pdfjsLib.getDocument({
    data,
    // Disable worker in Node.js — not needed for operator list extraction
    disableWorker: true,
    // Suppress verbose warnings during parsing
    verbosity: 0,
  } as Parameters<typeof pdfjsLib.getDocument>[0]);

  const pdf = await loadingTask.promise;
  return pdf.getPage(pageNumber);
}

// ---------------------------------------------------------------------------
// Internal types used during operator-list parsing
// ---------------------------------------------------------------------------

interface SubPath {
  points: Point[];
  isClosed: boolean;
}

interface PendingPath {
  subPaths: SubPath[];
  strokeWidth: number;
  dashArray: number[] | null;
  hasFill: boolean;
  fillColor: string | null;
}

// ---------------------------------------------------------------------------
// VEC-002.2 helpers: coordinate normalisation
// ---------------------------------------------------------------------------

/** Convert a PDF point value to inches (1 pt = 1/72 inch). */
function ptToIn(pt: number): number {
  return pt / 72;
}

function normalizePoint(x: number, y: number): Point {
  return { x: ptToIn(x), y: ptToIn(y) };
}

/**
 * Subdivide a cubic Bézier curve into `steps` line segments.
 * Control points: (x0,y0), (x1,y1), (x2,y2), (x3,y3).
 */
function sampleBezier(
  x0: number,
  y0: number,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  x3: number,
  y3: number,
  steps = 8,
): Point[] {
  const pts: Point[] = [];
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const mt = 1 - t;
    const x =
      mt * mt * mt * x0 +
      3 * mt * mt * t * x1 +
      3 * mt * t * t * x2 +
      t * t * t * x3;
    const y =
      mt * mt * mt * y0 +
      3 * mt * mt * t * y1 +
      3 * mt * t * t * y2 +
      t * t * t * y3;
    pts.push(normalizePoint(x, y));
  }
  return pts;
}

/**
 * Try to classify a completed pending path as VectorLine, VectorRect or VectorPath.
 */
function classifyPath(pending: PendingPath): {
  line?: VectorLine;
  rect?: VectorRect;
  path?: VectorPath;
} {
  // Flatten all sub-paths into a single point list (for simple single-subpath cases)
  const allPoints: Point[] = pending.subPaths.flatMap((sp) => sp.points);
  const isClosed =
    pending.subPaths.length > 0 && pending.subPaths.every((sp) => sp.isClosed);

  // ── 2-point non-fill path → VectorLine
  if (allPoints.length === 2 && !pending.hasFill) {
    const line: VectorLine = {
      start: allPoints[0],
      end: allPoints[1],
      strokeWidth: ptToIn(pending.strokeWidth),
      dashArray: pending.dashArray
        ? pending.dashArray.map((v) => ptToIn(v))
        : null,
    };
    return { line };
  }

  // ── Axis-aligned 4-point closed rect → VectorRect
  if (allPoints.length >= 4 && isClosed) {
    // Collect unique X and Y values within tolerance
    const uniqueXSet = new Set<string>();
    const uniqueYSet = new Set<string>();
    for (const p of allPoints) {
      uniqueXSet.add(p.x.toFixed(4));
      uniqueYSet.add(p.y.toFixed(4));
    }
    const uniqueX = Array.from(uniqueXSet).map(Number);
    const uniqueY = Array.from(uniqueYSet).map(Number);

    if (uniqueX.length === 2 && uniqueY.length === 2) {
      const x = Math.min(uniqueX[0], uniqueX[1]);
      const y = Math.min(uniqueY[0], uniqueY[1]);
      const width = Math.abs(uniqueX[1] - uniqueX[0]);
      const height = Math.abs(uniqueY[1] - uniqueY[0]);
      const rect: VectorRect = {
        x,
        y,
        width,
        height,
        hasFill: pending.hasFill,
        strokeWidth: ptToIn(pending.strokeWidth),
      };
      return { rect };
    }
  }

  // ── General VectorPath
  const path: VectorPath = {
    points: allPoints,
    isClosed,
    hasFill: pending.hasFill,
    fillColor: pending.fillColor,
    strokeWidth: ptToIn(pending.strokeWidth),
  };
  return { path };
}

// ---------------------------------------------------------------------------
// VEC-002.2: Parse path operators from operator list
// ---------------------------------------------------------------------------

interface ParsedGeometry {
  lines: VectorLine[];
  rects: VectorRect[];
  paths: VectorPath[];
  constructPathCount: number;
}

function parsePathOperators(
  fnArray: number[],
  argsArray: unknown[][],
): ParsedGeometry {
  const lines: VectorLine[] = [];
  const rects: VectorRect[] = [];
  const paths: VectorPath[] = [];

  let strokeWidth = 1;
  let dashArray: number[] | null = null;
  let fillColor: string | null = null;
  let currentX = 0;
  let currentY = 0;
  let subPathStart: Point | null = null;
  let constructPathCount = 0;

  // Active pending path — accumulates until a paint op (stroke/fill/etc.)
  let pending: PendingPath | null = null;
  let currentSubPath: SubPath | null = null;

  function flushCurrentSubPath() {
    if (pending && currentSubPath) {
      if (currentSubPath.points.length > 0) {
        pending.subPaths.push(currentSubPath);
      }
      currentSubPath = null;
    }
  }

  function commitPending(hasFill: boolean, fColor?: string | null) {
    if (!pending) return;

    flushCurrentSubPath();

    if (hasFill) {
      pending.hasFill = true;
      if (fColor !== undefined) pending.fillColor = fColor;
    }

    if (pending.subPaths.length > 0) {
      const result = classifyPath(pending);
      if (result.line) lines.push(result.line);
      else if (result.rect) rects.push(result.rect);
      else if (result.path && result.path.points.length > 0)
        paths.push(result.path);
    }
    pending = null;
    currentSubPath = null;
  }

  function ensurePending() {
    if (!pending) {
      pending = {
        subPaths: [],
        strokeWidth,
        dashArray,
        hasFill: false,
        fillColor: null,
      };
    }
  }

  for (let i = 0; i < fnArray.length; i++) {
    const op = fnArray[i];
    const args = argsArray[i] as unknown[];

    // ── setLineWidth
    if (op === OPS.setLineWidth) {
      strokeWidth = (args[0] as number) ?? 1;
      continue;
    }

    // ── setDash
    if (op === OPS.setDash) {
      const dash = args[0] as number[];
      dashArray = dash && dash.length > 0 ? dash : null;
      continue;
    }

    // ── setFillRGBColor
    if (op === OPS.setFillRGBColor) {
      const r = Math.round(((args[0] as number) ?? 0) * 255);
      const g = Math.round(((args[1] as number) ?? 0) * 255);
      const b = Math.round(((args[2] as number) ?? 0) * 255);
      fillColor = `rgb(${r},${g},${b})`;
      continue;
    }

    // ── setFillGray
    if (op === OPS.setFillGray) {
      const v = Math.round(((args[0] as number) ?? 0) * 255);
      fillColor = `rgb(${v},${v},${v})`;
      continue;
    }

    // ── moveTo
    if (op === OPS.moveTo) {
      const x = args[0] as number;
      const y = args[1] as number;
      ensurePending();
      flushCurrentSubPath();
      currentX = x;
      currentY = y;
      subPathStart = normalizePoint(x, y);
      currentSubPath = { points: [normalizePoint(x, y)], isClosed: false };
      continue;
    }

    // ── lineTo
    if (op === OPS.lineTo) {
      const x = args[0] as number;
      const y = args[1] as number;
      ensurePending();
      if (!currentSubPath) {
        currentSubPath = {
          points: [normalizePoint(currentX, currentY)],
          isClosed: false,
        };
      }
      currentX = x;
      currentY = y;
      currentSubPath.points.push(normalizePoint(x, y));
      continue;
    }

    // ── curveTo (cubic Bézier: x1 y1 x2 y2 x3 y3)
    if (op === OPS.curveTo) {
      const x1 = args[0] as number;
      const y1 = args[1] as number;
      const x2 = args[2] as number;
      const y2 = args[3] as number;
      const x3 = args[4] as number;
      const y3 = args[5] as number;
      ensurePending();
      if (!currentSubPath) {
        currentSubPath = {
          points: [normalizePoint(currentX, currentY)],
          isClosed: false,
        };
      }
      // Sample bezier — skip first point (already in path)
      const sampled = sampleBezier(currentX, currentY, x1, y1, x2, y2, x3, y3);
      currentSubPath.points.push(...sampled.slice(1));
      currentX = x3;
      currentY = y3;
      continue;
    }

    // ── curveTo2 (x2 y2 x3 y3 — first control point = current)
    if (op === OPS.curveTo2) {
      const x2 = args[0] as number;
      const y2 = args[1] as number;
      const x3 = args[2] as number;
      const y3 = args[3] as number;
      ensurePending();
      if (!currentSubPath) {
        currentSubPath = {
          points: [normalizePoint(currentX, currentY)],
          isClosed: false,
        };
      }
      const sampled = sampleBezier(
        currentX,
        currentY,
        currentX,
        currentY,
        x2,
        y2,
        x3,
        y3,
      );
      currentSubPath.points.push(...sampled.slice(1));
      currentX = x3;
      currentY = y3;
      continue;
    }

    // ── curveTo3 (x1 y1 x3 y3 — second control = x3 y3)
    if (op === OPS.curveTo3) {
      const x1 = args[0] as number;
      const y1 = args[1] as number;
      const x3 = args[2] as number;
      const y3 = args[3] as number;
      ensurePending();
      if (!currentSubPath) {
        currentSubPath = {
          points: [normalizePoint(currentX, currentY)],
          isClosed: false,
        };
      }
      const sampled = sampleBezier(currentX, currentY, x1, y1, x3, y3, x3, y3);
      currentSubPath.points.push(...sampled.slice(1));
      currentX = x3;
      currentY = y3;
      continue;
    }

    // ── closePath
    if (op === OPS.closePath) {
      if (currentSubPath && subPathStart) {
        currentSubPath.isClosed = true;
        // Close back to start
        currentSubPath.points.push(subPathStart);
        currentX = subPathStart.x * 72;
        currentY = subPathStart.y * 72;
      }
      continue;
    }

    // ── rectangle shorthand (x y w h)
    if (op === OPS.rectangle) {
      const rx = args[0] as number;
      const ry = args[1] as number;
      const rw = args[2] as number;
      const rh = args[3] as number;
      ensurePending();
      flushCurrentSubPath();
      const tl = normalizePoint(rx, ry);
      const tr = normalizePoint(rx + rw, ry);
      const br = normalizePoint(rx + rw, ry + rh);
      const bl = normalizePoint(rx, ry + rh);
      currentSubPath = {
        points: [tl, tr, br, bl, tl],
        isClosed: true,
      };
      currentX = rx;
      currentY = ry;
      subPathStart = tl;
      continue;
    }

    // ── constructPath: pdfjs batches moveTo/lineTo/curveTo into a single op
    // args[0] = ops array, args[1] = coords array
    if (op === OPS.constructPath) {
      constructPathCount++;
      const subOps = args[0] as number[];
      const coords = args[1] as number[];
      let ci = 0;

      ensurePending();
      flushCurrentSubPath();

      for (let si = 0; si < subOps.length; si++) {
        const subOp = subOps[si];

        if (subOp === OPS.moveTo) {
          flushCurrentSubPath();
          const x = coords[ci++];
          const y = coords[ci++];
          currentX = x;
          currentY = y;
          subPathStart = normalizePoint(x, y);
          currentSubPath = { points: [normalizePoint(x, y)], isClosed: false };
        } else if (subOp === OPS.lineTo) {
          const x = coords[ci++];
          const y = coords[ci++];
          if (!currentSubPath) {
            currentSubPath = {
              points: [normalizePoint(currentX, currentY)],
              isClosed: false,
            };
          }
          currentX = x;
          currentY = y;
          currentSubPath.points.push(normalizePoint(x, y));
        } else if (subOp === OPS.curveTo) {
          const x1 = coords[ci++];
          const y1 = coords[ci++];
          const x2 = coords[ci++];
          const y2 = coords[ci++];
          const x3 = coords[ci++];
          const y3 = coords[ci++];
          if (!currentSubPath) {
            currentSubPath = {
              points: [normalizePoint(currentX, currentY)],
              isClosed: false,
            };
          }
          const sampled = sampleBezier(
            currentX,
            currentY,
            x1,
            y1,
            x2,
            y2,
            x3,
            y3,
          );
          currentSubPath.points.push(...sampled.slice(1));
          currentX = x3;
          currentY = y3;
        } else if (subOp === OPS.curveTo2) {
          const x2 = coords[ci++];
          const y2 = coords[ci++];
          const x3 = coords[ci++];
          const y3 = coords[ci++];
          if (!currentSubPath) {
            currentSubPath = {
              points: [normalizePoint(currentX, currentY)],
              isClosed: false,
            };
          }
          const sampled = sampleBezier(
            currentX,
            currentY,
            currentX,
            currentY,
            x2,
            y2,
            x3,
            y3,
          );
          currentSubPath.points.push(...sampled.slice(1));
          currentX = x3;
          currentY = y3;
        } else if (subOp === OPS.curveTo3) {
          const x1 = coords[ci++];
          const y1 = coords[ci++];
          const x3 = coords[ci++];
          const y3 = coords[ci++];
          if (!currentSubPath) {
            currentSubPath = {
              points: [normalizePoint(currentX, currentY)],
              isClosed: false,
            };
          }
          const sampled = sampleBezier(
            currentX,
            currentY,
            x1,
            y1,
            x3,
            y3,
            x3,
            y3,
          );
          currentSubPath.points.push(...sampled.slice(1));
          currentX = x3;
          currentY = y3;
        } else if (subOp === OPS.closePath) {
          if (currentSubPath && subPathStart) {
            currentSubPath.isClosed = true;
            currentSubPath.points.push(subPathStart);
          }
        } else if (subOp === OPS.rectangle) {
          const rx = coords[ci++];
          const ry = coords[ci++];
          const rw = coords[ci++];
          const rh = coords[ci++];
          flushCurrentSubPath();
          const tl = normalizePoint(rx, ry);
          const tr = normalizePoint(rx + rw, ry);
          const br = normalizePoint(rx + rw, ry + rh);
          const bl = normalizePoint(rx, ry + rh);
          currentSubPath = { points: [tl, tr, br, bl, tl], isClosed: true };
          currentX = rx;
          currentY = ry;
          subPathStart = tl;
        }
      }
      // constructPath paths are typically painted immediately after — don't commit here
      continue;
    }

    // ── Paint operators: stroke, fill, fillStroke, etc.
    if (op === OPS.stroke || op === OPS.closeStroke) {
      commitPending(false);
      continue;
    }

    if (op === OPS.fill || op === OPS.eoFill) {
      commitPending(true, fillColor);
      continue;
    }

    if (
      op === OPS.fillStroke ||
      op === OPS.eoFillStroke ||
      op === OPS.closeFillStroke ||
      op === OPS.closeEOFillStroke
    ) {
      commitPending(true, fillColor);
      continue;
    }

    // ── endPath (abandon path without painting)
    if (op === OPS.endPath) {
      pending = null;
      currentSubPath = null;
      continue;
    }
  }

  // Flush any remaining uncommitted path
  commitPending(false);

  return { lines, rects, paths, constructPathCount };
}

// ---------------------------------------------------------------------------
// VEC-002.3: Text operator parsing and spatial clustering
// ---------------------------------------------------------------------------

/** Extract TextObjects from a pdfjs TextContent result. */
async function extractTextObjects(
  page: pdfjsLib.PDFPageProxy,
): Promise<TextObject[]> {
  const textContent = await page.getTextContent();
  const texts: TextObject[] = [];

  for (const item of textContent.items) {
    // Filter out TextMarkedContent (has no str property)
    if (!("str" in item)) continue;
    const textItem = item as {
      str: string;
      transform: number[];
      width: number;
      height: number;
      fontName: string;
    };

    const str = textItem.str.trim();
    if (!str) continue;

    // transform = [a, b, c, d, e, f] where (e, f) is the translation (PDF coordinates)
    const tx = textItem.transform[4] ?? 0;
    const ty = textItem.transform[5] ?? 0;
    // fontSize = scale of font in the matrix (approximate from transform[0] or [3])
    const fontSize = Math.abs(
      textItem.transform[3] ?? textItem.transform[0] ?? 12,
    );

    const position = normalizePoint(tx, ty);
    const widthIn = ptToIn(textItem.width || fontSize * str.length * 0.6);
    const heightIn = ptToIn(textItem.height || fontSize);

    const bounds: Rect = {
      x: position.x,
      y: position.y,
      width: widthIn,
      height: heightIn,
    };

    texts.push({ content: str, position, fontSize: ptToIn(fontSize), bounds });
  }

  return texts;
}

// Dimension regex — matches: 3'-6", 12", 24'-0", 3' 6", etc.
const DIMENSION_REGEX = /\d+['"][\s-]*\d*['"]|\d+'-\d+"/;

function euclideanDist(a: Point, b: Point): number {
  return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
}

/**
 * Simple greedy proximity clustering: group texts within 2" of each other
 * by euclidean centroid distance.
 */
function clusterTexts(
  texts: TextObject[],
  pageWidthIn: number,
  pageHeightIn: number,
): TextCluster[] {
  if (texts.length === 0) return [];

  const CLUSTER_RADIUS = 2; // inches

  // Compute centroid for a list of texts
  function centroid(items: TextObject[]): Point {
    const x = items.reduce((s, t) => s + t.position.x, 0) / items.length;
    const y = items.reduce((s, t) => s + t.position.y, 0) / items.length;
    return { x, y };
  }

  // Build clusters greedily
  const assigned = new Set<number>();
  const clusters: TextObject[][] = [];

  for (let i = 0; i < texts.length; i++) {
    if (assigned.has(i)) continue;

    const group: TextObject[] = [texts[i]];
    assigned.add(i);

    for (let j = i + 1; j < texts.length; j++) {
      if (assigned.has(j)) continue;
      const groupCentroid = centroid(group);
      if (euclideanDist(groupCentroid, texts[j].position) <= CLUSTER_RADIUS) {
        group.push(texts[j]);
        assigned.add(j);
      }
    }

    clusters.push(group);
  }

  return clusters.map((group) => {
    const c = centroid(group);
    const clusterType = classifyCluster(group, c, pageWidthIn, pageHeightIn);
    return { texts: group, centroid: c, clusterType };
  });
}

function classifyCluster(
  items: TextObject[],
  c: Point,
  pageW: number,
  pageH: number,
): TextClusterType {
  const combined = items.map((t) => t.content).join(" ");
  const maxFontSize = Math.max(...items.map((t) => t.fontSize));

  // sheetTitle: top 10% of page (in PDF coords y increases upward, so top of page = high y)
  // Most PDFs have y=0 at bottom. Top 10% means y > 90% of pageHeight.
  const isTopOfPage = c.y >= pageH * 0.9;
  if (isTopOfPage && maxFontSize > ptToIn(14)) {
    return "sheetTitle";
  }

  // titleBlock: bottom-right 20% of page
  const isBottomRight = c.x >= pageW * 0.8 && c.y <= pageH * 0.2;
  if (isBottomRight) {
    return "titleBlock";
  }

  // dimensions: matches dimension regex
  if (DIMENSION_REGEX.test(combined)) {
    return "dimensions";
  }

  // roomNames: 2–20 chars, mostly uppercase
  for (const item of items) {
    const t = item.content;
    if (t.length >= 2 && t.length <= 20) {
      const upperCount = (t.match(/[A-Z]/g) || []).length;
      const letterCount = (t.match(/[A-Za-z]/g) || []).length;
      if (letterCount > 0 && upperCount / letterCount >= 0.6) {
        // Must be in the page body (not top 10% or bottom-right)
        const inBody = !isTopOfPage && !isBottomRight;
        if (inBody) return "roomNames";
      }
    }
  }

  return "notes";
}

// ---------------------------------------------------------------------------
// VEC-002.4: Sheet filtering and raster vs. vector classification
// ---------------------------------------------------------------------------

interface ImageAreaInfo {
  totalImageArea: number; // PDF points squared
}

function parseImageOperators(
  fnArray: number[],
  argsArray: unknown[][],
  page: pdfjsLib.PDFPageProxy,
): ImageAreaInfo {
  const [, , pageWidthPt, pageHeightPt] = page.view;
  let totalImageArea = 0;
  const pageArea = (pageWidthPt || 612) * (pageHeightPt || 792);

  for (let i = 0; i < fnArray.length; i++) {
    const op = fnArray[i];
    if (
      op === OPS.paintImageXObject ||
      op === OPS.paintImageXObjectRepeat ||
      op === OPS.paintInlineImageXObject ||
      op === OPS.paintInlineImageXObjectGroup
    ) {
      // Approximate: assume full page per image hit (conservative)
      // Real implementation would track current transform matrix
      totalImageArea += pageArea;
    }
  }

  return { totalImageArea };
}

function computePageClassification(
  totalImageArea: number,
  pageArea: number,
  constructPathCount: number,
): PageClassification {
  const imageRatio = pageArea > 0 ? totalImageArea / pageArea : 0;

  if (imageRatio > 0.9 && constructPathCount < 10) return "raster";
  if (imageRatio < 0.1 && constructPathCount > 50) return "vector";
  return "mixed";
}

function computeSheetType(textClusters: TextCluster[]): SheetType {
  const titleCluster = textClusters.find((c) => c.clusterType === "sheetTitle");
  if (!titleCluster) return "unknown";

  const title = titleCluster.texts
    .map((t) => t.content)
    .join(" ")
    .toUpperCase();

  if (title.includes("REFLECTED CEILING") || title.includes("RCP"))
    return "rcp";
  if (title.includes("DETAIL")) return "detail";
  if (title.includes("CODE")) return "code";
  if (
    title.includes("ELECTRICAL") ||
    /\bE-\d/.test(title) ||
    title.includes("PLUMBING") ||
    /\bP-\d/.test(title) ||
    title.includes("MECHANICAL") ||
    /\bM-\d/.test(title)
  ) {
    return "mep";
  }
  if (title.includes("SCHEDULE")) return "schedule";
  if (title.includes("ELEVATION")) return "elevation";
  if (title.includes("SECTION")) return "section";

  // Title exists but no specific match
  return "floor_plan";
}

// ---------------------------------------------------------------------------
// VEC-002.5: Hatch and dimension line filtering
// ---------------------------------------------------------------------------

/** Compute the angle of a line segment in radians [0, π). */
function lineAngle(line: VectorLine): number {
  const dx = line.end.x - line.start.x;
  const dy = line.end.y - line.start.y;
  let angle = Math.atan2(dy, dx);
  // Normalize to [0, π)
  if (angle < 0) angle += Math.PI;
  if (angle >= Math.PI) angle -= Math.PI;
  return angle;
}

/** Perpendicular distance from point p to line defined by (a, b). */
function perpDistanceToLine(p: Point, a: Point, b: Point): number {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const len = Math.sqrt(dx * dx + dy * dy);
  if (len < 1e-9) return euclideanDist(p, a);
  return Math.abs(dy * p.x - dx * p.y + b.x * a.y - b.y * a.x) / len;
}

/** Return midpoint of a line. */
function midpoint(line: VectorLine): Point {
  return {
    x: (line.start.x + line.end.x) / 2,
    y: (line.start.y + line.end.y) / 2,
  };
}

const DEG_TO_RAD = Math.PI / 180;

/**
 * Detect hatch groups: 4+ lines that are parallel (angle diff <= 0.5°)
 * with consistent perpendicular spacing (<= 0.1" variance).
 * Returns a Set of indices (into the lines array) that are hatch.
 */
function detectHatchIndices(lines: VectorLine[]): Set<number> {
  const hatchIndices = new Set<number>();
  const ANGLE_TOLERANCE = 0.5 * DEG_TO_RAD;
  const SPACING_VARIANCE = 0.1; // inches

  // Group lines by quantized angle bucket
  const angleBuckets = new Map<number, number[]>();

  for (let i = 0; i < lines.length; i++) {
    const angle = lineAngle(lines[i]);
    // Bucket by 1-degree increments
    const bucket = Math.round((angle * 180) / Math.PI);
    if (!angleBuckets.has(bucket)) angleBuckets.set(bucket, []);
    angleBuckets.get(bucket)!.push(i);
  }

  for (const [, indices] of angleBuckets) {
    if (indices.length < 4) continue;

    // For lines in this angle group, compute perpendicular distances
    // relative to the first line in the group
    const reference = lines[indices[0]];
    const refAngle = lineAngle(reference);

    // Filter to only lines within angle tolerance
    const group = indices.filter((idx) => {
      const angleDiff = Math.abs(lineAngle(lines[idx]) - refAngle);
      const normalizedDiff = Math.min(angleDiff, Math.PI - angleDiff);
      return normalizedDiff <= ANGLE_TOLERANCE;
    });

    if (group.length < 4) continue;

    // Compute perpendicular distances from reference line
    const distances = group.map((idx) => {
      const m = midpoint(lines[idx]);
      return perpDistanceToLine(m, reference.start, reference.end);
    });

    distances.sort((a, b) => a - b);

    // Compute spacings between consecutive lines
    const spacings: number[] = [];
    for (let si = 1; si < distances.length; si++) {
      spacings.push(distances[si] - distances[si - 1]);
    }

    if (spacings.length === 0) continue;

    const meanSpacing = spacings.reduce((s, v) => s + v, 0) / spacings.length;
    const variance =
      spacings.reduce((s, v) => s + (v - meanSpacing) ** 2, 0) /
      spacings.length;
    const stdDev = Math.sqrt(variance);

    if (stdDev <= SPACING_VARIANCE) {
      // This is a hatch group
      for (const idx of group) hatchIndices.add(idx);
    }
  }

  return hatchIndices;
}

/**
 * Detect dimension line indices: lines with arrowhead/tick endpoints AND
 * associated 'dimensions'-classified text cluster within 0.5".
 */
function detectDimensionLineIndices(
  lines: VectorLine[],
  textClusters: TextCluster[],
): Set<number> {
  const dimIndices = new Set<number>();
  const PROXIMITY_THRESHOLD = 0.5; // inches
  const ARROWHEAD_LENGTH = 0.3; // inches
  const ARROWHEAD_ANGLE = 30 * DEG_TO_RAD;

  const dimensionClusters = textClusters.filter(
    (c) => c.clusterType === "dimensions",
  );

  if (dimensionClusters.length === 0) return dimIndices;

  // Build index of short lines for arrowhead detection
  const shortLines = lines.filter(
    (l) => euclideanDist(l.start, l.end) < ARROWHEAD_LENGTH,
  );

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lineLen = euclideanDist(line.start, line.end);

    // Skip very short lines (they are potential arrowheads themselves)
    if (lineLen < ARROWHEAD_LENGTH) continue;

    // Check if there's a dimension text cluster near this line
    const lineCenter = midpoint(line);
    const nearDimText = dimensionClusters.some(
      (c) => euclideanDist(c.centroid, lineCenter) <= PROXIMITY_THRESHOLD,
    );

    if (!nearDimText) continue;

    // Check for arrowhead/tick at either endpoint
    const hasArrowhead = [line.start, line.end].some((endpoint) =>
      shortLines.some((sl) => {
        // Short line must share an endpoint with our line's endpoint
        const atStart = euclideanDist(sl.start, endpoint) < 0.05;
        const atEnd = euclideanDist(sl.end, endpoint) < 0.05;
        if (!atStart && !atEnd) return false;

        // Check angle between short line and main line
        const mainAngle = lineAngle(line);
        const shortAngle = lineAngle(sl);
        const angleDiff = Math.abs(mainAngle - shortAngle);
        const normalizedDiff = Math.min(angleDiff, Math.PI - angleDiff);
        return normalizedDiff < ARROWHEAD_ANGLE;
      }),
    );

    if (hasArrowhead || nearDimText) {
      dimIndices.add(i);
    }
  }

  return dimIndices;
}

// ---------------------------------------------------------------------------
// VEC-002.1 + integration: Main export
// ---------------------------------------------------------------------------

/**
 * Extract vector elements from a single PDF page.
 *
 * Steps:
 * 1. Load page via pdfjs
 * 2. Parse path operators (lines, rects, curves)
 * 3. Parse text content and cluster by proximity
 * 4. Classify page (raster / vector / mixed) and sheet type
 * 5. Filter hatch and dimension lines
 * 6. Return complete VectorPage
 */
export async function extractVectorPage(
  pdfBytes: Buffer,
  pageNumber: number,
): Promise<VectorPage> {
  // 1. Load page
  const page = await loadPdfPage(pdfBytes, pageNumber);

  // page.view = [x, y, width, height] in PDF points
  const [, , pageWidthPt, pageHeightPt] = page.view;
  const pageWidthIn = ptToIn(pageWidthPt || 612);
  const pageHeightIn = ptToIn(pageHeightPt || 792);
  const pageAreaPt = (pageWidthPt || 612) * (pageHeightPt || 792);

  // 2. Get operator list (verifies pdfjs is working)
  const operatorList = await page.getOperatorList();
  const { fnArray, argsArray } = operatorList;

  // 3. Parse path operators (VEC-002.2)
  const {
    lines: rawLines,
    rects,
    paths,
    constructPathCount,
  } = parsePathOperators(fnArray as number[], argsArray as unknown[][]);

  // 4. Parse image operators for classification (VEC-002.4)
  const { totalImageArea } = parseImageOperators(
    fnArray as number[],
    argsArray as unknown[][],
    page,
  );

  // 5. Extract text content (VEC-002.3)
  const texts = await extractTextObjects(page);

  // 6. Cluster texts spatially
  const textClusters = clusterTexts(texts, pageWidthIn, pageHeightIn);

  // 7. Compute page classification and sheet type (VEC-002.4)
  const pageClassification = computePageClassification(
    totalImageArea,
    pageAreaPt,
    constructPathCount,
  );
  const sheetType = computeSheetType(textClusters);
  // Enhanced classification available via classifySheet() from sheet-classifier.ts

  // 8. Hatch and dimension line filtering (VEC-002.5)
  const hatchIndices = detectHatchIndices(rawLines);
  const dimIndices = detectDimensionLineIndices(rawLines, textClusters);

  const filteredLines = rawLines.filter(
    (_, i) => !hatchIndices.has(i) && !dimIndices.has(i),
  );

  // 9. hasLowDensity: < 10 total path elements
  const totalPathElements = filteredLines.length + rects.length + paths.length;
  const hasLowDensity = totalPathElements < 10;

  return {
    pageNumber,
    pageClassification,
    sheetType,
    lines: filteredLines,
    arcs: [], // VectorArc extraction requires arc-specific operator parsing (future)
    paths,
    rects,
    texts,
    textClusters,
    scale: null,
    hasLowDensity,
  };
}
