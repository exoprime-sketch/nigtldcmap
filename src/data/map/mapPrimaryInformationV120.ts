import { getContractsByCategoryV120 } from "./mapCategoryDataContractsV120";

export type MapPrimaryInformationV120 = {
  id: string;
  label: string;
  description: string;
  presetId: string;
  sourceDatasetIds: string[];
  elementIds: string[];
  defaultPrimaryLayer?: string;
  defaultOverlays: string[];
  availableFilters: string[];
  panelSections: string[];
  actualDataOnly: boolean;
};

export const MAP_PRIMARY_INFORMATION_V120: MapPrimaryInformationV120[] = [
  {
    id: "cooperation-overview",
    label: "협력 현황",
    description:
      "선택 국가의 기술수요, 정책, 기존 지원과 재원 근거를 요약합니다.",
    presetId: "core",
    sourceDatasetIds: [
      "tna-tap",
      "ctcn-ta",
      "gcf-projects",
      "adaptation-fund",
      "gef-projects",
      "world-bank-projects",
      "adb-projects",
      "oecd-oda",
    ],
    elementIds: ["C-005", "D-018", "D-019", "D-021", "D-023", "D-011"],
    defaultPrimaryLayer: "A-019",
    defaultOverlays: ["C-005", "D-019", "D-023"],
    availableFilters: [
      "country",
      "technology",
      "mitigation_adaptation",
      "institution",
      "project_status",
      "year",
    ],
    panelSections: [
      "technologyDemand",
      "policy",
      "technicalAssistance",
      "climateFinance",
      "mdb",
      "oda",
    ],
    actualDataOnly: true,
  },
  {
    id: "technology-demand",
    label: "기술수요",
    description: "공식 TNA/TAP 우선기술과 최신 정책 확인현황을 살펴봅니다.",
    presetId: "technology-demand",
    sourceDatasetIds: ["tna-tap", "ctcn-ta"],
    elementIds: ["C-005", "D-019"],
    defaultOverlays: ["C-005"],
    availableFilters: [
      "country",
      "technology",
      "mitigation_adaptation",
      "sector",
      "policy_currentness",
    ],
    panelSections: [
      "technologyDemand",
      "barriers",
      "projectIdeas",
      "policy",
      "technicalAssistance",
    ],
    actualDataOnly: true,
  },
  {
    id: "policy",
    label: "정책·제도",
    description:
      "NDC·NAP·BTR 등 공식 정책문서와 기술·부문별 근거를 확인합니다.",
    presetId: "policy",
    sourceDatasetIds: ["policy-documents", "tna-tap"],
    elementIds: [],
    defaultOverlays: [],
    availableFilters: [
      "country",
      "document_type",
      "sector",
      "technology",
      "mitigation_adaptation",
    ],
    panelSections: ["policyMatrix", "sourceEvidence"],
    actualDataOnly: true,
  },
  {
    id: "international-projects",
    label: "국제사업·재원",
    description: "CTCN·GCF·AF·GEF·World Bank·ADB 사업을 기관별로 확인합니다.",
    presetId: "projects-finance",
    sourceDatasetIds: [
      "ctcn-ta",
      "gcf-projects",
      "adaptation-fund",
      "gef-projects",
      "world-bank-projects",
      "adb-projects",
    ],
    elementIds: ["D-018", "D-019", "D-021", "D-023"],
    defaultOverlays: ["D-019", "D-023", "D-021"],
    availableFilters: [
      "country",
      "institution",
      "project_status",
      "sector",
      "technology",
      "year",
    ],
    panelSections: [
      "projectPortfolio",
      "financialMetrics",
      "implementingEntities",
      "sourceLinks",
    ],
    actualDataOnly: true,
  },
  {
    id: "oda",
    label: "ODA·공여환경",
    description:
      "실제지출과 약정, 주요 공여기관과 분야 구성을 구분해 확인합니다.",
    presetId: "oda",
    sourceDatasetIds: ["oecd-oda"],
    elementIds: ["D-011"],
    defaultOverlays: [],
    availableFilters: [
      "country",
      "donor",
      "flow_type",
      "sector",
      "channel",
      "grant_loan",
      "year",
    ],
    panelSections: [
      "odaDisbursement",
      "odaCommitment",
      "donorComposition",
      "sectorComposition",
    ],
    actualDataOnly: true,
  },
  {
    id: "climate-risk",
    label: "기후위험·적응",
    description:
      "관측·전망, 기간과 공간단위를 구분해 기후위험과 적응사업을 확인합니다.",
    presetId: "climate-risk",
    sourceDatasetIds: ["climate-risk", "adaptation-fund", "gcf-projects"],
    elementIds: ["B-006", "D-018"],
    defaultPrimaryLayer: "B-006",
    defaultOverlays: ["D-018"],
    availableFilters: [
      "country",
      "spatial_unit",
      "variable",
      "observation_projection",
      "period",
      "scenario",
      "model",
      "season",
    ],
    panelSections: [
      "risk",
      "adaptationDemand",
      "adaptationProjects",
      "sourceMetadata",
    ],
    actualDataOnly: true,
  },
  {
    id: "energy-infrastructure",
    label: "에너지·인프라",
    description:
      "전력접근, 전력망 손실, 재생에너지와 실제 인프라 정보를 확인합니다.",
    presetId: "energy-infrastructure",
    sourceDatasetIds: ["world-bank-indicators"],
    elementIds: ["A-019"],
    defaultPrimaryLayer: "A-019",
    defaultOverlays: [],
    availableFilters: [
      "country",
      "indicator",
      "year",
      "facility_type",
      "project_status",
    ],
    panelSections: [
      "indicatorTrend",
      "infrastructure",
      "technologyDemand",
      "projects",
    ],
    actualDataOnly: true,
  },
  {
    id: "industry-market",
    label: "산업·시장",
    description:
      "시장·산업구조와 사업여건을 동일 단위와 실제 자료연도로 비교합니다.",
    presetId: "industry-market",
    sourceDatasetIds: ["world-bank-indicators"],
    elementIds: [],
    defaultOverlays: [],
    availableFilters: ["country", "indicator", "industry", "year"],
    panelSections: [
      "marketIndicators",
      "industryStructure",
      "technologyDemand",
      "projects",
    ],
    actualDataOnly: true,
  },
  {
    id: "technology-innovation",
    label: "기술·혁신",
    description:
      "특허·논문·R&D와 기관정보를 원자료 건수와 정규화 지표로 구분합니다.",
    presetId: "technology-innovation",
    sourceDatasetIds: ["innovation"],
    elementIds: [],
    defaultOverlays: [],
    availableFilters: [
      "country",
      "technology",
      "institution",
      "year",
      "metric",
    ],
    panelSections: [
      "innovationCounts",
      "institutions",
      "collaborationNetwork",
      "sources",
    ],
    actualDataOnly: true,
  },
  {
    id: "partners",
    label: "파트너·기관",
    description: "공식 지정기관, 시행기관과 관련 사업·기술 정보를 확인합니다.",
    presetId: "partners",
    sourceDatasetIds: ["partners"],
    elementIds: [],
    defaultOverlays: [],
    availableFilters: [
      "country",
      "organisation_type",
      "role",
      "technology",
      "project",
    ],
    panelSections: [
      "institutions",
      "roles",
      "projects",
      "technologyLinks",
      "contacts",
    ],
    actualDataOnly: true,
  },
];

export const getMapPrimaryInformationV120 = (id: string) =>
  MAP_PRIMARY_INFORMATION_V120.find((item) => item.id === id) ??
  MAP_PRIMARY_INFORMATION_V120[0];

export const getPrimaryInformationContractsV120 = (id: string) =>
  getContractsByCategoryV120(id);
