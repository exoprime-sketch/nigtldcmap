export type SpatialResolutionV116 =
  | "facility"
  | "admin2"
  | "admin1"
  | "basin"
  | "grid"
  | "corridor"
  | "country"
  | "non-spatial";

export type SpatialGeometryLevelV116 =
  | "country"
  | "admin1"
  | "admin2"
  | "point"
  | "grid"
  | "basin"
  | "corridor";

export interface SpatialFeatureV116 {
  elementId: string;
  countryIso3: string;
  countryName?: string;
  admin1Code?: string;
  admin1Name?: string;
  admin2Code?: string;
  admin2Name?: string;
  geometryLevel: SpatialGeometryLevelV116;
  year?: number;
  value?: number | null;
  unit?: string;
  source?: string;
  sourceUrl?: string;
  dataMode: "actual" | "synthetic";
  isSynthetic: boolean;
}

export interface SpatialResolutionDecisionV116 {
  actualResolution: SpatialResolutionV116;
  preferredResolution: SpatialResolutionV116;
}

export const SPATIAL_RESOLUTION_LABELS_V116: Record<
  SpatialResolutionV116,
  string
> = {
  facility: "실제 위치",
  admin2: "2차 지역",
  admin1: "1차 지역",
  basin: "유역",
  grid: "격자",
  corridor: "회랑·연결망",
  country: "국가",
  "non-spatial": "공간표현 없음",
};

export const SPATIAL_HIERARCHY_V116: SpatialResolutionV116[] = [
  "facility",
  "admin2",
  "admin1",
  "basin",
  "grid",
  "corridor",
  "country",
  "non-spatial",
];

export function isRegionalResolutionV116(
  value: SpatialResolutionV116
): boolean {
  return ["facility", "admin2", "admin1", "basin", "grid", "corridor"].includes(
    value
  );
}
