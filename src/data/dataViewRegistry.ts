import type { Dataset } from "../types/dataset";
import type {
  DataRepresentationType,
  DataViewTemplate,
  DataViewTemplateSpec,
  DatasetCapabilities,
} from "../types/dataView";

export const DATA_VIEW_TEMPLATE_LABELS: Record<DataViewTemplate, string> = {
  "indicator-summary": "지표 요약",
  "classification-assessment": "분류·판정",
  "evidence-document": "정책·근거 문서",
  "organization-directory": "기관 디렉터리",
  "project-portfolio": "사업·재원 포트폴리오",
  "spatial-layer": "공간 레이어",
  "permitting-process": "인허가 절차",
  "market-evidence": "사업환경",
  "technology-demand": "기술수요 근거",
  "generic-data": "일반 데이터",
};

export const DATA_VIEW_TEMPLATE_SPECS: DataViewTemplateSpec[] = [
  {
    id: "indicator-summary",
    label: DATA_VIEW_TEMPLATE_LABELS["indicator-summary"],
    summary: "수치·시계열을 값, 추세, 비교표와 지도에 연결",
    primaryTypes: ["numeric", "time_series"],
    detailPattern: "핵심값·단위·기준기간·추세·원자료 표",
    mapPattern: "국가·행정구역 코드가 있을 때 단계구분도",
    comparePattern: "동일 단위·동일 기간 기준 순위·추세 비교",
    insightPattern: "확인된 값·비교기준·해석상 유의사항",
  },
  {
    id: "classification-assessment",
    label: DATA_VIEW_TEMPLATE_LABELS["classification-assessment"],
    summary: "분류·등급·확인 결과를 판정기준과 근거 중심으로 표시",
    primaryTypes: ["categorical", "verification"],
    detailPattern: "등급·상태·판정기준·판정근거·검토상태",
    mapPattern: "국가·지역 단위의 이산형 범례",
    comparePattern: "국가×항목 또는 국가×기술 매트릭스",
    insightPattern: "확인된 상태·근거·추가 확인정보",
  },
  {
    id: "evidence-document",
    label: DATA_VIEW_TEMPLATE_LABELS["evidence-document"],
    summary: "정책·법령·NDC·TNA 원문과 한국어 의미를 함께 제공",
    primaryTypes: ["document", "verification", "text"],
    detailPattern: "문서정보·원문·한국어 의미·페이지·공식 링크",
    mapPattern: "지도 레이어 대신 선택 국가 정보 패널",
    comparePattern: "정책 항목별 확인 상태와 원문 근거 비교",
    insightPattern: "정책 정합성·직접 근거·검토범위",
  },
  {
    id: "organization-directory",
    label: DATA_VIEW_TEMPLATE_LABELS["organization-directory"],
    summary: "공식 자료에서 역할이 확인된 기관을 유형·기술·지역별 제공",
    primaryTypes: ["organization"],
    detailPattern: "기관명·유형·확인된 역할·관련 기술·근거",
    mapPattern: "검증된 사무소·시설 좌표가 있을 때만 표시",
    comparePattern: "기관유형·역할별 국가 간 목록 비교",
    insightPattern: "확인된 역할·관련 사업·협력 의향 추가 확인",
  },
  {
    id: "project-portfolio",
    label: DATA_VIEW_TEMPLATE_LABELS["project-portfolio"],
    summary: "사업·재원·시행기관·기술·지역을 포트폴리오로 연결",
    primaryTypes: ["project_finance", "organization", "geospatial"],
    detailPattern: "사업목록·상태·기관·기간·금액·기술·지역",
    mapPattern: "정확 좌표·행정구역·국가 수준을 구분하여 표시",
    comparePattern: "사업 수·재원·상태·기술분야 비교",
    insightPattern: "기존 지원·시행기관·후속 검토사항",
  },
  {
    id: "spatial-layer",
    label: DATA_VIEW_TEMPLATE_LABELS["spatial-layer"],
    summary: "점·선·면·래스터를 실제 위치·속성·정확도와 함께 제공",
    primaryTypes: ["geospatial", "numeric", "categorical"],
    detailPattern: "지도·범례·위치목록·속성표·공간 메타데이터",
    mapPattern: "점·선·면·래스터별 전용 지도 레이어",
    comparePattern: "국가별 요약값·병렬 지도·공간자료 보유현황",
    insightPattern: "확인된 지역·시설·좌표 정확도·정보공백",
  },
  {
    id: "permitting-process",
    label: DATA_VIEW_TEMPLATE_LABELS["permitting-process"],
    summary: "국가×기술×사업형태별 인허가 단계와 적용조건을 제공",
    primaryTypes: ["document", "verification", "organization", "text"],
    detailPattern: "절차흐름·적용조건·기관·기간·비용·법적근거",
    mapPattern: "지역별 차이가 공식적으로 확인된 경우에만 연결",
    comparePattern: "사업조건이 동일할 때 절차·기관·기간 병렬 비교",
    insightPattern: "필수·조건부·미확인 절차와 추가 확인조건",
  },
  {
    id: "market-evidence",
    label: DATA_VIEW_TEMPLATE_LABELS["market-evidence"],
    summary: "시장규모·가격·투자·수입 등 사업환경 자료를 결합",
    primaryTypes: ["numeric", "time_series", "text", "document"],
    detailPattern: "핵심시장값·추세·구성·조사근거·한계",
    mapPattern: "동일 정의의 지역별 값이 있을 때만 표시",
    comparePattern: "동일 통화·가격기준·기간으로 정규화 후 비교",
    insightPattern: "확인된 시장신호·적용범위·추가 조사사항",
  },
  {
    id: "technology-demand",
    label: DATA_VIEW_TEMPLATE_LABELS["technology-demand"],
    summary: "기업·시설·정책 근거에서 확인된 기후기술 수요를 구조화",
    primaryTypes: ["text", "verification", "organization", "document"],
    detailPattern: "수요항목·대상·기술·근거·상태·추가 확인사항",
    mapPattern: "확인된 시설·지역 정보가 있을 때만 연결",
    comparePattern: "동일 조사질문과 판정기준으로 병렬 비교",
    insightPattern: "확인된 수요·근거·수요기관·정보공백",
  },
  {
    id: "generic-data",
    label: DATA_VIEW_TEMPLATE_LABELS["generic-data"],
    summary: "전용 화면이 확정되지 않은 초기 자료의 안전한 기본 표시",
    primaryTypes: ["text"],
    detailPattern: "핵심 필드·출처·상태·원자료",
    mapPattern: "기본 미표시",
    comparePattern: "기본 미지원",
    insightPattern: "기본 미사용",
  },
];

export const DEFAULT_DATASET_CAPABILITIES: DatasetCapabilities = {
  explorer: true,
  detail: true,
  map: false,
  countryProfile: false,
  countryCompare: false,
  cooperationInsights: false,
  download: false,
};

export function resolveDatasetViewTemplate(dataset: Dataset): DataViewTemplate {
  if (dataset.viewTemplate) return dataset.viewTemplate;

  if (
    dataset.previewKind === "permitting-process" ||
    dataset.id.toLowerCase().includes("permitting") ||
    dataset.dataPayloadUrl?.toLowerCase().includes("permitting")
  ) {
    return "permitting-process";
  }

  if (dataset.previewKind === "gcf-portfolio") return "project-portfolio";

  if (
    dataset.previewKind === "policy-document" ||
    dataset.previewKind === "document"
  ) {
    return "evidence-document";
  }

  const types = getExplicitRepresentationTypes(dataset);
  const primaryType = dataset.primaryRepresentationType ?? types[0];

  if (primaryType === "organization") return "organization-directory";
  if (primaryType === "project_finance") return "project-portfolio";
  if (primaryType === "geospatial") return "spatial-layer";
  if (primaryType === "numeric" || primaryType === "time_series") {
    return "indicator-summary";
  }
  if (primaryType === "categorical" || primaryType === "verification") {
    return "classification-assessment";
  }
  if (primaryType === "document") return "evidence-document";
  if (primaryType === "text") return "technology-demand";

  return "generic-data";
}

export function resolveDatasetCapabilities(
  dataset: Dataset
): DatasetCapabilities {
  const types = getExplicitRepresentationTypes(dataset);
  const isSynthetic =
    Boolean(dataset.isSynthetic) ||
    dataset.sourceType === "synthetic_example" ||
    dataset.dataStatus === "synthetic_example" ||
    dataset.accessLevel === "example";
  const isReady =
    dataset.publicationStatus !== "preparing" &&
    dataset.publicationStatus !== "withdrawn" &&
    dataset.dataStatus !== "collection_planned" &&
    dataset.dataStatus !== "not_available";
  const hasCountryContext =
    dataset.geographicCoverage === "global" || dataset.countries.length > 0;
  const compareSupported = types.some((type) =>
    [
      "numeric",
      "time_series",
      "categorical",
      "verification",
      "project_finance",
    ].includes(type)
  );
  const insightSupported = types.some((type) =>
    [
      "numeric",
      "time_series",
      "categorical",
      "verification",
      "text",
      "document",
      "organization",
      "project_finance",
      "geospatial",
    ].includes(type)
  );

  const inferred: DatasetCapabilities = {
    explorer: dataset.publicationStatus !== "withdrawn",
    detail: dataset.publicationStatus !== "withdrawn",
    map: Boolean(dataset.gis && isReady && !isSynthetic),
    countryProfile: Boolean(hasCountryContext && isReady && !isSynthetic),
    countryCompare: Boolean(compareSupported && isReady && !isSynthetic),
    cooperationInsights: Boolean(
      insightSupported && hasCountryContext && isReady && !isSynthetic
    ),
    download: Boolean(
      dataset.downloadMode !== "none" &&
        dataset.rightsStatus !== "restricted" &&
        dataset.publicationStatus !== "preparing"
    ),
  };

  return {
    ...inferred,
    ...dataset.capabilities,
  };
}

function getExplicitRepresentationTypes(
  dataset: Dataset
): DataRepresentationType[] {
  if (dataset.representationTypes?.length) {
    return dataset.representationTypes;
  }

  if (dataset.primaryRepresentationType) {
    return [dataset.primaryRepresentationType];
  }

  if (dataset.indicatorId || dataset.previewKind === "indicator") {
    return ["numeric"];
  }

  if (dataset.previewKind === "gcf-portfolio") {
    return ["project_finance", "numeric"];
  }

  if (
    dataset.previewKind === "policy-document" ||
    dataset.previewKind === "document"
  ) {
    return ["document", "verification", "text"];
  }

  if (dataset.gis) return ["geospatial"];
  if (dataset.types.includes("문서")) return ["document"];

  return ["text"];
}
