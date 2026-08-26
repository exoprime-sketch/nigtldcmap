import { DATASETS } from "../publicDatasets";
import type { Dataset } from "../../types/dataset";
import type { SpatialResolutionV116 } from "../../types/spatialDataV116";
import { AUTHORITATIVE_ELEMENT_SEARCH_V75 } from "../../utils/authoritativeElementSearchV75";
import { getElementCoverageStatus } from "../../utils/dataElementCoverageV64";
import {
  getAuthoritativeElementIdV88,
  getDatasetsForAuthoritativeElementV88,
} from "../../utils/elementDatasetRegistryV88";
import { isDatasetPubliclyVisible } from "../../utils/datasetAccess";
import {
  DATA_DETAIL_PRESENTATION_INDEX_V117,
} from "../cooperation/dataDetailPresentationV117";
import type {
  DetailTemplateV117,
} from "../cooperation/dataDetailPresentationV117";
import { MAP_ELEMENT_AUDIT_INDEX_V115 } from "./mapElementAuditV115";
import { MAP_ELEMENT_DECISION_INDEX_V116 } from "./mapElementDecisionV116";

export type DataDisplayStatusV118 =
  | "available"
  | "partially-available"
  | "planned";

export type DataShapeV118 =
  | "single-value"
  | "time-series"
  | "categorical"
  | "project"
  | "policy"
  | "network"
  | "point"
  | "polygon"
  | "raster"
  | "grid";

export type DisplaySurfaceV118 =
  | "map-primary"
  | "map-overlay"
  | "map-filter"
  | "evidence-panel"
  | "detail-only";

export type RegionalizationPriorityV118 = "high" | "medium" | "low";

export interface GeographicFieldsV118 {
  countryIso3: string | null;
  admin1Code: string | null;
  admin2Code: string | null;
  latitude: string | null;
  longitude: string | null;
  geometry: string | null;
  gridId: string | null;
  basinId: string | null;
  corridorId: string | null;
}

export interface DataDisplayContractV118 {
  elementId: string;
  label: string;
  expectedSource: string;
  expectedDataset: string[];
  actualDataStatus: DataDisplayStatusV118;
  expectedFields: string[];
  valueFields: string[];
  categoryFields: string[];
  timeFields: string[];
  technologyFields: string[];
  financialFields: string[];
  geographicFields: GeographicFieldsV118;
  actualSpatialResolution: SpatialResolutionV116;
  expectedSpatialResolution: SpatialResolutionV116;
  regionalizationPriority: RegionalizationPriorityV118;
  timeResolution: string;
  dataShape: DataShapeV118;
  mapPossible: boolean;
  displaySurface: DisplaySurfaceV118;
  recommendedMapUse: string;
  evidencePanelUse: string;
  requiredTransformations: string[];
  prohibitedTransformations: string[];
  actualDatasetIds: string[];
  actualFieldBasis: string;
}

const PUBLIC_DATASETS = DATASETS.filter(isDatasetPubliclyVisible);

function datasetShape(dataset: Dataset): DataShapeV118 {
  if (dataset.id === "LDC-DS-C-005-TNA") return "categorical";
  if (
    dataset.previewKind === "policy-document" ||
    dataset.previewKind === "document"
  ) {
    return "policy";
  }
  if (
    dataset.previewKind === "gcf-portfolio" ||
    dataset.previewKind === "local-projects" ||
    dataset.id === "LDC-DS-D-018-AF" ||
    dataset.id === "LDC-DS-D-019-CTCN" ||
    dataset.id === "LDC-DS-D-002"
  ) {
    return "project";
  }
  if (dataset.previewKind === "indicator" || dataset.indicatorId) {
    return "time-series";
  }
  if (dataset.primaryRepresentationType === "geospatial") {
    return dataset.types.includes("래스터") ? "raster" : "polygon";
  }
  if (dataset.representationTypes?.includes("time_series"))
    return "time-series";
  return "categorical";
}

function shapeFromTemplate(
  template: DetailTemplateV117 | undefined
): DataShapeV118 {
  switch (template) {
    case "policy":
      return "policy";
    case "project":
      return "project";
    case "finance":
      return "time-series";
    case "climate-risk":
      return "grid";
    case "partner":
    case "korea-supply":
      return "categorical";
    case "technology-demand":
      return "categorical";
    case "market-industry":
    case "indicator":
    default:
      return "time-series";
  }
}

function unique(values: string[]): string[] {
  return Array.from(new Set(values.filter(Boolean)));
}

function indicatorFields(): string[] {
  return [
    "country_iso3",
    "country_name",
    "year",
    "value",
    "unit",
    "indicator_id",
    "source_url",
  ];
}

function actualFieldsForDataset(dataset: Dataset): string[] {
  if (dataset.previewKind === "indicator" || dataset.indicatorId) {
    return indicatorFields();
  }
  if (dataset.id === "LDC-DS-C-005-TNA") {
    return [
      "country_iso3",
      "track",
      "sector",
      "source_technology_name",
      "priority_rank",
      "mapped_technology_id",
      "source_pages",
      "source_url",
      "barriers",
      "project_idea",
    ];
  }
  if (
    dataset.previewKind === "policy-document" ||
    dataset.id === "LDC-DS-C-001" ||
    dataset.id === "LDC-DS-C-002-BTR" ||
    dataset.id === "LDC-DS-C-003-NAP" ||
    dataset.id === "LDC-DS-C-004-LTLEDS"
  ) {
    return [
      "country_iso3",
      "document_type",
      "document_title",
      "publication_or_submission_date",
      "status",
      "source_url",
      "source_page_or_anchor",
    ];
  }
  if (dataset.id === "LDC-DS-D-011-OECD-ODA") {
    return [
      "country_iso3",
      "flow_type",
      "donor_code",
      "donor_name",
      "recipient_code",
      "recipient_name",
      "year",
      "value",
      "unit",
      "price_base",
      "source_url",
    ];
  }
  if (dataset.id === "LDC-DS-D-002") {
    return [
      "organization",
      "project_id",
      "project_title",
      "country_iso3",
      "status",
      "approval_date",
      "closing_date",
      "commitment_usd",
      "disbursement_usd",
      "sectors",
      "implementing_agency",
      "source_url",
    ];
  }
  if (
    dataset.id === "LDC-DS-D-018-AF" ||
    dataset.id === "LDC-DS-D-019-CTCN" ||
    dataset.id === "LDC-DS-E-002"
  ) {
    return [
      "source_organization",
      "project_id",
      "project_title",
      "country_iso3",
      "sector",
      "mapped_technology_ids",
      "status",
      "approval_date",
      "approved_amount_usd",
      "country_allocated_amount_usd",
      "implementing_entity",
      "source_url",
    ];
  }
  if (dataset.previewKind === "gcf-portfolio") {
    return [
      "project_id",
      "project_title",
      "country_iso3",
      "status",
      "approval_date",
      "approved_amount_usd",
      "accredited_entity",
      "sector_or_theme",
      "source_url",
    ];
  }
  if (dataset.id === "LDC-PILOT-E-003-GCF-ORGS") {
    return [
      "country_iso3",
      "organization_name",
      "organization_type",
      "role",
      "source_url",
    ];
  }
  return unique([
    "country_iso3",
    ...dataset.variables.map((value) =>
      value.toLowerCase().replace(/\s+/g, "_")
    ),
    "source_url",
  ]);
}

function plannedFields(template: DetailTemplateV117 | undefined): string[] {
  switch (template) {
    case "policy":
      return [
        "country_iso3",
        "document_type",
        "document_title",
        "publication_date",
        "policy_area",
        "source_url",
      ];
    case "project":
      return [
        "project_id",
        "project_title",
        "country_iso3",
        "status",
        "start_date",
        "end_date",
        "organization",
        "sector",
        "source_url",
      ];
    case "finance":
      return [
        "country_iso3",
        "provider",
        "flow_type",
        "year",
        "value",
        "unit",
        "source_url",
      ];
    case "technology-demand":
      return [
        "country_iso3",
        "technology_name",
        "sector",
        "track",
        "priority",
        "policy_status",
        "source_url",
      ];
    case "partner":
      return [
        "country_iso3",
        "organization_name",
        "organization_type",
        "role",
        "sector_or_technology",
        "source_url",
      ];
    case "korea-supply":
      return [
        "technology_id",
        "technology_name",
        "organization_name",
        "capability_type",
        "source_url",
      ];
    case "climate-risk":
      return [
        "country_iso3",
        "admin1_code",
        "admin2_code",
        "grid_id",
        "year_or_period",
        "value",
        "unit",
        "source_url",
      ];
    case "market-industry":
    case "indicator":
    default:
      return indicatorFields();
  }
}

function valueFields(fields: string[]): string[] {
  return fields.filter((field) =>
    /(^|_)(value|amount|capacity|score|rate|share|count|rank|index|total|loss|potential)(_|$)/i.test(
      field
    )
  );
}

function categoryFields(fields: string[]): string[] {
  return fields.filter((field) =>
    /status|sector|theme|type|track|role|organization|provider|technology/i.test(
      field
    )
  );
}

function timeFields(fields: string[]): string[] {
  return fields.filter((field) => /year|date|period|time/i.test(field));
}

function technologyFields(fields: string[]): string[] {
  return fields.filter((field) => /technology|sector|track/i.test(field));
}

function financialFields(
  fields: string[],
  template: DetailTemplateV117 | undefined
): string[] {
  return fields.filter(
    (field) =>
      /amount|commitment|disbursement|budget|cofinancing/i.test(field) ||
      (template === "finance" && field === "value")
  );
}

function geographicFields(
  actualResolution: SpatialResolutionV116,
  fields: string[]
): GeographicFieldsV118 {
  const has = (name: string) => (fields.includes(name) ? name : null);
  return {
    countryIso3: has("country_iso3"),
    admin1Code: has("admin1_code"),
    admin2Code: has("admin2_code"),
    latitude: has("latitude"),
    longitude: has("longitude"),
    geometry: fields.includes("geometry") ? "geometry" : null,
    gridId: has("grid_id"),
    basinId: has("basin_id"),
    corridorId: has("corridor_id"),
  };
}

function displaySurfaceFor(
  elementId: string,
  status: DataDisplayStatusV118,
  shape: DataShapeV118
): DisplaySurfaceV118 {
  const audit = MAP_ELEMENT_AUDIT_INDEX_V115.get(elementId);
  const decision = MAP_ELEMENT_DECISION_INDEX_V116.get(elementId);
  if (!audit || !decision || audit.mapDecision === "not-map-suitable")
    return "detail-only";

  if (status === "planned") {
    if (audit.mapDecision === "evidence-panel" || shape === "policy")
      return "evidence-panel";
    return audit.mockAllowed ? "map-filter" : "detail-only";
  }

  if (shape === "policy") return "evidence-panel";
  if (shape === "project") {
    // 현재 공개 프로젝트 스키마에는 국가 귀속이 있으므로 국가 집계는 가능하다.
    // 검증된 latitude/longitude가 없으므로 실제 사업 point로는 사용하지 않는다.
    return "map-overlay";
  }
  if (elementId === "D-011") return "evidence-panel";
  if (elementId === "C-005") return "map-overlay";
  if (audit.mapDecision === "filter") return "map-filter";
  if (audit.mapDecision === "evidence-panel") return "evidence-panel";
  if (
    audit.mapDecision === "country-aggregate" ||
    audit.mapDecision === "flow"
  ) {
    return "map-overlay";
  }
  return "map-primary";
}

function recommendedMapUse(
  surface: DisplaySurfaceV118,
  shape: DataShapeV118,
  resolution: SpatialResolutionV116
): string {
  if (surface === "detail-only") return "데이터 상세에서 확인";
  if (surface === "evidence-panel") return "국가·지역 선택 후 상세 근거로 확인";
  if (surface === "map-filter")
    return "지도 데이터 선택·필터 또는 화면 구성 예시";
  if (surface === "map-overlay") {
    if (shape === "project") return "좌표가 없으면 국가·지역 집계로만 표시";
    return "기본 공간지표 위에 보조정보로 중첩";
  }
  if (resolution === "grid") return "격자·래스터 또는 지역분포로 표시";
  if (resolution === "admin1" || resolution === "admin2")
    return "지역 단위 분포를 우선 표시";
  if (resolution === "facility") return "검증 좌표가 있을 때 실제 위치로 표시";
  return "국가별 분포를 한 번에 하나의 주제지도로 표시";
}

function transformations(shape: DataShapeV118): string[] {
  if (shape === "time-series")
    return ["국가·연도별 최신 실제값 선택", "자료 없음과 0 분리"];
  if (shape === "project")
    return ["국가·기관·상태별 집계", "금액 필드는 원래 금융개념 유지"];
  if (shape === "policy") return ["국가·문서유형별 존재·상태 정리"];
  return ["원자료 필드와 공간단위 유지"];
}

const ALWAYS_PROHIBITED = [
  "국가자료를 임의의 Admin-1·Admin-2 값으로 분해",
  "위치필드가 없는 사업에 좌표 생성",
  "null을 0으로 변환",
  "서로 다른 금융개념 합산",
  "사업명만으로 기후기술 자동추론",
];

function buildContract(elementId: string): DataDisplayContractV118 {
  const search = AUTHORITATIVE_ELEMENT_SEARCH_V75.find(
    (item) => item.elementId === elementId
  );
  if (!search) throw new Error(`Unknown element ${elementId}`);
  const datasets = getDatasetsForAuthoritativeElementV88(
    PUBLIC_DATASETS,
    elementId
  );
  const coverage = getElementCoverageStatus(elementId, datasets);
  const presentation = DATA_DETAIL_PRESENTATION_INDEX_V117.get(elementId);
  const decision = MAP_ELEMENT_DECISION_INDEX_V116.get(elementId);
  const audit = MAP_ELEMENT_AUDIT_INDEX_V115.get(elementId);
  const status: DataDisplayStatusV118 =
    coverage === "full"
      ? "available"
      : coverage === "partial"
      ? "partially-available"
      : "planned";
  const fields = unique(
    datasets.length
      ? datasets.flatMap(actualFieldsForDataset)
      : plannedFields(presentation?.template)
  );
  const shape = datasets.length
    ? datasets
        .map(datasetShape)
        .find((item) => item === "project" || item === "policy") ??
      datasetShape(datasets[0])
    : shapeFromTemplate(presentation?.template);
  const actualResolution =
    decision?.actualResolution ??
    presentation?.actualResolution ??
    "non-spatial";
  const expectedSpatialResolution =
    decision?.preferredResolution ??
    presentation?.preferredResolution ??
    "country";
  const surface = displaySurfaceFor(elementId, status, shape);

  return {
    elementId,
    label: search.displayTitle,
    expectedSource: unique([
      ...datasets.map((item) => item.sourceOrganization),
      search.source,
    ]).join(" · "),
    expectedDataset: datasets.map((item) => item.id),
    actualDataStatus: status,
    expectedFields: fields,
    valueFields: valueFields(fields),
    categoryFields: categoryFields(fields),
    timeFields: timeFields(fields),
    technologyFields: technologyFields(fields),
    financialFields: financialFields(fields, presentation?.template),
    geographicFields: geographicFields(actualResolution, fields),
    actualSpatialResolution: actualResolution,
    expectedSpatialResolution,
    regionalizationPriority:
      decision?.regionalizationPriority ??
      (presentation?.regionalDataPreferred ? "medium" : "low"),
    timeResolution: fields.some((field) => field === "year")
      ? "연도"
      : fields.some((field) => /date|period/i.test(field))
      ? "자료별 날짜·기간"
      : "해당 없음",
    dataShape: shape,
    mapPossible: surface !== "detail-only",
    displaySurface: surface,
    recommendedMapUse: recommendedMapUse(
      surface,
      shape,
      expectedSpatialResolution
    ),
    evidencePanelUse:
      surface === "evidence-panel"
        ? "선택 국가·지역의 정책·사업·재원 근거를 목록과 원문 링크로 제공"
        : "지도 선택 결과와 함께 필요한 세부 근거만 제공",
    requiredTransformations: transformations(shape),
    prohibitedTransformations: [...ALWAYS_PROHIBITED],
    actualDatasetIds: datasets.map((item) => item.id),
    actualFieldBasis: datasets.length
      ? "현재 플랫폼의 실제 Dataset renderer/API payload 계약 기준"
      : `예정 출처(${search.source})와 상세 유형(${
          presentation?.template ?? "미정"
        }) 기준 수집 계약`,
  };
}

export const DATA_DISPLAY_CONTRACTS_V118: DataDisplayContractV118[] =
  AUTHORITATIVE_ELEMENT_SEARCH_V75.map((item) => buildContract(item.elementId));

export const DATA_DISPLAY_CONTRACT_INDEX_V118 = new Map(
  DATA_DISPLAY_CONTRACTS_V118.map((item) => [item.elementId, item] as const)
);

export const DATA_DISPLAY_CONTRACT_SUMMARY_V118 = {
  total: DATA_DISPLAY_CONTRACTS_V118.length,
  available: DATA_DISPLAY_CONTRACTS_V118.filter(
    (item) => item.actualDataStatus === "available"
  ).length,
  partial: DATA_DISPLAY_CONTRACTS_V118.filter(
    (item) => item.actualDataStatus === "partially-available"
  ).length,
  planned: DATA_DISPLAY_CONTRACTS_V118.filter(
    (item) => item.actualDataStatus === "planned"
  ).length,
  country: DATA_DISPLAY_CONTRACTS_V118.filter(
    (item) => item.actualSpatialResolution === "country"
  ).length,
  admin1: DATA_DISPLAY_CONTRACTS_V118.filter(
    (item) => item.actualSpatialResolution === "admin1"
  ).length,
  admin2: DATA_DISPLAY_CONTRACTS_V118.filter(
    (item) => item.actualSpatialResolution === "admin2"
  ).length,
  facility: DATA_DISPLAY_CONTRACTS_V118.filter(
    (item) => item.actualSpatialResolution === "facility"
  ).length,
  gridRaster: DATA_DISPLAY_CONTRACTS_V118.filter((item) =>
    ["grid"].includes(item.actualSpatialResolution)
  ).length,
  nonSpatial: DATA_DISPLAY_CONTRACTS_V118.filter(
    (item) => item.actualSpatialResolution === "non-spatial"
  ).length,
  displaySurfaces: {
    mapPrimary: DATA_DISPLAY_CONTRACTS_V118.filter(
      (item) => item.displaySurface === "map-primary"
    ).length,
    mapOverlay: DATA_DISPLAY_CONTRACTS_V118.filter(
      (item) => item.displaySurface === "map-overlay"
    ).length,
    mapFilter: DATA_DISPLAY_CONTRACTS_V118.filter(
      (item) => item.displaySurface === "map-filter"
    ).length,
    evidencePanel: DATA_DISPLAY_CONTRACTS_V118.filter(
      (item) => item.displaySurface === "evidence-panel"
    ).length,
    detailOnly: DATA_DISPLAY_CONTRACTS_V118.filter(
      (item) => item.displaySurface === "detail-only"
    ).length,
  },
} as const;

export function getActualDatasetsForContractV118(elementId: string): Dataset[] {
  return PUBLIC_DATASETS.filter(
    (dataset) => getAuthoritativeElementIdV88(dataset) === elementId
  );
}
