import type { IndicatorId } from "../indicators/registry";
import {
  MAP_ELEMENT_AUDIT_V115,
} from "./mapElementAuditV115";
import type {
  MapElementAuditRowV115,
} from "./mapElementAuditV115";

export type MapRendererV115 =
  | "choropleth"
  | "proportional-bubble"
  | "aggregate-bubble"
  | "verified-point"
  | "cluster-point"
  | "raster"
  | "flow"
  | "categorical-outline"
  | "line"
  | "filter"
  | "panel"
  | "none";

export type MapLayerRoleV115 =
  | "base"
  | "aggregate"
  | "verified-point"
  | "raster"
  | "flow"
  | "filter"
  | "panel"
  | "none";

export interface MapLayerRegistryRowV115 {
  layerId: string;
  elementId: string;
  elementIds: string[];
  datasetIds: string[];
  label: string;
  category: string;
  role: MapLayerRoleV115;
  geometry: MapElementAuditRowV115["geometry"];
  renderer: MapRendererV115;
  unit: string;
  timeEnabled: boolean;
  filterDimensions: string[];
  defaultPreset: string;
  actualDataAvailable: boolean;
  actualIndicatorIds: IndicatorId[];
  actualAdapter:
    | "indicator"
    | "tna"
    | "ctcn"
    | "gcf"
    | "adaptation-fund"
    | "gef"
    | "mdb"
    | "climate-funds"
    | "oda"
    | "policy"
    | "evidence"
    | "none";
  syntheticAdapter:
    | "country-values"
    | "country-counts"
    | "flow"
    | "point-prototype"
    | "line-prototype"
    | "raster-prototype"
    | "categorical"
    | "none";
}

const ACTUAL_INDICATORS_BY_ELEMENT_V115: Partial<
  Record<string, IndicatorId[]>
> = {
  "A-003": ["gdp-per-capita", "gdp-current", "gdp-growth"],
  "A-004": ["poverty-national", "poverty-extreme"],
  "A-005": [
    "sector-industry-share",
    "sector-agriculture-share",
    "sector-manufacturing-share",
    "sector-services-share",
  ],
  "A-006": ["unemployment-total", "unemployment-youth"],
  "A-007": ["population-total", "urbanization-share", "population-growth"],
  "A-008": ["gini-index"],
  "A-019": ["grid-losses"],
  "A-020": ["renewable-electricity-share"],
  "A-021": ["electricity-access"],
  "B-006": ["heat-index-hi35"],
  "B-041": ["solar-pvout", "solar-ghi"],
};

const ACTUAL_ADAPTER_BY_ELEMENT_V115: Partial<
  Record<string, MapLayerRegistryRowV115["actualAdapter"]>
> = {
  "C-001": "policy",
  "C-002": "policy",
  "C-003": "policy",
  "C-004": "policy",
  "C-005": "tna",
  "D-011": "oda",
  "D-018": "adaptation-fund",
  "D-019": "ctcn",
  "D-020": "gcf",
  "D-021": "mdb",
  "D-023": "climate-funds",
  "E-003": "evidence",
};

function rendererFor(row: MapElementAuditRowV115): MapRendererV115 {
  if (row.mapDecision === "not-map-suitable") return "none";
  if (row.mapDecision === "filter") return "filter";
  if (row.mapDecision === "evidence-panel") return "panel";
  if (row.mapDecision === "flow") return "flow";
  if (row.mapDecision === "country-aggregate") return "aggregate-bubble";
  if (row.visualization === "proportional-bubble") return "proportional-bubble";
  if (row.visualization === "verified-point") return "verified-point";
  if (row.visualization === "line-layer") return "line";
  if (row.visualization === "raster-grid") return "raster";
  if (row.visualization === "categorical-outline") return "categorical-outline";
  return "choropleth";
}

function roleFor(renderer: MapRendererV115): MapLayerRoleV115 {
  if (renderer === "choropleth" || renderer === "categorical-outline")
    return "base";
  if (renderer === "proportional-bubble" || renderer === "aggregate-bubble")
    return "aggregate";
  if (
    renderer === "verified-point" ||
    renderer === "cluster-point" ||
    renderer === "line"
  )
    return "verified-point";
  if (renderer === "raster") return "raster";
  if (renderer === "flow") return "flow";
  if (renderer === "filter") return "filter";
  if (renderer === "panel") return "panel";
  return "none";
}

function syntheticAdapterFor(
  row: MapElementAuditRowV115,
  renderer: MapRendererV115
): MapLayerRegistryRowV115["syntheticAdapter"] {
  if (!row.mockAllowed || row.actualDataAvailable) return "none";
  if (renderer === "flow") return "flow";
  if (renderer === "aggregate-bubble") return "country-counts";
  if (renderer === "verified-point" || renderer === "cluster-point")
    return "point-prototype";
  if (renderer === "line") return "line-prototype";
  if (renderer === "raster") return "raster-prototype";
  if (renderer === "categorical-outline") return "categorical";
  return "country-values";
}

function inferUnit(label: string): string {
  if (/%|비율|률|비중|지수|Score|점수/.test(label)) return "% 또는 지수";
  if (/USD|예산|투자액|금액|비용|가격|수입/.test(label)) return "금액";
  if (/MW|용량|발전/.test(label)) return "용량";
  if (/tCO₂|배출/.test(label)) return "배출량";
  if (/ha|면적/.test(label)) return "면적";
  if (/건수|프로젝트|사업|참여/.test(label)) return "건";
  return "자료별 상이";
}

function inferTimeEnabled(label: string): boolean {
  return /연도|추이|전망|변화|시계열|성장|발행|빈티지|기간|과거|미래|연간/.test(
    label
  );
}

export const MAP_LAYER_REGISTRY_V115: MapLayerRegistryRowV115[] =
  MAP_ELEMENT_AUDIT_V115.map((row) => {
    const renderer = rendererFor(row);
    const indicatorIds = ACTUAL_INDICATORS_BY_ELEMENT_V115[row.elementId] ?? [];
    return {
      layerId: `v115-element-${row.elementId.toLowerCase()}`,
      elementId: row.elementId,
      elementIds: [row.elementId],
      datasetIds: row.datasetIds,
      label: row.label,
      category: row.mapCategory,
      role: roleFor(renderer),
      geometry: row.geometry,
      renderer,
      unit: inferUnit(row.label),
      timeEnabled: indicatorIds.length > 0 || inferTimeEnabled(row.label),
      filterDimensions:
        row.mapCategory === "협력수요" || row.mapCategory === "사업·재원"
          ? ["country", "technology", "track", "organization", "status"]
          : ["country"],
      defaultPreset: row.defaultPreset,
      actualDataAvailable: row.actualDataAvailable,
      actualIndicatorIds: indicatorIds,
      actualAdapter:
        indicatorIds.length > 0
          ? "indicator"
          : ACTUAL_ADAPTER_BY_ELEMENT_V115[row.elementId] ??
            (row.actualDataAvailable ? "evidence" : "none"),
      syntheticAdapter: syntheticAdapterFor(row, renderer),
    };
  });

export const MAP_LAYER_REGISTRY_INDEX_V115 = new Map(
  MAP_LAYER_REGISTRY_V115.map((row) => [row.elementId, row] as const)
);

export const MAP_CATALOG_CATEGORIES_V115 = Array.from(
  new Set(MAP_LAYER_REGISTRY_V115.map((row) => row.category))
);

export const MAP_PRESETS_V115 = [
  "핵심 통합 보기",
  "기술수요 보기",
  "정책·제도 보기",
  "사업·재원 보기",
  "ODA·공여환경 보기",
  "기후위험·적응 보기",
  "에너지·인프라 보기",
  "시장·산업 보기",
  "기술·혁신 보기",
  "파트너·실행기반 보기",
] as const;

export type MapPresetLabelV115 = (typeof MAP_PRESETS_V115)[number];

export const MAP_PRESET_DEFAULTS_V115: Record<
  MapPresetLabelV115,
  { baseElementId: string | null; elementIds: string[] }
> = {
  "핵심 통합 보기": {
    baseElementId: "A-019",
    elementIds: ["C-005", "D-019", "D-020", "D-018", "D-023", "D-021"],
  },
  "기술수요 보기": {
    baseElementId: "A-021",
    elementIds: ["C-005", "D-019", "C-001", "C-002", "C-003", "C-004"],
  },
  "정책·제도 보기": {
    baseElementId: "C-019",
    elementIds: ["C-001", "C-002", "C-003", "C-004", "C-009", "C-012", "C-017"],
  },
  "사업·재원 보기": {
    baseElementId: "A-003",
    elementIds: [
      "D-018",
      "D-019",
      "D-020",
      "D-021",
      "D-022",
      "D-023",
      "D-025",
      "D-026",
    ],
  },
  "ODA·공여환경 보기": {
    baseElementId: "A-031",
    elementIds: ["D-011", "A-029", "A-030", "A-032", "D-014", "D-015", "D-017"],
  },
  "기후위험·적응 보기": {
    baseElementId: "B-006",
    elementIds: [
      "B-005",
      "B-006",
      "B-007",
      "B-008",
      "B-009",
      "B-010",
      "B-011",
      "B-017",
    ],
  },
  "에너지·인프라 보기": {
    baseElementId: "A-019",
    elementIds: [
      "A-019",
      "A-020",
      "A-021",
      "A-023",
      "A-024",
      "B-039",
      "B-041",
      "B-042",
    ],
  },
  "시장·산업 보기": {
    baseElementId: "A-003",
    elementIds: ["A-003", "A-005", "A-031", "D-001", "D-002", "D-013"],
  },
  "기술·혁신 보기": {
    baseElementId: "E-010",
    elementIds: ["E-007", "E-008", "E-009", "E-010", "E-011", "E-013"],
  },
  "파트너·실행기반 보기": {
    baseElementId: null,
    elementIds: [
      "E-001",
      "E-002",
      "E-003",
      "E-004",
      "E-005",
      "E-006",
      "E-018",
      "E-019",
    ],
  },
};

export function getMapLayerRegistryRowV115(
  elementId: string
): MapLayerRegistryRowV115 | undefined {
  return MAP_LAYER_REGISTRY_INDEX_V115.get(elementId);
}

export function getMapCatalogRowsV115(): MapLayerRegistryRowV115[] {
  return MAP_LAYER_REGISTRY_V115.filter((row) => row.role !== "none");
}
