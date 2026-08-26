import type { Country } from "../types/country";
import type {
  WorldCountryBoundaryCollection,
  WorldCountryBoundaryFeature,
} from "../data/map/worldCountryBoundaries";

export type CountryMapAnchorSource =
  | "boundary-representative-point"
  | "country-coordinate-fallback";

export interface CountryMapAnchor {
  coordinates: [number, number];
  source: CountryMapAnchorSource;
}

type Position = [number, number];
type Ring = Position[];
type PolygonCoordinates = Ring[];

function isPosition(value: unknown): value is Position {
  return (
    Array.isArray(value) &&
    value.length >= 2 &&
    typeof value[0] === "number" &&
    Number.isFinite(value[0]) &&
    typeof value[1] === "number" &&
    Number.isFinite(value[1])
  );
}

function isRing(value: unknown): value is Ring {
  return Array.isArray(value) && value.length >= 4 && value.every(isPosition);
}

function isPolygonCoordinates(value: unknown): value is PolygonCoordinates {
  return Array.isArray(value) && value.length > 0 && value.every(isRing);
}

function extractPolygons(
  feature: WorldCountryBoundaryFeature
): PolygonCoordinates[] {
  const coordinates = feature.geometry.coordinates;
  if (feature.geometry.type === "Polygon") {
    return isPolygonCoordinates(coordinates) ? [coordinates] : [];
  }
  if (!Array.isArray(coordinates)) return [];
  return coordinates.filter(isPolygonCoordinates);
}

function wrapLongitude(longitude: number): number {
  let value = longitude;
  while (value > 180) value -= 360;
  while (value < -180) value += 360;
  return value;
}

function unwrapRing(ring: Ring): Ring {
  if (!ring.length) return [];
  const unwrapped: Ring = [[ring[0][0], ring[0][1]]];
  for (let index = 1; index < ring.length; index += 1) {
    const previous = unwrapped[index - 1][0];
    let longitude = ring[index][0];
    while (longitude - previous > 180) longitude -= 360;
    while (longitude - previous < -180) longitude += 360;
    unwrapped.push([longitude, ring[index][1]]);
  }
  return unwrapped;
}

function unwrapPosition(
  position: Position,
  referenceLongitude: number
): Position {
  let longitude = position[0];
  while (longitude - referenceLongitude > 180) longitude -= 360;
  while (longitude - referenceLongitude < -180) longitude += 360;
  return [longitude, position[1]];
}

function ringSignedArea(ring: Ring): number {
  if (ring.length < 3) return 0;
  let area2 = 0;
  for (let index = 0; index < ring.length - 1; index += 1) {
    const [x1, y1] = ring[index];
    const [x2, y2] = ring[index + 1];
    area2 += x1 * y2 - x2 * y1;
  }
  return area2 / 2;
}

function polygonAreaEstimate(polygon: PolygonCoordinates): number {
  const outer = unwrapRing(polygon[0]);
  return Math.abs(ringSignedArea(outer));
}

function ringCentroid(ring: Ring): Position | null {
  if (ring.length < 3) return null;
  let area2 = 0;
  let cx6a = 0;
  let cy6a = 0;

  for (let index = 0; index < ring.length - 1; index += 1) {
    const [x1, y1] = ring[index];
    const [x2, y2] = ring[index + 1];
    const cross = x1 * y2 - x2 * y1;
    area2 += cross;
    cx6a += (x1 + x2) * cross;
    cy6a += (y1 + y2) * cross;
  }

  if (Math.abs(area2) < 1e-12) return null;
  return [cx6a / (3 * area2), cy6a / (3 * area2)];
}

function pointInRing(point: Position, ring: Ring): boolean {
  const [x, y] = point;
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i, i += 1) {
    const [xi, yi] = ring[i];
    const [xj, yj] = ring[j];
    const intersects =
      yi > y !== yj > y &&
      x < ((xj - xi) * (y - yi)) / (yj - yi || Number.EPSILON) + xi;
    if (intersects) inside = !inside;
  }
  return inside;
}

function pointInPolygon(point: Position, polygon: PolygonCoordinates): boolean {
  const outer = unwrapRing(polygon[0]);
  if (!outer.length) return false;
  const referenceLongitude = outer[0][0];
  const candidate = unwrapPosition(point, referenceLongitude);
  if (!pointInRing(candidate, outer)) return false;

  for (let index = 1; index < polygon.length; index += 1) {
    const hole = unwrapRing(polygon[index]);
    if (hole.length && pointInRing(candidate, hole)) return false;
  }
  return true;
}

function polygonBounds(ring: Ring): [number, number, number, number] | null {
  if (!ring.length) return null;
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  ring.forEach(([x, y]) => {
    minX = Math.min(minX, x);
    minY = Math.min(minY, y);
    maxX = Math.max(maxX, x);
    maxY = Math.max(maxY, y);
  });
  return [minX, minY, maxX, maxY];
}

function distanceSquared(a: Position, b: Position): number {
  const dx = a[0] - b[0];
  const dy = a[1] - b[1];
  return dx * dx + dy * dy;
}

/**
 * 국가 단위 비례원·정책점은 World Bank 국가 API의 capital 좌표에 직접 두지 않는다.
 * 국가 경계 polygon에서 대표점을 계산해 시각적으로 국가 영역 안에 배치한다.
 *
 * 1) 수도 좌표가 포함된 polygon component를 우선 선택한다. (도서국/멀티폴리곤 대응)
 * 2) 선택 polygon의 면적 중심이 내부이면 사용한다.
 * 3) 중심이 밖이면 bbox 중심 및 간단한 내부 grid 탐색으로 국가 안의 대표점을 찾는다.
 * 4) 경계가 없거나 계산이 실패한 경우에만 기존 국가 좌표로 fallback한다.
 */
function representativePointForPolygon(
  polygon: PolygonCoordinates,
  preferredPoint?: Position | null
): Position | null {
  const outer = unwrapRing(polygon[0]);
  if (!outer.length) return null;
  const referenceLongitude = outer[0][0];

  const centroid = ringCentroid(outer);
  if (centroid) {
    const wrappedCentroid: Position = [wrapLongitude(centroid[0]), centroid[1]];
    if (pointInPolygon(wrappedCentroid, polygon)) return wrappedCentroid;
  }

  const bounds = polygonBounds(outer);
  if (!bounds) return null;
  const [minX, minY, maxX, maxY] = bounds;
  const bboxCenter: Position = [(minX + maxX) / 2, (minY + maxY) / 2];
  const wrappedBboxCenter: Position = [
    wrapLongitude(bboxCenter[0]),
    bboxCenter[1],
  ];
  if (pointInPolygon(wrappedBboxCenter, polygon)) return wrappedBboxCenter;

  const preferredUnwrapped = preferredPoint
    ? unwrapPosition(preferredPoint, referenceLongitude)
    : centroid ?? bboxCenter;

  let best: Position | null = null;
  let bestDistance = Infinity;
  const gridSize = 28;
  for (let row = 0; row < gridSize; row += 1) {
    const y = minY + ((row + 0.5) / gridSize) * (maxY - minY);
    for (let column = 0; column < gridSize; column += 1) {
      const x = minX + ((column + 0.5) / gridSize) * (maxX - minX);
      const wrappedCandidate: Position = [wrapLongitude(x), y];
      if (!pointInPolygon(wrappedCandidate, polygon)) continue;
      const dist = distanceSquared([x, y], preferredUnwrapped);
      if (dist < bestDistance) {
        bestDistance = dist;
        best = wrappedCandidate;
      }
    }
  }

  if (best) return best;

  const fallback = outer.find((position) => isPosition(position));
  return fallback ? [wrapLongitude(fallback[0]), fallback[1]] : null;
}

function selectPolygonForCountry(
  polygons: PolygonCoordinates[],
  country: Country | undefined
): PolygonCoordinates | null {
  if (!polygons.length) return null;

  if (country && country.longitude !== null && country.latitude !== null) {
    const capitalPoint: Position = [country.longitude, country.latitude];
    const containing = polygons.find((polygon) =>
      pointInPolygon(capitalPoint, polygon)
    );
    if (containing) return containing;
  }

  return [...polygons].sort(
    (a, b) => polygonAreaEstimate(b) - polygonAreaEstimate(a)
  )[0];
}

export function buildCountryMapAnchorIndex(
  boundaries: WorldCountryBoundaryCollection,
  countries: Country[]
): Map<string, CountryMapAnchor> {
  const countryByIso3 = new Map(
    countries.map((country) => [country.iso3, country])
  );
  const result = new Map<string, CountryMapAnchor>();

  boundaries.features.forEach((feature) => {
    const polygons = extractPolygons(feature);
    const country = countryByIso3.get(feature.properties.iso3);
    const polygon = selectPolygonForCountry(polygons, country);
    if (!polygon) return;

    const preferred =
      country && country.longitude !== null && country.latitude !== null
        ? ([country.longitude, country.latitude] as Position)
        : null;
    const point = representativePointForPolygon(polygon, preferred);
    if (!point) return;

    result.set(feature.properties.iso3, {
      coordinates: point,
      source: "boundary-representative-point",
    });
  });

  countries.forEach((country) => {
    if (result.has(country.iso3)) return;
    if (country.longitude === null || country.latitude === null) return;
    result.set(country.iso3, {
      coordinates: [country.longitude, country.latitude],
      source: "country-coordinate-fallback",
    });
  });

  return result;
}

export function getCountryMapAnchor(
  index: Map<string, CountryMapAnchor>,
  country: Country
): CountryMapAnchor | null {
  return index.get(country.iso3) ?? null;
}
