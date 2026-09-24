import { publicAssetUrlV128 } from "../../utils/publicAssetUrlV128";
import { countryAssetPathV158 } from "../countryContext";

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

const WORLD_COUNTRY_BOUNDARIES_URL = publicAssetUrlV128(
  "data/world-countries.geojson"
);
/**
 * V151-2: Viet Nam's outline dissolved from the 63-province asset (display
 * simplification 0.01°). The Natural Earth world file keeps only 44 vertices
 * for the country, far coarser than the province outlines drawn on top of it.
 */
export const VIETNAM_COUNTRY_OUTLINE_Z5_URL_V151 = publicAssetUrlV128(
  countryAssetPathV158("VNM", "geometry/vnm-country-outline-z5.geojson")
);
export const VIETNAM_COUNTRY_OUTLINE_URL_V151 = publicAssetUrlV128(
  countryAssetPathV158("VNM", "geometry/vnm-country-outline.geojson")
);
let boundaryPromise: Promise<WorldCountryBoundaryCollection> | null = null;
let vietnamOutlinePromise: Promise<WorldCountryBoundaryFeature> | null = null;

/** The national outline feature (z5 simplification), shaped like a world-file feature. */
export async function loadVietnamCountryOutlineV151(): Promise<WorldCountryBoundaryFeature> {
  if (vietnamOutlinePromise) return vietnamOutlinePromise;
  vietnamOutlinePromise = (async () => {
    const response = await fetch(VIETNAM_COUNTRY_OUTLINE_Z5_URL_V151, {
      headers: { Accept: "application/geo+json, application/json" },
    });
    if (!response.ok) throw new Error(`국가 외곽선 응답 오류: ${response.status}`);
    const data = (await response.json()) as unknown;
    if (!isBoundaryCollection(data) || !data.features[0]) {
      throw new Error("국가 외곽선 파일 형식이 올바르지 않습니다.");
    }
    const feature = data.features[0];
    return {
      type: "Feature",
      id: "VNM",
      properties: { iso3: "VNM", nameEn: "Vietnam", continent: "Asia" },
      geometry: feature.geometry,
    };
  })();
  try {
    return await vietnamOutlinePromise;
  } catch (error) {
    vietnamOutlinePromise = null;
    throw error;
  }
}

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
