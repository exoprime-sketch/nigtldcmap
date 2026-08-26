export type GeoBoundaryAdminLevelV116 = "ADM1" | "ADM2";

export interface GeoBoundariesMetadataV116 {
  boundaryID: string;
  boundaryName: string;
  boundaryISO: string;
  boundaryYearRepresented: string;
  boundaryType: GeoBoundaryAdminLevelV116;
  boundaryCanonical?: string;
  boundarySource: string;
  boundaryLicense: string;
  simplifiedGeometryGeoJSON: string;
}

export interface SubnationalBoundaryResultV116 {
  metadata: GeoBoundariesMetadataV116;
  geojson: { type: "FeatureCollection"; features: any[] };
}

const cache = new Map<string, Promise<SubnationalBoundaryResultV116>>();

function buildKey(iso3: string, level: GeoBoundaryAdminLevelV116): string {
  return `${iso3.toUpperCase()}:${level}`;
}

export async function fetchSubnationalBoundariesV116(
  iso3: string,
  level: GeoBoundaryAdminLevelV116,
  signal?: AbortSignal
): Promise<SubnationalBoundaryResultV116> {
  const key = buildKey(iso3, level);
  const existing = cache.get(key);
  if (existing) return existing;

  const request = (async () => {
    const metadataUrl = `https://www.geoboundaries.org/api/current/gbOpen/${encodeURIComponent(
      iso3.toUpperCase()
    )}/${level}/`;
    const metadataResponse = await fetch(metadataUrl, { signal });
    if (!metadataResponse.ok) {
      throw new Error(
        `지역 경계를 불러오지 못했습니다 (${metadataResponse.status})`
      );
    }
    const metadata =
      (await metadataResponse.json()) as GeoBoundariesMetadataV116;
    if (!metadata.simplifiedGeometryGeoJSON) {
      throw new Error("웹용 지역 경계 주소가 제공되지 않습니다");
    }
    const geometryResponse = await fetch(metadata.simplifiedGeometryGeoJSON, {
      signal,
    });
    if (!geometryResponse.ok) {
      throw new Error(
        `지역 경계 파일을 불러오지 못했습니다 (${geometryResponse.status})`
      );
    }
    const geojson = (await geometryResponse.json()) as {
      type: "FeatureCollection";
      features: any[];
    };
    return { metadata, geojson };
  })();

  cache.set(key, request);
  try {
    return await request;
  } catch (error) {
    cache.delete(key);
    throw error;
  }
}

export const GEOBOUNDARIES_ATTRIBUTION_V116 =
  "행정경계: geoBoundaries gbOpen · 경계 자료의 원 출처와 라이선스는 선택 지역별 메타데이터에 따름";

/**
 * v123 Vietnam map foundation.
 * The published data package uses the 63-province/city system that preceded
 * the July 2025 consolidation. Pin the boundary asset to a tagged, immutable
 * Apache Superset release instead of silently following a current ADM1 API.
 */
export const VIETNAM_ADMIN1_PRE2025_URL_V123 =
  "https://raw.githubusercontent.com/apache/superset/5.0.0rc4/superset-frontend/plugins/legacy-plugin-chart-country-map/src/countries/vietnam.geojson";

export const VIETNAM_ADMIN1_PRE2025_ATTRIBUTION_V123 =
  "행정경계: Apache Superset country-map · 고정 버전 5.0.0rc4 · 2025년 행정구역 통합 전 성·시 체계";

let vietnamAdmin1Pre2025PromiseV123: Promise<{
  type: "FeatureCollection";
  features: any[];
}> | null = null;

export async function fetchVietnamAdmin1Pre2025V123(
  signal?: AbortSignal
): Promise<{ type: "FeatureCollection"; features: any[] }> {
  if (!vietnamAdmin1Pre2025PromiseV123) {
    vietnamAdmin1Pre2025PromiseV123 = (async () => {
      const response = await fetch(VIETNAM_ADMIN1_PRE2025_URL_V123, {
        signal,
        cache: "force-cache",
      });
      if (!response.ok) {
        throw new Error(
          `베트남 성 경계를 불러오지 못했습니다 (${response.status})`
        );
      }
      const geojson = (await response.json()) as {
        type: "FeatureCollection";
        features: any[];
      };
      if (
        geojson?.type !== "FeatureCollection" ||
        !Array.isArray(geojson.features) ||
        geojson.features.length < 60
      ) {
        throw new Error("베트남 성 경계 형식이 올바르지 않습니다");
      }
      return geojson;
    })();
  }
  try {
    return await vietnamAdmin1Pre2025PromiseV123;
  } catch (error) {
    vietnamAdmin1Pre2025PromiseV123 = null;
    throw error;
  }
}
