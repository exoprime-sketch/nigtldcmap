import type { PublicAnalyticalRendererV126 } from "./publicVisualizationRegistryV126";

type PublicElementCopyV126 = {
  title: string;
  description: string;
};

const ELEMENT_COPY_V126: Record<string, PublicElementCopyV126> = {
  "A-001": {
    title: "부패인식지수와 장기 추이",
    description: "베트남의 부패인식지수 점수와 순위가 장기간 어떻게 변했는지 확인할 수 있습니다.",
  },
  "A-002": {
    title: "정책·제도 역량(CPIA)",
    description:
      "베트남의 경제관리, 구조정책, 사회적 포용, 공공부문 관리 역량과 장기 변화를 확인할 수 있습니다",
  },
  "A-003": {
    title: "경제 규모와 성장 추이",
    description: "GDP, GNI, 1인당 지표를 단위별로 나누어 장기 변화를 비교할 수 있습니다.",
  },
  "A-005": {
    title: "산업구조와 구성 변화",
    description: "산업별 부가가치 비중과 연도별 구성 변화를 확인할 수 있습니다.",
  },
  "A-010": {
    title: "온실가스별 배출량",
    description: "가스별 배출량과 전체 배출구성의 변화를 확인할 수 있습니다.",
  },
  "A-011": {
    title: "부문별 온실가스 배출량",
    description: "에너지·산업·농업·토지·폐기물 부문의 배출구성 변화를 확인할 수 있습니다.",
  },
  "A-017": {
    title: "기술별 균등화발전비용",
    description: "발전기술별 비용 수준을 동일 단위에서 비교할 수 있습니다.",
  },
  "A-018": {
    title: "발전설비 구성 변화",
    description: "발전기술별 설비용량과 구성비가 연도별로 어떻게 변했는지 확인할 수 있습니다.",
  },
  "B-033": {
    title: "연간 산림손실",
    description: "연도별 산림손실 추이와 성·시별 공간 분포를 함께 확인할 수 있습니다.",
  },
  "B-034": {
    title: "산림 탄소지표",
    description: "탄소 측정항목을 선택해 성·시별 값과 지역 차이를 비교할 수 있습니다.",
  },
  "C-016": {
    title: "재생에너지 지역계획",
    description: "기술과 기간을 선택해 실제 계획값이 있는 지역을 확인할 수 있습니다.",
  },
  "C-019": {
    title: "탄소시장 정책",
    description: "탄소시장 제도와 정책 변화의 주요 시점을 시간 순서로 확인할 수 있습니다.",
  },
  "D-005": {
    title: "기후예산의 적응·감축 배분",
    description:
      "예산 범위와 보고서 기준을 구분해 적응·감축·동시기여 지출 비율을 확인할 수 있습니다.",
  },
  "E-007": {
    title: "MRV 운영 현황과 근거",
    description: "측정·보고·검증 체계의 운영 상태와 공개 근거를 항목별로 확인할 수 있습니다.",
  },
  "E-008": {
    title: "연구·특허 성과",
    description: "연구와 특허 성과의 추이와 기술 분야별 구성을 확인할 수 있습니다.",
  },
  "E-012": {
    title: "직군별 종사자 수·임금",
    description: "직군과 성별에 따른 고용 규모, 구성비, 여성 비중과 임금 차이를 확인할 수 있습니다.",
  },
  "E-018": {
    title: "기업 진출 포트폴리오",
    description: "진출 기업과 사업 분야, 진행 상태를 포트폴리오 형태로 탐색할 수 있습니다.",
  },
  "E-019": {
    title: "한국기관 현지 사무소",
    description: "베트남 현지 한국기관의 사무소와 공개 연락처를 확인할 수 있습니다.",
  },
  "E-020": {
    title: "기업 지원 프로그램",
    description: "이용 가능한 지원 프로그램을 기관, 지원유형과 대상에 따라 탐색할 수 있습니다.",
  },
};

const RENDERER_TITLES_V126: Record<PublicAnalyticalRendererV126, string> = {
  "score-trend": "점수와 장기 추이",
  "kpi-trend": "핵심지표와 장기 추이",
  "multi-metric-trend": "복수 지표 추이",
  "composition-trend": "구성과 변화",
  "stacked-emissions": "배출량 구성과 변화",
  "technology-comparison": "기술·분류 비교",
  "scenario-comparison": "시나리오 비교",
  seasonality: "시기별 변화",
  "policy-timeline": "정책 변화",
  "portfolio-dashboard": "사업 포트폴리오",
  directory: "기관·연락망",
  "evidence-matrix": "현황과 공개 근거",
  "capability-scorecard": "역량 현황",
  "spatial-analysis": "지역별 현황",
  "structured-table": "항목별 현황",
  "status-only": "데이터 제공 현황",
};

const CPIA_LABELS_V126: Record<string, string> = {
  "A-002_cpia_irai_overall": "IRAI 종합",
  "A-002_cpia_economic_management": "경제관리",
  "A-002_cpia_structural_policies": "구조정책",
  "A-002_cpia_social_inclusion": "사회적 포용",
  "A-002_cpia_public_sector": "공공부문 관리",
  "A-002_cpia_macr": "통화·환율 정책",
  "A-002_cpia_fisp": "재정 정책",
  "A-002_cpia_debt": "부채 정책·관리",
  "A-002_cpia_trad": "무역",
  "A-002_cpia_fins": "금융부문",
  "A-002_cpia_breg": "기업규제 환경",
  "A-002_cpia_gndr": "성평등",
  "A-002_cpia_equi": "공공재원 배분의 형평성",
  "A-002_cpia_pres": "공공재원 배분의 형평성",
  "A-002_cpia_hres": "인적자원 형성",
  "A-002_cpia_prot": "사회보호·노동",
  "A-002_cpia_envr": "환경지속가능성 정책",
  "A-002_cpia_prop": "재산권과 규칙 기반 거버넌스",
  "A-002_cpia_revn": "세입동원 효율성",
  "A-002_cpia_finq": "예산·재정관리의 질",
  "A-002_cpia_padm": "공공행정의 질",
  "A-002_cpia_tran": "공공부문 투명성·책임성·부패",
};

const PUBLIC_FORBIDDEN_COPY_V126 =
  /\.xlsx|SDMX\s*flat|INDICATOR=|COMP_BREAKDOWN|REF_AREA=|sourceFile|sourceSheet|sourceRow|recordId|indicatorId|apiParams|packUrl|shardId|sha256|publicationDecisionId|MultiLineString|MapLibre|technical provenance/iu;

export function publicElementCopyV126(
  elementId: string,
  renderer: PublicAnalyticalRendererV126
): PublicElementCopyV126 {
  return (
    ELEMENT_COPY_V126[elementId] ||
    (renderer === "status-only"
      ? {
          title: RENDERER_TITLES_V126[renderer],
          description:
            "현재 공개된 실제 값이 없어 자료 확보 또는 입력 진행 상태를 안내합니다.",
        }
      : {
          title: RENDERER_TITLES_V126[renderer],
          description:
            "공개된 측정값과 분류를 선택해 시점별 변화와 항목 간 차이를 확인할 수 있습니다.",
        })
  );
}

export function publicCpiaLabelV126(
  indicatorId: string,
  fallback: string
): string {
  return CPIA_LABELS_V126[indicatorId] || publicMeasureLabelV126(fallback);
}

export function publicMeasureLabelV126(labelValue: string): string {
  const label = labelValue
    .replace(/^CPIA\s+[A-D]\.\s*/iu, "")
    .replace(/\s*\u00b7\s*베트남(?:\s*[—–-].*)?$/u, "")
    .replace(/\s*[—–]\s*1\(낮음\)~6\(높음\).*$/u, "")
    .replace(/\s+클러스터\s*평균$/u, "")
    .trim();
  return label || "측정항목";
}

export function publicDimensionLabelV126(
  keyValue: string,
  labelValue?: string
): string {
  const key = keyValue.trim().toLocaleLowerCase("en-US");
  const labels: Record<string, string> = {
    category: "분류",
    city: "도시",
    cluster: "부문",
    country: "국가",
    entitytype: "자료 유형",
    gas: "온실가스",
    industry: "산업",
    measure: "측정항목",
    occupation: "직군",
    organization: "기관",
    organizationtype: "기관 유형",
    period: "기간",
    programtype: "프로그램 유형",
    province: "성·시",
    region: "지역",
    regionname: "지역",
    scenario: "시나리오",
    sector: "부문",
    sex: "성별",
    status: "상태",
    supporttype: "지원 유형",
    target: "지원 대상",
    targetgroup: "지원 대상",
    technology: "기술",
    year: "연도",
  };
  const mapped = labels[key.replace(/[_\s-]/g, "")];
  if (mapped) return mapped;

  const label = publicCopyOrEmptyV126(labelValue);
  if (label && !/^[a-z][a-z0-9_\s-]*$/iu.test(label)) return label;
  return label ? label.replace(/[_-]+/g, " ") : "분류";
}

export function publicCopyOrEmptyV126(value: unknown): string {
  if (typeof value !== "string") return "";
  const copy = value.trim();
  if (!copy || PUBLIC_FORBIDDEN_COPY_V126.test(copy)) return "";
  return copy;
}
