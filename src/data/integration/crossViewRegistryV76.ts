export type MapUsageV76 =
  | "country_choropleth"
  | "country_symbol"
  | "point"
  | "line"
  | "polygon"
  | "raster"
  | "none";

export type CompareUsageV76 =
  | "latest_value"
  | "trend"
  | "categorical"
  | "portfolio"
  | "none";

export type InsightRoleV76 =
  | "country_context"
  | "demand"
  | "technology_condition"
  | "policy"
  | "permitting"
  | "finance"
  | "project"
  | "organization"
  | "location"
  | "none";

export interface CrossViewDatasetSpecV76 {
  datasetId: string;
  elementId: string;
  indicatorId?: string;
  mapUsage: MapUsageV76;
  compareUsage: CompareUsageV76;
  insightRole: InsightRoleV76;
  mapCompatibility: "base_only" | "overlay" | "reference" | "not_applicable";
  noteKo: string;
}

export const CROSS_VIEW_DATASETS_V76: CrossViewDatasetSpecV76[] = [
  [
    "LDC-DS-A-001",
    "A-007",
    "population-total",
    "country_context",
    "인구규모 맥락",
  ],
  [
    "LDC-DS-A-007-URBAN",
    "A-007",
    "urbanization-share",
    "country_context",
    "도시화 맥락",
  ],
  [
    "LDC-DS-A-007-GROWTH",
    "A-007",
    "population-growth",
    "country_context",
    "인구변화 맥락",
  ],
  [
    "LDC-DS-A-003-GDP",
    "A-003",
    "gdp-current",
    "country_context",
    "경제규모 맥락",
  ],
  [
    "LDC-DS-A-003-GROWTH",
    "A-003",
    "gdp-growth",
    "country_context",
    "거시경제 변화",
  ],
  [
    "LDC-DS-A-003-PC",
    "A-003",
    "gdp-per-capita",
    "country_context",
    "평균 경제수준",
  ],
  [
    "LDC-DS-D-001",
    "A-021",
    "electricity-access",
    "technology_condition",
    "전력 접근여건",
  ],
  [
    "LDC-DS-D-004",
    "A-020",
    "renewable-electricity-share",
    "technology_condition",
    "에너지전환 현황",
  ],
  [
    "LDC-DS-D-005",
    "A-019",
    "grid-losses",
    "technology_condition",
    "전력망 효율",
  ],
].map(([datasetId, elementId, indicatorId, insightRole, noteKo]) => ({
  datasetId,
  elementId,
  indicatorId,
  mapUsage: "country_choropleth" as const,
  compareUsage: "trend" as const,
  insightRole: insightRole as InsightRoleV76,
  mapCompatibility: "base_only" as const,
  noteKo,
}));

CROSS_VIEW_DATASETS_V76.push(
  {
    datasetId: "LDC-DS-C-001",
    elementId: "C-001",
    mapUsage: "country_symbol",
    compareUsage: "categorical",
    insightRole: "policy",
    mapCompatibility: "overlay",
    noteKo:
      "10개국 최신 활성 NDC 메타데이터 · 기술별 원문근거는 검토완료 국가만 제공",
  },
  {
    datasetId: "LDC-DS-E-002",
    elementId: "D-023",
    mapUsage: "country_symbol",
    compareUsage: "portfolio",
    insightRole: "finance",
    mapCompatibility: "overlay",
    noteKo: "GCF 국가 포트폴리오 overlay",
  },
  {
    datasetId: "LDC-PILOT-D-020-GCF-PROJECTS",
    elementId: "D-020",
    mapUsage: "country_symbol",
    compareUsage: "portfolio",
    insightRole: "project",
    mapCompatibility: "overlay",
    noteKo:
      "우선 10개국 실제 프로젝트 레코드 연결 · 공식 좌표 확보 전에는 국가 symbol/목록으로 사용 · 좌표 확인 후에만 point layer로 승격",
  }
);

export function getCrossViewSpecV76(
  datasetId: string
): CrossViewDatasetSpecV76 | undefined {
  return CROSS_VIEW_DATASETS_V76.find((item) => item.datasetId === datasetId);
}
