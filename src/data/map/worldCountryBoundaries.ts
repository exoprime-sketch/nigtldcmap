export interface WorldCountryBoundaryProperties {
  iso3: string;
  nameEn: string;
  continent: string;
}

export interface WorldCountryBoundaryGeometry {
  type: "Polygon" | "MultiPolygon";
  coordinates: unknown;
}

export interface WorldCountryBoundaryFeature {
  type: "Feature";
  id: string;
  properties: WorldCountryBoundaryProperties;
  geometry: WorldCountryBoundaryGeometry;
}

export interface WorldCountryBoundaryCollection {
  type: "FeatureCollection";
  features: WorldCountryBoundaryFeature[];
}

const WORLD_COUNTRY_BOUNDARIES_URL = "/data/world-countries.geojson";
let boundaryPromise: Promise<WorldCountryBoundaryCollection> | null = null;

function isBoundaryCollection(
  value: unknown
): value is WorldCountryBoundaryCollection {
  if (!value || typeof value !== "object") return false;

  const candidate = value as Partial<WorldCountryBoundaryCollection>;
  return (
    candidate.type === "FeatureCollection" && Array.isArray(candidate.features)
  );
}

export async function loadWorldCountryBoundaries(
  force = false
): Promise<WorldCountryBoundaryCollection> {
  if (!force && boundaryPromise) return boundaryPromise;

  boundaryPromise = (async () => {
    const response = await fetch(WORLD_COUNTRY_BOUNDARIES_URL, {
      headers: { Accept: "application/geo+json, application/json" },
    });

    if (!response.ok) {
      throw new Error(`국가 경계 파일 응답 오류: ${response.status}`);
    }

    const data = (await response.json()) as unknown;
    if (!isBoundaryCollection(data)) {
      throw new Error("국가 경계 파일 형식이 올바르지 않습니다.");
    }

    return data;
  })();

  try {
    return await boundaryPromise;
  } catch (error) {
    boundaryPromise = null;
    throw error;
  }
}
