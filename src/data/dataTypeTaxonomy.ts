import type {
  DataRepresentationType,
  Dataset,
  DatasetAccessLevel,
  DatasetDataStatus,
  DatasetSourceType,
} from "../types/dataset";

export interface DataRepresentationSpec {
  id: DataRepresentationType;
  label: string;
  definition: string;
  recommendedVisuals: string[];
  detailPage: string[];
  mapPage: string[];
  countryProfilePage: string[];
  comparePage: string[];
  insightPage: string[];
  downloadFormats: string[];
  requiredFields: string[];
}

export const DATA_REPRESENTATION_LABELS: Record<
  DataRepresentationType,
  string
> = {
  numeric: "수치",
  time_series: "시계열",
  categorical: "분류·등급",
  verification: "확인 결과",
  text: "조사 결과",
  document: "정책·문서",
  organization: "기관",
  project_finance: "사업·재원",
  geospatial: "지역·시설",
};

export const DATA_REPRESENTATION_ORDER: DataRepresentationType[] = [
  "numeric",
  "time_series",
  "categorical",
  "verification",
  "text",
  "document",
  "organization",
  "project_finance",
  "geospatial",
];

export const DATA_REPRESENTATION_SPECS: Record<
  DataRepresentationType,
  DataRepresentationSpec
> = {
  numeric: {
    id: "numeric",
    label: DATA_REPRESENTATION_LABELS.numeric,
    definition: "특정 국가·지역·기관·사업의 단일 값을 단위와 기준시점으로 제공",
    recommendedVisuals: ["핵심값 카드", "가로 막대", "단계구분도", "원자료 표"],
    detailPage: [
      "값·단위·대상·기준연도 상단 표시",
      "비교범위가 확인된 경우 국가 평균·우선 구축국 범위 제공",
      "자료 없음과 숫자 0 분리",
    ],
    mapPage: [
      "국가·행정구역 코드가 있고 동일 정의의 값일 때 단계구분도 제공",
      "단위·기준연도·출처를 범례와 함께 고정 표시",
    ],
    countryProfilePage: ["선택 국가의 최신값·기준연도·관련 데이터셋 연결"],
    comparePage: [
      "동일 단위·정의·기준기간일 때만 전체 국가 비교",
      "그래프와 전체 국가 표를 함께 제공",
    ],
    insightPage: [
      "확인된 값과 비교기준만 재사용",
      "사업성·유망성·인과관계 자동 판정 금지",
    ],
    downloadFormats: ["CSV", "JSON", "XLSX"],
    requiredFields: [
      "recordId",
      "countryIso3 또는 regionId",
      "value",
      "unit",
      "referencePeriod",
      "sourceUrl",
    ],
  },
  time_series: {
    id: "time_series",
    label: DATA_REPRESENTATION_LABELS.time_series,
    definition: "연도·월·분기 등 시간의 흐름에 따른 값과 결측구간을 제공",
    recommendedVisuals: ["선그래프", "기간 선택", "최신값 카드", "원자료 표"],
    detailPage: [
      "기간순 그래프와 원자료 표 동시 제공",
      "값 툴팁·Y축 눈금·결측구간 단절 표시",
      "출처·산정방법 변경시점을 주석으로 표시",
    ],
    mapPage: ["선택 연도 또는 기간의 값을 단계구분도로 제공"],
    countryProfilePage: ["선택 국가의 최근 추세와 최신 가용연도 제공"],
    comparePage: [
      "그래프는 선택국 중심으로 제한",
      "전체 국가는 동일 기준연도 표로 제공",
      "결측값 사이의 선 연결 금지",
    ],
    insightPage: [
      "3개 이상 시점이 있을 때 증가·감소·변화 제한적 표시",
      "변화 원인이나 정책효과 자동 단정 금지",
    ],
    downloadFormats: ["CSV", "JSON", "XLSX"],
    requiredFields: [
      "recordId",
      "countryIso3 또는 regionId",
      "period",
      "value",
      "unit",
      "sourceUrl",
    ],
  },
  categorical: {
    id: "categorical",
    label: DATA_REPRESENTATION_LABELS.categorical,
    definition: "정의된 기준에 따라 자료를 유형·단계·등급으로 분류",
    recommendedVisuals: [
      "등급 분포 막대",
      "상태 배지",
      "판정카드",
      "분류 매트릭스",
    ],
    detailPage: [
      "분류값·분류정의·판정기준·판정근거 제공",
      "등급별 항목 수와 개별 항목카드 제공",
      "미판정·자료 없음·적용 대상 아님 분리",
    ],
    mapPage: ["국가·지역 단위 분류일 때 이산형 색상 범례 제공"],
    countryProfilePage: ["선택 국가의 등급과 부족·미확인 항목 제공"],
    comparePage: [
      "숫자 순위 대신 국가×평가항목 매트릭스 제공",
      "등급별 국가 그룹과 판정기준 제공",
    ],
    insightPage: ["등급만 표시하지 않고 판정근거와 추가 확인항목 제공"],
    downloadFormats: ["CSV", "JSON"],
    requiredFields: [
      "recordId",
      "countryIso3",
      "categoryCode",
      "categoryDefinition",
      "reason",
      "referencePeriod",
      "sourceUrl",
    ],
  },
  verification: {
    id: "verification",
    label: DATA_REPRESENTATION_LABELS.verification,
    definition: "공식 원문에서 항목의 직접 명시·관련 내용·근거 미확인을 구분",
    recommendedVisuals: ["상태 배지", "원문 근거카드", "국가×기술 매트릭스"],
    detailPage: [
      "판정상태·판정정의·원문·한국어 의미·문서 위치 제공",
      "검토한 문서와 페이지 범위를 명시",
      "미확인을 미포함으로 표현하지 않음",
    ],
    mapPage: ["국가 단위 확인 상태를 이산형 범례로 제공 가능"],
    countryProfilePage: ["정책·수요·제도 항목별 확인 상태와 근거 연결"],
    comparePage: ["국가×기술 또는 국가×정책항목 확인 매트릭스 제공"],
    insightPage: ["점수화 없이 정책 정합성·수요 근거로 재사용"],
    downloadFormats: ["CSV", "JSON"],
    requiredFields: [
      "recordId",
      "countryIso3",
      "verificationStatus",
      "originalText",
      "translationKo",
      "documentTitle",
      "pageReference",
      "sourceUrl",
    ],
  },
  text: {
    id: "text",
    label: DATA_REPRESENTATION_LABELS.text,
    definition: "현지 수요·장벽·사업조건·조사결과를 구조화된 항목으로 제공",
    recommendedVisuals: [
      "핵심 확인카드",
      "공통 질문별 표",
      "근거·추가확인 분리",
    ],
    detailPage: [
      "조사항목·핵심내용·대상·근거·상태·추가 확인사항 제공",
      "장문 한 개보다 개별 조사 레코드로 분리",
      "사실과 해석을 별도 필드로 관리",
    ],
    mapPage: ["확인된 지역·시설이 연결된 경우 국가 패널 또는 위치 상세에 표시"],
    countryProfilePage: [
      "주요 확인내용을 주제별로 요약하고 상세 데이터셋 연결",
    ],
    comparePage: ["동일 조사질문과 판정기준이 적용된 경우에만 병렬 비교"],
    insightPage: [
      "실제 조사결과의 요약과 자료상태 재사용",
      "플랫폼 데이터에 없는 협력전략 문구 생성 금지",
    ],
    downloadFormats: ["CSV", "JSON", "XLSX"],
    requiredFields: [
      "recordId",
      "countryIso3",
      "technologyIds",
      "label",
      "content",
      "referencePeriod",
      "verificationStatus",
      "sourceUrl",
    ],
  },
  document: {
    id: "document",
    label: DATA_REPRESENTATION_LABELS.document,
    definition: "법령·정책·NDC·TNA·보고서·공시의 메타데이터와 검증 근거를 제공",
    recommendedVisuals: [
      "문서정보 카드",
      "원문·한국어 의미 병렬",
      "페이지 근거",
    ],
    detailPage: [
      "문서명·버전·발행기관·발행일·언어·적용기간 제공",
      "원문 발췌·한국어 의미·페이지·절 제공",
      "재배포 권리가 없으면 공식 원문 링크 중심 제공",
    ],
    mapPage: ["지도 레이어 대신 선택 국가 정보 패널에서 관련 문서 제공"],
    countryProfilePage: ["최신 핵심 정책문서를 유형별로 정리"],
    comparePage: ["문서 수가 아니라 정책 항목별 확인 상태와 근거 비교"],
    insightPage: ["정책·제도·수요 판단의 공식 근거로 연결"],
    downloadFormats: ["메타데이터 CSV", "JSON", "공식 원문 링크"],
    requiredFields: [
      "recordId",
      "countryIso3",
      "documentTitle",
      "documentType",
      "issuingOrganization",
      "publishedAt",
      "pageReference",
      "sourceUrl",
    ],
  },
  organization: {
    id: "organization",
    label: DATA_REPRESENTATION_LABELS.organization,
    definition:
      "정부·공기업·기업·연구기관·금융기관의 공식적으로 확인된 역할을 제공",
    recommendedVisuals: ["역할별 기관카드", "기관유형 필터", "관련 사업 연결"],
    detailPage: [
      "기관명·현지어명·기관유형·국가·지역·확인된 역할 제공",
      "관련 기술·사업·역할 근거·기관 웹사이트 연결",
      "협력 의향과 추천 여부를 자동 판단하지 않음",
    ],
    mapPage: ["검증된 사무소·시설 좌표가 있을 때만 마커 제공"],
    countryProfilePage: ["정책·승인·수요·금융·연구·민간 역할별 그룹화"],
    comparePage: ["기관 수 순위보다 기관유형·역할별 목록 비교"],
    insightPage: [
      "선택 국가·기술과 직접 연결된 기관만 제공",
      "확인된 역할·관련 사업·협력 의향 추가 확인을 구분",
    ],
    downloadFormats: ["CSV", "JSON"],
    requiredFields: [
      "recordId",
      "countryIso3",
      "name",
      "organizationType",
      "confirmedRole",
      "technologyIds",
      "verificationStatus",
      "sourceUrl",
    ],
  },
  project_finance: {
    id: "project_finance",
    label: DATA_REPRESENTATION_LABELS.project_finance,
    definition:
      "기후기술 사업·프로젝트·재원·투자·지원정보를 기관과 지역에 연결",
    recommendedVisuals: [
      "포트폴리오 요약",
      "사업카드",
      "재원 막대",
      "사업 위치 지도",
    ],
    detailPage: [
      "사업명·번호·기술·상태·기관·기간·금액·지역 제공",
      "기술·상태·재원기관·시행기관·승인연도 필터 제공",
      "다국가 사업은 전체 금액과 국가 배분액을 구분",
    ],
    mapPage: [
      "정확 좌표는 포인트",
      "행정구역만 확인되면 행정구역 집계",
      "국가만 확인되면 국가 단위 집계",
    ],
    countryProfilePage: [
      "선택 국가의 관련 사업·상태·재원·기관 포트폴리오 제공",
    ],
    comparePage: ["사업 수·재원·상태·기술분야를 동일 기준으로 비교"],
    insightPage: [
      "기존 지원·시행기관·기술분야·후속 검토사항 제공",
      "사업 수를 시장포화·유망성으로 자동 해석하지 않음",
    ],
    downloadFormats: ["CSV", "JSON", "XLSX"],
    requiredFields: [
      "recordId",
      "countryIso3",
      "title",
      "projectStatus",
      "technologyIds",
      "fundingOrganization",
      "implementingOrganization",
      "amount",
      "currency",
      "sourceUrl",
    ],
  },
  geospatial: {
    id: "geospatial",
    label: DATA_REPRESENTATION_LABELS.geospatial,
    definition:
      "좌표·행정구역·시설·노선·사업구역·래스터 등 실제 공간정보를 제공",
    recommendedVisuals: [
      "실제 지도",
      "범례",
      "위치목록",
      "속성표",
      "전체 화면",
    ],
    detailPage: [
      "점·선·면·래스터에 맞는 실제 지도 제공",
      "좌표계·공간해상도·위치정확도·기준시점 제공",
      "지도와 위치목록·속성표를 양방향 연결",
    ],
    mapPage: [
      "검증된 좌표·도형만 표시",
      "좌표가 없는 기관·사업을 수도에 임의 배치하지 않음",
    ],
    countryProfilePage: ["선택 국가의 확인된 지역·시설·공간 레이어 연결"],
    comparePage: ["국가별 요약값·병렬 지도·공간자료 보유현황 제공"],
    insightPage: ["확인된 지역·시설·좌표 정확도·공간정보 공백 제공"],
    downloadFormats: ["GeoJSON", "GeoPackage", "CSV 좌표", "COG GeoTIFF"],
    requiredFields: [
      "recordId",
      "countryIso3 또는 regionId",
      "geometryType",
      "geometry 또는 latitude·longitude",
      "locationAccuracy",
      "referencePeriod",
      "sourceUrl",
    ],
  },
};

export const DATA_SOURCE_TYPE_LABELS: Record<DatasetSourceType, string> = {
  official_public: "정부·공공 공개자료",
  official_document: "공식 문서",
  international_organization: "국제기구 공개자료",
  local_research: "현지조사 자료",
  private_source: "비공개·제한 자료",
  synthetic_example: "화면 구현용 예시",
};

export const DATA_STATUS_LABELS: Record<DatasetDataStatus, string> = {
  available: "이용 가능",
  partial: "일부 확보",
  not_available: "자료 없음",
  under_review: "검토 중",
  collection_planned: "수집 예정",
  synthetic_example: "예시 데이터",
};

export const ACCESS_LEVEL_LABELS: Record<DatasetAccessLevel, string> = {
  public: "공개",
  restricted: "제한 공개",
  internal: "내부",
  example: "예시",
};

export function getDatasetRepresentationTypes(
  dataset: Dataset
): DataRepresentationType[] {
  if (dataset.representationTypes?.length) {
    return dataset.representationTypes;
  }

  const inferred = new Set<DataRepresentationType>();

  if (dataset.primaryRepresentationType) {
    inferred.add(dataset.primaryRepresentationType);
  }

  if (dataset.indicatorId || dataset.previewKind === "indicator") {
    inferred.add("numeric");
  }

  if (
    dataset.period.includes("최근") ||
    dataset.period.includes("연도별") ||
    dataset.variables.some((item) => /월별|연도별|시계열/.test(item))
  ) {
    inferred.add("time_series");
  }

  if (dataset.previewKind === "gcf-portfolio") {
    inferred.add("project_finance");
    inferred.add("numeric");
  }

  if (
    dataset.previewKind === "policy-document" ||
    dataset.previewKind === "document"
  ) {
    inferred.add("document");
  }

  if (dataset.previewKind === "policy-document") {
    inferred.add("verification");
    inferred.add("text");
  }

  if (dataset.types.includes("문서")) {
    inferred.add("document");
  }

  if (
    dataset.types.includes("벡터") ||
    dataset.types.includes("래스터") ||
    dataset.previewKind === "map" ||
    dataset.previewKind === "local-geospatial"
  ) {
    inferred.add("geospatial");
  }

  if (
    dataset.variables.some((item) =>
      /기관|기업|파트너|담당기관|시행기관|수요기관|발주기관/.test(item)
    )
  ) {
    inferred.add("organization");
  }

  if (
    dataset.variables.some((item) =>
      /사업명|프로젝트|사업금액|예산|재원|투자|지원기관|사업기간/.test(item)
    )
  ) {
    inferred.add("project_finance");
  }

  if (
    dataset.unit.includes("등급") ||
    dataset.unit.includes("분류") ||
    dataset.variables.some((item) => /등급|분류/.test(item))
  ) {
    inferred.add("categorical");
  }

  if (
    dataset.variables.some((item) =>
      /확인 상태|검토 상태|확인 여부|검증 상태|명시 여부/.test(item)
    )
  ) {
    inferred.add("verification");
  }

  if (inferred.size === 0) {
    inferred.add("text");
  }

  return Array.from(inferred);
}

export function getDatasetSourceType(dataset: Dataset): DatasetSourceType {
  if (dataset.sourceType) return dataset.sourceType;
  if (dataset.isSynthetic) return "synthetic_example";
  if (dataset.rightsStatus === "restricted") return "private_source";
  if (
    dataset.previewKind === "policy-document" ||
    dataset.types.includes("문서")
  ) {
    return "official_document";
  }
  if (
    /World Bank|Green Climate Fund|UNFCCC|ESMAP|Solargis|Natural Earth/i.test(
      dataset.sourceOrganization
    )
  ) {
    return "international_organization";
  }
  return "official_public";
}

export function getDatasetDataStatus(dataset: Dataset): DatasetDataStatus {
  if (dataset.dataStatus) return dataset.dataStatus;
  if (dataset.isSynthetic) return "synthetic_example";
  if (dataset.publicationStatus === "preparing") return "collection_planned";
  if (dataset.publicationStatus === "restricted") return "partial";
  if (dataset.quality === "검토중") return "under_review";
  return "available";
}

export function getDatasetAccessLevel(dataset: Dataset): DatasetAccessLevel {
  if (dataset.accessLevel) return dataset.accessLevel;
  if (dataset.isSynthetic) return "example";
  if (dataset.rightsStatus === "restricted") return "restricted";
  return "public";
}
