/**
 * V151: pole-of-inaccessibility label anchors.
 *
 * A polygon's area centroid (the old `polygonLabelPointV150`) can land outside
 * a concave shape — Vietnam's provinces bend around bays and highlands, so a
 * centroid label can sit in the sea or in a neighbouring unit. This module
 * ports Mapbox's polylabel algorithm (priority-queue grid subdivision with a
 * cell-distance upper bound) so a province label always anchors inside its
 * own polygon. No new npm dependency: the queue is a small binary heap.
 *
 * Reference: https://github.com/mapbox/polylabel (ISC licence, algorithm only
 * — no code copied verbatim; reimplemented against the published description).
 */

/** A ring is a list of [lon, lat] vertices; a polygon is [outerRing, ...holeRings]. */
type Ring = number[][];
type PolygonRings = Ring[];

interface Cell {
  /** cell center */
  x: number;
  y: number;
  /** half the cell size */
  h: number;
  /** signed distance from the cell center to the polygon outline (negative outside) */
  d: number;
  /** upper bound on the distance achievable anywhere inside this cell */
  max: number;
}

function makeCell(x: number, y: number, h: number, polygon: PolygonRings): Cell {
  const d = pointToPolygonDist(x, y, polygon);
  return { x, y, h, d, max: d + h * Math.SQRT2 };
}

/** Squared distance from point (px,py) to segment ab. */
function segDistSq(px: number, py: number, a: number[], b: number[]): number {
  let x = a[0];
  let y = a[1];
  let dx = b[0] - x;
  let dy = b[1] - y;
  if (dx !== 0 || dy !== 0) {
    const t = ((px - x) * dx + (py - y) * dy) / (dx * dx + dy * dy);
    if (t > 1) {
      x = b[0];
      y = b[1];
    } else if (t > 0) {
      x += dx * t;
      y += dy * t;
    }
  }
  dx = px - x;
  dy = py - y;
  return dx * dx + dy * dy;
}

/**
 * Signed distance from (x, y) to the polygon outline: negative outside,
 * positive inside. `polygon` is [outerRing, ...holeRings]; ray casting across
 * every ring correctly toggles inside/outside through holes.
 */
function pointToPolygonDist(x: number, y: number, polygon: PolygonRings): number {
  let inside = false;
  let minDistSq = Infinity;
  for (const ring of polygon) {
    const len = ring.length;
    for (let i = 0, j = len - 1; i < len; j = i++) {
      const a = ring[i];
      const b = ring[j];
      if (a[1] > y !== b[1] > y && x < ((b[0] - a[0]) * (y - a[1])) / (b[1] - a[1]) + a[0]) {
        inside = !inside;
      }
      minDistSq = Math.min(minDistSq, segDistSq(x, y, a, b));
    }
  }
  return (inside ? 1 : -1) * Math.sqrt(minDistSq);
}

/** Ray-casting point-in-polygon, holes included (see `pointToPolygonDist`). */
export function pointInPolygonV151(point: [number, number], polygon: number[][][]): boolean {
  const [x, y] = point;
  let inside = false;
  for (const ring of polygon) {
    const len = ring.length;
    for (let i = 0, j = len - 1; i < len; j = i++) {
      const a = ring[i];
      const b = ring[j];
      if (a[1] > y !== b[1] > y && x < ((b[0] - a[0]) * (y - a[1])) / (b[1] - a[1]) + a[0]) {
        inside = !inside;
      }
    }
  }
  return inside;
}

export function pointInGeometryV151(
  point: [number, number],
  geometry: { type: string; coordinates: unknown }
): boolean {
  if (geometry.type === "Polygon") {
    return pointInPolygonV151(point, geometry.coordinates as number[][][]);
  }
  if (geometry.type === "MultiPolygon") {
    const parts = geometry.coordinates as number[][][][];
    return parts.some((part) => pointInPolygonV151(point, part));
  }
  return false;
}

/** Signed area (shoelace, not absolute) of a ring; works closed or open. */
function shoelaceArea(ring: Ring): number {
  let area = 0;
  const len = ring.length;
  for (let i = 0, j = len - 1; i < len; j = i++) {
    const a = ring[i];
    const b = ring[j];
    area += a[0] * b[1] - b[0] * a[1];
  }
  return area / 2;
}

function centroidCell(polygon: PolygonRings): Cell {
  const points = polygon[0];
  let area = 0;
  let x = 0;
  let y = 0;
  const len = points.length;
  for (let i = 0, j = len - 1; i < len; j = i++) {
    const a = points[i];
    const b = points[j];
    const f = a[0] * b[1] - b[0] * a[1];
    x += (a[0] + b[0]) * f;
    y += (a[1] + b[1]) * f;
    area += f * 3;
  }
  if (area === 0) return makeCell(points[0][0], points[0][1], 0, polygon);
  return makeCell(x / area, y / area, 0, polygon);
}

/** Max-heap on `cell.max`, the upper bound used to prune the search. */
class CellQueue {
  private heap: Cell[] = [];

  get size(): number {
    return this.heap.length;
  }

  push(cell: Cell): void {
    this.heap.push(cell);
    this.bubbleUp(this.heap.length - 1);
  }

  pop(): Cell | undefined {
    const top = this.heap[0];
    const last = this.heap.pop();
    if (this.heap.length > 0 && last !== undefined) {
      this.heap[0] = last;
      this.bubbleDown(0);
    }
    return top;
  }

  private bubbleUp(startIndex: number): void {
    let index = startIndex;
    while (index > 0) {
      const parent = (index - 1) >> 1;
      if (this.heap[parent].max >= this.heap[index].max) break;
      this.swap(parent, index);
      index = parent;
    }
  }

  private bubbleDown(startIndex: number): void {
    let index = startIndex;
    const length = this.heap.length;
    for (;;) {
      const left = index * 2 + 1;
      const right = index * 2 + 2;
      let largest = index;
      if (left < length && this.heap[left].max > this.heap[largest].max) largest = left;
      if (right < length && this.heap[right].max > this.heap[largest].max) largest = right;
      if (largest === index) break;
      this.swap(largest, index);
      index = largest;
    }
  }

  private swap(a: number, b: number): void {
    const tmp = this.heap[a];
    this.heap[a] = this.heap[b];
    this.heap[b] = tmp;
  }
}

/**
 * Pole of inaccessibility: the point inside `polygon` farthest from any edge
 * (and from any hole edge). `polygon` is [outerRing, ...holeRings]; `precision`
 * is in the same units as the coordinates (degrees here) and bounds how close
 * the search gets before it stops subdividing — 0.005° is comfortably finer
 * than any label needs to be placed.
 */
export function polylabelV151(
  polygon: number[][][],
  precision = 0.005
): { point: [number, number]; distance: number } {
  const outer = polygon[0];
  if (!outer || outer.length < 3) return { point: [0, 0], distance: 0 };

  let minX = outer[0][0];
  let minY = outer[0][1];
  let maxX = outer[0][0];
  let maxY = outer[0][1];
  for (const p of outer) {
    if (p[0] < minX) minX = p[0];
    if (p[1] < minY) minY = p[1];
    if (p[0] > maxX) maxX = p[0];
    if (p[1] > maxY) maxY = p[1];
  }

  const width = maxX - minX;
  const height = maxY - minY;
  const cellSize = Math.min(width, height);
  if (cellSize === 0) return { point: [minX, minY], distance: 0 };

  let h = cellSize / 2;
  const queue = new CellQueue();
  for (let x = minX; x < maxX; x += cellSize) {
    for (let y = minY; y < maxY; y += cellSize) {
      queue.push(makeCell(x + h, y + h, h, polygon));
    }
  }

  let best = centroidCell(polygon);
  const bboxCell = makeCell(minX + width / 2, minY + height / 2, 0, polygon);
  if (bboxCell.d > best.d) best = bboxCell;

  while (queue.size > 0) {
    const cell = queue.pop();
    if (!cell) break;
    if (cell.d > best.d) best = cell;
    // No cell in this square can beat `best` by more than `precision` — stop.
    if (cell.max - best.d <= precision) continue;
    h = cell.h / 2;
    queue.push(makeCell(cell.x - h, cell.y - h, h, polygon));
    queue.push(makeCell(cell.x + h, cell.y - h, h, polygon));
    queue.push(makeCell(cell.x - h, cell.y + h, h, polygon));
    queue.push(makeCell(cell.x + h, cell.y + h, h, polygon));
  }

  return { point: [best.x, best.y], distance: best.d };
}

/**
 * Pole-of-inaccessibility anchor for a GeoJSON Polygon/MultiPolygon geometry.
 * For a MultiPolygon, the part with the largest planar (shoelace) outer-ring
 * area is used — the same "biggest piece wins" rule the old area-centroid
 * helper used, just with a polylabel anchor instead of a centroid.
 */
export function polygonLabelAnchorV151(geometry: {
  type: string;
  coordinates: unknown;
}): [number, number] | null {
  let rings: PolygonRings | null = null;
  if (geometry.type === "Polygon") {
    rings = geometry.coordinates as PolygonRings;
  } else if (geometry.type === "MultiPolygon") {
    const parts = geometry.coordinates as PolygonRings[];
    let best: { area: number; rings: PolygonRings } | null = null;
    for (const part of parts) {
      const outer = part[0];
      if (!outer || outer.length < 3) continue;
      const area = Math.abs(shoelaceArea(outer));
      if (!best || area > best.area) best = { area, rings: part };
    }
    rings = best?.rings ?? null;
  }
  if (!rings || !rings[0] || rings[0].length < 3) return null;
  return polylabelV151(rings).point;
}
