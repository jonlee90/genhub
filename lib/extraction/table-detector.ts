import type { VectorPage, VectorLine, Rect } from "./types";

export interface TableRegion {
  bounds: Rect;
  rows: number;
  cols: number;
  confidence: number;
}

/**
 * Detect table/grid regions on a VectorPage by finding
 * intersecting horizontal and vertical lines.
 */
export function detectTableRegions(page: VectorPage): TableRegion[] {
  const HORIZONTAL_TOLERANCE = 0.05; // inches
  const VERTICAL_TOLERANCE = 0.05;

  // Find horizontal lines (nearly flat)
  const hLines = page.lines.filter(
    (l) => Math.abs(l.start.y - l.end.y) < HORIZONTAL_TOLERANCE,
  );

  // Find vertical lines (nearly vertical)
  const vLines = page.lines.filter(
    (l) => Math.abs(l.start.x - l.end.x) < VERTICAL_TOLERANCE,
  );

  if (hLines.length < 3 || vLines.length < 2) return [];

  // Group horizontal lines by y-coordinate (within tolerance)
  const hGroups = groupLinesByCoordinate(hLines, "y", 0.15);

  // Group vertical lines by x-coordinate
  const vGroups = groupLinesByCoordinate(vLines, "x", 0.15);

  // A table needs at least 3 horizontal rows and 2 vertical columns
  if (hGroups.length < 3 || vGroups.length < 2) return [];

  // Compute bounding box of the grid
  const allHY = hGroups.map((g) => g.coordinate);
  const allVX = vGroups.map((g) => g.coordinate);

  const bounds: Rect = {
    x: Math.min(...allVX),
    y: Math.min(...allHY),
    width: Math.max(...allVX) - Math.min(...allVX),
    height: Math.max(...allHY) - Math.min(...allHY),
  };

  // Confidence based on grid regularity
  const confidence = Math.min(
    hGroups.length / 5, // More rows = higher confidence
    vGroups.length / 3,
    1.0,
  );

  return [
    {
      bounds,
      rows: hGroups.length - 1,
      cols: vGroups.length - 1,
      confidence,
    },
  ];
}

interface LineGroup {
  coordinate: number;
  lines: VectorLine[];
}

function groupLinesByCoordinate(
  lines: VectorLine[],
  axis: "x" | "y",
  tolerance: number,
): LineGroup[] {
  const groups: LineGroup[] = [];

  const sorted = [...lines].sort((a, b) => {
    const aVal =
      axis === "y" ? (a.start.y + a.end.y) / 2 : (a.start.x + a.end.x) / 2;
    const bVal =
      axis === "y" ? (b.start.y + b.end.y) / 2 : (b.start.x + b.end.x) / 2;
    return aVal - bVal;
  });

  for (const line of sorted) {
    const coord =
      axis === "y"
        ? (line.start.y + line.end.y) / 2
        : (line.start.x + line.end.x) / 2;

    const existing = groups.find(
      (g) => Math.abs(g.coordinate - coord) < tolerance,
    );

    if (existing) {
      existing.lines.push(line);
      // Update coordinate to average
      existing.coordinate =
        existing.lines.reduce((sum, l) => {
          const val =
            axis === "y"
              ? (l.start.y + l.end.y) / 2
              : (l.start.x + l.end.x) / 2;
          return sum + val;
        }, 0) / existing.lines.length;
    } else {
      groups.push({ coordinate: coord, lines: [line] });
    }
  }

  return groups;
}

/**
 * Check if a VectorPage likely contains a schedule/table.
 * Quick heuristic for use in classification.
 */
export function hasSignificantTable(page: VectorPage): boolean {
  const tables = detectTableRegions(page);
  return tables.some((t) => t.rows >= 3 && t.cols >= 2 && t.confidence >= 0.5);
}
