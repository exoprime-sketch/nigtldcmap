import type { GeoBoundaryAdminLevelV116 } from "../../services/geoBoundariesV116";

function hashString(value: string): number {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function regionName(
  properties: Record<string, unknown>,
  fallback: string
): string {
  const candidates = [
    properties.shapeName,
    properties.shapeNAME,
    properties.name,
    properties.NAME_1,
    properties.NAME_2,
  ];
  const found = candidates.find(
    (value) => typeof value === "string" && value.trim()
  );
  return typeof found === "string" ? found : fallback;
}

function regionCode(
  properties: Record<string, unknown>,
  fallback: string
): string {
  const candidates = [
    properties.shapeISO,
    properties.shapeID,
    properties.GID_1,
    properties.GID_2,
  ];
  const found = candidates.find(
    (value) => typeof value === "string" && value.trim()
  );
  return typeof found === "string" ? found : fallback;
}

export function buildSyntheticRegionalFeaturesV116(
  elementId: string,
  iso3: string,
  level: GeoBoundaryAdminLevelV116,
  sourceGeoJson: { type: "FeatureCollection"; features: any[] },
  year = 2024
) {
  return {
    type: "FeatureCollection" as const,
    features: sourceGeoJson.features.map((feature, index) => {
      const props = (feature.properties ?? {}) as Record<string, unknown>;
      const fallbackCode = `${iso3}-${level}-${index + 1}`;
      const code = regionCode(props, fallbackCode);
      const name = regionName(props, `지역 ${index + 1}`);
      // 1~5 단계의 deterministic 값만 사용한다. 실제 통계값처럼 보이지 않도록
      // 퍼센트·금액·용량 등 현실 단위를 생성하지 않는다.
      const syntheticClass =
        (hashString(`${elementId}:${code}:${year}`) % 5) + 1;
      return {
        ...feature,
        properties: {
          ...props,
          elementId,
          countryIso3: iso3,
          regionCode: code,
          regionName: name,
          geometryLevel: level === "ADM1" ? "admin1" : "admin2",
          value: syntheticClass,
          normalized: (syntheticClass - 1) / 4,
          unit: "예시 단계",
          year,
          dataMode: "synthetic",
          isSynthetic: true,
          syntheticNotice: "시각화 예시 · 실제 지역 통계가 아닙니다",
        },
      };
    }),
  };
}

export const REGIONAL_SYNTHETIC_NOTICE_V116 =
  "시각화 예시 · 실제 지역 통계가 아닙니다. 실제 지역자료가 확보되면 동일 공간단위에서 실제값으로 교체됩니다.";
