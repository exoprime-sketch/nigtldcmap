import { PRIORITY_COUNTRIES } from "../priorityCountries";

export interface SyntheticMapPropertiesV115 {
  dataMode: "synthetic";
  isSynthetic: true;
  elementId: string;
  label: string;
}

export const SYNTHETIC_DATA_MODE_V115 = "synthetic" as const;
export const SYNTHETIC_BADGE_V115 = "시각화 예시";
export const SYNTHETIC_NOTICE_V115 = "실제 통계가 아닌 화면 구성 예시입니다";

function stableHash(input: string): number {
  let hash = 2166136261;
  for (let index = 0; index < input.length; index += 1) {
    hash ^= input.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

export function mockValueForCountryV115(
  elementId: string,
  iso3: string,
  min = 8,
  max = 92
): number {
  const hash = stableHash(`${elementId}::${iso3}`);
  const unit = (hash % 10000) / 9999;
  return Number((min + unit * (max - min)).toFixed(1));
}

export function mockCountForCountryV115(
  elementId: string,
  iso3: string,
  min = 1,
  max = 12
): number {
  const hash = stableHash(`count::${elementId}::${iso3}`);
  return min + (hash % Math.max(1, max - min + 1));
}

export function buildSyntheticCountryValuesV115(elementId: string) {
  return PRIORITY_COUNTRIES.map((country) => ({
    iso3: country.iso3,
    countryName: country.nameKo,
    value: mockValueForCountryV115(elementId, country.iso3),
    dataMode: SYNTHETIC_DATA_MODE_V115,
    isSynthetic: true as const,
  }));
}

export function buildSyntheticCountryCountsV115(elementId: string) {
  return PRIORITY_COUNTRIES.map((country) => ({
    iso3: country.iso3,
    countryName: country.nameKo,
    value: mockCountForCountryV115(elementId, country.iso3),
    dataMode: SYNTHETIC_DATA_MODE_V115,
    isSynthetic: true as const,
  }));
}

export function buildSyntheticPointPrototypeV115(elementId: string) {
  const coordinates: Array<[number, number]> = [
    [80, -45],
    [90, -48],
    [100, -44],
    [110, -49],
    [120, -45],
  ];
  return {
    type: "FeatureCollection" as const,
    features: coordinates.map((coordinate, index) => ({
      type: "Feature" as const,
      properties: {
        dataMode: SYNTHETIC_DATA_MODE_V115,
        isSynthetic: true,
        elementId,
        label: `가상 위치 예시 ${index + 1}`,
        notice: SYNTHETIC_NOTICE_V115,
      },
      geometry: { type: "Point" as const, coordinates: coordinate },
    })),
  };
}

export function buildSyntheticLinePrototypeV115(elementId: string) {
  return {
    type: "FeatureCollection" as const,
    features: [
      {
        type: "Feature" as const,
        properties: {
          dataMode: SYNTHETIC_DATA_MODE_V115,
          isSynthetic: true,
          elementId,
          label: "가상 선형 인프라 예시",
          notice: SYNTHETIC_NOTICE_V115,
        },
        geometry: {
          type: "LineString" as const,
          coordinates: [
            [78, -52],
            [88, -49],
            [98, -53],
            [108, -50],
          ],
        },
      },
    ],
  };
}

export function buildSyntheticRasterPrototypeV115(elementId: string) {
  const features: any[] = [];
  const startLng = 76;
  const startLat = -58;
  for (let row = 0; row < 3; row += 1) {
    for (let col = 0; col < 4; col += 1) {
      const west = startLng + col * 4;
      const south = startLat + row * 4;
      const value = mockValueForCountryV115(elementId, `grid-${row}-${col}`);
      features.push({
        type: "Feature",
        properties: {
          dataMode: SYNTHETIC_DATA_MODE_V115,
          isSynthetic: true,
          elementId,
          label: "가상 격자 예시",
          value,
          normalized: value / 100,
          notice: SYNTHETIC_NOTICE_V115,
        },
        geometry: {
          type: "Polygon",
          coordinates: [
            [
              [west, south],
              [west + 3.4, south],
              [west + 3.4, south + 3.4],
              [west, south + 3.4],
              [west, south],
            ],
          ],
        },
      });
    }
  }
  return { type: "FeatureCollection" as const, features };
}

export function buildSyntheticFlowFeaturesV115(
  elementId: string,
  anchors: Map<string, { coordinates: [number, number] }>
) {
  const hub: [number, number] = [88, -55];
  return {
    type: "FeatureCollection" as const,
    features: PRIORITY_COUNTRIES.flatMap((country) => {
      const anchor = anchors.get(country.iso3);
      if (!anchor) return [];
      return [
        {
          type: "Feature" as const,
          properties: {
            dataMode: SYNTHETIC_DATA_MODE_V115,
            isSynthetic: true,
            elementId,
            iso3: country.iso3,
            countryName: country.nameKo,
            value: mockCountForCountryV115(elementId, country.iso3, 1, 8),
            label: `${country.nameKo} 흐름 시각화 예시`,
            notice: SYNTHETIC_NOTICE_V115,
          },
          geometry: {
            type: "LineString" as const,
            coordinates: [hub, anchor.coordinates],
          },
        },
      ];
    }),
  };
}

export function isMapDemoRequestedV115(): boolean {
  if (typeof window === "undefined") return false;
  return new URLSearchParams(window.location.search).get("mapdemo") === "1";
}
