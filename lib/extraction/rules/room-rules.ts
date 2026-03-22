/**
 * Room Detection Rules (VEC-009)
 *
 * Detects room polygons from a VectorPage using wall graph analysis:
 *   VEC-009.1: Wall graph + planar cycle detection
 *   VEC-009.2: Room name assignment and classification
 *   VEC-009.3: Area, perimeter, and element association
 *
 * Coordinate convention:
 *   - VectorPage coordinates are in drawing-space inches (PDF points / 72).
 *   - To obtain real-world dimensions, multiply by ScaleInfo.factor.
 *   - Positions are kept in drawing-space inches throughout.
 */

import type {
  VectorPage,
  RoomPolygon,
  WallSegment,
  DoorElement,
  WindowElement,
  ScaleInfo,
  Point,
} from "../types";
import type { WallSegmentWithIntersections } from "./wall-rules";

// ---------------------------------------------------------------------------
// Geometry helpers
// ---------------------------------------------------------------------------

function dist(a: Point, b: Point): number {
  return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
}

/**
 * Compute the minimum distance from point p to the line segment a→b.
 */
function pointToSegmentDistance(p: Point, a: Point, b: Point): number {
  const ab = { x: b.x - a.x, y: b.y - a.y };
  const ap = { x: p.x - a.x, y: p.y - a.y };
  const lenSq = ab.x ** 2 + ab.y ** 2;
  if (lenSq < 1e-12) return dist(p, a);
  const t = Math.max(0, Math.min(1, (ap.x * ab.x + ap.y * ab.y) / lenSq));
  const closest = { x: a.x + t * ab.x, y: a.y + t * ab.y };
  return dist(p, closest);
}

/**
 * Ray-casting point-in-polygon test.
 */
function pointInPolygon(point: Point, polygon: Point[]): boolean {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i].x;
    const yi = polygon[i].y;
    const xj = polygon[j].x;
    const yj = polygon[j].y;
    if (
      yi > point.y !== yj > point.y &&
      point.x < ((xj - xi) * (point.y - yi)) / (yj - yi) + xi
    ) {
      inside = !inside;
    }
  }
  return inside;
}

/**
 * Shoelace formula for signed polygon area (drawing-space sq inches).
 */
function signedPolygonArea(polygon: Point[]): number {
  let area = 0;
  for (let i = 0; i < polygon.length; i++) {
    const next = polygon[(i + 1) % polygon.length];
    area += polygon[i].x * next.y - next.x * polygon[i].y;
  }
  return area / 2;
}

function polygonArea(polygon: Point[]): number {
  return Math.abs(signedPolygonArea(polygon));
}

/**
 * Polygon perimeter in drawing-space inches.
 */
function polygonPerimeter(polygon: Point[]): number {
  let perimeter = 0;
  for (let i = 0; i < polygon.length; i++) {
    const next = polygon[(i + 1) % polygon.length];
    perimeter += dist(polygon[i], next);
  }
  return perimeter;
}

/**
 * Bounding box of a polygon.
 */
function polygonBounds(polygon: Point[]): {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
} {
  let minX = Infinity,
    minY = Infinity,
    maxX = -Infinity,
    maxY = -Infinity;
  for (const p of polygon) {
    if (p.x < minX) minX = p.x;
    if (p.y < minY) minY = p.y;
    if (p.x > maxX) maxX = p.x;
    if (p.y > maxY) maxY = p.y;
  }
  return { minX, minY, maxX, maxY };
}

/**
 * Check if two bounding boxes overlap.
 */
function boundsOverlap(
  a: { minX: number; minY: number; maxX: number; maxY: number },
  b: { minX: number; minY: number; maxX: number; maxY: number },
): boolean {
  return (
    a.minX <= b.maxX && a.maxX >= b.minX && a.minY <= b.maxY && a.maxY >= b.minY
  );
}

// ---------------------------------------------------------------------------
// VEC-009.1: Wall graph construction
// ---------------------------------------------------------------------------

interface GraphNode {
  id: string;
  point: Point;
}

interface GraphEdge {
  nodeA: string;
  nodeB: string;
  wallId: string;
}

/**
 * Snap tolerance in drawing-space inches (2" real / scaleFactor).
 */
const SNAP_TOL_REAL = 2; // real-world inches

/**
 * Find or create a node for the given point, snapping to existing nodes
 * within the snap tolerance.
 */
function findOrCreateNode(
  point: Point,
  nodes: GraphNode[],
  snapTol: number,
): string {
  for (const node of nodes) {
    if (dist(node.point, point) <= snapTol) {
      return node.id;
    }
  }
  const id = `node_${nodes.length}_${point.x.toFixed(2)}_${point.y.toFixed(2)}`;
  nodes.push({ id, point });
  return id;
}

/**
 * Compute pairwise segment intersections between walls.
 * Returns a list of { wallIdA, wallIdB, point }.
 */
function computePairwiseIntersections(
  walls: WallSegment[],
): Array<{ wallIdA: string; wallIdB: string; point: Point }> {
  const results: Array<{ wallIdA: string; wallIdB: string; point: Point }> = [];

  for (let i = 0; i < walls.length; i++) {
    for (let j = i + 1; j < walls.length; j++) {
      const a = walls[i];
      const b = walls[j];

      const dx1 = a.end.x - a.start.x;
      const dy1 = a.end.y - a.start.y;
      const dx2 = b.end.x - b.start.x;
      const dy2 = b.end.y - b.start.y;

      const denom = dx1 * dy2 - dy1 * dx2;
      if (Math.abs(denom) < 1e-9) continue;

      const t =
        ((b.start.x - a.start.x) * dy2 - (b.start.y - a.start.y) * dx2) / denom;
      const u =
        ((b.start.x - a.start.x) * dy1 - (b.start.y - a.start.y) * dx1) / denom;

      if (t < -0.01 || t > 1.01 || u < -0.01 || u > 1.01) continue;

      const tClamped = Math.max(0, Math.min(1, t));
      const point: Point = {
        x: a.start.x + tClamped * dx1,
        y: a.start.y + tClamped * dy1,
      };

      results.push({ wallIdA: a.id, wallIdB: b.id, point });
    }
  }

  return results;
}

/**
 * Build a wall graph from wall segments.
 *
 * Nodes are wall endpoints and intersection points (snapped to 2" tolerance).
 * Edges connect adjacent nodes along each wall.
 */
function buildWallGraph(
  walls: WallSegment[],
  scaleFactor: number,
): {
  nodes: GraphNode[];
  edges: GraphEdge[];
  adjacency: Map<string, Array<{ nodeId: string; wallId: string }>>;
} {
  const nodes: GraphNode[] = [];
  const edges: GraphEdge[] = [];
  const snapTol = SNAP_TOL_REAL / scaleFactor;

  // Collect all critical points per wall: start, end, and intersection points
  const wallPoints = new Map<string, Point[]>();
  for (const wall of walls) {
    wallPoints.set(wall.id, [wall.start, wall.end]);
  }

  // Check if walls have intersection metadata (WallSegmentWithIntersections)
  const hasIntersections = walls.length > 0 && "intersections" in walls[0];

  if (hasIntersections) {
    // Use pre-computed intersections
    for (const wall of walls) {
      const wi = wall as unknown as WallSegmentWithIntersections;
      const pts = wallPoints.get(wall.id) ?? [wall.start, wall.end];
      for (const isect of wi.intersections) {
        pts.push(isect.point);
      }
      wallPoints.set(wall.id, pts);
    }
  } else {
    // Compute pairwise intersections
    const intersections = computePairwiseIntersections(walls);
    for (const isect of intersections) {
      const ptsA = wallPoints.get(isect.wallIdA) ?? [];
      const ptsB = wallPoints.get(isect.wallIdB) ?? [];
      ptsA.push(isect.point);
      ptsB.push(isect.point);
      wallPoints.set(isect.wallIdA, ptsA);
      wallPoints.set(isect.wallIdB, ptsB);
    }
  }

  // For each wall, sort its points along the wall direction and create edges
  for (const wall of walls) {
    const pts = wallPoints.get(wall.id) ?? [wall.start, wall.end];

    // Sort points along wall direction
    const dx = wall.end.x - wall.start.x;
    const dy = wall.end.y - wall.start.y;
    const sorted = [...pts].sort((a, b) => {
      const ta = (a.x - wall.start.x) * dx + (a.y - wall.start.y) * dy;
      const tb = (b.x - wall.start.x) * dx + (b.y - wall.start.y) * dy;
      return ta - tb;
    });

    // Deduplicate snapped points
    const deduped: Point[] = [];
    for (const pt of sorted) {
      if (
        deduped.length === 0 ||
        dist(deduped[deduped.length - 1], pt) > snapTol
      ) {
        deduped.push(pt);
      }
    }

    // Create nodes and edges for consecutive point pairs
    for (let i = 0; i < deduped.length - 1; i++) {
      const nodeA = findOrCreateNode(deduped[i], nodes, snapTol);
      const nodeB = findOrCreateNode(deduped[i + 1], nodes, snapTol);
      if (nodeA !== nodeB) {
        edges.push({ nodeA, nodeB, wallId: wall.id });
      }
    }
  }

  // Build adjacency list
  const adjacency = new Map<
    string,
    Array<{ nodeId: string; wallId: string }>
  >();
  for (const node of nodes) {
    adjacency.set(node.id, []);
  }
  for (const edge of edges) {
    const listA = adjacency.get(edge.nodeA) ?? [];
    const listB = adjacency.get(edge.nodeB) ?? [];
    listA.push({ nodeId: edge.nodeB, wallId: edge.wallId });
    listB.push({ nodeId: edge.nodeA, wallId: edge.wallId });
    adjacency.set(edge.nodeA, listA);
    adjacency.set(edge.nodeB, listB);
  }

  return { nodes, edges, adjacency };
}

// ---------------------------------------------------------------------------
// VEC-009.1: Minimal cycle detection
// ---------------------------------------------------------------------------

/**
 * Angle from node `from` to node `to` in radians [0, 2π).
 */
function edgeAngle(from: Point, to: Point): number {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  let angle = Math.atan2(dy, dx);
  if (angle < 0) angle += 2 * Math.PI;
  return angle;
}

/**
 * Canonical form of a cycle: rotate to lowest-id node, then choose
 * the direction (forward or reverse) that gives the lexicographically smaller sequence.
 */
function canonicalizeCycle(nodeIds: string[]): string {
  if (nodeIds.length === 0) return "";

  const sorted = [...nodeIds];
  sorted.sort();
  const minId = sorted[0];
  const minIdx = nodeIds.indexOf(minId);

  // Rotate to start at minId
  const rotated = [...nodeIds.slice(minIdx), ...nodeIds.slice(0, minIdx)];

  // Compare forward vs reverse
  const reversed = [rotated[0], ...rotated.slice(1).reverse()];
  const fwdKey = rotated.join(",");
  const revKey = reversed.join(",");

  return fwdKey < revKey ? fwdKey : revKey;
}

/**
 * Find minimal cycles using directed planar face traversal.
 *
 * For each directed edge u→v, follow the "next clockwise" edge from v
 * (i.e., the edge that turns most to the right from the incoming direction).
 * This traces out the minimal faces of the planar graph.
 */
function findMinimalCycles(
  nodes: GraphNode[],
  edges: GraphEdge[],
  adjacency: Map<string, Array<{ nodeId: string; wallId: string }>>,
): Array<{ nodeIds: string[]; wallIds: string[] }> {
  // Build node lookup
  const nodeMap = new Map<string, GraphNode>();
  for (const node of nodes) {
    nodeMap.set(node.id, node);
  }

  // Build directed edge set with tracking
  const visitedDirected = new Set<string>();
  const cycles: Array<{ nodeIds: string[]; wallIds: string[] }> = [];

  // For each directed edge u→v, find the face to the left
  for (const edge of edges) {
    for (const [startId, endId] of [
      [edge.nodeA, edge.nodeB],
      [edge.nodeB, edge.nodeA],
    ]) {
      const dirKey = `${startId}->${endId}`;
      if (visitedDirected.has(dirKey)) continue;

      // Trace the face
      const cycleNodeIds: string[] = [];
      const cycleWallIds: string[] = [];
      let curFrom = startId;
      let curTo = endId;
      let curWallId = edge.wallId;
      let steps = 0;
      const maxSteps = nodes.length + 2;

      while (steps < maxSteps) {
        const stepKey = `${curFrom}->${curTo}`;
        if (cycleNodeIds.length > 0 && curTo === startId) {
          // Completed the cycle
          cycleNodeIds.push(curTo);
          cycleWallIds.push(curWallId);
          break;
        }
        if (cycleNodeIds.includes(curTo) && curTo !== startId) {
          // Hit a previously visited node that isn't the start — not a simple cycle
          break;
        }

        cycleNodeIds.push(curFrom);
        cycleWallIds.push(curWallId);
        visitedDirected.add(stepKey);

        // Find next edge: from curTo, pick the edge that turns most clockwise
        // relative to the incoming direction (curFrom → curTo)
        const fromNode = nodeMap.get(curFrom);
        const toNode = nodeMap.get(curTo);
        if (!fromNode || !toNode) break;

        const incomingAngle = edgeAngle(fromNode.point, toNode.point);
        // "Next clockwise" = minimize the left turn, i.e., pick the outgoing edge
        // with the smallest angle difference going clockwise from (incomingAngle + π)
        const neighbors = adjacency.get(curTo) ?? [];
        const outgoing = neighbors.filter((n) => n.nodeId !== curFrom);

        if (outgoing.length === 0) break;

        const reverseAngle = (incomingAngle + Math.PI) % (2 * Math.PI);

        let bestNeighbor: { nodeId: string; wallId: string } | null = null;
        let bestAngleDiff = Infinity;

        for (const neighbor of outgoing) {
          const neighborNode = nodeMap.get(neighbor.nodeId);
          if (!neighborNode) continue;
          const outAngle = edgeAngle(toNode.point, neighborNode.point);
          // Clockwise angle difference from reverse direction
          let diff = reverseAngle - outAngle;
          if (diff < 0) diff += 2 * Math.PI;
          if (diff < bestAngleDiff) {
            bestAngleDiff = diff;
            bestNeighbor = neighbor;
          }
        }

        if (!bestNeighbor) break;

        curFrom = curTo;
        curTo = bestNeighbor.nodeId;
        curWallId = bestNeighbor.wallId;
        steps++;
      }

      // Valid cycle: closed, at least 3 unique nodes
      if (
        cycleNodeIds.length >= 3 &&
        cycleNodeIds[cycleNodeIds.length - 1] === startId
      ) {
        // Remove the closing duplicate
        const finalNodeIds = cycleNodeIds.slice(0, -1);
        const finalWallIds = cycleWallIds.slice(0, -1);
        cycles.push({ nodeIds: finalNodeIds, wallIds: finalWallIds });
      }
    }
  }

  // Deduplicate cycles by canonical form
  const seen = new Set<string>();
  const unique: Array<{ nodeIds: string[]; wallIds: string[] }> = [];
  for (const cycle of cycles) {
    const key = canonicalizeCycle(cycle.nodeIds);
    if (!seen.has(key)) {
      seen.add(key);
      unique.push(cycle);
    }
  }

  return unique;
}

// ---------------------------------------------------------------------------
// VEC-009.1: Area filtering and outer boundary removal
// ---------------------------------------------------------------------------

const MIN_AREA_SQFT = 20;
const MAX_AREA_SQFT = 50000;

/**
 * Convert a cycle of node IDs to a polygon of Points.
 */
function cycleToPolygon(
  nodeIds: string[],
  nodeMap: Map<string, GraphNode>,
): Point[] {
  return nodeIds
    .map((id) => nodeMap.get(id)?.point ?? null)
    .filter((p): p is Point => p !== null);
}

/**
 * Check for open polygon: polygon boundary has gap > 24" real between
 * consecutive vertices not connected by a wall edge.
 */
function hasOpenPolygon(
  polygon: Point[],
  wallIds: string[],
  scaleFactor: number,
): boolean {
  const MIN_DOOR_WIDTH_REAL = 24;
  const minDoorWidthDrawing = MIN_DOOR_WIDTH_REAL / scaleFactor;

  for (let i = 0; i < polygon.length; i++) {
    const a = polygon[i];
    const b = polygon[(i + 1) % polygon.length];
    const segDist = dist(a, b);

    // If a wall covers this segment (wallIds has one per edge), it's connected.
    // If the segment is large but not covered, it's a gap.
    const wallId = wallIds[i];
    if (!wallId && segDist > minDoorWidthDrawing) {
      return true;
    }
  }
  return false;
}

// ---------------------------------------------------------------------------
// VEC-009.2: Room classification
// ---------------------------------------------------------------------------

const CLASSIFICATION_MAP: Array<{
  patterns: string[];
  classification: string;
}> = [
  {
    patterns: ["BR", "BEDROOM", "BED RM", "BED ROOM"],
    classification: "bedroom",
  },
  {
    patterns: ["KIT", "KITCHEN"],
    classification: "kitchen",
  },
  {
    patterns: [
      "LR",
      "LIVING",
      "GREAT RM",
      "GREAT ROOM",
      "FAMILY RM",
      "FAMILY ROOM",
    ],
    classification: "living_room",
  },
  {
    patterns: ["BA", "BATH", "BATHROOM", "LAV", "LAVATORY", "POWDER"],
    classification: "bathroom",
  },
  {
    patterns: ["MECH", "MECHANICAL", "BOILER", "UTILITY", "EQUIP"],
    classification: "mechanical",
  },
  {
    patterns: ["STOR", "STORAGE", "CLOSET", "CL"],
    classification: "storage",
  },
  {
    patterns: ["GAR", "GARAGE"],
    classification: "garage",
  },
  {
    patterns: ["OFFICE", "CONF", "CONFERENCE", "WORK ROOM"],
    classification: "office",
  },
  {
    patterns: ["LAU", "LAUNDRY", "WASH"],
    classification: "laundry",
  },
  {
    patterns: ["HALL", "CORRIDOR", "FOYER", "ENTRY", "VESTIBULE"],
    classification: "circulation",
  },
];

/**
 * Classify a room name into a semantic category.
 */
function classifyRoom(name: string): string {
  const upper = name.toUpperCase();
  for (const { patterns, classification } of CLASSIFICATION_MAP) {
    for (const pattern of patterns) {
      if (upper.includes(pattern)) {
        return classification;
      }
    }
  }
  return "unclassified";
}

// ---------------------------------------------------------------------------
// VEC-009.2: Text → room assignment
// ---------------------------------------------------------------------------

/**
 * Assign room names from textClusters using ray-casting point-in-polygon.
 */
function assignRoomNames(
  rooms: Array<{
    polygon: Point[];
    reviewFlags: string[];
    needsReview: boolean;
    name: string;
    classification: string;
  }>,
  page: VectorPage,
): void {
  const unassignedTextPositions: Point[] = [];

  for (const cluster of page.textClusters) {
    if (cluster.clusterType !== "roomNames") continue;
    if (cluster.texts.length === 0) continue;

    const centroid = cluster.centroid;
    const textContent = cluster.texts[0].content.trim();

    let assigned = false;
    for (const room of rooms) {
      if (pointInPolygon(centroid, room.polygon)) {
        room.name = textContent;
        room.classification = classifyRoom(textContent);
        assigned = true;
        break;
      }
    }

    if (!assigned) {
      unassignedTextPositions.push(centroid);
    }
  }

  // Also check raw texts for room-name-like content not in clusters
  for (const textObj of page.texts) {
    const content = textObj.content.trim();
    if (content.length === 0) continue;

    // Only consider multi-char uppercase-ish text as potential room names
    if (content.length < 2) continue;

    let assigned = false;
    for (const room of rooms) {
      if (room.name !== "Unknown") continue; // Already assigned
      if (pointInPolygon(textObj.position, room.polygon)) {
        room.name = content;
        room.classification = classifyRoom(content);
        assigned = true;
        break;
      }
    }

    if (!assigned) {
      unassignedTextPositions.push(textObj.position);
    }
  }

  void unassignedTextPositions;
}

// ---------------------------------------------------------------------------
// VEC-009.3: Element association
// ---------------------------------------------------------------------------

/**
 * Check if a point is within `toleranceDrawing` of any polygon boundary segment.
 */
function isNearPolygonBoundary(
  point: Point,
  polygon: Point[],
  toleranceDrawing: number,
): boolean {
  for (let i = 0; i < polygon.length; i++) {
    const a = polygon[i];
    const b = polygon[(i + 1) % polygon.length];
    if (pointToSegmentDistance(point, a, b) <= toleranceDrawing) {
      return true;
    }
  }
  return false;
}

// ---------------------------------------------------------------------------
// VEC-009: Main export
// ---------------------------------------------------------------------------

/**
 * Detect room polygons from a VectorPage using VEC-009 rules.
 *
 * Returns RoomPolygon[] with polygon coordinates in drawing-space inches,
 * area in sqft, and perimeter in feet.
 */
export function detectRooms(
  page: VectorPage,
  walls: WallSegment[],
  doors: DoorElement[],
  windows: WindowElement[],
  scale: ScaleInfo,
): RoomPolygon[] {
  const f = scale.factor;

  if (walls.length === 0) return [];

  // VEC-009.1: Build wall graph
  const { nodes, edges, adjacency } = buildWallGraph(walls, f);

  if (nodes.length < 3 || edges.length < 3) return [];

  // Find minimal cycles (planar face enumeration)
  const cycles = findMinimalCycles(nodes, edges, adjacency);

  // Build node map for polygon construction
  const nodeMap = new Map<string, GraphNode>();
  for (const node of nodes) {
    nodeMap.set(node.id, node);
  }

  // Filter cycles by area
  const MIN_AREA_DRAWING_SQ = (MIN_AREA_SQFT * 144) / (f * f); // sqft → drawing-space sq inches
  const MAX_AREA_DRAWING_SQ = (MAX_AREA_SQFT * 144) / (f * f);

  interface CycleCandidate {
    polygon: Point[];
    wallIds: string[];
    area: number;
    nodeIds: string[];
  }

  const candidates: CycleCandidate[] = [];

  for (const cycle of cycles) {
    const polygon = cycleToPolygon(cycle.nodeIds, nodeMap);
    if (polygon.length < 3) continue;

    const area = polygonArea(polygon);
    if (area < MIN_AREA_DRAWING_SQ || area > MAX_AREA_DRAWING_SQ) continue;

    candidates.push({
      polygon,
      wallIds: cycle.wallIds,
      area,
      nodeIds: cycle.nodeIds,
    });
  }

  if (candidates.length === 0) return [];

  // Identify and remove outer boundary (largest area cycle)
  const maxArea = Math.max(...candidates.map((c) => c.area));
  const interior = candidates.filter((c) => c.area < maxArea);

  // Build rooms
  const roomCandidates = interior.map((c) => ({
    polygon: c.polygon,
    wallIds: c.wallIds,
    area: c.area,
    nodeIds: c.nodeIds,
    name: "Unknown",
    classification: "unclassified",
    reviewFlags: [] as string[],
    needsReview: false,
  }));

  // Check for open polygons
  const snapTol = SNAP_TOL_REAL / f;
  for (const room of roomCandidates) {
    if (hasOpenPolygon(room.polygon, room.wallIds, f)) {
      room.needsReview = true;
      if (!room.reviewFlags.includes("open_polygon")) {
        room.reviewFlags.push("open_polygon");
      }
    }
  }

  // VEC-009.2: Assign room names
  assignRoomNames(roomCandidates, page);

  // Flag rooms that still have no text (no room name found)
  for (const room of roomCandidates) {
    if (room.name === "Unknown") {
      // Check if any text cluster centroid is outside all room boundaries
      // This flag goes on rooms that couldn't be matched
      room.reviewFlags.push("text_outside_room_boundaries");
      room.needsReview = true;
    }
  }

  // Also flag text clusters that fall outside all room polygons
  const allPolygons = roomCandidates.map((r) => r.polygon);
  for (const cluster of page.textClusters) {
    if (cluster.clusterType !== "roomNames") continue;
    const centroid = cluster.centroid;
    const insideAny = allPolygons.some((poly) =>
      pointInPolygon(centroid, poly),
    );
    if (!insideAny) {
      // Find nearest room and add flag
      let nearest: (typeof roomCandidates)[number] | null = null;
      let nearestDist = Infinity;
      const polyBounds = roomCandidates.map((r) => polygonBounds(r.polygon));
      for (let i = 0; i < roomCandidates.length; i++) {
        const room = roomCandidates[i];
        const b = polyBounds[i];
        const bCentroid = {
          x: (b.minX + b.maxX) / 2,
          y: (b.minY + b.maxY) / 2,
        };
        const d = dist(centroid, bCentroid);
        if (d < nearestDist) {
          nearestDist = d;
          nearest = room;
        }
      }
      if (
        nearest &&
        !nearest.reviewFlags.includes("text_outside_room_boundaries")
      ) {
        nearest.reviewFlags.push("text_outside_room_boundaries");
        nearest.needsReview = true;
      }
    }
  }

  // VEC-009.3: Compute area/perimeter and associate elements
  const DOOR_PROXIMITY_DRAWING = 3 / f; // 3" real → drawing-space
  const WINDOW_PROXIMITY_DRAWING = 3 / f;

  const rooms: RoomPolygon[] = roomCandidates.map((room) => {
    // Area (sqft)
    const areaDrawingSqIn = polygonArea(room.polygon);
    const areaSqft = (areaDrawingSqIn * f * f) / 144;

    // Perimeter (feet)
    const perimeterDrawingIn = polygonPerimeter(room.polygon);
    const perimeterFt = (perimeterDrawingIn * f) / 12;

    // Associate doors
    const doorIds: string[] = [];
    for (const door of doors) {
      if (
        isNearPolygonBoundary(
          door.position,
          room.polygon,
          DOOR_PROXIMITY_DRAWING,
        )
      ) {
        doorIds.push(door.id);
      }
    }

    // Associate windows
    const windowIds: string[] = [];
    for (const win of windows) {
      if (
        isNearPolygonBoundary(
          win.position,
          room.polygon,
          WINDOW_PROXIMITY_DRAWING,
        )
      ) {
        windowIds.push(win.id);
      }
    }

    // Associate walls: walls whose centerline is near the polygon boundary
    const wallIds: string[] = [];
    for (const wall of walls) {
      const wallMid: Point = {
        x: (wall.start.x + wall.end.x) / 2,
        y: (wall.start.y + wall.end.y) / 2,
      };
      if (isNearPolygonBoundary(wallMid, room.polygon, snapTol)) {
        wallIds.push(wall.id);
      }
    }

    return {
      id: crypto.randomUUID(),
      name: room.name,
      classification: room.classification,
      polygon: room.polygon,
      areaSqft,
      perimeterFt,
      wallIds,
      doorIds,
      windowIds,
      confidenceScore: 70,
      needsReview: room.needsReview,
      reviewFlags: room.reviewFlags,
    };
  });

  // Suppress unused-variable warning for boundsOverlap (used below in an optional
  // polygon intersection check approximation, kept for future use)
  void boundsOverlap;

  return rooms;
}
